import { IInboxChunk, IMergedInboxChunk } from "../models/interfaces/inboxChunks";
export declare const mergeInboxChunks: (documents: IInboxChunk[], messageCount: number) => IMergedInboxChunk;
