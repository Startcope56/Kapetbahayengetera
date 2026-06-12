import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Heart, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function MemoriesPage() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);

  useEffect(() => {
    if (!token || !user) return;
    fetch(`/api/posts?userId=${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: any[]) => {
        setPosts(Array.isArray(data) ? data : []);
        // Filter posts from 1+ year ago or other dates in history
        const now = new Date();
        const mem = (Array.isArray(data) ? data : []).filter(p => {
          const d = new Date(p.createdAt);
          const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays >= 30;
        });
        setMemories(mem.slice(0, 10));
      })
      .catch(() => {});
  }, [token, user]);

  const reshare = async (post: any) => {
    if (!token) return;
    await fetch("/api/posts", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `📅 Memory from ${format(new Date(post.createdAt), "MMMM d, yyyy")}\n\n${post.content}`,
        imageUrl: post.imageUrl,
      }),
    });
    alert("Memory reshared to your feed! 🎉");
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl">Memories ✨</h1>
            <p className="text-purple-100 text-sm">Look back at your moments</p>
          </div>
        </div>
      </div>

      {memories.length === 0 && posts.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <div className="text-5xl mb-3">📅</div>
          <h3 className="font-bold text-gray-900 mb-1">No memories yet</h3>
          <p className="text-sm text-gray-500">Your past posts will appear here as memories. Start posting to create memories!</p>
        </div>
      )}

      {memories.length === 0 && posts.length > 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <div className="text-5xl mb-3">🕐</div>
          <h3 className="font-bold text-gray-900 mb-1">Check back later!</h3>
          <p className="text-sm text-gray-500">Memories appear for posts that are at least 30 days old. Keep posting!</p>
        </div>
      )}

      {memories.map(post => {
        const postDate = new Date(post.createdAt);
        const yearsAgo = Math.floor((Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
        const daysAgo = Math.floor((Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24));

        return (
          <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Memory header */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 flex items-center gap-2 border-b border-purple-100">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="font-bold text-purple-800 text-sm">
                {yearsAgo >= 1 ? `${yearsAgo} year${yearsAgo > 1 ? "s" : ""} ago` : `${daysAgo} days ago`}
              </span>
              <span className="text-purple-400 text-xs ml-auto">{format(postDate, "MMMM d, yyyy")}</span>
            </div>

            {/* Post content */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.profilePicture || undefined} />
                  <AvatarFallback className="font-bold text-sm" style={{ background: "#1877f2", color: "white" }}>{user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-400">{formatDistanceToNow(postDate, { addSuffix: true })}</p>
                </div>
              </div>

              {post.bgColor ? (
                <div className="rounded-xl overflow-hidden mb-2">
                  <div className="flex items-center justify-center min-h-[100px] px-4 py-5 text-white text-center" style={{ background: post.bgColor }}>
                    <p className="text-white font-bold whitespace-pre-wrap drop-shadow-sm">{post.content}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-800 text-sm mb-2 whitespace-pre-wrap">{post.content}</p>
              )}

              {post.imageUrl && (
                <div className="rounded-xl overflow-hidden mb-3">
                  <img src={post.imageUrl} alt="" className="w-full object-cover max-h-48" />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Heart className="h-3.5 w-3.5" />
                  <span>{post.reactions?.reduce((s: number, r: any) => s + r.count, 0) ?? 0} reactions</span>
                </div>
                <button onClick={() => reshare(post)}
                  className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 transition">
                  <RefreshCw className="h-3.5 w-3.5" /> Reshare Memory
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
