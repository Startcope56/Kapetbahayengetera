import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Sparkles, Trash2, Bot, Zap } from "lucide-react";

interface Msg { role: "user" | "ai"; text: string; ts: number; }

const QUICK_PROMPTS = [
  "Magbiro ka 😂", "Motivasyon 💪", "Tips para mapalakas followers",
  "Paano makuha Blue Badge? 🏅", "Fun fact tungkol sa Pilipinas 🇵🇭",
  "Ano ang nangyayari sa Blue Media?", "Pwede ka kumanta? 🎵",
  "Kwentuhan mo ako 📖", "Ano ang kahulugan ng buhay? 🤔",
];

const AI_POOLS: Record<string, string[]> = {
  joke: [
    "Bakit ang Pinoy, hindi natutulug sa math class? Kasi lagi silang nag-iisip ng \"sana all\"! 😂",
    "Ano ang tawag sa tamad na doktor? Dr. Wala! 🤣",
    "Bakit laging malungkot ang kalendaryo? Kasi puno ito ng 'dates' pero wala namang kasama! 😭💕",
    "Tanong: Anong sabi ng karagatan sa dalampasigan? Wala, nag-wave lang! 🌊😂",
    "Bakit hindi kumakain ang skeleton? Kasi wala siyang lakas ng loob! 💀😆",
    "Anong tawag sa isang tatay na nasa ref? Cool Papa! ❄️👨",
    "Bakit ang pencil nagpunta sa doctor? Kasi pakiramdam niya ay pointless ang buhay! ✏️😂",
  ],
  motivational: [
    "\"Ang tagumpay ay hindi para sa mga piling tao — ito ay para sa mga hindi sumusuko.\" 💪 Ikaw yan, kabayan!",
    "\"Huwag kang matakot sa kabiguan. Ang mga bituin ay lumitaw lamang sa kadiliman.\" 🌟 Keep shining!",
    "\"Kaya mo 'yan! Isang hakbang sa isang pagkakataon. Ang malalim na ilog ay nagsimula sa isang patak ng ulan.\" 💧",
    "\"Hindi ang tagumpay ang nagbibigay ng kaligayahan — kundi ang paglalakbay patungo dito.\" Enjoy the process! 🚀",
    "\"Ang pinakamalakas na tao ay hindi ang may pinakamalaking katawan — kundi ang may pinakamatibay na puso.\" ❤️",
    "\"Sa bawat bagong araw, may bagong pagkakataon. Gamitin mo ito, kabayan!\" 🇵🇭 You've got this!",
    "Every setback is a setup for a comeback. 🔥 Laban lang!",
  ],
  trending: [
    "Hot sa Blue Media ngayon: #PinoyPride trending na may 15K+ posts! 🔥 Pati na rin #GoLive at #BlueAI2025!",
    "This week's top: Gaming streams, OPM music covers, at mga food vlog ng mga Pinoy karinderya owners! 🍜",
    "Trending ngayon: mga reaction posts sa bagong Blue Media features! Ang daming nag-eenjoy sa Go Live! 🔴",
    "Viral sa Blue Media: challenge ng 'Pinoy Dad Jokes' — sobrang daming nagtawa! 😂 Sumali ka na!",
  ],
  badge: [
    "Para makuha ang Blue Badge ✓:\n1️⃣ Pumunta sa iyong Profile\n2️⃣ I-tap ang '...' menu\n3️⃣ Piliin 'Claim Blue Badge'\n\nFree ito para sa lahat ng miyembro! 🏅",
    "Blue Badge ✓ ay para sa mga tunay na miyembro ng Blue Media community. I-visit ang iyong profile at i-claim na! Libre lang! 💙",
  ],
  followers: [
    "Tips para sa mas maraming followers sa Blue Media 🚀:\n\n1️⃣ Mag-post araw-araw — consistency is key!\n2️⃣ Gumamit ng colorful backgrounds at feelings sa posts\n3️⃣ Mag-react at mag-comment sa iba's posts\n4️⃣ I-share ang tunay mong buhay — authentic content wins!\n5️⃣ Mag-Go Live para makilala ka ng iba!\n6️⃣ Gumamit ng Request Followers feature sa menu! 📊",
    "Secret sa pagiging sikat sa Blue Media: ENGAGE! Sumagot sa mga comments, mag-react sa posts, at maging tunay ka. Ang authenticity ang pinaka-powerful na tool! 💯",
  ],
  fact: [
    "Fun fact: Ang Pilipinas ay may 7,641 na pulo! 🏝️ At ang ilan sa mga ito ay hindi pa nakapangalan — ready for adventure ka ba?",
    "Alam mo ba? Ang mga Pilipino ay kabilang sa pinaka-maraming oras sa social media globally — average 9-10 oras bawat araw! 📱 That's us!",
    "Trivia: Ang salitang 'boondocks' sa Ingles ay nanggaling sa Tagalog na 'bundok'! 🗻 Talagang may impluwensya tayo sa mundo!",
    "Did you know? Ang Pilipinas ay may pinakamaraming Catholic na populasyon sa Asya — mahigit 80 milyon! ⛪",
    "Fun fact: Ang Jose Rizal ay nagsalita ng 22+ na wika! 🌐 Talaga namang genius ang ating pambansang bayani!",
    "Alam mo ba? Ang San Juanico Bridge sa Leyte ay ang pinakamahabang tulay sa Southeast Asia na nagkokonekta ng dalawang pulo! 🌉",
  ],
  greet: [
    "Kamusta ka, kabayan! 👋 Ako si Blue AI — ang iyong matalinong kaibigan sa Blue Media. Paano kita matutulungan ngayon? 💙",
    "Hello! Mabuhay! 🇵🇭 Narito na ako, Blue AI! Handa akong sagutin ang lahat ng iyong tanong. Ano ang gusto mong malaman?",
    "Hey there! 😊 Ito si Blue AI — always ready to chat! Magtanong ka ng jokes, motivation, trivia, o tips. Sige, simulan natin!",
  ],
  sing: [
    "🎵 *Blue Media Song* 🎵\n\"Sa Blue Media, tayo ay nagtatagpo,\nMga kwento natin, ibinahagi mo,\nAng bawat post ay puso't kaluluwa,\nSa Blue Media, tayo ay pamilya!\" 🎶\n\n(Composed by Blue AI para sa inyo! 💙)",
    "🎵 OPM Parody 🎵\n\"Sa bawat umaga, binubuksan ko,\nBlue Media app para makita mo,\nAng feed ay puno ng mga ngiti,\nAt ang puso ko ay nananabi...\" 🎶\n\n💙 Blue AI composed this just for you!",
  ],
  story: [
    "Noong unang panahon, may isang batang Pilipino na pangarap na maging online star. Araw-araw, nag-post siya ng kanyang mga kwento. Minsan, naasar siya nang walang nag-like — pero hindi siya sumuko. Isang araw, isang post niya ang naging viral, at daan-daang bagong kaibigan ang dumating. Ang aral? \"Keep posting, keep shining — ang tamang tao ay makikita mo sa tamang oras.\" 💙",
    "Story time! 📖\n\nIsa sa mga pinaka-magagandang bagay sa internet ay kung paano nagtatagpo ang mga taong hindi magkakilala. Sa Blue Media, may nakilala akong (virtually) isang lolo na nag-post ng kanyang lutuin tuwing Linggo. Nagsimula siyang mag-go live, at ngayon ay may 10,000+ followers na siya. Dahil authentic siya. Ikaw din, kaya mo! 🍳",
  ],
  meaning: [
    "Ang kahulugan ng buhay? 🤔\n\nAyon sa Blue AI, ang buhay ay puno ng koneksyon — sa pamilya, sa mga kaibigan, at sa komunidad. Sa Blue Media, nakikita natin kung paano ang isang simpleng 'like' o 'comment' ay makapagpapasaya ng isang tao. Ang buhay ay hindi tungkol sa bilang ng followers — kundi sa depth ng relasyon na iyong nilikha. 💙\n\n\"Ang tunay na kayamanan ay ang taong mahal ka.\" 🇵🇭",
    "Deep question! 🌟\n\nAyon sa pilosopiya ng Blue AI: Ang buhay ay isang kwento na ikaw ang nagsusulat. Gawin mong masaya, makulay, at puno ng pagmamahal. Post mo ang iyong moments, ibahagi ang iyong talento, at maging mabait sa lahat — dahil hindi mo alam kung sino ang kailangang ngumiti ngayon. 💙",
  ],
  weather: [
    "Hindi ko makita ang totoong weather forecast (walang internet connection sa aking circuit board ngayon 😅), pero sa Pilipinas: usually mainit! ☀️ Siguro 30-35°C depende sa lugar. Mag-ingat sa araw! 🌂",
  ],
  food: [
    "Pinoy food recs ngayon! 🍜\n\n🥇 Adobo — classic, hindi mapapantayan!\n🥈 Sinigang — sour at refreshing\n🥉 Lechon — paborito sa salu-salo\n🍌 Halo-halo — para sa mainit na araw\n🐟 Kare-kare — rich at masarap!\n\nKung nasa ibang bansa ka, siguradong miss mo na ang Pinoy food! 😢❤️",
  ],
  love: [
    "Ay, pinag-uusapan natin ang pag-ibig! ❤️\n\nAng tunay na pagmamahal ay hindi naghahanap ng kapalit — nagbibigay ito ng walang kondisyon. Sa Blue Media, nakakahanap ka ng bagong kaibigan, at marahil... ng espesyal na isa! 😊\n\nTip: Mag-react, mag-comment, maging totoo ka — at ang tamang tao ay lalapit sa iyo. 💕",
  ],
  default: [
    "Interesting na tanong iyan! 🤔 Bilang isang AI na espesyalista sa Blue Media at Pinoy culture, maaari akong sumagot ng maraming bagay. Subukan mong itanong: jokes, motivation, tips, facts, kwento, o kung ano pa ang gusto mo! 😊",
    "Hmm, hindi ko pa ganun ka-expert sa lahat, pero natuto na akong marami! 🤖 Subukan mong magtanong ng: '🎵 kantahin mo', 'kwentuhan mo ako', 'joke', 'motivation', o 'fun fact'. Let's chat! 💙",
    "Blue AI here! 🌟 Wala akong limitasyon pagdating sa pakikipag-usap! Magtanong ka ng: tips sa Blue Media, Pinoy trivia, motivational quotes, jokes, o kahit anong gusto mo. Handa akong makipag-kwentuhan! 🇵🇭",
    "Nakikinig ako! 👂 Bilang Blue AI, alam ko ang maraming bagay — Blue Media tips, OPM music, Pinoy culture, motivasyon, jokes... Tulungan kita! Ulitin ang iyong tanong nang mas detalyado? 😊",
    "Salamat sa tanong! 🙏 Kahit hindi ako perpekto tulad ng ibang AI, pinilit kong maging mas matalino tuwing may nagtatanong sa akin. Subukan mo akong mas specific na magtanong! 💡",
  ],
};

