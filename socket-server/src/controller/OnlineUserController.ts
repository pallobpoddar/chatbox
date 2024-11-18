import { Socket } from "socket.io";
import OnlineModel from "@one.chat/shared/dist/models/onlineUser";
import { RedisManager } from "@one.chat/shared/dist/setup/redis";

class OnlineUserController {
  private socket: Socket;
  private thresholdTime: number;
  private namespace: string;
  public constructor(
    socket: Socket,
    namespace: string,
    thresholdTime: number = 5 * 60 * 1000
  ) {
    this.socket = socket;
    this.namespace = namespace;
    this.thresholdTime = thresholdTime;
  }

  public async socketConnectionHandler() {
    try {
      const redisClient = await RedisManager.getClient("publisher");

      const onlineUser = await OnlineModel.findOne({
        userId: this.socket.data.user.id,
        source: this.namespace,
      });
      if (!onlineUser) {
        const connectedUser = await OnlineModel.create({
          userId: this.socket.data.user.id,
          source: this.namespace,
          onlineTime: new Date(),
        });

        if (this.namespace === "support") {
          await redisClient.rpush(
            "users:connect:" + this.namespace,
            JSON.stringify({
              userId: connectedUser.userId,
              connectTime: connectedUser.onlineTime,
            })
          );
        }
      } else {
        const timeDifference =
          new Date().getTime() - onlineUser.onlineTime!.getTime();

        if (timeDifference > this.thresholdTime) {
          const connectedUser = await OnlineModel.findOneAndUpdate(
            {
              userId: this.socket.data.user.id,
              source: this.namespace,
            },
            {
              onlineTime: new Date(),
              lastOnlineTime: null,
            },
            {
              new: true,
            }
          );

          if (this.namespace === "support") {
            await redisClient.rpush(
              "users:connect:" + this.namespace,
              JSON.stringify({
                userId: connectedUser?.userId,
                connectTime: connectedUser?.onlineTime,
              })
            );
          }
        } else {
          await OnlineModel.findOneAndUpdate(
            {
              userId: this.socket.data.user.id,
              source: this.namespace,
            },
            {
              lastOnlineTime: null,
            },
            {
              new: true,
            }
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  public async socketDisconnectionHandler() {
    try {
      const disconnectedUser = await OnlineModel.findOneAndUpdate(
        {
          userId: this.socket.data.user.id,
          source: this.namespace,
        },
        {
          lastOnlineTime: new Date(),
        },
        {
          new: true,
        }
      );

      const redisClient = await RedisManager.getClient("publisher");

      if (this.namespace === "support") {
        await redisClient.rpush(
          "users:disconnect:" + this.namespace,
          JSON.stringify({
            userId: disconnectedUser?.userId,
            disconnectTime: disconnectedUser?.lastOnlineTime,
          })
        );
      }
    } catch (error) {
      console.log(error);
    }
  }
}

export default OnlineUserController;
