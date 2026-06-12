import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Story {
  id: string;
  userId: number;
  userName: string;
  userAvatar?: string | null;
  imageUrl: string;
  text?: string;
  bgColor?: string;
  createdAt: number;
  seen: boolean;
}

const STORY_BG_COLORS = [
  "linear-gradient(135deg,#1877f2,#0a6bc7)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#f7971e,#ffd200)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
];

export function StoriesBar() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([
    {
      id: "demo1", userId: 999, userName: "Blue Media", userAvatar: null,
      imageUrl: "", text: "Welcome to Blue Media! 🇵🇭", bgColor: STORY_BG_COLORS[0],
      createdAt: Date.now() - 3600000, seen: false,
    },
  ]);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [viewIdx, setViewIdx] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newText, setNewText] = useState("");
  const [selectedBg, setSelectedBg] = useState(STORY_BG_COLORS[0]);
  const [storyImageFile, setStoryImageFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openStory = (story: Story, idx: number) => {
    setViewingStory(story);
    setViewIdx(idx);
    setStories(prev => prev.map(s => s.id === story.id ? { ...s, seen: true } : s));
  };

  const nextStory = () => {
    if (viewIdx < stories.length - 1) openStory(stories[viewIdx + 1], viewIdx + 1);
    else setViewingStory(null);
  };

  const prevStory = () => {
    if (viewIdx > 0) openStory(stories[viewIdx - 1], viewIdx - 1);
  };

  const createStory = async () => {
    if (!newText.trim() && !storyImageFile) return;
    let imgUrl = "";
    if (storyImageFile && token) {
      const form = new FormData();
      form.append("file", storyImageFile);
      const r = await fetch("/api/posts/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const d = await r.json();
      imgUrl = d.url || "";
    }
    const newStory: Story = {
      id: Math.random().toString(36).slice(2),
      userId: user?.id || 0,
      userName: user?.name || "",
      userAvatar: user?.profilePicture,
      imageUrl: imgUrl,
      text: newText,
      bgColor: storyImageFile ? undefined : selectedBg,
      createdAt: Date.now(),
      seen: false,
    };
    setStories(prev => [newStory, ...prev]);
    setShowCreate(false);
    setNewText("");
    setStoryImageFile(null);
    toast({ title: "Story posted! 🎉" });
  };

  return (
    <>
      {/* Stories strip */}
      <div className="bg-white rounded-2xl shadow-sm p-3 overflow-x-auto">
        <div className="flex gap-3 items-center min-w-max">
          {/* Add story */}
          <button onClick={() => setShowCreate(true)} className="flex flex-col items-center gap-1 shrink-0">
            <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-dashed border-blue-400">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.profilePicture || undefined} />
                <AvatarFallback className="text-sm font-bold" style={{ background: "#1877f2", color: "white" }}>{user?.name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 bg-blue-600 rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                <Plus className="h-3 w-3 text-white" />
              </span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">Add Story</span>
          </button>

          {/* Story items */}
          {stories.map((story, idx) => (
            <button key={story.id} onClick={() => openStory(story, idx)} className="flex flex-col items-center gap-1 shrink-0">
              <div className={`h-14 w-14 rounded-full p-0.5 ${story.seen ? "bg-gray-300" : "bg-gradient-to-tr from-blue-500 to-pink-500"}`}>
                <div className="h-full w-full rounded-full overflow-hidden border-2 border-white">
                  {story.imageUrl ? (
                    <img src={story.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ background: story.bgColor }}>
                      {story.text?.slice(0, 2) || story.userName[0]}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-gray-600 font-medium max-w-[56px] truncate">{story.userName.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Story viewer */}
      {viewingStory && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => setViewingStory(null)}>
          <div className="relative w-full max-w-sm h-[90vh] rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Story content */}
            {viewingStory.imageUrl ? (
              <img src={viewingStory.imageUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: viewingStory.bgColor }}>
                <p className="text-white text-2xl font-black text-center px-6 drop-shadow-lg">{viewingStory.text}</p>
              </div>
            )}

            {/* Overlay text on image */}
            {viewingStory.imageUrl && viewingStory.text && (
              <div className="absolute bottom-16 left-4 right-4">
                <p className="text-white text-lg font-bold drop-shadow-lg bg-black/30 px-3 py-2 rounded-xl backdrop-blur-sm">{viewingStory.text}</p>
              </div>
            )}

            {/* Header */}
            <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarImage src={viewingStory.userAvatar || undefined} />
                <AvatarFallback className="text-xs font-bold bg-blue-600 text-white">{viewingStory.userName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-sm font-bold drop-shadow">{viewingStory.userName}</p>
                <p className="text-white/70 text-xs">{Math.round((Date.now() - viewingStory.createdAt) / 3600000)}h ago</p>
              </div>
              <button onClick={() => setViewingStory(null)} className="ml-auto text-white bg-black/30 rounded-full p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            {viewIdx > 0 && (
              <button onClick={prevStory} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-1.5 text-white">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {viewIdx < stories.length - 1 && (
              <button onClick={nextStory} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-1.5 text-white">
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create story modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Create Story</h3>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            {/* Preview */}
            <div className="rounded-2xl overflow-hidden h-40 flex items-center justify-center" style={{ background: storyImageFile ? "#000" : selectedBg }}>
              {storyImageFile ? (
                <img src={URL.createObjectURL(storyImageFile)} className="h-full w-full object-cover" alt="" />
              ) : (
                <p className="text-white font-bold text-center px-4">{newText || "Your story text..."}</p>
              )}
            </div>

            <textarea
              placeholder="Add text to your story..."
              value={newText}
              onChange={e => setNewText(e.target.value)}
              className="w-full border rounded-xl p-2.5 text-sm resize-none outline-none focus:border-blue-400"
              rows={2}
            />

            {!storyImageFile && (
              <div className="flex gap-2">
                {STORY_BG_COLORS.map(c => (
                  <button key={c} onClick={() => setSelectedBg(c)}
                    className={`h-7 w-7 rounded-full border-2 transition ${selectedBg === c ? "border-blue-500 scale-110" : "border-gray-200"}`}
                    style={{ background: c }} />
                ))}
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { setStoryImageFile(e.target.files?.[0] || null); }} />
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()}
                className="flex-1 py-2 rounded-xl border-2 border-blue-400 text-blue-600 text-sm font-medium hover:bg-blue-50 transition">
                📷 Add Photo
              </button>
              <button onClick={createStory} disabled={!newText.trim() && !storyImageFile}
                className="flex-1 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
                Post Story
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