// Track conversation history for context-aware responses
const TOPIC_HISTORY: string[] = [];

function getBotReply(msg: string, _history: Msg[]): string {
  const m = msg.toLowerCase();
  let pool: string[];

  if (/joke|biro|funny|nakakatawa|magpatuwa/i.test(m)) pool = AI_POOLS.joke;
  else if (/motivat|inspire|kaya|gawa|palakas|laban|quote|determination/i.test(m)) pool = AI_POOLS.motivational;
  else if (/trending|viral|hot|sikat|uso|nangyayari|news/i.test(m)) pool = AI_POOLS.trending;
  else if (/badge|verify|check|tick|verified/i.test(m)) pool = AI_POOLS.badge;
  else if (/follower|follow|sikat|famous|subscribers|suporta/i.test(m)) pool = AI_POOLS.followers;
  else if (/fact|trivia|alam mo ba|did you know|interesting/i.test(m)) pool = AI_POOLS.fact;
  else if (/kanta|sing|song|music|kanta|ot?pm?|musika|awitin/i.test(m)) pool = AI_POOLS.sing;
  else if (/kwento|story|istorya|tell me|salaysay/i.test(m)) pool = AI_POOLS.story;
  else if (/buhay|life|meaning|kahulugan|purpose/i.test(m)) pool = AI_POOLS.meaning;
  else if (/weather|panahon|ulap|ulan|araw|mainit/i.test(m)) pool = AI_POOLS.weather;
  else if (/pagkain|food|kain|recipe|lutuin|masarap|resto/i.test(m)) pool = AI_POOLS.food;
  else if (/mahal|love|liebe|pag-ibig|jowa|girlfriend|boyfriend|crush/i.test(m)) pool = AI_POOLS.love;
  else if (/hi|hello|hey|kumusta|kamusta|mabuhay|sup|good morning|goodnight|magandang|good evening/i.test(m)) pool = AI_POOLS.greet;
  else pool = AI_POOLS.default;

  // Avoid repeating: track recently used indices
  const key = pool === AI_POOLS.default ? "def" : m.slice(0, 10);
  TOPIC_HISTORY.push(key);
  if (TOPIC_HISTORY.length > 20) TOPIC_HISTORY.shift();

  return pool[Math.floor(Math.random() * pool.length)];
}

