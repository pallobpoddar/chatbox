import mongoose from "mongoose";
import { IOnlineUser } from "./interfaces/onlineUser";
declare const _default: mongoose.Model<IOnlineUser, {}, {}, {}, mongoose.Document<unknown, {}, IOnlineUser> & IOnlineUser & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
