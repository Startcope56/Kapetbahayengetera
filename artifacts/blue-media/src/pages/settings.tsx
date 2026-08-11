import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChangePassword, useUpdateUser, useClaimBlueBadge } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Lock, Eye, Bell, HelpCircle, BadgeCheck, ChevronRight,
  LogOut, Palette, Globe, Shield, UserX, Download, Baby, ShieldAlert, Clock, UserCheck,
  Wifi, Filter, EyeOff, AlignLeft, SortDesc, FileText, AlertTriangle, Share2, Bookmark
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [section, setSection] = useState<string | null>(null);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const changePin = useChangePassword();

  const [privacy, setPrivacy] = useState<"public" | "friends_of_friends" | "private">(
    ((user?.privacy as "public" | "friends_of_friends" | "private") || "public")
  );
  const updateUser = useUpdateUser();
  const claimBadge = useClaimBlueBadge();

  const [notifSettings, setNotifSettings] = useState({
    friend_request: true,
    post_reaction: true,
    post_comment: true,
    message: true,
    follow: true,
  });

  const [language, setLanguage] = useState(localStorage.getItem("bm_language") || "fil");
  const [fontSize, setFontSize] = useState(localStorage.getItem("bm_fontsize") || "normal");

  // New feature states
  const [dataSaver, setDataSaver] = useState(localStorage.getItem("bm_data_saver") === "true");
  const [whisperMode, setWhisperMode] = useState(localStorage.getItem("bm_whisper_mode") === "true");
  const [chronoFeed, setChronoFeed] = useState(localStorage.getItem("bm_chrono_feed") === "true");
  const [wordFilter, setWordFilter] = useState(localStorage.getItem("bm_word_filter") || "");
  const [wordFilterInput, setWordFilterInput] = useState(localStorage.getItem("bm_word_filter") || "");
  const [cwEnabled, setCwEnabled] = useState(localStorage.getItem("bm_cw_enabled") === "true");
  const [disableBoosts, setDisableBoosts] = useState(localStorage.getItem("bm_disable_boosts") === "true");
  const [accentColor, setAccentColor] = useState(localStorage.getItem("bm_accent_color") || "#1877f2");

  const handleChangePin = async () => {
    if (newPin !== confirmPin) { toast({ title: "Hindi magkatugma ang PIN", variant: "destructive" }); return; }
    if (newPin.length !== 4) { toast({ title: "Dapat ay 4 na digit ang PIN", variant: "destructive" }); return; }
    try {
      await changePin.mutateAsync({ data: { currentPin, newPin } });
      toast({ title: "Nabago na ang PIN! 🔐" });
      setCurrentPin(""); setNewPin(""); setConfirmPin(""); setSection(null);
    } catch (err: any) {
      toast({ title: "Hindi nabago ang PIN", description: err.message, variant: "destructive" });
    }
  };

  const handlePrivacySave = async () => {
    if (!user) return;
    try {
      await updateUser.mutateAsync({ id: user.id, data: { privacy } });
      queryClient.invalidateQueries();
      toast({ title: "Na-update na ang privacy settings!" });
      setSection(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleClaimBadge = async () => {
    try {
      const res = await claimBadge.mutateAsync(undefined as any);
      toast({ title: "🎉 " + (res.message || "Blue Badge na-claim!") });
      queryClient.invalidateQueries();
      setSection(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleLogout = () => {
    setSection(null);
    logout();
  };

  const [teenSafety, setTeenSafety] = useState({
    enabled: localStorage.getItem("bm_teen_safety") === "true",
    contentFilter: localStorage.getItem("bm_content_filter") || "moderate",
    screenTime: localStorage.getItem("bm_screen_time") || "no_limit",
    requireParentApproval: localStorage.getItem("bm_parent_approval") === "true",
    chatWithFriendsOnly: localStorage.getItem("bm_chat_friends_only") === "true",
  });
  const [parentPin, setParentPin] = useState("");
  const [parentPinConfirm, setParentPinConfirm] = useState("");
  const [savedParentPin, setSavedParentPin] = useState(localStorage.getItem("bm_parent_pin") || "");
  const [parentPinInput, setParentPinInput] = useState("");
  const [parentUnlocked, setParentUnlocked] = useState(false);

  const saveTeenSafety = (updates: Partial<typeof teenSafety>) => {
    const updated = { ...teenSafety, ...updates };
    setTeenSafety(updated);
    Object.entries(updates).forEach(([k, v]) => localStorage.setItem(`bm_${k === "enabled" ? "teen_safety" : k.replace(/([A-Z])/g, "_$1").toLowerCase()}`, String(v)));
    toast({ title: "✅ Teen Safety settings saved!" });
  };

  const handleSettingsClick = (id: string) => {
    if (id === "saved-posts-link") {
      window.location.href = "/saved";
      return;
    }
    setSection(id);
  };

  const menuSections = [
    {
      title: "Account",
      items: [
        { id: "pin", icon: Lock, color: "text-blue-500", bg: "bg-blue-50", title: "Palitan ang PIN", subtitle: "I-update ang iyong 4-digit na PIN" },
        { id: "privacy", icon: Eye, color: "text-green-500", bg: "bg-green-50", title: "Privacy", subtitle: user?.privacy === "private" ? "Ikaw lang" : user?.privacy === "friends_of_friends" ? "Friends of friends" : "Publiko" },
        { id: "badge", icon: BadgeCheck, color: "text-indigo-500", bg: "bg-indigo-50", title: "Blue Badge", subtitle: user?.blueBadge ? "✓ Verified ka na!" : "I-claim ang iyong badge" },
      ]
    },
    {
      title: "Safety & Family",
      items: [
        { id: "teen-safety", icon: Baby, color: "text-pink-500", bg: "bg-pink-50", title: "Teen Safety", subtitle: teenSafety.enabled ? "🛡️ Aktibo" : "Para sa mga kabataan" },
        { id: "parent-guardian", icon: ShieldAlert, color: "text-purple-500", bg: "bg-purple-50", title: "Parent / Guardian Control", subtitle: "I-manage ang account ng anak" },
      ]
    },
    {
      title: "Notification & Display",
      items: [
        { id: "notifications", icon: Bell, color: "text-yellow-500", bg: "bg-yellow-50", title: "Mga Notification", subtitle: "I-manage ang mga abiso" },
        { id: "appearance", icon: Palette, color: "text-pink-500", bg: "bg-pink-50", title: "Hitsura", subtitle: "Font size at tema" },
        { id: "language", icon: Globe, color: "text-sky-500", bg: "bg-sky-50", title: "Wika / Language", subtitle: language === "fil" ? "Filipino" : "English" },
      ]
    },
    {
      title: "Feed & Content",
      items: [
        { id: "data-saver", icon: Wifi, color: "text-green-500", bg: "bg-green-50", title: "Data Saver Mode", subtitle: dataSaver ? "🟢 ON — text lang, walang image autoload" : "Images at videos awtomatikong naglo-load" },
        { id: "word-filter", icon: Filter, color: "text-red-500", bg: "bg-red-50", title: "Word Filter", subtitle: wordFilter ? `${wordFilter.split(",").filter(Boolean).length} blocked words` : "I-hide ang posts na may masamang salita" },
        { id: "chrono-feed", icon: SortDesc, color: "text-indigo-500", bg: "bg-indigo-50", title: "Chronological Feed", subtitle: chronoFeed ? "🟢 Latest muna, walang algorithm" : "Default feed ordering" },
        { id: "whisper-mode", icon: EyeOff, color: "text-purple-500", bg: "bg-purple-50", title: "Whisper Mode", subtitle: whisperMode ? "🟢 Posts mo ay para sa friends mo lang" : "I-post nang private para sa friends lang" },
        { id: "cw-content", icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50", title: "Content Warning (CW)", subtitle: cwEnabled ? "🟢 Nagtatanong bago ipakita ang sensitive content" : "I-require ang CW tag sa mga post" },
        { id: "disable-boosts", icon: Share2, color: "text-gray-500", bg: "bg-gray-50", title: "I-disable ang Boosts/Repost", subtitle: disableBoosts ? "🔒 Hindi ma-re-repost ang mga post mo" : "Pwedeng i-repost ng iba ang posts mo" },
      ]
    },
    {
      title: "More",
      items: [
        { id: "saved-posts-link", icon: Bookmark, color: "text-yellow-500", bg: "bg-yellow-50", title: "Saved Posts", subtitle: "Tingnan ang lahat ng na-save mong post" },
        { id: "export-posts", icon: FileText, color: "text-teal-500", bg: "bg-teal-50", title: "Export iyong Posts", subtitle: "I-download ang lahat ng iyong post" },
        { id: "help", icon: HelpCircle, color: "text-purple-500", bg: "bg-purple-50", title: "Help & About", subtitle: "Info at support" },
        { id: "download", icon: Download, color: "text-teal-500", bg: "bg-teal-50", title: "I-download ang Data", subtitle: "Kunin ang iyong data" },
        { id: "deactivate", icon: UserX, color: "text-orange-500", bg: "bg-orange-50", title: "I-deactivate ang Account", subtitle: "Pansamantalang i-disable" },
      ]
    },
  ];

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <div className="h-12 w-12 rounded-full overflow-hidden shrink-0" style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
          {user?.profilePicture
            ? <img src={user.profilePicture} className="w-full h-full object-cover" />
            : <span className="flex items-center justify-center w-full h-full text-white text-xl font-black">{user?.name?.[0]}</span>}
        </div>
        <div>
          <p className="font-black text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        {user?.blueBadge && <span className="ml-auto inline-flex items-center justify-center h-5 w-5 rounded-full text-white text-[9px] font-black shrink-0" style={{ background: "#1877f2" }}>✓</span>}
      </div>

      {/* Settings sections */}
      {menuSections.map(sec => (
        <div key={sec.title}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">{sec.title}</p>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {sec.items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => handleSettingsClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${idx < sec.items.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <div className={`h-9 w-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                    <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Logout */}
      <button
        onClick={() => setSection("logout")}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition active:scale-95"
      >
        <LogOut className="h-4 w-4" /> Mag-logout
      </button>

      <div className="text-center text-xs text-gray-300 pt-1">
        <p className="font-bold text-blue-400">BLUE MEDIA</p>
        <p className="text-[10px]">By JV Channel (Jonathan Villanueva) · Para sa Pilipinas 🇵🇭</p>
        <p className="text-[10px]">Version 2.0.0</p>
      </div>

      {/* ── Change PIN ── */}
      <Dialog open={section === "pin"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Palitan ang PIN 🔐</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Kasalukuyang PIN</Label><Input type="password" maxLength={4} inputMode="numeric" placeholder="••••" value={currentPin} onChange={e => setCurrentPin(e.target.value)} /></div>
            <div><Label>Bagong PIN</Label><Input type="password" maxLength={4} inputMode="numeric" placeholder="••••" value={newPin} onChange={e => setNewPin(e.target.value)} /></div>
            <div><Label>Kumpirmahin ang Bagong PIN</Label><Input type="password" maxLength={4} inputMode="numeric" placeholder="••••" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} /></div>
            <Button onClick={handleChangePin} className="w-full" disabled={changePin.isPending}>{changePin.isPending ? "Binabago..." : "Palitan ang PIN"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Privacy ── */}
      <Dialog open={section === "privacy"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Privacy Settings 👁️</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Sino ang makakakita ng iyong mga post at profile?</p>
            {[
              { value: "public", title: "🌍 Publiko", description: "Lahat ay makakakita" },
              { value: "friends_of_friends", title: "👥 Friends of Friends", description: "Mga kaibigan at mga kaibigan nila" },
              { value: "private", title: "🔒 Private", description: "Ikaw lang ang makakakita" },
            ].map(p => (
              <button key={p.value} onClick={() => setPrivacy(p.value as typeof privacy)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition ${privacy === p.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                <div className="text-left">
                  <p className="font-semibold text-sm">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                </div>
                {privacy === p.value && <div className="h-4 w-4 rounded-full bg-blue-500" />}
              </button>
            ))}
            <Button onClick={handlePrivacySave} className="w-full" disabled={updateUser.isPending}>I-save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Notifications ── */}
      <Dialog open={section === "notifications"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mga Notification 🔔</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {[
              { key: "friend_request", label: "Friend Requests", icon: "👫" },
              { key: "post_reaction", label: "Mga Reaction sa Post", icon: "❤️" },
              { key: "post_comment", label: "Mga Comment sa Post", icon: "💬" },
              { key: "message", label: "Mga Mensahe", icon: "📩" },
              { key: "follow", label: "Bagong Followers", icon: "👤" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <Switch checked={notifSettings[item.key as keyof typeof notifSettings]}
                  onCheckedChange={v => setNotifSettings(prev => ({ ...prev, [item.key]: v }))} />
              </div>
            ))}
            <p className="text-xs text-gray-400">Naka-save sa device na ito.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Blue Badge ── */}
      <Dialog open={section === "badge"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Blue Badge ✓</DialogTitle></DialogHeader>
          <div className="space-y-4 text-center">
            <div className="text-6xl">💙</div>
            <h3 className="font-black text-xl">Blue Media Verification</h3>
            {user?.blueBadge ? (
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-blue-700 font-bold">✓ May Blue Badge ka na!</p>
                <p className="text-sm text-blue-500 mt-1">Verified ang iyong profile sa Blue Media.</p>
                <p className="text-xs text-gray-400 mt-2">Na-claim: {user.blueBadgeClaimedAt ? new Date(user.blueBadgeClaimedAt).toLocaleDateString("fil-PH") : ""}</p>
              </div>
            ) : (
              <>
                <p className="text-gray-500 text-sm">I-claim ang iyong libreng Blue Badge at ipakita sa mundo na verified Blue Media user ka!</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className="text-yellow-700 text-sm font-semibold">⏳ Limitadong oras lang! I-claim na ngayon.</p>
                </div>
                <Button onClick={handleClaimBadge} className="w-full" disabled={claimBadge.isPending}>
                  {claimBadge.isPending ? "Kinukuha..." : "💙 I-claim ang Libreng Blue Badge"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Appearance ── */}
      <Dialog open={section === "appearance"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hitsura 🎨</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Laki ng Teksto</p>
              <div className="flex gap-2">
                {[{ value: "small", label: "Maliit" }, { value: "normal", label: "Normal" }, { value: "large", label: "Malaki" }].map(f => (
                  <button key={f.value} onClick={() => { setFontSize(f.value); localStorage.setItem("bm_fontsize", f.value); }}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition ${fontSize === f.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Kulay ng App</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Blue (Default)", color: "#1877f2" },
                  { label: "Purple", color: "#7c3aed" },
                  { label: "Green", color: "#16a34a" },
                ].map(t => (
                  <button key={t.color}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition">
                    <div className="h-8 w-8 rounded-full" style={{ background: t.color }} />
                    <span className="text-[10px] font-semibold text-gray-600">{t.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Pakialam lang sa kulay — darating pa yung ibang tema!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Language ── */}
      <Dialog open={section === "language"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Wika / Language 🌍</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[{ value: "fil", label: "Filipino 🇵🇭", sub: "Pilipino ang salita" }, { value: "en", label: "English 🇺🇸", sub: "Use English" }].map(l => (
              <button key={l.value} onClick={() => { setLanguage(l.value); localStorage.setItem("bm_language", l.value); setSection(null); toast({ title: l.value === "fil" ? "Filipino na ang wika! 🇵🇭" : "Language set to English!" }); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition ${language === l.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                <div className="text-left">
                  <p className="font-semibold text-sm">{l.label}</p>
                  <p className="text-xs text-gray-500">{l.sub}</p>
                </div>
                {language === l.value && <div className="h-4 w-4 rounded-full bg-blue-500" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Help & About ── */}
      <Dialog open={section === "help"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Help & About 💙</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-black text-blue-500">BLUE<span className="text-blue-300">MEDIA</span></p>
              <p className="text-xs text-gray-400 mt-1">Version 1.0.0</p>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="font-bold text-blue-800 mb-1">📱 Tungkol sa Blue Media</p>
                <p>Isang social media platform para sa mga Pilipino — para sa tunay na koneksyon at pakikipag-ugnayan.</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="font-bold text-green-800 mb-1">🛡️ Mga Patakaran ng Komunidad</p>
                <p>Zero tolerance sa harassment, hate speech, at inappropriate content. Igalang ang lahat.</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3">
                <p className="font-bold text-yellow-800 mb-1">📧 Makipag-ugnayan</p>
                <p>Para sa tulong at suporta, makipag-ugnayan sa admin team sa loob ng app.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Download Data ── */}
      <Dialog open={section === "download"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>I-download ang Data 📥</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-2">Kasama ang iyong data:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Impormasyon ng profile</li>
                <li>Mga post at larawan</li>
                <li>Mga mensahe</li>
                <li>Listahan ng mga kaibigan</li>
              </ul>
            </div>
            <Button className="w-full" onClick={() => { setSection(null); toast({ title: "📩 Request submitted!", description: "Padadalhan ka ng admin ng iyong data sa loob ng 48 oras." }); }}>
              <Download className="h-4 w-4 mr-2" /> Humiling ng Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate ── */}
      <Dialog open={section === "deactivate"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>I-deactivate ang Account ⚠️</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-bold">Sigurado ka ba?</p>
              <p className="text-sm text-red-600 mt-1">Maaari mong i-reactivate anumang oras sa pamamagitan ng pag-login muli.</p>
            </div>
            <p className="text-sm text-gray-500">Para ma-deactivate, makipag-ugnayan sa admin team. Ipo-proseso ang request sa loob ng 24 oras.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSection(null)}>Kanselahin</Button>
              <Button variant="destructive" className="flex-1" onClick={() => { setSection(null); toast({ title: "Request submitted", description: "Ipinadala na ang iyong request sa admin team." }); }}>Ipadala ang Request</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Teen Safety ── */}
      <Dialog open={section === "teen-safety"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Teen Safety 🛡️👶</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-pink-50 rounded-xl p-3">
              <p className="text-xs text-pink-700 font-medium">Para sa mga users na 13-17 taong gulang. Protektahan ang kabataan sa Blue Media.</p>
            </div>

            {/* Master toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-gray-800">I-enable ang Teen Safety</p>
                <p className="text-xs text-gray-400">I-on ang lahat ng proteksyon</p>
              </div>
              <Switch checked={teenSafety.enabled} onCheckedChange={v => saveTeenSafety({ enabled: v })} />
            </div>

            {teenSafety.enabled && (
              <>
                {/* Content filter */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">🔍 Content Filter</p>
                  <div className="space-y-1.5">
                    {[
                      { value: "strict", label: "Mahigpit (Strict)", sub: "Ang lahat ng sensitive content ay hindi makikita" },
                      { value: "moderate", label: "Katamtaman (Moderate)", sub: "Basic na filter ng inappropriate content" },
                    ].map(f => (
                      <button key={f.value} onClick={() => saveTeenSafety({ contentFilter: f.value })}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition text-sm ${teenSafety.contentFilter === f.value ? "border-pink-400 bg-pink-50" : "border-gray-200"}`}>
                        <p className="font-semibold">{f.label}</p>
                        <p className="text-xs text-gray-500">{f.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Screen time */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">⏱️ Screen Time Limit</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { value: "30min", label: "30 minuto" },
                      { value: "1hr", label: "1 oras" },
                      { value: "2hr", label: "2 oras" },
                      { value: "no_limit", label: "Walang limit" },
                    ].map(t => (
                      <button key={t.value} onClick={() => saveTeenSafety({ screenTime: t.value })}
                        className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition ${teenSafety.screenTime === t.value ? "border-pink-400 bg-pink-50 text-pink-700" : "border-gray-200 text-gray-600"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat restriction */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">💬 Chat sa Friends lang</p>
                    <p className="text-xs text-gray-400">Hindi makakatanggap ng mensahe mula sa strangers</p>
                  </div>
                  <Switch checked={teenSafety.chatWithFriendsOnly} onCheckedChange={v => saveTeenSafety({ chatWithFriendsOnly: v })} />
                </div>

                {/* Parent approval */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">👪 Parent Approval</p>
                    <p className="text-xs text-gray-400">Kailangan ng approval ng magulang para sa mga bagong kaibigan</p>
                  </div>
                  <Switch checked={teenSafety.requireParentApproval} onCheckedChange={v => saveTeenSafety({ requireParentApproval: v })} />
                </div>
              </>
            )}

            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-700">💙 Ang Blue Media ay dedicated sa kaligtasan ng bawat user. Para sa mga concern, makipag-ugnayan sa admin.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Parent Guardian ── */}
      <Dialog open={section === "parent-guardian"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Parent / Guardian Control 👪🔐</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!savedParentPin && !parentUnlocked ? (
              <div className="space-y-3">
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-xs text-purple-700 font-medium">Gumawa ng Parent PIN para masigurong ikaw lang ang makakabago ng mga Teen Safety settings.</p>
                </div>
                <div>
                  <Label>Bagong Parent PIN (4 digits)</Label>
                  <Input type="password" maxLength={4} inputMode="numeric" placeholder="••••" value={parentPin} onChange={e => setParentPin(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Kumpirmahin ang Parent PIN</Label>
                  <Input type="password" maxLength={4} inputMode="numeric" placeholder="••••" value={parentPinConfirm} onChange={e => setParentPinConfirm(e.target.value)} className="mt-1" />
                </div>
                <Button className="w-full" onClick={() => {
                  if (parentPin.length !== 4) { toast({ title: "4 digits ang kailangan", variant: "destructive" }); return; }
                  if (parentPin !== parentPinConfirm) { toast({ title: "Hindi magkatugma ang PIN", variant: "destructive" }); return; }
                  localStorage.setItem("bm_parent_pin", parentPin);
                  setSavedParentPin(parentPin);
                  setParentUnlocked(true);
                  setParentPin("");
                  setParentPinConfirm("");
                  toast({ title: "✅ Parent PIN na-set!" });
                }}>I-set ang Parent PIN</Button>
              </div>
            ) : !parentUnlocked ? (
              <div className="space-y-3">
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-4xl mb-2">🔐</p>
                  <p className="text-sm font-semibold text-purple-800">Parent PIN Required</p>
                  <p className="text-xs text-purple-600 mt-1">I-enter ang Parent PIN para ma-access ang mga controls</p>
                </div>
                <Input type="password" maxLength={4} inputMode="numeric" placeholder="Enter Parent PIN" value={parentPinInput} onChange={e => setParentPinInput(e.target.value)} className="text-center text-2xl tracking-widest" />
                <Button className="w-full" onClick={() => {
                  if (parentPinInput === savedParentPin) { setParentUnlocked(true); setParentPinInput(""); toast({ title: "✅ Parent access granted!" }); }
                  else { toast({ title: "Mali ang PIN", variant: "destructive" }); setParentPinInput(""); }
                }}>I-unlock</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600 shrink-0" />
                  <p className="text-sm text-green-700 font-semibold">Parent / Guardian mode — na-unlock!</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-700">👶 Teen Account Settings</p>

                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div>
                      <p className="text-sm font-semibold">Teen Safety Mode</p>
                      <p className="text-xs text-gray-400">{teenSafety.enabled ? "🟢 Aktibo" : "🔴 Hindi aktibo"}</p>
                    </div>
                    <Switch checked={teenSafety.enabled} onCheckedChange={v => saveTeenSafety({ enabled: v })} />
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div>
                      <p className="text-sm font-semibold">Chat sa Friends lang</p>
                      <p className="text-xs text-gray-400">{teenSafety.chatWithFriendsOnly ? "🟢 Aktibo" : "🔴 Hindi aktibo"}</p>
                    </div>
                    <Switch checked={teenSafety.chatWithFriendsOnly} onCheckedChange={v => saveTeenSafety({ chatWithFriendsOnly: v })} />
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div>
                      <p className="text-sm font-semibold">Approval ng Magulang</p>
                      <p className="text-xs text-gray-400">Para sa bagong kaibigan</p>
                    </div>
                    <Switch checked={teenSafety.requireParentApproval} onCheckedChange={v => saveTeenSafety({ requireParentApproval: v })} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-1.5">⏱️ Screen Time Limit</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { value: "30min", label: "30 min" },
                        { value: "1hr", label: "1 oras" },
                        { value: "2hr", label: "2 oras" },
                        { value: "no_limit", label: "Walang limit" },
                      ].map(t => (
                        <button key={t.value} onClick={() => saveTeenSafety({ screenTime: t.value })}
                          className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition ${teenSafety.screenTime === t.value ? "border-purple-400 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600"}`}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-1.5">🔍 Content Filter Level</p>
                    <div className="space-y-1.5">
                      {[
                        { value: "strict", label: "Mahigpit" },
                        { value: "moderate", label: "Katamtaman" },
                      ].map(f => (
                        <button key={f.value} onClick={() => saveTeenSafety({ contentFilter: f.value })}
                          className={`w-full text-left px-3 py-2 rounded-xl border-2 transition text-sm font-semibold ${teenSafety.contentFilter === f.value ? "border-purple-400 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600"}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <button onClick={() => {
                    localStorage.removeItem("bm_parent_pin");
                    setSavedParentPin("");
                    setParentUnlocked(false);
                    toast({ title: "Parent PIN na-reset" });
                  }} className="text-xs text-red-500 hover:text-red-700 font-medium">
                    🔄 I-reset ang Parent PIN
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Data Saver Mode ── */}
      <Dialog open={section === "data-saver"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Data Saver Mode 📶</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-green-700">Kapag naka-ON, hindi na awtomatikong maglo-load ang mga larawan at video sa feed. Tipid sa data plan mo!</p>
            </div>
            <div className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-xl">
              <div>
                <p className="font-semibold text-sm">Data Saver Mode</p>
                <p className="text-xs text-gray-400">{dataSaver ? "🟢 Aktibo — text lang ang naglo-load" : "🔴 Hindi aktibo"}</p>
              </div>
              <Switch checked={dataSaver} onCheckedChange={v => { setDataSaver(v); localStorage.setItem("bm_data_saver", String(v)); toast({ title: v ? "🟢 Data Saver ON! Mas tipid ka na." : "Data Saver OFF" }); }} />
            </div>
            {dataSaver && (
              <div className="bg-yellow-50 rounded-xl p-3 text-xs text-yellow-700">
                💡 I-tap lang ang larawan/video para i-load ito mano-mano.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Word Filter ── */}
      <Dialog open={section === "word-filter"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Word Filter 🚫</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Mga post na may mga salitang ito ay awtomatikong itatago sa feed mo.</p>
            <div>
              <Label>Blocked Words (comma-separated)</Label>
              <textarea
                className="w-full mt-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-red-400 transition h-24"
                placeholder="scam, away, bastos, loko..."
                value={wordFilterInput}
                onChange={e => setWordFilterInput(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Hal: scam, fake, bastos (lagyan ng comma ang bawat isa)</p>
            </div>
            {wordFilter && (
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">Kasalukuyang blocked words:</p>
                <div className="flex flex-wrap gap-1">
                  {wordFilter.split(",").filter(Boolean).map(w => (
                    <span key={w} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">{w.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setWordFilterInput(""); setWordFilter(""); localStorage.setItem("bm_word_filter", ""); toast({ title: "Word filter cleared" }); }}>I-clear</Button>
              <Button className="flex-1" onClick={() => { setWordFilter(wordFilterInput); localStorage.setItem("bm_word_filter", wordFilterInput); setSection(null); toast({ title: "✅ Word filter saved!" }); }}>I-save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Chronological Feed ── */}
      <Dialog open={section === "chrono-feed"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chronological Feed 📅</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-xl p-3">
              <p className="text-xs text-indigo-700">Kapag naka-ON, ang mga post ay ipapakita sa pagkakasunud-sunod ng pinakabago — walang algorithm na nagpipili para sa iyo!</p>
            </div>
            <div className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-xl">
              <div>
                <p className="font-semibold text-sm">Chronological Feed</p>
                <p className="text-xs text-gray-400">{chronoFeed ? "🟢 Latest posts muna" : "Default ordering"}</p>
              </div>
              <Switch checked={chronoFeed} onCheckedChange={v => { setChronoFeed(v); localStorage.setItem("bm_chrono_feed", String(v)); toast({ title: v ? "🟢 Chronological feed ON!" : "Default feed ordering" }); }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Whisper Mode ── */}
      <Dialog open={section === "whisper-mode"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Whisper Mode 🤫</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-xs text-purple-700">Kapag naka-ON ang Whisper Mode, ang mga post mo ay ipapakita lang sa iyong mga kaibigan — hindi sa public feed.</p>
            </div>
            <div className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-xl">
              <div>
                <p className="font-semibold text-sm">Whisper Mode</p>
                <p className="text-xs text-gray-400">{whisperMode ? "🟢 Posts sa friends lang makikita" : "🔴 Posts sa public feed"}</p>
              </div>
              <Switch checked={whisperMode} onCheckedChange={v => { setWhisperMode(v); localStorage.setItem("bm_whisper_mode", String(v)); toast({ title: v ? "🤫 Whisper Mode ON! Friends lang makakakita." : "Whisper Mode OFF" }); }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Content Warning ── */}
      <Dialog open={section === "cw-content"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Content Warning (CW) ⚠️</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 rounded-xl p-3">
              <p className="text-xs text-yellow-700">Kapag naka-ON, maaari kang magdagdag ng "Content Warning" tag sa iyong post bago makita ng iba ang nilalaman. Para sa mga sensitibong paksa.</p>
            </div>
            <div className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-xl">
              <div>
                <p className="font-semibold text-sm">Content Warning Required</p>
                <p className="text-xs text-gray-400">{cwEnabled ? "🟢 Aktibo" : "🔴 Hindi aktibo"}</p>
              </div>
              <Switch checked={cwEnabled} onCheckedChange={v => { setCwEnabled(v); localStorage.setItem("bm_cw_enabled", String(v)); toast({ title: v ? "⚠️ CW mode ON!" : "CW mode OFF" }); }} />
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
              <p className="font-semibold mb-1">Paano gamitin:</p>
              <p>Sa pag-post, lagyan ng "CW:" sa simula ng iyong post. Hal: "CW: graphic na larawan — mag-ingat!"</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Disable Boosts ── */}
      <Dialog open={section === "disable-boosts"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Disable Boosts/Reposts 🔒</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-700">Kapag naka-ON, hindi na maaaring i-repost ng iba ang iyong mga post sa kanilang profile o feed.</p>
            </div>
            <div className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-xl">
              <div>
                <p className="font-semibold text-sm">Disable Reposts</p>
                <p className="text-xs text-gray-400">{disableBoosts ? "🔒 Hindi ma-re-repost ang posts mo" : "✅ Pwedeng i-repost ng iba"}</p>
              </div>
              <Switch checked={disableBoosts} onCheckedChange={v => { setDisableBoosts(v); localStorage.setItem("bm_disable_boosts", String(v)); toast({ title: v ? "🔒 Reposts disabled!" : "Reposts enabled" }); }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Export Posts ── */}
      <Dialog open={section === "export-posts"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Export iyong Posts 📄</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-teal-50 rounded-xl p-3">
              <p className="text-xs text-teal-700">I-download ang lahat ng iyong mga post bilang JSON file. Maaari mo itong gamitin bilang backup ng iyong content.</p>
            </div>
            <Button className="w-full" onClick={async () => {
              const t = localStorage.getItem("bluemedia_token");
              try {
                const res = await fetch("/api/posts", { headers: { Authorization: `Bearer ${t}` } });
                const all = await res.json();
                const mine = all.filter((p: any) => p.author?.id === user?.id);
                const blob = new Blob([JSON.stringify(mine, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = `bluemedia-posts-${Date.now()}.json`; a.click();
                URL.revokeObjectURL(url);
                toast({ title: `✅ ${mine.length} posts exported!` });
                setSection(null);
              } catch { toast({ title: "Export failed", variant: "destructive" }); }
            }}>
              <Download className="h-4 w-4 mr-2" /> I-export ang Posts (JSON)
            </Button>
            <p className="text-xs text-gray-400 text-center">Kasama ang lahat ng iyong post, reactions, at comments.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Logout Confirm ── */}
      <Dialog open={section === "logout"} onOpenChange={o => !o && setSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mag-logout 🚪</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">Sigurado ka bang gusto mong mag-logout?</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSection(null)}>Huwag na</Button>
              <Button variant="destructive" className="flex-1" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" /> Oo, Mag-logout</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
