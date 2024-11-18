"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRepository = void 0;
const inboxChunks_1 = __importDefault(require("../models/inboxChunks"));
const conversations_1 = __importDefault(require("../models/conversations"));
const EventAction_1 = __importDefault(require("../utils/EventAction"));
const managers_1 = __importDefault(require("../models/managers"));
class MessageRepository {
    static chunkMessageLimit = 20;
    redisClient;
    tokenContent = {};
    manualType;
    constructor(redisClient) {
        this.redisClient = redisClient;
    }
    setTokenContent(tokenContent) {
        this.tokenContent = tokenContent;
    }
    setManualType(manualType) {
        this.manualType = manualType || undefined;
    }
    async addMessage(conversationId, message, isAgentSent = false) {
        const targetConversation = await conversations_1.default.findById(conversationId);
        if (!targetConversation) {
            throw { status: 404, message: "Conversation not found" };
        }
        const isAuthorized = targetConversation?.participants.some((participant) => participant.id === this.tokenContent.sub) || isAgentSent === true;
        if (!isAuthorized) {
            throw { status: 403, message: "Permission denied" };
        }
        let lastInboxChunk;
        lastInboxChunk = await inboxChunks_1.default.findOne({
            conversationId: conversationId,
        }).sort({ chunkSerial: -1 });
        if (!lastInboxChunk) {
            lastInboxChunk = await inboxChunks_1.default.create({
                conversationId: conversationId,
                chunkSerial: 1,
            });
        }
        if (lastInboxChunk.messages.length === MessageRepository.chunkMessageLimit) {
            try {
                lastInboxChunk = await inboxChunks_1.default.create({
                    conversationId: conversationId,
                    chunkSerial: lastInboxChunk.chunkSerial + 1,
                });
            }
            catch (error) {
                lastInboxChunk = await inboxChunks_1.default.findOne({
                    conversationId: conversationId,
                    chunkSerial: lastInboxChunk.chunkSerial + 1,
                });
                if (!lastInboxChunk) {
                    throw new Error("No inbox chunk found");
                }
            }
        }
        lastInboxChunk = await inboxChunks_1.default.findByIdAndUpdate(lastInboxChunk._id, {
            $push: { messages: message },
        }, { new: true });
        if (!lastInboxChunk) {
            throw { status: 404, message: "Inbox chunk not found" };
        }
        const conversation = await conversations_1.default.findByIdAndUpdate(conversationId, { $inc: { totalMessages: 1 }, lastMessageTime: new Date() }, { new: true });
        lastInboxChunk.messages = [
            lastInboxChunk.messages[lastInboxChunk.messages.length - 1],
        ];
        const participantIds = conversation?.participants
            .filter((participant) => participant.id !== this.tokenContent.sub)
            .map((participant) => participant.id);
        const manager = await managers_1.default.findOne({
            userId: { $in: participantIds },
        });
        if (conversation?.pass) {
            (await this.redisClient).rpush("thirdparty:outgoing", (0, EventAction_1.default)("sent", this.tokenContent?.sub, conversation, [lastInboxChunk], 0, this.manualType));
        }
        (await this.redisClient).publish("conversations", (0, EventAction_1.default)("sent", this.tokenContent?.sub, conversation, [
            lastInboxChunk,
        ]));
        if (manager) {
            (await this.redisClient).rpush("distribution:incoming", (0, EventAction_1.default)("sent", this.tokenContent?.sub, conversation, [lastInboxChunk], 0, this.manualType));
        }
        return lastInboxChunk;
    }
    async getMessages(conversationId, page) {
        const targetConversation = await conversations_1.default.findById(conversationId);
        if (!targetConversation) {
            throw { status: 404, message: "Conversation not found" };
        }
        const isAuthorized = targetConversation?.participants.some((participant) => participant.id === this.tokenContent.sub);
        if (!isAuthorized) {
            throw { status: 403, message: "Permission denied" };
        }
        const targetParticipant = targetConversation?.participants.find((participant) => participant.lastDeleteTime !== null &&
            participant.id === this.tokenContent.sub);
        const lastInboxChunks = await inboxChunks_1.default.find({
            conversationId: conversationId,
        })
            .sort({ chunkSerial: -1 })
            .skip(page)
            .limit(2);
        lastInboxChunks.map((chunk) => {
            chunk.messages = chunk.messages.filter((message) => message.sent &&
                targetParticipant &&
                targetParticipant.lastDeleteTime !== undefined &&
                targetParticipant.lastDeleteTime !== null
                ? message.sent > targetParticipant.lastDeleteTime
                : message);
        });
        return lastInboxChunks;
    }
    async deleteMessage(conversationId, messageId) {
        const conversation = await conversations_1.default.findById(conversationId);
        if (!conversation) {
            throw { status: 404, message: "Conversation not found" };
        }
        const inboxChunk = await inboxChunks_1.default.findOne({ conversationId: conversationId, "messages._id": messageId }, {
            messages: { $elemMatch: { _id: messageId } },
        });
        const isAuthorized = this.tokenContent.sub === inboxChunk?.messages[0].sender;
        if (!isAuthorized) {
            throw { status: 403, message: "Permission denied" };
        }
        const targetMessage = await inboxChunks_1.default.findOneAndUpdate({
            conversationId: conversationId,
            "messages._id": messageId,
        }, { $set: { "messages.$.isDeleted": true } }, { new: true });
        if (!targetMessage) {
            throw { status: 500, message: "Message could not be deleted" };
        }
        targetMessage.messages = targetMessage.messages.filter((msg) => msg.id == messageId);
        (await this.redisClient).publish("conversations", (0, EventAction_1.default)("deleted", this.tokenContent?.sub, conversation, [
            targetMessage,
        ]));
        return targetMessage;
    }
    //A huge refactor remain in this function
    async updateEvent(conversationId, event) {
        const fieldToUpdate = event === "seen" ? "seen" : "delivered";
        const updatedChunks = [];
        // Start by getting the latest chunk
        let latestChunk = await inboxChunks_1.default.findOne({
            conversationId: conversationId,
        }).sort({ chunkSerial: -1 });
        if (!latestChunk) {
            throw {
                status: 404,
                message: "No inbox chunks found for the conversation",
            };
        }
        // Loop through chunks from the latest to the oldest
        while (latestChunk) {
            // We'll iterate over the messages array backwards
            let updatedMessages = [];
            let isUpdated = false;
            // Reverse the messages array to start updating from the last message
            for (let i = latestChunk.messages.length - 1; i >= 0; i--) {
                const message = latestChunk.messages[i];
                // Skip messages sent by the current user
                if (message.sender === this.tokenContent?.sub)
                    continue;
                // Update if the seen or delivered field is null
                if (message[fieldToUpdate] === null) {
                    message[fieldToUpdate] = new Date();
                    updatedMessages.push(message);
                    isUpdated = true;
                }
            }
            // If we updated any messages, save the chunk and add to the results
            if (isUpdated) {
                await latestChunk.save();
                updatedChunks.push({
                    conversationId: latestChunk.conversationId,
                    chunkSerial: latestChunk.chunkSerial,
                    messages: updatedMessages,
                });
            }
            // Move to the previous chunk (if any)
            latestChunk = await inboxChunks_1.default.findOne({
                conversationId: conversationId,
                chunkSerial: latestChunk.chunkSerial - 1,
            });
        }
        if (updatedChunks.length === 0) {
            throw { status: 404, message: "No messages found to update" };
        }
        // Retrieve the current state of the conversation document
        const conversation = await conversations_1.default.findOne({
            _id: conversationId,
            "participants.id": this.tokenContent?.sub,
        });
        if (!conversation) {
            throw { status: 404, message: "Conversation not found" };
        }
        // Get existing totalMessages count
        const currentCount = conversation.totalMessages || 0;
        // Update the conversation document with the new totalMessages
        const updatedConversation = await conversations_1.default.findOneAndUpdate({ _id: conversationId, "participants.id": this.tokenContent?.sub }, {
            $set: {
                [`participants.$.info.${event}`]: currentCount,
                lastMessageTime: new Date(), // Set the last message time to the current date
            },
        }, { new: true } // Return the updated document
        );
        console.log({
            data: {
                action: "event",
                sub: this.tokenContent?.sub,
                conversation: updatedConversation,
                InboxChunks: updatedChunks,
            },
        });
        (await this.redisClient).publish("conversations", (0, EventAction_1.default)(`${event === "seen" ? "seen" : "delivered"}`, this.tokenContent?.sub, updatedConversation, updatedChunks));
        return updatedChunks;
    }
    //TODO: implement this save to database and download image from payload setup webhook
    async processMessage(message) {
        const data = JSON.parse(message);
        console.log(data);
        return data;
    }
}
exports.MessageRepository = MessageRepository;
