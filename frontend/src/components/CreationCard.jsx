import React, { useState, useRef, lazy, Suspense } from "react";
import { Heart, ArrowsClockwise, Crown, FireSimple, Cube, ArrowsOut } from "@phosphor-icons/react";
import { api } from "../lib/api";
import { TID } from "../constants/testIds";
import { Link } from "react-router-dom";
import DropBadges from "./DropBadges";
import RarityBorder from "./RarityBorder";
import FullScreenModelModal from "./FullScreenModelModal";

// Heavy R3F viewer — lazy so it only loads when actually needed
const ModelViewer = lazy(() => import("./ModelViewer"));

export default function CreationCard({ item, onLikeToggle, onRemix, compact = false }) {
  const [hover, setHover] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const enterTimer = useRef(null);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { data } = await api.post(`/generations/${item.id}/like`);
      onLikeToggle && onLikeToggle(item.id, data.liked);
    } catch {}
  };

  // Slight delay on hover-in to avoid mounting the canvas on accidental hovers
  const onEnter = () => {
    clearTimeout(enterTimer.current);
    enterTimer.current = setTimeout(() => setHover(true), 220);
  };
  const onLeave = () => {
    clearTimeout(enterTimer.current);
    setHover(false);
  };

  const hasModel = !!item.model_url && item.status === "completed";

  return (
    <RarityBorder item={item} className="group">
      <div
        className="relative bg-zinc-900/70 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
        data-testid={TID.feedItem(item.id)}
      >
        {/* TOP STRIP — drop badges (above the image, never covers avatar) */}
        <div className="px-3 pt-3 pb-2.5 flex flex-wrap items-center gap-1.5 bg-gradient-to-b from-black/60 to-transparent border-b border-white/5">
          <DropBadges item={item} size="sm" />
          {item.battle_wins > 0 && (
            <span
              className="ml-auto text-[9px] uppercase tracking-widest font-black bg-black/70 border border-[#ff0055]/50 text-[#ff0055] rounded-full px-2 py-0.5 inline-flex items-center gap-1"
              title={`${item.battle_wins} battle wins`}
            >
              <Crown size={9} weight="fill" /> {item.battle_wins}
            </span>
          )}
        </div>

        {/* IMAGE — fully unobstructed avatar; hover swaps in live 3D viewer */}
        <Link to={`/studio?view=${item.id}`}>
          <div
            className="aspect-[4/5] bg-gradient-to-br from-zinc-800 to-zinc-950 overflow-hidden relative"
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            {item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt={item.prompt}
                className={`w-full h-full object-cover transition-all duration-500 ease-out ${
                  hover && hasModel ? "opacity-0 scale-105" : "group-hover:scale-[1.04] opacity-100"
                }`}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                {item.status === "pending" ? "GENERATING…" : "NO PREVIEW"}
              </div>
            )}

            {/* Live 3D preview overlay (mounted only on hover) */}
            {hover && hasModel && (
              <div className={`absolute inset-0 transition-opacity duration-500 ${hover ? "opacity-100" : "opacity-0"}`}>
                <Suspense fallback={
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-[10px] uppercase tracking-widest">
                    Loading 3D…
                  </div>
                }>
                  <ModelViewer url={item.model_url} height="100%" showHint={false} allowTryOn={false} />
                </Suspense>
                <span className="absolute top-2 left-2 text-[9px] uppercase tracking-widest font-black bg-black/80 text-[#ccff00] border border-[#ccff00]/40 rounded-full px-2 py-0.5 inline-flex items-center gap-1 pointer-events-none">
                  <Cube size={9} weight="fill" /> Live 3D
                </span>
              </div>
            )}

            {/* Expand-to-fullscreen 3D button — always visible (mobile-friendly) */}
            {hasModel && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullscreen(true); }}
                data-testid="open-fullscreen-3d"
                className="absolute top-2 right-2 z-20 w-9 h-9 rounded-full bg-black/80 border border-white/15 text-white flex items-center justify-center hover:bg-[#ccff00] hover:text-black hover:border-[#ccff00] transition-all backdrop-blur-sm shadow-lg"
                aria-label="View live 3D"
                title="View live 3D"
              >
                <ArrowsOut size={15} weight="bold" />
              </button>
            )}

            {/* Subtle bottom gradient for chip readability (only when not in 3D mode) */}
            {!hover && (
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
            )}

            {item.is_featured && !hover && (
              <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-widest bg-[#00f0ff] text-black rounded-full px-2 py-0.5 font-black flex items-center gap-1">
                <FireSimple size={10} weight="fill" /> Featured
              </span>
            )}

            {!hover && (
              <div className="absolute bottom-2 right-2 flex gap-1.5 flex-wrap justify-end">
                <span className="text-[10px] uppercase tracking-widest bg-black/80 border border-white/15 rounded-full px-2 py-0.5 font-bold backdrop-blur-sm">
                  {item.attachment_type}
                </span>
                {item.style && item.style !== "auto" && (
                  <span className="text-[10px] uppercase tracking-widest bg-[#ccff00] text-black rounded-full px-2 py-0.5 font-bold">
                    {item.style}
                  </span>
                )}
              </div>
            )}
          </div>
        </Link>

        {/* BOTTOM META — prompt + creator + actions */}
        <div className="p-3 space-y-2">
          <p className="text-sm line-clamp-2 text-zinc-200 leading-snug min-h-[2.5rem]">
            {item.original_prompt || item.prompt}
          </p>
          {!compact && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <span className="text-zinc-500 truncate">@{item.creator_name || "anon"}</span>
              <div className="flex items-center gap-3">
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

      {/* Full-screen immersive 3D modal */}
      <FullScreenModelModal item={item} open={fullscreen} onClose={() => setFullscreen(false)} />
    </RarityBorder>
  );
}
