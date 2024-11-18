import { Document, Schema } from "mongoose";
export interface IConversation extends Document {
    _id?: Schema.Types.ObjectId;
    participants: {
        id: string;
        isAdmin?: boolean;
        info?: {
            delivered: number;
            seen: number;
        };
        lastDeleteTime?: Date;
    }[];
    group: {
        name?: string;
        photo?: string;
    };
    totalMessages: Number;
    lastMessageTime?: Date;
    pass: {
        whatsapp: boolean;
    };
}
