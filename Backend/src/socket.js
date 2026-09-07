const socketIO = require("socket.io");

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5173"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    /* ===========================
       JOIN LECTURE ROOM
    ============================ */
    socket.on("lecture:join", ({ lectureId }) => {
      socket.join(lectureId);
      socket.to(lectureId).emit("lecture:user-joined", {
        userId: socket.id,
      });

      console.log(`Socket ${socket.id} joined ${lectureId}`);
    });

    /* ===========================
       CHAT
    ============================ */
    socket.on("lecture:sendMessage", ({ lectureId, message, userId }) => {
      io.to(lectureId).emit("lecture:receiveMessage", {
        message,
        sender: userId,
        createdAt: new Date(),
      });
    });

    /* ===========================
       WEBRTC SIGNALING
    ============================ */

// Teacher → Student offer
socket.on("webrtc:offer", ({ lectureId, offer, senderId }) => {
  socket.to(lectureId).emit("webrtc:offer", { offer, senderId });
});

// Student → Teacher answer
socket.on("webrtc:answer", ({ lectureId, answer, senderId }) => {
  socket.to(lectureId).emit("webrtc:answer", { answer, senderId });
});

// ICE candidates exchange
socket.on("webrtc:ice-candidate", ({ lectureId, candidate, senderId }) => {
  socket.to(lectureId).emit("webrtc:ice-candidate", { candidate, senderId });
});

    /* ===========================
       LEAVE ROOM
    ============================ */
    socket.on("lecture:leave", ({ lectureId }) => {
      socket.leave(lectureId);
      socket.to(lectureId).emit("lecture:user-left", {
        userId: socket.id,
      });

      console.log(`Socket ${socket.id} left ${lectureId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });
  });
};

module.exports = { initSocket };

