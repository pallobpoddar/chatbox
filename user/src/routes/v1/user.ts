import express from "express";
import { UserController } from "../../controller/UserController";
import { UserRepository } from "@one.chat/shared/dist/repositories/UserRepository";
import KeyCloak from "@one.chat/shared/dist/middleware/KeycloakAuth";

async function setupUserRouter() {
  const Keycloak = await import("@one.chat/shared/dist/setup/keycloak.js");
  const kcAdminClient = await Keycloak.setupKeycloakAdmin();
  const userRepository = new UserRepository(kcAdminClient);

  const userRouter = express.Router();
  const userRouterNoAuth = express.Router();

  const userController = new UserController(userRepository);

  userRouter.use(KeyCloak.middleware);

  userRouter.get("/keycloak-health", (req, res) => {
    res.json({ message: "Keycloak is connected and the route is protected!" });
  });

  userRouter.get("/get-token", (req: any, res) => {
    res.json({ message: (req as any).kauth.grant.access_token });
  });

  userRouter.get("/logout", (req, res) => {
    res.json({ message: (req as any).kauth?.grant?.access_token });
  });

  //without auth
  userRouterNoAuth.get(
    "/exists",
    userController.fieldExists.bind(userController)
  );

  //with auth
  userRouter.get("/permissions", async (req: any, res) => {
    res.json(req.kauth?.grant?.access_token?.content);
  });
  userRouter.patch(
    "/profile",
    KeyCloak.protect("user", "update"),
    userController.updateProfile.bind(userController)
  );
  userRouter.patch(
    "/reset/password",
    KeyCloak.protect("user", "update"),
    userController.resetPassword.bind(userController)
  );

  //user.trade.read.all
  userRouter.get(
    "/trade_token",
    userController.tradeToken.bind(userController)
  );

  //with auth and roles
  userRouter.get(
    "/users",
    KeyCloak.protect("user", "read"),
    userController.getUsers.bind(userController)
  );
  userRouter.get(
    "/:userId",
    KeyCloak.protect(),
    userController.getUser.bind(userController)
  );

  return userRouterNoAuth.use("", userRouter);
}

export default setupUserRouter;
