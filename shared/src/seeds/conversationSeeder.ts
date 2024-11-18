import { faker } from '@faker-js/faker';
import conversations from '../models/conversations';
import { connectDb } from './environment';
import mongoose from 'mongoose';
import { generateFakeConversation } from './faker/conversation';

export const seedConversations = async (number:number) => {
    try {

        await connectDb();
        console.log('Connected to MongoDB');

        // Generate and insert fake conversations
        for (let i = 0; i < number; i++) {
            const fakeConversation = generateFakeConversation(2);
            await conversations.create(fakeConversation);
        }

        console.log(`${number} fake conversations seeded successfully`);

    } catch (error) {
        console.error('Error seeding conversations:', error);
    } finally {
        // Close the MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
};

// Check if this file is the main module
if (require.main === module) {
    seedConversations(3);
}
