import express from "express";
import conversation from "../../controller/conversationController";
import { MessageRepository } from "@one.chat/shared/dist/repositories/MessageRepository";
import { uploadMedia } from "../../middleware/media";
import keycloak from "../../setup/keycloak";
import ConversationRepository from "@one.chat/shared/dist/repositories/ConversationRepository";
import { RedisManager } from "@one.chat/shared/dist/setup/redis";
 
const conversationRouter = express.Router();
const redisClient = RedisManager.getClient( "general" );
const messageRepository = new MessageRepository(redisClient);
const conversationRepository = new ConversationRepository(redisClient);
const conversationController = new conversation(messageRepository, conversationRepository);

conversationRouter.use(keycloak.protect());

conversationRouter.post('/:conversationId?/message/send/',uploadMedia,conversationController.sendMessage.bind(conversationController))
conversationRouter.get('/:conversationId/message/messages',conversationController.getMessages.bind(conversationController))
conversationRouter.delete('/:conversationId/message/:messageId',conversationController.deleteMessage.bind(conversationController))

conversationRouter.post('/group',uploadMedia,conversationController.createConversation.bind(conversationController))
conversationRouter.patch('/:conversationId/group',uploadMedia,conversationController.updateConversation.bind(conversationController))
conversationRouter.patch('/:conversationId/event',conversationController.updateEvents.bind(conversationController))

conversationRouter.delete('/:conversationId',conversationController.deleteConversation.bind(conversationController))

conversationRouter.get('/conversations/selected',conversationController.getConversationsByIds.bind(conversationController))
conversationRouter.get('/conversations',conversationController.getConversationsByParticipant.bind(conversationController))

export default conversationRouter