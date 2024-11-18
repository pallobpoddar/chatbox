"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMessages = void 0;
const environment_1 = require("./environment");
const mongoose_1 = __importDefault(require("mongoose"));
const whatsapp_1 = __importDefault(require("../services/whatsapp"));
const sendMessage_1 = require("../seeds/faker/sendMessage"); // Assuming you have your generateFakePayloadData in this path
const seedMessages = async (number) => {
    let allPayload = [];
    try {
        await (0, environment_1.connectDb)();
        console.log('Connected to MongoDB');
        // Generate and insert fake payload data as messages
        for (let i = 0; i < number; i++) {
            const fakePayload = (0, sendMessage_1.generateFakePayloadData)();
            const payload = await whatsapp_1.default.createPayload(fakePayload.recipientPhoneNumber, fakePayload.messaging_product, fakePayload.media, fakePayload.ManualType);
            allPayload.push(payload);
        }
        console.log(`${number} fake messages seeded successfully`);
        return allPayload;
    }
    catch (error) {
        console.error('Error seeding messages:', error);
    }
    finally {
        // Close the MongoDB connection
        await mongoose_1.default.connection.close();
        console.log('MongoDB connection closed');
    }
};
exports.seedMessages = seedMessages;
// Check if this file is the main module
if (require.main === module) {
    (0, exports.seedMessages)(3);
}
