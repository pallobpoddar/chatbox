"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Define the User Schema
const userSchema = new mongoose_1.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        unique: true,
    },
    phone: {
        type: String,
        unique: true,
    },
    enabled: {
        type: Boolean,
        required: true
    }
}, { timestamps: true });
// Create the User Model
const User = (0, mongoose_1.model)('User', userSchema);
exports.default = User;
