import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Users, Send, Clock, CheckCircle, XCircle, Info } from "lucide-react";

export default function RequestFollowersPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  const loadRequests = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/follower-requests/mine", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMyRequests(await res.json());
    } catch {}
  };

  useEffect(() => { loadRequests(); }, [token]);

  const submit = async () => {
    const n = parseInt(amount);
    if (!n || n < 1) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    if (n > 1000000) { toast({ title: "Max is 1,000,000 followers", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/follower-requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount: n }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Request submitted! 🎉", description: "The admin will review your request shortly." });
      setAmount("");
      loadRequests();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const pending = myRequests.find(r => r.status === "pending");

  const STATUS_ICONS: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4 text-yellow-500" />,
    approved: <CheckCircle className="h-4 w-4 text-green-500" />,
    rejected: <XCircle className="h-4 w-4 text-red-500" />,
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl">Request Followers</h1>
            <p className="text-blue-100 text-sm">Ask admin to boost your follower count</p>
          </div>
        </div>
      </div>

      {/* Current followers */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Your current followers</p>
            <p className="font-black text-3xl text-gray-900">
              {((user as any)?.followerCount ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Users className="h-7 w-7 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p className="font-semibold">How it works:</p>
          <p>1. Enter how many followers you want</p>
          <p>2. Submit your request</p>
          <p>3. Admin reviews and approves</p>
          <p>4. Followers are added to your account! 🎉</p>
          <p className="text-xs text-blue-600 mt-1">One active request at a time. Wait for approval before submitting another.</p>
        </div>
      </div>

      {/* Request form */}
      {!pending ? (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h2 className="font-bold text-gray-900">New Request</h2>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Number of followers to request</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="1000000"
                placeholder="e.g. 1000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="flex-1 border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
              <button
                onClick={submit}
                disabled={loading || !amount}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition"
                style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}
              >
                {loading ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Send className="h-4 w-4" />}
                Submit
              </button>
            </div>
          </div>

          {/* Quick amount buttons */}
          <div className="flex flex-wrap gap-2">
            {[100, 500, 1000, 5000, 10000, 50000].map(n => (
              <button key={n} onClick={() => setAmount(String(n))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition ${
                  amount === String(n) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-blue-300"
                }`}>
                +{n.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500 shrink-0" />
            <div>
              <p className="font-bold text-yellow-800">Request Pending</p>
              <p className="text-sm text-yellow-700">
                You have a pending request for <strong>+{pending.requestedAmount.toLocaleString()} followers</strong>.
                Please wait for admin approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Request history */}
      {myRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="font-bold text-gray-900 text-sm">Request History</h3>
          </div>
          {myRequests.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 border-gray-50">
              <div className={`px-2 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 ${STATUS_COLORS[r.status] || "bg-gray-50 text-gray-600"}`}>
                {STATUS_ICONS[r.status]}
                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">+{r.requestedAmount.toLocaleString()} followers</p>
                {r.adminNote && <p className="text-xs text-gray-500">{r.adminNote}</p>}
              </div>
              <p className="text-xs text-gray-400 shrink-0">
                {new Date(r.createdAt).toLocaleDateString("en-PH")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
