import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  useGetConversation, useListMessages, useSendMessage,
  useMarkConversationRead, useReactToMessage,
  getListMessagesQueryKey, getGetConversationQueryKey, getGetUnreadCountQueryKey,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Image as ImageIcon, Send, Users, Phone, Video, Mic, MicOff, VideoOff, PhoneOff, X, UserPlus, Search, SmilePlus } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { uploadFile } from "@/lib/upload";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const EMOJIS = ["🩷", "⭐", "💔", "💤", "😆", "🔥", "👍", "😮"];

// ─── Call overlay ────────────────────────────────────────────────────────────
type CallState = "idle" | "calling" | "ringing" | "active" | "ended";

interface CallOverlayProps {
  type: "voice" | "video";
  state: CallState;
  partnerName: string;
  partnerAvatar?: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  videoEffect: string;
  onMute: () => void;
  onCameraToggle: () => void;
  onEffectChange: () => void;
  onEnd: () => void;
  onAnswer: () => void;
  onReject: () => void;
}

const VIDEO_EFFECTS = ["none", "blur", "sepia", "grayscale", "brightness", "contrast"];

function CallOverlay({
  type, state, partnerName, partnerAvatar, localStream, remoteStream,
  isMuted, isCameraOff, videoEffect, onMute, onCameraToggle, onEffectChange, onEnd, onAnswer, onReject,
}: CallOverlayProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const effectStyle: React.CSSProperties = videoEffect === "blur" ? { filter: "blur(4px)" }
    : videoEffect === "sepia" ? { filter: "sepia(0.9)" }
    : videoEffect === "grayscale" ? { filter: "grayscale(1)" }
    : videoEffect === "brightness" ? { filter: "brightness(1.4) saturate(1.3)" }
    : videoEffect === "contrast" ? { filter: "contrast(1.5) hue-rotate(30deg)" }
    : {};

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
      {/* Remote / partner view */}
      <div className="flex-1 relative flex items-center justify-center">
        {type === "video" && remoteStream && !isCameraOff ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-28 w-28 ring-4 ring-white/20">
              <AvatarImage src={partnerAvatar || undefined} />
              <AvatarFallback className="text-4xl font-bold text-white" style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
                {partnerName?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-white text-2xl font-bold">{partnerName}</p>
            <p className="text-white/60 text-base animate-pulse">
              {state === "calling" ? "Calling..." : state === "ringing" ? "Incoming call..." : state === "active" ? "Connected" : "Call ended"}
            </p>
          </div>
        )}

        {/* Local camera preview */}
        {type === "video" && localStream && (
          <div className="absolute top-4 right-4 w-28 h-40 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={effectStyle} />
            {isCameraOff && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="h-6 w-6 text-white/50" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900/90 backdrop-blur-sm p-6 flex flex-col gap-4">
        {state === "ringing" ? (
          <div className="flex justify-center gap-12">
            <button onClick={onReject} className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition">
              <PhoneOff className="h-7 w-7 text-white" />
            </button>
            <button onClick={onAnswer} className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600 transition animate-pulse">
              {type === "video" ? <Video className="h-7 w-7 text-white" /> : <Phone className="h-7 w-7 text-white" />}
            </button>
          </div>
        ) : state === "calling" ? (
          <div className="flex justify-center">
            <button onClick={onEnd} className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition">
              <PhoneOff className="h-7 w-7 text-white" />
            </button>
          </div>
        ) : state === "active" ? (
          <div className="flex items-center justify-center gap-5">
            <button onClick={onMute} className={`h-12 w-12 rounded-full flex items-center justify-center transition ${isMuted ? "bg-red-500" : "bg-white/20"}`}>
              {isMuted ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
            </button>
            {type === "video" && (
              <button onClick={onCameraToggle} className={`h-12 w-12 rounded-full flex items-center justify-center transition ${isCameraOff ? "bg-red-500" : "bg-white/20"}`}>
                {isCameraOff ? <VideoOff className="h-5 w-5 text-white" /> : <Video className="h-5 w-5 text-white" />}
              </button>
            )}
            {type === "video" && (
              <button onClick={onEffectChange} className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center transition text-white text-lg" title={`Effect: ${videoEffect}`}>
                🎭
              </button>
            )}
            <button onClick={onEnd} className="h-14 w-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition">
              <PhoneOff className="h-6 w-6 text-white" />
            </button>
          </div>
        ) : (
          <p className="text-white text-center">Call ended</p>
        )}
        {type === "video" && videoEffect !== "none" && (
          <p className="text-white/40 text-center text-xs">Effect: {videoEffect}</p>
        )}
      </div>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({ convId, onClose }: { convId: number; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [adding, setAdding] = useState<number | null>(null);
  const { toast } = useToast();

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("bluemedia_token")}` },
    });
    if (res.ok) setResults(await res.json());
  };

  const addUser = async (userId: number) => {
    setAdding(userId);
    try {
      await fetch(`/api/conversations/${convId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("bluemedia_token")}` },
        body: JSON.stringify({ userId }),
      });
      toast({ title: "✅ Member added!" });
      setResults(r => r.filter(u => u.id !== userId));
    } catch { toast({ title: "Failed to add member", variant: "destructive" }); }
    finally { setAdding(null); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Member to Group</DialogTitle></DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by name..." className="pl-9" value={search}
            onChange={e => { setSearch(e.target.value); doSearch(e.target.value); }} />
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <Avatar className="h-8 w-8">
                <AvatarImage src={u.profilePicture || undefined} />
                <AvatarFallback className="text-xs font-bold" style={{ background: "#1877f2", color: "white" }}>{u.name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="flex-1 font-medium text-sm">{u.name}</span>
              <Button size="sm" onClick={() => addUser(u.id)} disabled={adding === u.id}>
                {adding === u.id ? "Adding..." : "Add"}
              </Button>
            </div>
          ))}
          {search && results.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">No users found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Chat Room ───────────────────────────────────────────────────────────
export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>();
  const convId = parseInt(id || "0", 10);
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Parse URL params for answering incoming calls redirected from global handler
  const urlParams = new URLSearchParams(window.location.search);
  const shouldAnswer = urlParams.get("answering") === "1";
  const urlCallType = (urlParams.get("callType") as "voice" | "video") || "voice";
  const urlCallerName = urlParams.get("callerName") ? decodeURIComponent(urlParams.get("callerName")!) : "";
  const urlCallerAvatar = urlParams.get("callerAvatar") ? decodeURIComponent(urlParams.get("callerAvatar")!) : undefined;
  const urlCallFrom = urlParams.get("callFrom") ? parseInt(urlParams.get("callFrom")!) : null;

  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showAddMember, setShowAddMember] = useState(false);

  // Call state
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [callState, setCallState] = useState<CallState>("idle");
  const [callPartnerId, setCallPartnerId] = useState<number | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [videoEffect, setVideoEffect] = useState("none");
  const [incomingCall, setIncomingCall] = useState<{ from: number; type: "voice" | "video"; name: string; avatar?: string } | null>(
    shouldAnswer && urlCallFrom ? { from: urlCallFrom, type: urlCallType, name: urlCallerName, avatar: urlCallerAvatar } : null
  );
  const callRingtoneRef = useRef<HTMLAudioElement | null>(null);

  // Auto-answer if navigated here from global call popup
  useEffect(() => {
    if (shouldAnswer && urlCallFrom) {
      setCallState("ringing");
      // Clean up URL params without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("answering");
      url.searchParams.delete("callType");
      url.searchParams.delete("callerName");
      url.searchParams.delete("callerAvatar");
      url.searchParams.delete("callFrom");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const { data: conv } = useGetConversation(convId);
  const { data: messages } = useListMessages(convId);
  const sendMessage = useSendMessage();
  const markRead = useMarkConversationRead();
  const reactToMsg = useReactToMessage();

  const isGroup = conv?.type === "group";
  const otherParticipant = !isGroup ? conv?.participants?.find((p: any) => p.id !== user?.id) : null;
  const name = isGroup ? conv?.name : otherParticipant?.name || "Unknown";
  const avatar = isGroup ? conv?.pictureUrl : otherParticipant?.profilePicture;

  // Socket: messages + calls
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socket.emit("join_conversation", { conversationId: convId });

    const handleMsg = () => {
      queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(convId) });
      markRead.mutate({ id: convId });
      queryClient.invalidateQueries({ queryKey: getGetUnreadCountQueryKey() });
    };
    socket.on("message", handleMsg);
    socket.on("message_seen", handleMsg);
    socket.on("message_updated", handleMsg);

    // Incoming call signalling
    socket.on("call_incoming", ({ from, type, name: fromName, avatar: fromAvatar }: any) => {
      setIncomingCall({ from, type, name: fromName, avatar: fromAvatar });
      setCallState("ringing");
    });
    socket.on("call_answered", () => { setCallState("active"); });
    socket.on("call_ended", () => { endCall(); });
    socket.on("call_rejected", () => {
      toast({ title: "Call declined", description: "The other person declined your call." });
      endCall();
    });

    markRead.mutate({ id: convId });

    return () => {
      socket.off("message", handleMsg);
      socket.off("message_seen", handleMsg);
      socket.off("message_updated", handleMsg);
      socket.off("call_incoming");
      socket.off("call_answered");
      socket.off("call_ended");
      socket.off("call_rejected");
    };
  }, [convId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Call logic
  const startCall = async (type: "voice" | "video") => {
    setCallType(type);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "video" });
      setLocalStream(stream);
      const partnerId = otherParticipant?.id;
      if (partnerId) {
        setCallPartnerId(partnerId);
        const socket = getSocket(token!);
        socket.emit("call_user", { to: partnerId, from: user?.id, type, name: user?.name, avatar: user?.profilePicture, conversationId: convId });
        setCallState("calling");
      }
    } catch {
      toast({ title: "Could not access camera/microphone", description: "Please check your browser permissions.", variant: "destructive" });
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: incomingCall.type === "video" });
      setLocalStream(stream);
      const socket = getSocket(token!);
      socket.emit("call_answer", { to: incomingCall.from, from: user?.id });
      setCallType(incomingCall.type);
      setCallState("active");
      setIncomingCall(null);
    } catch {
      toast({ title: "Could not access media devices", variant: "destructive" });
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      const socket = getSocket(token!);
      socket.emit("call_reject", { to: incomingCall.from });
    }
    setIncomingCall(null);
    setCallState("idle");
  };

  const endCall = useCallback(() => {
    if (callPartnerId) {
      const socket = getSocket(token!);
      socket.emit("call_end", { to: callPartnerId });
    }
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setCallState("idle");
    setCallPartnerId(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setVideoEffect("none");
    setIncomingCall(null);
  }, [callPartnerId, localStream, token]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = isMuted; });
      setIsMuted(m => !m);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => { t.enabled = isCameraOff; });
      setIsCameraOff(c => !c);
    }
  };

  const cycleEffect = () => {
    setVideoEffect(e => {
      const idx = VIDEO_EFFECTS.indexOf(e);
      return VIDEO_EFFECTS[(idx + 1) % VIDEO_EFFECTS.length];
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !imageFile) return;
    try {
      let imageUrl = null;
      if (imageFile && token) imageUrl = await uploadFile(`/api/conversations/${convId}/messages/upload`, imageFile, token);
      await sendMessage.mutateAsync({
        id: convId,
        data: { content: message, imageUrl: imageUrl ?? undefined, replyToId: replyTo?.id } as any,
      });
      setMessage("");
      setImageFile(null);
      setReplyTo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      if (err?.response?.data?.profanity) {
        toast({ title: "❌ Hindi pwede ang masamang salita!", variant: "destructive" });
      }
    }
  };

  const handleReact = async (msgId: number, emoji: string) => {
    await reactToMsg.mutateAsync({ id: convId, msgId, data: { emoji } });
    queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(convId) });
  };

  if (!conv) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <>
      {/* ── Call overlay ── */}
      {(callState !== "idle" || incomingCall) && (
        <CallOverlay
          type={incomingCall?.type ?? callType}
          state={incomingCall ? "ringing" : callState}
          partnerName={incomingCall?.name ?? name ?? ""}
          partnerAvatar={incomingCall?.avatar ?? (isGroup ? conv.pictureUrl : otherParticipant?.profilePicture)}
          localStream={localStream}
          remoteStream={remoteStream}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          videoEffect={videoEffect}
          onMute={toggleMute}
          onCameraToggle={toggleCamera}
          onEffectChange={cycleEffect}
          onEnd={endCall}
          onAnswer={answerCall}
          onReject={rejectCall}
        />
      )}

      {showAddMember && <AddMemberModal convId={convId} onClose={() => setShowAddMember(false)} />}

      <div className="flex flex-col h-[calc(100vh-100px)] -mt-6 -mx-4">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b bg-white shadow-sm z-10 sticky top-0">
          <Link href="/chat">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isGroup ? (
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                {avatar ? <img src={avatar} className="rounded-full w-full h-full object-cover" /> : <Users className="h-5 w-5 text-blue-600" />}
              </div>
            ) : (
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback className="font-bold text-sm" style={{ background: "#1877f2", color: "white" }}>{name?.[0]}</AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-sm leading-none truncate">{name}</h2>
              {isGroup && <span className="text-xs text-gray-400">{conv.participants?.length} members</span>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {!isGroup && (
              <>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-blue-600 hover:bg-blue-50"
                  onClick={() => startCall("voice")} title="Voice call">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-blue-600 hover:bg-blue-50"
                  onClick={() => startCall("video")} title="Video call">
                  <Video className="h-4 w-4" />
                </Button>
              </>
            )}
            {isGroup && (
              <>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-blue-600 hover:bg-blue-50"
                  onClick={() => startCall("video")} title="Group video call">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100"
                  onClick={() => setShowAddMember(true)} title="Add member">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{ backgroundColor: conv.backgroundTheme || "transparent" }}>
          {messages?.map((msg: any, i: number) => {
            const isMine = msg.senderId === user?.id;
            const showName = isGroup && !isMine && (i === 0 || messages[i - 1].senderId !== msg.senderId);
            const isAI = msg.sender?.isBlueAI;

            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                {showName && (
                  <div className="flex items-center gap-1 mb-1 ml-1">
                    <span className="text-xs text-gray-500 font-medium">{msg.sender?.name}</span>
                    {isAI && <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-600 font-bold">AI</span>}
                  </div>
                )}

                {/* Reply preview */}
                {msg.replyToId && (
                  <div className={`text-xs px-3 py-1.5 mb-1 rounded-lg border-l-2 border-blue-400 bg-gray-100 max-w-[70%] text-gray-500 truncate ${isMine ? "mr-1" : "ml-1"}`}>
                    Replying to a message
                  </div>
                )}

                <div className={`flex items-end gap-2 max-w-[80%] group`}>
                  {!isMine && (
                    <Avatar className="h-6 w-6 shrink-0 mb-1">
                      <AvatarImage src={msg.sender?.profilePicture || undefined} />
                      <AvatarFallback className="text-[9px] font-bold" style={{ background: isAI ? "#1877f2" : "#6b7280", color: "white" }}>
                        {isAI ? "AI" : msg.sender?.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className={`relative px-3 py-2 rounded-2xl cursor-pointer transition-all hover:opacity-95 ${
                        isMine
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : isAI
                          ? "bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 rounded-bl-sm border border-blue-100"
                          : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                      }`}>
                        {isAI && !isMine && (
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wide">BLUE AI 💙</span>
                          </div>
                        )}
                        {msg.imageUrl && <img src={msg.imageUrl} alt="attached" className="max-w-[200px] rounded-lg mb-2 object-cover" />}
                        <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                        {msg.reactions?.length > 0 && (
                          <div className={`absolute -bottom-3 ${isMine ? "right-2" : "left-2"} bg-white border border-gray-100 rounded-full px-1.5 py-0.5 text-[11px] flex shadow-sm gap-0.5`}>
                            {msg.reactions.slice(0, 3).map((r: any) => <span key={r.id}>{r.emoji}</span>)}
                            {msg.reactions.length > 3 && <span className="text-gray-400 text-[9px]">+{msg.reactions.length - 3}</span>}
                          </div>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent side="top" align={isMine ? "end" : "start"} className="w-auto p-2 rounded-full flex gap-1">
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => handleReact(msg.id, e)} className="text-lg hover:scale-125 transition-transform p-0.5">{e}</button>
                      ))}
                      <button onClick={() => setReplyTo(msg)} className="text-xs px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition ml-1 text-gray-600">
                        Reply
                      </button>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-1 mt-0.5 px-1">
                  <span className="text-[10px] text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {isMine && (
                    <span className="text-[10px] text-blue-500 font-medium">
                      {msg.seenBy?.length > 1 ? "✓✓ Seen" : "✓ Sent"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t">
          {/* Reply banner */}
          {replyTo && (
            <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-1.5 mb-2 border-l-3 border-blue-400">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-600">{replyTo.sender?.name}</p>
                <p className="text-xs text-gray-600 truncate">{replyTo.content}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="ml-2 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {imageFile && (
            <div className="mb-2 relative inline-block">
              <img src={URL.createObjectURL(imageFile)} alt="preview" className="h-16 rounded-lg border object-cover" />
              <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                onClick={() => setImageFile(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*"
              onChange={e => setImageFile(e.target.files?.[0] || null)} />
            <Button type="button" variant="ghost" size="icon" className="rounded-full text-gray-400 hover:text-blue-500 shrink-0 h-9 w-9"
              onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4" />
            </Button>
            <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-2 gap-2">
              <input
                className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
                placeholder={`Message ${name}...`}
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              />
            </div>
            <Button type="submit" size="icon" className="rounded-full shrink-0 h-9 w-9"
              style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}
              disabled={(!message.trim() && !imageFile) || sendMessage.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
