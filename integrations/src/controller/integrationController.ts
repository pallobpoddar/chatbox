import { Request, Response } from "express";
import { IntegrationRepository } from "../repositories/whatsapp.integration";
import {
  ApiResponse,
  generateMetadata,
} from "@one.chat/shared/dist/utils/ApiResponse";
import { RedisManager } from "@one.chat/shared/dist/setup/redis";
import EventAction from "../utils/EventAction";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/config";
import { ValidationErrorFormatter } from "../utils/ErrorFormatter";
import { integrationGetQueryParams } from "../validator/QueryParams";
import { InputIntegrationSchema } from "../validator/Integration";
import {
  FilterParamsDecoder,
  QueryToPagination,
  ResultToPagination,
  SortParamsDecoder,
} from "@one.chat/shared/dist/utils/ParamDecoder";

export class IntegrationController {
  private integrationRepository: IntegrationRepository;
  private kcClient: any;
  private metadata = generateMetadata("1.0.0", "integration");
  public constructor(
    integrationRepository: IntegrationRepository,
    kcClient: any
  ) {
    (this.integrationRepository = integrationRepository),
      (this.kcClient = kcClient);
  }

  async createIntegration(req: Request, res: Response) {
    ValidationErrorFormatter(
      InputIntegrationSchema.validate(req.body, { abortEarly: false })
    );
    const userId = req.params.userId;
    const { phoneNoId, apiKey } = req.body; // Extract necessary fields from the request body

    try {
      const integration = await this.integrationRepository.createIntegration(
        userId,
        { phoneNoId, apiKey }
      );
      return ApiResponse.success(
        res,
        { integration },
        "Integration created successfully",
        this.metadata
      );
    } catch (error: any) {
      let responseMessage = error.message;
      let responseStatus = error.status ?? 500;
      let responseErrors = error.errors;

      // Check if the error is a MongoDB duplicate key error
      if (error.code === 11000) {
        // Extract the duplicate key details
        const field = Object.keys(error.keyValue)[0];
        const value = error.keyValue[field];
        responseMessage = `Duplicate value for field: ${field}`;
        responseErrors = {
          field: field,
          value: value,
        };
        responseStatus = 409; // Conflict status code
      }

      // Return the formatted error response
      return ApiResponse.error(
        res,
        responseMessage,
        responseStatus,
        responseErrors,
        this.metadata
      );
    }
  }

