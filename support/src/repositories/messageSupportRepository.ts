import { Redis } from "ioredis";
import { IInboxChunk } from "@one.chat/shared/dist/models/interfaces/inboxChunks";
import {
  IInboxChunkSupport,
  IInboxChunkSupportResponse,
} from "../models/interfaces/inboxChunkSupport";
import InboxChunkSupportModel from "../models/inboxChunkSupport";
import DistributionModel from "@one.chat/shared/dist/models/distribution";
import { IDistribution } from "@one.chat/shared/dist/models/interfaces/distribution";
import ConversationModel from "@one.chat/shared/dist/models/conversations";
import { IEventActionPayload } from "@one.chat/shared/dist/utils/EventAction";
import mongoose from "mongoose";
import { MAX_CONVERSATION_PER_AGENT } from "../config/config";
import PendingAssignModel from "@one.chat/shared/dist/models/pendingAssign";
import ManagerModel from "@one.chat/shared/dist/models/managers";
import EventAction from "@one.chat/shared/dist/utils/EventAction";
import IDistributionHistory from "@one.chat/shared/dist/models/interfaces/distributionHistory";
import DistributionHistoryModel from "@one.chat/shared/dist/models/distributionHistory";
import { IConversation } from "@one.chat/shared/dist/models/interfaces/conversations";

class MessageSupportRepository {
  static chunkMessageLimit: number = 20;

  private redisClient;
  private tokenContent: any = {};
  private manualType: string | undefined;

  public constructor(redisClient: Redis | Promise<Redis>) {
    this.redisClient = redisClient;
  }

  public setTokenContent(tokenContent: any) {
    this.tokenContent = tokenContent;
  }

  public setManualType(manualType: string | undefined) {
    this.manualType = manualType || undefined;
  }

  // TODO: Add getConversations for agents and supervisors
  public async addMessage(
    inboxChunk: IInboxChunk,
    agentType: "Human" | "AI" | "System"
  ): Promise<IInboxChunkSupportResponse> {
    let lastInboxChunk;
    lastInboxChunk = await InboxChunkSupportModel.findOne({
      conversationId: inboxChunk.conversationId,
    }).sort({ chunkSerial: -1 });
    if (!lastInboxChunk) {
      lastInboxChunk = await InboxChunkSupportModel.create({
        conversationId: inboxChunk.conversationId,
        chunkSerial: 1,
      });
    }

    if (
      lastInboxChunk.messages.length ===
      MessageSupportRepository.chunkMessageLimit
    ) {
      try {
        lastInboxChunk = await InboxChunkSupportModel.create({
          conversationId: inboxChunk.conversationId,
          chunkSerial: lastInboxChunk.chunkSerial + 1,
        });
      } catch (error) {
        lastInboxChunk = await InboxChunkSupportModel.findOne({
          conversationId: inboxChunk.conversationId,
          chunkSerial: lastInboxChunk.chunkSerial + 1,
        });

        if (!lastInboxChunk) {
          throw new Error("No inbox chunk support found");
        }
      }
    }

    lastInboxChunk = await InboxChunkSupportModel.findByIdAndUpdate(
      lastInboxChunk._id,
      {
        $push: {
          messages: {
            id: inboxChunk.messages[inboxChunk.messages.length - 1]._id,
            sender: this.tokenContent.sub,
            agentType: agentType,
          },
        },
      },
      { new: true }
    );
    if (!lastInboxChunk) {
      throw { status: 404, message: "Inbox chunk support not found" };
    }

    lastInboxChunk.messages = [
      lastInboxChunk.messages[lastInboxChunk.messages.length - 1],
    ];

    const response = {
      conversationId: lastInboxChunk.conversationId,
      chunkSerial: lastInboxChunk.chunkSerial,
      messages: [
        {
          userPart: inboxChunk.messages[inboxChunk.messages.length - 1],
          agentPart:
            lastInboxChunk.messages[lastInboxChunk.messages.length - 1],
        },
      ],
    };

    return response as any;
  }

