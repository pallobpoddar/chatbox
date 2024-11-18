"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
// Load environment variables from .env file
dotenv_1.default.config();
// Get MongoDB URL from environment variables
const TEST_MONGO_URL = process.env.TEST_MONGODB_URL;
const connectDb = async () => {
    mongoose_1.default.connect(TEST_MONGO_URL)
        .then(() => { })
        .catch((err) => {
        console.log(Error, err.message);
    });
};
exports.connectDb = connectDb;
