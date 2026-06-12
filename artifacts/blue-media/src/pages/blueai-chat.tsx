import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Sparkles, RefreshCw, Trash2 } from "lucide-react";

interface Msg { role: "user" | "ai"; text: string; ts: number; }

const QUICK_PROMPTS = [
  "Tell me a joke 😂",
  "Motivational quote 💪",
  "What's trending in PH? 🇵🇭",
  "How do I get Blue Badge? 🏅",
  "Give me a fun fact!",
  "How to get more followers?",
];

const AI_RESPONSES: Record<string, string[]> = {
  joke: [
    "Bakit ang Pinoy, hindi natutulug sa math class? Kasi lagi silang nag-iisip ng \"sana all\"! 😂",
    "Ano ang tawag sa tamad na mathematician? Magaling magtamad! 🤣",
    "Knock knock! Who's there? Puspin. Puspin who? Puspin! Baka naman gusto mong makipagkaibigan sa akin! 🐱",
  ],
  motivational: [
    "\"Ang tagumpay ay hindi para sa mga piling tao. Ito ay para sa mga hindi sumusuko.\" 💪 Keep going!",
    "\"Kaya mo 'yan! Huwag kang bibitaw. Ang pangarap mo, ang susi mo sa kinabukasan.\" 🌟",
    "\"Every day is a new chance to be better than yesterday. You got this, Kabayan!\" 🇵🇭",
  ],
  trending: [
    "Based on Blue Media activity: #BlueMediaPilipinas is trending with 12K+ posts! Also hot: #GoodVibesOnly and #PinoyPride. 🔥",
    "This week on Blue Media: Gaming tournaments, Pinoy food festivals, and community meetups are getting lots of buzz! 🇵🇭",
  ],
  badge: [
    "To get a Blue Badge ✓ on Blue Media: Go to your Profile → tap the '...' menu → 'Claim Blue Badge'. It's free for verified community members! 🏅",
    "Blue Badge is given to real accounts who contribute positively to the Blue Media community. Visit your profile and claim it! ✓",
  ],
  followers: [
    "Tips to get more followers on Blue Media 🚀:\n1. Post consistently every day\n2. Use color backgrounds and feelings on posts\n3. Engage with others (comment, react)\n4. Share your real experiences\n5. Go Live to meet new people!",
  ],
  fact: [
    "Fun fact: The Philippines has over 7,641 islands! 🏝️ That's a lot of beautiful places to explore!",
    "Did you know? Filipinos are among the top social media users in the world, spending an average of 10+ hours online per day! 📱",
    "Fun fact: The word 'boondocks' comes from the Tagalog word 'bundok' meaning mountain! 🗻",
  ],
  greet: [
    "Kamusta ka! 👋 Ako si Blue AI, ang iyong kaibigan sa Blue Media. Paano kita matutulungan ngayon?",
    "Hello! I'm Blue AI 🤖 — your friendly Blue Media assistant! Ask me anything!",
    "Mabuhay! 🇵🇭 Blue AI here! How can I help you today?",
  ],
  default: [
    "Interesting question! As Blue AI, I know a lot about Blue Media and Pilipinas culture. Could you be more specific? 😊",
    "Hmm, let me think about that... I'm still learning! Try asking me about jokes, motivation, Blue Badge, or how to get more followers! 🤖",
    "Great question! Blue AI is here to help. I specialize in Blue Media tips, Pinoy culture, jokes, and motivation. What would you like to know?",
  ],
};

function getBotReply(msg: string): string {
  const m = msg.toLowerCase();
  let responses: string[];
  if (/joke|nakakatawa|biro|funny/i.test(m)) responses = AI_RESPONSES.joke;
  else if (/motivat|quote|inspire|kaya|gawa/i.test(m)) responses = AI_RESPONSES.motivational;
  else if (/trending|hot|viral|sikat/i.test(m)) responses = AI_RESPONSES.trending;
  else if (/badge|verify|checkmark|tick/i.test(m)) responses = AI_RESPONSES.badge;
  else if (/follower|follow|sikat|famous/i.test(m)) responses = AI_RESPONSES.followers;
  else if (/fact|trivia|alam mo ba|did you know/i.test(m)) responses = AI_RESPONSES.fact;
  else if (/hi|hello|hey|kumusta|kamusta|mabuhay|sup/i.test(m)) responses = AI_RESPONSES.greet;
  else responses = AI_RESPONSES.default;
  return responses[Math.floor(Math.random() * responses.length)];
}

export default function BlueAIChatPage() {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Mabuhay! 🇵🇭 Ako si Blue AI, ang iyong friendly na AI assistant sa Blue Media! Ask me anything — jokes, tips, facts, motivation — I'm here for you! 💙", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    setMsgs(prev => [...prev, { role: "user", text: msg, ts: Date.now() }]);
    setTyping(true);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));
    setTyping(false);
    setMsgs(prev => [...prev, { role: "ai", text: getBotReply(msg), ts: Date.now() }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -mt-3 -mx-3">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 bg-white shadow-sm">
        <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-black text-gray-900">Blue AI 🤖</h2>
          <p className="text-xs text-green-500 font-medium">● Always online</p>
        </div>
        <button onClick={() => setMsgs([{ role: "ai", text: "Chat cleared! Kumusta? 😊", ts: Date.now() }])}
          className="ml-auto text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition">
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
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            ) : (
              <Avatar className="h-8 w-8 shrink-0 mt-1">
                <AvatarImage src={user?.profilePicture || undefined} />
                <AvatarFallback className="font-bold text-xs" style={{ background: "#1877f2", color: "white" }}>{user?.name?.[0]}</AvatarFallback>
              </Avatar>
            )}
            <div className={`max-w-[75%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
              <div className={`px-3 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === "ai"
                  ? "bg-white text-gray-800 shadow-sm rounded-tl-sm"
                  : "text-white rounded-tr-sm"
              }`}
                style={m.role === "user" ? { background: "linear-gradient(135deg,#1877f2,#0a6bc7)" } : undefined}>
                {m.text}
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
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      <div className="bg-white border-t border-gray-100 px-3 pt-2 pb-0 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => send(p)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 whitespace-nowrap transition">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-3 pb-3 pt-2 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask Blue AI anything..."
          className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-400 bg-gray-50"
        />
        <button onClick={() => send()} disabled={!input.trim()}
          className="h-9 w-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition active:scale-95 shrink-0"
          style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
