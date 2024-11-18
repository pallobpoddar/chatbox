import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';

export const createFakeMediaFiles = () => {
    // Define some sample media files
    const sampleMediaFiles = [
        {
            fieldname: 'media',
            originalname: 'download.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            destination: 'public/uploads/',
            filename: '1723632680969-395537069.jpg',
            path: 'public\\uploads\\1723632680969-395537069.jpg',
            size: 7813
        },
        {
            fieldname: 'media',
            originalname: 'Screenshot 2024-07-01 214953.png',
            encoding: '7bit',
            mimetype: 'image/png',
            destination: 'public/uploads/',
            filename: '1723632680971-784880194.png',
            path: 'public\\uploads\\1723632680971-784880194.png',
            size: 33950
        }
    ];

    // Randomly decide to return sample media files or an empty array
    return faker.datatype.boolean() ? sampleMediaFiles : [];
};



export const generateFakeControllerData = () => {
    const fakeSenderId = new mongoose.Types.ObjectId("66b9b83d1ec50cea420b4f02");
    const fakeManualType = faker.datatype.boolean() ? 'template' : null;
    const fakeContent = fakeManualType === 'template' ? 'hello_world' : faker.lorem.sentence();
    const fakeContextId = new mongoose.Types.ObjectId();
    const fakeMediaFiles = createFakeMediaFiles(); // Get media files or empty array

    return {
        senderId: fakeSenderId.toString(),
        content: fakeContent,
        ManualType: fakeManualType,
        contextId: fakeContextId.toString(),
        mediaFiles: fakeMediaFiles
    };
};
