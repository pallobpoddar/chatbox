"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const conversations_1 = __importDefault(require("../models/conversations"));
const EventAction_1 = __importDefault(require("../utils/EventAction"));
class ConversationRepository {
    tokenContent = {};
    redisClient;
    constructor(redisClient) {
        this.redisClient = redisClient;
    }
    setTokenContent(tokenContent) {
        this.tokenContent = tokenContent;
    }
    async findOrCreate(participants) {
        const existingConversation = await conversations_1.default.findOne({
            group: null,
            participants: {
                $all: participants.map((id) => ({
                    $elemMatch: {
                        id: id,
                    },
                })),
            },
        });
        if (existingConversation) {
            return existingConversation;
        }
        const participantsObjects = participants.map((participant) => ({
            id: participant,
        }));
        const newConversation = await conversations_1.default.create({
            participants: participantsObjects,
            pass: {
                whatsapp: true,
            },
        });
        return newConversation;
    }
    async createGroup(participants, group) {
        if (participants.length < 2) {
            throw new Error("A group must have at least two participants.");
        }
        // Add the creator's ID to the participants array if it's not already included
        const creatorId = this.tokenContent?.sub;
        if (!participants.includes(creatorId)) {
            participants.push(creatorId);
        }
        console.log("Participants", participants);
        const participantsObjects = participants.map((participant) => ({
            id: participant,
            isAdmin: participant === creatorId, // Set isAdmin to true if the participant is the group creator
        }));
        // Ensure group is an object and set default values if name or photo is null or undefined
        const groupData = {
            name: group?.name ?? null,
            photo: group?.photo ?? null,
        };
        // Create a new conversation with the provided group data
        const newConversation = new conversations_1.default({
            participants: participantsObjects,
            group: groupData,
        });
        await newConversation.save();
        console.log("Created new conversation", newConversation);
        console.log("newConversation", newConversation);
        console.log({
            data: {
                action: "createGroup",
                sub: this.tokenContent?.sub,
                conversation: newConversation,
                InboxChunks: [],
            },
        });
        (await this.redisClient).publish("conversations", (0, EventAction_1.default)("group.create", this.tokenContent?.sub, newConversation, []));
        return newConversation;
    }
    async getConversationsByParticipant(participantId, offset, take) {
        if (participantId !== this.tokenContent.sub) {
            throw { status: 403, message: "Permission denied" };
        }
        const lastConversations = await conversations_1.default.aggregate([
            {
                $addFields: {
                    lastMessageTime: { $toDate: "$lastMessageTime" },
                },
            },
            {
                $match: {
                    $expr: {
                        $allElementsTrue: {
                            $map: {
                                input: "$participants",
                                as: "participant",
                                in: {
                                    $or: [
                                        {
                                            $lt: ["$$participant.lastDeleteTime", "$lastMessageTime"],
                                        },
                                        {
                                            $not: {
                                                $ifNull: ["$$participant.lastDeleteTime", false],
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            {
                $sort: { lastMessageTime: -1 },
            },
            {
                $skip: offset,
            },
            {
                $limit: take,
            },
        ]);
        return lastConversations;
    }
    async getConversationsByIds(conversationIds) {
        const conversations = await conversations_1.default.find({
            _id: { $in: conversationIds },
        });
        return conversations;
    }
    async getDMByParticipants(conversationIds) {
        const conversation = await conversations_1.default.findOne({
            participants: {
                $size: 2,
                $all: [
                    { $elemMatch: { id: conversationIds[0] } },
                    { $elemMatch: { id: conversationIds[1] } },
                ],
            },
            group: null,
        });
        if (!conversation) {
            throw new Error("Conversation not found");
        }
        return conversation;
    }
    async addParticipantsToConversation(conversationId, participants) {
        const conversation = await conversations_1.default.findById(conversationId);
        if (!conversation) {
            throw { status: 404, message: "Conversation not found" };
        }
        if (conversation.get("group") === null) {
            throw { status: 400, message: "Conversation is not a group" };
        }
        const isAuthorized = conversation?.participants.some((participant) => participant.id === this.tokenContent.sub);
        if (!isAuthorized) {
            throw { status: 403, message: "Permission denied" };
        }
        const existingParticipantIds = conversation.participants.map((participant) => participant.id);
        const newParticipants = participants.filter((participantId) => !existingParticipantIds.includes(participantId));
        if (newParticipants.length === 0) {
            throw {
                status: 400,
                message: "All participants already exist in the conversation",
            };
        }
        const updatedConversation = await conversations_1.default.findByIdAndUpdate(conversationId, {
            $addToSet: {
                participants: { $each: newParticipants.map((id) => ({ id })) },
            },
        }, { new: true });
        (await this.redisClient).publish("conversations", (0, EventAction_1.default)("conversation.updated", this.tokenContent?.sub, updatedConversation, []));
        return updatedConversation;
    }
    async removeParticipantsFromConversation(conversationId, participants) {
        const conversation = await conversations_1.default.findById(conversationId);
        if (!conversation) {
            throw { status: 404, message: "Conversation not found" };
        }
        if (conversation.get("group") === null) {
            throw { status: 400, message: "Conversation is not a group" };
        }
        const isAuthorized = conversation?.participants.some((participant) => participant.id === this.tokenContent.sub && participant.isAdmin === true);
        if (!isAuthorized) {
            throw { status: 403, message: "Permission denied" };
        }
        const updatedConversation = await conversations_1.default.findByIdAndUpdate(conversationId, { $pull: { participants: { id: { $in: participants } } } }, { new: true });
        (await this.redisClient).publish("conversations", (0, EventAction_1.default)("conversation.update", this.tokenContent?.sub, updatedConversation, []));
        return updatedConversation;
    }
    async updateGroupInfo(conversationId, group) {
        const conversation = await conversations_1.default.findById(conversationId);
        if (!conversation) {
            throw { status: 404, message: "Conversation not found" };
        }
        if (conversation.get("group") === null) {
            throw { status: 400, message: "Conversation is not a group" };
        }
        const isAuthorized = conversation?.participants.some((participant) => participant.id === this.tokenContent.sub);
        if (!isAuthorized) {
            throw { status: 403, message: "Permission denied" };
        }
        const updateFields = {};
        if (group.name !== undefined)
            updateFields["group.name"] = group.name;
        if (group.photo !== undefined)
            updateFields["group.photo"] = group.photo;
        const updatedConversation = await conversations_1.default.findOneAndUpdate({ _id: conversationId }, { $set: updateFields }, { new: true });
        (await this.redisClient).publish("conversations", (0, EventAction_1.default)("conversation.updated", this.tokenContent?.sub, updatedConversation, []));
        return updatedConversation;
    }
    async deleteConversation(conversationId) {
        const conversation = await conversations_1.default.findById(conversationId);
        if (!conversation) {
            throw { status: 404, message: "Conversation not found" };
        }
        const isAuthorized = conversation?.participants.some((participant) => participant.id === this.tokenContent.sub);
        if (!isAuthorized) {
            throw { status: 403, message: "Permission denied" };
        }
        const updatedConversation = await conversations_1.default.findOneAndUpdate({
            _id: conversationId,
            participants: {
                $elemMatch: { id: this.tokenContent.sub },
            },
        }, {
            $set: {
                "participants.$.lastDeleteTime": new Date(),
            },
        }, { new: true });
        (await this.redisClient).publish("conversations", (0, EventAction_1.default)("conversation.deleted", this.tokenContent?.sub, updatedConversation, []));
        return updatedConversation;
    }
}
exports.default = ConversationRepository;
