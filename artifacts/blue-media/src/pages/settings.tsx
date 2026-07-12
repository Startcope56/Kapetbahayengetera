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
  LogOut, Palette, Globe, Shield, UserX, Trash2, Moon, Sun, Download, Star
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

  const [privacy, setPrivacy] = useState<"public" | "friends">((user?.privacy as "public" | "friends") || "public");
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

  const menuSections = [
    {
      title: "Account",
      items: [
        { id: "pin", icon: Lock, color: "text-blue-500", bg: "bg-blue-50", title: "Palitan ang PIN", subtitle: "I-update ang iyong 4-digit na PIN" },
        { id: "privacy", icon: Eye, color: "text-green-500", bg: "bg-green-50", title: "Privacy", subtitle: user?.privacy === "friends" ? "Mga kaibigan lang" : "Publiko" },
        { id: "badge", icon: BadgeCheck, color: "text-indigo-500", bg: "bg-indigo-50", title: "Blue Badge", subtitle: user?.blueBadge ? "✓ Verified ka na!" : "I-claim ang iyong badge" },
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
      title: "More",
      items: [
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
                  onClick={() => setSection(item.id)}
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
        <p>Version 1.0.0 · Para sa Pilipinas 🇵🇭</p>
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
            {["public", "friends"].map(p => (
              <button key={p} onClick={() => setPrivacy(p as "public" | "friends")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition ${privacy === p ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                <div className="text-left">
                  <p className="font-semibold text-sm">{p === "public" ? "🌍 Publiko" : "👫 Mga Kaibigan Lang"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p === "public" ? "Lahat ay makakakita" : "Mga kaibigan mo lang"}</p>
                </div>
                {privacy === p && <div className="h-4 w-4 rounded-full bg-blue-500" />}
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
