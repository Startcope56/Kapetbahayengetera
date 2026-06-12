import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Crown, Star, Flame, TrendingUp } from "lucide-react";

const RANK_ICONS: Record<string, string> = {
  GOAT: "🐐", Legend: "🔥", VIP: "⭐", Influencer: "🌟", Popular: "💜", Active: "💚", Member: "💙", Newbie: "⚪",
};

export default function LeaderboardPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [tab, setTab] = useState<"followers" | "posts" | "views">("followers");

  useEffect(() => {
    if (!token) return;
    fetch("/api/users?q=", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: any[]) => setUsers(Array.isArray(data) ? data.filter(u => !u.isBlueAI) : []))
      .catch(() => {});
  }, [token]);

  const sorted = [...users].sort((a, b) => {
    if (tab === "followers") return (b.followerCount ?? 0) - (a.followerCount ?? 0);
    if (tab === "posts") return (b.postCount ?? 0) - (a.postCount ?? 0);
    return (b.totalPostViews ?? 0) - (a.totalPostViews ?? 0);
  }).slice(0, 20);

  const tabs = [
    { key: "followers", label: "Most Followed", icon: "👥" },
    { key: "posts", label: "Most Active", icon: "📝" },
    { key: "views", label: "Most Viewed", icon: "👀" },
  ] as const;

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-5 text-white text-center">
        <Trophy className="h-10 w-10 mx-auto mb-2 text-yellow-100" />
        <h1 className="text-2xl font-black">Leaderboard 🏆</h1>
        <p className="text-yellow-100 text-sm">Who's the biggest star on Blue Media 🇵🇭?</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm p-1.5 flex gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${tab === t.key ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      {sorted.length >= 3 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-end justify-center gap-3">
            {/* 2nd */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">🥈</span>
              <Avatar className="h-12 w-12 border-2 border-gray-300">
                <AvatarImage src={sorted[1]?.profilePicture || undefined} />
                <AvatarFallback className="font-bold bg-gray-400 text-white">{sorted[1]?.name?.[0]}</AvatarFallback>
              </Avatar>
              <p className="text-xs font-bold text-gray-700 max-w-[64px] truncate text-center">{sorted[1]?.name?.split(" ")[0]}</p>
              <div className="bg-gray-200 rounded-t-xl w-16 h-12 flex items-end justify-center pb-1">
                <span className="text-xs font-black text-gray-500">2nd</span>
              </div>
            </div>
            {/* 1st */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">🥇</span>
              <Avatar className="h-16 w-16 border-3 border-yellow-400 ring-2 ring-yellow-200">
                <AvatarImage src={sorted[0]?.profilePicture || undefined} />
                <AvatarFallback className="font-bold text-lg" style={{ background: "#1877f2", color: "white" }}>{sorted[0]?.name?.[0]}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-black text-gray-900 max-w-[80px] truncate text-center">{sorted[0]?.name?.split(" ")[0]}</p>
              <Crown className="h-4 w-4 text-yellow-500" />
              <div className="bg-yellow-400 rounded-t-xl w-20 h-16 flex items-end justify-center pb-1">
                <span className="text-sm font-black text-yellow-900">1st</span>
              </div>
            </div>
            {/* 3rd */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">🥉</span>
              <Avatar className="h-12 w-12 border-2 border-orange-300">
                <AvatarImage src={sorted[2]?.profilePicture || undefined} />
                <AvatarFallback className="font-bold bg-orange-400 text-white">{sorted[2]?.name?.[0]}</AvatarFallback>
              </Avatar>
              <p className="text-xs font-bold text-gray-700 max-w-[64px] truncate text-center">{sorted[2]?.name?.split(" ")[0]}</p>
              <div className="bg-orange-300 rounded-t-xl w-16 h-8 flex items-end justify-center pb-1">
                <span className="text-xs font-black text-orange-800">3rd</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {sorted.map((u, idx) => (
          <Link key={u.id} href={`/profile/${u.id}`}>
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b last:border-0 border-gray-50 cursor-pointer">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                idx === 0 ? "bg-yellow-400 text-yellow-900" :
                idx === 1 ? "bg-gray-300 text-gray-700" :
                idx === 2 ? "bg-orange-300 text-orange-800" :
                "bg-gray-100 text-gray-500"
              }`}>
                {idx < 3 ? ["🥇","🥈","🥉"][idx] : idx + 1}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={u.profilePicture || undefined} />
                <AvatarFallback className="font-bold" style={{ background: "#1877f2", color: "white" }}>{u.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm text-gray-900 truncate">{u.name}</span>
                  {u.blueBadge && <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] flex items-center justify-center font-bold shrink-0">✓</span>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">{RANK_ICONS[u.rank ?? "Newbie"] ?? "⚪"} {u.rank ?? "Newbie"}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-gray-900 text-sm">
                  {tab === "followers" ? (u.followerCount ?? 0).toLocaleString() :
                   tab === "posts" ? (u.postCount ?? 0).toLocaleString() :
                   (u.totalPostViews ?? 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">
                  {tab === "followers" ? "followers" : tab === "posts" ? "posts" : "views"}
                </p>
              </div>
            </div>
          </Link>
        ))}
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Loading leaderboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
