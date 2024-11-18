import mongoose from "mongoose";
export interface IPendingAssign {
    participantId: string;
    conversations: {
        id: mongoose.Types.ObjectId;
        startTime: Date;
        closeTime: Date;
    }[];
}
