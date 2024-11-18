import mongoose, { model, Schema } from "mongoose";
import { Integration } from "../models/interfaces/integration";
// Define the Integration schema
const IntegrationSchema = new Schema<Integration>({
  userId: { type: String, required: true,unique: true, index: true },
  whatsApp: {
    phoneNoId: { type: String, required: true, index: true },
    apiKey: { type: String, required: true },
    webhook: {
      token: { type: String, required: true },
    },
  },
  test: {
    send: { type: Date, default: null },
    received: { type: Date, default: null },
  },
});

// Create the model
const IntegrationModel = model<Integration>("Integration", IntegrationSchema);

export default IntegrationModel;
