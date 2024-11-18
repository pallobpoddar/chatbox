import dotenv from "dotenv";

dotenv.config();

export const SESSION_SECRET = process.env.SESSION_SECRET;

export const MONGODB_URL = process.env.MONGODB_URL as string;

export const URL = process.env.API_URL;
export const senderPhoneNumberId: string = process.env.PHONE_NUMBER_ID!;
export const whatsappAPIKey: string = process.env.USER_ACCESS_TOKEN!;
export const TEST_MONGO_URL = process.env.TEST_MONGODB_URL as string;
export const PORT = process.env.PORT;

export const MAX_CONVERSATION_PER_AGENT =
  Number(process.env.MAX_CONVERSATION_PER_AGENT) || 10;
