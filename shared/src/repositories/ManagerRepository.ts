import { Redis } from "ioredis";
import { IManager } from "../models/interfaces/manager";
import ManagerModel from "../models/managers";

class ManagerRepository {
  private redisClient;
  private tokenContent: any = {};

  public constructor(redisClient: Redis | Promise<Redis>) {
    this.redisClient = redisClient;
  }

  public setTokenContent(tokenContent: any) {
    this.tokenContent = tokenContent;
  }

  public async createManager(): Promise<IManager> {
    const targetManager = await ManagerModel.findOne({
      userId: this.tokenContent.sub,
    });
    if (targetManager) {
      throw { status: 409, message: "Manager already exists" };
    }

    const newManager = await ManagerModel.create({
      userId: this.tokenContent.sub,
    });

    return newManager;
  }

  public async createManagerWithUserId(userId: string): Promise<IManager> {
    const targetManager = await ManagerModel.findOne({
      userId: userId,
    });
    if (targetManager) {
      throw { status: 409, message: "Manager already exists" };
    }

    const newManager = await ManagerModel.create({
      userId: userId,
    });

    return newManager;
  }

  public async getManager(): Promise<IManager | null> {
    const targetManager = await ManagerModel.findOne({
      userId: this.tokenContent.sub,
    });
    if (!targetManager) {
      throw { status: 404, message: "Manager not found" };
    }

    return targetManager;
  }

  public async getAllManagers(
    filters: any,
    sort: any,
    skip: number,
    limit: number
  ): Promise<IManager[]> {
    const targetManagers = await ManagerModel.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  
    if (!targetManagers || targetManagers.length === 0) {
      throw { status: 404, message: "Managers not found" };
    }
  
    return targetManagers;
  }
  
  // Add a method to count the total number of managers for pagination
  public async getManagerCount(filters: any): Promise<number> {
    return ManagerModel.countDocuments(filters);
  }

  public async addManagers(
    managers: { id: string; role?: string }[]
  ): Promise<IManager | null> {
    const targetManager = await ManagerModel.findOne({
      userId: this.tokenContent.sub,
    });
    if (!targetManager) {
      throw { status: 404, message: "Manager not found" };
    }

    const existingManagerIds = targetManager.managers.map(
      (manager) => manager.id
    );
    const newManagers = managers.filter(
      (manager) => !existingManagerIds.includes(manager.id)
    );

    const updatedManager = await ManagerModel.findOneAndUpdate(
      { userId: this.tokenContent.sub },
      { $push: { managers: newManagers } },
      { new: true }
    );

    return updatedManager;
  }

  public async addManagersByOwnerId(
    ownerId: string,
    managers: { id: string; role?: string }[]
  ): Promise<IManager | null> {
    const targetManager = await ManagerModel.findOne({
      userId: ownerId,
    });
    if (!targetManager) {
      throw { status: 404, message: "Manager not found" };
    }

    const existingManagerIds = targetManager.managers.map(
      (manager) => manager.id
    );
    const newManagers = managers.filter(
      (manager) => !existingManagerIds.includes(manager.id)
    );

    const updatedManager = await ManagerModel.findOneAndUpdate(
      { userId: ownerId },
      { $push: { managers: newManagers } },
      { new: true }
    );

    return updatedManager;
  }

  public async removeManagers(managers: string[]): Promise<IManager | null> {
    const targetManager = await ManagerModel.findOne({
      userId: this.tokenContent.sub,
    });
    if (!targetManager) {
      throw { status: 404, message: "Manager not found" };
    }

    const isManagerExists = targetManager.managers.some((manager) =>
      managers.includes(manager.id)
    );
    if (!isManagerExists) {
      throw { status: 404, message: "Manager not found" };
    }

    const updatedManager = await ManagerModel.findOneAndUpdate(
      { userId: this.tokenContent.sub },
      {
        $pull: {
          managers: {
            id: { $in: managers },
          },
        },
      },
      { new: true }
    );

    return updatedManager;
  }

  public async deleteManager(): Promise<IManager | null> {
    const targetManager = await ManagerModel.findOne({
      userId: this.tokenContent.sub,
    });
    if (!targetManager) {
      throw { status: 404, message: "Manager not found" };
    }

    const deletedManager = await ManagerModel.findOneAndDelete({
      userId: this.tokenContent.sub,
    });

    return deletedManager;
  }
}

export default ManagerRepository;
