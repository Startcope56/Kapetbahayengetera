import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart3, Plus, X, Check, TrendingUp, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface PollOption { id: string; text: string; votes: number; }
interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  authorName: string;
  authorAvatar?: string;
  authorId?: number;
  createdAt: number;
  totalVotes: number;
  votedOption?: string;
}

const SEED_POLLS: Poll[] = [
  {
    id: "p1", question: "Saan ka mas gusto kumain? 🍜", totalVotes: 1247, createdAt: Date.now() - 3600000 * 5,
    authorName: "Blue Media Community", authorId: 0,
    options: [
      { id: "o1", text: "Jollibee 🐝", votes: 620 },
      { id: "o2", text: "McDonald's 🍟", votes: 387 },
      { id: "o3", text: "Mang Inasal 🍗", votes: 240 },
    ],
  },
  {
    id: "p2", question: "Ano ang pinaka-gusto mong feature sa Blue Media?", totalVotes: 892, createdAt: Date.now() - 86400000,
    authorName: "Blue Media Admin", authorId: 0,
    options: [
      { id: "o4", text: "Go Live 🔴", votes: 412 },
      { id: "o5", text: "Blue AI 🤖", votes: 298 },
      { id: "o6", text: "Video Page 🎬", votes: 182 },
    ],
  },
  {
    id: "p3", question: "Best Pinoy merienda? 🇵🇭", totalVotes: 563, createdAt: Date.now() - 86400000 * 2,
    authorName: "FoodiesPH Community",
    options: [
      { id: "o7", text: "Turon 🍌", votes: 241 },
      { id: "o8", text: "Fishball 🐟", votes: 186 },
      { id: "o9", text: "Kikiam 🥚", votes: 136 },
    ],
  },
  {
    id: "p4", question: "Anong oras ka pinaka-active sa Blue Media?", totalVotes: 734, createdAt: Date.now() - 86400000 * 3,
    authorName: "Blue Media Stats",
    options: [
      { id: "o10", text: "Umaga (6am-12pm) ☀️", votes: 198 },
      { id: "o11", text: "Hapon (12pm-6pm) 🌤️", votes: 203 },
      { id: "o12", text: "Gabi (6pm-12am) 🌙", votes: 333 },
    ],
  },
  {
    id: "p5", question: "Saang lugar sa Pilipinas gusto mong manirahan?", totalVotes: 1089, createdAt: Date.now() - 86400000 * 4,
    authorName: "TravelPH Pinoys",
    options: [
      { id: "o13", text: "Maynila 🏙️", votes: 312 },
      { id: "o14", text: "Cebu 🌺", votes: 289 },
      { id: "o15", text: "Davao 🦅", votes: 267 },
      { id: "o16", text: "Palawan 🏝️", votes: 221 },
    ],
  },
];

const STORAGE_KEY = "blue_media_polls_v2";

function loadPolls(): Poll[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return SEED_POLLS;
}

function savePolls(polls: Poll[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(polls)); } catch {}
}

const VOTED_KEY = "blue_media_poll_votes";
function loadVotes(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(VOTED_KEY) || "{}"); } catch { return {}; }
}
function saveVote(pollId: string, optionId: string) {
  const v = loadVotes();
  v[pollId] = optionId;
  try { localStorage.setItem(VOTED_KEY, JSON.stringify(v)); } catch {}
}

