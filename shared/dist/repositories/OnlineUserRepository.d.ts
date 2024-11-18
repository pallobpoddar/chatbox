import mongoose from "mongoose";
import { IOnlineUser } from "../models/interfaces/onlineUser";
declare class OnlineUserRepository {
    constructor();
    createOnlineUser(userId: string, onlineTime: Date): Promise<IOnlineUser>;
    getOneByUserId(userId: string): Promise<IOnlineUser | null>;
    updateOneByUserId(userId: string, onlineTime?: Date, lastOnlineTime?: Date | null, assign?: mongoose.Types.ObjectId[]): Promise<IOnlineUser | null>;
}
declare const _default: OnlineUserRepository;
export default _default;
