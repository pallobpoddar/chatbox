import mongoose, { Schema } from "mongoose";
import { IOnlineUser } from "./interfaces/onlineUser";

const onlineSchema = new Schema<IOnlineUser>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["chat", "support"],
      required: true,
    },
    onlineTime: {
      type: Date,
      default: null,
    },
    lastOnlineTime: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IOnlineUser>("Online", onlineSchema);
