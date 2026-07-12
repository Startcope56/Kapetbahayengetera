import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, X, ChevronLeft, ChevronRight, Music, Search, Palette, Image as ImageIcon, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Story {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string | null;
  blueBadge?: boolean;
  imageUrl?: string | null;
  text?: string | null;
  bgColor?: string | null;
  musicTitle?: string | null;
  musicArtist?: string | null;
  musicPreviewUrl?: string | null;
  musicArtwork?: string | null;
  expiresAt: string;
  createdAt: string;
  seen: boolean;
}

const STORY_COLORS = [
  "linear-gradient(135deg,#1877f2,#0a6bc7)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#f7971e,#ffd200)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#0c3483,#a2b6df)",
  "linear-gradient(135deg,#fd1d1d,#fcb045)",
  "linear-gradient(135deg,#1a1a2e,#16213e)",
  "linear-gradient(135deg,#134e5e,#71b280)",
];

interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  previewUrl: string;
  artworkUrl100: string;
}

async function searchItunes(q: string): Promise<ItunesTrack[]> {
  try {
    const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=12&country=PH`);
    const d = await r.json();
    return (d.results || []).filter((t: any) => t.previewUrl);
  } catch { return []; }
}

// Group stories by user, keeping latest per user
function groupStories(stories: Story[]): Map<number, Story[]> {
  const map = new Map<number, Story[]>();
  for (const s of stories) {
    if (!map.has(s.userId)) map.set(s.userId, []);
    map.get(s.userId)!.push(s);
  }
  return map;
}

export function StoriesBar() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [viewingGroup, setViewingGroup] = useState<Story[] | null>(null);
  const [viewIdx, setViewIdx] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  // Create story state
  const [newText, setNewText] = useState("");
  const [selectedColor, setSelectedColor] = useState(STORY_COLORS[0]);
  const [storyImageFile, setStoryImageFile] = useState<File | null>(null);
  const [storyImagePreview, setStoryImagePreview] = useState<string | null>(null);
  const [musicQuery, setMusicQuery] = useState("");
  const [musicResults, setMusicResults] = useState<ItunesTrack[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<ItunesTrack | null>(null);
  const [musicSearching, setMusicSearching] = useState(false);
  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const [posting, setPosting] = useState(false);
  const [storyTab, setStoryTab] = useState<"bg" | "image">("bg");
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const load = async () => {
    if (!token) return;
    try {
      const r = await fetch("/api/stories", { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setStories(await r.json());
    } catch {}
  };

  useEffect(() => { load(); }, [token]);

  // Auto-advance story every 5s
  useEffect(() => {
    if (!viewingGroup) return;
    const t = setTimeout(() => {
      if (viewIdx < viewingGroup.length - 1) setViewIdx(i => i + 1);
      else setViewingGroup(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [viewingGroup, viewIdx]);

  // Mark story as viewed
  useEffect(() => {
    if (!viewingGroup || !token) return;
    const story = viewingGroup[viewIdx];
    if (!story) return;
    fetch(`/api/stories/${story.id}/view`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    setStories(prev => prev.map(s => s.id === story.id ? { ...s, seen: true } : s));
  }, [viewingGroup, viewIdx]);

  // Music preview on story view
  useEffect(() => {
    if (!viewingGroup) { audioRef.current?.pause(); return; }
    const story = viewingGroup[viewIdx];
    if (story?.musicPreviewUrl) {
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = story.musicPreviewUrl;
      audioRef.current.loop = true;
      audioRef.current.muted = isMuted;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
    return () => { audioRef.current?.pause(); };
  }, [viewingGroup, viewIdx]);

  const searchMusic = async () => {
    if (!musicQuery.trim()) return;
    setMusicSearching(true);
    const res = await searchItunes(musicQuery);
    setMusicResults(res);
    setMusicSearching(false);
  };

  const previewTrack = (track: ItunesTrack) => {
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = track.previewUrl;
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const stopPreview = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setStoryImageFile(f);
    const reader = new FileReader();
    reader.onload = ev => setStoryImagePreview(ev.target?.result as string);
    reader.readAsDataURL(f);
    setStoryTab("image");
  };

  const handlePost = async () => {
    if (!newText.trim() && !storyImageFile && storyTab === "bg") {
      toast({ title: "Magdagdag ng text o larawan sa iyong story!", variant: "destructive" }); return;
    }
    setPosting(true);
    audioRef.current?.pause();
    try {
      let imageUrl: string | undefined;
      if (storyImageFile && token) {
        const form = new FormData();
        form.append("file", storyImageFile);
        const r = await fetch("/api/posts/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
        const d = await r.json();
        imageUrl = d.url;
      }
      const body: any = {
        text: newText || undefined,
        bgColor: storyTab === "bg" ? selectedColor : undefined,
        imageUrl: imageUrl || undefined,
        musicTitle: selectedMusic?.trackName,
        musicArtist: selectedMusic?.artistName,
        musicPreviewUrl: selectedMusic?.previewUrl,
        musicArtwork: selectedMusic?.artworkUrl100,
      };
      await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      toast({ title: "Story posted! 🌟 Makikita ito ng lahat sa loob ng 24 oras." });
      setNewText(""); setStoryImageFile(null); setStoryImagePreview(null);
      setSelectedMusic(null); setMusicQuery(""); setMusicResults([]);
      setShowCreate(false);
      await load();
    } catch { toast({ title: "Failed to post story", variant: "destructive" }); }
    setPosting(false);
  };

  const grouped = groupStories(stories);
  const userGroups = Array.from(grouped.entries()).map(([uid, s]) => ({ userId: uid, stories: s, hasSeen: s.every(x => x.seen) }));
  const myStories = grouped.get(user?.id ?? -1);
  const otherGroups = userGroups.filter(g => g.userId !== user?.id);

  return (
    <>
      {/* Stories Bar */}
      <div className="flex gap-2.5 overflow-x-auto px-3 py-3 no-scrollbar">
        {/* Add Story */}
        <button onClick={() => setShowCreate(true)}
          className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="relative h-16 w-16 rounded-full overflow-hidden border-3 border-dashed border-blue-300 bg-blue-50 flex items-center justify-center">
            {user?.profilePicture
              ? <img src={user.profilePicture} className="w-full h-full object-cover opacity-50" />
              : null}
            <div className="absolute inset-0 flex items-center justify-center">
              <Plus className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <span className="text-[10px] text-gray-500 font-medium text-center w-16 truncate">
            {myStories ? "Iyong Story" : "Magdagdag"}
          </span>
        </button>

        {/* My stories ring */}
        {myStories && (
          <button onClick={() => { setViewingGroup(myStories); setViewIdx(0); }}
            className="flex flex-col items-center gap-1.5 shrink-0">
            <div className={`h-16 w-16 rounded-full overflow-hidden border-3 ${myStories.some(s => !s.seen) ? "border-blue-500" : "border-gray-300"} p-0.5`}>
              {myStories[0].imageUrl
                ? <img src={myStories[0].imageUrl} className="w-full h-full object-cover rounded-full" />
                : <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: myStories[0].bgColor || STORY_COLORS[0] }}>
                    <span className="text-white text-xs font-bold text-center px-1 line-clamp-2">{myStories[0].text?.slice(0, 15)}</span>
                  </div>
              }
            </div>
            <span className="text-[10px] text-blue-600 font-semibold w-16 truncate text-center">Ikaw</span>
          </button>
        )}

        {/* Others */}
        {otherGroups.map(g => {
          const first = g.stories[0];
          return (
            <button key={g.userId} onClick={() => { setViewingGroup(g.stories); setViewIdx(0); }}
              className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`h-16 w-16 rounded-full overflow-hidden border-3 p-0.5 ${g.hasSeen ? "border-gray-300" : "border-blue-500"}`}>
                {first.imageUrl
                  ? <img src={first.imageUrl} className="w-full h-full object-cover rounded-full" />
                  : <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: first.bgColor || STORY_COLORS[0] }}>
                      <span className="text-white text-[10px] font-bold text-center px-1 line-clamp-2">{first.text?.slice(0, 12)}</span>
                    </div>
                }
              </div>
              <span className="text-[10px] text-gray-600 font-medium w-16 truncate text-center">{first.userName?.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* ── STORY VIEWER ── */}
      {viewingGroup && viewingGroup[viewIdx] && (() => {
        const story = viewingGroup[viewIdx];
        return (
          <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={() => setViewingGroup(null)}>
            {/* Progress bars */}
            <div className="flex gap-1 p-3 pt-safe absolute top-0 left-0 right-0 z-10">
              {viewingGroup.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  {i < viewIdx
                    ? <div className="h-full bg-white w-full" />
                    : i === viewIdx
                    ? <div className="h-full bg-white animate-story-progress" style={{ animation: "story-fill 5s linear forwards" }} />
                    : null}
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 left-0 right-0 px-4 flex items-center gap-3 z-10" onClick={e => e.stopPropagation()}>
              <Avatar className="h-9 w-9 border-2 border-white">
                <AvatarImage src={story.userAvatar || undefined} />
                <AvatarFallback style={{ background: "#1877f2", color: "white" }}>{story.userName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{story.userName}</p>
                <p className="text-white/60 text-xs">{new Date(story.createdAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              {story.musicTitle && (
                <button onClick={() => { isMuted ? (audioRef.current && (audioRef.current.muted = false)) : (audioRef.current && (audioRef.current.muted = true)); setIsMuted(m => !m); }}
                  className="text-white/80 p-1.5 rounded-full bg-black/30">
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              )}
              <button onClick={() => setViewingGroup(null)} className="text-white p-1.5 rounded-full bg-black/30"><X className="h-4 w-4" /></button>
            </div>

            {/* Story content */}
            <div className="flex-1 flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
              {story.imageUrl ? (
                <img src={story.imageUrl} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center px-8 text-center" style={{ background: story.bgColor || STORY_COLORS[0] }}>
                  <p className="text-white text-2xl font-black leading-snug drop-shadow-lg">{story.text}</p>
                </div>
              )}
              {story.imageUrl && story.text && (
                <div className="absolute bottom-24 left-0 right-0 px-6">
                  <div className="bg-black/50 rounded-2xl px-4 py-3 text-white text-center font-bold text-base backdrop-blur-sm">{story.text}</div>
                </div>
              )}
            </div>

            {/* Music strip */}
            {story.musicTitle && (
              <div className="absolute bottom-16 left-0 right-0 px-4" onClick={e => e.stopPropagation()}>
                <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-3 py-2 flex items-center gap-2">
                  {story.musicArtwork && <img src={story.musicArtwork} className="h-8 w-8 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">🎵 {story.musicTitle}</p>
                    <p className="text-white/70 text-[10px] truncate">{story.musicArtist}</p>
                  </div>
                  <div className="h-4 w-4 relative">
                    <div className="absolute inset-0 rounded-full border-2 border-white/60 animate-spin" style={{ borderTopColor: "white" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Prev / Next taps */}
            <div className="absolute inset-0 flex" onClick={e => e.stopPropagation()}>
              <div className="flex-1" onClick={() => { if (viewIdx > 0) setViewIdx(i => i - 1); }} />
              <div className="flex-1" onClick={() => { if (viewIdx < viewingGroup.length - 1) setViewIdx(i => i + 1); else setViewingGroup(null); }} />
            </div>
          </div>
        );
      })()}

      {/* ── CREATE STORY ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-base">Gumawa ng Story 🌟</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Preview */}
              <div className="rounded-2xl overflow-hidden aspect-[9/14] max-h-64 flex items-center justify-center relative"
                style={{ background: storyTab === "bg" ? selectedColor : "#111" }}>
                {storyTab === "image" && storyImagePreview
                  ? <img src={storyImagePreview} className="w-full h-full object-cover absolute inset-0" />
                  : null}
                {newText && (
                  <div className="absolute inset-0 flex items-center justify-center px-4">
                    <p className="text-white font-black text-xl text-center drop-shadow-lg leading-snug">{newText}</p>
                  </div>
                )}
                {selectedMusic && (
                  <div className="absolute bottom-3 left-3 right-3 bg-black/50 rounded-xl px-2 py-1.5 flex items-center gap-2">
                    <img src={selectedMusic.artworkUrl100} className="h-6 w-6 rounded" />
                    <p className="text-white text-[10px] font-bold truncate">{selectedMusic.trackName}</p>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button onClick={() => setStoryTab("bg")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${storyTab === "bg" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                  <Palette className="h-3.5 w-3.5" /> Kulay
                </button>
                <button onClick={() => fileRef.current?.click()}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${storyTab === "image" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                  <ImageIcon className="h-3.5 w-3.5" /> Larawan
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              </div>

              {/* Color picker */}
              {storyTab === "bg" && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {STORY_COLORS.map(c => (
                    <button key={c} onClick={() => setSelectedColor(c)}
                      className={`h-9 w-9 rounded-full shrink-0 border-3 transition ${selectedColor === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                      style={{ background: c }} />
                  ))}
                </div>
              )}

              {/* Text input */}
              <textarea
                value={newText} onChange={e => setNewText(e.target.value)}
                placeholder="Isulat ang iyong kuwento... 📝"
                rows={2}
                className="w-full border-2 border-gray-200 rounded-2xl px-3 py-2.5 text-sm resize-none outline-none focus:border-blue-400 transition"
              />

              {/* Music */}
              <div>
                <button onClick={() => setShowMusicSearch(!showMusicSearch)}
                  className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
                  <Music className="h-4 w-4" />
                  {selectedMusic ? `🎵 ${selectedMusic.trackName} — ${selectedMusic.artistName}` : "Magdagdag ng musika 🎵"}
                  {selectedMusic && <button onClick={e => { e.stopPropagation(); setSelectedMusic(null); stopPreview(); }} className="text-red-400 hover:text-red-500 ml-1"><X className="h-3.5 w-3.5" /></button>}
                </button>

                {showMusicSearch && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <input value={musicQuery} onChange={e => setMusicQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && searchMusic()}
                        placeholder="Hanapin ang kanta... (hal. OPM, love song)"
                        className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
                      <button onClick={searchMusic} disabled={musicSearching}
                        className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-50">
                        {musicSearching ? "..." : <Search className="h-4 w-4" />}
                      </button>
                    </div>

                    {musicResults.length > 0 && (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {musicResults.map(t => (
                          <div key={t.trackId}
                            className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition ${selectedMusic?.trackId === t.trackId ? "bg-blue-50 border-2 border-blue-300" : "hover:bg-gray-50 border-2 border-transparent"}`}
                            onClick={() => { setSelectedMusic(t); setShowMusicSearch(false); previewTrack(t); }}>
                            <img src={t.artworkUrl100} className="h-9 w-9 rounded-lg object-cover shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{t.trackName}</p>
                              <p className="text-[10px] text-gray-500 truncate">{t.artistName}</p>
                            </div>
                            <button onClick={e => { e.stopPropagation(); previewTrack(t); }}
                              className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 shrink-0">
                              <Play className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button onClick={handlePost} disabled={posting}
                className="w-full py-3.5 rounded-2xl text-white font-black text-sm disabled:opacity-50 transition active:scale-95"
                style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
                {posting ? "Nagpo-post..." : "I-share ang Story 🌟"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes story-fill { from { width: 0%; } to { width: 100%; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .border-3 { border-width: 3px; }
      `}</style>
    </>
  );
}
