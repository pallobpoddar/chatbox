import { WhatsAppService } from "@one.chat/shared/dist/services/whatsapp";
import { Request } from "express";
import {
  URL,
  senderPhoneNumberId,
  whatsappAPIKey,
} from "@one.chat/shared/dist/config/config";
import { IntegrationRepository } from "../repositories/whatsapp.integration";
import { RedisManager } from "@one.chat/shared/dist/setup/redis";

export class ThirdPartyService {
  private kcClient: any;
  constructor(kcClient: any) {
    this.kcClient = kcClient;
  }

  async processMessage(message: string) {
    const data = JSON.parse(message);
    //destructure data from redis queue
    const senderUserId = data.sub;
    const messaging_content =
      data.InboxChunks[0].messages[0]?.content || undefined;
    const media = data.InboxChunks[0].messages[0]?.media[0]?.path || undefined;
    const ManualType = data.manualType || undefined;
    let context = data.InboxChunks[0].messages[0]?.context || undefined;

    try {
      console.log("data", ManualType);
      const integrationRepository = new IntegrationRepository();
      integrationRepository.setKcClient(this.kcClient);
      const conversationData: any =
        await integrationRepository.getPhoneAndCheckPlatform(
          senderUserId,
          "whatsapp"
        );
      if (conversationData.platformExists === false) {
        throw new Error("platform not found");
      }
      console.log("conversationData", conversationData);

      //context ref search
      if (context) {
        context = await integrationRepository.getSourceRefIdFromMessage(
          context,
          "whatsapp"
        );
      }
      // console.log(recipientUserId)
      let whatsAppService = new WhatsAppService(
        conversationData.senderPhoneNumberId,
        conversationData.whatsAppApiKey,
        {}
      );

      //create payload
      const payload = await whatsAppService.createPayload(
        conversationData.phoneNoId[0],
        messaging_content,
        media,
        ManualType,
        context
      );

      //Initiate WhatsApp service with own business phoen number from database
      whatsAppService = new WhatsAppService(
        conversationData.senderPhoneNumberId,
        conversationData.whatsAppApiKey,
        payload
      );
      const response = await whatsAppService.sendMessage();

      //Update message source if sent successfully
      if (response.status === 200) {
        await integrationRepository.updateMessageSource(
          data.InboxChunks[0].messages[0]._id,
          "whatsapp",
          response.data.messages[0].id
        );
      } else {
        throw new Error("Failed to send message");
      }
      console.log(`Response from WhatsApp service:`, response.data);
    } catch (error) {
      console.error("Failed to process message for WhatsApp service:", error);
      //Increment retry count and requeue the message if sending fails
      if (data.retryCount < 1) {
        data.retryCount++;
        // Requeue the message if sending fails
        await (
          await RedisManager.getClient("general")
        ).rpush("thirdparty:outgoing", JSON.stringify(data));
      } else {
        data.action = "failed";
        await (
          await RedisManager.getClient("general")
        ).rpush("thirdparty:incoming", JSON.stringify(data));
      }
    }
  }
}
