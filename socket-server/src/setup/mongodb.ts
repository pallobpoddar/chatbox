import mongoose from "mongoose";
import { MONGODB_URL } from "../config/config";

export const connectDb = async () => {
  mongoose
    .connect(MONGODB_URL as string)
    .then(() => console.log("Connected to MongoDB database"))
    .catch((err) => {
      console.log(Error, err.message);
    });
};
