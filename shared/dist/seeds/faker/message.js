"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFakeMessage = void 0;
const faker_1 = require("@faker-js/faker");
const mongoose_1 = __importDefault(require("mongoose"));
const generateFakeMessage = (sender, source = null, pass = []) => {
    return {
        _id: new mongoose_1.default.Types.ObjectId(),
        sender: sender,
        sent: faker_1.faker.date.past(),
        delivered: faker_1.faker.date.recent(),
        seen: faker_1.faker.date.recent(),
        type: faker_1.faker.helpers.arrayElement([
            "text",
            "image",
            "audio",
            "video",
            "document",
        ]),
        content: faker_1.faker.lorem.sentence(),
        media: [
            {
                path: faker_1.faker.image.url(),
                type: faker_1.faker.helpers.arrayElement(["image", "video"]),
                isSaved: faker_1.faker.datatype.boolean(),
                sourceInfo: {}, // You can fill this with more detailed fake data if needed
            },
        ],
        context: new mongoose_1.default.Types.ObjectId(),
        source: source !== null
            ? {
                platform: faker_1.faker.helpers.arrayElement(["whatsapp", null]),
                refId: faker_1.faker.string.uuid(),
            }
            : null,
        pass: pass.length !== 0
            ? [
                {
                    platform: faker_1.faker.helpers.arrayElement(["whatsapp", null]),
                    refId: faker_1.faker.string.uuid(),
                },
            ]
            : [],
        isDeleted: faker_1.faker.datatype.boolean(),
    };
};
exports.generateFakeMessage = generateFakeMessage;
// Example usage
// if (require.main === module) {
//   const fakeMessage = generateFakeMessage(new mongoose.Types.ObjectId());
//   console.log(fakeMessage);
// }
