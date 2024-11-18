import express from "express";
import { RedisManager } from "@one.chat/shared/dist/setup/redis";
import cors from "cors";
import session from "express-session";
import { connectDb } from "./setup/db";
import keycloak from "./setup/keycloak";
import router from "./routes/routes";
import { SUPPORT_MODULE_PORT } from "./config/config";
import bodyParser from "body-parser";
import DistributionWorker from "./utils/worker";

const app = express();

async function createServer() {
  await RedisManager.init(["UserQueue", "DistributionQueue", "general"]);

  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(
    session({
      secret: "secret",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );

  connectDb();

  const distributionWorker = new DistributionWorker();
  distributionWorker
    .handleConnection(await RedisManager.getClient("UserQueue"))
    .catch(async (err) => {
      console.error("Connection worker failed to start:", err);
      (await RedisManager.getClient("UserQueue")).quit();
    });

  distributionWorker
    .handleDisconnection(await RedisManager.getClient("UserQueue"))
    .catch(async (err) => {
      console.error("Disconnection worker failed to start:", err);
      (await RedisManager.getClient("UserQueue")).quit();
    });

  distributionWorker
    .distributeConversation(await RedisManager.getClient("DistributionQueue"))
    .catch(async (err) => {
      console.error("Disconnection worker failed to start:", err);
      (await RedisManager.getClient("DistributionQueue")).quit();
    });

  app.use(keycloak.middleware());

  app.use("/api", router);

  app.listen(SUPPORT_MODULE_PORT, () => {
    console.log(`Support service listening on port ${SUPPORT_MODULE_PORT}`);
  });
}

createServer();
