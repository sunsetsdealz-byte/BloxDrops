import React from "react";
import { Cube } from "@phosphor-icons/react";

/**
 * On-brand placeholder for when a 3D drop cannot be loaded — either because the
 * model_url is null, the GLB 404s, or the network/CDN fails. Renders a slowly
 * pulsing volt-green ghost cube on a scanline backdrop. Matches BloxDrops
 * aesthetic so a missing drop still feels intentional, never broken.
 */
export default function UnavailablePlaceholder({
  title = "DROP UNAVAILABLE",
  hint = "This 3D model is still cooking or has been removed.",
  testid = "model-unavailable",
}) {
  return (
    <div
      data-testid={testid}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      {/* Scanline backdrop — pure CSS, no images */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(204,255,0,0.05) 0 1px, transparent 1px 6px)",
        }}
      />
      {/* Vignette glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(204,255,0,0.10),transparent_55%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Wireframe cube */}
        <div
          className="w-20 h-20 rounded-2xl border border-[#ccff00]/40 flex items-center justify-center mb-5 animate-pulse"
          style={{ boxShadow: "0 0 32px rgba(204,255,0,0.15), inset 0 0 24px rgba(204,255,0,0.06)" }}
        >
          <Cube size={36} weight="duotone" className="text-[#ccff00]" />
        </div>

        <p
          className="font-display text-sm font-black uppercase tracking-[0.3em] text-white mb-1.5"
          style={{ textShadow: "0 0 18px rgba(204,255,0,0.35)" }}
        >
          {title}
        </p>
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold max-w-xs">
          {hint}
        </p>
      </div>
    </div>
  );
}
