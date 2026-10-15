const { AccessToken } = require("livekit-server-sdk");
const { loadAuthorizedLiveLecture } = require("../services/liveLectureAccess");

const getLiveKitToken = async (req, res) => {
  try {
    const access = await loadAuthorizedLiveLecture(
      req.user,
      req.params.lectureId
    );
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env;
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      return res.status(503).json({
        message: "Live video is not configured on the server",
      });
    }

    const { lecture } = access;
    const roomName =
      lecture.liveRoomId || `lecture-${lecture._id.toString()}`;
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: req.user._id.toString(),
      name: `${req.user.firstName} ${req.user.lastName}`.trim(),
      ttl: "1h",
    });
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: req.user.role === "teacher",
      canSubscribe: true,
      canPublishData: false,
    });

    return res.status(200).json({
      token: await token.toJwt(),
      serverUrl: LIVEKIT_URL,
      roomName,
      role: req.user.role,
      lecture: {
        _id: lecture._id,
        title: lecture.title,
        description: lecture.description,
        liveStatus: lecture.liveStatus,
      },
    });
  } catch (error) {
    console.error("LiveKit token generation failed:", error);
    return res.status(500).json({
      message: "Unable to generate live room access",
    });
  }
};

module.exports = { getLiveKitToken };
