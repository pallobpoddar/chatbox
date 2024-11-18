import mongoose from "mongoose";
export interface IDistributionHistory {
    participantId: string;
    agentId: string;
    conversationId: mongoose.Types.ObjectId;
    openTime: Date;
    startTime: Date;
    endTime: Date;
}
