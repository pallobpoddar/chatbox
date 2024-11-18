import mongoose from "mongoose";
import { IPendingAssign } from "./interfaces/pendingAssign";
declare const _default: mongoose.Model<IPendingAssign, {}, {}, {}, mongoose.Document<unknown, {}, IPendingAssign> & IPendingAssign & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
