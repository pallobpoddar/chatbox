"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = __importDefault(require("./v1/index"));
async function setupRoutes() {
    const router = express_1.default.Router();
    const v1_route = await (0, index_1.default)();
    router.use('/v1', v1_route);
    return router;
}
exports.default = setupRoutes;
