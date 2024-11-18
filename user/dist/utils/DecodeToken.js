"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = decodeToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function decodeToken(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header missing' });
    }
    // Remove the "Bearer " prefix using replace
    const token = authHeader.replace(/^Bearer\s+/i, '');
    // Decode the token (this doesn't validate the signature)
    const decoded = jsonwebtoken_1.default.decode(token);
    if (!decoded) {
        return res.status(401).json({ message: 'Invalid token' });
    }
    return decoded;
}
