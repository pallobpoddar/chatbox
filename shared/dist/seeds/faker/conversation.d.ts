import mongoose from "mongoose";
export declare const generateFakeConversation: (length: number) => {
    _id: mongoose.Types.ObjectId;
    participants: {
        id: mongoose.Types.ObjectId;
        info: {
            delivered: number;
            seen: number;
        };
    }[];
    group: {
        name: string;
        photo: string;
    };
    totalMessages: number;
};