export default function PollsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [polls, setPolls] = useState<Poll[]>(() => {
    const base = loadPolls();
    const votes = loadVotes();
    return base.map(p => ({ ...p, votedOption: votes[p.id] }));
  });
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  // Save polls to localStorage whenever they change
  useEffect(() => { savePolls(polls); }, [polls]);

  const vote = (pollId: string, optionId: string) => {
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId || p.votedOption) return p;
      saveVote(pollId, optionId);
      return {
        ...p,
        votedOption: optionId,
        totalVotes: p.totalVotes + 1,
        options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o),
      };
    }));
    toast({ title: "Vote counted! 🗳️" });
  };

  const createPoll = () => {
    const validOpts = options.filter(o => o.trim());
    if (!question.trim() || validOpts.length < 2) {
      toast({ title: "Need a question and at least 2 options!", variant: "destructive" });
      return;
    }
    const newPoll: Poll = {
      id: `user_${Date.now()}`,
      question: question.trim(),
      totalVotes: 0,
      createdAt: Date.now(),
      authorName: user?.name || "You",
      authorId: user?.id,
      authorAvatar: user?.profilePicture || undefined,
      options: validOpts.map((t, i) => ({ id: `opt_${Date.now()}_${i}`, text: t.trim(), votes: 0 })),
    };
    setPolls(prev => [newPoll, ...prev]);
    setShowCreate(false);
    setQuestion("");
    setOptions(["", ""]);
    toast({ title: "Poll created! 🗳️", description: "Your poll has been posted." });
  };

  const totalVotesAll = polls.reduce((a, p) => a + p.totalVotes, 0);

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg">Polls 🗳️</h1>
              <p className="text-indigo-100 text-xs">Vote & see what Pilipinas thinks</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-white text-indigo-700 px-3 py-2 rounded-xl text-sm font-bold hover:bg-indigo-50 transition">
            <Plus className="h-4 w-4" /> Create
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-black text-gray-900 text-base">{polls.length}</p>
            <p className="text-xs text-gray-400">Active Polls</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-black text-gray-900 text-base">{totalVotesAll.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Total Votes</p>
          </div>
        </div>
      </div>

      {/* Polls list */}
      {polls.map(poll => (
        <div key={poll.id} className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={poll.authorAvatar} />
              <AvatarFallback className="font-bold text-xs" style={{ background: "#1877f2", color: "white" }}>
                {poll.authorName?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm text-gray-900">{poll.authorName}</p>
              <p className="text-xs text-gray-400">{formatDistanceToNow(poll.createdAt, { addSuffix: true })}</p>
            </div>
            {poll.votedOption && (
              <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Voted ✓</span>
            )}
          </div>

          <h3 className="font-black text-gray-900 text-base mb-3">{poll.question}</h3>

          <div className="space-y-2">
            {poll.options.map(opt => {
              const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
              const isVoted = poll.votedOption === opt.id;
              const hasVoted = !!poll.votedOption;
              const isWinning = hasVoted && opt.votes === Math.max(...poll.options.map(o => o.votes));
              return (
                <button key={opt.id} onClick={() => vote(poll.id, opt.id)} disabled={hasVoted}
                  className={`w-full rounded-xl overflow-hidden text-left transition relative ${!hasVoted && "hover:opacity-80 active:scale-[0.99]"}`}>
                  <div className={`relative flex items-center px-3 py-2.5 border-2 rounded-xl ${isVoted ? "border-blue-500" : isWinning ? "border-green-400" : "border-gray-100"}`}>
                    {hasVoted && (
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        <div className="h-full transition-all duration-700 rounded-xl"
                          style={{ width: `${pct}%`, background: isVoted ? "rgba(24,119,242,0.12)" : isWinning ? "rgba(34,197,94,0.08)" : "rgba(0,0,0,0.04)" }} />
                      </div>
                    )}
                    <span className="relative font-medium text-sm text-gray-800 flex-1">{opt.text}</span>
                    {hasVoted && (
                      <span className={`relative text-xs font-black ml-2 ${isVoted ? "text-blue-600" : isWinning ? "text-green-600" : "text-gray-400"}`}>{pct}%</span>
                    )}
                    {isVoted && (
                      <span className="relative ml-2 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                    {isWinning && !isVoted && hasVoted && (
                      <span className="relative ml-2 text-xs text-green-600 font-bold">🏆</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2.5">
            <p className="text-xs text-gray-400">
              {poll.totalVotes.toLocaleString()} votes
            </p>
            {!poll.votedOption && (
              <p className="text-xs text-blue-500 font-medium">Tap to vote</p>
            )}
          </div>
        </div>
      ))}

      {/* Create poll modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Create Poll 🗳️</h3>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <textarea placeholder="Ask your question here..." value={question} onChange={e => setQuestion(e.target.value)}
              className="w-full border rounded-xl p-2.5 text-sm resize-none outline-none focus:border-indigo-400"
              rows={2} />

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">OPTIONS (min. 2)</p>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={opt} onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                  {options.length > 2 && (
                    <button onClick={() => setOptions(prev => prev.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button onClick={() => setOptions(prev => [...prev, ""])}
                  className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:text-indigo-700">
                  <Plus className="h-3.5 w-3.5" /> Add option
                </button>
              )}
            </div>

            <button onClick={createPoll}
              disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
              className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 transition"
              style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }}>
              Post Poll 🗳️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
