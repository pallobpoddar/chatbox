import express from "express";
import {
  ApiResponse,
  generateMetadata,
} from "@one.chat/shared/dist/utils/ApiResponse";
import { MessageRepository } from "@one.chat/shared/dist/repositories/MessageRepository";
import { IMessage } from "@one.chat/shared/dist/models/interfaces/message";
import mongoose, { Schema, Types } from "mongoose";
import WhatsAppService from "@one.chat/shared/dist/services/whatsapp";
import { ValidationErrorFormatter } from "../utils/ErrorFormatter";
import { queryValidator } from "../validator/QueryParams";
import { messageValidator } from "../validator/MessagingValidator";
import ConversationRepository from "@one.chat/shared/dist/repositories/ConversationRepository";
import { Token } from "keycloak-connect";
import { updateConversationSchema } from "../validator/conversationValidator";
import {
  getNonFilterableFields,
  SortParamsDecoder,
  FilterParamsDecoder,
  ResultToPagination,
  QueryToPagination,
} from "@one.chat/shared/dist/utils/ParamDecoder";

class conversation {
  private metadata = generateMetadata("1.0.0", "conversation");
  private messageRepository: MessageRepository;
  private conversationRepository: ConversationRepository;

  constructor(
    messageRepository: MessageRepository,
    conversationRepository: ConversationRepository
  ) {
    this.messageRepository = messageRepository;
    this.conversationRepository = conversationRepository;
  }

  private setTokenContent(token: string | undefined) {
    this.messageRepository.setTokenContent(token);
    this.conversationRepository.setTokenContent(token);
  }

  private setManualType(manualType: string | undefined) {
    if (manualType !== undefined) {
      this.messageRepository.setManualType(manualType);
    }
  }

