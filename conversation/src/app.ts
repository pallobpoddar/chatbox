import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { connectDb} from "./setup/db";
import { CONVERSATION_MODULE_PORT } from "./config/config";
import router from "./routes/routes";
import keycloak from "./setup/keycloak";
import session from "express-session";
import { RedisManager } from "@one.chat/shared/dist/setup/redis";
import { IntegrationRepository } from "@one.chat/shared/dist/repositories/IntegrationRepository";
import { MessageRepository } from "@one.chat/shared/dist/repositories/MessageRepository";
import conversation from "@one.chat/shared/dist/repositories/ConversationRepository";

import { IncomingThirdPartyWorker } from "./worker/worker";

const app = express();

async function createServer() {
  await RedisManager.init(["QueueListener","general"]);

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

  app.use(keycloak.middleware());

  app.use("/api", router);
  const redisClient=await RedisManager.getClient("general");

  const Keycloak = await import("@one.chat/shared/dist/setup/keycloak.js");
  const kcAdminClient = await Keycloak.setupKeycloakAdmin();

  // Initialize and start the ThirdPartyWorker
  const thirdPartyWorker = new IncomingThirdPartyWorker(
    new IntegrationRepository(redisClient, new conversation( redisClient ), new MessageRepository(redisClient))
  );
  thirdPartyWorker.start(await RedisManager.getClient("QueueListener")).catch(async (err) => {
    console.error("ThirdPartyWorker failed to start:", err);
    (await RedisManager.getClient("QueueListener")).quit();
  });

  app.listen(CONVERSATION_MODULE_PORT, () => {
    console.log(
      `Messaging service listening on port ${CONVERSATION_MODULE_PORT}`
    );
  });
}

createServer();
