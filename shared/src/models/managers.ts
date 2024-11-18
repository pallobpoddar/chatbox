import mongoose, { Schema } from "mongoose";
import { IManager } from "./interfaces/manager";

const managerSchema = new Schema<IManager>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    managers: [
      {
        id: {
          type: String,
          index: true,
        },
        role: {
          type: String,
          enum: ["agent", "supervisor"],
          default: "agent",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IManager>("Manager", managerSchema);
