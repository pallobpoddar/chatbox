import express from "express";
import { SERVER_PORT } from "./config/config";
import setupRoutes from "./routes/routes";
import cors from "cors";
import mongoose from "mongoose";
import session from "express-session";
import keycloak from "./setup/keycloak";

require("dotenv").config();
const mongodb = process.env.TEST_MONGODB_URL as string;

const app = express();

async function startServer() {
  app.use(express.json());

  app.use(cors());
  app.use(
    session({
      secret: "secret",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
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

  app.use(keycloak.middleware());

  app.get("/", keycloak.protect(), async (req:any, res) => {
    res.json(req.kauth?.grant?.access_token);
  });

  const apiRoutes: any = await setupRoutes();
  app.use("/api", apiRoutes);

  app.listen(SERVER_PORT, () => {
    console.log("User service listening on port ", SERVER_PORT);
  });
}

startServer();
