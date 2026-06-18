import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import CreationCard from "../components/CreationCard";
import { TID } from "../constants/testIds";

export default function Feed() {
  const [items, setItems] = useState([]);
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const load = useCallback(async (s) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/feed?sort=${s}&limit=60`);
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(sort); }, [sort, load]);

  const handleLike = (id, liked) => {
    setItems((prev) => prev.map((it) =>
      it.id === id ? { ...it, is_liked: liked, likes: it.likes + (liked ? 1 : -1) } : it
    ));
  };

  const handleRemix = async (item) => {
    try {
      const { data } = await api.post(`/generations/${item.id}/remix`);
      // Redirect to studio with the prefilled prompt via a sessionStorage handoff
      sessionStorage.setItem("remix_seed", JSON.stringify(data));
      toast.success("Loaded into Studio — tweak & generate!");
      nav("/studio");
    } catch {
      toast.error("Remix failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-[#ccff00] mb-2">Community</p>
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter">
            The Drop
          </h1>
          <p className="text-zinc-400 text-sm mt-2">Every creation. Every creator. Like, remix, and ship.</p>
        </div>
        <div className="flex gap-1 bg-zinc-900/60 rounded-full p-1 border border-white/8">
          {[
            ["recent", "Recent", TID.feedSortRecent],
            ["popular", "Popular", TID.feedSortPopular],
            ["trending", "Trending", TID.feedSortTrending],
          ].map(([k, label, tid]) => (
            <button
              key={k}
              data-testid={tid}
              onClick={() => setSort(k)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                sort === k ? "bg-[#ccff00] text-black" : "text-zinc-300 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-zinc-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">No creations yet. Be the first!</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
          {items.map((item) => (
            <CreationCard key={item.id} item={item} onLikeToggle={handleLike} onRemix={handleRemix} />
          ))}
        </div>
      )}
    </div>
  );
}
