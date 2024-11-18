"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ConversationRepository_1 = __importDefault(require("../../repositories/ConversationRepository"));
const conversations_1 = __importDefault(require("../../models/conversations"));
const environment_1 = require("../../seeds/environment");
const mongoose_1 = __importDefault(require("mongoose"));
const conversation_1 = require("../../seeds/faker/conversation");
describe("ConversationRepository", () => {
    const conversationRepository = new ConversationRepository_1.default();
    beforeAll(async () => {
        await (0, environment_1.connectDb)();
        await conversations_1.default.deleteMany();
        console.log("Running setup before all tests");
    });
    afterAll(async () => {
        await mongoose_1.default.connection.close();
    });
    it("should create conversation with two participants and no group", async () => {
        const participants = (0, conversation_1.generateFakeConversation)(2).participants;
        const participantIds = participants.map((participant) => participant.id.toString());
        const result = await conversationRepository.findOrCreate(participantIds);
        expect(result).not.toBeNull();
        expect(result.participants).toEqual([
            expect.objectContaining({
                id: participantIds[0],
            }),
            expect.objectContaining({
                id: participantIds[1],
            }),
        ]);
        // expect(result!.get("group")).toBeNull();
        expect(result.totalMessages).toBe(0);
    });
    it("should create conversation with three participants and a group", async () => {
        const conversations = (0, conversation_1.generateFakeConversation)(3);
        const participants = conversations.participants;
        const participantIds = participants.map((participant) => participant.id.toString());
        const group = conversations.group;
        const result = await conversationRepository.findOrCreate(participantIds);
        expect(result).not.toBeNull();
        expect(result.participants).toEqual([
            expect.objectContaining({
                id: participantIds[0],
            }),
            expect.objectContaining({
                id: participantIds[1],
            }),
            expect.objectContaining({
                id: participantIds[2],
            }),
        ]);
        // expect(result!.get("group")).toEqual(group);
        expect(result.totalMessages).toBe(0);
    });
    it("should throw an error if conversation already exists", async () => {
        const conversation = await conversations_1.default.findOne({
            participants: { $size: 2 },
        });
        const participantIds = conversation.participants.map((participant) => participant.id.toString());
        const reverseParticipantIds = participantIds.reverse();
        await expect(conversationRepository.findOrCreate(participantIds)).rejects.toThrow("Conversation already exists");
        await expect(conversationRepository.findOrCreate(reverseParticipantIds)).rejects.toThrow("Conversation already exists");
    });
    it("should add two participants to conversation", async () => {
        const conversation = await conversations_1.default.findOne({
            group: { $ne: null },
        });
        const participants = (0, conversation_1.generateFakeConversation)(2).participants;
        const participantIds = participants.map((participant) => participant.id.toString());
        const result = await conversationRepository.addParticipantsToConversation(conversation?.id, participantIds);
        const expectedParticipants = [
            ...conversation.participants.map((participant) => ({
                id: participant.id.toString(),
            })),
            ...participants.map((participant) => ({ id: participant.id.toString() })),
        ];
        expect(result?.participants).toEqual(expect.arrayContaining(expectedParticipants.map((expected) => expect.objectContaining(expected))));
    });
    it("should remove two participants from a conversation", async () => {
        const conversation = await conversations_1.default.findOne({
            group: { $ne: null },
        });
        const participants = [
            conversation.participants[0].id,
            conversation.participants[1].id,
        ];
        const result = await conversationRepository.removeParticipantsFromConversation(conversation.id, participants);
        const expectedParticipants = conversation.participants.filter((participant) => !participants.includes(participant.id));
        expect(result?.participants.every((participant, index) => participant.id === expectedParticipants[index].id)).toBe(true);
    });
    it("should update only the group name", async () => {
        const conversation = await conversations_1.default.findOne({
            $expr: {
                $gt: [{ $size: "$participants" }, 2],
            },
        });
        const updatedConversation = await conversationRepository.updateGroupInfo(conversation.id, {
            name: "New Group Name",
        });
        expect(updatedConversation.group.name).toEqual("New Group Name");
    });
    it("should update only the group photo", async () => {
        const conversation = await conversations_1.default.findOne({
            $expr: {
                $gt: [{ $size: "$participants" }, 2],
            },
        });
        const updatedConversation = await conversationRepository.updateGroupInfo(conversation.id, {
            photo: "new-photo-url",
        });
        expect(updatedConversation.group.photo).toEqual("new-photo-url");
    });
    it("should update both the group name and photo", async () => {
        const conversation = await conversations_1.default.findOne({
            $expr: {
                $gt: [{ $size: "$participants" }, 2],
            },
        });
        const updatedConversation = await conversationRepository.updateGroupInfo(conversation.id, {
            name: "Updated Group Name",
            photo: "updated-photo-url",
        });
        expect(updatedConversation.group.name).toEqual("Updated Group Name");
        expect(updatedConversation.group.photo).toEqual("updated-photo-url");
    });
    it("should preserve group name and photo if neither is provided", async () => {
        const conversation = await conversations_1.default.findOne({
            $expr: {
                $gt: [{ $size: "$participants" }, 2],
            },
        });
        const updatedConversation = await conversationRepository.updateGroupInfo(conversation.id, {});
        expect(updatedConversation.group.name).toEqual("Updated Group Name");
        expect(updatedConversation.group.photo).toEqual("updated-photo-url");
    });
    it("should throw an error if conversation not found", async () => {
        const conversationId = (0, conversation_1.generateFakeConversation)(1)._id;
        const participants = (0, conversation_1.generateFakeConversation)(2).participants;
        const participantIds = participants.map((participant) => participant.id.toString());
        await expect(conversationRepository.addParticipantsToConversation(conversationId, participantIds)).rejects.toThrow("Conversation not found");
        await expect(conversationRepository.removeParticipantsFromConversation(conversationId, participantIds)).rejects.toThrow("Conversation not found");
        await expect(conversationRepository.updateGroupInfo(conversationId, { name: "Name" })).rejects.toThrow("Conversation not found");
    });
    it("should throw an error when mutating a group which is not a group", async () => {
        const conversation = await conversations_1.default.findOne({ group: null });
        const participants = (0, conversation_1.generateFakeConversation)(2).participants;
        const participantIds = participants.map((participant) => participant.id.toString());
        await expect(conversationRepository.addParticipantsToConversation(conversation?.id, participantIds)).rejects.toThrow("Conversation is not a group");
        await expect(conversationRepository.removeParticipantsFromConversation(conversation?.id, participantIds)).rejects.toThrow("Conversation is not a group");
        await expect(conversationRepository.updateGroupInfo(conversation.id, {
            name: "Updated Group Name",
            photo: "updated-photo-url",
        })).rejects.toThrow("Conversation is not a group");
    });
});
