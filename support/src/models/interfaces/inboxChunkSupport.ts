import mongoose from "mongoose";
import { IMessageSupport } from "./messageSupport";
import { IMessage } from "@one.chat/shared/src/models/interfaces/message";

export interface IInboxChunkSupport {
  conversationId: mongoose.Types.ObjectId;
  chunkSerial: number;
  messages: IMessageSupport[];
}

export interface IInboxChunkSupportResponse {
  conversationId: mongoose.Types.ObjectId;
  chunkSerial: number;
  messages: {
    userPart: IMessage;
    agentPart: IMessageSupport;
  }[];
}
