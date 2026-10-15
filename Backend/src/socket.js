const jwt = require("jsonwebtoken");
const socketIO = require("socket.io");
const { randomUUID } = require("crypto");
const Student = require("./models/student");
const redisClient = require("./config/redis");
const {
  isValidLectureId,
  isSocketInLectureRoom,
  parseChatMessage,
} = require("./utils/liveSocketAccess");
const { loadAuthorizedLiveLecture } = require("./services/liveLectureAccess");

const getCookieToken = (cookieHeader) => {
  if (typeof cookieHeader !== "string") {
    return null;
  }

  const tokenCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("token="));

  if (!tokenCookie) {
    return null;
  }

  try {
    return decodeURIComponent(tokenCookie.slice("token=".length));
  } catch {
    return null;
  }
};

const authenticateSocket = async (socket) => {
  const token = getCookieToken(socket.handshake.headers.cookie);
  if (!token) {
    throw new Error("Authentication required");
  }

  const payload = jwt.verify(token, process.env.JWT_KEY);
  if (!payload?._id) {
    throw new Error("Authentication required");
  }

  const isBlocked = await redisClient.exists(`token:${token}`);
  if (isBlocked) {
    throw new Error("Authentication required");
  }

  const user = await Student.findById(payload._id).select(
    "_id firstName lastName role isEmailVerified isActive"
  );
  if (!user || !user.isEmailVerified || !user.isActive) {
    throw new Error("Authentication required");
  }

  return user;
};

const acknowledge = (callback, response) => {
  if (typeof callback === "function") {
    callback(response);
  }
};

const initSocket = (server) => {
  const io = socketIO(server, {
    path: "/socket.io",
    cors: {
      origin: [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ].filter(Boolean),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    authenticateSocket(socket)
      .then((user) => {
        socket.data.user = user;
        next();
      })
      .catch((error) => {
        if (error.message !== "Authentication required") {
          console.error("Socket authentication failed:", error);
        }
        next(new Error("Authentication required"));
      });
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    socket.on("lecture:join", async (payload, callback) => {
      const lectureId = payload?.lectureId;
      try {
        const access = await loadAuthorizedLiveLecture(user, lectureId);
        if (access.error) {
          acknowledge(callback, { ok: false, error: access.error });
          return;
        }

        await socket.join(lectureId);
        acknowledge(callback, { ok: true, lectureId });
        socket.to(lectureId).emit("lecture:user-joined", {
          userId: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
        });
      } catch (error) {
        console.error("Socket lecture join failed:", error);
        acknowledge(callback, {
          ok: false,
          error: "Unable to join this live session",
        });
      }
    });

    socket.on("lecture:sendMessage", async (payload, callback) => {
      const parsed = parseChatMessage(payload);
      if (parsed.error) {
        acknowledge(callback, { ok: false, error: parsed.error });
        return;
      }

      const { lectureId, text } = parsed.value;
      if (!isSocketInLectureRoom(socket.rooms, lectureId)) {
        acknowledge(callback, {
          ok: false,
          error: "Join this live session before sending a message",
        });
        return;
      }

      try {
        const access = await loadAuthorizedLiveLecture(user, lectureId);
        if (access.error) {
          await socket.leave(lectureId);
          acknowledge(callback, { ok: false, error: access.error });
          return;
        }

        const message = {
          id: randomUUID(),
          text,
          sender: {
            id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
          },
          createdAt: new Date().toISOString(),
        };

        io.to(lectureId).emit("lecture:receiveMessage", {
          lectureId,
          message,
        });
        acknowledge(callback, { ok: true });
      } catch (error) {
        console.error("Socket message delivery failed:", error);
        acknowledge(callback, {
          ok: false,
          error: "Unable to send message",
        });
      }
    });

    socket.on("lecture:leave", async (payload, callback) => {
      const lectureId = payload?.lectureId;
      if (!isValidLectureId(lectureId)) {
        acknowledge(callback, { ok: false, error: "A valid lectureId is required" });
        return;
      }

      if (socket.rooms.has(lectureId)) {
        await socket.leave(lectureId);
        socket.to(lectureId).emit("lecture:user-left", {
          userId: user._id.toString(),
        });
      }
      acknowledge(callback, { ok: true });
    });
  });

  return io;
};

module.exports = { initSocket };
