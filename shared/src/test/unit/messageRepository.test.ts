import mongoose from "mongoose";
import conversations from "../../models/conversations";
import inboxChunks from "../../models/inboxChunks";
import { MessageRepository } from "../../repositories/MessageRepository";
import { connectDb } from "../../seeds/environment";
import { generateFakeConversation } from "../../seeds/faker/conversation";
import { generateFakeMessage } from "../../seeds/faker/message";
import { faker } from "@faker-js/faker";
import { RedisManager } from "../../setup/redis";

describe("MessageRepository", () => {
  let redisClient: any = null;

  beforeAll(async () => {
    await connectDb();
    await conversations.deleteMany();
    await inboxChunks.deleteMany();
    RedisManager.init();
    redisClient = RedisManager.client();
    console.log("Running setup before all tests");
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("create 3 new conversation", async () => {
    for (let i = 0; i < 3; i++) {
      const fakeConversation = generateFakeConversation(2);
      await conversations.create(fakeConversation);
    }
  });

  it("push a new message in conversation", async () => {
    const conversation = await conversations.findOne();
    const participantIds = conversation?.participants.map(
      (participant) => participant.id
    );

    const messageRepository = new MessageRepository(redisClient);

    let inboxChunk = await messageRepository.addMessage(
      conversation?.id,
      generateFakeMessage(faker.helpers.arrayElement(participantIds ?? []))
    );

    expect(inboxChunk).not.toBeNull();
    expect(inboxChunk?.chunkSerial).toBe(1);
    expect(inboxChunk?.messages).toHaveLength(1);
  });

  it("if chunk is full it will create new one", async () => {
    let conversation = await conversations.findOne();
    const participantIds = conversation?.participants.map(
      (participant) => participant.id
    );

    const messageRepository = new MessageRepository(redisClient);

    let inboxChunk;
    for (let i = 0; i < 21; i++)
      inboxChunk = await messageRepository.addMessage(
        conversation?.id,
        generateFakeMessage(
          faker.helpers.arrayElement(participantIds ?? []),
          1,
          1
        )
      );

    expect(inboxChunk).not.toBeNull();
    expect(inboxChunk?.chunkSerial).toBe(2);
    expect(inboxChunk?.messages).toHaveLength(2);

    conversation = await conversations.findById(conversation?.id);
    expect(conversation?.totalMessages).toBe(22);
  });

  it("delete a message", async () => {
    const conversation = await conversations.findOne().sort();
    const inboxChunk = await inboxChunks
      .findOne({
        conversationId: conversation?._id,
      })
      .sort({ chunkSerial: 1 });

    const message = inboxChunk!.messages[0];
    const messageRepository = new MessageRepository(redisClient);

    const targetMessage = await messageRepository.deleteMessage(
      conversation?.id,
      message._id as any
    );

    expect(targetMessage.messages[0].isDeleted).toBe(true);
  });
});
