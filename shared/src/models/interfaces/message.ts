import mongoose from "mongoose";

export interface IMessage {
  _id?: mongoose.Types.ObjectId;
  sender: string;
  sent?: Date | null;
  delivered?: Date | null;
  seen?: Date | null;
  type: "text" | "image" | "audio" | "video" | "document";
  content?: string;
  media?:
    | { path: string; type: string; isSaved?: boolean; sourceInfo?: {} }[]
    | [];
  context?: mongoose.Types.ObjectId;
  source?: {
    platform: string;
    refId: string;
  } | null;
  pass?:
    | [
        {
          platform: string;
          refId: string | null;
          error: string | null;
        }
      ]
    | []
    | null;
  isDeleted?: boolean;
}
