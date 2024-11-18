"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFakePayloadData = void 0;
const faker_1 = require("@faker-js/faker");
const whatsapp_1 = __importDefault(require("../../services/whatsapp"));
const generateFakePayloadData = () => {
    // Generate a ManualType that could be 'template' or null
    const ManualType = faker_1.faker.helpers.arrayElement([null, 'template']);
    let messaging_product;
    let media;
    if (ManualType === 'template') {
        messaging_product = "hello_world"; // Fixed text for template type
        media = ''; // No media if it's a template
    }
    else {
        messaging_product = faker_1.faker.helpers.arrayElement(['hi', 'hello', 'hey', 'how are you?']); // Random plain text content
        // Randomly decide if there's media or not
        const hasMedia = faker_1.faker.datatype.boolean();
        media = hasMedia ? faker_1.faker.helpers.arrayElement([
            "D:/one.chat/one.chat/shared/public/1723233923259-264190842.ogg", // Simulated audio URL
            "D:/one.chat/one.chat/shared/public/download.jpg", // Simulated video URL
            "D:/one.chat/one.chat/shared/public/sample.pdf", // Simulated PDF URL
        ]) : '';
    }
    return {
        recipientPhoneNumber: '+8801739864401',
        messaging_product,
        media,
        ManualType
    };
};
exports.generateFakePayloadData = generateFakePayloadData;
// Example usage
if (require.main === module) {
    const fakeData = (0, exports.generateFakePayloadData)();
    whatsapp_1.default.createPayload(fakeData.recipientPhoneNumber, fakeData.messaging_product, fakeData.media, fakeData.ManualType).then(payload => console.log(payload));
}
