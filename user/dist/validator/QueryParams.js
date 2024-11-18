"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userUsernameQueryParams = exports.usersGetQueryParams = void 0;
const joi_1 = __importDefault(require("joi"));
exports.usersGetQueryParams = joi_1.default.object({
    page: joi_1.default.number().integer().min(0).default(0).label('Page'),
    length: joi_1.default.number().integer().min(0).required().label('Length')
});
exports.userUsernameQueryParams = joi_1.default.object({
    username: joi_1.default.string()
        .alphanum() // Allows only alphanumeric characters
        .min(3) // Minimum length of 3 characters
        .max(30), // Maximum length of 30 characters
    phone: joi_1.default.string()
        .pattern(/^\+?[0-9]{10,15}$/) // Allows only digits, with a length between 10 and 15
}).xor('username', 'phone');
;
