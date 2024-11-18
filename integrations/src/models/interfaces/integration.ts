import { Document } from "mongoose";
// Define the Integration interface
export interface Integration extends Document {
    userId: string;
    whatsApp: {
      phoneNoId: string;
      apiKey: string;
      webhook: {
        token: string;
      }
    };
    test: {
      send: Date | null;
      received: Date | null;
    };
  }