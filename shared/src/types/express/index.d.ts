import { Request } from "express";

export {};

declare global {
  namespace Express {
    export interface Request {
      kauth?: {
        grant?: {
          access_token?: { content: any };
          hasPermission(
            resource: string|null = null,
            action: string|null = null,
            domain: string|null = null,
          )
        };
      };
    }
  }
}
