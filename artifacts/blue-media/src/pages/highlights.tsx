import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Star, Plus, X, Play, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Highlight {
  id: string;
  title: string;
  emoji: string;
  posts: { imageUrl?: string; text: string; bgColor?: string }[];
  createdAt: number;
}

const BG_COLORS = [
  "linear-gradient(135deg,#1877f2,#0a6bc7)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#f7971e,#ffd200)",
];

const DEMO_HIGHLIGHTS: Highlight[] = [
  {
    id: "h1", title: "Barkada Trips", emoji: "✈️",
    posts: [
      { text: "Boracay 2025 🏖️", bgColor: BG_COLORS[2] },
      { text: "Palawan adventures! 🌊", bgColor: BG_COLORS[0] },
      { text: "Sagada highlands ⛰️", bgColor: BG_COLORS[3] },
    ],
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "h2", title: "Food Trips", emoji: "🍜",
    posts: [
      { text: "Best sinigang ever 🤤", bgColor: BG_COLORS[1] },
      { text: "Kare-kare goals 🥘", bgColor: BG_COLORS[3] },
    ],
    createdAt: Date.now() - 86400000 * 10,
  },
];

export default function HighlightsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [highlights, setHighlights] = useState<Highlight[]>(DEMO_HIGHLIGHTS);
  const [viewingHl, setViewingHl] = useState<Highlight | null>(null);
  const [viewingPost, setViewingPost] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", emoji: "⭐" });

  const EMOJIS = ["⭐", "✈️", "🍜", "💙", "🎉", "🏆", "💪", "🎮", "🎵", "📸", "🌸", "🔥"];

  const openHighlight = (hl: Highlight) => { setViewingHl(hl); setViewingPost(0); };
  const nextPost = () => {
    if (viewingHl && viewingPost < viewingHl.posts.length - 1) setViewingPost(n => n + 1);
    else setViewingHl(null);
  };

  const createHighlight = () => {
    if (!form.title) return;
    const newHl: Highlight = {
      id: Math.random().toString(36).slice(2),
      title: form.title, emoji: form.emoji,
      posts: [{ text: "My highlight 🌟", bgColor: BG_COLORS[0] }],
      createdAt: Date.now(),
    };
    setHighlights(prev => [newHl, ...prev]);
    setShowCreate(false);
    setForm({ title: "", emoji: "⭐" });
    toast({ title: "Highlight created! ⭐" });
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg">Highlights ⭐</h1>
              <p className="text-yellow-100 text-xs">Your best moments, pinned forever</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-white text-yellow-700 px-3 py-2 rounded-xl text-sm font-bold">
            <Plus className="h-4 w-4" /> Create
          </button>
        </div>
      </div>

      {/* My highlights */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="font-bold text-gray-900 mb-3 text-sm">Your Highlights</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {/* Add new */}
          <button onClick={() => setShowCreate(true)} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium">New</span>
          </button>

          {highlights.map(hl => (
            <button key={hl.id} onClick={() => openHighlight(hl)} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-yellow-400 relative">
                <div className="w-full h-full flex items-center justify-center text-3xl"
                  style={{ background: hl.posts[0]?.bgColor ?? BG_COLORS[0] }}>
                  {hl.posts[0]?.imageUrl ? (
                    <img src={hl.posts[0].imageUrl} className="w-full h-full object-cover" alt="" />
                  ) : hl.emoji}
                </div>
                <div className="absolute bottom-0.5 right-0.5 text-sm">{hl.emoji}</div>
              </div>
              <span className="text-[10px] text-gray-700 font-medium max-w-[64px] truncate">{hl.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* All highlights feed */}
      <div className="grid grid-cols-2 gap-3">
        {highlights.map(hl => (
          <button key={hl.id} onClick={() => openHighlight(hl)}
            className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition text-left">
            <div className="h-28 flex items-center justify-center text-5xl"
              style={{ background: hl.posts[0]?.bgColor ?? BG_COLORS[0] }}>
              {hl.posts[0]?.imageUrl ? (
                <img src={hl.posts[0].imageUrl} className="w-full h-full object-cover" alt="" />
              ) : hl.emoji}
            </div>
            <div className="p-2.5">
              <p className="font-bold text-gray-900 text-sm">{hl.emoji} {hl.title}</p>
              <p className="text-[10px] text-gray-400">{hl.posts.length} moments</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={user?.profilePicture || undefined} />
                  <AvatarFallback className="text-[8px] font-bold" style={{ background: "#1877f2", color: "white" }}>{user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-gray-500">{user?.name?.split(" ")[0]}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {highlights.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <Star className="h-10 w-10 mx-auto text-yellow-400 mb-2" />
          <p className="font-bold text-gray-900">No highlights yet</p>
          <p className="text-sm text-gray-500">Create your first highlight to pin your best moments!</p>
        </div>
      )}

      {/* Highlight viewer */}
      {viewingHl && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={nextPost}>
          <div className="w-full max-w-sm h-[90vh] relative rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Progress */}
            <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
              {viewingHl.posts.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30">
                  <div className={`h-full bg-white rounded-full ${i < viewingPost ? "w-full" : i === viewingPost ? "w-full" : "w-0"}`}
                    style={i === viewingPost ? { animation: "progress 3s linear" } : undefined} />
                </div>
              ))}
            </div>

            {/* Content */}
            {viewingHl.posts[viewingPost].imageUrl ? (
              <img src={viewingHl.posts[viewingPost].imageUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: viewingHl.posts[viewingPost].bgColor }}>
                <p className="text-white text-2xl font-black text-center px-6 drop-shadow-lg">{viewingHl.posts[viewingPost].text}</p>
              </div>
            )}

            {/* Header */}
            <div className="absolute top-8 left-3 right-3 flex items-center gap-2">
              <div className="text-2xl">{viewingHl.emoji}</div>
              <p className="text-white font-black text-sm drop-shadow">{viewingHl.title}</p>
              <button onClick={() => setViewingHl(null)} className="ml-auto text-white bg-black/30 rounded-full p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav */}
            <button onClick={nextPost} className="absolute inset-0 w-full h-full" aria-label="Next" />
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Create Highlight</h3>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <input placeholder="Title (e.g. Barkada Trips)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
            <div>
              <p className="text-xs text-gray-500 mb-2">Pick an icon</p>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                    className={`h-9 w-9 rounded-xl text-xl flex items-center justify-center border-2 transition ${form.emoji === e ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={createHighlight} disabled={!form.title}
              className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#f7971e,#ffd200)", color: "#7c2d00" }}>
              Create Highlight ⭐
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
