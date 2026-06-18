import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { api, formatApiError } from "../lib/api";
import { Coins, Cube, Trophy, Heart, Crown, Lightning } from "@phosphor-icons/react";

export default function Profile() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [boosting, setBoosting] = useState(null);
  const [params] = useSearchParams();

  const load = async () => {
    if (!user) return;
    const { data } = await api.get("/me/generations");
    setItems(data.items || []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  // Poll boost return
  useEffect(() => {
    const sid = params.get("boost_session_id");
    const status = params.get("status");
    if (status === "cancelled") { toast.info("Boost cancelled."); return; }
    if (!sid || !user) return;
    let n = 0;
    const poll = async () => {
      n++;
      try {
        const { data } = await api.get(`/boost/status/${sid}`);
        if (data.payment_status === "paid") {
          toast.success("Boosted! Your creation is pinned for 24 hours.");
          load();
          nav("/profile", { replace: true });
          return;
        }
      } catch {}
      if (n < 6) setTimeout(poll, 2000);
    };
    poll();
    // eslint-disable-next-line
  }, [params, user]);

  const boost = async (gen) => {
    if (!user) return nav("/login");
    setBoosting(gen.id);
    try {
      const { data } = await api.post("/boost/checkout", {
        generation_id: gen.id,
        origin_url: window.location.origin,
      });
      window.location.href = data.url;
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBoosting(null);
    }
  };

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
  const featuredCount = items.filter((i) => i.is_featured).length;

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
        <div className="grid grid-cols-4 gap-2">
          <Stat icon={<Cube size={20} weight="duotone" />} label="Creations" value={items.length} />
          <Stat icon={<Heart size={20} weight="duotone" />} label="Likes" value={totalLikes} color="#ff0055" />
          <Stat icon={<Trophy size={20} weight="duotone" />} label="Wins" value={totalWins} color="#00f0ff" />
          <Stat icon={<Crown size={20} weight="duotone" />} label="Featured" value={featuredCount} color="#ccff00" />
        </div>
      </div>

      <div className="glass rounded-2xl p-5 mb-8 flex items-center justify-between flex-wrap gap-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div
              key={it.id}
              className={`bg-zinc-900/60 border rounded-2xl overflow-hidden transition-all ${
                it.is_featured ? "border-[#00f0ff]/60 shadow-[0_0_28px_rgba(0,240,255,0.15)]" : "border-white/8"
              }`}
            >
              <Link to={`/studio?view=${it.id}`} className="block aspect-[4/5] bg-zinc-950 relative">
                {it.thumbnail_url && (
                  <img src={it.thumbnail_url} alt={it.prompt} className="w-full h-full object-cover" />
                )}
                {it.is_featured && (
                  <span className="absolute top-2 left-2 bg-[#00f0ff] text-black text-[10px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 flex items-center gap-1">
                    <Crown size={10} weight="fill" /> Featured
                  </span>
                )}
                {it.status === "pending" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs uppercase tracking-widest text-zinc-300">
                    Generating…
                  </div>
                )}
              </Link>
              <div className="p-3 space-y-3">
                <p className="text-sm text-zinc-200 line-clamp-2 min-h-[2.5rem]">{it.original_prompt || it.prompt}</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex gap-2 text-zinc-400">
                    <span className="flex items-center gap-1"><Heart size={12} weight="duotone" className="text-[#ff0055]" />{it.likes || 0}</span>
                    <span className="flex items-center gap-1"><Trophy size={12} weight="duotone" className="text-[#00f0ff]" />{it.battle_wins || 0}</span>
                  </div>
                </div>
                {it.status === "completed" && !it.is_featured && (
                  <button
                    onClick={() => boost(it)}
                    disabled={boosting === it.id}
                    data-testid={`profile-boost-${it.id}`}
                    className="w-full rounded-full py-2 text-[10px] uppercase tracking-[0.2em] font-black bg-[#00f0ff] text-black hover:shadow-[0_0_18px_rgba(0,240,255,0.45)] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Lightning size={12} weight="fill" />
                    {boosting === it.id ? "Loading…" : "Boost $1.99 — 24h"}
                  </button>
                )}
                {it.is_featured && (
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#00f0ff] text-center">
                    Pinned on the feed
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, color = "#ccff00" }) {
  return (
    <div className="bg-zinc-900/60 border border-white/8 rounded-xl px-3 py-2 min-w-[80px]">
      <div className="flex items-center gap-1" style={{ color }}>{icon}</div>
      <p className="font-display text-2xl font-black mt-1">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">{label}</p>
    </div>
  );
}
