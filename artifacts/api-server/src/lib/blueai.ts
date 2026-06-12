// Blue AI — free, no API key needed, uses pattern matching + rich responses
const KNOWLEDGE_BASE: Array<{ patterns: RegExp; responses: string[] }> = [
  {
    patterns: /hello|hi|kumusta|oy|hey|good morning|magandang|kamusta|sup|musta|helo/i,
    responses: [
      "Kumusta! Ako si BLUE AI 💙✨ — ang inyong personal na AI assistant dito sa Blue Media!\n\nPwede mo akong tanungin tungkol sa:\n📝 Features ng Blue Media\n🎓 School research at general knowledge\n💬 Advice at tips\n🔍 Paghanap ng impormasyon\n\nAno ang maari kong gawin para sa inyo?",
      "Hello! BLUE AI ito — nandito para tumulong sa lahat ng inyong katanungan! 😊💙\n\nAko ay isang libreng AI assistant — pwede mo akong tanungin tungkol sa kahit anong paksa!",
    ],
  },
  {
    patterns: /math|mathematics|algebra|geometry|calculus|equation|formula|arithmetic|numero|number|plus|minus|times|divide|calculate|compute/i,
    responses: [
      "Maari akong tumulong sa Math! 🧮\n\n**Basic Operations:**\n• Addition (+), Subtraction (-), Multiplication (×), Division (÷)\n• PEMDAS rule: Parentheses → Exponents → Multiply/Divide → Add/Subtract\n\n**Sabihin mo ang specific na problema mo at tutulong ako!** ✨",
      "Math tutor mode! 📐\n\nI-type mo ang equation o problema at tutulungan kita i-solve step by step. Halimbawa:\n• '2x + 5 = 15' → x = 5\n• 'Area ng circle r=7' → A = πr² = 153.94\n\nAno ang iyong math problem?",
    ],
  },
  {
    patterns: /science|biology|chemistry|physics|earth|atom|molecule|cell|evolution|gravity|energy|force|element|periodic/i,
    responses: [
      "Science time! 🔬⚗️\n\n**Quick Science Facts:**\n• Biology — pag-aaral ng buhay at mga organismo\n• Chemistry — pag-aaral ng matter at chemical reactions\n• Physics — pag-aaral ng forces, energy, at motion\n• Earth Science — pag-aaral ng ating planeta\n\nAno ang specific na topic sa Science ang gusto mong malaman?",
      "Ang Science ay sobrang interesting! 🌍🧬\n\nIto ang aking kaalaman: Ang universe ay nagsimula sa Big Bang ~13.8 billion years ago. Ang Pilipinas ay may 7,641 islands. Ang tubig ay H₂O — 2 hydrogen at 1 oxygen atom.\n\nAno pang science topic ang gusto mo?",
    ],
  },
  {
    patterns: /history|kasaysayan|world war|philippines|pilipinas|rizal|bonifacio|aquino|marcos|spanish|american|japanese|colonization/i,
    responses: [
      "Kasaysayan ng Pilipinas! 🇵🇭📚\n\n**Timeline:**\n• Pre-Colonial Era — mga sinaunang kabihasnan\n• 1565 — Pananakop ng mga Espanyol\n• 1896 — Rebolusyong Pilipino (Andres Bonifacio, Katipunan)\n• 1898 — Deklarasyon ng Kalayaan (Emilio Aguinaldo)\n• 1942-1945 — Japanese Occupation (WWII)\n• 1946 — Kalayaan mula sa Amerika\n• 1986 — EDSA People Power Revolution\n\nAno ang specific na bahagi ng kasaysayan ang interesado ka?",
      "History expert mode! 📖\n\nAng Philippines ay may mayamang kasaysayan. Si Dr. Jose Rizal ang ating Pambansang Bayani — sumulat siya ng Noli Me Tangere at El Filibusterismo para ilantad ang pang-aabuso ng mga Espanyol.\n\nAnong historical event o period ang gusto mong pag-aralan?",
    ],
  },
  {
    patterns: /english|grammar|essay|writing|sentence|paragraph|vocabulary|literature|novel|poem|story/i,
    responses: [
      "English tutor here! ✍️📝\n\n**Basic Grammar Rules:**\n• Subject + Verb + Object (SVO structure)\n• Capitalization: proper nouns, start of sentences\n• Punctuation: period (.), comma (,), question mark (?)\n• Tenses: Past, Present, Future\n\nPwede akong tumulong sa essay writing, grammar correction, at vocabulary! Anong tulong ang kailangan mo?",
      "Let me help with your English! 🌟\n\n**Essay Structure:**\n1. Introduction (thesis statement)\n2. Body paragraphs (3-5 supporting points)\n3. Conclusion (summary + call to action)\n\n**Tips:**\n• Use transition words: However, Furthermore, Therefore\n• Avoid repetition — use synonyms\n• Proofread after writing!\n\nAnong essay ang sinusulat mo?",
    ],
  },
  {
    patterns: /help|tulong|patulong|assist|tulungan|ano ang|how to|paano|what is|what are|explain|ipaliwanag/i,
    responses: [
      "Nandito ako para tumulong! 💙\n\nBilang BLUE AI, kaya ko ring sagutin ang tungkol sa:\n• 📚 School subjects (Math, Science, History, English, Filipino)\n• 💡 General knowledge at trivia\n• 🌐 Technology at internet tips\n• 💬 Blue Media features\n• 🧠 Advice at life tips\n\nItanong mo lang — walang bayad! 😊",
      "Maari akong tumulong! Sino ba si BLUE AI?\n\nAko ay isang AI assistant na libre para sa lahat ng Blue Media users! Araw at gabi ako available — walang pahinga! 💙\n\nPwede mo akong itanong kahit anong paksa. Ano ang gusto mong malaman?",
    ],
  },
  {
    patterns: /filipino|pilipino|tagalog|baybayin|wika|salita|panitikan|pamahalaang|kulturang/i,
    responses: [
      "Filipino/Tagalog tutor! 🇵🇭✨\n\n**Mga Bahagi ng Pangungusap:**\n• Paksa (Subject)\n• Panaguri (Predicate)\n• Layon (Object)\n\n**Mga Uri ng Pangungusap:**\n• Pasalaysay — nagbibigay ng impormasyon\n• Patanong — nagtatanong\n• Padamdam — nagpapahayag ng damdamin\n• Pautós — nagbibigay ng utos\n\nAno ang paksa sa Filipino ang gusto mong pag-aralan?",
    ],
  },
  {
    patterns: /rule|batas|bawal|policy|guideline|allowed|permitted|terms|condition/i,
    responses: [
      "Mga Alituntunin ng Blue Media 📋\n\n**BAWAL:**\n❌ Mura at masamang salita\n❌ Sexual at bastos na content\n❌ Harassment at bullying\n❌ Hate speech at diskriminasyon\n❌ Fake news at misinformation\n❌ Spam at scam\n\n**PINAPAYAGAN:**\n✅ Magkaibigan at mag-connect\n✅ Mag-share ng positibong content\n✅ Mag-express ng sariling opinyon (nang maayos)\n✅ Mag-report ng rule violations\n\nTandaan: Ang Blue Media ay isang SAFE SPACE para sa lahat! 💙",
    ],
  },
  {
    patterns: /post|share|mag.post|upload|create|gawa|larawan|picture|photo|video/i,
    responses: [
      "Paano mag-post sa Blue Media! 📱\n\n**Steps:**\n1. I-click ang 'What's on your mind?' sa Feed\n2. I-type ang iyong mensahe\n3. Pwedeng magdagdag ng:\n   📸 Photo (hanggang 20MB)\n   🎥 Video (hanggang 200MB — mp4, mov, webm)\n   🎨 Color background\n   😊 Feeling/Activity\n   📍 Location tag\n4. I-click ang 'Post' button!\n\n💡 Pro tip: Gumamit ng color background para mas eye-catching ang post mo!",
    ],
  },
  {
    patterns: /friend|kaibigan|add|connect|request/i,
    responses: [
      "Paano mag-add ng kaibigan sa Blue Media! 👫\n\n1. Hanapin ang profile ng taong gusto mong maging kaibigan\n2. I-click ang 'Add Friend' button\n3. Hintayin na i-accept nila\n4. Kapag accepted na — magkaibigan na kayo!\n\nAlternatively, pwede ring mag-Follow para makita ang kanilang posts kahit hindi kayo magkaibigan. 💙",
    ],
  },
  {
    patterns: /badge|verify|verified|checkmark|✓/i,
    responses: [
      "Ang Blue Badge ✓ ng Blue Media! 💙\n\nAng Blue Badge ay nagpapakita na ikaw ay verified na user. Libre ito para sa lahat!\n\nPaano mag-claim:\n1. Pumunta sa iyong Profile\n2. I-click ang '...' menu\n3. Piliin ang 'Claim Blue Badge'\n4. Done! 🎉\n\nAng Blue Badge ay permanent at libre — claim mo na ngayon! ✓💙",
    ],
  },
  {
    patterns: /video.?call|voice.?call|call|tawag|ring/i,
    responses: [
      "Video Call at Voice Call sa Blue Media! 📞🎥\n\n**Features:**\n• 📞 Voice Call — mag-usap gamit ang boses\n• 🎥 Video Call — mag-usap at magkita-kita\n• 👥 Group Video Call — sa group chat, lahat pwedeng sumali\n• 🎭 Video Effects — lagyan ng fun effects ang video mo\n• 🔇 Mute/Unmute — i-control ang mic mo\n• 📷 Camera on/off — pwede mong itago ang camera\n\nPumunta sa isang chat conversation at i-click ang 📞 o 🎥 button para magsimula! 💙",
    ],
  },
  {
    patterns: /live|livestream|mag-live|streaming/i,
    responses: [
      "Live Streaming sa Blue Media! 🔴📡\n\n**Paano mag-Live:**\n1. I-click ang 'Live' button sa Feed\n2. I-set ang title ng iyong live stream\n3. I-click ang 'Go Live' — automatic na makikita ng iyong mga kaibigan!\n4. Ang mga viewers ay pwedeng mag-react at mag-comment sa real-time\n5. I-click ang 'End Live' para tapusin\n\n🌟 Tip: Tiyaking malakas ang iyong internet connection para sa smooth streaming! 💙",
    ],
  },
  {
    patterns: /weather|panahon|ulan|araw|temperature|celsius|fahrenheit/i,
    responses: [
      "Weather info! 🌤️\n\nSa kasalukuyan, hindi ako makakonekta sa real-time weather data, pero maari kang:\n\n1. Mag-check ng weather.com\n2. I-Google ang 'Weather [iyong lugar]'\n3. I-check ang PAGASA website para sa Philippine weather updates\n\nPAGASA Website: bagong.pagasa.dost.gov.ph 🌧️☀️",
    ],
  },
  {
    patterns: /news|balita|current.?event|happen|nangyayari/i,
    responses: [
      "Para sa pinakabagong balita! 📰\n\nAko ay may limitadong access sa real-time news, pero narito ang mga trusted news sources sa Pilipinas:\n\n• 📺 ABS-CBN News — news.abs-cbn.com\n• 📺 GMA News — gmanews.tv\n• 📰 Philippine Daily Inquirer — inquirer.net\n• 📰 Manila Bulletin — mb.com.ph\n• 📱 Rappler — rappler.com\n\nPara sa international news:\n• BBC News — bbc.com/news\n• CNN — cnn.com 💙",
    ],
  },
  {
    patterns: /joke|biro|funny|nakakatawa|patawa|kwento/i,
    responses: [
      "Hahaha! Narito ang joke para sa iyo! 😄\n\n**Joke #1:**\nAnong tawag sa isang pating na may relo?\n— Lumang-gat! 🦈⌚ Hahaha!\n\n**Joke #2:**\nAnong tawag sa ahas na nag-aaral?\n— 'Ssss'-tudent! 🐍📚\n\n**Joke #3:**\nBakit ang manok ay tumawid sa daan?\n— Para makapunta sa kabila! 🐔\n\nHope that made you smile! 😊💙",
      "Heto ang korny pero nakakatawa! 😂\n\nAno ang sabi ng computer sa fridge?\n— 'Ikaw ba ang may RAM na malamig?' 🖥️❄️\n\nAnong tawag sa isang baboy na programmer?\n— 'Pig Data'! 🐷💻\n\nHahaha! Kumusta? Natatawa ka na ba? 😄💙",
    ],
  },
  {
    patterns: /food|pagkain|recipe|luto|kain|sarap|masarap|ulam|gata|adobo|sinigang/i,
    responses: [
      "Pagkain topic! 🍽️🇵🇭\n\n**Paboritong Lutong Pilipino:**\n🥘 Adobo — manok o baboy sa suka at toyo\n🍲 Sinigang — asim-asim na sabaw\n🥥 Kare-kare — mani sauce na may karne\n🍖 Lechon — inihaw na baboy\n🍛 Bicol Express — spicy na gata\n🐟 Paksiw na isda — pinaksiw na isda sa suka\n\nGusto mo bang malaman ang recipe ng isa sa mga ito? Sabihin mo lang! 😋💙",
    ],
  },
  {
    patterns: /love|mahal|crush|relationship|bf|gf|boyfriend|girlfriend|puso|kilig|heartbreak/i,
    responses: [
      "Advice sa love life! 💕\n\n**Tips para sa malusog na relasyon:**\n❤️ Komunikasyon — kausapin palagi ang partner mo\n🤝 Tiwala — magtiwala at magpakatotoo\n⏰ Quality time — gumugol ng oras magkasama\n🙏 Respeto — igalang ang isa't isa\n😊 Pagmamahal — ipakita ang pagmamahal sa maliliit na paraan\n\n**Paalala:** Mahalin mo muna ang sarili mo bago mahalin ang iba! 💙\n\nMay gustong tanungin tungkol sa relasyon? Nandito ako! 😊",
    ],
  },
  {
    patterns: /study|pag.aaral|school|eskwela|exam|test|quiz|homework|assignment|project/i,
    responses: [
      "Study tips mula sa BLUE AI! 📚✨\n\n**Effective Study Techniques:**\n1. 🍅 Pomodoro Method — 25 min study, 5 min break\n2. 🗺️ Mind Mapping — gumawa ng visual na diagram\n3. ✍️ Active Recall — subukan mong sagutin nang walang tingnan\n4. 😴 Tulog nang sapat — 8 hours para sa memory consolidation\n5. 📖 Spaced Repetition — ulitin ang natutunan after 1 day, 1 week\n\n**Best time to study:** 8am-11am at 3pm-6pm (peak brain hours)\n\nAno ang subject na gusto mong pag-aralan? Tutulungan kita! 💙",
    ],
  },
  {
    patterns: /technology|tech|computer|smartphone|internet|social media|app|website|coding|programming/i,
    responses: [
      "Technology topic! 💻🚀\n\n**Mga Trending Technologies ngayon:**\n• 🤖 Artificial Intelligence (AI) — tulad ko!\n• ☁️ Cloud Computing — data sa internet\n• 📱 5G Networks — mas mabilis na internet\n• ⛓️ Blockchain — secure na digital ledger\n• 🥽 Virtual Reality (VR) — virtual world\n• 🌐 Web3 — decentralized internet\n\n**Para sa coding beginners:**\n🐍 Python — pinaka-beginner friendly\n🌐 HTML/CSS — para sa websites\n📱 JavaScript — para sa interactive web apps\n\nAno pang technology topic ang gusto mong malaman? 💙",
    ],
  },
];

