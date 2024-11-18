import request from 'supertest';
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { connectDb } from '@one.chat/shared/src/seeds/environment'; // Import your DB connection utilities
import mongoose from 'mongoose';
import { generateFakeControllerData } from '../../seeds/faker/messageController'; // Import the data generator
import conversationRouter from 'src/routes/v1/conversation';
import { seedMessages } from 'src/seeds/messageController';

const app = express();
app.use(express.json());
app.use('/api/v1/conversation', conversationRouter); // Adjust base path if necessary

describe('POST /api/message/send/:conversationId', () => {
    beforeAll(async () => {
        await connectDb();
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should send multiple messages and return success', async () => {
        // Generate an array of fake data
        const fakeDataArray:any = await seedMessages(3); // This should return an array

        // Iterate over each fake data item
        fakeDataArray.forEach(async (fakeData:any) => {
            // Prepare form data with media files if any
            const formData = new FormData();
            formData.append('senderId', fakeData.senderId);
            formData.append('content', fakeData.content);
            formData.append('ManualType', fakeData.ManualType || '');
            formData.append('contextId', fakeData.contextId);
            
            // Add media files if present
            if (fakeData.mediaFiles && fakeData.mediaFiles.length > 0) {
                fakeData.mediaFiles.forEach((file: { path: string; originalname: string }) => {
                    const fileStream = fs.createReadStream(path.resolve(file.path)) as any; // Casting to 'any' to bypass TypeScript error
                    formData.append('media', fileStream, file.originalname);
                });
            }

            // Send the request
            await request(app)
                .post(`/api/message/send/fakeConversationId`) // Replace with a valid conversationId if needed
                .set('Content-Type', 'multipart/form-data')
                .send(formData)
                .then(response => {
                    // Assertions
                    expect(response.status).toBe(200);
                    expect(response.body.message).toBe('Message sent successfully');
                    expect(response.body.InboxChunk).toHaveProperty('_id'); // Example property check
                    expect(response.body.InboxChunk).toHaveProperty('media');
                    expect(response.body.InboxChunk.media).toBeInstanceOf(Array);
                    expect(response.body.InboxChunk.media.length).toBeGreaterThan(0);
                    // Add more assertions as needed based on the expected response
                })
                .catch(error => {
                    // Handle request errors
                    throw error;
                });
        });
    });
});
