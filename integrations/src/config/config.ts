import dotenv from 'dotenv';

dotenv.config();

export const CONVERSATION_MODULE_PORT=process.env.CONVERSATION_MODULE_PORT;
export const INTEGRATION_MODULE_PORT=process.env.INTEGRATION_MODULE_PORT;
export const JWT_SECRET=process.env.JWT_SECRET;