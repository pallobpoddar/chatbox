import mongoose from "mongoose";
import { IDistribution } from "./interfaces/distribution";
declare const _default: mongoose.Model<IDistribution, {}, {}, {}, mongoose.Document<unknown, {}, IDistribution> & IDistribution & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
