"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedConversations = void 0;
const conversations_1 = __importDefault(require("../models/conversations"));
const environment_1 = require("./environment");
const mongoose_1 = __importDefault(require("mongoose"));
const conversation_1 = require("./faker/conversation");
const seedConversations = async (number) => {
    try {
        await (0, environment_1.connectDb)();
        console.log('Connected to MongoDB');
        // Generate and insert fake conversations
        for (let i = 0; i < number; i++) {
            const fakeConversation = (0, conversation_1.generateFakeConversation)(2);
            await conversations_1.default.create(fakeConversation);
        }
        console.log(`${number} fake conversations seeded successfully`);
    }
    catch (error) {
        console.error('Error seeding conversations:', error);
    }
    finally {
        // Close the MongoDB connection
        await mongoose_1.default.connection.close();
        console.log('MongoDB connection closed');
    }
};
exports.seedConversations = seedConversations;
// Check if this file is the main module
if (require.main === module) {
    (0, exports.seedConversations)(3);
}
