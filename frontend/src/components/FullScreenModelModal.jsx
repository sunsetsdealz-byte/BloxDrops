import React, { lazy, Suspense, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Cube } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import DropBadges from "./DropBadges";

const ModelViewer = lazy(() => import("./ModelViewer"));

/**
 * Full-screen immersive 3D viewer modal.
 * Rendered via portal to escape ancestor transforms (framer-motion etc).
 */
export default function FullScreenModelModal({ item, open, onClose }) {
  // Lock scroll while open + ESC to close
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!item) return null;

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          onClick={onClose}
          data-testid="fullscreen-3d-modal"
        >
          {/* Background grid + glow */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(204,255,0,0.18),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,240,255,0.12),transparent_60%)]" />
          </div>

          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              data-testid="fullscreen-close"
              className="absolute -top-3 -right-3 z-20 w-11 h-11 rounded-full bg-black border border-white/15 text-white flex items-center justify-center hover:bg-[#ff0055] hover:border-[#ff0055] transition-all"
              aria-label="Close 3D viewer"
            >
              <X size={20} weight="bold" />
            </button>

            {/* Top strip — badges */}
            <div className="rounded-t-3xl bg-zinc-950/90 border border-white/10 border-b-0 px-5 py-3.5 flex flex-wrap items-center gap-2">
              <DropBadges item={item} />
              <span className="ml-auto text-[10px] uppercase tracking-[0.25em] font-black bg-black/80 text-[#ccff00] border border-[#ccff00]/40 rounded-full px-2.5 py-1 inline-flex items-center gap-1.5">
                <Cube size={11} weight="fill" /> Immersive 3D
              </span>
            </div>

            {/* Viewer */}
            <div className="relative bg-black border border-white/10 overflow-hidden" style={{ height: "min(70vh, 640px)" }}>
              <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm uppercase tracking-widest">
                  Loading 3D…
                </div>
              }>
                <ModelViewer url={item.model_url} height="100%" showHint={true} allowTryOn={true} />
              </Suspense>
            </div>

            {/* Bottom strip — prompt + creator */}
            <div className="rounded-b-3xl bg-zinc-950/90 border border-white/10 border-t-0 px-5 py-4">
              <p className="text-base md:text-lg font-display font-bold tracking-tight leading-snug text-white">
                {item.original_prompt || item.prompt}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-zinc-400">@{item.creator_name || "anon"}</span>
                <span className="font-mono text-zinc-500">mint · 0x{(item.signature_hash || item.mint_id || "").slice(0,8)}…</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modal, document.body);
}
