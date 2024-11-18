import { faker } from '@faker-js/faker';
import { connectDb } from './environment';
import mongoose from 'mongoose';
import WhatsAppService from '../services/whatsapp';
import { generateFakePayloadData } from '../seeds/faker/sendMessage'; // Assuming you have your generateFakePayloadData in this path

export const seedMessages = async (number: number) => {
    let allPayload:any[] = [];
    try {
        await connectDb();
        console.log('Connected to MongoDB');

        // Generate and insert fake payload data as messages
        for (let i = 0; i < number; i++) {
            const fakePayload = generateFakePayloadData();
            const whatsAppService = new WhatsAppService("", "", fakePayload);
            const payload = await whatsAppService.createPayload(fakePayload.recipientPhoneNumber, fakePayload.messaging_product, fakePayload.media, fakePayload.ManualType);
            allPayload.push(payload);
        }

        console.log(`${number} fake messages seeded successfully`);

        return allPayload;
    } catch (error) {
        console.error('Error seeding messages:', error);
    } finally {
        // Close the MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
};

// Check if this file is the main module
if (require.main === module) {
    seedMessages(3);
}
