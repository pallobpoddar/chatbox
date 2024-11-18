import mongoose from "mongoose";
import { MONGODB_URL } from "@one.chat/shared/dist/config/config";

export const connectDb = async () => {
  mongoose
    .connect(MONGODB_URL)
    .then(() => {
      console.log("DB Connected!");
    })
    .catch((err) => {
      console.log(Error, err.message);
    });
};
