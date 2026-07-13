import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Users, AlertTriangle, CheckCircle, XCircle, Trash2, Ban, Bell, Settings,
  BarChart3, Search, BadgeCheck, Crown, UserX, TrendingUp, Eye, MessageSquare,
  Heart, UserCheck, Clock
} from "lucide-react";

const token = () => localStorage.getItem("bluemedia_token") ?? "";
const api = (path: string, opts?: RequestInit) =>
  fetch(`/api${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}`, ...(opts?.headers || {}) } });

const RANKS = ["Newbie", "Member", "Active", "Popular", "Influencer", "VIP", "Legend", "GOAT"];

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"overview" | "users" | "reports" | "posts" | "settings" | "broadcast" | "follower-requests" | "teen-safety">("overview");
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [settings, setSettingsData] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [followerRequests, setFollowerRequests] = useState<any[]>([]);
  const [statsInput, setStatsInput] = useState<{ id: number; followers: string; following: string } | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [userNotes, setUserNotes] = useState<Record<number, string>>(() => {
    try { return JSON.parse(localStorage.getItem("bm_admin_notes") || "{}"); } catch { return {}; }
  });
  const [editNoteFor, setEditNoteFor] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");

  const saveNote = (userId: number) => {
    const next = { ...userNotes, [userId]: noteInput };
    setUserNotes(next);
    localStorage.setItem("bm_admin_notes", JSON.stringify(next));
    setEditNoteFor(null);
    setNoteInput("");
    toast({ title: "📝 Note saved!" });
  };

  const toggleSelectUser = (id: number) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;
    const ids = Array.from(selectedUsers);
    for (const id of ids) {
      if (bulkAction === "ban") await api(`/admin/users/${id}/ban`, { method: "POST", body: JSON.stringify({ banned: true }) });
      else if (bulkAction === "unban") await api(`/admin/users/${id}/ban`, { method: "POST", body: JSON.stringify({ banned: false }) });
      else if (bulkAction === "approve") await api(`/admin/users/${id}/approve`, { method: "POST" });
    }
    toast({ title: `✅ Bulk ${bulkAction} done on ${ids.length} users` });
    setSelectedUsers(new Set());
    setBulkAction("");
    await load();
  };

  const load = async () => {
    setLoading(true);
    try {
      const [u, r, s, st, p, fr] = await Promise.all([
        api("/admin/users").then(r => r.json()),
        api("/admin/reports").then(r => r.json()),
        api("/admin/stats").then(r => r.json()),
        api("/admin/settings").then(r => r.json()),
        api("/admin/posts").then(r => r.json()),
        api("/admin/follower-requests").then(r => r.json()),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setReports(Array.isArray(r) ? r : []);
      setStats(s);
      setSettingsData(st || {});
      setPosts(Array.isArray(p) ? p : []);
      setFollowerRequests(Array.isArray(fr) ? fr : []);
    } catch { toast({ title: "Failed to load admin data", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const action = async (path: string, body?: any, method?: string) => {
    try {
      const res = await api(path, { method: method || (body !== undefined ? "POST" : "DELETE"), body: body !== undefined ? JSON.stringify(body) : undefined });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "✅ Done!" });
      await load();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const setSetting = async (key: string, value: string) => {
    await api("/admin/settings", { method: "POST", body: JSON.stringify({ key, value }) });
    setSettingsData(s => ({ ...s, [key]: value }));
    toast({ title: `✅ ${key} updated` });
  };

  const updateStats = async (userId: number, followers: string, following: string) => {
    await action(`/admin/users/${userId}/stats`, { followerCount: parseInt(followers) || 0, followingCount: parseInt(following) || 0 });
    setStatsInput(null);
  };

  const seedAdminStats = async () => {
    if (!user) return;
    await action(`/admin/users/${user.id}/stats`, { followerCount: 10200, followingCount: 240 });
    toast({ title: "✅ Admin stats seeded: 10.2K followers, 240 following!" });
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingApprovals = users.filter(u => u.accountApproved === false);
  const pendingFollowerReqs = followerRequests.filter(r => r.status === "pending");

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: `Users (${users.length})`, icon: Users },
    { id: "follower-requests", label: `Followers ${pendingFollowerReqs.length > 0 ? `(${pendingFollowerReqs.length})` : ""}`, icon: TrendingUp },
    { id: "reports", label: `Reports (${reports.filter(r => r.status === "pending").length})`, icon: AlertTriangle },
    { id: "posts", label: "Posts", icon: Shield },
    { id: "teen-safety", label: "Teen Safety", icon: UserX },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "broadcast", label: "Broadcast", icon: Bell },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl">Admin Panel 👑</h1>
            <p className="text-white/80 text-sm">Blue Media Control Center</p>
          </div>
          <button onClick={seedAdminStats}
            className="ml-auto bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition">
            Seed My Stats
          </button>
        </div>
        {(pendingApprovals.length > 0 || pendingFollowerReqs.length > 0) && (
          <div className="mt-3 bg-white/20 rounded-xl p-2 flex items-center gap-2 text-sm font-bold">
            {pendingApprovals.length > 0 && <span>⏳ {pendingApprovals.length} accounts pending</span>}
            {pendingFollowerReqs.length > 0 && <span>📊 {pendingFollowerReqs.length} follower requests</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              tab === t.id ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Users", value: stats.totalUsers ?? 0, icon: Users, color: "bg-blue-100 text-blue-700" },
              { label: "Total Posts", value: stats.totalPosts ?? 0, icon: BarChart3, color: "bg-green-100 text-green-700" },
              { label: "Pending Reports", value: stats.pendingReports ?? 0, icon: AlertTriangle, color: "bg-orange-100 text-orange-700" },
              { label: "Pending Accounts", value: stats.pendingAccounts ?? 0, icon: Shield, color: "bg-purple-100 text-purple-700" },
              { label: "Follower Requests", value: stats.pendingFollowerRequests ?? 0, icon: TrendingUp, color: "bg-cyan-100 text-cyan-700" },
              { label: "Banned Users", value: stats.bannedUsers ?? 0, icon: Ban, color: "bg-red-100 text-red-700" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Pending account approvals */}
          {pendingApprovals.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3">
              <h3 className="font-bold text-yellow-800 mb-2 text-sm">⏳ Pending Account Approvals</h3>
              <div className="space-y-2">
                {pendingApprovals.map(u => (
                  <div key={u.id} className="flex items-center gap-2 bg-white rounded-xl p-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={u.profilePicture || undefined} />
                      <AvatarFallback className="text-xs font-bold" style={{ background: "#1877f2", color: "white" }}>{u.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <button onClick={() => action(`/admin/users/${u.id}/approve`)}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition">
                      Approve ✓
                    </button>
                    <button onClick={() => action(`/admin/users/${u.id}/ban`, { banned: true })}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition">
                      Reject ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick follower requests preview */}
          {pendingFollowerReqs.length > 0 && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-3">
              <h3 className="font-bold text-cyan-800 mb-2 text-sm">📊 Pending Follower Requests</h3>
              {pendingFollowerReqs.slice(0, 3).map(r => (
                <div key={r.id} className="flex items-center gap-2 bg-white rounded-xl p-2 mb-1.5">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-xs font-bold" style={{ background: "#1877f2", color: "white" }}>{r.user?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate">{r.user?.name}</p>
                    <p className="text-xs text-cyan-600 font-bold">+{r.requestedAmount?.toLocaleString()} followers</p>
                  </div>
                  <button onClick={() => action(`/admin/follower-requests/${r.id}/approve`, { adminNote: "Approved!" })}
                    className="px-2 py-1 bg-green-500 text-white rounded text-xs font-bold">✓</button>
                  <button onClick={() => action(`/admin/follower-requests/${r.id}/reject`, { adminNote: "Rejected." })}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs font-bold">✕</button>
                </div>
              ))}
              <button onClick={() => setTab("follower-requests")}
                className="text-xs text-cyan-600 font-semibold mt-1">View all →</button>
            </div>
          )}
        </div>
      )}

      {/* ── FOLLOWER REQUESTS ── */}
      {tab === "follower-requests" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">📊 Follower Requests</h3>
            <span className="text-xs text-gray-400">{followerRequests.length} total</span>
          </div>

          {followerRequests.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No follower requests yet</p>
            </div>
          )}

          {followerRequests.map(r => {
            const STATUS_STYLE: Record<string, string> = {
              pending: "bg-yellow-100 text-yellow-700",
              approved: "bg-green-100 text-green-700",
              rejected: "bg-red-100 text-red-700",
            };
            return (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={r.user?.profilePicture || undefined} />
                    <AvatarFallback className="font-bold text-sm" style={{ background: "#1877f2", color: "white" }}>{r.user?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-900">{r.user?.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[r.status] || "bg-gray-100 text-gray-600"}`}>
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{r.user?.email}</p>
                    <p className="text-xs text-gray-400">Current: {r.user?.followerCount?.toLocaleString() ?? 0} followers</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-lg text-blue-600">+{r.requestedAmount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">followers</p>
                  </div>
                </div>

                <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>

                {r.adminNote && r.status !== "pending" && (
                  <p className="text-xs bg-gray-50 rounded-lg px-2 py-1.5 text-gray-600">{r.adminNote}</p>
                )}

                {r.status === "pending" && (
                  <div className="space-y-2 pt-1 border-t border-gray-50">
                    <input
                      placeholder="Admin note (optional)"
                      className="w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-400"
                      value={rejectNote}
                      onChange={e => setRejectNote(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { action(`/admin/follower-requests/${r.id}/approve`, { adminNote: rejectNote || "Approved by admin!" }); setRejectNote(""); }}
                        className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition flex items-center justify-center gap-1.5">
                        <CheckCircle className="h-4 w-4" /> Approve
                      </button>
                      <button
                        onClick={() => { action(`/admin/follower-requests/${r.id}/reject`, { adminNote: rejectNote || "Request rejected." }); setRejectNote(""); }}
                        className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition flex items-center justify-center gap-1.5">
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── USERS ── */}
      {tab === "users" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search users..." className="pl-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Bulk actions toolbar */}
          {selectedUsers.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-blue-700">{selectedUsers.size} selected</span>
              <select className="text-xs border rounded-lg px-2 py-1.5 outline-none flex-1" value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
                <option value="">-- Bulk Action --</option>
                <option value="approve">✅ Approve</option>
                <option value="ban">🚫 Ban</option>
                <option value="unban">✅ Unban</option>
              </select>
              <button onClick={executeBulkAction} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition">Apply</button>
              <button onClick={() => setSelectedUsers(new Set())} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition">Clear</button>
            </div>
          )}

          {filteredUsers.map(u => (
            <div key={u.id} className={`bg-white rounded-2xl p-3 shadow-sm border-2 transition ${selectedUsers.has(u.id) ? "border-blue-400 bg-blue-50/30" : "border-transparent"}`}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selectedUsers.has(u.id)} onChange={() => toggleSelectUser(u.id)}
                  className="h-4 w-4 rounded accent-blue-600 shrink-0 cursor-pointer" />
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={u.profilePicture || undefined} />
                  <AvatarFallback className="font-bold text-sm" style={{ background: "#1877f2", color: "white" }}>{u.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm">{u.name}</span>
                    {u.blueBadge && <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] flex items-center justify-center font-bold">✓</span>}
                    {u.isAdmin && <Badge className="text-[9px] py-0 px-1 h-4 bg-yellow-100 text-yellow-700 border-0">ADMIN</Badge>}
                    {u.banned && <Badge className="text-[9px] py-0 px-1 h-4 bg-red-100 text-red-600 border-0">BANNED</Badge>}
                    {u.restricted && <Badge className="text-[9px] py-0 px-1 h-4 bg-orange-100 text-orange-600 border-0">RESTRICTED</Badge>}
                    {u.accountApproved === false && <Badge className="text-[9px] py-0 px-1 h-4 bg-purple-100 text-purple-600 border-0">PENDING</Badge>}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{(u.followerCount ?? 0).toLocaleString()} followers</span>
                    <span className="text-xs text-gray-400">· {u.followingCount ?? 0} following</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded-full text-gray-600">{u.rank ?? "Newbie"}</span>
                  </div>
                </div>
              </div>

              {/* Edit stats inline */}
              {statsInput?.id === u.id && statsInput ? (
                <div className="mt-2 flex gap-2">
                  <input placeholder="Followers" value={statsInput.followers} onChange={e => setStatsInput(s => s ? {...s, followers: e.target.value} : s)}
                    className="flex-1 border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400" />
                  <input placeholder="Following" value={statsInput.following} onChange={e => setStatsInput(s => s ? {...s, following: e.target.value} : s)}
                    className="flex-1 border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-400" />
                  <button onClick={() => { if (statsInput) updateStats(u.id, statsInput.followers, statsInput.following); }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">Save</button>
                  <button onClick={() => setStatsInput(null)} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs">Cancel</button>
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-gray-50">
                {u.accountApproved === false && (
                  <button onClick={() => action(`/admin/users/${u.id}/approve`)}
                    className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />Approve
                  </button>
                )}
                <button onClick={() => action(`/admin/users/${u.id}/ban`, { banned: !u.banned })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${u.banned ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-600 hover:bg-red-200"}`}>
                  {u.banned ? <><CheckCircle className="h-3 w-3" />Unban</> : <><Ban className="h-3 w-3" />Ban</>}
                </button>
                <button onClick={() => action(`/admin/users/${u.id}/restrict`, { restricted: !u.restricted })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${u.restricted ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-600"}`}>
                  <AlertTriangle className="h-3 w-3" />{u.restricted ? "Unrestrict" : "Restrict"}
                </button>
                <button onClick={() => action(`/admin/users/${u.id}/badge`, { blueBadge: !u.blueBadge })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${u.blueBadge ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700"}`}>
                  <BadgeCheck className="h-3 w-3" />{u.blueBadge ? "Remove Badge" : "Give Badge ✓"}
                </button>
                <button onClick={() => action(`/admin/users/${u.id}/make-admin`, { isAdmin: !u.isAdmin })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${u.isAdmin ? "bg-yellow-200 text-yellow-800" : "bg-yellow-100 text-yellow-700"}`}>
                  <Crown className="h-3 w-3" />{u.isAdmin ? "Remove Admin" : "Make Admin"}
                </button>
                <button onClick={() => setStatsInput({ id: u.id, followers: String(u.followerCount ?? 0), following: String(u.followingCount ?? 0) })}
                  className="px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-200 transition flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />Edit Stats
                </button>
                <select className="px-2 py-1 text-xs rounded-lg border border-gray-200 bg-white"
                  value={u.rank ?? "Newbie"}
                  onChange={e => action(`/admin/users/${u.id}/rank`, { rank: e.target.value })}>
                  {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {u.id !== user?.id && (
                  <button onClick={() => { if (confirm(`Delete ${u.name}?`)) action(`/admin/users/${u.id}`, undefined); }}
                    className="px-2.5 py-1 bg-red-50 text-red-400 hover:bg-red-100 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                    <UserX className="h-3 w-3" />Delete
                  </button>
                )}
                <button
                  onClick={() => { setEditNoteFor(editNoteFor === u.id ? null : u.id); setNoteInput(userNotes[u.id] || ""); }}
                  className="px-2.5 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />Note
                </button>
              </div>

              {/* User Notes */}
              {userNotes[u.id] && editNoteFor !== u.id && (
                <div className="mt-2 bg-yellow-50 rounded-xl px-3 py-2 text-xs text-yellow-800 border border-yellow-200">
                  📝 {userNotes[u.id]}
                </div>
              )}
              {editNoteFor === u.id && (
                <div className="mt-2 flex gap-2">
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-400"
                    placeholder="Private admin note about this user..."
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveNote(u.id)}
                  />
                  <button onClick={() => saveNote(u.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">Save</button>
                  <button onClick={() => setEditNoteFor(null)} className="px-2 py-1.5 bg-gray-100 rounded-lg text-xs">✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── REPORTS ── */}
      {tab === "reports" && (
        <div className="space-y-3">
          {reports.length === 0 && <div className="text-center py-8 text-gray-400">No reports yet ✅</div>}
          {reports.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === "pending" ? "bg-orange-100 text-orange-700" :
                      r.status === "resolved" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {r.status?.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">{r.reason?.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Reporter: {r.reporter?.name}</p>
                  {r.reportedPostId && <p className="text-xs text-gray-400">Post ID: #{r.reportedPostId}</p>}
                  <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                  <button onClick={() => api(`/admin/reports/${r.id}`, { method: "PATCH", body: JSON.stringify({ status: "resolved" }) }).then(() => load())}
                    className="flex-1 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition">
                    ✅ Resolve
                  </button>
                  <button onClick={() => api(`/admin/reports/${r.id}`, { method: "PATCH", body: JSON.stringify({ status: "dismissed" }) }).then(() => load())}
                    className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">
                    Dismiss
                  </button>
                  {r.reportedPostId && (
                    <button onClick={() => action(`/admin/posts/${r.reportedPostId}`)}
                      className="flex-1 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition flex items-center justify-center gap-1">
                      <Trash2 className="h-3 w-3" />Delete Post
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── POSTS ── */}
      {tab === "posts" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">{posts.length} posts — most recent first</p>
          {posts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={p.author?.profilePicture || undefined} />
                  <AvatarFallback className="text-xs font-bold" style={{ background: "#1877f2", color: "white" }}>{p.author?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{p.author?.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{p.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {p.imageUrl && <span className="text-xs text-blue-500">📷 Image</span>}
                    {p.videoUrl && <span className="text-xs text-blue-500">🎥 Video</span>}
                    <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button onClick={() => { if (confirm("Delete this post?")) action(`/admin/posts/${p.id}`); }}
                  className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab === "settings" && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1">Account Approval</h3>
            <p className="text-xs text-gray-500 mb-3">When ON — new registrations wait for admin approval before logging in.</p>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{settings.approval_required === "true" ? "🔒 Approval Required (ON)" : "🟢 Auto-Approve (OFF)"}</span>
              <button onClick={() => setSetting("approval_required", settings.approval_required === "true" ? "false" : "true")}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.approval_required === "true" ? "bg-blue-600" : "bg-gray-300"}`}>
                <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${settings.approval_required === "true" ? "left-7" : "left-1"}`} />
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1">Maintenance Mode</h3>
            <p className="text-xs text-gray-500 mb-3">Show a maintenance notice to all users</p>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{settings.maintenance === "true" ? "🔧 Maintenance ON" : "✅ Site Live"}</span>
              <button onClick={() => setSetting("maintenance", settings.maintenance === "true" ? "false" : "true")}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.maintenance === "true" ? "bg-orange-500" : "bg-gray-300"}`}>
                <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${settings.maintenance === "true" ? "left-7" : "left-1"}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEEN SAFETY ── */}
      {tab === "teen-safety" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-pink-400 to-purple-500 rounded-2xl p-4 text-white">
            <h3 className="font-black text-lg">🛡️ Teen Safety Dashboard</h3>
            <p className="text-white/80 text-sm mt-0.5">Manage safety features for underage users</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total Teens", value: users.filter(u => u.ageGroup === "teen").length || 0, icon: "👶", color: "bg-pink-50 text-pink-700" },
              { label: "With Safety ON", value: 0, icon: "🛡️", color: "bg-green-50 text-green-700" },
              { label: "Restricted Accounts", value: users.filter(u => u.restricted).length, icon: "⚠️", color: "bg-orange-50 text-orange-700" },
            ].map(s => (
              <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center`}>
                <p className="text-2xl mb-0.5">{s.icon}</p>
                <p className="text-xl font-black">{s.value}</p>
                <p className="text-[10px] font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Global Safety Controls */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="font-bold text-gray-900">⚙️ Global Safety Settings</h4>
            {[
              { key: "teen_content_filter", label: "Force Content Filter for Teens", desc: "Apply strict content filtering for all accounts under 18" },
              { key: "teen_chat_restriction", label: "Restrict Teen Chat", desc: "Teens can only message friends, not strangers" },
              { key: "teen_post_approval", label: "Teen Post Review", desc: "Posts from teen accounts require admin review before publishing" },
            ].map(s => (
              <div key={s.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="font-semibold text-sm text-gray-800">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.desc}</p>
                </div>
                <button
                  onClick={() => setSetting(s.key, settings[s.key] === "true" ? "false" : "true")}
                  className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${settings[s.key] === "true" ? "bg-pink-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${settings[s.key] === "true" ? "left-7" : "left-1"}`} />
                </button>
              </div>
            ))}
          </div>

          {/* Users marked as restricted (proxy for teen accounts) */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-3">👥 Restricted Users</h4>
            {users.filter(u => u.restricted).length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">No restricted users ✅</p>
            ) : (
              <div className="space-y-2">
                {users.filter(u => u.restricted).map(u => (
                  <div key={u.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={u.profilePicture || undefined} />
                      <AvatarFallback className="text-xs font-bold" style={{ background: "#1877f2", color: "white" }}>{u.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <button onClick={() => action(`/admin/users/${u.id}/restrict`, { restricted: false })}
                      className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold transition hover:bg-green-200">
                      Unrestrict
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety Guidelines */}
          <div className="bg-blue-50 rounded-2xl p-4">
            <h4 className="font-bold text-blue-900 mb-2">📋 Blue Media Safety Guidelines</h4>
            <div className="space-y-1.5 text-xs text-blue-700">
              <p>• Zero tolerance sa bullying, harassment, at hate speech</p>
              <p>• Teens (13-17) ay may limitadong access sa certain features</p>
              <p>• Mga report ng inappropriate content ay pinoproseso sa loob ng 24hrs</p>
              <p>• Parents at guardians ay maaaring mag-request ng account restrictions</p>
              <p>• Ang Blue Media ay sumusuporta sa DSWD guidelines para sa kabataan</p>
            </div>
          </div>
        </div>
      )}

      {/* ── BROADCAST ── */}
      {tab === "broadcast" && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-900">📣 Broadcast to All Users</h3>
          <p className="text-xs text-gray-500">Sends a notification to every user on Blue Media.</p>
          <textarea
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-blue-400 transition"
            rows={4} placeholder="Type your announcement here..."
            value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} />
          <button disabled={!broadcastMsg.trim()}
            onClick={async () => {
              await api("/admin/broadcast", { method: "POST", body: JSON.stringify({ message: broadcastMsg }) });
              setBroadcastMsg("");
              toast({ title: "📣 Broadcast sent to all users!" });
            }}
            className="w-full py-2.5 rounded-xl text-white font-bold disabled:opacity-50 transition"
            style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
            📣 Send Broadcast
          </button>
        </div>
      )}
    </div>
  );
}
