import { faker } from "@faker-js/faker";
import mongoose from "mongoose";

// Generate fake conversation data
// Generate fake conversation data
export const generateFakeConversation = (length: number) => {
  return {
    _id: new mongoose.Types.ObjectId(),
    participants: Array.from({ length: length }, () => ({
      id: new mongoose.Types.ObjectId(),
      info: {
        delivered: 0,
        seen: 0,
      },
    })),
    group: {
      name: faker.company.name(),
      photo: faker.image.url(),
    },
    totalMessages: 0,
  };
};