const defaultResponses = [
  "Salamat sa iyong mensahe! 💙 Narito pa rin ako para tumulong.\n\nBilang BLUE AI ng Blue Media, pwede mo akong tanungin tungkol sa:\n• 📚 Math, Science, History, English, Filipino\n• 💡 General knowledge at trivia\n• 🌐 Technology at social media tips\n• 💬 Blue Media features at tulong\n• 😊 Advice, jokes, at kasama sa chat!\n\nAno pa ang maari kong gawin para sa iyo? 😊",
  "Interesting! 🌟 Salamat sa pakikipag-usap sa akin.\n\nAko si BLUE AI — isang libre at palaging available na AI assistant para sa lahat ng Blue Media users!\n\nPwede mo akong tanungin kahit anong bagay — school, buhay, trivia, jokes, o tulong sa Blue Media. Nandito ako 24/7! 💙",
  "Naiintindihan kita! 💙\n\nKung may tanong ka sa:\n📚 **School** — Math, Science, History, English\n💻 **Tech** — programming, apps, internet\n😄 **Fun** — jokes, trivia, kwento\n💬 **Blue Media** — features at tulong\n\n...itanong mo lang sa akin! Laging nandito ang BLUE AI para sa inyo! ✨",
];

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateBlueAIResponse(message: string): string {
  for (const kb of KNOWLEDGE_BASE) {
    if (kb.patterns.test(message)) {
      return random(kb.responses);
    }
  }
  return random(defaultResponses);
}
