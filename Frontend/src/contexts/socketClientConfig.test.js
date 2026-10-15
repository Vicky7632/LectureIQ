import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveApiUrl,
  resolveSocketUrl,
  socketClientOptions,
} from "./socketClientConfig.js";

test("uses the frontend hostname for the local credentialed API fallback", () => {
  assert.equal(
    resolveApiUrl({
      isDevelopment: true,
      frontendOrigin: "http://127.0.0.1:5173",
    }),
    "http://127.0.0.1:3000"
  );
});

test("uses credentialed polling for the initial Socket.IO handshake", () => {
  assert.equal(socketClientOptions.withCredentials, true);
  assert.deepEqual(socketClientOptions.transports, ["polling", "websocket"]);
});

test("prefers configured socket and API origins and uses same-origin in production", () => {
  assert.equal(
    resolveSocketUrl({
      configuredSocketUrl: "https://socket.example.test",
      configuredApiUrl: "https://api.example.test",
      isDevelopment: true,
      frontendOrigin: "http://localhost:5173",
    }),
    "https://socket.example.test"
  );
  assert.equal(
    resolveSocketUrl({
      configuredApiUrl: "https://api.example.test",
      isDevelopment: true,
      frontendOrigin: "http://localhost:5173",
    }),
    "https://api.example.test"
  );
  assert.equal(
    resolveApiUrl({
      isDevelopment: false,
      frontendOrigin: "https://lectureiq.example.test",
    }),
    "https://lectureiq.example.test"
  );
});
