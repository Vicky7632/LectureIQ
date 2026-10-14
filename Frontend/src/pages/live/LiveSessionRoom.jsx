import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { liveApi } from "../../api/liveApi";
import { useSocket } from "../../contexts/socketContextHooks";
import ChatBox from "../../components/live/ChatBox";

const iceServers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const LiveSessionRoom = () => {
  const { lectureId } = useParams();
  const { role } = useSelector((state) => state.auth);
  const socket = useSocket();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const teacherStreamStarted = useRef(false);
  const roomJoinedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetchSession = async () => {
      try {
        const response = await liveApi.join(lectureId);
        if (!cancelled) setSession(response.data);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load live session:", error);
          toast.error(error?.response?.data?.message || "Failed to load session");
          navigate(-1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSession();
    return () => {
      cancelled = true;
    };
  }, [lectureId, navigate]);

  const startTeacherStream = useCallback(async () => {
    let cameraStream;
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const combinedStream = new MediaStream([
        ...cameraStream.getTracks(),
        ...screenStream.getTracks(),
      ]);

      if (!localVideoRef.current) {
        combinedStream.getTracks().forEach((track) => track.stop());
        return;
      }

      localVideoRef.current.srcObject = combinedStream;
      peerConnection.current = new RTCPeerConnection(iceServers);

      combinedStream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, combinedStream);
      });

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:ice-candidate", {
            lectureId,
            candidate: event.candidate,
          });
        }
      };

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("webrtc:offer", { lectureId, offer });
      teacherStreamStarted.current = true;
    } catch (error) {
      cameraStream?.getTracks().forEach((track) => track.stop());
      console.error("Failed to start live stream:", error);
      toast.error("Failed to start stream");
    }
  }, [lectureId, socket]);

  const handleOffer = useCallback(async ({ offer }) => {
    if (role !== "student") return;

    try {
      peerConnection.current = new RTCPeerConnection(iceServers);
      peerConnection.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:ice-candidate", {
            lectureId,
            candidate: event.candidate,
          });
        }
      };

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("webrtc:answer", { lectureId, answer });
    } catch (error) {
      console.error("Failed to handle live stream offer:", error);
      toast.error("Failed to connect to live stream");
    }
  }, [lectureId, role, socket]);

  const handleAnswer = useCallback(async ({ answer }) => {
    if (role !== "teacher" || !peerConnection.current) return;

    try {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (error) {
      console.error("Failed to handle live stream answer:", error);
    }
  }, [role]);

  const handleIceCandidate = useCallback(async ({ candidate }) => {
    if (!peerConnection.current) return;

    try {
      await peerConnection.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    } catch (error) {
      console.error("Failed to apply live stream ICE candidate:", error);
    }
  }, []);

  useEffect(() => {
    if (!socket || !session) return undefined;

    const localVideoElement = localVideoRef.current;
    const remoteVideoElement = remoteVideoRef.current;

    const joinRoom = () => {
      roomJoinedRef.current = false;
      setRoomJoined(false);
      socket.emit("lecture:join", { lectureId }, (response) => {
        if (!response?.ok) {
          toast.error(response?.error || "Unable to join live session");
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

    socket.on("connect", joinRoom);
    socket.on("disconnect", handleDisconnect);
    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice-candidate", handleIceCandidate);
    if (socket.connected) joinRoom();

    return () => {
      socket.off("connect", joinRoom);
      socket.off("disconnect", handleDisconnect);
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice-candidate", handleIceCandidate);
      if (socket.connected && roomJoinedRef.current) {
        socket.emit("lecture:leave", { lectureId });
      }
      roomJoinedRef.current = false;

      peerConnection.current?.close();
      peerConnection.current = null;

      const localStream = localVideoElement?.srcObject;
      localStream?.getTracks().forEach((track) => track.stop());
      if (localVideoElement) localVideoElement.srcObject = null;

      const remoteStream = remoteVideoElement?.srcObject;
      remoteStream?.getTracks().forEach((track) => track.stop());
      if (remoteVideoElement) remoteVideoElement.srcObject = null;

      teacherStreamStarted.current = false;
    };
  }, [socket, session, lectureId, handleOffer, handleAnswer, handleIceCandidate]);

  useEffect(() => {
    if (role === "teacher" && roomJoined && !teacherStreamStarted.current) {
      startTeacherStream();
    }
  }, [role, roomJoined, startTeacherStream]);

  const handleEndSession = async () => {
    if (role !== "teacher") return;

    try {
      await liveApi.end(lectureId, null);
      toast.success("Session ended");
      navigate("/teacher/dashboard");
    } catch {
      toast.error("Failed to end session");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  if (!session) return <div className="text-center p-8">Session not found</div>;

  return (
    <div className="relative flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 px-4 py-3 sm:px-6">
        <h1 className="text-xl font-bold">{session.title}</h1>

        <div>
          {role === "teacher" && (
            <button
              onClick={handleEndSession}
              className="btn btn-error btn-sm mr-2"
            >
              End Session
            </button>
          )}

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="btn btn-outline btn-sm"
          >
            {chatOpen ? "Close Chat" : "Open Chat"}
          </button>
        </div>
      </div>

      <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-[#17201B] sm:min-h-[60vh]">
        {role === "teacher" && (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain"
          />
        )}

        {role === "student" && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <ChatBox
        key={lectureId}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        lectureId={lectureId}
        roomJoined={roomJoined}
      />
    </div>
  );
};

export default LiveSessionRoom;
