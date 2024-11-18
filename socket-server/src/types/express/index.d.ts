import * as express from "express";

declare global {
  namespace Express {
    interface Request {
      keycloak: any; // Add your custom properties here
    }
  }
}
