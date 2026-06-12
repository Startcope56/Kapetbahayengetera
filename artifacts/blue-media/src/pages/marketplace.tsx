import { useState } from "react";
import { ShoppingBag, Tag, Plus, X, Search, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  imageUrl?: string;
  category: string;
  sellerName: string;
  sellerAvatar?: string;
  location: string;
  createdAt: number;
}

const CATEGORIES = ["All", "Electronics", "Fashion", "Home", "Food", "Services", "Vehicles", "Other"];

const DEMO_LISTINGS: Listing[] = [
  { id: "1", title: "Samsung Galaxy A54", price: 15000, description: "Like new, 1 month old, complete accessories.", category: "Electronics", sellerName: "Juan dela Cruz", location: "Marikina", createdAt: Date.now() - 86400000 * 2, sellerAvatar: undefined },
  { id: "2", title: "Homemade Sinigang", price: 120, description: "Fresh, good for 2-3 servings. Order by batch!", category: "Food", sellerName: "Maria Santos", location: "Quezon City", createdAt: Date.now() - 3600000, sellerAvatar: undefined },
  { id: "3", title: "Ukay-Ukay Bundle", price: 500, description: "10 pieces mixed clothes, all clean and good quality!", category: "Fashion", sellerName: "Pedro Reyes", location: "Manila", createdAt: Date.now() - 86400000, sellerAvatar: undefined },
  { id: "4", title: "Freelance Web Design", price: 3000, description: "Landing page for your business. 3-5 days delivery.", category: "Services", sellerName: "Josie Lim", location: "Online", createdAt: Date.now() - 3600000 * 5, sellerAvatar: undefined },
];

export default function MarketplacePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>(DEMO_LISTINGS);
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", price: "", description: "", category: "Electronics", location: "" });

  const filtered = listings.filter(l =>
    (category === "All" || l.category === category) &&
    (l.title.toLowerCase().includes(q.toLowerCase()) || l.description.toLowerCase().includes(q.toLowerCase()))
  );

  const createListing = () => {
    if (!form.title || !form.price) return;
    const newListing: Listing = {
      id: Math.random().toString(36).slice(2),
      title: form.title,
      price: parseFloat(form.price),
      description: form.description,
      category: form.category,
      sellerName: user?.name || "",
      sellerAvatar: user?.profilePicture || undefined,
      location: form.location || "Philippines",
      createdAt: Date.now(),
    };
    setListings(prev => [newListing, ...prev]);
    setShowCreate(false);
    setForm({ title: "", price: "", description: "", category: "Electronics", location: "" });
    toast({ title: "Listing posted! 🛍️" });
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg">Marketplace 🛍️</h1>
              <p className="text-green-100 text-xs">Buy & sell in your community</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-white text-green-700 px-3 py-2 rounded-xl text-sm font-bold hover:bg-green-50 transition">
            <Plus className="h-4 w-4" /> Sell
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search listings..." className="pl-9 rounded-xl bg-white" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              category === c ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Listings grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(l => (
          <div key={l.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer">
            <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              {l.imageUrl ? (
                <img src={l.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="h-10 w-10 text-gray-300" />
              )}
            </div>
            <div className="p-2.5">
              <p className="font-bold text-gray-900 text-sm truncate">{l.title}</p>
              <p className="font-black text-green-600 text-base">₱{l.price.toLocaleString()}</p>
              <p className="text-[11px] text-gray-400 truncate">{l.description}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={l.sellerAvatar} />
                  <AvatarFallback className="text-[8px] font-bold bg-blue-500 text-white">{l.sellerName[0]}</AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-gray-500 truncate">{l.sellerName}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">📍 {l.location}</p>
              <button className="w-full mt-2 py-1.5 rounded-xl text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg,#1877f2,#0a6bc7)" }}
                onClick={() => toast({ title: `Message ${l.sellerName}`, description: "Feature: Chat with seller about this item!" })}>
                Message Seller
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>No listings found</p>
        </div>
      )}

      {/* Create listing modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Create Listing</h3>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <Input placeholder="Item title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" />
            <Input type="number" placeholder="Price (₱)" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="rounded-xl" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border rounded-xl p-2.5 text-sm resize-none outline-none focus:border-blue-400" rows={2} />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border rounded-xl p-2.5 text-sm outline-none focus:border-blue-400">
              {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
            </select>
            <Input placeholder="Location (e.g. Marikina)" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="rounded-xl" />
            <button onClick={createListing} disabled={!form.title || !form.price}
              className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 transition"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
              Post Listing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
