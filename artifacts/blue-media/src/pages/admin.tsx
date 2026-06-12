import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, AlertTriangle, CheckCircle, XCircle, Trash2, Ban, Bell, Settings, BarChart3, Search, BadgeCheck, Crown, UserX } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const token = () => localStorage.getItem("bluemedia_token") ?? "";
const api = (path: string, opts?: RequestInit) =>
  fetch(`/api${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}`, ...(opts?.headers || {}) } });

const RANKS = ["Newbie", "Member", "Active", "Popular", "Influencer", "VIP", "Legend", "GOAT"];

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"overview" | "users" | "reports" | "posts" | "settings" | "broadcast">("overview");
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [settings, setSettingsData] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [u, r, s, st, p] = await Promise.all([
        api("/admin/users").then(r => r.json()),
        api("/admin/reports").then(r => r.json()),
        api("/admin/stats").then(r => r.json()),
        api("/admin/settings").then(r => r.json()),
        api("/admin/posts").then(r => r.json()),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setReports(Array.isArray(r) ? r : []);
      setStats(s);
      setSettingsData(st || {});
      setPosts(Array.isArray(p) ? p : []);
    } catch { toast({ title: "Failed to load admin data", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const action = async (path: string, body?: any) => {
    try {
      const res = await api(path, { method: body !== undefined ? "POST" : "DELETE", body: body !== undefined ? JSON.stringify(body) : undefined });
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

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingApprovals = users.filter(u => u.accountApproved === false);

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: `Users (${users.length})`, icon: Users },
    { id: "reports", label: `Reports (${reports.filter(r => r.status === "pending").length})`, icon: AlertTriangle },
    { id: "posts", label: "Posts", icon: Shield },
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
            <h1 className="font-black text-xl">Admin Panel</h1>
            <p className="text-white/80 text-sm">Blue Media Control Center</p>
          </div>
        </div>
        {pendingApprovals.length > 0 && (
          <div className="mt-3 bg-white/20 rounded-xl p-2 flex items-center gap-2">
            <span className="text-sm font-bold">{pendingApprovals.length} account(s) waiting for approval</span>
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
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Users", value: stats.totalUsers ?? 0, icon: Users, color: "bg-blue-100 text-blue-700" },
            { label: "Total Posts", value: stats.totalPosts ?? 0, icon: BarChart3, color: "bg-green-100 text-green-700" },
            { label: "Pending Reports", value: stats.pendingReports ?? 0, icon: AlertTriangle, color: "bg-orange-100 text-orange-700" },
            { label: "Pending Accounts", value: stats.pendingAccounts ?? 0, icon: Shield, color: "bg-purple-100 text-purple-700" },
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

          {/* Pending approvals */}
          {pendingApprovals.length > 0 && (
            <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded-2xl p-3">
              <h3 className="font-bold text-yellow-800 mb-2 text-sm">⏳ Pending Account Approvals</h3>
              <div className="space-y-2">
                {pendingApprovals.map(u => (
                  <div key={u.id} className="flex items-center gap-2 bg-white rounded-xl p-2">
                    <Avatar className="h-8 w-8">
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
                      Reject
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── USERS ── */}
      {tab === "users" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search users by name or email..." className="pl-9 rounded-xl" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          {filteredUsers.map(u => (
            <div key={u.id} className="bg-white rounded-2xl p-3 shadow-sm">
              <div className="flex items-center gap-3">
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
                    <span className="text-xs text-gray-500">{u.followerCount ?? 0} followers</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded-full text-gray-600">{u.rank ?? "Newbie"}</span>
                  </div>
                </div>
              </div>
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
                  <BadgeCheck className="h-3 w-3" />{u.blueBadge ? "Remove Badge" : "Give Badge"}
                </button>
                <button onClick={() => action(`/admin/users/${u.id}/make-admin`, { isAdmin: !u.isAdmin })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${u.isAdmin ? "bg-yellow-200 text-yellow-800" : "bg-yellow-100 text-yellow-700"}`}>
                  <Crown className="h-3 w-3" />{u.isAdmin ? "Remove Admin" : "Make Admin"}
                </button>
                <select className="px-2 py-1 text-xs rounded-lg border border-gray-200 bg-white"
                  value={u.rank ?? "Newbie"}
                  onChange={e => action(`/admin/users/${u.id}/rank`, { rank: e.target.value })}>
                  {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {u.id !== user?.id && (
                  <button onClick={() => { if (confirm(`Delete ${u.name}? This cannot be undone!`)) action(`/admin/users/${u.id}`, undefined); }}
                    className="px-2.5 py-1 bg-red-50 text-red-400 hover:bg-red-100 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                    <UserX className="h-3 w-3" />Delete
                  </button>
                )}
              </div>
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
                      r.status === "resolved" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-600"}`}>
                      {r.status?.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">{r.reason?.replace("_", " ")}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Reporter: {r.reporter?.name}</p>
                  {r.reportedPostId && <p className="text-xs text-gray-400">Post ID: #{r.reportedPostId}</p>}
                  {r.reportedUserId && <p className="text-xs text-gray-400">User ID: #{r.reportedUserId}</p>}
                  <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                  <button onClick={() => action(`/admin/reports/${r.id}`, undefined).then(() => api(`/admin/reports/${r.id}`, { method: "PATCH", body: JSON.stringify({ status: "resolved" }) }))}
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
          <p className="text-xs text-gray-500">All posts — most recent first</p>
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
                  {p.imageUrl && <div className="text-xs text-blue-500 mt-0.5">📷 Has image</div>}
                  {p.videoUrl && <div className="text-xs text-blue-500 mt-0.5">🎥 Has video</div>}
                  <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
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
            <p className="text-xs text-gray-500 mb-3">When ON — new registrations must wait for admin approval before logging in.</p>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{settings.approval_required === "true" ? "🔒 Approval Required (ON)" : "🟢 Auto-Approve (OFF)"}</span>
              <button
                onClick={() => setSetting("approval_required", settings.approval_required === "true" ? "false" : "true")}
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
              <button
                onClick={() => setSetting("maintenance", settings.maintenance === "true" ? "false" : "true")}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.maintenance === "true" ? "bg-orange-500" : "bg-gray-300"}`}>
                <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${settings.maintenance === "true" ? "left-7" : "left-1"}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BROADCAST ── */}
      {tab === "broadcast" && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-900">📣 Send to All Users</h3>
          <p className="text-xs text-gray-500">This will send a notification to every user on Blue Media.</p>
          <textarea
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-blue-400 transition"
            rows={4}
            placeholder="Type your announcement here..."
            value={broadcastMsg}
            onChange={e => setBroadcastMsg(e.target.value)}
          />
          <button
            disabled={!broadcastMsg.trim()}
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
