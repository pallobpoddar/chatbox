import dotenv from "dotenv";

dotenv.config();

export const SUPPORT_MODULE_PORT = process.env.SUPPORT_MODULE_PORT;
export const MAX_CONVERSATION_PER_AGENT =
  Number(process.env.MAX_CONVERSATION_PER_AGENT) || 10;
