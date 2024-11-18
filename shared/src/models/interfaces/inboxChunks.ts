import { Schema } from "mongoose";
import { IMessage } from "./message";

export interface IInboxChunk {
  conversationId: Schema.Types.ObjectId;
  chunkSerial: number;
  messages: IMessage[];
}

export interface IEIMessage extends IMessage {
  chunkSerial: number | undefined | null;
}

export interface IMergedInboxChunk {
  conversationId: Schema.Types.ObjectId;
  chunkSerials: number[];
  messages: IEIMessage[];
}
