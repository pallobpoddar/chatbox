import mongoose, { Schema } from "mongoose";
import { IPendingAssign } from "./interfaces/pendingAssign";

const pendingAssign = new Schema<IPendingAssign>(
  {
    participantId: {
      type: String,
      required: true,
      index: true,
    },
    conversations: [
      {
        id: {
          type: Schema.Types.ObjectId,
          ref: "Conversation",
          required: true,
        },
        startTime: {
          type: Date,
        },
        from: {
          type: String || null,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IPendingAssign>("PendingAssign", pendingAssign);
