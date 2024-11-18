import mongoose, { Schema } from "mongoose";
import { IDistribution } from "./interfaces/distribution";

const distributionSchema = new Schema<IDistribution>(
  {
    userId: {
      type: String,
      required: true,
    },
    assigns: [
      {
        conversationId: {
          type: Schema.Types.ObjectId,
          required: true,
          index: true,
        },
        openTime: {
          type: Date,
        },
        startTime: {
          type: Date,
          required: true,
        },
        transferTo: {
          type: String,
          default: null,
        },
      },
    ],
    totalAssigns: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IDistribution>(
  "Distribution",
  distributionSchema
);
