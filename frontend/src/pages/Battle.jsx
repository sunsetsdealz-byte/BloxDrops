import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Crown, ArrowRight, Sword } from "@phosphor-icons/react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import ModelViewer from "../components/ModelViewer";
import { TID } from "../constants/testIds";

export default function Battle() {
  const { user } = useAuth();
  const [battle, setBattle] = useState(null);
  const [voted, setVoted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  const next = useCallback(async () => {
    setLoading(true);
    setVoted(null);
    try {
      const { data } = await api.get("/battle/random");
      setBattle(data);
      setEmpty(false);
    } catch (err) {
      if (err?.response?.status === 404) {
        setEmpty(true);
        setBattle(null);
      } else {
        toast.error(formatApiError(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { next(); }, [next]);

  const vote = async (side) => {
    if (!user) return toast.error("Log in to vote");
    if (voted) return;
    const winner_id = side === "a" ? battle.a.id : battle.b.id;
    setVoted(side);
    try {
      await api.post("/battle/vote", { battle_id: battle.battle_id, winner_id });
      toast.success("Vote in! Loading next…");
      setTimeout(next, 900);
    } catch (err) {
      toast.error(formatApiError(err));
      setVoted(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-[#ff0055] mb-2 flex items-center gap-2">
            <Sword size={14} weight="fill" /> 1 v 1
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter">
            Battle Arena
          </h1>
          <p className="text-zinc-400 text-sm mt-2">Pick the one you'd wear. Winners climb the leaderboard.</p>
        </div>
        <button
          data-testid={TID.battleNext}
          onClick={next}
          disabled={loading}
          className="btn-ghost rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wider flex items-center gap-2"
        >
          Next pair <ArrowRight size={14} weight="bold" />
        </button>
      </div>

      {empty ? (
        <div className="text-center py-20 max-w-md mx-auto" data-testid="battle-empty">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#ff0055]/10 border border-[#ff0055]/30 flex items-center justify-center mb-5">
            <Sword size={28} weight="duotone" className="text-[#ff0055]" />
          </div>
          <h2 className="font-display text-2xl font-black uppercase tracking-tighter mb-2">
            The arena is empty
          </h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Need at least two completed drops to start a battle. Mint one in Studio and invite a friend to vote.
          </p>
          <Link to="/studio" className="inline-block btn-volt rounded-full px-6 py-3 text-sm font-black uppercase tracking-widest">
            Mint a drop
          </Link>
        </div>
      ) : !battle ? (
        <div className="text-center py-20 text-zinc-500">{loading ? "Loading battle…" : "No battle"}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {[
            { key: "a", item: battle.a, color: "#ccff00", tid: TID.battleA },
            { key: "b", item: battle.b, color: "#ff0055", tid: TID.battleB },
          ].map(({ key, item, color, tid }) => {
            const isWinner = voted === key;
            const isLoser = voted && voted !== key;
            return (
              <button
                key={key}
                onClick={() => vote(key)}
                disabled={!!voted}
                data-testid={tid}
                className={`group relative text-left bg-zinc-900/60 border-2 rounded-3xl overflow-hidden transition-all duration-300 ${
                  isWinner ? "border-[" + color + "] scale-[1.01]" :
                  isLoser ? "border-zinc-800 opacity-50" :
                  "border-white/8 hover:border-white/30"
                }`}
                style={isWinner ? { borderColor: color, boxShadow: `0 0 40px ${color}55` } : {}}
              >
                <div className="aspect-square">
                  <ModelViewer url={item.model_url} height={"100%"} showHint={false} />
                </div>
                <div className="p-5">
                  <p className="text-sm text-zinc-200 leading-snug line-clamp-2 mb-3 min-h-[2.5rem]">
                    {item.original_prompt || item.prompt}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">@{item.creator_name}</span>
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Crown size={12} weight="fill" style={{ color }} />
                      <span className="font-bold">{item.battle_wins || 0} wins</span>
                    </span>
                  </div>
                </div>
                {isWinner && (
                  <div
                    className="absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider"
                    style={{ background: color, color: "#000" }}
                  >
                    Winner
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!user && (
        <div className="mt-8 text-center">
          <Link to="/login" className="text-[#ccff00] font-bold underline">Log in to vote</Link>
        </div>
      )}
    </div>
  );
}