  public async getAllConversationsByManagerId(
    offset: number,
    take: number
  ): Promise<any> {
    const managers = await ManagerModel.find({
      "managers.id": this.tokenContent.sub,
    });
    if (managers.length === 0) {
      throw { status: 404, message: "Manager not found" };
    }

    const userIds = managers.map((manager) => manager.userId);
    const supportManagerIds = managers
      .map((manager) =>
        manager.managers.map((supportManager) => supportManager.id)
      )
      .flat();

    const lastConversations = await ConversationModel.aggregate([
      {
        $addFields: {
          lastMessageTime: { $toDate: "$lastMessageTime" },
        },
      },
      {
        $match: {
          "participants.id": { $in: userIds },
        },
      },
      {
        $match: {
          $expr: {
            $allElementsTrue: {
              $map: {
                input: "$participants",
                as: "participant",
                in: {
                  $or: [
                    {
                      $lt: ["$$participant.lastDeleteTime", "$lastMessageTime"],
                    },
                    {
                      $not: {
                        $ifNull: ["$$participant.lastDeleteTime", false],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
      {
        $skip: offset,
      },
      {
        $limit: take,
      },
    ]);

    // Always returns the boss at the top
    lastConversations.map((conversation) => {
      const matchedParticipants = conversation.participants.filter(
        (participant: {
          id: string;
          isAdmin?: boolean;
          info?: {
            delivered: number;
            seen: number;
          };
          lastDeleteTime?: Date;
        }) => userIds.includes(participant.id)
      );

      const unmatchedParticipants = conversation.participants.filter(
        (participant: {
          id: string;
          isAdmin?: boolean;
          info?: {
            delivered: number;
            seen: number;
          };
          lastDeleteTime?: Date;
        }) => !userIds.includes(participant.id)
      );

      conversation.participants = [
        ...matchedParticipants,
        ...unmatchedParticipants,
      ];
    });

    const conversationIds = lastConversations.map(
      (conversation) => conversation._id
    );
    const distributions = await DistributionModel.find({
      userId: { $in: supportManagerIds },
      "assigns.conversationId": { $in: conversationIds },
    });

    const pendingAssigns = await PendingAssignModel.find({
      participantId: { $in: userIds },
      "conversations.id": { $in: conversationIds },
    });

    const lastSupportConversations = lastConversations.map((conversation) => {
      const conversationId = conversation._id.toString();

      let status;
      let assignee;
      const assignedDistribution = distributions.find((d) =>
        d.assigns.some((a) => a.conversationId.toString() === conversationId)
      );
      const isPending = pendingAssigns.some((p) =>
        p.conversations.some((c) => c.id.toString() === conversationId)
      );

      if (assignedDistribution) {
        status = "Assigned";
        assignee = assignedDistribution?.userId || null;
      } else if (isPending) {
        status = "Not Assigned";
        assignee = null;
      } else {
        status = "Closed";
        assignee = null;
      }

      const userPart = {
        conversation: conversation,
      };

      const agentPart = {
        status: status,
        assignee: assignee,
      };

      return {
        userPart,
        agentPart,
      };
    });

    return lastSupportConversations;
  }

  public async getConversationsByIds(): Promise<IConversation[] | null> {
    const distribution = await DistributionModel.findOne({
      userId: this.tokenContent.sub,
    });
    // if (!distribution) {
    //   throw { status: 404, message: "Distribution not found" };
    // }

    // const distributionConversations = distribution.assigns.filter(
    //   (conversation) => conversationIds.includes(conversation.conversationId)
    // );

    if (!distribution) {
      return null;
    }

    const conversationIds = distribution?.assigns.map(
      (conversation) => conversation.conversationId
    );

    const conversations = await ConversationModel.find({
      _id: { $in: conversationIds },
    });

    return conversations;
  }

  public async getMessages(
    conversationId: string,
    page: number
  ): Promise<IInboxChunkSupport[]> {
    const targetConversation = await ConversationModel.findById(conversationId);
    if (!targetConversation) {
      throw { status: 404, message: "Conversation not found" };
    }

    const lastInboxChunks = await InboxChunkSupportModel.find({
      conversationId: conversationId,
    })
      .sort({ chunkSerial: -1 })
      .skip(page)
      .limit(2)
      .lean();

    return lastInboxChunks;
  }

  public async getManagerId(id: string): Promise<string> {
    const manager = await ManagerModel.findOne(
      { managers: { $elemMatch: { id: id } } },
      { userId: 1 }
    );
    if (!manager) {
      throw { status: 404, message: "Manager not found" };
    }

    return manager.userId;
  }

  public async distributeConversation(
    eventAction: IEventActionPayload
  ): Promise<any> {
    if (eventAction.action !== "sent") return null;

    const conversationId = new mongoose.Types.ObjectId(
      eventAction.conversation._id as string
    );

    const result = await ConversationModel.aggregate([
      {
        $match: {
          _id: conversationId,
        },
      },
      {
        $unwind: "$participants",
      },
      {
        $lookup: {
          from: "managers",
          localField: "participants.id",
          foreignField: "userId",
          as: "managersInfo",
        },
      },
      {
        $unwind: "$managersInfo",
      },
      {
        $unwind: "$managersInfo.managers",
      },
      {
        $match: {
          "managersInfo.managers.role": "agent",
        },
      },
      {
        $lookup: {
          from: "onlines",
          let: { managerId: "$managersInfo.managers.id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$managerId"] },
                    { $eq: ["$source", "support"] },
                    {
                      $or: [
                        { $eq: ["$lastOnlineTime", null] },
                        {
                          $gte: [
                            "$lastOnlineTime",
                            { $subtract: [new Date(), 1000 * 60 * 5] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "onlineManagers",
        },
      },
      {
        $unwind: "$onlineManagers",
      },
      {
        $lookup: {
          from: "distributions",
          let: { managerId: "$onlineManagers.userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$managerId"] },
                    { $lte: ["$totalAssigns", MAX_CONVERSATION_PER_AGENT] },
                  ],
                },
              },
            },
            {
              $project: {
                totalAssigns: 1,
                assigns: 1,
              },
            },
          ],
          as: "distribution",
        },
      },
      {
        $sort: {
          "distribution.totalAssigns": 1,
        },
      },
      { $limit: 1 },
    ]);

    if (result.length === 0) {
      const participantIds = eventAction.conversation.participants.map(
        (participant: { id: any }) => participant.id
      );

      const matchingManagers = await ManagerModel.find({
        userId: { $in: participantIds },
      });

      const pendingAssign = await Promise.all(
        matchingManagers.map(async (manager) => {
          return PendingAssignModel.updateOne(
            { participantId: manager.userId },
            {
              $push: {
                conversations: {
                  id: conversationId,
                  startTime: new Date(),
                  from: null,
                },
              },
            },
            { upsert: true }
          );
        })
      );

      return pendingAssign;
    }

    const updatedDistributions = await Promise.all(
      result.map(async (doc) => {
        return DistributionModel.findOneAndUpdate(
          { userId: doc.onlineManagers.userId },
          {
            $push: {
              assigns: {
                conversationId: conversationId,
                startTime: new Date(),
                closeTime: null,
                transferTo: null,
              },
            },
            $inc: {
              totalAssigns: 1,
            },
          },
          {
            new: true,
            upsert: true,
          }
        );
      })
    );

    (await this.redisClient).publish(
      "distribution:outgoing",
      EventAction("distributed", this.tokenContent?.sub, conversationId, [
        updatedDistributions,
      ])
    );

    return updatedDistributions;
  }

  public async closeConversation(
    conversationId: string
  ): Promise<IDistributionHistory> {
    const lastInboxChunkSupport = await InboxChunkSupportModel.findOne({
      conversationId,
    }).sort({ chunkSerial: -1 });
    if (lastInboxChunkSupport) {
      const lastMessageIndex = lastInboxChunkSupport.messages.length - 1;

      await InboxChunkSupportModel.findOneAndUpdate(
        {
          conversationId,
          chunkSerial: lastInboxChunkSupport.chunkSerial,
        },
        {
          $set: {
            [`messages.${lastMessageIndex}.closeTime`]: new Date(),
          },
        },
        { new: true }
      );
    }

    const manager = await ManagerModel.findOne({
      managers: {
        $elemMatch: {
          id: this.tokenContent.sub,
        },
      },
    });
    if (!manager) {
      throw { status: 404, message: "Manager not found" };
    }

    const matchingManager = manager.managers.find(
      (manager) => manager.id === this.tokenContent.sub
    );

    if (matchingManager?.role === "supervisor") {
      await PendingAssignModel.findOneAndUpdate(
        { conversations: { $elemMatch: { id: conversationId } } },
        {
          $pull: {
            conversations: {
              id: conversationId,
            },
          },
        },
        { new: true }
      );
    }

    if (matchingManager?.role === "agent") {
      const distribution = await DistributionModel.findOneAndUpdate(
        {
          userId: this.tokenContent.sub,
          assigns: {
            $elemMatch: {
              conversationId: conversationId,
            },
          },
        },
        {
          $pull: {
            assigns: {
              conversationId: conversationId,
            },
          },
          $inc: {
            totalAssigns: -1,
          },
        },
        {
          new: true,
        }
      );
      if (!distribution) {
        throw { status: 404, message: "Distribution not found" };
      }
    }

    const newDistributionHistory = await DistributionHistoryModel.create({
      participantId: manager.userId,
      agentId: this.tokenContent.sub,
      conversationId: conversationId,
      endTime: new Date(),
    });

    return newDistributionHistory;
  }
}

export default MessageSupportRepository;
