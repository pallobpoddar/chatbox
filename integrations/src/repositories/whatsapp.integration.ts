import IntegrationModel from "../models/integration";
import jwt from "jsonwebtoken";
import { Integration } from "../models/interfaces/integration";
import { JWT_SECRET } from "../config/config";
import ConversationModel from "@one.chat/shared/dist/models/conversations";
import InboxChunkModel from "@one.chat/shared/dist/models/inboxChunks";
import { WhatsAppService } from "@one.chat/shared/dist/services/whatsapp";
import Keycloak from "@one.chat/shared/dist/setup/keycloak.js";
import mongoose, { Types } from "mongoose";
import { getNonFilterableFields } from "@one.chat/shared/dist/utils/ParamDecoder";

export class IntegrationRepository {
  private jwtSecret: any = JWT_SECRET;
  private KcClient: any;
  private fullName: string | undefined;
  private filerableFields = ["userId", "whatsApp.phoneNoId"];

  public setKcClient(KcClient: any) {
    this.KcClient = KcClient;
  }

  public setFullName(fullName: string) {
    this.fullName = fullName;
  }

  async createIntegration(
    userId: string,
    data: { phoneNoId: string; apiKey: string }
  ): Promise<Integration> {
    try {
      // Generate JWT token with the user ID and a secret
      const token = jwt.sign({ userId, phone: data.phoneNoId }, this.jwtSecret);

      // Ensure that the necessary fields are provided
      if (!data.phoneNoId || !data.apiKey) {
        throw new Error("phoneNoId and apiKey are required");
      }

      // Set up the WhatsApp and test fields with appropriate defaults
      const whatsAppData = {
        phoneNoId: data.phoneNoId,
        apiKey: data.apiKey,
        webhook: {
          token, // Use the generated JWT token as the webhook token
        },
      };

      const testData = {
        send: null,
        received: null,
      };

      // Create a new Integration document
      const integration = new IntegrationModel({
        userId,
        whatsApp: whatsAppData,
        test: testData,
      });

      const integrations = await integration.save();
      // Save the document to the database and return it
      return integrations;
    } catch (error) {
      throw error;
    }
  }

  async getPhoneAndCheckPlatform(
    senderUserId: string,
    platform: string
  ): Promise<{
    phoneNoId: string | null;
    platformExists: boolean | undefined;
    senderPhoneNumberId?: string | null;
    whatsAppApiKey?: string | null;
  }> {
    const platformField = `pass.${platform}`;

    const conversation = await ConversationModel.findOne({
      "participants.id": senderUserId,
      [platformField]: true,
      group: null,
    }).lean();

    if (!conversation) {
      return { phoneNoId: null, platformExists: false };
    }

    const recipient: any = conversation.participants.find(
      (participant: { id: any }) => participant.id !== senderUserId
    );

    console.log("sender insie integration repo", senderUserId);

    const recipientInfo = await this.KcClient.users.findOne({
      id: recipient.id,
    });

    const senderPhoneNumberId = await IntegrationModel.findOne({
      userId: senderUserId,
    });

    return {
      phoneNoId: recipientInfo.attributes.phone,
      platformExists: true,
      senderPhoneNumberId: senderPhoneNumberId?.whatsApp?.phoneNoId,
      whatsAppApiKey: senderPhoneNumberId?.whatsApp?.apiKey,
    };
  }

  async getSourceRefIdFromMessage(messageId: string, platform: string) {
    try {
      const messageid = new Types.ObjectId(messageId);
      // Find the message within the InboxChunk that matches the provided messageId
      const inboxChunk = await InboxChunkModel.findOne(
        { "messages._id": messageid },
        { "messages.$": 1 } // Only select the specific message
      );

      if (!inboxChunk || inboxChunk.messages.length === 0) {
        return null;
      }

      const message = inboxChunk.messages[0];

      // Check if the refId is in the source field
      if (message.source?.platform === platform) {
        return message.source.refId;
      }

      // Check if the refId is in the pass field
      const passEntry = message?.pass?.find(
        (entry: { platform: string }) => entry.platform === platform
      );
      if (passEntry) {
        return passEntry.refId;
      }

      // If neither field contains the refId for the specified platform
      return null;
    } catch (error) {
      console.error("Error retrieving refId:", error);
      throw error;
    }
  }

  async updateMessageSource(
    messageId: string,
    platform: string,
    refId: string
  ) {
    const messageObjectId = new Types.ObjectId(messageId);

    // Update the specific field in the pass array within the messages array
    const result = await InboxChunkModel.updateOne(
      { "messages._id": messageObjectId },
      {
        $set: {
          "messages.$[msg].pass.0.platform": platform, // Updating the first element in the pass array
          "messages.$[msg].pass.0.refId": refId, // Updating the first element in the pass array
          "messages.$[msg].pass.0.error": null,
        },
      },
      {
        arrayFilters: [{ "msg._id": messageObjectId }],
      }
    );
  }

