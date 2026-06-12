import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart3, Eye, Heart, TrendingUp, Star, Users, FileText, Award, Flame, Crown } from "lucide-react";

const RANKS = ["Newbie", "Member", "Active", "Popular", "Influencer", "VIP", "Legend", "GOAT"];
const RANK_COLORS: Record<string, string> = {
  Newbie: "bg-gray-100 text-gray-600",
  Member: "bg-blue-100 text-blue-700",
  Active: "bg-green-100 text-green-700",
  Popular: "bg-purple-100 text-purple-700",
  Influencer: "bg-orange-100 text-orange-700",
  VIP: "bg-yellow-100 text-yellow-800",
  Legend: "bg-red-100 text-red-700",
  GOAT: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
};

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [topFans, setTopFans] = useState<any[]>([]);
  const [recentViewers, setRecentViewers] = useState<any[]>([]);

  useEffect(() => {
    if (!token || !user) return;
    fetch(`/api/users/${user.id}/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStats).catch(() => {});
  }, [token, user]);

  const rank = (user as any)?.rank ?? "Newbie";
  const rankIdx = RANKS.indexOf(rank);
  const nextRank = RANKS[rankIdx + 1];
  const rankProgress = rankIdx >= 0 ? ((rankIdx + 1) / RANKS.length) * 100 : 0;

  const statCards = [
    { label: "Profile Views", value: (user as any)?.profileViewCount ?? 0, icon: Eye, color: "bg-blue-100 text-blue-700" },
    { label: "Post Views", value: (user as any)?.totalPostViews ?? 0, icon: BarChart3, color: "bg-green-100 text-green-700" },
    { label: "Followers", value: (user as any)?.followerCount ?? stats?.followerCount ?? 0, icon: Users, color: "bg-purple-100 text-purple-700" },
    { label: "Following", value: (user as any)?.followingCount ?? stats?.followingCount ?? 0, icon: TrendingUp, color: "bg-orange-100 text-orange-700" },
    { label: "Posts", value: (user as any)?.postCount ?? stats?.postCount ?? 0, icon: FileText, color: "bg-indigo-100 text-indigo-700" },
    { label: "Friends", value: stats?.friendCount ?? 0, icon: Heart, color: "bg-pink-100 text-pink-700" },
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* Profile card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
        <div className="flex items-center gap-4 relative">
          <Avatar className="h-16 w-16 border-3 border-white/30 ring-2 ring-white/20">
            <AvatarImage src={user?.profilePicture || undefined} />
            <AvatarFallback className="text-2xl font-black" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>{user?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg">{user?.name}</h1>
              {(user as any)?.blueBadge && <span className="w-5 h-5 rounded-full bg-white/30 text-white text-[10px] flex items-center justify-center font-bold">✓</span>}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                rank === "GOAT" ? "bg-yellow-400 text-yellow-900" :
                rank === "Legend" ? "bg-red-400 text-white" :
                rank === "VIP" ? "bg-yellow-300 text-yellow-900" :
                "bg-white/20 text-white"
              }`}>{rank === "GOAT" ? "🐐 GOAT" : rank === "Legend" ? "🔥 Legend" : rank === "VIP" ? "⭐ VIP" : rank}</span>
              {(user as any)?.isAdmin && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900 font-bold">👑 Admin</span>}
            </div>
          </div>
        </div>

        {/* Rank progress bar */}
        {nextRank && (
          <div className="mt-4 relative">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>{rank}</span>
              <span>Next: {nextRank}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${rankProgress}%` }} />
            </div>
          </div>
        )}
        {!nextRank && (
          <div className="mt-4 text-center">
            <span className="text-xs text-yellow-300 font-bold">🏆 Highest rank achieved! You are a GOAT!</span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center mx-auto mb-1.5 ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-lg font-black text-gray-900">{s.value.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rank ladder */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Award className="h-4 w-4 text-yellow-500" /> Rank Ladder
        </h2>
        <div className="space-y-2">
          {RANKS.map((r, i) => {
            const isCurrent = r === rank;
            const isAchieved = RANKS.indexOf(rank) >= i;
            return (
              <div key={r} className={`flex items-center gap-3 p-2.5 rounded-xl transition ${isCurrent ? "ring-2 ring-blue-400 bg-blue-50" : isAchieved ? "bg-green-50" : "bg-gray-50"}`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black ${isAchieved ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-semibold text-sm ${isCurrent ? "text-blue-700" : isAchieved ? "text-green-700" : "text-gray-400"}`}>{r}</span>
                    {isCurrent && <span className="text-[9px] px-1.5 py-0.5 bg-blue-600 text-white rounded-full font-bold">CURRENT</span>}
                    {isAchieved && !isCurrent && <span className="text-green-600 text-xs">✓</span>}
                  </div>
                </div>
                {r === "GOAT" && <span className="text-lg">🐐</span>}
                {r === "Legend" && <span className="text-lg">🔥</span>}
                {r === "VIP" && <span className="text-lg">⭐</span>}
                {r === "Influencer" && <span className="text-lg">🌟</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips for engagement */}
      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 border border-orange-100">
        <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" /> Tips to Level Up
        </h3>
        <ul className="text-sm text-orange-800 space-y-1.5">
          <li>• Post regularly to increase your visibility</li>
          <li>• Engage with comments and reactions</li>
          <li>• Follow interesting people to build connections</li>
          <li>• Join group chats and be active</li>
          <li>• Claim your Blue Badge ✓ if you haven't yet!</li>
        </ul>
      </div>

      {/* Profile link */}
      <Link href={`/profile/${user?.id}`}>
        <div className="bg-blue-600 rounded-2xl p-4 text-white text-center font-bold hover:bg-blue-700 transition cursor-pointer">
          👤 View My Public Profile →
        </div>
      </Link>
    </div>
  );
}
