import { Server, Socket } from "socket.io";
import { socketAuth } from "../../middleware/socketAuth";
import OnlineUserController from "../../controller/OnlineUserController";

export function initNamespace(
  io: Server,
  namespace: string,
  keycloak: any = null
) {
  const namespaceIns = io.of(namespace);

  //pass keycloak to socket server
  if (keycloak !== null) {
    namespaceIns.use((socket, next) => {
      socket.data.keycloak = {
        grantManager: keycloak.grantManager,
      };

      next();
    });

    namespaceIns.use(socketAuth);

    console.log(`Using keycloak middlewares for ${namespace} namespace `);
  }

  namespaceIns.on("connection", async (socket: Socket) => {
    console.log(
      `User id: ${socket.data?.user?.id} connected to ${namespace} namespace `
    );

    const onlineUserController = new OnlineUserController(
      socket,
      namespace.split("/")[1]
    );
    onlineUserController.socketConnectionHandler();

    await socket.join(`${socket.data?.user?.id}`);

    socket.on("disconnect", async () => {
      console.log(
        `User id: ${socket.data?.user?.id} disconnected from ${namespace} namespace `
      );

      onlineUserController.socketDisconnectionHandler();
    });
  });

  return namespaceIns;
}
