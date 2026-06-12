import { useState } from "react";
import { CalendarDays, MapPin, Users, Plus, X, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  organizer: string;
  organizerAvatar?: string;
  attendees: number;
  isGoing: boolean;
  color: string;
}

const EVENT_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-pink-500 to-rose-600",
  "from-green-500 to-teal-600",
  "from-purple-500 to-violet-600",
  "from-orange-500 to-amber-600",
];

const DEMO_EVENTS: Event[] = [
  { id: "1", title: "Blue Media Community Meetup 🇵🇭", description: "Join us for our first-ever Pinoy Blue Media community gathering! Meet new friends, share stories.", date: "2026-07-04", time: "3:00 PM", location: "Luneta Park, Manila", category: "Meetup", organizer: "Blue Media Admin", attendees: 142, isGoing: false, color: "from-blue-500 to-indigo-600" },
  { id: "2", title: "Online Gaming Tournament 🎮", description: "Mobile Legends & MLBB tournament! ₱5,000 prize pool. Register your team now!", date: "2026-06-20", time: "6:00 PM", location: "Online (Discord)", category: "Gaming", organizer: "GamersPh", attendees: 87, isGoing: false, color: "from-purple-500 to-violet-600" },
  { id: "3", title: "Pinoy Food Festival 🍜", description: "Taste the best Pinoy delicacies! Sinigang, kare-kare, lechon and more!", date: "2026-06-28", time: "10:00 AM", location: "SM North EDSA", category: "Food", organizer: "PinoyFoodies", attendees: 234, isGoing: false, color: "from-orange-500 to-amber-600" },
];

export default function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>(DEMO_EVENTS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", time: "", location: "", category: "Meetup" });

  const toggleGoing = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, isGoing: !e.isGoing, attendees: e.isGoing ? e.attendees - 1 : e.attendees + 1 } : e));
    const event = events.find(e => e.id === id);
    if (event) toast({ title: event.isGoing ? "Removed from your events" : `You're going to ${event.title}! 🎉` });
  };

  const createEvent = () => {
    if (!form.title || !form.date) return;
    const newEvent: Event = {
      id: Math.random().toString(36).slice(2),
      title: form.title, description: form.description,
      date: form.date, time: form.time || "TBD",
      location: form.location || "TBD",
      category: form.category,
      organizer: user?.name || "",
      organizerAvatar: user?.profilePicture || undefined,
      attendees: 1, isGoing: true,
      color: EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)],
    };
    setEvents(prev => [newEvent, ...prev]);
    setShowCreate(false);
    setForm({ title: "", description: "", date: "", time: "", location: "", category: "Meetup" });
    toast({ title: "Event created! 🎉" });
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg">Events 🎉</h1>
              <p className="text-indigo-100 text-xs">Discover & create events</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-white text-indigo-700 px-3 py-2 rounded-xl text-sm font-bold hover:bg-indigo-50 transition">
            <Plus className="h-4 w-4" /> Create
          </button>
        </div>
      </div>

      {/* Events list */}
      {events.map(event => {
        const eventDate = new Date(`${event.date}T${event.time.replace(" ", "T").replace(" PM", ":00").replace(" AM", ":00") || "00:00:00"}`);
        const isPast = eventDate < new Date();
        return (
          <div key={event.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Color banner */}
            <div className={`h-16 bg-gradient-to-r ${event.color} px-4 py-3 flex items-end`}>
              <span className="text-white text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{event.category}</span>
              {isPast && <span className="ml-auto text-white text-xs bg-black/30 px-2 py-0.5 rounded-full">Past Event</span>}
            </div>
            <div className="p-4">
              <h3 className="font-black text-gray-900 text-base mb-1">{event.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{event.description}</p>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{new Date(event.date).toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5 text-red-500" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span>{event.attendees} going</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={event.organizerAvatar} />
                    <AvatarFallback className="text-[8px] font-bold bg-indigo-500 text-white">{event.organizer[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-500">by {event.organizer}</span>
                </div>
                {!isPast && (
                  <button onClick={() => toggleGoing(event.id)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                      event.isGoing ? "bg-green-100 text-green-700 hover:bg-green-200" : "text-white hover:opacity-90"
                    }`}
                    style={!event.isGoing ? { background: "linear-gradient(135deg,#1877f2,#0a6bc7)" } : undefined}>
                    {event.isGoing ? "✓ Going" : "Attend"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Create event modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-4 space-y-3 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Create Event</h3>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <Input placeholder="Event title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border rounded-xl p-2.5 text-sm resize-none outline-none focus:border-blue-400" rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time</label>
                <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="rounded-xl" />
              </div>
            </div>
            <Input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="rounded-xl" />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border rounded-xl p-2.5 text-sm outline-none focus:border-blue-400">
              {["Meetup","Gaming","Food","Sports","Music","Education","Business","Other"].map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={createEvent} disabled={!form.title || !form.date}
              className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              Create Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
