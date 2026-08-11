import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSocket } from "@/lib/socket";
import { Radio, Eye, Heart, MessageSquare, X, Video, Send, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LiveComment {
  id: string;
  userId: number;
  name: string;
  avatar?: string | null;
  text: string;
}

export default function LivePage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewerStreamId = new URLSearchParams(window.location.search).get("streamId");
  const isViewer = Boolean(viewerStreamId);
  const [isLive, setIsLive] = useState(false);
  const [title, setTitle] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [heartCount, setHeartCount] = useState(0);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [liveStreamId, setLiveStreamId] = useState<string | null>(null);
  const peerConnections = useRef(new Map<string, RTCPeerConnection>());
  const [floatingHearts, setFloatingHearts] = useState<{ id: string; x: number }[]>([]);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = isViewer ? remoteStream : stream;
    }
  }, [isViewer, remoteStream, stream]);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socket.on("live_viewer_count", ({ count }: any) => setViewerCount(count));
    socket.on("live_heart", () => {
      setHeartCount(h => h + 1);
      addFloatingHeart();
    });
    socket.on("live_comment", (c: LiveComment) => {
      setComments(prev => [...prev.slice(-99), c]);
    });

    const createOfferForViewer = async ({ viewerSocketId }: { viewerSocketId: string }) => {
      if (!stream || !liveStreamId) return;
      const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peerConnections.current.set(viewerSocketId, peer);
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
      peer.onicecandidate = event => {
        if (event.candidate) socket.emit("live_ice", { to: viewerSocketId, candidate: event.candidate });
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("live_offer", { to: viewerSocketId, offer });
    };

    const handleOffer = async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      if (!isViewer) return;
      const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peerConnections.current.set(from, peer);
      peer.ontrack = event => setRemoteStream(event.streams[0] || null);
      peer.onicecandidate = event => {
        if (event.candidate) socket.emit("live_ice", { to: from, candidate: event.candidate });
      };
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("live_answer", { to: from, answer });
    };

    const handleAnswer = async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      await peerConnections.current.get(from)?.setRemoteDescription(answer);
    };

    const handleIce = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      await peerConnections.current.get(from)?.addIceCandidate(candidate);
    };

    socket.on("live_viewer_joined", createOfferForViewer);
    socket.on("live_offer", handleOffer);
    socket.on("live_answer", handleAnswer);
    socket.on("live_ice", handleIce);

    if (isViewer && viewerStreamId) {
      setLiveStreamId(viewerStreamId);
      setIsLive(true);
      socket.emit("live_join", { streamId: viewerStreamId });
    }

    return () => {
      socket.off("live_viewer_count");
      socket.off("live_heart");
      socket.off("live_comment");
      socket.off("live_viewer_joined", createOfferForViewer);
      socket.off("live_offer", handleOffer);
      socket.off("live_answer", handleAnswer);
      socket.off("live_ice", handleIce);
      peerConnections.current.forEach(peer => peer.close());
      peerConnections.current.clear();
    };
  }, [token, isViewer, viewerStreamId, liveStreamId, stream]);

  const addFloatingHeart = () => {
    const id = Math.random().toString(36).slice(2);
    const x = 20 + Math.random() * 60;
    setFloatingHearts(h => [...h, { id, x }]);
    setTimeout(() => setFloatingHearts(h => h.filter(fh => fh.id !== id)), 2000);
  };

  const startLive = async () => {
    if (!title.trim()) { toast({ title: "Enter a title for your live stream", variant: "destructive" }); return; }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      const sid = `live_${user?.id}_${Date.now()}`;
      setLiveStreamId(sid);
      setIsLive(true);
      setViewerCount(1);
      const socket = getSocket(token!);
      socket.emit("live_start", { streamId: sid, title, userId: user?.id, userName: user?.name, userAvatar: user?.profilePicture });
      toast({ title: "🔴 You are now LIVE!" });
    } catch {
      toast({ title: "Cannot access camera/microphone", description: "Check your browser permissions.", variant: "destructive" });
    }
  };

  const endLive = () => {
    stream?.getTracks().forEach(t => t.stop());
    if (isViewer && liveStreamId) {
      getSocket(token!).emit("live_leave", { streamId: liveStreamId });
    }
    setStream(null);
    setRemoteStream(null);
    setIsLive(false);
    if (liveStreamId && !isViewer) {
      const socket = getSocket(token!);
      socket.emit("live_end", { streamId: liveStreamId });
    }
    setLiveStreamId(null);
    setComments([]);
    setHeartCount(0);
    toast({ title: "Live stream ended" });
  };

  const sendHeart = () => {
    addFloatingHeart();
    setHeartCount(h => h + 1);
    if (liveStreamId) {
      const socket = getSocket(token!);
      socket.emit("live_heart", { streamId: liveStreamId });
    }
  };

  const sendComment = () => {
    if (!commentText.trim()) return;
    const c: LiveComment = {
      id: Math.random().toString(36).slice(2),
      userId: user?.id || 0,
      name: user?.name || "",
      avatar: user?.profilePicture,
      text: commentText.trim(),
    };
    setComments(prev => [...prev.slice(-99), c]);
    if (liveStreamId) {
      const socket = getSocket(token!);
      socket.emit("live_comment", { streamId: liveStreamId, comment: c });
    }
    setCommentText("");
  };

  if (!isLive) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-5 text-white text-center">
          <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Radio className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black">Go Live 🔴</h1>
          <p className="text-white/80 text-sm mt-1">Share your moments live with your friends!</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="font-bold text-gray-900">Live Stream Setup</h2>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Title (required)</label>
            <Input placeholder="What are you going live about?" value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl" />
          </div>
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Video className="h-4 w-4 text-blue-500" /> Live video with your camera
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageSquare className="h-4 w-4 text-green-500" /> Real-time comments from viewers
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Heart className="h-4 w-4 text-red-500" /> Heart reactions from your audience
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 text-purple-500" /> Live viewer count
            </div>
          </div>
          <Button className="w-full rounded-xl py-6 text-base font-bold" style={{ background: "linear-gradient(135deg,#ef4444,#ec4899)" }}
            onClick={startLive} disabled={!title.trim()}>
            🔴 Go Live Now!
          </Button>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">💡 Tips for a Great Live Stream</h3>
          <ul className="text-xs text-blue-800 space-y-1.5">
            <li>• Good lighting — face a window or bright lamp</li>
            <li>• Stable internet connection (WiFi preferred)</li>
            <li>• Quiet environment for clear audio</li>
            <li>• Interact with comments to keep viewers engaged</li>
            <li>• Announce your live to friends beforehand!</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] -mt-6 -mx-4 relative overflow-hidden bg-black">
      {/* Live video */}
      <div className="relative flex-1 bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        {/* Floating hearts */}
        {floatingHearts.map(fh => (
          <div key={fh.id} className="absolute bottom-1/3 pointer-events-none animate-bounce"
            style={{ left: `${fh.x}%`, animation: "float-up 2s ease-out forwards" }}>
            <span className="text-3xl">❤️</span>
          </div>
        ))}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />LIVE
            </div>
            <div className="bg-black/40 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Eye className="h-3 w-3" />{viewerCount}
            </div>
            <div className="bg-black/40 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Heart className="h-3 w-3 text-red-400" />{heartCount}
            </div>
          </div>
           <button onClick={endLive} className="bg-red-500 text-white rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1 hover:bg-red-600 transition">
             <X className="h-3.5 w-3.5" /> {isViewer ? "Leave Live" : "End Live"}
          </button>
        </div>

        {/* Title */}
        <div className="absolute top-14 left-3">
          <div className="bg-black/50 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur-sm max-w-[200px] truncate">
            {title}
          </div>
        </div>

        {/* Comments overlay */}
        <div className="absolute bottom-24 left-3 right-16 space-y-1.5 max-h-48 overflow-y-auto">
          {comments.slice(-8).map(c => (
            <div key={c.id} className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit max-w-full">
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage src={c.avatar || undefined} />
                <AvatarFallback className="text-[8px] font-bold" style={{ background: "#1877f2", color: "white" }}>{c.name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-white text-xs font-semibold shrink-0">{c.name}</span>
              <span className="text-white/90 text-xs truncate">{c.text}</span>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        {/* Heart button */}
        <div className="absolute bottom-28 right-3">
          <button onClick={sendHeart} className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl hover:scale-110 transition active:scale-90">
            ❤️
          </button>
        </div>
      </div>

      {/* Comment input */}
      <div className="bg-gray-900 p-3 flex items-center gap-2">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={user?.profilePicture || undefined} />
          <AvatarFallback className="text-xs font-bold" style={{ background: "#1877f2", color: "white" }}>{user?.name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex items-center bg-gray-700 rounded-full px-3 py-2">
          <input
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-400"
            placeholder="Say something..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") sendComment(); }}
          />
        </div>
        <button onClick={sendComment} disabled={!commentText.trim()}
          className="h-9 w-9 rounded-full flex items-center justify-center disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
          <Send className="h-4 w-4 text-white" />
        </button>
      </div>

      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-150px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
