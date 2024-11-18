import { IConversation } from "../models/interfaces/conversations";
import mongoose from "mongoose";
declare class ConversationRepository {
    private tokenContent;
    private redisClient;
    constructor(redisClient: any);
    setTokenContent(tokenContent: any): void;
    findOrCreate(participants: string[]): Promise<IConversation>;
    createGroup(participants: string[], group: {
        name?: string;
        photo?: string;
    } | null): Promise<IConversation | null>;
    getConversationsByParticipant(participantId: string, offset: number, take: number): Promise<IConversation[]>;
    getConversationsByIds(conversationIds: mongoose.Types.ObjectId[]): Promise<IConversation[]>;
    getDMByParticipants(conversationIds: mongoose.Types.ObjectId[]): Promise<IConversation>;
    addParticipantsToConversation(conversationId: mongoose.Types.ObjectId, participants: string[]): Promise<IConversation | null>;
    removeParticipantsFromConversation(conversationId: mongoose.Types.ObjectId, participants: string[]): Promise<IConversation | null>;
    updateGroupInfo(conversationId: mongoose.Types.ObjectId, group: {
        name?: string;
        photo?: string;
    }): Promise<IConversation | null>;
    deleteConversation(conversationId: mongoose.Types.ObjectId): Promise<IConversation | null>;
}
export default ConversationRepository;
