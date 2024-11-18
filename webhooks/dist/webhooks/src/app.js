"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const shared_1 = require("@one.chat/shared");
// require('dotenv').config({ path: './webhooks/.env' });
require('dotenv').config();
const WEB_TEST = process.env.WEB_TEST;
const app = (0, express_1.default)();
app.get('/', (req, res) => {
    let a = (0, shared_1.add)(5, 4);
    res.send('Hello from Webhooks service!' + a);
});
app.listen(3000, () => {
    let a = (0, shared_1.add)(5, 5);
    console.log('Webhooks service listening on port 3000 ' + WEB_TEST);
});
