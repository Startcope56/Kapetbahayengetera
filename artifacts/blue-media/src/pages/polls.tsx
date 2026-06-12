import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart3, Plus, X, ChevronRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface PollOption { id: string; text: string; votes: number; }
interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  authorName: string;
  authorAvatar?: string;
  createdAt: number;
  totalVotes: number;
  votedOption?: string;
  endsAt?: number;
}

const DEMO_POLLS: Poll[] = [
  {
    id: "p1", question: "Saan ka mas gusto kumain? 🍜", totalVotes: 234, createdAt: Date.now() - 3600000 * 3, votedOption: undefined,
    authorName: "Blue Media Community", authorAvatar: undefined,
    options: [
      { id: "o1", text: "Jollibee 🐝", votes: 120 },
      { id: "o2", text: "McDonald's 🍟", votes: 67 },
      { id: "o3", text: "Mang Inasal 🍗", votes: 47 },
    ],
  },
  {
    id: "p2", question: "Ano ang pinaka-gusto mong feature sa Blue Media?", totalVotes: 156, createdAt: Date.now() - 86400000, votedOption: undefined,
    authorName: "Blue Media Admin",
    options: [
      { id: "o4", text: "Go Live 🔴", votes: 78 },
      { id: "o5", text: "Stories 📸", votes: 45 },
      { id: "o6", text: "Blue AI 🤖", votes: 33 },
    ],
  },
  {
    id: "p3", question: "Best Pinoy merienda? 🇵🇭", totalVotes: 89, createdAt: Date.now() - 86400000 * 2, votedOption: undefined,
    authorName: "FoodiesPH",
    options: [
      { id: "o7", text: "Turon 🍌", votes: 40 },
      { id: "o8", text: "Fishball 🐟", votes: 28 },
      { id: "o9", text: "Kikiam 🥚", votes: 21 },
    ],
  },
];

export default function PollsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [polls, setPolls] = useState<Poll[]>(DEMO_POLLS);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const vote = (pollId: string, optionId: string) => {
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId || p.votedOption) return p;
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
    if (!question.trim() || validOpts.length < 2) return;
    const newPoll: Poll = {
      id: Math.random().toString(36).slice(2),
      question, totalVotes: 0, createdAt: Date.now(), votedOption: undefined,
      authorName: user?.name || "",
      authorAvatar: user?.profilePicture || undefined,
      options: validOpts.map((t, i) => ({ id: `new_${i}`, text: t, votes: 0 })),
    };
    setPolls(prev => [newPoll, ...prev]);
    setShowCreate(false);
    setQuestion("");
    setOptions(["", ""]);
    toast({ title: "Poll created! 🗳️" });
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg">Polls 🗳️</h1>
              <p className="text-blue-100 text-xs">Vote & see what Pilipinas thinks</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-white text-blue-700 px-3 py-2 rounded-xl text-sm font-bold hover:bg-blue-50 transition">
            <Plus className="h-4 w-4" /> Create
          </button>
        </div>
      </div>

      {/* Polls */}
      {polls.map(poll => (
        <div key={poll.id} className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={poll.authorAvatar} />
              <AvatarFallback className="font-bold text-xs" style={{ background: "#1877f2", color: "white" }}>{poll.authorName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm text-gray-900">{poll.authorName}</p>
              <p className="text-xs text-gray-400">{formatDistanceToNow(poll.createdAt, { addSuffix: true })}</p>
            </div>
          </div>

          <h3 className="font-black text-gray-900 text-base mb-3">{poll.question}</h3>

          <div className="space-y-2">
            {poll.options.map(opt => {
              const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
              const isVoted = poll.votedOption === opt.id;
              const hasVoted = !!poll.votedOption;
              return (
                <button key={opt.id} onClick={() => vote(poll.id, opt.id)}
                  disabled={hasVoted}
                  className={`w-full rounded-xl overflow-hidden text-left transition relative ${
                    hasVoted ? "cursor-default" : "hover:opacity-80 active:scale-[0.99]"
                  } ${isVoted ? "ring-2 ring-blue-500" : ""}`}>
                  <div className="relative flex items-center px-3 py-2.5 border rounded-xl"
                    style={isVoted ? { borderColor: "#1877f2" } : { borderColor: "#e5e7eb" }}>
                    {/* Progress bar */}
                    {hasVoted && (
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        <div className="h-full transition-all duration-700 rounded-xl"
                          style={{ width: `${pct}%`, background: isVoted ? "rgba(24,119,242,0.12)" : "rgba(0,0,0,0.04)" }} />
                      </div>
                    )}
                    <span className="relative font-medium text-sm text-gray-800 flex-1">{opt.text}</span>
                    {hasVoted && (
                      <span className="relative text-xs font-bold text-gray-500 ml-2">{pct}%</span>
                    )}
                    {isVoted && (
                      <span className="relative ml-2 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-2">{poll.totalVotes.toLocaleString()} votes · {formatDistanceToNow(poll.createdAt, { addSuffix: true })}</p>
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

            <textarea placeholder="Ask a question..." value={question} onChange={e => setQuestion(e.target.value)}
              className="w-full border rounded-xl p-2.5 text-sm resize-none outline-none focus:border-blue-400"
              rows={2} />

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">OPTIONS</p>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={opt} onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
                  {options.length > 2 && (
                    <button onClick={() => setOptions(prev => prev.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 5 && (
                <button onClick={() => setOptions(prev => [...prev, ""])}
                  className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:text-blue-700">
                  <Plus className="h-3.5 w-3.5" /> Add option
                </button>
              )}
            </div>

            <button onClick={createPoll} disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
              className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}>
              Post Poll
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
