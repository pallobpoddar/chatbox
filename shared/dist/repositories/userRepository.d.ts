import { IUser } from "src/models/interfaces/users";
export declare class UserRepository {
    keycloak: any;
    constructor(keycloak: any);
    createUser(id: string, username: string, email: string, phone: string): Promise<IUser>;
    dataSync(): Promise<import("mongoose").MergeType<import("mongoose").Document<unknown, {}, IUser> & IUser & {
        _id: import("mongoose").Types.ObjectId;
    }, Omit<{
        id: any;
        username: any;
        email: any;
        phone: any;
        enabled: any;
    }[], "_id">>[] | undefined>;
    userUpdate(users: any[]): Promise<import("mongoose").MergeType<import("mongoose").Document<unknown, {}, IUser> & IUser & {
        _id: import("mongoose").Types.ObjectId;
    }, Omit<{
        id: any;
        username: any;
        email: any;
        phone: any;
        enabled: any;
    }[], "_id">>[]>;
    getUsersfromKeycloak(offset: number, take: number): Promise<any>;
    getUsers(offset: number, take: number): Promise<any>;
    getUser(userId: string): Promise<{
        id: any;
        username: any;
        firstName: any;
        lastName: any;
        email: any;
        enabled: any;
        createdTimestamp: any;
    } | {
        id?: undefined;
        username?: undefined;
        firstName?: undefined;
        lastName?: undefined;
        email?: undefined;
        enabled?: undefined;
        createdTimestamp?: undefined;
    }>;
    updateProfile(id: string, firstName: string, lastName: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        user: any;
    }>;
    resetPassword(id: string, password: string): Promise<string>;
    static extractFields(user: any): {
        id: any;
        username: any;
        firstName: any;
        lastName: any;
        email: any;
        enabled: any;
        createdTimestamp: any;
    } | {
        id?: undefined;
        username?: undefined;
        firstName?: undefined;
        lastName?: undefined;
        email?: undefined;
        enabled?: undefined;
        createdTimestamp?: undefined;
    };
}
