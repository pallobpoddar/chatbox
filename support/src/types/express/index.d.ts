import { Request } from 'express';
import { Grant } from 'keycloak-connect';

export {}

declare global {
  namespace Express {
    export interface Request {
        kauth?: { grant?: Grant };
    }
  }
}