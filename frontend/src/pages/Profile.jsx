import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import CreationCard from "../components/CreationCard";
import { Coins, Cube, Trophy, Heart } from "@phosphor-icons/react";

export default function Profile() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (user) api.get("/me/generations").then((r) => setItems(r.data.items || [])).catch(() => {});
  }, [user]);

  if (user === null) return <div className="p-12 text-center text-zinc-500">Loading…</div>;
  if (user === false) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h1 className="font-display text-3xl font-black uppercase tracking-tighter mb-3">Sign in</h1>
        <p className="text-zinc-400 mb-6">Log in to see your creations.</p>
        <Link to="/login" className="btn-volt rounded-full px-6 py-3 text-sm">Log in</Link>
      </div>
    );
  }

  const totalLikes = items.reduce((sum, i) => sum + (i.likes || 0), 0);
  const totalWins = items.reduce((sum, i) => sum + (i.battle_wins || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-[#ccff00] mb-2">Creator profile</p>
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter">
            @{user.name}
          </h1>
          <p className="text-zinc-400 text-sm mt-2">{user.email} · {user.plan.toUpperCase()} plan</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<Cube size={20} weight="duotone" />} label="Creations" value={items.length} />
          <Stat icon={<Heart size={20} weight="duotone" />} label="Likes" value={totalLikes} color="#ff0055" />
          <Stat icon={<Trophy size={20} weight="duotone" />} label="Wins" value={totalWins} color="#00f0ff" />
        </div>
      </div>

      <div className="glass rounded-2xl p-5 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Coins size={28} weight="duotone" className="text-[#ccff00]" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400">Credits remaining</p>
            <p className="font-display text-3xl font-black">{user.credits}</p>
          </div>
        </div>
        <Link to="/pricing" className="btn-volt rounded-full px-5 py-2.5 text-sm">Get more credits</Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="mb-4">No creations yet.</p>
          <Link to="/studio" className="btn-volt rounded-full px-6 py-3 text-sm">Make your first item</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
          {items.map((it) => <CreationCard key={it.id} item={it} compact />)}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, color = "#ccff00" }) {
  return (
    <div className="bg-zinc-900/60 border border-white/8 rounded-xl px-4 py-3 min-w-[100px]">
      <div className="flex items-center gap-2" style={{ color }}>{icon}</div>
      <p className="font-display text-2xl font-black mt-1">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">{label}</p>
    </div>
  );
}
