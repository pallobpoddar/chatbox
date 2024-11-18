import mongoose, { Schema } from "mongoose";
import { IConversation } from "./interfaces/conversations";

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        id: {
          type: String,
          required: true,
        },
        isAdmin: {
          type: Boolean,
          default: false,
        },
        info: {
          delivered: {
            type: Number,
            default: 0,
          },
          seen: {
            type: Number,
            default: 0,
          },
        },
        lastDeleteTime: {
          type: Date,
          default: null,
        },
      },
    ],
    group: {
      name: {
        type: String,
      },
      photo: {
        type: String,
      },
    },
    totalMessages: {
      type: Number,
      default: 0,
    },
    lastMessageTime: {
      type: Date,
    },
    pass: {
      whatsapp: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);
