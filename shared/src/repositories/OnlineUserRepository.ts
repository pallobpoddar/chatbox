import mongoose from "mongoose";
import { IOnlineUser } from "../models/interfaces/onlineUser";
import OnlineModel from "../models/onlineUser";

class OnlineUserRepository {
  public constructor() {}

  public async createOnlineUser(
    userId: string,
    onlineTime: Date
  ): Promise<IOnlineUser> {
    const onlineUser = await OnlineModel.create({
      userId: userId,
      onlineTime: onlineTime,
    });

    return onlineUser;
  }

  public async getOneByUserId(userId: string): Promise<IOnlineUser | null> {
    const onlineUser = await OnlineModel.findOne({
      userId: userId,
    });

    return onlineUser;
  }

  public async updateOneByUserId(
    userId: string,
    onlineTime?: Date,
    lastOnlineTime?: Date | null,
    assign?: mongoose.Types.ObjectId[]
  ): Promise<IOnlineUser | null> {
    const onlineUser = await OnlineModel.findOneAndUpdate(
      {
        userId: userId,
      },
      {
        onlineTime: onlineTime,
        lastOnlineTime: lastOnlineTime,
        assign: assign,
      },
      {
        new: true,
      }
    );

    return onlineUser;
  }
}

export default new OnlineUserRepository();
