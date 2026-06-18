import React from "react";
import { Heart, ArrowsClockwise, Trophy, Crown } from "@phosphor-icons/react";
import { api } from "../lib/api";
import { TID } from "../constants/testIds";
import { Link } from "react-router-dom";

export default function CreationCard({ item, onLikeToggle, onRemix, compact = false }) {
  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { data } = await api.post(`/generations/${item.id}/like`);
      onLikeToggle && onLikeToggle(item.id, data.liked);
    } catch {}
  };

  return (
    <div
      className="group relative bg-zinc-900/60 border border-white/8 rounded-2xl overflow-hidden hover:border-[#ccff00]/40 transition-all duration-300 hover:-translate-y-1"
      data-testid={TID.feedItem(item.id)}
    >
      <Link to={`/studio?view=${item.id}`}>
        <div className="aspect-[4/5] bg-gradient-to-br from-zinc-800 to-zinc-950 overflow-hidden relative">
          {item.thumbnail_url ? (
            <img
              src={item.thumbnail_url}
              alt={item.prompt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
              {item.status === "pending" ? "GENERATING…" : "NO PREVIEW"}
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
            {item.is_featured && (
              <span className="text-[10px] uppercase tracking-widest bg-[#00f0ff] text-black rounded-full px-2 py-0.5 font-black flex items-center gap-1">
                <Crown size={10} weight="fill" /> Featured
              </span>
            )}
            <span className="text-[10px] uppercase tracking-widest bg-black/70 border border-white/10 rounded-full px-2 py-0.5 font-bold">
              {item.attachment_type}
            </span>
            {item.style && item.style !== "auto" && (
              <span className="text-[10px] uppercase tracking-widest bg-[#ccff00] text-black rounded-full px-2 py-0.5 font-bold">
                {item.style}
              </span>
            )}
          </div>
          {item.battle_wins > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 border border-[#ff0055]/40 rounded-full px-2 py-0.5">
              <Crown size={12} weight="fill" className="text-[#ff0055]" />
              <span className="text-[10px] font-bold">{item.battle_wins}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 space-y-2">
        <p className="text-sm line-clamp-2 text-zinc-200 leading-snug min-h-[2.5rem]">
          {item.original_prompt || item.prompt}
        </p>
        {!compact && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 truncate">@{item.creator_name || "anon"}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                data-testid={TID.feedLike(item.id)}
                className={`flex items-center gap-1 transition-colors ${
                  item.is_liked ? "text-[#ff0055]" : "text-zinc-400 hover:text-[#ff0055]"
                }`}
              >
                <Heart size={14} weight={item.is_liked ? "fill" : "regular"} />
                <span className="font-bold">{item.likes}</span>
              </button>
              <button
                onClick={(e) => { e.preventDefault(); onRemix && onRemix(item); }}
                data-testid={TID.feedRemix(item.id)}
                className="flex items-center gap-1 text-zinc-400 hover:text-[#ccff00] transition-colors"
                title="Remix"
              >
                <ArrowsClockwise size={14} weight="bold" />
                <span className="font-bold">{item.remix_count || 0}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
