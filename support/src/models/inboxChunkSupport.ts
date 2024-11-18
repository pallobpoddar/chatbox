import mongoose, { Schema } from "mongoose";
import { IInboxChunkSupport } from "./interfaces/inboxChunkSupport";

const inboxChunkSupportSchema = new Schema<IInboxChunkSupport>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "conversations",
    required: true,
  },
  chunkSerial: {
    type: Number,
    required: true,
  },
  messages: [
    {
      _id: false,
      id: {
        type: Schema.Types.ObjectId,
        ref: "messages",
        required: true,
      },
      sender: {
        type: String,
        required: true,
      },
      agentType: {
        type: String,
        enum: ["Human", "AI", "System"],
        required: true,
      },
      systemNotification: {
        type: String,
      },
      isTempered: {
        type: Boolean,
      },
      closeTime: {
        type: Date,
      },
    },
  ],
});
inboxChunkSupportSchema.index(
  { conversationId: 1, chunkSerial: 1 },
  { unique: true }
);

export default mongoose.model<IInboxChunkSupport>(
  "InboxChunkSupport",
  inboxChunkSupportSchema
);
