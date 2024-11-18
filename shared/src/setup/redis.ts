import Redis from "ioredis";
import {
  REDIS_DB,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
} from "../config/redis";

async function connectRedisServer(instanceName:string): Promise<Redis> {
  let init = false;

  const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    db: REDIS_DB,
  });

  // Listen for connection events
  redis.on("connect", () => {
    init = true;
    console.log("Connected to Redis ",instanceName);
  });

  redis.on("error", (err) => {
    init = false;
    console.error("Redis connection error:", instanceName, err);
  });

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkCondition = () => {
      if (init) {
        resolve(redis);
      } else if (Date.now() - startTime >= 10000) {
        reject(
          new Error(
            "Redis Timeout: Condition was not met within the specified time."
          )
        );
      } else {
        setTimeout(checkCondition, 100);
      }
    };

    checkCondition();
  });
}

export class RedisManager {
  static instance: { [key: string]: Redis } = {};

    static async init(instanceNames: string[]) {
        instanceNames.map(async (instanceName) =>{
            RedisManager.instance[instanceName] = await connectRedisServer(instanceName)
        });
    }


    static async addClient(instanceName: string): Promise<Redis> {
        RedisManager.instance[instanceName] = await connectRedisServer(instanceName)
        return RedisManager.instance[instanceName];
    }


    static async getClient(instanceName: string): Promise<Redis> {
       console.log("instanceName",instanceName)
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkCondition = (instanceName: string) => {
                if (RedisManager.instance[instanceName]) {
                    console.log(`Redis Instance:(${instanceName}): Connected to Redis`);
                    resolve(RedisManager.instance[instanceName]);
                } else if (Date.now() - startTime >= 10000) {
                    reject(new Error(`Redis Timeout Instance:(${instanceName}): Condition was not met within the specified time.`));
                } else {
                    setTimeout(()=>checkCondition(instanceName), 100);
                }
            };

            checkCondition(instanceName);
        });
    }
}
