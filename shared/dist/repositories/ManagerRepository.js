"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const managers_1 = __importDefault(require("../models/managers"));
class ManagerRepository {
    redisClient;
    tokenContent = {};
    constructor(redisClient) {
        this.redisClient = redisClient;
    }
    setTokenContent(tokenContent) {
        this.tokenContent = tokenContent;
    }
    async createManager() {
        const targetManager = await managers_1.default.findOne({
            userId: this.tokenContent.sub,
        });
        if (targetManager) {
            throw { status: 409, message: "Manager already exists" };
        }
        const newManager = await managers_1.default.create({
            userId: this.tokenContent.sub,
        });
        return newManager;
    }
    async getManager() {
        const targetManager = await managers_1.default.findOne({
            userId: this.tokenContent.sub,
        });
        if (!targetManager) {
            throw { status: 404, message: "Manager not found" };
        }
        return targetManager;
    }
    async addManagers(managers) {
        const targetManager = await managers_1.default.findOne({
            userId: this.tokenContent.sub,
        });
        if (!targetManager) {
            throw { status: 404, message: "Manager not found" };
        }
        const existingManagerIds = targetManager.managers.map((manager) => manager.id);
        const newManagers = managers.filter((manager) => !existingManagerIds.includes(manager.id));
        const updatedManager = await managers_1.default.findOneAndUpdate({ userId: this.tokenContent.sub }, { $push: { managers: newManagers } }, { new: true });
        return updatedManager;
    }
    async removeManagers(managers) {
        const targetManager = await managers_1.default.findOne({
            userId: this.tokenContent.sub,
        });
        if (!targetManager) {
            throw { status: 404, message: "Manager not found" };
        }
        const updatedManager = await managers_1.default.findOneAndUpdate({ userId: this.tokenContent.sub }, {
            $pull: {
                managers: {
                    id: { $in: managers },
                },
            },
        }, { new: true });
        return updatedManager;
    }
    async deleteManager() {
        const targetManager = await managers_1.default.findOne({
            userId: this.tokenContent.sub,
        });
        if (!targetManager) {
            throw { status: 404, message: "Manager not found" };
        }
        const deletedManager = await managers_1.default.findOneAndDelete({
            userId: this.tokenContent.sub,
        });
        return deletedManager;
    }
}
exports.default = ManagerRepository;
