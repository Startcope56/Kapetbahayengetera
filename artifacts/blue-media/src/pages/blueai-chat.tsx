import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, Zap, Trash2, Image as ImageIcon, X, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Msg {
  role: "user" | "ai";
  text: string;
  imageUrl?: string;
  ts: number;
}

const SYSTEM_PROMPT = `Ikaw si BLUE AI — ang official na AI assistant ng Blue Media, isang social media platform para sa mga Pilipino na ginawa ni JV Channel (Jonathan Villanueva).
Ikaw ay friendly, helpful, at nagsasalita ng Tagalog/Filipino mixed with English (Taglish).
Sumasagot ka ng tanong tungkol sa: Blue Media features, school subjects, general knowledge, advice, jokes, trivia, at kahit anong paksa.
Maikli at malinaw ang iyong mga sagot. Gumamit ng emojis. Lagi kang positive at encouraging.`;

const QUICK_PROMPTS = [
  "Magbiro ka 😂", "Motivasyon 💪", "Tips para mapalakas followers",
  "Paano makuha Blue Badge? 🏅", "Fun fact tungkol sa Pilipinas 🇵🇭",
  "Explain sa akin ang Blue Media", "Pwede ka kumanta? 🎵",
  "Kwentuhan mo ako 📖", "Tulong sa Math 🧮", "Advice sa buhay 💙",
];

async function askPollinations(messages: Array<{ role: string; content: any }>): Promise<string> {
  try {
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        model: "openai",
        private: true,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error("API error");
    const text = await res.text();
    return text.trim() || "Paumanhin, hindi ako makatugon ngayon. Subukan ulit mamaya! 💙";
  } catch {
    return "Paumanhin, may problema sa koneksyon. Subukan ulit mamaya! 💙\n\n(Tip: I-check ang iyong internet connection)";
  }
}

export default function BlueAIChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "ai",
      text: `Mabuhay, ${user?.name?.split(" ")[0] || "kabayan"}! 🇵🇭 Ako si **BLUE AI** — ang iyong tunay na AI companion sa Blue Media!\n\n🤖 Powered by real AI (Pollinations)\n💬 Magtanong ng kahit anong bagay\n📸 Mag-upload ng image at sasabihin ko kung ano ang makikita\n🌟 Lagi akong available para sa inyo!\n\nAno ang gusto mong pag-usapan ngayon? 💙`,
      ts: Date.now(),
    },
  ]);
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; content: any }>>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast({ title: "Image too large (max 5MB)", variant: "destructive" }); return; }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if ((!msg && !imageFile) || typing) return;
    setInput("");

    let b64: string | null = null;
    if (imageFile) {
      b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
    }

    const newMsg: Msg = { role: "user", text: msg || "(image)", imageUrl: imagePreview || undefined, ts: Date.now() };
    setMsgs(prev => [...prev, newMsg]);
    setImageFile(null);
    setImagePreview(null);
    if (imgRef.current) imgRef.current.value = "";
    setTyping(true);

    const userContent: any = b64
      ? [
          { type: "text", text: msg || "Ano ang makikita sa image na ito?" },
          { type: "image_url", image_url: { url: b64 } },
        ]
      : msg;

    const newHistory: Array<{ role: "user" | "assistant"; content: any }> = [
      ...history,
      { role: "user", content: userContent },
    ];

    const reply = await askPollinations(newHistory);
    setTyping(false);
    setHistory([...newHistory, { role: "assistant", content: reply }]);
    setMsgs(prev => [...prev, { role: "ai", text: reply, ts: Date.now() }]);
  };

  const clearChat = () => {
    setHistory([]);
    setMsgs([{
      role: "ai",
      text: `Fresh start! 🔄 Kumusta ulit, ${user?.name?.split(" ")[0] || "kabayan"}? Ano ang gusto mong pag-usapan ngayon? 💙`,
      ts: Date.now(),
    }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -mt-3 -mx-3">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 bg-white shadow-sm">
        <div className="relative">
          <div className="h-11 w-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="font-black text-gray-900">BLUE AI</h2>
            <Zap className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: "#1877f2" }}>REAL AI</span>
          </div>
          <p className="text-xs text-green-500 font-medium">● Powered by Pollinations AI</p>
        </div>
        <button onClick={clearChat} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "#f0f2f5" }}>
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {m.role === "ai" ? (
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
                <Bot className="h-4 w-4 text-white" />
              </div>
            ) : (
              <Avatar className="h-8 w-8 shrink-0 mt-1">
                <AvatarImage src={user?.profilePicture || undefined} />
                <AvatarFallback className="font-bold text-xs" style={{ background: "#1877f2", color: "white" }}>{user?.name?.[0]}</AvatarFallback>
              </Avatar>
            )}
            <div className={`max-w-[80%] flex flex-col gap-0.5 ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.role === "ai"
                  ? "bg-white text-gray-800 shadow-sm rounded-tl-sm"
                  : "text-white rounded-tr-sm"
              }`}
                style={m.role === "user" ? { background: "linear-gradient(135deg,#1877f2,#0a6bc7)" } : undefined}>
                {m.imageUrl && (
                  <img src={m.imageUrl} alt="uploaded" className="rounded-xl max-h-48 object-cover mb-2 w-full" />
                )}
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
              <span className="text-[10px] text-gray-400 px-1">
                {new Date(m.ts).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex gap-2.5">
            <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="text-xs text-gray-400 mr-1">BLUE AI is thinking</span>
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-2 w-2 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.18}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      <div className="bg-white border-t border-gray-100 px-3 pt-2 pb-0">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => send(p)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 whitespace-nowrap transition active:scale-95 shrink-0">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="bg-white px-3 pb-1 flex items-center gap-2">
          <div className="relative">
            <img src={imagePreview} alt="preview" className="h-16 w-16 rounded-xl object-cover border border-gray-200" />
            <button onClick={() => { setImageFile(null); setImagePreview(null); if (imgRef.current) imgRef.current.value = ""; }}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-gray-700 text-white rounded-full flex items-center justify-center">
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="text-xs text-gray-500">Image ready to send — ask Blue AI about it!</p>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-3 pb-3 pt-2 flex gap-2 items-center">
        <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
        <button onClick={() => imgRef.current?.click()}
          className="h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition shrink-0">
          <ImageIcon className="h-4 w-4" />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Magtanong kay BLUE AI..."
          className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-400 bg-gray-50 transition"
          disabled={typing}
        />
        <button onClick={() => send()} disabled={(!input.trim() && !imageFile) || typing}
          className="h-9 w-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition active:scale-95 shrink-0"
          style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
