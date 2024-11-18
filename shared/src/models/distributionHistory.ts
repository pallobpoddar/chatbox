import mongoose, { Schema } from "mongoose";
import IDistributionHistory from "./interfaces/distributionHistory";

const distributionHistorySchema = new Schema<IDistributionHistory>(
  {
    participantId: {
      type: String,
      required: true,
    },
    agentId: {
      type: String,
      required: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Conversation",
    },
    openTime: {
      type: Date,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDistributionHistory>(
  "DistributionHistory",
  distributionHistorySchema
);
