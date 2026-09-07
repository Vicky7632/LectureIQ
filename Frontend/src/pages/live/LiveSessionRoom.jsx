import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { liveApi } from "../../api/liveApi";
import socketService from "../../utils/socket";
import ChatBox from "../../components/live/ChatBox";

const LiveSessionRoom = () => {
  const { lectureId } = useParams();
  const { role } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);

  const iceServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    socketService.connect();
    socketService.emit("lecture:join", { lectureId });

    socketService.on("webrtc:offer", handleOffer);
    socketService.on("webrtc:answer", handleAnswer);
    socketService.on("webrtc:ice-candidate", handleIceCandidate);

    const fetchSession = async () => {
      try {
        const res = await liveApi.join(lectureId);
        setSession(res.data);
      } catch (err) {
         console.error(err); 
         toast.error(err?.response?.data?.message || "Failed to load session");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    if (role === "teacher") {
      startTeacherStream();
    }

    return () => {
      socketService.emit("lecture:leave", { lectureId });
    };
  }, []);

  const startTeacherStream = async () => {
    try {
      const cam = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const combined = new MediaStream([
        ...cam.getTracks(),
        ...screen.getTracks(),
      ]);

      localVideoRef.current.srcObject = combined;

      peerConnection.current = new RTCPeerConnection(iceServers);

      combined.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, combined);
      });

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.emit("webrtc:ice-candidate", {
            lectureId,
            candidate: event.candidate,
          });
        }
      };

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socketService.emit("webrtc:offer", { lectureId, offer });
    } catch {
      toast.error("Failed to start stream");
    }
  };

  const handleOffer = async ({ offer }) => {
    if (role !== "student") return;

    peerConnection.current = new RTCPeerConnection(iceServers);

    peerConnection.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emit("webrtc:ice-candidate", {
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

    socketService.emit("webrtc:answer", { lectureId, answer });
  };

  const handleAnswer = async ({ answer }) => {
    if (role !== "teacher") return;

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(answer)
    );
  };

  const handleIceCandidate = async ({ candidate }) => {
    if (!peerConnection.current) return;

    await peerConnection.current.addIceCandidate(
      new RTCIceCandidate(candidate)
    );
  };

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
    <div className="relative h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
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

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center bg-black">
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

      <ChatBox isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default LiveSessionRoom;
