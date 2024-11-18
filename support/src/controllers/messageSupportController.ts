import {
  ApiResponse,
  generateMetadata,
} from "@one.chat/shared/dist/utils/ApiResponse";
import MessageSupportRepository from "../repositories/messageSupportRepository";
import { Request, Response } from "express";
import ConversationRepository from "@one.chat/shared/dist/repositories/ConversationRepository";
import mongoose from "mongoose";
import WhatsAppService from "@one.chat/shared/dist/services/whatsapp";
import { IMessage } from "@one.chat/shared/dist/models/interfaces/message";
import { MessageRepository } from "@one.chat/shared/dist/repositories/MessageRepository";
import { queryValidator } from "../validators/QueryParams";
import { ValidationErrorFormatter } from "../utils/ErrorFormatter";
import { QueryToPagination } from "@one.chat/shared/dist/utils/ParamDecoder";

class MessageSupportController {
  private metadata = generateMetadata("1.0.0", "manager");
  private messageSupportRepository: MessageSupportRepository;
  private conversationRepository: ConversationRepository;
  private messageRepository: MessageRepository;

  constructor(
    messageSupportRepository: MessageSupportRepository,
    conversationRepository: ConversationRepository,
    messageRepository: MessageRepository
  ) {
    this.messageSupportRepository = messageSupportRepository;
    this.conversationRepository = conversationRepository;
    this.messageRepository = messageRepository;
  }

  private setTokenContent(token: string) {
    this.messageSupportRepository.setTokenContent(token);
    this.messageRepository.setTokenContent(token);
  }

  private setManualType(manualType: string | undefined) {
    if (manualType !== undefined) {
      this.messageSupportRepository.setManualType(manualType);
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const authInfo = req.kauth?.grant?.access_token as any;
      const token = authInfo?.content;
      let { conversationId } = req.params;
      const { recipientId, content, ManualType, contextId, agentType } =
        req.body;
      this.setTokenContent(token);
      this.setManualType(ManualType);
      const senderId = token.sub;

      if (!conversationId && recipientId) {
        const participants = [senderId, recipientId];
        const conversation = await this.conversationRepository.findOrCreate(
          participants
        );
        if (conversation) conversationId = conversation.id;
      }
      const contextid = contextId as mongoose.Types.ObjectId;

      const mediaFiles = req.files as Express.Multer.File[];

      const platform = null as any;
      let mediaArray: {
        path: string;
        type: string;
        isSaved: boolean;
        sourceInfo: object;
      }[] = [];

      if (mediaFiles && mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const type = await WhatsAppService.detectContentType(file.path);

          mediaArray.push({
            path: file.path,
            type: ManualType || type.type,
            isSaved: true,
            sourceInfo: {},
          });
        }
      }

      const managerId = await this.messageSupportRepository.getManagerId(
        token.sub
      );

      const message: IMessage = {
        sender: managerId,
        sent: new Date(),
        delivered: null,
        seen: null,
        type:
          ManualType || (mediaArray.length > 0 ? mediaArray[0].type : "text"),
        content: content,
        media: mediaArray,
        context: contextid,
        source: {
          platform,
          refId: null as any,
        },
        pass: [],
        isDeleted: false,
      };

      const inboxChunk = await this.messageRepository.addMessage(
        conversationId,
        message,
        true
      );

      const inboxChunkSupport = await this.messageSupportRepository.addMessage(
        inboxChunk,
        agentType
      );

      return ApiResponse.success(
        res,
        { inboxChunkSupport },
        "Message sent successfully",
        undefined,
        this.metadata
      );
    } catch (error: any) {
      return ApiResponse.error(
        res,
        error.message,
        error.status ?? 500,
        error.errors,
        this.metadata
      );
    }
  }

  async getConversationsByIds(req: Request, res: Response) {
    try {
      const authInfo = req.kauth?.grant?.access_token as any;
      const token = authInfo?.content;
      this.setTokenContent(token);

      const conversations =
        await this.messageSupportRepository.getConversationsByIds();

      return ApiResponse.success(
        res,
        { conversations },
        "Conversations retrieved successfully",
        undefined,
        this.metadata
      );
    } catch (error: any) {
      console.log(error);
      return ApiResponse.error(
        res,
        error.message,
        error.status ?? 500,
        error.errors,
        this.metadata
      );
    }
  }

  async getAllConversationsByManagerId(req: Request, res: Response) {
    try {
      const authInfo = req.kauth?.grant?.access_token as any;
      const token = authInfo?.content;
      this.setTokenContent(token);

      ValidationErrorFormatter(
        queryValidator.validate(req.query, { abortEarly: false })
      );

      const pagination = QueryToPagination(req.query);

      const conversations =
        await this.messageSupportRepository.getAllConversationsByManagerId(
          pagination.request.skip,
          pagination.request.limit
        );

      return ApiResponse.success(
        res,
        { conversations },
        "Conversations retrieved successfully",
        undefined,
        this.metadata
      );
    } catch (error: any) {
      return ApiResponse.error(
        res,
        error.message,
        error.status ?? 500,
        error.errors,
        this.metadata
      );
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { page } = req.query;
      this.setTokenContent((req.kauth?.grant?.access_token as any).content);

      const inboxChunks = await this.messageRepository.getMessages(
        conversationId,
        Number(page)
      );
      const inboxChunkSupports =
        await this.messageSupportRepository.getMessages(
          conversationId,
          Number(page)
        );

      let inboxChunkSupportMessages: any = {
        conversationId: conversationId,
        messages: [],
      };

      inboxChunks.forEach((inboxChunk) => {
        inboxChunk.messages.forEach((chunkMessage) => {
          let foundSupportMessage = null;

          for (const supportChunk of inboxChunkSupports) {
            foundSupportMessage = supportChunk.messages.find(
              (supportMsg) =>
                supportMsg.id.toString() === chunkMessage._id?.toString()
            );

            if (foundSupportMessage) break;
          }

          const combinedMessage = {
            userPart: chunkMessage,
            agentPart: foundSupportMessage ? foundSupportMessage : null,
          };

          inboxChunkSupportMessages.messages.push(combinedMessage);
        });
      });

      return ApiResponse.success(
        res,
        { inboxChunkSupportMessages },
        "Messages retrieved successfully",
        undefined,
        this.metadata
      );
    } catch (error: any) {
      console.log(error);
      return ApiResponse.error(
        res,
        error.message,
        error.status ?? 500,
        error.errors,
        this.metadata
      );
    }
  }

  async closeConversation(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      this.setTokenContent((req.kauth?.grant?.access_token as any).content);

      const distributionHistory =
        await this.messageSupportRepository.closeConversation(conversationId);
      return ApiResponse.success(
        res,
        { distributionHistory },
        "Distribution history retrieved successfully",
        undefined,
        this.metadata
      );
    } catch (error: any) {
      console.log(error);
      return ApiResponse.error(
        res,
        error.message,
        error.status ?? 500,
        error.errors,
        this.metadata
      );
    }
  }
}

export default MessageSupportController;
