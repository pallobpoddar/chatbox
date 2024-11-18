import { Redis } from "ioredis";
import { IManager } from "../models/interfaces/manager";
import ManagerModel from "../models/managers";
import { UUID } from "crypto";
import mongoose from "mongoose";

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
    const existingBusinesses = await ManagerModel.findOne({
      userId: this.tokenContent.sub,
    });
    if (existingBusinesses) {
      throw { status: 409, message: "Manager already exists" };
    }

    const newManager = await ManagerModel.create({
      userId: this.tokenContent.sub,
      managers: [{ id: this.tokenContent.sub, role: "supervisor" }],
    });

    return newManager;
  }

  public async createManagerWithUserId(userId: string): Promise<IManager> {
    const existingBusinesses = await ManagerModel.findOne({
      userId: userId,
    });
    if (existingBusinesses) {
      throw { status: 409, message: "Manager already exists" };
    }

    const newManager = await ManagerModel.create({
      userId: userId,
    });

    return newManager;
  }

  public async getManager(): Promise<IManager | null> {
    const existingBusinesses = await ManagerModel.findOne({
      userId: this.tokenContent.sub,
    });
    if (!existingBusinesses) {
      throw { status: 404, message: "Manager not found" };
    }

    return existingBusinesses;
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
    businessIds: UUID[],
    supportManagerId: UUID,
    role: "agent" | "supervisor"
  ): Promise<IManager[]> {
    await ManagerModel.updateMany(
      {
        userId: { $in: businessIds },
        "managers.id": { $ne: supportManagerId },
      },
      {
        $addToSet: {
          managers: { id: supportManagerId, role: role },
        },
      }
    );

    const updatedBusinesses = await ManagerModel.find({
      userId: { $in: businessIds },
      "managers.id": supportManagerId,
    });
    if (updatedBusinesses.length === 0) {
      throw { status: 404, message: "No business is found" };
    }

    return updatedBusinesses;
  }

  public async addManagersByOwnerId(
    ownerId: string,
    managers: { id: string; role?: string }[]
  ): Promise<IManager | null> {
    const existingBusinesses = await ManagerModel.findOne({
      userId: ownerId,
    });
    if (!existingBusinesses) {
      throw { status: 404, message: "Manager not found" };
    }

    const existingManagerIds = existingBusinesses.managers.map(
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
    const existingBusinesses = await ManagerModel.findOne({
      userId: this.tokenContent.sub,
    });
    if (!existingBusinesses) {
      throw { status: 404, message: "Manager not found" };
    }

    const isManagerExists = existingBusinesses.managers.some((manager) =>
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
    const existingBusinesses = await ManagerModel.findOne({
      userId: this.tokenContent.sub,
    });
    if (!existingBusinesses) {
      throw { status: 404, message: "Manager not found" };
    }

    const deletedManager = await ManagerModel.findOneAndDelete({
      userId: this.tokenContent.sub,
    });

    return deletedManager;
  }
}

export default ManagerRepository;
