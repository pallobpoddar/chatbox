import mongoose from "mongoose";
import { IInboxChunk } from "./interfaces/inboxChunks";
declare const _default: mongoose.Model<IInboxChunk, {}, {}, {}, mongoose.Document<unknown, {}, IInboxChunk> & IInboxChunk & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
