export const resolveApiUrl = ({
  configuredApiUrl,
  isDevelopment,
  frontendOrigin,
}) => {
  if (configuredApiUrl) return configuredApiUrl;
  if (!isDevelopment) return frontendOrigin;

  const localApiUrl = new URL(frontendOrigin);
  localApiUrl.protocol = "http:";
  localApiUrl.port = "3000";
  return localApiUrl.origin;
};

export const resolveSocketUrl = ({
  configuredSocketUrl,
  configuredApiUrl,
  isDevelopment,
  frontendOrigin,
}) =>
  configuredSocketUrl ||
  resolveApiUrl({ configuredApiUrl, isDevelopment, frontendOrigin });

export const socketClientOptions = {
  path: "/socket.io",
  autoConnect: false,
  withCredentials: true,
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
};
