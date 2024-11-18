"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserController_1 = require("../../controller/UserController");
const userRepository_1 = require("@one.chat/shared/dist/repositories/userRepository");
const keycloak_1 = __importDefault(require("../../setup/keycloak"));
async function setupUserRouter() {
    const Keycloak = await import('@one.chat/shared/dist/setup/keycloak.js');
    const kcAdminClient = await Keycloak.setupKeycloakAdmin();
    const userRepository = new userRepository_1.UserRepository(kcAdminClient);
    const userRouter = express_1.default.Router();
    const userController = new UserController_1.UserController(userRepository);
    userRouter.get('/keycloak-health', keycloak_1.default.protect(), (req, res) => {
        res.json({ message: 'Keycloak is connected and the route is protected!' });
    });
    userRouter.get('/get-token', keycloak_1.default.protect(), (req, res) => {
        res.json({ message: req.kauth.grant.access_token });
    });
    userRouter.get('/logout', keycloak_1.default.protect(), (req, res) => {
        res.json({ message: req.kauth?.grant?.access_token });
    });
    //without auth
    userRouter.get('/exists', userController.fieldExists.bind(userController));
    //with auth
    userRouter.get("/permissions", keycloak_1.default.protect(), async (req, res) => {
        res.json(req.kauth?.grant?.access_token?.content);
    });
    userRouter.patch('/profile', keycloak_1.default.protect(), userController.updateProfile.bind(userController));
    userRouter.patch('/reset/password', keycloak_1.default.protect(), userController.resetPassword.bind(userController));
    //with auth and roles
    userRouter.get('/users', keycloak_1.default.protect('realm:query-users'), userController.getUsers.bind(userController));
    userRouter.get('/:userId', keycloak_1.default.protect('realm:view-users'), userController.getUser.bind(userController));
    return userRouter;
}
exports.default = setupUserRouter;
