"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = require("./config/config");
const routes_1 = __importDefault(require("./routes/routes"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const express_session_1 = __importDefault(require("express-session"));
const keycloak_1 = __importDefault(require("./setup/keycloak"));
require("dotenv").config();
const mongodb = process.env.TEST_MONGODB_URL;
const app = (0, express_1.default)();
async function startServer() {
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    app.use((0, express_session_1.default)({
        secret: "secret",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    }));
    mongoose_1.default
        .connect(mongodb)
        .then(() => {
        console.log("Connected to MongoDB");
    })
        .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });
    app.use(keycloak_1.default.middleware());
    app.get("/", keycloak_1.default.protect(), async (req, res) => {
        res.json(req.kauth?.grant?.access_token);
    });
    const apiRoutes = await (0, routes_1.default)();
    app.use("/api", apiRoutes);
    app.listen(config_1.SERVER_PORT, () => {
        console.log("User service listening on port ", config_1.SERVER_PORT);
    });
}
startServer();
