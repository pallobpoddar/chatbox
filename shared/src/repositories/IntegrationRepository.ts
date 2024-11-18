import { IInboxChunk } from "../models/interfaces/inboxChunks";
import InboxChunkModel from "../models/inboxChunks";
import ConversationModel from "../models/conversations";
import { IMessage } from "../models/interfaces/message";
import mongoose, { Schema, Types } from "mongoose";
import { Redis } from "ioredis";
import EventAction from "../utils/EventAction";
import ConversationRepository from "./ConversationRepository";
import { RedisManager } from "../setup/redis";
import { ApiResponse } from "../utils/ApiResponse";
import { MessageRepository } from "./MessageRepository";
import { WhatsAppService } from "../services/whatsapp/index";

export class IntegrationRepository {
  static chunkMessageLimit: number = 20;
  private tokenContent: any = {};
  private manualType: string | undefined;
  private conversationRepository: ConversationRepository;
  private messageRepository: MessageRepository;

  public constructor(
    redisClient: Redis | Promise<Redis>,
    conversationRepository: ConversationRepository,
    messageRepository: MessageRepository
  ) {
    this.conversationRepository = conversationRepository;
    this.messageRepository = messageRepository;
  }

  public setTokenContent(tokenContent: any) {
    this.tokenContent = tokenContent;
  }

  public setRedis(redisClient: any) {
    this.conversationRepository = new ConversationRepository(redisClient);
    this.messageRepository = new MessageRepository(redisClient);
  }

  async updateMediaPath(
    conversationId: mongoose.Types.ObjectId,
    chunkSerial: number,
    mediaId: string,
    newPath: string
  ): Promise<any> {
    try {
      const updatedChunk = await InboxChunkModel.findOneAndUpdate(
        {
          conversationId,
          chunkSerial,
          "messages.media.sourceInfo.id": mediaId,
        },
        {
          $set: {
            "messages.$[messageElem].media.$[mediaElem].path": newPath,
            "messages.$[messageElem].media.$[mediaElem].isSaved": true,
          },
        },
        {
          arrayFilters: [
            { "messageElem.media.sourceInfo.id": mediaId }, // Filter for the correct message
            { "mediaElem.sourceInfo.id": mediaId }, // Filter for the correct media item
          ],
          projection: {
            conversationId: 1, // Include conversationId
            "messages.$": 1, // Include only the updated message
            chunkSerial: 1, // Include chunkSerial
          },
        }
      );

      if (updatedChunk) {
        console.log(`Media with ID ${mediaId} updated successfully.`);
        console.log(updatedChunk);
        return updatedChunk;
      } else {
        console.log(
          `No media found with ID ${mediaId} in conversation ${conversationId}.`
        );
        return null;
      }
    } catch (error) {
      console.error("Error updating media path:", error);
      throw error;
    }
  }

  async updateErrorInPass(messageId: string, messageContent: string) {
    const messageObjectId = new Types.ObjectId(messageId);

    // Update the specific field in the pass array within the messages array
    const result = await InboxChunkModel.findOneAndUpdate(
      { "messages._id": messageObjectId },
      {
        $set: {
          "messages.$[msg].pass.0.error": messageContent, // Updating the first element in the pass array
        },
      },
      {
        arrayFilters: [{ "msg._id": messageObjectId }],
        projection: {
          chunkSerial: 1,
          _id: 0,
          conversationId: 1,
          "messages.$": 1,
        },
      }
    );

    return result;
  }

  async processMessage(message: string) {
    const data = JSON.parse(message);
    // console.log("this is data from incoming", JSON.stringify(data, null, 2));
    if (data.action === "failed") {
      const update = await this.updateErrorInPass(
        data.InboxChunks[0].messages[0]._id,
        data.InboxChunks[0].messages[0].content
      );
      const conversation = await ConversationModel.findById( update?.conversationId );
      await (await RedisManager.getClient("general")).publish(
        "conversations",
        EventAction("failed", this.tokenContent?.sub,conversation, [update])
      )
    } else {
      if (data.action === "message") {
        this.setRedis(await RedisManager.getClient("general"));
        const conversationinfo: any =
          await this.conversationRepository.findOrCreate(data.participants);
        const addMessage = await this.messageRepository.addMessage(
          conversationinfo._id,
          data.InboxChunks[0],
          true
        );
        const whatsAppService = new WhatsAppService(
          data.whatsAppService.businessNumber,
          data.whatsAppService.apiKey,
          {}
        );
        console.log(data.InboxChunks[0].media.sourceInfo.id);
        const urlInfo: any = await whatsAppService.downloadMediaUrl(
          data.InboxChunks[0].media.sourceInfo.id
        );
        const mediaPath: any = await whatsAppService.downloadMedia(
          urlInfo.url,
          data.InboxChunks[0].media.sourceInfo.id
        );
        const conversationid = new mongoose.Types.ObjectId(
          conversationinfo._id
        );
        const updateInbox = await this.updateMediaPath(
          conversationid,
          addMessage.chunkSerial,
          data.InboxChunks[0].media.sourceInfo.id,
          mediaPath
        );
        console.log({
          data: {
            action: "sent",
            conversation: conversationinfo,
            InboxChunks: [JSON.stringify(updateInbox, null)], //updateInbox],
          },
        });
        await (
          await RedisManager.getClient("general")
        ).publish(
          "conversations",
          EventAction("downloaded", this.tokenContent?.sub, conversationinfo, [
            updateInbox,
          ])
        );
        return data;
      } else {
        const conversationinfo: any =
          await this.conversationRepository.findOrCreate(data.participants);
        const sentStatus = await this.messageRepository.updateEvent(
          conversationinfo._id,
          data.action,
          data.sub
        );
        console.log(data);
        return data;
      }
    }
  }
}
