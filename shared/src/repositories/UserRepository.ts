import { IUser } from "src/models/interfaces/users";
import User from "../models/users";

export class UserRepository {
  public keycloak;
  public constructor(keycloak: any) {
    this.keycloak = keycloak;
  }

  async createUser(
    id: string,
    username: string,
    email: string,
    phone: string
  ): Promise<IUser> {
    const user = await User.create({
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
    const mongoUserCount = await User.countDocuments({}, { hint: "_id_" });

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

  async userUpdate(users: any[]) {
    const userDocuments = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email || "", // Default to empty string if email is not provided
      phone: user.attributes?.phone?.length == 1 ? user.attributes?.phone[0] : "", // Default to empty string if phone is not provided
      enabled: user.enabled,
    }));
    try {
      // Insert the user documents into the database
      const result = await User.insertMany(userDocuments, { ordered: false });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getUsersfromKeycloak(offset: number, take: number, filters: any = {}, sort: any[] = []) {
    const queryParams: any = {
        first: Number(offset),
        max: Number(take),
        ...(filters.username && { username: filters.username }),
        ...(filters.email && { email: filters.email }),
        ...(filters.firstName && { firstName: filters.firstName }),
        ...(filters.lastName && { lastName: filters.lastName }),
        ...(filters.enabled !== undefined && { enabled: filters.enabled }),
        ...(filters.idpAlias && { idpAlias: filters.idpAlias }),
        ...(filters.q && { q: filters.q }),  // Fuzzy search across multiple fields
        ...(filters.exact && { exact: filters.exact }) // Exact match if required
    };

    const users = await this.keycloak.users.find(queryParams);

    // console.log(users)

    // Apply in-memory sorting since Keycloak doesn't support native sorting
    const sortedUsers = sort.length
      ? users.sort((a: any, b: any) => {
          for (const [field, order] of sort) {
            if (a[field] < b[field]) return order === 1 ? -1 : 1;
            if (a[field] > b[field]) return order === 1 ? 1 : -1;
          }
          return 0;
        })
      : users;

    // Extract necessary fields and return
    return sortedUsers.map((user: any) => UserRepository.extractFields(user));
}

  async getUsers(offset: number, take: number, filters: any , sort: any[] ) {
    return this.getUsersfromKeycloak(Number(offset), Number(take), filters, sort);
  }

  async getUser(userId: string) { 
    return UserRepository.extractFields(await this.keycloak.users.findOne({
      id: userId!,
    }));
  }

  async updateProfile(id: string, firstName: string, lastName: string) {
    try {
      // Attempt to update the user's profile
      const user = await this.keycloak.users.update(
        { id: id },
        {
          firstName: firstName,
          lastName: lastName,
        }
      )

      console.log('User profile updated successfully:', user);

      // Return the data used for the update
      return { id, firstName, lastName, user };
    } catch (error) {
      // Handle any errors that occurred during the update
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile.');
    }
  }

  async resetPassword(id: string, password: string) {
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
    } catch (error) {
      // Handle any errors that occurred during the reset
      console.error('Error resetting user password:', error);
      throw new Error('Failed to reset user password.');
    }
  }

  static extractFields(user: any) {
    if (user) {
      const { id, username, firstName, lastName, email, enabled, emailVerified, attributes, createdTimestamp } = user;
      return { id, username, firstName, lastName, email, enabled, emailVerified, attributes, createdTimestamp };
    }
    return {};
  }
}
