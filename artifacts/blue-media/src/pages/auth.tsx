import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { X, UserCircle2, Plus, ChevronRight } from "lucide-react";

interface SavedAccount {
  email: string;
  name: string;
  avatar?: string;
  token?: string;
  lastLogin: number;
}

const SAVED_KEY = "bluemedia_saved_accounts_v2";

function getSaved(): SavedAccount[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
}
function saveAccount(acct: SavedAccount) {
  const list = getSaved().filter(a => a.email !== acct.email);
  list.unshift(acct);
  localStorage.setItem(SAVED_KEY, JSON.stringify(list.slice(0, 5)));
}
function removeAccount(email: string) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(getSaved().filter(a => a.email !== email)));
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "accounts">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const isPending = loginMutation.isPending || registerMutation.isPending;

  useEffect(() => {
    const saved = getSaved();
    setSavedAccounts(saved);
    if (saved.length > 0) setMode("accounts");
  }, []);

  const handlePinChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const arr = pin.split("").concat(Array(4).fill("")).slice(0, 4);
    arr[idx] = val;
    setPin(arr.join(""));
    if (val && idx < 3) pinRefs[idx + 1].current?.focus();
    if (!val && idx > 0) pinRefs[idx - 1].current?.focus();
  };

  const handlePinKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) pinRefs[idx - 1].current?.focus();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.replace(/\s/g, "");
    if (cleanPin.length !== 4) {
      toast({ title: "Error", description: "Please enter your 4-digit PIN", variant: "destructive" }); return;
    }
    try {
      const res = await loginMutation.mutateAsync({ data: { email, pin: cleanPin } });
      saveAccount({ email, name: res.user.name, avatar: res.user.profilePicture || undefined, token: res.token, lastLogin: Date.now() });
      setSavedAccounts(getSaved());
      login(res.token, res.user.id);
      setLocation("/feed");
    } catch (err: any) {
      toast({ title: "Login failed", description: err?.data?.error || "Invalid email or PIN", variant: "destructive" });
    }
  };

  const handleQuickLogin = async (acct: SavedAccount) => {
    setEmail(acct.email);
    setPin("");
    setMode("login");
    setTimeout(() => pinRefs[0].current?.focus(), 100);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.replace(/\s/g, "");
    if (!name.trim()) { toast({ title: "Error", description: "Please enter your full name", variant: "destructive" }); return; }
    if (cleanPin.length !== 4) { toast({ title: "Error", description: "Please enter a 4-digit PIN", variant: "destructive" }); return; }
    try {
      const res = await registerMutation.mutateAsync({ data: { email, name: name.trim(), pin: cleanPin } });
      saveAccount({ email, name: res.user.name, avatar: res.user.profilePicture || undefined, token: res.token, lastLogin: Date.now() });
      setSavedAccounts(getSaved());
      login(res.token, res.user.id);
      setLocation("/feed");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err?.data?.error || "Please try again", variant: "destructive" });
    }
  };

  const switchMode = (newMode: "login" | "register" | "accounts") => {
    setMode(newMode);
    setPin("");
    if (newMode !== "accounts") { setEmail(""); setName(""); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "linear-gradient(160deg, #e8f0fe 0%, #dce8ff 50%, #e3f0ff 100%)" }}>

      {/* Logo */}
      <div className="text-center mb-6 select-none">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 shadow-lg"
          style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
          <span className="text-white text-2xl font-black">B</span>
        </div>
        <h1 className="text-4xl font-black tracking-widest uppercase"
          style={{ color: "#0a6bc7", letterSpacing: "0.12em" }}>
          BLUE<span style={{ color: "#1da1f2" }}>MEDIA</span>
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Para sa Pilipinas 🇵🇭</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* ─── SAVED ACCOUNTS ─── */}
        {mode === "accounts" && (
          <div className="p-5 space-y-3">
            <h2 className="text-lg font-black text-gray-800 text-center mb-1">Mga Account</h2>
            <p className="text-xs text-gray-400 text-center mb-3">Piliin ang account mo para mag-login</p>

            {savedAccounts.map(acct => (
              <div key={acct.email} className="flex items-center gap-3 p-3 rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition group cursor-pointer"
                onClick={() => handleQuickLogin(acct)}>
                <div className="h-11 w-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
                  {acct.avatar
                    ? <img src={acct.avatar} className="w-full h-full object-cover" />
                    : <span className="text-white font-black text-lg">{acct.name?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{acct.name}</p>
                  <p className="text-xs text-gray-400 truncate">{acct.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); removeAccount(acct.email); setSavedAccounts(getSaved()); }}
                    className="p-1.5 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition opacity-0 group-hover:opacity-100">
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-blue-400" />
                </div>
              </div>
            ))}

            <div className="pt-1 space-y-2">
              <button onClick={() => switchMode("login")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition text-sm font-semibold">
                <Plus className="h-4 w-4" /> Gumamit ng ibang account
              </button>
              <button onClick={() => switchMode("register")}
                className="w-full py-3 rounded-2xl text-white text-sm font-bold transition active:scale-95"
                style={{ background: "linear-gradient(135deg, #42b72a, #2d8c1e)" }}>
                Gumawa ng bagong account
              </button>
            </div>
          </div>
        )}

        {/* ─── LOGIN ─── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="p-5 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              {savedAccounts.length > 0 && (
                <button type="button" onClick={() => switchMode("accounts")}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                  <UserCircle2 className="h-5 w-5" />
                </button>
              )}
              <h2 className="text-lg font-black text-gray-800">Mag-login</h2>
            </div>

            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 text-sm outline-none focus:border-blue-400 transition bg-gray-50 placeholder-gray-400" />

            <div className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 flex items-center gap-2 focus-within:border-blue-400 transition">
              <span className="text-gray-400 text-xs mr-1 shrink-0 font-medium">4-digit PIN</span>
              <div className="flex gap-2 flex-1 justify-end">
                {[0,1,2,3].map(i => (
                  <input key={i} ref={pinRefs[i]} type="password" inputMode="numeric" maxLength={1}
                    value={pin[i] || ""} onChange={e => handlePinChange(i, e.target.value)} onKeyDown={e => handlePinKeyDown(i, e)}
                    className="w-10 h-10 text-center text-lg font-bold border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-blue-500 transition" />
                ))}
              </div>
            </div>

            <button type="submit" disabled={isPending}
              className="w-full py-3.5 rounded-2xl text-white text-base font-bold transition active:scale-95 disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #1877f2, #0a6bc7)", boxShadow: "0 4px 20px rgba(24,119,242,0.4)" }}>
              {isPending ? "Naglo-login..." : "Log In"}
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-gray-400 text-xs">o</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <button type="button" onClick={() => switchMode("register")}
              className="w-full py-3.5 rounded-2xl text-white text-sm font-bold transition active:scale-95"
              style={{ background: "linear-gradient(135deg, #42b72a, #2d8c1e)", boxShadow: "0 4px 14px rgba(66,183,42,0.35)" }}>
              Gumawa ng Bagong Account
            </button>
          </form>
        )}

        {/* ─── REGISTER ─── */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="p-5 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => switchMode("login")}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition">
                <X className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-lg font-black text-gray-800">Gumawa ng account</h2>
                <p className="text-xs text-gray-400">Mabilis at madali.</p>
              </div>
            </div>

            <input type="text" placeholder="Buong pangalan" value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 text-sm outline-none focus:border-blue-400 transition bg-gray-50 placeholder-gray-400" />
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 text-sm outline-none focus:border-blue-400 transition bg-gray-50 placeholder-gray-400" />

            <div className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 flex items-center gap-2 focus-within:border-blue-400 transition">
              <span className="text-gray-400 text-xs mr-1 shrink-0 font-medium">Piliin ang PIN</span>
              <div className="flex gap-2 flex-1 justify-end">
                {[0,1,2,3].map(i => (
                  <input key={i} ref={pinRefs[i]} type="password" inputMode="numeric" maxLength={1}
                    value={pin[i] || ""} onChange={e => handlePinChange(i, e.target.value)} onKeyDown={e => handlePinKeyDown(i, e)}
                    className="w-10 h-10 text-center text-lg font-bold border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-blue-500 transition" />
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center px-2">
              Sa pag-sign up, sumasang-ayon ka sa aming mga patakaran.
            </p>

            <button type="submit" disabled={isPending}
              className="w-full py-3.5 rounded-2xl text-white text-base font-bold transition active:scale-95 disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #42b72a, #2d8c1e)", boxShadow: "0 4px 14px rgba(66,183,42,0.35)" }}>
              {isPending ? "Ginagawa..." : "Sign Up"}
            </button>
          </form>
        )}
      </div>

      <p className="text-gray-400 text-xs mt-5 text-center">Blue Media © 2026 · Made with ❤️ for Pilipinas</p>
    </div>
  );
}