  async updateErrorInPass(messageId: string, messageContent: string) {
    const messageObjectId = new Types.ObjectId(messageId);

    // Update the specific field in the pass array within the messages array
    const result = await InboxChunkModel.updateOne(
      { "messages._id": messageObjectId },
      {
        $set: {
          "messages.$[msg].pass.0.error": messageContent, // Updating the first element in the pass array
        },
      },
      {
        arrayFilters: [{ "msg._id": messageObjectId }],
      }
    );
  }

  async getIntegrationByPhoneNoId(phoneNoId: string) {
    const integration = await IntegrationModel.findOne({
      "whatsApp.phoneNoId": phoneNoId,
    } as any);

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Check if the WhatsApp token is null
    if (!integration.whatsApp.webhook.token) {
      // Generate JWT token with the user ID
      const token = jwt.sign({ userId: integration.userId }, this.jwtSecret);

      // Update the integration with the new token
      integration.whatsApp.webhook.token = token;
      await integration.save();
    }

    // Return the integration data
    return integration;
  }

  async checkPlatformPass(
    participantId: string,
    platform: string
  ): Promise<boolean> {
    const platformField = `pass.${platform}`;

    const conversation = await ConversationModel.findOne({
      "participants.id": participantId,
      [platformField]: true,
    })
      .select(platformField)
      .lean();

    return conversation !== null;
  }

  async decodeMessage(message: string) {
    return WhatsAppService.decodeIncomingMessage(message);
  }

  async getApiKey(phoneNoId: string): Promise<string | null> {
    try {
      const integration = await IntegrationModel.findOne({
        "whatsApp.phoneNoId": phoneNoId,
      });
      if (!integration) {
        throw new Error(`Integration with phoneNoId ${phoneNoId} not found.`);
      }
      return integration.whatsApp.apiKey;
    } catch (error) {
      console.error(
        `Error fetching API key for phoneNoId ${phoneNoId}:`,
        error
      );
      throw new Error("Failed to fetch API key");
    }
  }

  async searchUserByPhoneNumber(phoneNumber: string) {
    try {
      // Fetch all users
      const users = await await this.KcClient.users.find();

      // Filter users by matching the phone number in the attributes
      const filteredUsers = users.filter(
        (user: { attributes: { phone: string | string[] } }) =>
          user.attributes?.phone?.includes(phoneNumber)
      );

      if (filteredUsers.length === 0) {
        // If no user found, create a new user
        const fullName: any = this.fullName; // Example name
        const phoneNoId = phoneNumber.replace("+", ""); // Remove the "+" for id use
        const [firstName, lastName] = fullName.split(" ");

        const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}.${phoneNoId}`;
        const password = "123"; // Example password

        // Create the user in Keycloak
        const newUser = await this.KcClient.users.create({
          username: username,
          enabled: true,
          firstName: firstName,
          lastName: lastName,
          emailVerified: false,
          attributes: {
            phone: phoneNumber,
          },
          credentials: [
            {
              type: "password",
              value: password,
              temporary: false,
            },
          ],
        });

        console.log("New user created:", newUser);
        this.searchUserByPhoneNumber(phoneNumber);
        return [newUser];
      }

      return filteredUsers;
    } catch (error) {
      console.error("Error fetching users by phone number:", error);
      throw new Error("Failed to fetch users by phone number");
    }
  }
  //TODO: add pagination with proper count and offset filterable fields define in integration model
  async getIntegrations(
    skip: number,
    limit: number,
    filters: any = {},
    sort: any[] = []
  ) {
    getNonFilterableFields(filters, this.filerableFields);

    // Create the base query object from filters
    let query: any = {};

    // Apply filters from FilterParamsDecoder
    Object.keys(filters).forEach((key) => {
      if (filters[key] instanceof Object) {
        // Handle nested query operations (like $gt, $lt)
        query[key] = filters[key];
      } else {
        // Handle simple equality operations
        query[key] = filters[key];
      }
    });

    // Apply sorting from SortParamsDecoder
    const sortOptions: any = sort.reduce((acc, [field, order]) => {
      acc[field] = order;
      return acc;
    }, {});

    // Fetch the total count of records using hint for optimized performance
    const totalItems = await IntegrationModel.countDocuments(query)
      .hint({ userId: 1 }) // Hint to use the `userId` index
      .exec();

    // Fetch the paginated data
    const integrations = await IntegrationModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort(sortOptions)
      .exec();

    return { integrations, totalItems };
  }

  async updateWhatsAppCredentials(userId: string, phoneNoId: string, apiKey: string): Promise<Integration | null> {
    return await IntegrationModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          "whatsApp.phoneNoId": phoneNoId,
          "whatsApp.apiKey": apiKey,
        },
      },
      { new: true } // Return the updated document
    ).lean(); // To return a plain JavaScript object instead of a Mongoose document
  }

  async deleteIntegration(userId: string): Promise<Integration | null> {
    return await IntegrationModel.findOneAndDelete({ userId });
  }
}
