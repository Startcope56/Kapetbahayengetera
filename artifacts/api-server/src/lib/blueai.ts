const SYSTEM_PROMPT = `Ikaw si BLUE AI — ang official na AI assistant ng Blue Media, isang social media platform para sa mga Pilipino. 
Ikaw ay friendly, helpful, at nagsasalita ng Tagalog/Filipino mixed with English (Taglish).
Sumasagot ka ng tanong tungkol sa: Blue Media features, school subjects (Math, Science, History, English, Filipino), 
general knowledge, advice, jokes, trivia, at kahit anong paksa.
Maikli at malinaw ang iyong mga sagot. Gumamit ng emojis. Lagi kang positive at encouraging.
Ang Blue Media ay may features: Posts (image, video, color backgrounds, feelings, activities, location), 
Stories, Chat (DM at Group), Reactions (Love, Haha, Sad, Angry), Friends, Notifications, Live streaming,
Blue Badge (verified mark), Leaderboard, Marketplace, Games, Polls, Events, at ikaw (Blue AI).
Ang Blue Media ay ginawa ni JV Channel (Jonathan Villanueva) para sa mga Pilipino.`;

async function callPollinations(messages: Array<{ role: string; content: any }>): Promise<string> {
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
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Pollinations error: ${res.status}`);
    const text = await res.text();
    return text.trim() || fallbackResponse(messages[messages.length - 1]?.content || "");
  } catch {
    return fallbackResponse(messages[messages.length - 1]?.content || "");
  }
}

function fallbackResponse(msg: string): string {
  const m = typeof msg === "string" ? msg.toLowerCase() : "";
  if (/hello|hi|kumusta|kamusta/i.test(m)) return "Kumusta! Ako si BLUE AI 💙 — nandito para tumulong sa inyo! Ano ang gusto mong malaman?";
  if (/joke|biro|funny/i.test(m)) return "Hahaha! Anong tawag sa isang pating na may relo? — Lumang-gat! 🦈⌚ Natatawa ka na ba? 😄💙";
  if (/mahal|love|pag-ibig/i.test(m)) return "Ang tunay na pagmamahal ay walang kondisyon. Mahalin mo muna ang sarili mo! ❤️💙";
  return "Salamat sa tanong! 💙 Bilang BLUE AI, lagi akong nandito para tumulong. Pwede mo akong tanungin tungkol sa school, Blue Media features, jokes, advice, o kahit anong bagay! 😊";
}

export async function generateBlueAIResponse(message: string): Promise<string> {
  return callPollinations([{ role: "user", content: message }]);
}

export async function generateBlueAIResponseWithImage(message: string, imageUrl: string): Promise<string> {
  return callPollinations([{
    role: "user",
    content: [
      { type: "text", text: message || "Ano ito sa picture?" },
      { type: "image_url", image_url: { url: imageUrl } },
    ],
  }]);
}

export async function generateBlueAIResponseWithHistory(messages: Array<{ role: "user" | "assistant"; content: string }>): Promise<string> {
  return callPollinations(messages);
}
