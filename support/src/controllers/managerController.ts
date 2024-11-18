import {
  ApiResponse,
  generateMetadata,
} from "@one.chat/shared/dist/utils/ApiResponse";
import ManagerRepository from "@one.chat/shared/dist/repositories/ManagerRepository";
import { Request, Response } from "express";
import { ValidationErrorFormatter } from "../utils/ErrorFormatter";
import managerValidator from "../validators/managerValidator";
import {QueryToPagination, ResultToPagination, SortParamsDecoder, FilterParamsDecoder} from "@one.chat/shared/dist/utils/ParamDecoder"


class ManagerController {
  private metadata = generateMetadata("1.0.0", "manager");
  private managerRepository: ManagerRepository;

  constructor(managerRepository: ManagerRepository) {
    this.managerRepository = managerRepository;
  }

  private setTokenContent(token: string) {
    this.managerRepository.setTokenContent(token);
  }

  async createManager(req: Request, res: Response) {
    try {
      const authInfo = req.kauth?.grant?.access_token as any;
      const token = authInfo?.content;
      this.setTokenContent(token);

      const manager = await this.managerRepository.createManager();

      return ApiResponse.success(
        res,
        { manager },
        "Manager created successfully",
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

  async createManagerWithUserId(req: Request, res: Response) {
    try {
      const userId=req.params.userId

      const manager = await this.managerRepository.createManagerWithUserId(userId);

      return ApiResponse.success(
        res,
        { manager },
        "Manager created successfully",
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

  async getManager(req: Request, res: Response) {
    try {
      const authInfo = req.kauth?.grant?.access_token as any;
      const token = authInfo?.content;
      this.setTokenContent(token);

      const manager = await this.managerRepository.getManager();

      return ApiResponse.success(
        res,
        { manager },
        "Manager received successfully",
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

  async getAllManager(req: Request, res: Response) {
    try {
      // Extract pagination parameters from the query
      const pagination = QueryToPagination(req.query);
  
      // Decode filters and sort parameters
      const filters = FilterParamsDecoder(req.query?.filters as string);
      const sort = SortParamsDecoder(req.query?.sort as string);
  
      // Fetch managers from the repository with filters, sorting, and pagination
      const managers = await this.managerRepository.getAllManagers(
        filters,
        sort,
        pagination.request.skip,
        pagination.request.limit
      );
  
      // Get the total count of managers that match the filters for pagination
      const totalItems = await this.managerRepository.getManagerCount(filters);
  
      // Format the result into pagination response
      const paginatedResponse = ResultToPagination(totalItems, pagination);
  
      return ApiResponse.success(
        res,
        { managers },
        "Manager received successfully",
        paginatedResponse.pagination,
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

  async addManagers(req: Request, res: Response) {
    try {
      ValidationErrorFormatter(managerValidator.validate(req.body));

      const authInfo = req.kauth?.grant?.access_token as any;
      const token = authInfo?.content;
      this.setTokenContent(token);
      const { managers } = req.body;

      const manager = await this.managerRepository.addManagers(managers);

      return ApiResponse.success(
        res,
        { manager },
        "Managers added successfully",
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

  async addManagersByOwnerId(req: Request, res: Response) {
    try {
      ValidationErrorFormatter(managerValidator.validate(req.body));

      const owner = req.params.ownerId;
      const { managers } = req.body;

      const manager = await this.managerRepository.addManagersByOwnerId( owner,managers);

      return ApiResponse.success(
        res,
        { manager },
        "Managers added successfully",
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

  async removeManagers(req: Request, res: Response) {
    try {
      ValidationErrorFormatter(managerValidator.validate(req.body));

      const authInfo = req.kauth?.grant?.access_token as any;
      const token = authInfo?.content;
      this.setTokenContent(token);
      const { managers } = req.body;

      const manager = await this.managerRepository.removeManagers(managers);

      return ApiResponse.success(
        res,
        { manager },
        "Managers removed successfully",
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

  async deleteManager(req: Request, res: Response) {
    try {
      const authInfo = req.kauth?.grant?.access_token as any;
      const token = authInfo?.content;
      this.setTokenContent(token);

      const manager = await this.managerRepository.deleteManager();

      return ApiResponse.success(
        res,
        { manager },
        "Manager deleted successfully",
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
}

export default ManagerController;
