"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_1 = __importDefault(require("../../services/whatsapp"));
const sendMessageSeeder_1 = require("../../seeds/sendMessageSeeder");
const config_1 = require("../../config/config");
describe('WhatsAppService', () => {
    beforeAll(async () => {
    });
    afterAll(async () => {
    });
    it('send some messages to WhatsApp', async () => {
        const numberOfMessages = 2;
        const fakePayloads = await (0, sendMessageSeeder_1.seedMessages)(numberOfMessages);
        // Ensure all payloads are processed
        for (const payload of fakePayloads) {
            try {
                // Initialize WhatsAppService with the required parameters
                const whatsappService = new whatsapp_1.default(config_1.senderPhoneNumberId, // Ensure this is defined
                config_1.whatsappAPIKey, // Ensure this is defined
                payload);
                // Send the message
                const response = await whatsappService.sendMessage();
                // Assert that the response status is 200
                expect(response.status).toBe(200);
                expect(response.data.messages.length).toBeGreaterThan(0);
                // Check the format of the id in the response
                for (const message of response.data.messages) {
                    expect(message).toHaveProperty('id');
                    expect(typeof message.id).toBe('string');
                    expect(message.id).toMatch(/^wamid\./); // Adjust the regex if your id format changes
                }
            }
            catch (error) {
                throw error; // Re-throw to fail the test if needed
            }
        }
    });
});
