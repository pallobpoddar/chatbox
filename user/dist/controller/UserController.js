"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const ApiResponse_1 = require("@one.chat/shared/dist/utils/ApiResponse");
const ErrorFormatter_1 = require("../utils/ErrorFormatter");
const QueryParams_1 = require("../validator/QueryParams");
class UserController {
    metadata = (0, ApiResponse_1.generateMetadata)("1.0.0", "user");
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async getUser(req, res) {
        try {
            const userId = req.params.userId;
            const user = await this.userRepository.getUser(userId);
            return ApiResponse_1.ApiResponse.success(res, { user }, "User retrieved successfully", undefined, this.metadata);
        }
        catch (error) {
            return ApiResponse_1.ApiResponse.error(res, error.message, error.status ?? 500, error.errors, this.metadata);
        }
    }
    async getUsers(req, res) {
        try {
            (0, ErrorFormatter_1.ValidationErrorFormatter)(QueryParams_1.usersGetQueryParams.validate(req.query, { abortEarly: false }));
            const { page, length } = req.query;
            const users = await this.userRepository.getUsers(Number(page) * Number(length), Number(length));
            return ApiResponse_1.ApiResponse.success(res, { users }, "Users retrieved successfully", undefined, this.metadata);
        }
        catch (error) {
            return ApiResponse_1.ApiResponse.error(res, error.message, error.status ?? 500, error.errors, this.metadata);
        }
    }
    async fieldExists(req, res) {
        try {
            (0, ErrorFormatter_1.ValidationErrorFormatter)(QueryParams_1.userUsernameQueryParams.validate(req.query, { abortEarly: false }));
            const { query } = req;
            const [firstKey, firstValue] = Object.entries(query)[0] || [];
            const users = await this.userRepository.keycloak.users.findOne({
                q: `${firstKey}:${firstValue}`,
            });
            //   console.log(users)
            return ApiResponse_1.ApiResponse.success(res, { firstKey: firstValue, exists: !(users == null || users.length == 0) }, users == null || users.length == 0
                ? `${firstKey} avaiable`
                : `${firstKey} unavailable`, undefined, this.metadata);
        }
        catch (error) {
            return ApiResponse_1.ApiResponse.error(res, error.message, error.status ?? 500, error.errors, this.metadata);
        }
    }
    async updateProfile(req, res) {
        try {
            const decodedToken = req.kauth?.grant?.access_token?.content;
            console.log(decodedToken);
            const id = decodedToken.sub;
            const { firstName, lastName } = req.body;
            const user = await this.userRepository.updateProfile(id, firstName, lastName);
            // const user = "test"
            return ApiResponse_1.ApiResponse.success(res, { user }, "Profile updated successfully", undefined, this.metadata);
        }
        catch (error) {
            return ApiResponse_1.ApiResponse.error(res, error.message, error.status ?? 500, error.errors, this.metadata);
        }
    }
    async resetPassword(req, res) {
        try {
            const decodedToken = req.kauth?.grant?.access_token?.content;
            console.log(decodedToken);
            const id = decodedToken.sub;
            const { password } = req.body;
            const user = await this.userRepository.resetPassword(id, password);
            return ApiResponse_1.ApiResponse.success(res, { user }, "Password reset successfully", undefined, this.metadata);
        }
        catch (error) {
            return ApiResponse_1.ApiResponse.error(res, error.message, error.status ?? 500, error.errors, this.metadata);
        }
    }
}
exports.UserController = UserController;
