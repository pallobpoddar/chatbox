import { Namespace } from "socket.io";
import IMessage from "../interfaces/IMessage";
import Redis from "ioredis";

export class RedisPubSubController {
  private redisClient;
  constructor(redisClient: Redis | Promise<Redis>) {
    this.redisClient = redisClient;
  }

  public async conversationChannelHandler(
    namespace: Namespace,
    channel: string,
    message: string
  ) {
    if (channel !== "conversations") return;

    const parsedMessage: IMessage = JSON.parse(message);
    const isIdExists = parsedMessage.conversation.participants.some(
      (participant) => participant.id === parsedMessage.sub
    );

    if (isIdExists) {
      parsedMessage.conversation.participants.map((participant) => {
        if (participant.id !== parsedMessage.sub) {
          namespace.to(`${participant.id}`).emit(channel, message);
        }
      });
    }
  }

  public async supportConversationChannelHandler(
    namespace: Namespace,
    channel: string,
    message: string
  ) {
    if (channel !== "support-conversations") return;

    const parsedMessage: IMessage = JSON.parse(message);
    if (parsedMessage.conversation.supportParticipants?.length === 0) return;

    parsedMessage.conversation.supportParticipants.map((participant) => {
      namespace.to(`${participant}`).emit(channel, message);
    });
  }
}