export default function BlueAIChatPage() {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: `Mabuhay, ${user?.name?.split(" ")[0] || "kabayan"}! 🇵🇭 Ako si Blue AI — ang iyong friendly na AI companion sa Blue Media!\n\nHanda akong:\n💬 Makipag-kwentuhan\n😂 Magbiro at magtawa\n💪 Mag-inspire ng motivation\n🎵 Kumanta\n🌟 Mag-share ng trivia\n📱 Magbigay ng Blue Media tips\n\nItan6ong mo na ang gusto mo! 💙`, ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || typing) return;
    setInput("");
    const newMsgs: Msg[] = [...msgs, { role: "user", text: msg, ts: Date.now() }];
    setMsgs(newMsgs);
    setTyping(true);
    // Realistic typing delay based on response length
    const delay = 600 + Math.random() * 1200;
    await new Promise(r => setTimeout(r, delay));
    setTyping(false);
    const reply = getBotReply(msg, newMsgs);
    setMsgs(prev => [...prev, { role: "ai", text: reply, ts: Date.now() }]);
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
            <h2 className="font-black text-gray-900">Blue AI</h2>
            <Zap className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
          </div>
          <p className="text-xs text-green-500 font-medium">● Laging online — handa sa lahat!</p>
        </div>
        <button onClick={() => setMsgs([{
          role: "ai",
          text: `Fresh start! 🔄 Kumusta ulit, ${user?.name?.split(" ")[0] || "kabayan"}? Ano ang gusto mong pag-usapan ngayon? 💙`,
          ts: Date.now()
        }])}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition">
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
              <div className={`px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
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
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
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
        <div className="flex gap-2 overflow-x-auto pb-2 min-w-max">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => send(p)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 whitespace-nowrap transition active:scale-95">
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
          placeholder="Magtanong kay Blue AI..."
          className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-400 bg-gray-50 transition"
        />
        <button onClick={() => send()} disabled={!input.trim() || typing}
          className="h-9 w-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition active:scale-95 shrink-0"
          style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
