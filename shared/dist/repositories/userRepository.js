"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const users_1 = __importDefault(require("../models/users"));
class UserRepository {
    keycloak;
    constructor(keycloak) {
        this.keycloak = keycloak;
    }
    async createUser(id, username, email, phone) {
        const user = await users_1.default.create({
            id: id,
            username: username,
            email: email,
            phone: phone,
        });
        return user;
    }
    async dataSync() {
        let user;
        const keycloakUserCount = await this.keycloak.users.count();
        // Count users in MongoDB
        const mongoUserCount = await users_1.default.countDocuments({}, { hint: "_id_" });
        // console.log(keycloakUserCount, mongoUserCount);
        if (keycloakUserCount > mongoUserCount) {
            user = await this.getUsersfromKeycloak(mongoUserCount, keycloakUserCount);
            //   console.log( "Users Are Updated In MoongoDB" ,user);
            const users = await this.userUpdate(user);
            //   console.log( "Users Are Created In MoongoDB",users);
            console.log(`${users.length} Users Are Created In MoongoDB`);
            return users;
        }
    }
    async userUpdate(users) {
        const userDocuments = users.map((user) => ({
            id: user.id,
            username: user.username,
            email: user.email || "", // Default to empty string if email is not provided
            phone: user.attributes?.phone?.length == 1 ? user.attributes?.phone[0] : "", // Default to empty string if phone is not provided
            enabled: user.enabled,
        }));
        try {
            // Insert the user documents into the database
            const result = await users_1.default.insertMany(userDocuments, { ordered: false });
            return result;
        }
        catch (error) {
            throw error;
        }
    }
    async getUsersfromKeycloak(offset, take) {
        // console.log("offset", offset, "take", take);
        const users = await this.keycloak.users.find({
            first: Number(offset),
            max: Number(take),
        });
        return users.map((user) => UserRepository.extractFields(user));
    }
    async getUsers(offset, take) {
        // this.dataSync();
        // const user = await User.find({}).skip(Number(offset) * Number(take)).limit(Number(take));
        return this.getUsersfromKeycloak(Number(offset), Number(take));
    }
    async getUser(userId) {
        return UserRepository.extractFields(await this.keycloak.users.findOne({
            id: userId,
        }));
    }
    async updateProfile(id, firstName, lastName) {
        try {
            // Attempt to update the user's profile
            const user = await this.keycloak.users.update({ id: id }, {
                firstName: firstName,
                lastName: lastName,
            });
            console.log('User profile updated successfully:', user);
            // Return the data used for the update
            return { id, firstName, lastName, user };
        }
        catch (error) {
            // Handle any errors that occurred during the update
            console.error('Error updating user profile:', error);
            throw new Error('Failed to update user profile.');
        }
    }
    async resetPassword(id, password) {
        try {
            // Attempt to reset the user's password
            await this.keycloak.users.resetPassword({
                id: id,
                credential: {
                    type: 'password',
                    value: password,
                    temporary: false,
                },
            });
            console.log('User password reset successfully');
            return id;
        }
        catch (error) {
            // Handle any errors that occurred during the reset
            console.error('Error resetting user password:', error);
            throw new Error('Failed to reset user password.');
        }
    }
    static extractFields(user) {
        if (user) {
            const { id, username, firstName, lastName, email, enabled, createdTimestamp } = user;
            return { id, username, firstName, lastName, email, enabled, createdTimestamp };
        }
        return {};
    }
}
exports.UserRepository = UserRepository;
