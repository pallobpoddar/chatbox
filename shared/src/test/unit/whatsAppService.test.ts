import mongoose from 'mongoose';
import WhatsAppService from '../../services/whatsapp';
import { seedMessages } from '../../seeds/sendMessageSeeder';
import { senderPhoneNumberId, whatsappAPIKey } from '../../config/config';

describe('WhatsAppService', () => {

    beforeAll(async () => {
    });
    afterAll(async () => {
    });

    it('send some messages to WhatsApp', async () => {
        const numberOfMessages = 2;
        const fakePayloads: any | undefined = await seedMessages(numberOfMessages);

        // Ensure all payloads are processed
        for (const payload of fakePayloads) {
            try {
                // Initialize WhatsAppService with the required parameters
                const whatsappService = new WhatsAppService(
                    senderPhoneNumberId, // Ensure this is defined
                    whatsappAPIKey,      // Ensure this is defined
                    payload
                );

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
            } catch (error) {
                throw error; // Re-throw to fail the test if needed
            }
        }
    });

})