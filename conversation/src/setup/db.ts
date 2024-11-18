import mongoose from "mongoose";
import Redis from "ioredis";
import { MONGODB_URL } from "@one.chat/shared/dist/config/config";

export const connectDb = async () => {
  mongoose
    .connect(MONGODB_URL)
  .then(() => { console.log("DB Connected!"); }) 
  .catch((err) => {
    console.log(Error, err.message);
  });
}

const redis = new Redis({
  host: '103.163.246.19',
  port: 6379,
  password: 'Rafi@123.',
  db: 0,
});

export const redisClient = redis;

