import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import ArtistApplication from "../models/ArtistApplication.js";


let io = null;

const ALLOWED_ROLES = new Set([
"user",
"artist",
"superadmin",
]);

const JWT_ISSUER =
process.env.JWT_ISSUER || "lyrics-wayyy";

const JWT_AUDIENCE =
process.env.JWT_AUDIENCE || "lyrics-wayyy-users";

const getJwtSecret = () => {
const secret =
process.env.JWT_SECRET ||
process.env.JWT_ACCESS_SECRET;

if (typeof secret !== "string" || secret.length < 32) {
throw new Error(
"JWT_SECRET or JWT_ACCESS_SECRET must be at least 32 characters."
);
}

return secret;
};

const normalizeOrigin = (origin) =>
String(origin || "").replace(/\/+$/, "");

const getUserIdFromRecipient = (recipient) => {
if (!recipient) return null;

const value = recipient?._id || recipient;

if (!mongoose.Types.ObjectId.isValid(String(value))) {
return null;
}

return String(value);
};

const serializeNotification = (notification) => {
if (
notification &&
typeof notification.toObject === "function"
) {
return notification.toObject();
}

return notification;
};

const authenticateSocket = async (socket, next) => {
try {
const token = socket.handshake.auth?.token;

 
if (
  typeof token !== "string" ||
  !token.trim() ||
  token.length > 4096
) {
  return next(new Error("Authentication required."));
}

const secret = getJwtSecret();

let decoded;

try {
  decoded = jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
} catch {
  return next(new Error("Invalid or expired authentication token."));
}

if (
  !decoded ||
  typeof decoded !== "object" ||
  Array.isArray(decoded)
) {
  return next(new Error("Invalid authentication token."));
}

const userId =
  typeof decoded.id === "string"
    ? decoded.id.trim()
    : "";

if (
  !userId ||
  !mongoose.Types.ObjectId.isValid(userId)
) {
  return next(new Error("Invalid authentication token."));
}

const tokenVersion = decoded.tokenVersion;

if (
  !Number.isSafeInteger(tokenVersion) ||
  tokenVersion < 0
) {
  return next(new Error("Invalid authentication token."));
}

const user = await User.findById(userId);

if (!user) {
  return next(new Error("Invalid authentication token."));
}

if (user.isActive === false || user.isSuspended === true) {
  return next(new Error("This account cannot connect."));
}

const currentRole = String(user.role || "")
  .trim()
  .toLowerCase();

const tokenRole = String(decoded.role || "")
  .trim()
  .toLowerCase();

if (
  !ALLOWED_ROLES.has(currentRole) ||
  tokenRole !== currentRole ||
  !ALLOWED_ROLES.has(tokenRole)
) {
  return next(new Error("Invalid account role."));
}

const currentTokenVersion = Number(
  user.tokenVersion ?? 0
);

if (
  !Number.isSafeInteger(currentTokenVersion) ||
  tokenVersion !== currentTokenVersion
) {
  return next(
    new Error("Your session is no longer valid. Please sign in again.")
  );
}

if (currentRole === "artist") {
  const application = await ArtistApplication.findOne({
    user_id: user._id,
  })
    .sort({ created_at: -1 })
    .select("_id status")
    .lean();

  if (
    !application ||
    String(application.status || "").trim().toLowerCase() !==
      "approved"
  ) {
    return next(
      new Error("Artist account approval is incomplete.")
    );
  }
}

socket.data.userId = String(user._id);
socket.data.role = currentRole;

return next();
 

} catch (error) {
console.error(
"SOCKET AUTHENTICATION ERROR:",
error?.message || error
);

 
return next(new Error("Socket authentication failed."));
 

}
};

export const initializeNotificationSocket = (
httpServer,
allowedOrigins = []
) => {
if (io) return io;

const normalizedAllowedOrigins = new Set(
allowedOrigins.map(normalizeOrigin)
);

io = new Server(httpServer, {
cors: {
origin(origin, callback) {
if (
!origin ||
normalizedAllowedOrigins.has(normalizeOrigin(origin))
) {
return callback(null, true);
}

 
    return callback(
      new Error("Socket.IO CORS origin not allowed.")
    );
  },
  credentials: true,
  methods: ["GET", "POST"],
},
 

});

io.use(authenticateSocket);

io.on("connection", (socket) => {
const userId = socket.data.userId;

 
// The room is assigned from the verified JWT, never from client input.
socket.join(`user:${userId}`);

if (process.env.NODE_ENV !== "production") {
  console.log(`🔔 Notification socket connected: ${userId}`);
}

socket.on("disconnect", (reason) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `🔌 Notification socket disconnected: ${userId} (${reason})`
    );
  }
});
 

});

console.log("✅ Notification Socket.IO initialized");

return io;
};

export const emitNotificationToUser = (
recipient,
notification
) => {
if (!io) {
if (process.env.NODE_ENV !== "production") {
console.warn(
"Notification not delivered in real time: Socket.IO is not initialized."
);
}

 
return false;
 

}

const userId = getUserIdFromRecipient(recipient);

if (!userId || !notification) return false;

io.to(`user:${userId}`).emit(
"notification:new",
serializeNotification(notification)
);

return true;
};

export const emitNotificationUpdated = (
recipient,
notification
) => {
if (!io) return false;

const userId = getUserIdFromRecipient(recipient);

if (!userId || !notification) return false;

io.to(`user:${userId}`).emit(
"notification:updated",
serializeNotification(notification)
);

return true;
};

export const emitNotificationDeleted = (
recipient,
notificationId
) => {
if (!io) return false;

const userId = getUserIdFromRecipient(recipient);
const id = getUserIdFromRecipient(notificationId);

if (!userId || !id) return false;

io.to(`user:${userId}`).emit("notification:deleted", {
_id: id,
id,
});

return true;
};

export const getNotificationSocket = () => io;
