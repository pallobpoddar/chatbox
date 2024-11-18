import express from "express";
import { UserController } from "../../controller/UserController";
import { UserRepository } from "@one.chat/shared/dist/repositories/UserRepository";
import keycloak from "../../setup/keycloak";

async function setupUserRouter() {
    const Keycloak = await import('@one.chat/shared/dist/setup/keycloak.js')
    const kcAdminClient = await Keycloak.setupKeycloakAdmin();
    const userRepository = new UserRepository(kcAdminClient);

    const userRouter = express.Router();
    const userController = new UserController( userRepository);

    userRouter.get('/keycloak-health', keycloak.protect(), (req, res) => {
        res.json({ message: 'Keycloak is connected and the route is protected!' });
    });

    userRouter.get('/get-token', keycloak.protect(), (req: any, res) => {
        res.json({ message: (req as any).kauth.grant.access_token });
    });

    userRouter.get('/logout', keycloak.protect(), (req, res) => {
        res.json({ message: (req as any).kauth?.grant?.access_token });
    });

    //without auth
    userRouter.get('/exists', userController.fieldExists.bind(userController))

    //with auth
    userRouter.get("/permissions", keycloak.protect(), async (req:any, res) => {
        res.json(req.kauth?.grant?.access_token?.content);
    });
    userRouter.patch('/profile', keycloak.protect(), userController.updateProfile.bind(userController))
    userRouter.patch('/reset/password', keycloak.protect(), userController.resetPassword.bind(userController))

    //with auth and roles
    userRouter.get('/users',   keycloak.protect(), userController.getUsers.bind(userController))
    userRouter.get('/:userId', keycloak.protect('realm:view-users'),  userController.getUser.bind(userController))

    return userRouter
}

export default setupUserRouter