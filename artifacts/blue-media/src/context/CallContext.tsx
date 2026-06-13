import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video } from "lucide-react";

interface IncomingCall {
  from: number;
  type: "voice" | "video";
  name: string;
  avatar?: string;
  conversationId?: number;
}

interface LiveUser {
  userId: number;
  userName: string;
  userAvatar?: string;
  streamId: string;
  title: string;
}

interface CallContextValue {
  incomingCall: IncomingCall | null;
  liveUsers: LiveUser[];
  clearIncomingCall: () => void;
}

const CallContext = createContext<CallContextValue>({
  incomingCall: null,
  liveUsers: [],
  clearIncomingCall: () => {},
});

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!token || !user) return;
    const socket = getSocket(token);

    socket.on("call_incoming", (data: IncomingCall) => {
      setIncomingCall(data);
      // Play ringtone via oscillator
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 440; gain.gain.value = 0.15;
        osc.start(); setTimeout(() => { osc.stop(); ctx.close(); }, 3000);
      } catch {}
    });

    socket.on("user_went_live", (data: LiveUser) => {
      setLiveUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        return [data, ...filtered];
      });
      toast({ title: `🔴 ${data.userName} is now LIVE!`, description: data.title });
    });

    socket.on("user_live_ended", ({ userId }: { userId: number }) => {
      setLiveUsers(prev => prev.filter(u => u.userId !== userId));
    });

    return () => {
      socket.off("call_incoming");
      socket.off("user_went_live");
      socket.off("user_live_ended");
    };
  }, [token, user]);

  const clearIncomingCall = useCallback(() => setIncomingCall(null), []);

  return (
    <CallContext.Provider value={{ incomingCall, liveUsers, clearIncomingCall }}>
      {children}
      {/* Global incoming call overlay */}
      {incomingCall && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center pb-8 pointer-events-none">
          <div className="bg-gray-900 rounded-3xl shadow-2xl p-5 mx-4 w-full max-w-sm pointer-events-auto animate-bounce-in border border-white/10">
            <div className="text-center space-y-3">
              <div className="text-sm text-gray-400 font-medium">
                {incomingCall.type === "video" ? "📹 Incoming Video Call" : "📞 Incoming Voice Call"}
              </div>
              <Avatar className="h-20 w-20 mx-auto ring-4 ring-green-500">
                <AvatarImage src={incomingCall.avatar} />
                <AvatarFallback className="text-2xl font-black text-white" style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
                  {incomingCall.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-black text-white text-lg">{incomingCall.name}</p>
                <p className="text-gray-400 text-sm">is calling you...</p>
              </div>
              <div className="flex gap-4 justify-center pt-2">
                <button
                  onClick={() => {
                    clearIncomingCall();
                    // Navigate to conversation if available
                    if (incomingCall.conversationId) {
                      window.location.href = `/chat/${incomingCall.conversationId}?answering=1&callType=${incomingCall.type}&callerName=${encodeURIComponent(incomingCall.name)}&callerAvatar=${encodeURIComponent(incomingCall.avatar || "")}&callFrom=${incomingCall.from}`;
                    }
                  }}
                  className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition shadow-lg active:scale-95"
                >
                  {incomingCall.type === "video" ? <Video className="h-7 w-7 text-white" /> : <Phone className="h-7 w-7 text-white" />}
                </button>
                <button
                  onClick={() => {
                    clearIncomingCall();
                    try {
                      const socket = getSocket(token!);
                      socket.emit("call_reject", { to: incomingCall.from });
                    } catch {}
                  }}
                  className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition shadow-lg active:scale-95"
                >
                  <PhoneOff className="h-7 w-7 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  return useContext(CallContext);
}