  async getIntegrationByPhoneNoId(req: Request, res: Response) {
    const phoneNoId = req.params.phoneNoId;
    try {
      const integration =
        await this.integrationRepository.getIntegrationByPhoneNoId(phoneNoId);
      return ApiResponse.success(
        res,
        { integration },
        "Integration retrieved successfully",
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

  async incomingMessage(req: Request, res: Response) {
    try {
      this.integrationRepository.setKcClient(this.kcClient);
      const data = req.body;
      const businessId = req.params.participantId;
      const entry = data.entry[0];
      const changes = entry.changes[0].value;

      // Check if we have a status or a message
      const status = changes.statuses ? changes.statuses[0] : null;
      const messageData = changes.messages ? changes.messages[0] : null;
      //decodedMessage has two instance data of massgae with named data and my own business number as businessNumber
      const decodedMessage = await this.integrationRepository.decodeMessage(
        data
      );
      this.integrationRepository.setFullName(changes.contacts[0].profile.name);

      const userinfo = await this.integrationRepository.searchUserByPhoneNumber(
        "+" + decodedMessage.participantsNo?.sender
      );

      const myBusinessInfo =
        await this.integrationRepository.searchUserByPhoneNumber(
          "+" + decodedMessage.participantsNo?.businessNumber
        );
      if (businessId != myBusinessInfo[0].id) {
        throw new Error("Unauthorized");
      }
      const apiKey = await this.integrationRepository.getApiKey(
        decodedMessage.participantsNo?.businessNumber
      );
      console.log("dasdaudaihsdasd", userinfo[0].id);
      decodedMessage.data.sender = userinfo[0].id;
      console.log(myBusinessInfo[0].id, userinfo[0].id);
      console.log(apiKey);

      if (status && messageData == null) {
        (await RedisManager.getClient("general")).rpush(
          "thirdparty:incoming",
          EventAction(
            "event",
            decodedMessage.data.sender,
            [userinfo[0].id, myBusinessInfo[0].id],
            {},
            [decodedMessage.data],
            {
              businessNumber: decodedMessage.participantsNo?.businessNumber,
              apiKey: decodedMessage.data.apiKey,
            }
          )
        );
        return ApiResponse.success(
          res,
          { status },
          "Status received successfully",
          undefined,
          this.metadata
        );
      }
      console.log(decodedMessage.data);

      const InboxChunk: any = decodedMessage.data;
      if (status == null && messageData) {
        console.log("I am inside the if");
        (await RedisManager.getClient("general")).rpush(
          "thirdparty:incoming",
          EventAction(
            "message",
            userinfo[0].id,
            [userinfo[0].id, myBusinessInfo[0].id],
            {},
            [decodedMessage.data],
            {
              businessNumber: decodedMessage.participantsNo?.businessNumber,
              apiKey: apiKey,
            }
          )
        );
      }

      return ApiResponse.success(
        res,
        { InboxChunk },
        "Message received successfully",
        undefined,
        this.metadata
      );
    } catch (error: any) {
      console.log(error);
      return ApiResponse.error(
        res,
        error.message,
        error.status ?? 500,
        error.errors,
        this.metadata
      );
    }
  }

  async verifyWebhook(req: Request, res: Response) {
    const businessId = req.params.participantId;
    const token: any = req.query["hub.verify_token"];
    //its a jwt token
    const decodedToken: any = jwt.verify(token, JWT_SECRET!);
    console.log("decode token", decodedToken);

    // const user = await this.kcClient.users.findOne({id: decodedToken.userId})

    if (
      req.query["hub.mode"] == "subscribe" &&
      decodedToken.userId == businessId
    ) {
      console.log("token verified");
      res.send(req.query["hub.challenge"]);
    } else {
      res.sendStatus(400);
    }
    return res.sendStatus(200);
  }

  async getIntegrations(req: Request, res: Response) {
    try {
      ValidationErrorFormatter(
        integrationGetQueryParams.validate(req.query, { abortEarly: false })
      );

      // Extract pagination parameters from the query
      const pagination = QueryToPagination(req.query);

      // Decode filters and sort parameters
      const filters = FilterParamsDecoder(req.query?.filters as string);
      const sort = SortParamsDecoder(req.query?.sort as string);

      // Fetch integrations data and total count
      const { integrations, totalItems } =
        await this.integrationRepository.getIntegrations(
          pagination.request.skip,
          pagination.request.limit,
          filters,
          sort
        );

      // Update pagination metadata with the total number of items
      const paginatedResult = ResultToPagination(totalItems, pagination);

      // Return the integrations along with pagination metadata
      return ApiResponse.success(
        res,
        { integrations }, // Include pagination metadata in the response
        "Integrations retrieved successfully",
        paginatedResult.pagination,
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

  async updateWhatsAppCredentials(req: Request, res: Response) {
    try {
      ValidationErrorFormatter(
        InputIntegrationSchema.validate(req.body, { abortEarly: false })
      );
      const userId = req.params.userId; // Assuming the userId is passed in the request params
      const { phoneNoId, apiKey } = req.body;
      // Call repository method to update credentials
      const Integration =
        await this.integrationRepository.updateWhatsAppCredentials(
          userId,
          phoneNoId,
          apiKey
        );

      if (!Integration) {
        throw new Error("Failed to update credentials");
      }

      ApiResponse.success(
        res,
        { Integration },
        "Credentials updated successfully",
        undefined,
        this.metadata
      );
    } catch (err) {
      ApiResponse.error(
        res,
        (err as Error).message,
        500,
        undefined,
        this.metadata
      );
    }
  }

  async deleteIntegration(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const Integration = await this.integrationRepository.deleteIntegration(
        userId
      );
      if (!Integration) {
        throw new Error("Failed to delete integration");
      }
      ApiResponse.success(
        res,
        { Integration },
        "Integration deleted successfully",
        undefined,
        this.metadata
      );
    } catch (err) {
      ApiResponse.error(
        res,
        (err as Error).message,
        500,
        undefined,
        this.metadata
      );
    }
  }
}
