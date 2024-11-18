"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFakeConversation = void 0;
const faker_1 = require("@faker-js/faker");
const mongoose_1 = __importDefault(require("mongoose"));
// Generate fake conversation data
// Generate fake conversation data
const generateFakeConversation = (length) => {
    return {
        _id: new mongoose_1.default.Types.ObjectId(),
        participants: Array.from({ length: length }, () => ({
            id: new mongoose_1.default.Types.ObjectId(),
            info: {
                delivered: 0,
                seen: 0,
            },
        })),
        group: {
            name: faker_1.faker.company.name(),
            photo: faker_1.faker.image.url(),
        },
        totalMessages: 0,
    };
};
exports.generateFakeConversation = generateFakeConversation;
