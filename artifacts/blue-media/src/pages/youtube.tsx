import { useState, useRef, useEffect } from "react";
import { Search, Play, ThumbsUp, MessageSquare, Share2, X, Eye, Clock, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Video {
  id: string;
  title: string;
  channel: string;
  channelAvatar?: string;
  views: string;
  duration: string;
  thumbnail: string;
  publishedText: string;
  likes: number;
  dislikes: number;
  description: string;
}

const POPULAR_TAGS = ["Pinoy", "OPM", "Trending PH", "Memes", "News", "Kpop", "Gaming", "Vlog", "Food", "Travel"];

const DEMO_VIDEOS: Video[] = [
  {
    id: "dQw4w9WgXcQ", title: "Blue Media Community Highlights 2025 🇵🇭",
    channel: "Blue Media Official", views: "1.2M", duration: "8:42", publishedText: "2 days ago",
    thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`, likes: 45000, dislikes: 200,
    description: "Best highlights from our Blue Media community!",
  },
  {
    id: "kXYiU_JCYtU", title: "Trending OPM Songs 2025 - Pinoy Music Mix",
    channel: "OPM Music PH", views: "3.5M", duration: "1:02:14", publishedText: "1 week ago",
    thumbnail: `https://img.youtube.com/vi/kXYiU_JCYtU/mqdefault.jpg`, likes: 120000, dislikes: 500,
    description: "Best OPM songs of 2025 nonstop mix!",
  },
  {
    id: "2Vv-BfVoq4g", title: "Pinoy Funny Memes Compilation 😂",
    channel: "PinoyFunnyTV", views: "892K", duration: "12:35", publishedText: "3 days ago",
    thumbnail: `https://img.youtube.com/vi/2Vv-BfVoq4g/mqdefault.jpg`, likes: 33000, dislikes: 100,
    description: "Pinakamasayang memes ngayong 2025!",
  },
  {
    id: "9bZkp7q19f0", title: "Filipino Street Food Tour Manila 🍜",
    channel: "FoodiesPH Vlog", views: "567K", duration: "18:22", publishedText: "5 days ago",
    thumbnail: `https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg`, likes: 28000, dislikes: 150,
    description: "Exploring the best street food in Manila!",
  },
  {
    id: "YQHsXMglC9A", title: "Best Pinoy Teleserye Moments 2025 💕",
    channel: "PH Drama Central", views: "2.1M", duration: "24:10", publishedText: "1 day ago",
    thumbnail: `https://img.youtube.com/vi/YQHsXMglC9A/mqdefault.jpg`, likes: 89000, dislikes: 300,
    description: "Top kilig and heartwarming moments this year!",
  },
  {
    id: "60ItHLz5WEA", title: "Palawan Paradise: Ultimate Travel Guide 🏖️",
    channel: "TravelPH", views: "445K", duration: "22:18", publishedText: "2 weeks ago",
    thumbnail: `https://img.youtube.com/vi/60ItHLz5WEA/mqdefault.jpg`, likes: 19000, dislikes: 80,
    description: "Everything you need to know about visiting Palawan!",
  },
];

const REACTION_EMOJIS = ["🩷","😆","💔","😡","😮","🔥","👍","🙌"];

export default function YoutubePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [videos, setVideos] = useState<Video[]>(DEMO_VIDEOS);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, { text: string; name: string; avatar?: string; ts: number }[]>>({});
  const [commentInput, setCommentInput] = useState("");
  const [reaction, setReaction] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState(false);

  const search = async (query: string) => {
    if (!query.trim()) { setVideos(DEMO_VIDEOS); return; }
    setLoading(true);
    try {
      // Try Invidious public API (free, no key needed)
      const instances = ["https://invidious.io.lol", "https://yt.cdaut.de", "https://inv.nadeko.net"];
      let found = false;
      for (const base of instances) {
        try {
          const res = await fetch(`${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&region=PH`, {
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setVideos(data.slice(0, 12).map((v: any) => ({
                id: v.videoId,
                title: v.title,
                channel: v.author,
                channelAvatar: undefined,
                views: v.viewCount ? `${(v.viewCount / 1000).toFixed(0)}K` : "?",
                duration: v.lengthSeconds ? `${Math.floor(v.lengthSeconds / 60)}:${String(v.lengthSeconds % 60).padStart(2, "0")}` : "?",
                thumbnail: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
                publishedText: v.publishedText || "",
                likes: v.likeCount || 0,
                dislikes: 0,
                description: v.description || "",
              })));
              found = true;
              break;
            }
          }
        } catch { continue; }
      }
      if (!found) {
        // Fallback: filter demo videos
        const filtered = DEMO_VIDEOS.filter(v => v.title.toLowerCase().includes(query.toLowerCase()) || v.channel.toLowerCase().includes(query.toLowerCase()));
        setVideos(filtered.length > 0 ? filtered : DEMO_VIDEOS);
        toast({ title: "Showing offline results", description: "Live search unavailable. Showing local results." });
      }
    } catch { setVideos(DEMO_VIDEOS); }
    setLoading(false);
  };

  const toggleLike = (id: string) => {
    setLiked(l => ({ ...l, [id]: !l[id] }));
    toast({ title: liked[id] ? "Like removed" : "Liked! 🩷" });
  };

  const addComment = () => {
    if (!commentInput.trim() || !playing) return;
    setComments(c => ({
      ...c,
      [playing.id]: [...(c[playing.id] ?? []), { text: commentInput, name: user?.name || "You", avatar: user?.profilePicture || undefined, ts: Date.now() }],
    }));
    setCommentInput("");
  };

  const shareVideo = (v: Video) => {
    const url = `https://youtube.com/watch?v=${v.id}`;
    if (navigator.share) navigator.share({ title: v.title, url });
    else { navigator.clipboard.writeText(url); toast({ title: "Video link copied! 📋" }); }
  };

  return (
    <div className="space-y-3 pb-4">
      {/* Header */}
      <div className="rounded-2xl p-4 text-white" style={{ background: "linear-gradient(135deg,#ff0000,#cc0000)" }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Play className="h-5 w-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="font-black text-lg">Blue Videos 🎬</h1>
            <p className="text-red-100 text-xs">Watch & share your fave videos</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={e => { e.preventDefault(); search(q); }} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search videos..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-400 bg-white" />
        </div>
        <button type="submit" className="px-4 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "#ff0000" }}>
          Search
        </button>
      </form>

      {/* Tags */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {POPULAR_TAGS.map(t => (
          <button key={t} onClick={() => { setQ(t); search(t); }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition">
            {t}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
        </div>
      )}

      {/* Videos list */}
      {!loading && !playing && (
        <div className="space-y-3">
          {videos.map(v => (
            <div key={v.id} className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition"
              onClick={() => setPlaying(v)}>
              {/* Thumbnail */}
              <div className="relative">
                <img src={v.thumbnail} alt={v.title} className="w-full h-44 object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/320x180/1a1a2e/white?text=Video"; }} />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                  <div className="h-14 w-14 rounded-full bg-red-600/90 flex items-center justify-center">
                    <Play className="h-7 w-7 text-white fill-white ml-1" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">{v.duration}</span>
              </div>
              {/* Info */}
              <div className="p-3 flex gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="font-bold text-xs text-white" style={{ background: "#ff0000" }}>{v.channel[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-2">{v.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{v.channel}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <Eye className="h-3 w-3" />{v.views} views
                    <span>·</span>
                    <Clock className="h-3 w-3" />{v.publishedText}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player */}
      {playing && (
        <div className="space-y-3">
          {/* Back button */}
          <button onClick={() => setPlaying(null)} className="flex items-center gap-1.5 text-gray-600 text-sm font-medium hover:text-gray-900 transition">
            ← Back to videos
          </button>

          {/* YouTube embed */}
          <div className="rounded-2xl overflow-hidden shadow-lg bg-black">
            <div className="relative" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${playing.id}?autoplay=1&rel=0&modestbranding=1`}
                title={playing.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Video info */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <h2 className="font-black text-gray-900 text-base">{playing.title}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="h-4 w-4" />{playing.views} views · {playing.publishedText}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => toggleLike(playing.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${liked[playing.id] ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                <ThumbsUp className="h-4 w-4" /> {liked[playing.id] ? "Liked!" : "Like"}
              </button>
              <div className="relative">
                <button onClick={() => setShowReactions(r => !r)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                  {reaction || "🩷"} React
                </button>
                {showReactions && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-xl p-2 flex gap-1.5 z-10 border border-gray-100">
                    {REACTION_EMOJIS.map(e => (
                      <button key={e} onClick={() => { setReaction(e); setShowReactions(false); toast({ title: `Reacted ${e}` }); }}
                        className="text-xl hover:scale-125 transition">{e}</button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => shareVideo(playing)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>

            {/* Channel info */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="font-bold text-sm text-white" style={{ background: "#ff0000" }}>{playing.channel[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm text-gray-900">{playing.channel}</p>
                <p className="text-xs text-gray-400">YouTube Creator</p>
              </div>
              <button className="ml-auto px-4 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: "#ff0000" }}>
                Subscribe
              </button>
            </div>

            {playing.description && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{playing.description}</p>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              Comments ({(comments[playing.id] ?? []).length})
            </h3>

            <div className="flex gap-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="font-bold text-xs" style={{ background: "#1877f2", color: "white" }}>{user?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <input value={commentInput} onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addComment(); }}
                  placeholder="Add a comment..."
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                <button onClick={addComment} disabled={!commentInput.trim()}
                  className="px-3 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition"
                  style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
                  Post
                </button>
              </div>
            </div>

            {(comments[playing.id] ?? []).map((c, i) => (
              <div key={i} className="flex gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="font-bold text-xs" style={{ background: "#1877f2", color: "white" }}>{c.name[0]}</AvatarFallback>
                </Avatar>
                <div className="bg-gray-50 rounded-2xl px-3 py-2 flex-1">
                  <p className="font-semibold text-xs text-gray-700">{c.name}</p>
                  <p className="text-sm text-gray-800">{c.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* More videos */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">More Videos</h3>
            <div className="space-y-3">
              {videos.filter(v => v.id !== playing.id).slice(0, 4).map(v => (
                <div key={v.id} className="flex gap-3 cursor-pointer hover:bg-gray-50 rounded-xl p-1.5 transition" onClick={() => setPlaying(v)}>
                  <div className="relative shrink-0">
                    <img src={v.thumbnail} alt="" className="w-24 h-14 rounded-lg object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/96x56/1a1a2e/white?text=Video"; }} />
                    <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[9px] px-1 rounded">{v.duration}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-gray-900 line-clamp-2">{v.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{v.channel}</p>
                    <p className="text-[10px] text-gray-400">{v.views} views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
