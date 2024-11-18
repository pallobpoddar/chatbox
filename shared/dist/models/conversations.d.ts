import mongoose, { Schema } from "mongoose";
import { IConversation } from "./interfaces/conversations";
declare const _default: mongoose.Model<IConversation, {}, {}, {}, mongoose.Document<unknown, {}, IConversation> & IConversation & Required<{
    _id: Schema.Types.ObjectId;
}>, any>;
export default _default;
