import { connectDb } from '@one.chat/shared/src/seeds/environment';
import mongoose from 'mongoose';
import WhatsAppService from '@one.chat/shared/src/services/whatsapp';
import { generateFakePayloadData } from '@one.chat/shared/src/seeds/faker/sendMessage'; // Assuming you have your generateFakePayloadData in this path
import { generateFakeControllerData } from './faker/messageController';
// import conversations from 'src/models/conversations';

export const seedMessages = async (number: number) => {
    let allFakeData: any[] = [];
    try {
        // Generate and insert fake payload data as messages
        for (let i = 0; i < number; i++) {
            const fakeData = generateFakeControllerData();
            allFakeData.push(fakeData);
        }

        console.log(`${number} fake messages seeded successfully`);

        return allFakeData;
    } catch (error) {
        console.error('Error seeding messages:', error);
        throw error; // Propagate error
    } finally {
        console.log('Seed operation completed');
    }
};

// Check if this file is the main module
if (require.main === module) {
    seedMessages(3).then(() => {
        console.log('Messages seeded');
        mongoose.connection.close();
    }).catch(error => {
        console.error('Seeding failed:', error);
        mongoose.connection.close();
    });
}
