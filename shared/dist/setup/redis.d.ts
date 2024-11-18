import Redis from "ioredis";
export declare class RedisManager {
    static instance: {
        [key: string]: Redis;
    };
    static init(instanceNames: string[]): Promise<void>;
    static addClient(instanceName: string): Promise<Redis>;
    static getClient(instanceName: string): Promise<Redis>;
}
