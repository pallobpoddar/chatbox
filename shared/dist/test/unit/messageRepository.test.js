"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const conversations_1 = __importDefault(require("../../models/conversations"));
const inboxChunks_1 = __importDefault(require("../../models/inboxChunks"));
const MessageRepository_1 = require("../../repositories/MessageRepository");
const environment_1 = require("../../seeds/environment");
const conversation_1 = require("../../seeds/faker/conversation");
const message_1 = require("../../seeds/faker/message");
const faker_1 = require("@faker-js/faker");
const redis_1 = require("../../setup/redis");
describe("MessageRepository", () => {
    let redisClient = null;
    beforeAll(async () => {
        await (0, environment_1.connectDb)();
        await conversations_1.default.deleteMany();
        await inboxChunks_1.default.deleteMany();
        redis_1.RedisManager.init();
        redisClient = redis_1.RedisManager.client();
        console.log("Running setup before all tests");
    });
    afterAll(async () => {
        await mongoose_1.default.connection.close();
    });
    it("create 3 new conversation", async () => {
        for (let i = 0; i < 3; i++) {
            const fakeConversation = (0, conversation_1.generateFakeConversation)(2);
            await conversations_1.default.create(fakeConversation);
        }
    });
    it("push a new message in conversation", async () => {
        const conversation = await conversations_1.default.findOne();
        const participantIds = conversation?.participants.map((participant) => participant.id);
        const messageRepository = new MessageRepository_1.MessageRepository(redisClient);
        let inboxChunk = await messageRepository.addMessage(conversation?.id, (0, message_1.generateFakeMessage)(faker_1.faker.helpers.arrayElement(participantIds ?? [])));
        expect(inboxChunk).not.toBeNull();
        expect(inboxChunk?.chunkSerial).toBe(1);
        expect(inboxChunk?.messages).toHaveLength(1);
    });
    it("if chunk is full it will create new one", async () => {
        let conversation = await conversations_1.default.findOne();
        const participantIds = conversation?.participants.map((participant) => participant.id);
        const messageRepository = new MessageRepository_1.MessageRepository(redisClient);
        let inboxChunk;
        for (let i = 0; i < 21; i++)
            inboxChunk = await messageRepository.addMessage(conversation?.id, (0, message_1.generateFakeMessage)(faker_1.faker.helpers.arrayElement(participantIds ?? []), 1, 1));
        expect(inboxChunk).not.toBeNull();
        expect(inboxChunk?.chunkSerial).toBe(2);
        expect(inboxChunk?.messages).toHaveLength(2);
        conversation = await conversations_1.default.findById(conversation?.id);
        expect(conversation?.totalMessages).toBe(22);
    });
    it("delete a message", async () => {
        const conversation = await conversations_1.default.findOne().sort();
        const inboxChunk = await inboxChunks_1.default
            .findOne({
            conversationId: conversation?._id,
        })
            .sort({ chunkSerial: 1 });
        const message = inboxChunk.messages[0];
        const messageRepository = new MessageRepository_1.MessageRepository(redisClient);
        const targetMessage = await messageRepository.deleteMessage(conversation?.id, message._id);
        expect(targetMessage.messages[0].isDeleted).toBe(true);
    });
});
