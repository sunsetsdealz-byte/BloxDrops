import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { X, MagnifyingGlassPlus } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import DropBadges from "./DropBadges";

/**
 * Full-screen image zoom modal. Click image to zoom further.
 * Rendered via portal to escape ancestor transforms.
 */
export default function ImageZoomModal({ item, open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  if (!item) return null;

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          onClick={onClose}
          data-testid="image-zoom-modal"
        >
          <div className="absolute inset-0 pointer-events-none opacity-25">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(204,255,0,0.18),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,0,85,0.14),transparent_60%)]" />
          </div>

          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              data-testid="image-zoom-close"
              className="absolute -top-3 -right-3 z-20 w-11 h-11 rounded-full bg-black border border-white/15 text-white flex items-center justify-center hover:bg-[#ff0055] hover:border-[#ff0055] transition-all"
              aria-label="Close zoom"
            >
              <X size={20} weight="bold" />
            </button>

            {/* Top strip — badges */}
            <div className="rounded-t-3xl bg-zinc-950/95 border border-white/10 border-b-0 px-5 py-3.5 flex flex-wrap items-center gap-2">
              <DropBadges item={item} />
              <span className="ml-auto text-[10px] uppercase tracking-[0.25em] font-black bg-black/80 text-[#ccff00] border border-[#ccff00]/40 rounded-full px-2.5 py-1 inline-flex items-center gap-1.5">
                <MagnifyingGlassPlus size={11} weight="bold" /> Zoom
              </span>
            </div>

            {/* Image area */}
            <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-white/10 overflow-hidden flex items-center justify-center" style={{ height: "min(52vh, 460px)" }}>
              {item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt={item.prompt}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-zinc-500 uppercase text-sm tracking-widest">No preview</div>
              )}
            </div>

            {/* Bottom strip */}
            <div className="rounded-b-3xl bg-zinc-950/95 border border-white/10 border-t-0 px-5 py-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-base md:text-lg font-display font-bold tracking-tight leading-snug text-white">
                    {item.original_prompt || item.prompt}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-xs gap-3 flex-wrap">
                    <span className="text-zinc-400">@{item.creator_name || "anon"}</span>
                    <span className="font-mono text-zinc-500">mint · 0x{(item.signature_hash || item.mint_id || "").slice(0, 8)}…</span>
                  </div>
                </div>
                {item.release_price_usd && (
                  <div className="rounded-xl border border-[#ccff00]/40 bg-gradient-to-br from-[#ccff00]/12 to-transparent px-4 py-2.5 flex-shrink-0">
                    <p className="text-[9px] uppercase tracking-[0.25em] font-black text-[#ccff00] mb-0.5">
                      {item.is_coming_soon ? "Reserve price" : "List price"}
                    </p>
                    <p className="font-display text-2xl font-black leading-none">
                      ${Number(item.release_price_usd).toLocaleString()}
                      <span className="text-zinc-500 text-xs ml-1 font-bold">USD</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modal, document.body);
}
