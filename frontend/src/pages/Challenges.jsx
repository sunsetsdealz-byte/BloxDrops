import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Crown, FireSimple, Calendar } from "@phosphor-icons/react";
import { api } from "../lib/api";

export default function Challenges() {
  const [today, setToday] = useState(null);
  const [all, setAll] = useState([]);
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    api.get("/challenges/today").then((r) => setToday(r.data.challenge)).catch(() => {});
    api.get("/challenges").then((r) => setAll(r.data.items || [])).catch(() => {});
    api.get("/leaderboard?limit=10").then((r) => setLeaders(r.data.items || [])).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] font-bold text-[#00f0ff] mb-2 flex items-center gap-2">
          <Calendar size={14} weight="fill" /> Daily themes
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter">
          Challenges
        </h1>
      </div>

      {today && (
        <div className="relative rounded-3xl overflow-hidden border border-[#ccff00]/40 mb-10 p-8 md:p-12 bg-gradient-to-br from-[#ccff00]/10 via-transparent to-[#ff0055]/10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-[250px]">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#ccff00] bg-black/40 rounded-full px-3 py-1 inline-block">
                <FireSimple size={12} weight="fill" className="inline mr-1 -mt-0.5" />
                Active now · {today.entry_count} entries
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter mt-4">
                {today.title}
              </h2>
              <p className="text-zinc-300 text-base mt-3 max-w-xl">{today.description}</p>
              <Link
                to="/studio"
                className="btn-volt rounded-full px-6 py-3 text-sm inline-flex items-center gap-2 mt-6"
              >
                Enter the challenge
              </Link>
            </div>
            <div className="hidden md:block">
              <Trophy size={120} weight="duotone" className="text-[#ccff00] opacity-60" />
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-400 mb-4">All themes</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {all.map((c) => (
              <div key={c.id} className="bg-zinc-900/60 border border-white/8 rounded-2xl p-5 hover:border-white/20 transition-colors">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-2">{c.theme}</p>
                <h4 className="font-display font-bold text-xl tracking-tight">{c.title}</h4>
                <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{c.description}</p>
                <div className="text-xs text-zinc-500 mt-3">{c.entry_count} entries</div>
              </div>
            ))}
          </div>
        </div>

        <aside>
          <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-400 mb-4">Top creations</h3>
          <div className="bg-zinc-900/60 border border-white/8 rounded-2xl p-3 space-y-1">
            {leaders.map((g, i) => (
              <Link
                key={g.id}
                to={`/studio?view=${g.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="font-display font-black text-lg w-6 text-center" style={{
                  color: i === 0 ? "#ccff00" : i === 1 ? "#ff0055" : i === 2 ? "#00f0ff" : "#52525b"
                }}>
                  {i + 1}
                </span>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                  {g.thumbnail_url && <img src={g.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{g.original_prompt || g.prompt}</p>
                  <p className="text-[10px] text-zinc-500">@{g.creator_name}</p>
                </div>
                <span className="flex items-center gap-1 text-xs">
                  <Crown size={11} weight="fill" className="text-[#ff0055]" />
                  <span className="font-bold">{g.battle_wins || 0}</span>
                </span>
              </Link>
            ))}
            {leaders.length === 0 && <p className="text-xs text-zinc-500 text-center py-6">No data yet.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
