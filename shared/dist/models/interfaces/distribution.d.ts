import mongoose from "mongoose";
export interface IDistribution {
    userId: string | null;
    assigns: {
        conversationId: mongoose.Types.ObjectId;
        openTime: Date | null;
        startTime: Date;
        closeTime?: Date | null;
        transferTo?: string | null;
    }[];
    totalAssigns: number;
}
