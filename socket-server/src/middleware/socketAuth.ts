import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

// Type for the middleware function
type NextFunction = (err?: Error) => void;

export const socketAuth = async (socket: Socket, next: NextFunction) => {
  const token = socket.handshake.headers.authorization?.split(" ")[1];
  if (!token) {
    return next(new Error("No token provided"));
  }

  try {
    const grant = await socket.data.keycloak.grantManager.validateAccessToken(
      token
    );

    if (grant) {
      const decodedToken = jwt.decode(grant);
      const userId = decodedToken?.sub;

      if (userId) {
        socket.data.user = {
          id: userId,
        };
        next();
      } else {
        next(new Error("User ID not found in token"));
      }
    } else {
      next(new Error("Invalid token"));
    }
  } catch (err) {
    console.error("Token validation error:", err);
    next(new Error("Authentication error"));
  }
};
