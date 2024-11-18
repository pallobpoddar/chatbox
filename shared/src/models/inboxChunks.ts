import mongoose, { Schema } from "mongoose";
import { IInboxChunk } from "./interfaces/inboxChunks";

const inboxChunkSchema = new Schema<IInboxChunk>(
  {
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
        sender: {
          type: String,
          required: true,
        },
        sent: {
          type: Date,
          default: Date.now,
        },
        delivered: {
          type: Date,
        },
        seen: {
          type: Date,
        },
        type: {
          type: String,
          enum: ["text", "image", "audio", "video", "document"],
          required: true,
        },
        content: {
          type: String,
        },
        media: [
          {
            path: {
              type: String,
            },
            type: {
              type: String,
            },
            isSaved: {
              type: Boolean,
              default: false,
            },
            sourceInfo: {},
          },
        ],
        context: {
          type: Schema.Types.ObjectId,
        },
        source: {
          platform: {
            type: String,
          },
          refId: {
            type: String,
            index: true,
          },
        },
        pass: [
          {
            platform: {
              type: String,
            },
            refId: {
              type: String,
              index: true,
            },
            error: {
              type: String,
              default: null,
            },
          },
        ],
        isDeleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);
inboxChunkSchema.index({ conversationId: 1, chunkSerial: 1 }, { unique: true });

export default mongoose.model<IInboxChunk>("InboxChunk", inboxChunkSchema);
