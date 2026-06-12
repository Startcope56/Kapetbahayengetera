import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Trophy, RefreshCw, Star, Zap } from "lucide-react";

// ── Word Guess (Wordle-like with Tagalog words) ──────────────────────────────
const WORDS = ["BAYAN", "MAGAL", "PILAK", "ARAW", "GABI", "TUBIG", "HANGIN", "LUPA"];
const GRID_ROWS = 6;

function WordGuess() {
  const [target] = useState(() => {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    return w.slice(0, 5).padEnd(5, "A");
  });
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);

  const submit = () => {
    if (current.length !== 5 || won || lost) return;
    const next = [...guesses, current.toUpperCase()];
    setGuesses(next);
    setCurrent("");
    if (current.toUpperCase() === target) setWon(true);
    else if (next.length >= GRID_ROWS) setLost(true);
  };

  const getLetterColor = (letter: string, idx: number, word: string) => {
    if (word[idx] === target[idx]) return "bg-green-500 text-white border-green-500";
    if (target.includes(word[idx])) return "bg-yellow-400 text-white border-yellow-400";
    return "bg-gray-600 text-white border-gray-600";
  };

  const reset = () => { setGuesses([]); setCurrent(""); setWon(false); setLost(false); };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <h3 className="font-black text-gray-900 text-lg">Word Guess 🇵🇭</h3>
        <p className="text-xs text-gray-500">Guess the 5-letter word in {GRID_ROWS} tries!</p>
      </div>

      {/* Grid */}
      <div className="space-y-1.5 flex flex-col items-center">
        {Array.from({ length: GRID_ROWS }).map((_, r) => {
          const word = guesses[r] ?? "";
          const isActive = r === guesses.length && !won && !lost;
          return (
            <div key={r} className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, c) => {
                const letter = word[c] ?? (isActive ? current[c] ?? "" : "");
                const revealed = !!guesses[r];
                return (
                  <div key={c}
                    className={`h-11 w-11 border-2 rounded-lg flex items-center justify-center font-black text-lg uppercase transition-all ${
                      revealed ? getLetterColor(letter, c, word) :
                      isActive && letter ? "border-gray-400 text-gray-900" :
                      "border-gray-200 text-transparent"
                    }`}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Result */}
      {(won || lost) && (
        <div className={`text-center p-3 rounded-xl ${won ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          <p className="font-black text-lg">{won ? "🎉 You got it!" : "😔 Better luck next time!"}</p>
          <p className="text-sm">The word was: <strong>{target}</strong></p>
          <button onClick={reset} className="mt-2 px-4 py-1.5 rounded-xl bg-current/10 text-sm font-bold">
            Play Again
          </button>
        </div>
      )}

      {/* Keyboard */}
      {!won && !lost && (
        <div className="space-y-1.5">
          {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map(row => (
            <div key={row} className="flex justify-center gap-1">
              {row.split("").map(k => (
                <button key={k} onClick={() => current.length < 5 && setCurrent(c => c + k)}
                  className="h-10 min-w-[28px] px-2 bg-gray-200 rounded-lg text-xs font-bold text-gray-800 hover:bg-gray-300 transition active:scale-95">
                  {k}
                </button>
              ))}
            </div>
          ))}
          <div className="flex justify-center gap-2 mt-1">
            <button onClick={() => setCurrent(c => c.slice(0, -1))}
              className="px-3 py-2 bg-gray-300 rounded-lg text-xs font-bold hover:bg-gray-400 transition">⌫</button>
            <button onClick={submit} disabled={current.length !== 5}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition"
              style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
              ENTER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Trivia ──────────────────────────────────────────────────────────────────
const TRIVIA = [
  { q: "Sino ang pangunahing bayani ng Pilipinas?", opts: ["Jose Rizal","Andres Bonifacio","Emilio Aguinaldo","Apolinario Mabini"], a: 0 },
  { q: "Ano ang national bird ng Pilipinas?", opts: ["Maya","Philippine Eagle","Kalapati","Agila"], a: 1 },
  { q: "Ilan ang isla ng Pilipinas?", opts: ["7,107","7,641","6,000","8,000"], a: 1 },
  { q: "Ano ang national flower ng Pilipinas?", opts: ["Rosal","Gumamela","Sampaguita","Orchid"], a: 2 },
  { q: "Saan matatagpuan ang Chocolate Hills?", opts: ["Cebu","Bohol","Palawan","Leyte"], a: 1 },
  { q: "Anong taon nagsimula ang Blue Media?", opts: ["2023","2024","2025","2026"], a: 3 },
];

function TriviaGame() {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const q = TRIVIA[qIdx];

  const answer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.a) setScore(s => s + 1);
    setTimeout(() => {
      if (qIdx + 1 < TRIVIA.length) { setQIdx(n => n + 1); setSelected(null); }
      else setDone(true);
    }, 1200);
  };

  const reset = () => { setQIdx(0); setScore(0); setSelected(null); setDone(false); };

  if (done) {
    return (
      <div className="p-6 text-center">
        <div className="text-5xl mb-3">{score >= 5 ? "🏆" : score >= 3 ? "😊" : "📚"}</div>
        <h3 className="font-black text-xl text-gray-900">Quiz Done!</h3>
        <p className="text-gray-500 mb-1">{score}/{TRIVIA.length} correct</p>
        <p className="text-sm font-semibold text-blue-600 mb-4">
          {score >= 5 ? "Excellent! You know your Pilipinas well! 🇵🇭" : score >= 3 ? "Not bad! Keep learning!" : "Keep studying, Kabayan!"}
        </p>
        <button onClick={reset} className="px-6 py-2.5 rounded-xl text-white font-bold"
          style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Question {qIdx + 1}/{TRIVIA.length}</span>
        <span className="text-xs font-bold text-blue-600">Score: {score}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${((qIdx) / TRIVIA.length) * 100}%` }} />
      </div>
      <h3 className="font-black text-gray-900 text-base">{q.q}</h3>
      <div className="space-y-2">
        {q.opts.map((opt, i) => (
          <button key={i} onClick={() => answer(i)} disabled={selected !== null}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium text-sm transition ${
              selected === null ? "border-gray-200 hover:border-blue-400 hover:bg-blue-50" :
              i === q.a ? "border-green-500 bg-green-50 text-green-700" :
              i === selected ? "border-red-400 bg-red-50 text-red-700" :
              "border-gray-200 text-gray-400"
            }`}>
            {String.fromCharCode(65 + i)}. {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<"word" | "trivia" | null>(null);

  const games = [
    { id: "word" as const, emoji: "🔤", title: "Word Guess", desc: "Guess the 5-letter word!", color: "from-green-400 to-emerald-600" },
    { id: "trivia" as const, emoji: "🧠", title: "Pinoy Trivia", desc: "Test your Pilipinas knowledge!", color: "from-blue-500 to-indigo-600" },
  ];

  if (activeGame) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-gray-100">
          <button onClick={() => setActiveGame(null)} className="text-gray-400 hover:text-gray-600 transition">
            ← Back
          </button>
          <span className="font-bold text-gray-900 ml-1">
            {activeGame === "word" ? "🔤 Word Guess" : "🧠 Pinoy Trivia"}
          </span>
        </div>
        {activeGame === "word" ? <WordGuess /> : <TriviaGame />}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-5 text-white text-center">
        <div className="text-4xl mb-2">🎮</div>
        <h1 className="font-black text-xl">Blue Media Games</h1>
        <p className="text-purple-100 text-sm">Play and have fun with your community!</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {games.map(g => (
          <button key={g.id} onClick={() => setActiveGame(g.id)}
            className={`bg-gradient-to-br ${g.color} rounded-2xl p-5 text-white text-center hover:opacity-90 transition active:scale-95`}>
            <div className="text-4xl mb-2">{g.emoji}</div>
            <p className="font-black text-sm">{g.title}</p>
            <p className="text-white/70 text-xs mt-0.5">{g.desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
        <Trophy className="h-8 w-8 mx-auto text-yellow-400 mb-2" />
        <p className="font-bold text-gray-900">More games coming soon!</p>
        <p className="text-sm text-gray-500">We're working on Pinoy-themed games just for you 🇵🇭</p>
      </div>
    </div>
  );
}
