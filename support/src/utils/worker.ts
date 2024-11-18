import OnlineUserModel from "@one.chat/shared/dist/models/onlineUser";
import DistributionModel from "@one.chat/shared/dist/models/distribution";
import PendingAssignModel from "@one.chat/shared/dist/models/pendingAssign";
import ManagerModel from "@one.chat/shared/dist/models/managers";
import { Redis } from "ioredis";
import { MAX_CONVERSATION_PER_AGENT } from "@one.chat/shared/dist/config/config";
import { IPendingAssign } from "@one.chat/shared/dist/models/interfaces/pendingAssign";
import MessageSupportRepository from "../repositories/messageSupportRepository";
import { RedisManager } from "@one.chat/shared/dist/setup/redis";
import EventAction from "@one.chat/shared/dist/utils/EventAction";

class DistributionWorker {
  async handleConnection(instance: Redis) {
    try {
      while (true) {
        const result = await instance.blpop("users:connect:support", 0);
        if (result) {
          const [queue, message] = result;
          const connectedUser = JSON.parse(message);

          const matchingManager = await ManagerModel.findOne({
            managers: {
              $elemMatch: {
                id: connectedUser.userId,
                role: "agent",
              },
            },
          });
          if (matchingManager) {
            let distribution;

            distribution = await DistributionModel.findOne({
              userId: connectedUser.userId,
            });
            if (!distribution) {
              distribution = await DistributionModel.create({
                userId: connectedUser.userId,
                assigns: [],
              });
            }

            const conversationsToBeAdded =
              MAX_CONVERSATION_PER_AGENT - distribution.totalAssigns;
            const pendingAssign: IPendingAssign[] =
              await PendingAssignModel.aggregate([
                {
                  $match: { participantId: matchingManager.userId },
                },
                {
                  $project: {
                    conversations: {
                      $slice: ["$conversations", conversationsToBeAdded],
                    },
                  },
                },
              ]);
            if (pendingAssign.length !== 0) {
              const assigns = pendingAssign[0].conversations.map(
                (conversation) => {
                  return {
                    conversationId: conversation.id,
                    openTime: new Date(),
                    startTime: conversation.startTime,
                    closeTime: null,
                    transferTo: null,
                  };
                }
              );

              await PendingAssignModel.updateOne(
                { participantId: matchingManager.userId },
                {
                  $pull: {
                    conversations: {
                      id: {
                        $in: assigns.map(
                          (conversation) => conversation.conversationId
                        ),
                      },
                    },
                  },
                }
              );

              const updatedDistributions =
                await DistributionModel.findOneAndUpdate(
                  {
                    userId: connectedUser.userId,
                  },
                  {
                    $push: {
                      assigns: {
                        $each: assigns,
                      },
                    },
                    $inc: {
                      totalAssigns: assigns.length,
                    },
                  },
                  {
                    new: true,
                  }
                );

              (await RedisManager.getClient("general")).publish(
                "distribution:outgoing",
                EventAction("distributed", connectedUser.userId, assigns, [
                  updatedDistributions,
                ])
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  async handleDisconnection(instance: Redis) {
    try {
      while (true) {
        const result = await instance.blpop("users:disconnect:support", 0);
        if (result) {
          const [queue, message] = result;
          const disconnectedUser = JSON.parse(message);
          const disconnectTime = new Date(disconnectedUser.disconnectTime);
          let timeDifference = new Date().getTime() - disconnectTime.getTime();

          while (timeDifference < 5 * 60 * 1000) {
            timeDifference = new Date().getTime() - disconnectTime.getTime();
          }

          const onlineUser = await OnlineUserModel.findOne({
            userId: disconnectedUser.userId,
          });
          if (onlineUser?.lastOnlineTime !== null) {
            const matchingManager = await ManagerModel.findOne({
              managers: {
                $elemMatch: {
                  id: disconnectedUser.userId,
                },
              },
            });
            if (!matchingManager) {
              throw { status: 404, message: "Manager not found" };
            }

            const distribution = await DistributionModel.findOneAndUpdate(
              {
                userId: disconnectedUser.userId,
              },
              { $set: { assigns: [], totalAssigns: 0 } }
            );
            if (!distribution) {
              throw { status: 404, message: "Distribution not found" };
            }

            const conversations = distribution.assigns.map((assign) => {
              return {
                id: assign.conversationId,
                startTime: assign.startTime,
                from: disconnectedUser.userId,
              };
            });

            await PendingAssignModel.findOneAndUpdate(
              {
                participantId: matchingManager.userId,
              },
              { $push: { conversations: conversations } },
              { new: true, upsert: true }
            );
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  async distributeConversation(instance: Redis) {
    try {
      while (true) {
        const result = await instance.blpop("distribution:incoming", 0);
        if (result) {
          const [queue, message] = result;
          const conversation = JSON.parse(message);
          const messageSupportRepository = new MessageSupportRepository(
            RedisManager.getClient("DistributionQueue")
          );
          await messageSupportRepository.distributeConversation(conversation);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}

export default DistributionWorker;
