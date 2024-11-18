import mongoose from "mongoose";

export interface IDistribution {
  userId: string | null;
  assigns: {
    conversationId: mongoose.Types.ObjectId;
    openTime: Date | null;
    startTime: Date;
    transferTo?: string | null;
  }[];
  totalAssigns: number;
}
