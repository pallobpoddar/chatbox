import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables from .env file
dotenv.config();

// Get MongoDB URL from environment variables
const TEST_MONGO_URL = process.env.TEST_MONGODB_URL as string;

export const connectDb = async () => {
    mongoose.connect(TEST_MONGO_URL)
    .then(() => { })
    .catch((err) => {
        console.log(Error, err.message);
    });
}