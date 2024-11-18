"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_CONVERSATION_PER_AGENT = exports.PORT = exports.TEST_MONGO_URL = exports.whatsappAPIKey = exports.senderPhoneNumberId = exports.URL = exports.MONGODB_URL = exports.SESSION_SECRET = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.SESSION_SECRET = process.env.SESSION_SECRET;
exports.MONGODB_URL = process.env.MONGODB_URL;
exports.URL = process.env.API_URL;
exports.senderPhoneNumberId = process.env.PHONE_NUMBER_ID;
exports.whatsappAPIKey = process.env.USER_ACCESS_TOKEN;
exports.TEST_MONGO_URL = process.env.TEST_MONGODB_URL;
exports.PORT = process.env.PORT;
exports.MAX_CONVERSATION_PER_AGENT = Number(process.env.MAX_CONVERSATION_PER_AGENT) || 10;
