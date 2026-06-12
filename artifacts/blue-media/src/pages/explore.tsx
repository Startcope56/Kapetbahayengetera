import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Flame, Hash, Users, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TRENDING_TOPICS = [
  { tag: "#BlueMediaPilipinas", count: "12.4K posts" },
  { tag: "#Trending", count: "8.2K posts" },
  { tag: "#Pinoy", count: "6.7K posts" },
  { tag: "#GoodVibesOnly", count: "5.1K posts" },
  { tag: "#BlueAI", count: "3.9K posts" },
  { tag: "#BlueBadge", count: "2.8K posts" },
  { tag: "#PagmamahalNgBayan", count: "2.2K posts" },
  { tag: "#Blessed", count: "1.9K posts" },
];

export default function ExplorePage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/users/search?q=", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setSuggested(Array.isArray(d) ? d.slice(0, 8) : []))
      .catch(() => {});
  }, [token]);

  const doSearch = async (query: string) => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setResults(await res.json());
    } catch {}
    setLoading(false);
  };

  const follow = async (id: number) => {
    try {
      await fetch(`/api/users/${id}/follow`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "Following!" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search people..."
            className="pl-9 rounded-xl bg-gray-50 border-0"
            value={q}
            onChange={e => { setQ(e.target.value); doSearch(e.target.value); }}
          />
        </div>
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <Search className="h-4 w-4 text-blue-500" /> Results for "{q}"
            </h3>
          </div>
          {results.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
              <Link href={`/profile/${u.id}`}>
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage src={u.profilePicture || undefined} />
                  <AvatarFallback className="font-bold text-sm" style={{ background: "#1877f2", color: "white" }}>{u.name?.[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <Link href={`/profile/${u.id}`}>
                    <span className="font-semibold text-sm text-gray-900 hover:underline cursor-pointer">{u.name}</span>
                  </Link>
                  {u.blueBadge && <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] flex items-center justify-center font-bold">✓</span>}
                </div>
                <p className="text-xs text-gray-400">{u.followerCount ?? 0} followers · {u.rank ?? "Member"}</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => follow(u.id)}>Follow</Button>
            </div>
          ))}
        </div>
      )}

      {/* Trending hashtags */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-3 pb-1 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-orange-500" />
          <h2 className="font-bold text-gray-900">Trending on Blue Media 🇵🇭</h2>
        </div>
        {TRENDING_TOPICS.map((t, i) => (
          <div key={t.tag} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer border-b last:border-0 border-gray-50">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-blue-700">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900">{t.tag}</p>
              <p className="text-xs text-gray-400">{t.count}</p>
            </div>
            <Flame className="h-4 w-4 text-orange-400" />
          </div>
        ))}
      </div>

      {/* People to follow */}
      {suggested.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-3 pb-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <h2 className="font-bold text-gray-900">People You May Know</h2>
          </div>
          {suggested.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b last:border-0 border-gray-50">
              <Link href={`/profile/${u.id}`}>
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage src={u.profilePicture || undefined} />
                  <AvatarFallback className="font-bold text-sm" style={{ background: "#1877f2", color: "white" }}>{u.name?.[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <Link href={`/profile/${u.id}`}>
                    <span className="font-semibold text-sm text-gray-900 hover:underline cursor-pointer">{u.name}</span>
                  </Link>
                  {u.blueBadge && <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] flex items-center justify-center font-bold">✓</span>}
                </div>
                <p className="text-xs text-gray-400">{u.followerCount ?? 0} followers · {u.rank ?? "Member"}</p>
              </div>
              <Button size="sm" className="rounded-xl text-xs" style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}
                onClick={() => follow(u.id)}>
                Follow
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Featured categories */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: "🎉", label: "Events", color: "from-orange-400 to-pink-500" },
          { icon: "🎮", label: "Gaming", color: "from-purple-500 to-indigo-600" },
          { icon: "🍽️", label: "Food", color: "from-green-400 to-teal-500" },
          { icon: "🎵", label: "Music", color: "from-blue-400 to-cyan-500" },
          { icon: "📚", label: "Education", color: "from-yellow-400 to-orange-500" },
          { icon: "💪", label: "Fitness", color: "from-red-400 to-pink-500" },
        ].map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-2xl p-4 text-white cursor-pointer hover:opacity-90 transition active:scale-95`}>
            <div className="text-3xl mb-1">{c.icon}</div>
            <p className="font-bold">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
