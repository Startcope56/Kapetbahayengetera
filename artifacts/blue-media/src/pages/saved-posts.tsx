import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bookmark, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: number;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  bgColor?: string;
  createdAt: string;
  author?: { id: number; name: string; profilePicture?: string; blueBadge?: boolean };
  reactions?: any[];
  commentCount?: number;
  feeling?: string;
  activity?: string;
  locationTag?: string;
}

export default function SavedPostsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<number[]>([]);

  useEffect(() => {
    const ids: number[] = JSON.parse(localStorage.getItem("bm_saved_posts") || "[]");
    setSavedIds(ids);
    if (!ids.length) { setLoading(false); return; }

    // Fetch all posts, then filter to saved ones
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/posts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed");
        const all: Post[] = await res.json();
        const saved = all.filter(p => ids.includes(p.id));
        // Maintain order from savedIds
        const ordered = ids.map(id => saved.find(p => p.id === id)).filter(Boolean) as Post[];
        setPosts(ordered);
      } catch {
        toast({ title: "Failed to load saved posts", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [token]);

  const unsave = (id: number) => {
    const updated = savedIds.filter(sid => sid !== id);
    setSavedIds(updated);
    localStorage.setItem("bm_saved_posts", JSON.stringify(updated));
    setPosts(prev => prev.filter(p => p.id !== id));
    toast({ title: "Inalis sa saved posts" });
  };

  const clearAll = () => {
    localStorage.setItem("bm_saved_posts", "[]");
    setSavedIds([]);
    setPosts([]);
    toast({ title: "Lahat ng saved posts ay inalis" });
  };

  return (
    <div className="space-y-3 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pb-1">
        <Link href="/feed">
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="font-black text-gray-900 text-lg flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Saved Posts
          </h1>
          <p className="text-xs text-gray-400">{posts.length} na-save mong post</p>
        </div>
        {posts.length > 0 && (
          <button onClick={clearAll} className="text-xs text-red-500 font-semibold hover:text-red-700 transition">
            Clear All
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-2.5 w-16 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-20">
          <Bookmark className="h-16 w-16 mx-auto text-gray-200 mb-4" />
          <p className="font-bold text-gray-400 text-lg">Walang saved posts</p>
          <p className="text-sm text-gray-400 mt-1">I-tap ang 🔖 sa isang post para i-save ito dito</p>
          <Link href="/feed">
            <button className="mt-4 px-6 py-2.5 rounded-full text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
              Pumunta sa Feed
            </button>
          </Link>
        </div>
      )}

      {posts.map(post => (
        <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <Link href={`/profile/${post.author?.id}`}>
              <Avatar className="h-10 w-10 cursor-pointer">
                <AvatarImage src={post.author?.profilePicture || undefined} />
                <AvatarFallback className="font-bold" style={{ background: "#1877f2", color: "white" }}>
                  {post.author?.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-semibold text-sm text-gray-900">{post.author?.name}</p>
                {post.author?.blueBadge && (
                  <span className="h-3.5 w-3.5 rounded-full bg-blue-600 text-white text-[8px] flex items-center justify-center font-black">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
            <button onClick={() => unsave(post.id)}
              className="p-2 rounded-full text-yellow-500 hover:bg-yellow-50 transition" title="Alisin sa saved">
              <Bookmark className="h-4 w-4 fill-yellow-500" />
            </button>
          </div>

          {post.bgColor ? (
            <div className="mx-4 mb-3 rounded-xl overflow-hidden flex items-center justify-center min-h-[100px]"
              style={{ background: post.bgColor }}>
              <p className="text-white text-xl font-black text-center px-4 py-4">{post.content}</p>
            </div>
          ) : (
            <div className="px-4 pb-2">
              {post.content && <p className="text-gray-800 text-sm whitespace-pre-wrap">{post.content}</p>}
              {post.imageUrl && (
                <img src={post.imageUrl} alt="post" className="w-full rounded-xl mt-2 object-cover max-h-72" />
              )}
              {post.videoUrl && (
                <video src={post.videoUrl} controls className="w-full rounded-xl mt-2 max-h-72" />
              )}
            </div>
          )}

          <div className="flex items-center gap-4 px-4 pb-3 border-t border-gray-50 pt-2">
            {post.reactions && post.reactions.length > 0 && (
              <span className="text-xs text-gray-400">❤️ {post.reactions.reduce((s: number, r: any) => s + (r.count || 0), 0)} reactions</span>
            )}
            {(post.commentCount ?? 0) > 0 && (
              <span className="text-xs text-gray-400">💬 {post.commentCount} comments</span>
            )}
            <button onClick={() => unsave(post.id)}
              className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition">
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
