import mongoose from "mongoose";

interface IDistributionHistory {
  participantId: string;
  agentId: string;
  conversationId: mongoose.Types.ObjectId;
  openTime?: Date;
  startTime?: Date;
  endTime?: Date;
}

export default IDistributionHistory;
