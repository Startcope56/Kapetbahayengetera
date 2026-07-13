import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { X, UserCircle2, Plus, ChevronRight, ArrowLeft, CheckCircle, Calendar, User, Mail, Lock } from "lucide-react";

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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Magandang umaga";
  if (h >= 12 && h < 18) return "Magandang hapon";
  if (h >= 18 && h < 21) return "Magandang gabi";
  return "Magandang gabi";
}

type Mode = "accounts" | "login" | "register-step1" | "register-step2" | "welcome";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [pin, setPin] = useState("");
  const [welcomeName, setWelcomeName] = useState("");
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
    if (cleanPin.length !== 4) { toast({ title: "Error", description: "4-digit PIN ang kailangan", variant: "destructive" }); return; }
    try {
      const res = await loginMutation.mutateAsync({ data: { email, pin: cleanPin } });
      saveAccount({ email, name: res.user.name, avatar: res.user.profilePicture || undefined, token: res.token, lastLogin: Date.now() });
      setSavedAccounts(getSaved());
      login(res.token, res.user.id);
      setLocation("/feed");
    } catch (err: any) {
      toast({ title: "Login failed", description: err?.data?.error || "Mali ang email o PIN", variant: "destructive" });
    }
  };

  const handleQuickLogin = async (acct: SavedAccount) => {
    setEmail(acct.email);
    setPin("");
    setMode("login");
    setTimeout(() => pinRefs[0].current?.focus(), 100);
  };

  const validateStep1 = () => {
    if (!name.trim()) { toast({ title: "Ilagay ang iyong pangalan", variant: "destructive" }); return false; }
    if (!birthday) { toast({ title: "Ilagay ang iyong birthday", variant: "destructive" }); return false; }
    const bday = new Date(birthday);
    const age = (Date.now() - bday.getTime()) / (365.25 * 24 * 3600 * 1000);
    if (age < 13) { toast({ title: "Kailangan ay 13 pataas ang edad", description: "Alinsunod sa Blue Media Community Guidelines", variant: "destructive" }); return false; }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.replace(/\s/g, "");
    if (!email.trim()) { toast({ title: "Ilagay ang email address", variant: "destructive" }); return; }
    if (cleanPin.length !== 4) { toast({ title: "4-digit PIN ang kailangan", variant: "destructive" }); return; }
    try {
      const res = await registerMutation.mutateAsync({ data: { email, name: name.trim(), pin: cleanPin } });
      saveAccount({ email, name: res.user.name, avatar: res.user.profilePicture || undefined, token: res.token, lastLogin: Date.now() });
      setSavedAccounts(getSaved());
      setWelcomeName(res.user.name);
      setMode("welcome");
      setTimeout(() => {
        login(res.token, res.user.id);
        setLocation("/feed");
      }, 3500);
    } catch (err: any) {
      toast({ title: "Registration failed", description: err?.data?.error || "Subukan ulit", variant: "destructive" });
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setPin("");
    if (newMode !== "accounts") { if (newMode === "login") { setEmail(""); setName(""); } }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "linear-gradient(160deg, #e8f0fe 0%, #dce8ff 50%, #e3f0ff 100%)" }}>

      {/* Welcome screen */}
      {mode === "welcome" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
          <div className="text-center text-white px-8">
            <div className="text-7xl mb-5 animate-bounce">🎉</div>
            <h1 className="text-3xl font-black mb-2">Maligayang Pagdating!</h1>
            <p className="text-white/80 text-base mb-1">sa Blue Media</p>
            <p className="text-2xl font-bold mt-3">{welcomeName?.split(" ")[0]}! 🇵🇭</p>
            <p className="text-white/70 text-sm mt-4 leading-relaxed">
              Handa ka na! I-explore ang Blue Media —<br />ang social media para sa mga Pilipino.
            </p>
            <div className="mt-8 flex justify-center gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="h-2 w-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <p className="text-white/50 text-xs mt-4">Naglo-load ang iyong feed...</p>
          </div>
        </div>
      )}

      {/* Logo */}
      {mode !== "welcome" && (
        <>
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
                        : <span className="text-white font-black text-lg">{acct.name?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{acct.name}</p>
                      <p className="text-xs text-gray-400 truncate">{acct.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); removeAccount(acct.email); setSavedAccounts(getSaved()); }}
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
                  <button onClick={() => switchMode("register-step1")}
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
                <button type="button" onClick={() => switchMode("register-step1")}
                  className="w-full py-3.5 rounded-2xl text-white text-sm font-bold transition active:scale-95"
                  style={{ background: "linear-gradient(135deg, #42b72a, #2d8c1e)", boxShadow: "0 4px 14px rgba(66,183,42,0.35)" }}>
                  Gumawa ng Bagong Account
                </button>
              </form>
            )}

            {/* ─── REGISTER STEP 1: Name + Birthday ─── */}
            {mode === "register-step1" && (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <button type="button" onClick={() => switchMode("login")}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-black text-gray-800">Gumawa ng Account</h2>
                    <p className="text-xs text-gray-400">Hakbang 1 sa 2</p>
                  </div>
                </div>

                {/* Step indicator */}
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 h-1.5 rounded-full bg-blue-500" />
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200" />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> Buong Pangalan
                    </label>
                    <input type="text" placeholder="Hal. Juan dela Cruz" value={name} onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 text-sm outline-none focus:border-blue-400 transition bg-gray-50 placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Araw ng Kapanganakan
                    </label>
                    <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} max={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 text-sm outline-none focus:border-blue-400 transition bg-gray-50 text-gray-700" />
                    <p className="text-[10px] text-gray-400 mt-1 px-1">Kailangan ay 13 taong gulang pataas</p>
                  </div>
                </div>

                <button
                  onClick={() => { if (validateStep1()) setMode("register-step2"); }}
                  className="w-full py-3.5 rounded-2xl text-white text-base font-bold transition active:scale-95 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #1877f2, #0a6bc7)", boxShadow: "0 4px 20px rgba(24,119,242,0.4)" }}>
                  Susunod <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ─── REGISTER STEP 2: Email + PIN ─── */}
            {mode === "register-step2" && (
              <form onSubmit={handleRegister} className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <button type="button" onClick={() => setMode("register-step1")}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-black text-gray-800">Halos tapos na!</h2>
                    <p className="text-xs text-gray-400">Hakbang 2 sa 2 · Kumusta, {name.split(" ")[0]}! 👋</p>
                  </div>
                </div>

                {/* Step indicator */}
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 h-1.5 rounded-full bg-blue-500" />
                  <div className="flex-1 h-1.5 rounded-full bg-blue-500" />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> Email Address
                    </label>
                    <input type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 text-sm outline-none focus:border-blue-400 transition bg-gray-50 placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5" /> Piliin ang 4-digit PIN
                    </label>
                    <div className="flex gap-3 justify-center py-2">
                      {[0,1,2,3].map(i => (
                        <input key={i} ref={pinRefs[i]} type="password" inputMode="numeric" maxLength={1}
                          value={pin[i] || ""} onChange={e => handlePinChange(i, e.target.value)} onKeyDown={e => handlePinKeyDown(i, e)}
                          className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-2xl bg-white outline-none focus:border-blue-500 transition shadow-sm" />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">Ito ang iyong password sa Blue Media</p>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center px-2">
                  Sa pag-sign up, sumasang-ayon ka sa aming mga patakaran at community guidelines.
                </p>
                <button type="submit" disabled={isPending}
                  className="w-full py-3.5 rounded-2xl text-white text-base font-bold transition active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #42b72a, #2d8c1e)", boxShadow: "0 4px 14px rgba(66,183,42,0.35)" }}>
                  {isPending ? "Ginagawa ang account..." : <><CheckCircle className="h-4 w-4" /> Sumali na sa Blue Media!</>}
                </button>
              </form>
            )}
          </div>

          <p className="text-gray-400 text-xs mt-5 text-center">Blue Media © 2026 · By JV Channel · Made with ❤️ for Pilipinas</p>
        </>
      )}
    </div>
  );
}

export { getGreeting };
