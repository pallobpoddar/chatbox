import express from "express";
import { SERVER_PORT } from "./config/config";
import setupRoutes from "./routes/routes";
import cors from "cors";
import mongoose from "mongoose";
import authMiddleware from "@one.chat/shared/dist/middleware/KeycloakAuth";
import path from "path";

require("dotenv").config();
const mongodb = process.env.TEST_MONGODB_URL as string;

const app = express();

async function startServer() {
  app.use(express.json());

  app.use(cors());

  console.log(
    "static files are served from: ",
    path.join(__dirname, "../../public/")
  );

  app.use(
    "/public/uploads/",
    express.static(path.join(__dirname, "../../public/uploads"), {
      maxAge: "30d",
    })
  );

  app.use(
    "/public/downloads/",
    express.static(path.join(__dirname, "../../public/downloads"), {
      maxAge: "30d",
    })
  );

  mongoose
    .connect(mongodb)
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error);
    });

  app.get("/", async (req: any, res) => {
    res.json(req.kauth?.grant?.access_token);
  });

  const apiRoutes: any = await setupRoutes();
  app.use("/api", apiRoutes);

  app.listen(SERVER_PORT, () => {
    console.log("User service listening on port ", SERVER_PORT);
  });
}

startServer();
