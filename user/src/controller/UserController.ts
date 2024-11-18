import {
  ApiResponse,
  generateMetadata,
} from "@one.chat/shared/dist/utils/ApiResponse";
import express from "express";
import { ValidationErrorFormatter } from "../utils/ErrorFormatter";
import {
  usersGetQueryParams,
  userUsernameQueryParams,
} from "../validator/QueryParams";
import User from "@one.chat/shared/dist/models/users";
import { UserRepository } from "@one.chat/shared/dist/repositories/UserRepository";
import { SortParamsDecoder, FilterParamsDecoder } from "../utils/ParamsDecoder";
import { TRADE_APP_URL, TRADE_APP_EMAIL, TRADE_APP_PASSWORD } from "../config/config";
import axios from "axios";

export class UserController {
  private metadata = generateMetadata("1.0.0", "user");
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async getUser(req: express.Request, res: express.Response) {
    try {

      const userId = req.params.userId as string
      const user = await this.userRepository.getUser(userId)

      return ApiResponse.success(
        res,
        { user },
        "User retrieved successfully",
        undefined,
        this.metadata
      );
    } catch (error: any) {
      return ApiResponse.error(
        res,
        error.message,
        error.status ?? 500,
        error.errors,
        this.metadata
      );
    }
  }

  async getUsers(req: express.Request, res: express.Response) {
    try {
      ValidationErrorFormatter(
        usersGetQueryParams.validate(req.query, { abortEarly: false })
      );
  
      const { page, length } = req.query;
      const filters = FilterParamsDecoder(req.query?.filters as string);
      const sort = SortParamsDecoder(req.query?.sort as string);
  
      // Pass filters, sort, and pagination to the repository
      const users = await this.userRepository.getUsers(
        Number(page) * Number(length),
        Number(length),
        filters,
        sort
      );
  
      return ApiResponse.success(
        res,
        { users },
        "Users retrieved successfully",
        undefined,
        this.metadata
      );
    } catch (error: any) {
      return ApiResponse.error(
        res,
        error.message,
        error.status ?? 500,
        error.errors,
        this.metadata
      );
    }
  }
  

  async fieldExists(req: express.Request, res: express.Response) {
    try {
      ValidationErrorFormatter(
        userUsernameQueryParams.validate(req.query, { abortEarly: false })
      );
      const { query } = req;
      const [firstKey, firstValue] = Object.entries(query)[0] || [];
      const users = await this.userRepository.keycloak.users.findOne({
        q: `${firstKey}:${firstValue}`,
      });
      // console.log(users[0].id)
      return ApiResponse.success(
        res,
        { firstKey: firstValue, exists: !(users == null || users.length == 0),id:users[0]?.id },
        users == null || users.length == 0
          ? `${firstKey} avaiable`
          : `${firstKey} unavailable`,
        undefined,
        this.metadata
      );
    } catch (error: any) {
      return ApiResponse.error(
        res,
        error.message,
        error.status ?? 500,
        error.errors,
        this.metadata
      );
    }
  }

  async updateProfile(req: express.Request, res: express.Response) {
    try {
      const decodedToken = (req as any).kauth?.grant?.access_token?.content;
      console.log(decodedToken)
      const id=decodedToken.sub
      const { firstName, lastName } = req.body;
      const user = await this.userRepository.updateProfile(id, firstName, lastName);
      // const user = "test"
      return ApiResponse.success(res, { user }, "Profile updated successfully", undefined, this.metadata);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, error.status ?? 500, error.errors, this.metadata);
    }
  }

  async resetPassword(req: express.Request, res: express.Response) {
    try {
      const decodedToken = (req as any).kauth?.grant?.access_token?.content;
      console.log(decodedToken)
      const id=decodedToken.sub
      const { password } = req.body;
      const user = await this.userRepository.resetPassword(id, password);
      return ApiResponse.success(res, { user }, "Password reset successfully", undefined, this.metadata);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, error.status ?? 500, error.errors, this.metadata);
    }
  }

  async tradeToken(req: express.Request, res: express.Response) {
    try {

      const email=TRADE_APP_EMAIL?.toString()
      const password=TRADE_APP_PASSWORD?.toString()
      // Extract email and password from the request body
      // Make the axios POST request to send the email and password in the body
      const response = await axios.post(TRADE_APP_URL as string, {
        email, // send the email
        password // send the password
      });

      const Trade_token= response.data.data.accessToken

      // Pass the axios response data to the success method
      return ApiResponse.success(res, {Trade_token}, "Request successful", undefined, this.metadata);
    } catch (error: any) {
      console.log("error", error)
      // Handle errors and send an error response
      return ApiResponse.error(res, error.message, error.response?.status ?? 500, error.response?.data?.errors, this.metadata);
    }
  }
}
