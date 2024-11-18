import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import axios from "axios";
import fs from "fs";

interface KeycloakConfig {
  realm: string;
  "auth-server-url": string;
  "ssl-required": string;
  resource: string;
  credentials: {
    secret: string;
  };
}

const loadKeycloakConfig = (): KeycloakConfig => {
  //   const configPath = path.join(__dirname, 'keycloak.json');
  const configData = fs.readFileSync("./shared/keycloak.json", "utf-8");
  return JSON.parse(configData) as KeycloakConfig;
};

class KeyCloak {
  static cachedPublicKey: string | null = null;
  static publicKeyFetchTime: number | null = null;

  // Middleware function that checks if the request has a valid token
  static middleware = (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("No token provided");
      }
      const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"
      const decoded = jwt.decode(token) as JwtPayload; // Casting to JwtPayload to access claims like exp
      req.kauth = {
        grant: {
          access_token: { content: decoded },
          hasPermission(
            resource: string|null = null,
            action: string|null = null,
            domain: string|null = null,
          ) {
            const userRoles = req.kauth?.grant?.access_token?.content?.realm_access?.roles || [];
            console.log("User roles:", userRoles);

            // Decode roles into resource, action, and domain using the updated object structure
            const splitRoles = userRoles
              .map(KeyCloak.decodeRole)
              .filter(Boolean);
            console.log("Split roles:", splitRoles);

            // Check if the user has the required role by comparing resource, action, and domain
            const hasRequiredPermission = splitRoles.some(
              (role: { resource: string; action: string; domain: string }) => {
                return (
                  (!resource || role.resource === resource) && // Check if resource matches or is not required
                  (!action || role.action === action) && // Check if action matches or is not required
                  (!domain || role.domain === domain) // Check if domain matches or is not required
                );
              }
            );

            return hasRequiredPermission;
          },
        },
      };
    } catch (error: any) {
      console.error(error.message);
      req.kauth = undefined;
    } finally {
      next();
    }
  };

  // verify that token is valid
  static async verify(token: string) {
    const keycloakConfig = loadKeycloakConfig();
    const KEYCLOAK_URL = keycloakConfig["auth-server-url"].replace(/\/$/, ""); // Remove trailing slash if exists
    const REALM_NAME = keycloakConfig.realm;
    const PUBLIC_KEY_URL = `${KEYCLOAK_URL}/realms/${REALM_NAME}/protocol/openid-connect/certs`;

    const loadAndCachePublicKey = async () => {
      console.log("Loading Keycloak public key...");
      const now = Date.now();
      try {
        const response = await axios.get(PUBLIC_KEY_URL);
        const key = response.data.keys[0]; // Assuming the first key is the one to be used
        const publicKey = `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
        // Cache the public key and timestamp
        KeyCloak.cachedPublicKey = publicKey;
        KeyCloak.publicKeyFetchTime = now;
        console.log("Keycloak public key loaded and cached.");
      } catch (error: any) {
        console.error("Failed to load Keycloak public key:", error);
        throw new Error("Failed to get Keycloak public key: " + error.message);
      }
    };

    const getKeycloakPublicKey = async (): Promise<string> => {
      const now = Date.now();

      // Check if the public key is cached and still valid
      if (
        KeyCloak.cachedPublicKey &&
        KeyCloak.publicKeyFetchTime &&
        now - KeyCloak.publicKeyFetchTime < 1 * 60 * 60 * 1000
      ) {
        // console.log("Using cached Keycloak public key");
        return KeyCloak.cachedPublicKey;
      }

      // If public key is not cached or expired, load it
      loadAndCachePublicKey();

      // Check for the availability of the cached public key up to 10 times, every 1 second
      for (let attempts = 0; attempts < 10; attempts++) {
        if (KeyCloak.cachedPublicKey) {
          return KeyCloak.cachedPublicKey;
        }
        // Wait for 1 second before checking again
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      throw new Error(
        "Failed to get Keycloak public key after multiple attempts."
      );
    };

    const publicKey = await getKeycloakPublicKey();
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"], // Keycloak signs tokens with RS256
      issuer: `${KEYCLOAK_URL}/realms/${REALM_NAME}`, // Optional: Validate issuer
    }) as JwtPayload; // Casting to JwtPayload to access claims like exp

    return decoded;
  }

  // Splitting function that separates resource, action, and domain from the role
  static decodeRole(role: string): {
    resource: null | string;
    action: null | string;
    domain: null | string;
  } {
    const parts = role.split(/[.-]/);
    const len = parts.length;

    if (len >= 3) {
      const resource = parts.slice(0, len - 2).join(".");
      const action = parts[len - 2];
      const domain = parts[len - 1];
      return { resource, action, domain };
    }
    return { resource: null, action: null, domain: null }; // If role doesn't have at least 3 parts, return null
  }

  // Main method that will act as role check and auth middleware
  // Middleware to check for role permissions
  static protect = (
    resource: string | null = null,
    action: string | null = null,
    domain?: string | null
  ) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tokenData = req.kauth?.grant?.access_token?.content;

        // Check if the authorization header is present and starts with 'Bearer'
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw new Error("No token provided");
        }

        // Check if token data exists
        if (!tokenData) {
          throw new Error("Token Invalid");
        }

        // Simulate token verification (you can implement your own logic or call external service)
        await KeyCloak.verify(authHeader.split(" ")[1]);

        // If no specific permission is provided, just validate token existence
        if (!resource && !action && !domain) {
          console.log(
            "No specific permission required, token is valid, allow access"
          );
          return next();
        }

        

        // Check if the user has the required role by comparing resource, action, and domain
        const hasRequiredPermission = req.kauth?.grant?.hasPermission(
          resource || null,
          action || null,
          domain || null
        )

        if (hasRequiredPermission) {
          console.log("User has the required role, allow access");
          return next();
        } else {
          console.log("User doesn't have the required role, deny access");
          return res.status(403).json({
            message: `Forbidden - You don't have the required role: ${
              resource || "any"
            }.${action || "any"}${domain ? "." + domain : ""}`,
          });
        }
      } catch (error: any) {
        return res
          .status(401)
          .json({ message: error.message || "Unauthorized - Invalid token" });
      }
    };
  };
}

export default KeyCloak;
