import { IInboxChunk } from "../models/interfaces/inboxChunks";
import InboxChunkModel from "../models/inboxChunks";
import ConversationModel from "../models/conversations";
import { IMessage } from "../models/interfaces/message";
import mongoose, { Schema } from "mongoose";
import { Redis } from "ioredis";
import EventAction from "../utils/EventAction";
import ManagerModel from "../models/managers";
import PendingAssignModel from "../models/pendingAssign";
import DistributionModel from "../models/distribution";

export class MessageRepository {
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

  // TODO: Distribution (socket)
  public async addMessage(
    conversationId: string,
    message: IMessage,
    isAgentSent: boolean = false
  ): Promise<IInboxChunk> {
    const targetConversation = await ConversationModel.findById(conversationId);
    if (!targetConversation) {
      throw { status: 404, message: "Conversation not found" };
    }

    const isAuthorized =
      targetConversation?.participants.some(
        (participant) => participant.id === this.tokenContent.sub
      ) || isAgentSent === true;
    if (!isAuthorized) {
      throw { status: 403, message: "Permission denied" };
    }

    let lastInboxChunk;
    lastInboxChunk = await InboxChunkModel.findOne({
      conversationId: conversationId,
    }).sort({ chunkSerial: -1 });
    if (!lastInboxChunk) {
      lastInboxChunk = await InboxChunkModel.create({
        conversationId: conversationId,
        chunkSerial: 1,
      });
    }

    if (
      lastInboxChunk.messages.length === MessageRepository.chunkMessageLimit
    ) {
      try {
        lastInboxChunk = await InboxChunkModel.create({
          conversationId: conversationId,
          chunkSerial: lastInboxChunk.chunkSerial + 1,
        });
      } catch (error) {
        lastInboxChunk = await InboxChunkModel.findOne({
          conversationId: conversationId,
          chunkSerial: lastInboxChunk.chunkSerial + 1,
        });

        if (!lastInboxChunk) {
          throw new Error("No inbox chunk found");
        }
      }
    }

    lastInboxChunk = await InboxChunkModel.findByIdAndUpdate(
      lastInboxChunk._id,
      {
        $push: { messages: message },
      },
      { new: true }
    );
    if (!lastInboxChunk) {
      throw { status: 404, message: "Inbox chunk not found" };
    }

    const conversation = await ConversationModel.findByIdAndUpdate(
      conversationId,
      { $inc: { totalMessages: 1 }, lastMessageTime: new Date() },
      { new: true }
    ).lean();

    lastInboxChunk.messages = [
      lastInboxChunk.messages[lastInboxChunk.messages.length - 1],
    ];

    const participantIds = conversation?.participants
      .filter((participant) => participant.id !== this.tokenContent.sub)
      .map((participant) => participant.id) as string[];

    const manager = await ManagerModel.findOne({
      userId: { $in: participantIds },
    });

    const pendingAssign = await PendingAssignModel.findOne({
      participantId: { $in: participantIds },
      conversations: { $elemMatch: { id: conversationId } },
    });

    const distributions = await DistributionModel.find({
      assigns: { $elemMatch: { conversationId: conversationId } },
    });

    const managers = await ManagerModel.find({
      userId: { $in: participantIds },
    });

    const supportManagerIds = managers
      .map((manager) => manager.managers.map((manager) => manager.id))
      .flat();

    const supportParticipants = [...participantIds, ...supportManagerIds];

    const uniqueSupportManagerIds = [...new Set(supportParticipants)];

    const supportConversation = {
      ...conversation,
      supportParticipants: uniqueSupportManagerIds,
    };

    console.log(supportConversation.supportParticipants);

    (await this.redisClient).publish(
      "conversations",
      EventAction("sent", this.tokenContent?.sub, conversation, [
        lastInboxChunk,
      ])
    );

    (await this.redisClient).publish(
      "support-conversations",
      EventAction("sent", this.tokenContent?.sub, supportConversation, [
        lastInboxChunk,
      ])
    );

    if (conversation?.pass) {
      (await this.redisClient).rpush(
        "thirdparty:outgoing",
        EventAction(
          "sent",
          this.tokenContent?.sub,
          conversation,
          [lastInboxChunk],
          0,
          this.manualType
        )
      );
    }

    if (manager && !pendingAssign && distributions.length === 0) {
      (await this.redisClient).rpush(
        "distribution:incoming",
        EventAction(
          "sent",
          this.tokenContent?.sub,
          conversation,
          [lastInboxChunk],
          0,
          this.manualType
        )
      );
    }

    return lastInboxChunk;
  }

