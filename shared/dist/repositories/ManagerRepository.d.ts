import { Redis } from "ioredis";
import { IManager } from "../models/interfaces/manager";
declare class ManagerRepository {
    private redisClient;
    private tokenContent;
    constructor(redisClient: Redis | Promise<Redis>);
    setTokenContent(tokenContent: any): void;
    createManager(): Promise<IManager>;
    getManager(): Promise<IManager | null>;
    addManagers(managers: {
        id: string;
        role?: string;
    }[]): Promise<IManager | null>;
    removeManagers(managers: string[]): Promise<IManager | null>;
    deleteManager(): Promise<IManager | null>;
}
export default ManagerRepository;
