const socketIO = require("socket.io");

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: ["http://localhost:3000", "https://yourfrontend.com"], // frontend URLs
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join lecture room
    socket.on("joinLecture", ({ lectureId, userId }) => {
      socket.join(lectureId);
      console.log(`User ${userId} joined lecture ${lectureId}`);
      socket.to(lectureId).emit("user-joined", { userId, joinedAt: new Date() });
    });

    // Chat messages
    socket.on("lecture:sendMessage", ({ lectureId, message, userId }) => {
      io.to(lectureId).emit("lecture:receiveMessage", {
        message,
        sender: userId,
        createdAt: new Date(),
      });
    });

    // WebRTC signaling
    socket.on("lecture:webrtc-offer", ({ lectureId, offer }) => {
      socket.to(lectureId).emit("lecture:webrtc-offer", offer);
    });

    socket.on("lecture:webrtc-answer", ({ lectureId, answer }) => {
      socket.to(lectureId).emit("lecture:webrtc-answer", answer);
    });

    socket.on("lecture:webrtc-ice-candidate", ({ lectureId, candidate }) => {
      socket.to(lectureId).emit("lecture:webrtc-ice-candidate", candidate);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });

    // Optional: socket errors
    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });
  });
};

module.exports = { initSocket };

