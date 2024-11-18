import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { INTEGRATION_MODULE_PORT } from "./config/config";
import { MONGODB_URL } from "@one.chat/shared/dist/config/config";
import mongoose from "mongoose";
import router from "./routes/routes";
import session from "express-session";
import keycloak from "./setup/keyCloak";
import { RedisManager } from '@one.chat/shared/dist/setup/redis'
import { ThirdPartyWorker } from "./utils/worker";
import { ThirdPartyService } from "./service/thirdParty";
import setupRoutes from "./routes/routes";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "./config/config";

const app = express();

const createServer = async () => {

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

  await mongoose
    .connect(MONGODB_URL)
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.log(err);
    });


  app.use(keycloak.middleware());

  const apiRoutes: any = await setupRoutes();
  app.use("/api", apiRoutes);

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  const Keycloak = await import('@one.chat/shared/dist/setup/keycloak.js')
  const kcAdminClient = await Keycloak.setupKeycloakAdmin();

  // Initialize and start the ThirdPartyWorker
  const thirdPartyWorker = new ThirdPartyWorker(new ThirdPartyService(kcAdminClient));
  thirdPartyWorker.start(await RedisManager.getClient("QueueListener")).catch(async err => {
    console.error('ThirdPartyWorker failed to start:', err);
    (await RedisManager.getClient("QueueListener")).quit();
  });

  const createtoken= jwt.sign({ foo: 'bar' }, 'shhhhh');


  app.listen(INTEGRATION_MODULE_PORT, () => {
    console.log(
      `Integrations service listening on port ${INTEGRATION_MODULE_PORT}`
    );
  });
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});
};

createServer();