  async sendMessage(req: express.Request, res: express.Response) {
    try {
      ValidationErrorFormatter(
        messageValidator.validate(req.body, { abortEarly: false })
      );

      const authInfo = req.kauth?.grant?.access_token as any;
      const token = authInfo?.content;
      let conversationId: string = req.params.conversationId;
      const { recipientId, content, ManualType, contextId } = req.body;
      this.setTokenContent(token);
      this.setManualType(ManualType);
      const senderId = token.sub;
      if (!conversationId && recipientId) {
        const participants = [senderId, recipientId];
        const conversation = (await this.conversationRepository.findOrCreate(
          participants
        )) as any;
        if (conversation) conversationId = conversation._id;
      }
      const conversationData =
        await this.conversationRepository.getConversationById(conversationId);
      const contextid = contextId as mongoose.Types.ObjectId;

      // Access the uploaded file
      const mediaFiles = req.files as Express.Multer.File[];

      // Example sender, context, and source details for demonstration
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
            path: file.path, // Use the file path stored on the server
            type: ManualType || type.type, // Use detected type or ManualType
            isSaved: true, // Set to true after saving to storage
            sourceInfo: {}, // Can add additional media source information here
          });
        }
      }
      let pass;

      if (conversationData?.pass.whatsapp === true) {
        pass = true;
      } else {
        pass = false;
      }

      // Create IMessage object
      const message: IMessage = {
        sender: senderId,
        sent: new Date(),
        delivered: null,
        seen: null,
        type:
          ManualType || (mediaArray.length > 0 ? mediaArray[0].type : "text"), // Default to text if ManualType is not provided
        content: content, //only content
        media: mediaArray, // Use the array of media objects
        context: contextid,
        source: {
          platform,
          refId: null as any,
        },
        pass: [],
        isDeleted: false,
      };

      // Call the addMessage function
      const InboxChunk = await this.messageRepository.addMessage(
        conversationId,
        message,
        pass
      );

      return ApiResponse.success(
        res,
        { InboxChunk },
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

  async getMessages(req: express.Request, res: express.Response) {
    try {
      ValidationErrorFormatter(
        queryValidator.validate(req.query, { abortEarly: false })
      );
      const conversationId = req.params.conversationId;
      const { page } = req.query;
      this.setTokenContent((req.kauth?.grant?.access_token as any).content);
      const InboxChunk = await this.messageRepository.getMessages(
        conversationId,
        Number(page)
      );
      return ApiResponse.success(
        res,
        { InboxChunk },
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

  async deleteMessage(req: express.Request, res: express.Response) {
    try {
      this.setTokenContent((req.kauth?.grant?.access_token as any).content);
      const conversationId = req.params.conversationId;
      const messageId: string = req.params.messageId;
      const InboxChunk = await this.messageRepository.deleteMessage(
        conversationId,
        messageId
      );
      return ApiResponse.success(
        res,
        { InboxChunk },
        "Message deleted successfully",
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

  async createConversation(req: express.Request, res: express.Response) {
    try {
      this.setTokenContent((req.kauth?.grant?.access_token as any).content);
      // Parse participants as an array of strings
      const participants = JSON.parse(req.body.participants);

      // Ensure participantsArray is an array of strings
      if (
        !Array.isArray(participants) ||
        !participants.every((item) => typeof item === "string")
      ) {
        throw new Error("Invalid participants format");
      }

      const name = req.body.name;
      // Ensure req.files is an array before accessing it
      const filesArray = req.files as Express.Multer.File[]; // Type assertion

      // Access the first uploaded file's path
      const photo =
        filesArray && filesArray.length > 0 ? filesArray[0].path : "";
      const group = {
        name,
        photo,
      };
      const conversation = await this.conversationRepository.createGroup(
        participants,
        group
      );
      return ApiResponse.success(
        res,
        { conversation },
        "Conversation created successfully",
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

  async addParticipantsToConversation(
    req: express.Request,
    res: express.Response
  ) {
    try {
      this.setTokenContent((req.kauth?.grant?.access_token as any).content);
      console.log(req.body);
      const conversationId = req.params.conversationId;
      const participants = req.body.participants;

      if (
        !Array.isArray(participants) ||
        !participants.every((item) => typeof item === "string")
      ) {
        throw new Error("Invalid participants format");
      }

      const conversationid = new mongoose.Types.ObjectId(conversationId);
      const updatedConversation =
        await this.conversationRepository.addParticipantsToConversation(
          conversationid,
          participants
        );

      return ApiResponse.success(
        res,
        { updatedConversation },
        "Conversation updated successfully",
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

  async removeParticipantsFromConversation(
    req: express.Request,
    res: express.Response
  ) {
    try {
      this.setTokenContent((req.kauth?.grant?.access_token as any).content);
      // Extract and log the conversationId and participants
      const conversationId = req.params.conversationId;

      // Convert conversationId to ObjectId
      const conversationid = new mongoose.Types.ObjectId(conversationId);

      const participants = req.body.participants;

      // Ensure participants is an array of strings
      if (
        !Array.isArray(participants) ||
        !participants.every((item) => typeof item === "string")
      ) {
        throw new Error("Invalid participants format");
      }

      // Call the repository method
      const updatedConversation =
        await this.conversationRepository.removeParticipantsFromConversation(
          conversationid,
          participants
        );

      // Respond with success
      return ApiResponse.success(
        res,
        { updatedConversation },
        "Conversation updated successfully",
        undefined,
        this.metadata
      );
    } catch (error: any) {
      // Log the error and respond with an error message
      console.error("Error:", error);
      return ApiResponse.error(
        res,
        error.message,
        error.status ?? 500,
        error.errors,
        this.metadata
      );
    }
  }

  async updateGroupInfo(req: express.Request, res: express.Response) {
    try {
      this.setTokenContent((req.kauth?.grant?.access_token as any).content);
      // Extract conversationId and ensure it's a valid ObjectId
      const conversationId = req.params.conversationId;
      const name = req.body.groupName;

      // Ensure req.files is an array before accessing it
      const filesArray = req.files as Express.Multer.File[]; // Type assertion

      // Access the first uploaded file's path
      const photo =
        filesArray && filesArray.length > 0 ? filesArray[0].path : "";
      const group = {
        name,
        photo,
      };

      // Convert conversationId to ObjectId
      const conversationid = new mongoose.Types.ObjectId(conversationId);

      // Call the repository method to update the conversation
      const conversation = await this.conversationRepository.updateGroupInfo(
        conversationid,
        group
      );

      // Respond with success
      return ApiResponse.success(
        res,
        { conversation },
        "Conversation updated successfully",
        undefined,
        this.metadata
      );
    } catch (error: any) {
      // Respond with error
      return ApiResponse.error(
        res,
        error.message,
        error.status ?? 500,
        error.errors,
        this.metadata
      );
    }
  }

  async getConversationsByParticipant(
    req: express.Request,
    res: express.Response
  ) {
    try {
      this.setTokenContent((req.kauth?.grant?.access_token as any).content);
      ValidationErrorFormatter(
        queryValidator.validate(req.query, { abortEarly: false })
      );
      const { page, length } = req.query;

      const pagination = QueryToPagination(req.query);

      const token = req.kauth?.grant?.access_token as any;
      const participantId = token.content.sub;
      const conversations =
        await this.conversationRepository.getConversationsByParticipant(
          participantId,
          pagination.request.skip,
          pagination.request.limit
        );

      // Get the total items count (optional if you plan to show total pages)
      const totalItems =
        await this.conversationRepository.getTotalConversationsCount(
          participantId
        );

      // Format the result into pagination response
      const paginatedResponse = ResultToPagination(totalItems, pagination);
      return ApiResponse.success(
        res,
        { conversations },
        "Conversations retrieved successfully",
        paginatedResponse.pagination,
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

  async getConversationsByIds(req: express.Request, res: express.Response) {
    try {
      this.setTokenContent((req.kauth?.grant?.access_token as any).content);
      const { conversationIds } = req.body;
      const conversations =
        await this.conversationRepository.getConversationsByIds(
          conversationIds
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

  //experimental

  async updateConversation(req: express.Request, res: express.Response) {
    try {
      ValidationErrorFormatter(
        updateConversationSchema.validate(req.body, { abortEarly: false })
      );
      this.setTokenContent((req.kauth?.grant?.access_token as any).content);
      const conversationId = req.params.conversationId;

      // Parse `remove` and `add` fields from strings to arrays
      let remove: string[] = req.body.remove ? JSON.parse(req.body.remove) : [];
      let add: string[] = req.body.add ? JSON.parse(req.body.add) : [];
      let name: string = req.body.name;
      let photo = req.files as Express.Multer.File[];

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error("Invalid conversation ID");
      }

      const conversationid = new mongoose.Types.ObjectId(conversationId);

      let conversation;

      if (
        add &&
        add.length > 0 &&
        add.every((item) => typeof item === "string")
      ) {
        conversation =
          await this.conversationRepository.addParticipantsToConversation(
            conversationid,
            add
          );
      }

      if (
        remove &&
        remove.length > 0 &&
        remove.every((item) => typeof item === "string")
      ) {
        conversation =
          await this.conversationRepository.removeParticipantsFromConversation(
            conversationid,
            remove
          );
      } else if (remove.length > 0) {
        console.error(
          "Invalid format for remove, expected an array of strings."
        );
      }

      // Handle group info update
      let groupPhoto: string | undefined = undefined;
      if (req.files) {
        const filesArray = req.files as Express.Multer.File[];
        groupPhoto =
          filesArray && filesArray.length > 0 ? filesArray[0].path : undefined;
      }

      const group: any = {
        name: name,
        photo: groupPhoto,
      };

      if (!(name === undefined && groupPhoto === undefined)) {
        conversation = await this.conversationRepository.updateGroupInfo(
          conversationid,
          group
        );
      }

      return ApiResponse.success(
        res,
        { conversation },
        "Conversation updated successfully",
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

  // Define the controller function for updating events
  async updateEvents(req: express.Request, res: express.Response) {
    try {
      this.setTokenContent((req.kauth?.grant?.access_token as any).content);
      const conversationId = req.params.conversationId;
      const events: string = req.body.event;

      const conversationid = new mongoose.Types.ObjectId(conversationId);

      // Validate conversation ID
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error("Invalid conversation ID");
      }

      // Call the service method to update events
      const inboxChunks = await this.messageRepository.updateEvent(
        conversationid,
        events
      );

      // Send a successful response
      return ApiResponse.success(
        res,
        { inboxChunks },
        "Events updated successfully",
        undefined,
        this.metadata
      );
    } catch (error: any) {
      // Handle errors
      console.log(error.message);
      return ApiResponse.error(
        res,
        error.message,
        error.status ?? 500,
        error.errors,
        this.metadata
      );
    }
  }

  async deleteConversation(req: express.Request, res: express.Response) {
    try {
      this.setTokenContent((req.kauth?.grant?.access_token as any).content);
      const conversationId = req.params.conversationId;
      const conversationid = new mongoose.Types.ObjectId(conversationId);
      const conversation = await this.conversationRepository.deleteConversation(
        conversationid
      );
      return ApiResponse.success(
        res,
        { conversation },
        "Conversation deleted successfully",
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
}

export default conversation;
