import { IInboxChunk } from "../models/interfaces/inboxChunks";
import { IMessage } from "../models/interfaces/message";
import mongoose from "mongoose";
import { Redis } from "ioredis";
export declare class MessageRepository {
    static chunkMessageLimit: number;
    private redisClient;
    private tokenContent;
    private manualType;
    constructor(redisClient: Redis | Promise<Redis>);
    setTokenContent(tokenContent: any): void;
    setManualType(manualType: string | undefined): void;
    addMessage(conversationId: string, message: IMessage, isAgentSent?: boolean): Promise<IInboxChunk>;
    getMessages(conversationId: string, page: number): Promise<IInboxChunk[]>;
    deleteMessage(conversationId: string, messageId: string): Promise<IInboxChunk>;
    updateEvent(conversationId: mongoose.Types.ObjectId, event: string): Promise<{
        conversationId: mongoose.Types.ObjectId;
        chunkSerial: number;
        messages: any[];
    }[]>;
    processMessage(message: string): Promise<any>;
}
