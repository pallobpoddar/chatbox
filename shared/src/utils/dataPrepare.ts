import { IMessage } from "../models/interfaces/message";
import {
  IEIMessage,
  IInboxChunk,
  IMergedInboxChunk,
} from "../models/interfaces/inboxChunks";

export const mergeInboxChunks = (
  documents: IInboxChunk[],
  messageCount: number
) => {
  let mergedDocument: Partial<IMergedInboxChunk> = {
    conversationId: documents[0].conversationId,
    chunkSerials: [],
    messages: [],
  };

  // Collect chunkSerials and reverse the messages
  documents.forEach((doc) => {
    // Add the chunk serial
    mergedDocument.chunkSerials!.push(doc.chunkSerial);

    // Add the reversed messages to the messages array
    doc.messages.reverse().forEach((message) => {
      if (mergedDocument.messages!.length < messageCount) {
        const msg: IEIMessage = {
          ...message as IMessage,
          chunkSerial: doc.chunkSerial,
        };
        mergedDocument.messages!.push(msg);
      }
    });
  });

  return mergedDocument as IMergedInboxChunk;
};
