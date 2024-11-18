import express from "express";
import ManagerRepository from "@one.chat/shared/dist/repositories/ManagerRepository";
import { RedisManager } from "@one.chat/shared/dist/setup/redis";
import ManagerController from "../../controllers/managerController";
import keycloak from "../../setup/keycloak";
import { uploadMedia } from "../../middleware/media";
import MessageSupportController from "../../controllers/messageSupportController";
import MessageSupportRepository from "../../repositories/messageSupportRepository";
import ConversationRepository from "@one.chat/shared/dist/repositories/ConversationRepository";
import { MessageRepository } from "@one.chat/shared/dist/repositories/MessageRepository";

const supportRouter = express.Router();

const managerRepository = new ManagerRepository(
  RedisManager.getClient("general")
);
const managerController = new ManagerController(managerRepository);

const messageSupportRepository = new MessageSupportRepository(
  RedisManager.getClient("general")
);
const conversationRepository = new ConversationRepository(
  RedisManager.getClient("general")
);
const messageRepository = new MessageRepository(
  RedisManager.getClient("general")
);

const messageSupportController = new MessageSupportController(
  messageSupportRepository,
  conversationRepository,
  messageRepository
);

supportRouter.use(keycloak.protect());

supportRouter.post(
  "/managers",
  managerController.createManager.bind(managerController)
);

supportRouter.post(
  "/managers/:userId",
  managerController.createManagerWithUserId.bind(managerController)
)

supportRouter.get(
  "/manager",
  managerController.getManager.bind(managerController)
);

supportRouter.get(
  "/managers",
  managerController.getAllManager.bind(managerController)
);

supportRouter.patch(
  "/managers/add",
  managerController.addManagers.bind(managerController)
);

supportRouter.patch(
  "/managers/add/:ownerId",
  managerController.addManagersByOwnerId.bind(managerController)
)

supportRouter.patch(
  "/managers/remove",
  managerController.removeManagers.bind(managerController)
);

supportRouter.delete(
  "/managers",
  managerController.deleteManager.bind(managerController)
);

supportRouter.post(
  "/:conversationId?/messages",
  uploadMedia,
  messageSupportController.sendMessage.bind(messageSupportController)
);

supportRouter.get(
  "/conversations",
  messageSupportController.getConversationsByIds.bind(messageSupportController)
);

supportRouter.get(
  "/:conversationId/messages",
  messageSupportController.getMessages.bind(messageSupportController)
);

supportRouter.patch(
  "/:conversationId/distributions",
  messageSupportController.closeConversation.bind(messageSupportController)
);

export default supportRouter;
