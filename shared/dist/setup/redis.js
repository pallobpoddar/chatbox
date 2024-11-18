"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisManager = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const redis_1 = require("../config/redis");
async function connectRedisServer() {
    let init = false;
    const redis = new ioredis_1.default({
        host: redis_1.REDIS_HOST,
        port: redis_1.REDIS_PORT,
        password: redis_1.REDIS_PASSWORD,
        db: redis_1.REDIS_DB,
    });
    // Listen for connection events
    redis.on("connect", () => {
        init = true;
        console.log("Connected to Redis");
    });
    redis.on("error", (err) => {
        init = false;
        console.error("Redis connection error:", err);
    });
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkCondition = () => {
            if (init) {
                resolve(redis);
            }
            else if (Date.now() - startTime >= 10000) {
                reject(new Error("Redis Timeout: Condition was not met within the specified time."));
            }
            else {
                setTimeout(checkCondition, 100);
            }
        };
        checkCondition();
    });
}
class RedisManager {
    static instance = {};
    static async init(instanceNames) {
        instanceNames.map(async (instanceName) => {
            RedisManager.instance[instanceName] = await connectRedisServer();
        });
    }
    static async addClient(instanceName) {
        RedisManager.instance[instanceName] = await connectRedisServer();
        return RedisManager.instance[instanceName];
    }
    static async getClient(instanceName) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkCondition = () => {
                if (RedisManager.instance[instanceName]) {
                    resolve(RedisManager.instance[instanceName]);
                }
                else if (Date.now() - startTime >= 10000) {
                    reject(new Error(`Redis Timeout Instance:(${instanceName}): Condition was not met within the specified time.`));
                }
                else {
                    setTimeout(checkCondition, 100);
                }
            };
            checkCondition();
        });
    }
}
exports.RedisManager = RedisManager;
