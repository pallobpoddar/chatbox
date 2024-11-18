import mongoose from "mongoose";
import { IManager } from "./interfaces/manager";
declare const _default: mongoose.Model<IManager, {}, {}, {}, mongoose.Document<unknown, {}, IManager> & IManager & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