  public async getMessages(
    conversationId: string,
    page: number
  ): Promise<IInboxChunk[]> {
    const targetConversation = await ConversationModel.findById(conversationId);
    if (!targetConversation) {
      throw { status: 404, message: "Conversation not found" };
    }

    const isAuthorized = targetConversation?.participants.some(
      (participant) => participant.id === this.tokenContent.sub
    );

    // if (!isAuthorized) {
    //   throw { status: 403, message: "Permission denied" };
    // }

    const targetParticipant = targetConversation?.participants.find(
      (participant) =>
        participant.lastDeleteTime !== null &&
        participant.id === this.tokenContent.sub
    );

    const lastInboxChunks = await InboxChunkModel.find({
      conversationId: conversationId,
    })
      .sort({ chunkSerial: -1 })
      .skip(page)
      .limit(2)
      .lean();

    lastInboxChunks.reverse();

    lastInboxChunks.map((chunk) => {
      chunk.messages = chunk.messages.filter((message) =>
        message.sent &&
        targetParticipant &&
        targetParticipant.lastDeleteTime !== undefined &&
        targetParticipant.lastDeleteTime !== null
          ? message.sent > targetParticipant.lastDeleteTime
          : message
      );
    });

    return lastInboxChunks;
  }

  public async deleteMessage(
    conversationId: string,
    messageId: string
  ): Promise<IInboxChunk> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw { status: 404, message: "Conversation not found" };
    }

    const inboxChunk = await InboxChunkModel.findOne(
      { conversationId: conversationId, "messages._id": messageId },
      {
        messages: { $elemMatch: { _id: messageId } },
      }
    );

    const isAuthorized =
      this.tokenContent.sub === inboxChunk?.messages[0].sender;
    if (!isAuthorized) {
      throw { status: 403, message: "Permission denied" };
    }

    const targetMessage = await InboxChunkModel.findOneAndUpdate(
      {
        conversationId: conversationId,
        "messages._id": messageId,
      },
      { $set: { "messages.$.isDeleted": true } },
      { new: true }
    );

    if (!targetMessage) {
      throw { status: 500, message: "Message could not be deleted" };
    }

    targetMessage.messages = targetMessage.messages.filter(
      (msg: any) => msg.id == messageId
    );

    (await this.redisClient).publish(
      "conversations",
      EventAction("deleted", this.tokenContent?.sub, conversation, [
        targetMessage,
      ])
    );

    return targetMessage;
  }

  //A huge refactor remain in this function

  public async updateEvent(
    conversationId: mongoose.Types.ObjectId,
    event: string,
    sub?: string // Optional parameter
  ): Promise<
    {
      conversationId: mongoose.Types.ObjectId;
      chunkSerial: number;
      messages: any[];
    }[]
  > {
    const userId = sub || this.tokenContent?.sub; // Use provided sub or fallback to tokenContent.sub
    const fieldToUpdate = event === "seen" ? "seen" : "delivered";
    const updatedChunks: {
      conversationId: mongoose.Types.ObjectId;
      chunkSerial: number;
      messages: any[];
    }[] = [];

    // Start by getting the latest chunk
    let latestChunk = await InboxChunkModel.findOne({
      conversationId: conversationId,
    }).sort({ chunkSerial: -1 });

    if (!latestChunk) {
      throw {
        status: 404,
        message: "No inbox chunks found for the conversation",
      };
    }

    // Loop through chunks from the latest to the oldest
    while (latestChunk) {
      let updatedMessages: any[] = [];
      let isUpdated = false;

      // Reverse the messages array to start updating from the last message
      for (let i = latestChunk.messages.length - 1; i >= 0; i--) {
        const message = latestChunk.messages[i];

        // Skip messages sent by the current user
        if (message.sender === userId) continue;

        // Update if the seen or delivered field is null
        if (message[fieldToUpdate] === null) {
          message[fieldToUpdate] = new Date();
          updatedMessages.push(message);
          isUpdated = true;
        }
      }

      // If we updated any messages, save the chunk and add to the results
      if (isUpdated) {
        await latestChunk.save();
        updatedChunks.push({
          conversationId:
            latestChunk.conversationId as any as mongoose.Types.ObjectId,
          chunkSerial: latestChunk.chunkSerial,
          messages: updatedMessages,
        });
      }

      // Move to the previous chunk (if any)
      latestChunk = await InboxChunkModel.findOne({
        conversationId: conversationId,
        chunkSerial: latestChunk.chunkSerial - 1,
      });
    }

    if (updatedChunks.length === 0) {
      throw { status: 404, message: "No messages found to update" };
    }

    // Retrieve the current state of the conversation document
    const conversation: any = await ConversationModel.findOne({
      _id: conversationId,
      "participants.id": userId,
    });

    if (!conversation) {
      throw { status: 404, message: "Conversation not found" };
    }

    // Get existing totalMessages count
    const currentCount = conversation.totalMessages || 0;

    // Update the conversation document with the new totalMessages
    const updatedConversation = await ConversationModel.findOneAndUpdate(
      { _id: conversationId, "participants.id": userId },
      {
        $set: {
          [`participants.$.info.${event}`]: currentCount,
          lastMessageTime: new Date(), // Set the last message time to the current date
        },
      },
      { new: true } // Return the updated document
    );

    console.log({
      data: {
        action: "event",
        sub: userId,
        conversation: updatedConversation,
        InboxChunks: updatedChunks,
      },
    });

    (await this.redisClient).publish(
      "conversations",
      EventAction(
        event === "seen" ? "seen" : "delivered",
        userId,
        updatedConversation,
        updatedChunks
      )
    );

    return updatedChunks;
  }
}
