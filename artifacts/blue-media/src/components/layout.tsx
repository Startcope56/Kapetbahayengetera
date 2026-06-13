import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  Home, Users, MessageCircle, Bell, Shield, ChevronDown, LogOut, Settings,
  Radio, Search, BarChart3, Compass, Trophy, Clock, ShoppingBag, CalendarDays,
  Sparkles, Gamepad2, BarChart2, Smile, Star, Play, UserPlus
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useGetUnreadCount, getGetUnreadCountQueryKey } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { data: unread } = useGetUnreadCount({ query: { queryKey: getGetUnreadCountQueryKey(), refetchInterval: 30000 } });

  if (!user) return <>{children}</>;

  const unreadCount = unread?.count ?? 0;

  const bottomTabs = [
    { icon: Home, href: "/feed", label: "Home" },
    { icon: Play, href: "/videos", label: "Videos" },
    { icon: MessageCircle, href: "/chat", label: "Messages" },
    { icon: Bell, href: "/notifications", label: "Notifs" },
  ];

  const moreMenuItems = [
    { icon: BarChart3, href: "/dashboard", label: "My Dashboard", color: "bg-blue-100", iconColor: "text-blue-600" },
    { icon: UserPlus, href: "/request-followers", label: "Request Followers 📊", color: "bg-indigo-100", iconColor: "text-indigo-600" },
    { icon: Users, href: "/friends", label: "Friends", color: "bg-green-100", iconColor: "text-green-600" },
    { icon: Compass, href: "/explore", label: "Explore 🔍", color: "bg-sky-100", iconColor: "text-sky-600" },
    { icon: Sparkles, href: "/ai", label: "Blue AI 🤖", color: "bg-cyan-100", iconColor: "text-cyan-600" },
    { icon: BarChart2, href: "/polls", label: "Polls 🗳️", color: "bg-indigo-100", iconColor: "text-indigo-600" },
    { icon: Gamepad2, href: "/games", label: "Games 🎮", color: "bg-purple-100", iconColor: "text-purple-600" },
    { icon: Smile, href: "/mood", label: "Mood Board 😊", color: "bg-yellow-100", iconColor: "text-yellow-600" },
    { icon: Star, href: "/highlights", label: "Highlights ⭐", color: "bg-orange-100", iconColor: "text-orange-600" },
    { icon: Trophy, href: "/leaderboard", label: "Leaderboard 🏆", color: "bg-yellow-100", iconColor: "text-yellow-600" },
    { icon: Clock, href: "/memories", label: "Memories ✨", color: "bg-pink-100", iconColor: "text-pink-600" },
    { icon: ShoppingBag, href: "/marketplace", label: "Marketplace 🛍️", color: "bg-green-100", iconColor: "text-green-600" },
    { icon: CalendarDays, href: "/events", label: "Events 🎉", color: "bg-orange-100", iconColor: "text-orange-600" },
    { icon: Radio, href: "/live", label: "Go Live 🔴", color: "bg-red-100", iconColor: "text-red-500" },
    { icon: Settings, href: "/settings", label: "Settings", color: "bg-gray-100", iconColor: "text-gray-500" },
  ];

  return (
    <div className="min-h-screen pb-16" style={{ background: "#f0f2f5" }}>
      {/* Top Bar */}
      <header className="sticky top-0 z-50 w-full shadow-sm"
        style={{ background: "linear-gradient(135deg, #1877f2 0%, #0a6bc7 100%)" }}>
        <div className="max-w-2xl mx-auto flex h-12 items-center justify-between px-3">
          {/* Logo */}
          <Link href="/feed">
            <span className="text-white font-black text-xl tracking-wider select-none cursor-pointer"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
              BLUE<span style={{ color: "#90d0ff" }}>MEDIA</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            {/* Blue AI shortcut */}
            <Link href="/ai">
              <button className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white px-2 py-1 rounded-full text-xs font-bold transition">
                <Sparkles className="h-3 w-3" /> AI
              </button>
            </Link>

            {/* Live button */}
            <Link href="/live">
              <button className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold transition animate-pulse">
                <Radio className="h-3 w-3" /> LIVE
              </button>
            </Link>

            {/* Search */}
            <Link href="/explore">
              <button className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition">
                <Search className="h-4 w-4" />
              </button>
            </Link>

            {/* Profile menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-full pl-1 pr-2 py-1 transition ml-0.5">
                  <div className="relative">
                    <Avatar className="h-7 w-7 border-2 border-white/40">
                      <AvatarImage src={user.profilePicture || undefined} />
                      <AvatarFallback className="text-xs font-bold" style={{ background: "#0a6bc7", color: "white" }}>
                        {user.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {(user as any).blueBadge && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full text-white text-[7px] font-bold border border-white"
                        style={{ background: "#1877f2" }}>✓</span>
                    )}
                    {(user as any).isLive && (
                      <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3 h-3 rounded-full bg-red-500 border border-white" />
                    )}
                  </div>
                  <span className="text-white text-sm font-medium max-w-[60px] truncate hidden sm:block">{user.name.split(" ")[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-white/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-xl p-1.5 border-0 max-h-[80vh] overflow-y-auto" style={{ background: "white" }}>
                {/* Profile card */}
                <Link href={`/profile/${user.id}`}>
                  <DropdownMenuItem className="cursor-pointer gap-3 py-3 px-3 rounded-lg hover:bg-blue-50">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profilePicture || undefined} />
                        <AvatarFallback className="font-bold text-sm" style={{ background: "#1877f2", color: "white" }}>
                          {user.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {(user as any).isLive && (
                        <span className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full">
                          🔴 LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-800 truncate">{user.name}</span>
                        {(user as any).blueBadge && (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[8px] font-bold shrink-0" style={{ background: "#1877f2" }}>✓</span>
                        )}
                      </div>
                      <span className="text-xs text-blue-500">View your profile →</span>
                    </div>
                  </DropdownMenuItem>
                </Link>

                {/* Stats row */}
                <div className="px-3 py-2 flex gap-3 text-center">
                  <div className="flex-1">
                    <p className="font-black text-sm text-gray-900">{((user as any).followerCount ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">Followers</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-sm text-gray-900">{((user as any).followingCount ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">Following</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-sm text-gray-900">{(user as any).rank ?? "Newbie"}</p>
                    <p className="text-[10px] text-gray-400">Rank</p>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1" />

                {moreMenuItems.map(item => (
                  <Link key={item.href} href={item.href}>
                    <DropdownMenuItem className="cursor-pointer gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700">
                      <div className={`h-7 w-7 rounded-full ${item.color} flex items-center justify-center shrink-0`}>
                        <item.icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                      </div>
                      <span className="font-medium text-sm">{item.label}</span>
                    </DropdownMenuItem>
                  </Link>
                ))}

                {user.isAdmin && (
                  <>
                    <DropdownMenuSeparator className="my-1" />
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer gap-2 px-3 py-2 rounded-lg hover:bg-yellow-50 text-yellow-700">
                        <div className="h-7 w-7 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                          <Shield className="h-3.5 w-3.5 text-yellow-600" />
                        </div>
                        <span className="font-medium text-sm">Admin Panel 👑</span>
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}

                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={logout} className="cursor-pointer gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600">
                  <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <LogOut className="h-3.5 w-3.5 text-red-500" />
                  </div>
                  <span className="font-medium text-sm">Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-2xl mx-auto px-3 py-3">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-2xl mx-auto flex">
          {bottomTabs.map((tab) => {
            const isActive = location === tab.href || (tab.href !== "/feed" && location.startsWith(tab.href));
            return (
              <Link key={tab.href} href={tab.href} className="flex-1">
                <button className={`relative w-full flex flex-col items-center justify-center py-2 transition-colors ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                  {tab.href === "/notifications" && unreadCount > 0 && (
                    <span className="absolute top-1 right-1/4 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border border-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  <tab.icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 1.8} />
                  {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />}
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
