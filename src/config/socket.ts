import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyAccessToken } from "../utils/jwt";
import logger from "./logger";
import { env } from "./env";

let io: SocketServer;

export function initSocket(server: HttpServer) {
  io = new SocketServer(server, {
    cors: {
      origin: env.ALLOWED_ORIGINS || "*",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }
      const decoded = verifyAccessToken(token);
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    logger.info(`Socket connected: ${socket.id} (User: ${user.id})`);

    // Join a room specifically for this user to send direct notifications
    socket.join(`user:${user.id}`);
    
    // Join rooms based on their roles
    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((role: string) => {
        socket.join(`role:${role}`);
      });
    }

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}
