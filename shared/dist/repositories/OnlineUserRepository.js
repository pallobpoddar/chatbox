"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const onlineUser_1 = __importDefault(require("../models/onlineUser"));
class OnlineUserRepository {
    constructor() { }
    async createOnlineUser(userId, onlineTime) {
        const onlineUser = await onlineUser_1.default.create({
            userId: userId,
            onlineTime: onlineTime,
        });
        return onlineUser;
    }
    async getOneByUserId(userId) {
        const onlineUser = await onlineUser_1.default.findOne({
            userId: userId,
        });
        return onlineUser;
    }
    async updateOneByUserId(userId, onlineTime, lastOnlineTime, assign) {
        const onlineUser = await onlineUser_1.default.findOneAndUpdate({
            userId: userId,
        }, {
            onlineTime: onlineTime,
            lastOnlineTime: lastOnlineTime,
            assign: assign,
        }, {
            new: true,
        });
        return onlineUser;
    }
}
exports.default = new OnlineUserRepository();
