import mongoose from "mongoose";

export interface IMessageSupport {
  id: mongoose.Types.ObjectId;
  sender: string;
  agentType: "Human" | "AI" | "System";
  systemNotification?: string;
  isTempered?: boolean;
  closeTime?: Date;
}
