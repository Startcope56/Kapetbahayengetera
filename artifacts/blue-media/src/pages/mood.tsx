import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Smile, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface MoodEntry {
  id: string;
  userId: number;
  userName: string;
  userAvatar?: string | null;
  mood: string;
  status: string;
  color: string;
  createdAt: number;
}

const MOODS = [
  { emoji: "😊", label: "Happy", color: "#f59e0b" },
  { emoji: "🤩", label: "Excited", color: "#ef4444" },
  { emoji: "😌", label: "Chill", color: "#6366f1" },
  { emoji: "💪", label: "Motivated", color: "#22c55e" },
  { emoji: "😔", label: "Sad", color: "#64748b" },
  { emoji: "😡", label: "Angry", color: "#dc2626" },
  { emoji: "🥰", label: "In Love", color: "#ec4899" },
  { emoji: "😴", label: "Sleepy", color: "#7c3aed" },
  { emoji: "🤔", label: "Thinking", color: "#0ea5e9" },
  { emoji: "🙏", label: "Grateful", color: "#f97316" },
  { emoji: "😂", label: "LOL", color: "#eab308" },
  { emoji: "😎", label: "Confident", color: "#14b8a6" },
];

const STATUS_SUGGESTIONS = [
  "Just woke up ☀️", "Living my best life ✨", "Blessed and grateful 🙏",
  "Work mode ON 💼", "Chilling lang 😌", "Miss ko na sila 💙",
  "Good vibes only 🌈", "Kaya natin 'to! 💪", "Nag-eenjoy sa buhay 🎉",
  "Meron na akong lunchbox 🍱",
];

const DEMO_MOODS: MoodEntry[] = [
  { id: "m1", userId: 1, userName: "Maria Santos", userAvatar: undefined, mood: "😊 Happy", status: "Living my best life!", color: "#f59e0b", createdAt: Date.now() - 1800000 },
  { id: "m2", userId: 2, userName: "Juan dela Cruz", userAvatar: undefined, mood: "💪 Motivated", status: "Grind time!", color: "#22c55e", createdAt: Date.now() - 3600000 },
  { id: "m3", userId: 3, userName: "Pedro Reyes", userAvatar: undefined, mood: "🥰 In Love", status: "Best day ever 💕", color: "#ec4899", createdAt: Date.now() - 7200000 },
];

export default function MoodPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [moods, setMoods] = useState<MoodEntry[]>(DEMO_MOODS);
  const [myMood, setMyMood] = useState<string | null>(null);
  const [myColor, setMyColor] = useState<string>("#1877f2");
  const [status, setStatus] = useState("");
  const [step, setStep] = useState<"pick" | "status" | "done">("pick");

  const pickMood = (m: typeof MOODS[0]) => {
    setMyMood(`${m.emoji} ${m.label}`);
    setMyColor(m.color);
    setStep("status");
  };

  const postMood = () => {
    if (!myMood) return;
    const entry: MoodEntry = {
      id: Math.random().toString(36).slice(2),
      userId: user?.id || 0,
      userName: user?.name || "",
      userAvatar: user?.profilePicture || null,
      mood: myMood,
      status: status || "Feeling " + myMood,
      color: myColor,
      createdAt: Date.now(),
    };
    setMoods(prev => [entry, ...prev.filter(m => m.userId !== user?.id)]);
    setStep("done");
    toast({ title: `Mood set: ${myMood} 🎉` });
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-400 to-pink-500 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Smile className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-lg">Mood Board 😊</h1>
            <p className="text-yellow-100 text-xs">Share how you're feeling today!</p>
          </div>
        </div>
      </div>

      {/* My mood section */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="font-bold text-gray-900 mb-3 text-sm">How are you feeling today?</h2>

        {step === "done" ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">{myMood?.split(" ")[0]}</div>
            <p className="font-bold text-gray-900">{myMood}</p>
            <p className="text-sm text-gray-500 mt-1">{status}</p>
            <button onClick={() => setStep("pick")} className="mt-3 text-sm text-blue-600 font-medium">
              Change mood
            </button>
          </div>
        ) : step === "status" ? (
          <div className="space-y-3">
            <div className="text-center text-3xl py-2">{myMood?.split(" ")[0]}</div>
            <input value={status} onChange={e => setStatus(e.target.value)}
              placeholder="Add a status message..."
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
            <div className="flex flex-wrap gap-1.5">
              {STATUS_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition">
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("pick")} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-500">
                ← Back
              </button>
              <button onClick={postMood}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: myColor }}>
                Post Mood!
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {MOODS.map(m => (
              <button key={m.label} onClick={() => pickMood(m)}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition active:scale-95">
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[10px] font-semibold text-gray-600">{m.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Community moods */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">What's the vibe? 🌟</h2>
          <span className="text-xs text-gray-400">{moods.length} people shared</span>
        </div>
        {moods.map(entry => (
          <div key={entry.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 border-gray-50">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.userAvatar || undefined} />
                <AvatarFallback className="font-bold text-sm" style={{ background: entry.color, color: "white" }}>
                  {entry.userName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 text-base">{entry.mood.split(" ")[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900">{entry.userName}</p>
              <p className="text-xs text-gray-500 truncate">{entry.status}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ background: entry.color }}>
                {entry.mood.split(" ").slice(1).join(" ")}
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">{formatDistanceToNow(entry.createdAt, { addSuffix: true })}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
