import dotenv from 'dotenv';

dotenv.config();

export const SERVER_PORT = process.env.USER_MODULE_PORT;
export const TRADE_APP_URL= process.env.TRADE_APP_URL;
export const TRADE_APP_EMAIL= process.env.TRADE_APP_EMAIL;
export const TRADE_APP_PASSWORD= process.env.TRADE_APP_PASSWORD;