import dotenv from 'dotenv';

dotenv.config();

export const REDIS_HOST = process.env.REDIS_HOST as string 
export const REDIS_PORT:number = Number(process.env.REDIS_PORT)??6379
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD as string
export const REDIS_DB = Number(process.env.REDIS_DB) ?? 0