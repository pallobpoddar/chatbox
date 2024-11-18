import mongoose from "mongoose";
import { IDistributionHistory } from "./interfaces/distributionHistory";
declare const _default: mongoose.Model<IDistributionHistory, {}, {}, {}, mongoose.Document<unknown, {}, IDistributionHistory> & IDistributionHistory & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
