import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  ControlBar,
  GridLayout,
  LayoutContextProvider,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useLocalParticipant,
  useTracks,
} from "@livekit/components-react";
import { MediaDeviceFailure, Track } from "livekit-client";
import "@livekit/components-styles";
import { liveApi } from "../../api/liveApi";
import { useSocket } from "../../contexts/socketContextHooks";
import ChatBox from "../../components/live/ChatBox";

const isPermissionDenied = (error) =>
  ["NotAllowedError", "PermissionDeniedError", "SecurityError"].includes(
    error?.name
  );

const getMediaFailureMessage = (device, error) => {
  if (
    isPermissionDenied(error) ||
    error === MediaDeviceFailure.PermissionDenied
  ) {
    return `Browser permission for the ${device} was denied. Allow ${device} access for this site in your browser's site settings, then select Retry.`;
  }
  if (error === MediaDeviceFailure.NotFound) {
    return `No ${device} was found. Connect or enable a device, then select Retry.`;
  }
  if (error === MediaDeviceFailure.DeviceInUse) {
    return `The ${device} is already in use by another application or browser tab. Close it there, then select Retry.`;
  }
  return `Could not enable the ${device}: ${
    error?.message || error || "the device is unavailable"
  }`;
};

const LiveClassroomView = ({
  isTeacher,
  roomConnected,
  mediaError,
  setMediaError,
}) => {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);
  const {
    isCameraEnabled,
    isMicrophoneEnabled,
    localParticipant,
  } = useLocalParticipant();
  const initialMediaRequestMade = useRef(false);

  const requestMedia = useCallback(async () => {
    const requests = [];
    if (!isCameraEnabled) {
      requests.push([
        "camera",
        localParticipant.setCameraEnabled(true),
      ]);
    }
    if (!isMicrophoneEnabled) {
      requests.push([
        "microphone",
        localParticipant.setMicrophoneEnabled(true),
      ]);
    }

    if (requests.length === 0) {
      setMediaError("");
      return;
    }

    const results = await Promise.allSettled(
      requests.map(([, request]) => request)
    );
    const failures = results.flatMap((result, index) =>
      result.status === "rejected"
        ? [getMediaFailureMessage(requests[index][0], result.reason)]
        : []
    );
    setMediaError(failures.join(" "));
  }, [
    isCameraEnabled,
    isMicrophoneEnabled,
    localParticipant,
    setMediaError,
  ]);

  useEffect(() => {
    if (!isTeacher || !roomConnected || initialMediaRequestMade.current) return;
    initialMediaRequestMade.current = true;
    void requestMedia();
  }, [isTeacher, requestMedia, roomConnected]);

  return (
    <div className="flex h-full min-h-[50vh] flex-col">
      <GridLayout className="min-h-0 flex-1" tracks={tracks}>
        <ParticipantTile />
      </GridLayout>
      {isTeacher && (
        <>
          <ControlBar
            controls={{
              microphone: true,
              camera: true,
              chat: false,
              screenShare: false,
              leave: false,
              settings: true,
            }}
          />
          {mediaError && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 bg-base-100 px-4 py-3">
              <p role="alert" className="text-sm text-error">
                {mediaError}
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => void requestMedia()}
              >
                Retry camera/microphone
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const LiveSessionRoom = () => {
  const { lectureId } = useParams();
  const { role } = useSelector((state) => state.auth);
  const socket = useSocket();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [liveKit, setLiveKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [roomError, setRoomError] = useState("");
  const [socketError, setSocketError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const roomJoinedRef = useRef(false);
  const roomConnectedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetchSession = async () => {
      try {
        const [sessionResponse, tokenResponse] = await Promise.all([
          liveApi.join(lectureId),
          liveApi.getToken(lectureId),
        ]);
        if (cancelled) return;

        setSession(sessionResponse.data);
        setLiveKit(tokenResponse.data);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load live session:", error);
          setLoadError(
            error?.response?.data?.message || "Failed to connect to this session"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSession();
    return () => {
      cancelled = true;
    };
  }, [lectureId]);

  useEffect(() => {
    if (!socket || !session) return undefined;

    const joinRoom = () => {
      roomJoinedRef.current = false;
      setRoomJoined(false);
      setSocketError("");
      socket.emit("lecture:join", { lectureId }, (response) => {
        if (!response?.ok) {
          setSocketError(response?.error || "Unable to join live chat");
          return;
        }
        roomJoinedRef.current = true;
        setRoomJoined(true);
      });
    };
    const handleDisconnect = () => {
      roomJoinedRef.current = false;
      setRoomJoined(false);
    };
    const handleLectureEnded = (payload) => {
      if (payload?.lectureId !== lectureId) return;
      setSessionEnded(true);
      setStreamConnected(false);
      roomJoinedRef.current = false;
      setRoomJoined(false);
    };

    socket.on("connect", joinRoom);
    socket.on("disconnect", handleDisconnect);
    socket.on("lecture:ended", handleLectureEnded);
    if (socket.connected) joinRoom();

    return () => {
      socket.off("connect", joinRoom);
      socket.off("disconnect", handleDisconnect);
      socket.off("lecture:ended", handleLectureEnded);
      if (socket.connected && roomJoinedRef.current) {
        socket.emit("lecture:leave", { lectureId });
      }
      roomJoinedRef.current = false;
    };
  }, [socket, session, lectureId]);

  const handleEndSession = async () => {
    if (role !== "teacher" || endingSession) return;

    setEndingSession(true);
    try {
      const response = await liveApi.end(lectureId, null);
      if (response.data?.lecture?.liveStatus !== "ended") {
        throw new Error(response.data?.message || "The session did not end");
      }
      setSessionEnded(true);
      toast.success("Session ended");
      navigate("/teacher/dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Failed to end session"
      );
    } finally {
      setEndingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
        <span className="ml-3">Connecting to live classroom…</span>
      </div>
    );
  }

  if (loadError || !session || !liveKit) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-2xl font-bold">Unable to join classroom</h1>
        <p role="alert" className="mt-3 text-error">
          {loadError || "Live classroom details are unavailable."}
        </p>
        <button className="btn btn-primary mt-6" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-bold">{session.title}</h1>
          <p className="text-sm text-base-content/70">
            {sessionEnded
              ? "This live session has ended."
              : mediaError
                ? "Room connected; camera/microphone needs attention"
                : streamConnected
                  ? "Connected to the live classroom"
                  : roomError
                    ? "Unable to connect to live video"
                    : "Connecting to the live classroom…"}
          </p>
        </div>

        <div>
          {role === "teacher" && !sessionEnded && (
            <button
              onClick={handleEndSession}
              disabled={endingSession}
              className="btn btn-error btn-sm mr-2"
            >
              {endingSession ? "Ending..." : "End Session"}
            </button>
          )}
          {!sessionEnded && (
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="btn btn-outline btn-sm"
            >
              {chatOpen ? "Close Chat" : "Open Chat"}
            </button>
          )}
        </div>
      </div>

      <div className="relative min-h-[50vh] flex-1 bg-[#17201B] sm:min-h-[60vh]">
        {sessionEnded ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <h2 className="text-2xl font-semibold">Live session ended</h2>
            <p>The teacher has ended this classroom.</p>
          </div>
        ) : (
          <LiveKitRoom
            serverUrl={liveKit.serverUrl}
            token={liveKit.token}
            connect
            video={false}
            audio={false}
            onConnected={() => {
              roomConnectedRef.current = true;
              setRoomError("");
              setStreamConnected(true);
            }}
            onDisconnected={() => {
              roomConnectedRef.current = false;
              setStreamConnected(false);
              if (!sessionEnded) {
                setRoomError(
                  "The live video room disconnected. Refresh the page to try rejoining."
                );
              }
            }}
            onError={(error) => {
              if (isPermissionDenied(error)) {
                setMediaError(
                  getMediaFailureMessage("camera or microphone", error)
                );
                return;
              }
              console.error("LiveKit room error:", error);
              if (!roomConnectedRef.current) {
                setRoomError(error.message || "Unable to connect to live video");
              }
            }}
            onMediaDeviceFailure={(failure, kind) => {
              setMediaError(
                getMediaFailureMessage(
                  kind === "audioinput" ? "microphone" : "camera",
                  failure
                )
              );
            }}
            className="h-full min-h-[50vh]"
          >
            <LayoutContextProvider>
              <LiveClassroomView
                isTeacher={role === "teacher"}
                roomConnected={streamConnected}
                mediaError={mediaError}
                setMediaError={setMediaError}
              />
            </LayoutContextProvider>
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}
      </div>

      {(roomError || socketError) && (
        <p role="alert" className="border-t border-base-300 px-4 py-3 text-error">
          {roomError || socketError}
        </p>
      )}

      {!sessionEnded && (
        <ChatBox
          key={lectureId}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          lectureId={lectureId}
          roomJoined={roomJoined}
        />
      )}
    </div>
  );
};

export default LiveSessionRoom;
