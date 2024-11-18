import dotenv from "dotenv";

dotenv.config();

export const SOCKET_SERVER_PORT = process.env.SOCKET_SERVER_PORT;
export const REDIS_URI = process.env.REDIS_URI;
export const MONGODB_URL = process.env.MONGODB_URL;
