import session from "express-session";
import Keycloak from "keycloak-connect";
import { initSocketNamespaces } from "./sockets/namespaces";
import { SOCKET_SERVER_PORT } from "./config/config";
import path from "path";
import { Server } from "socket.io";
import { RedisPubSubController } from "./controller/RedisPubSubController";
import { connectDb } from "./setup/mongodb";
import { RedisManager } from "@one.chat/shared/dist/setup/redis";
import { initSubscriber } from "./subscriber";

async function initServer() {
  await RedisManager.init(["publisher", "subscriber"]);
  await connectDb();
  // Create a new session store
  const memoryStore = new session.MemoryStore();
  // Create a new Keycloak instance
  const keycloakConfigPath = path.resolve(__dirname, "../", "keycloak.json");
  const keycloak = new Keycloak({ store: memoryStore }, keycloakConfigPath);
  // Create a new Socket.IO server instance
  const io = new Server();
  // Initialize the Socket.IO namespaces
  const { chat_namespace, support_namespace } = initSocketNamespaces(
    io,
    keycloak
  );
  //get redis client
  const redisClient = await RedisManager.getClient("subscriber");

  //init subscribers
  await initSubscriber(redisClient);

  // Register all pub sub controllers here
  redisClient.on("message", (channel, message) => {
    // Create a new RedisPubSubController instance
    const redisPubSubController = new RedisPubSubController(redisClient);
    //conversation channel handler
    redisPubSubController.conversationChannelHandler(
      chat_namespace,
      channel,
      message
    );
  });

  io.listen(Number(SOCKET_SERVER_PORT));
  console.log(`Socket server listening on port ${SOCKET_SERVER_PORT}`);
}

initServer();
