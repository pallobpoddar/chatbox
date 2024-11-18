"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = __importDefault(require("./user"));
async function setupV1Rout() {
    const router_v1 = express_1.default.Router();
    const user_router = await (0, user_1.default)();
    router_v1.use('/user', user_router);
    return router_v1;
}
exports.default = setupV1Rout;
