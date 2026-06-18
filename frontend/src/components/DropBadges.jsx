import React from "react";
import { Sparkle, Hash, Crown, Star, Lock } from "@phosphor-icons/react";
import { rarityOf, editionLabel } from "../lib/rarity";

/**
 * Compact drop badges row: COMING SOON + GENESIS + rarity tier + edition + signed.
 */
export default function DropBadges({ item, size = "md" }) {
  if (!item) return null;
  const r = rarityOf(item);
  const tier = item.rarity_tier || "common";
  const ed = editionLabel(item);
  const isSigned = !!item.is_founder_signed;
  const isGenesis = !!item.is_genesis;
  const isComingSoon = !!item.is_coming_soon;

  const small = size === "sm";
  const padY = small ? "py-0.5" : "py-1";
  const padX = small ? "px-2" : "px-2.5";
  const textSize = small ? "text-[9px]" : "text-[10px]";
  const iconSize = small ? 9 : 11;

  return (
    <div className="flex flex-wrap gap-1.5 items-center" data-testid="drop-badges">
      {/* Coming soon / Release soon — highest priority */}
      {isComingSoon && (
        <span
          className={`coming-soon-pill ${padX} ${padY} ${textSize} uppercase tracking-widest font-black rounded-full inline-flex items-center gap-1`}
          data-testid="coming-soon"
          title="Release coming soon — not yet for sale"
        >
          <Lock size={iconSize} weight="fill" /> Release Soon
        </span>
      )}

      {isGenesis && (
        <span
          className={`genesis-pill ${padX} ${padY} ${textSize} uppercase tracking-widest font-black rounded-full inline-flex items-center gap-1`}
          data-testid="genesis-badge"
          title="GENESIS — one of the first 100 drops ever minted on BloxDrops"
        >
          <Star size={iconSize} weight="fill" /> Genesis
        </span>
      )}

      <span
        className={`rarity-pill rarity-pill-${tier} ${padX} ${padY} ${textSize} uppercase tracking-widest font-black rounded-full inline-flex items-center gap-1`}
        data-testid={`rarity-${tier}`}
      >
        <Sparkle size={iconSize} weight="fill" /> {r.label}
      </span>

      <span
        className={`edition-pill ${padX} ${padY} ${textSize} uppercase tracking-widest font-bold rounded-full inline-flex items-center gap-1 bg-black/70 border border-white/20 text-white`}
        data-testid="edition-badge"
      >
        <Hash size={iconSize} weight="bold" /> {ed}
      </span>

      {isSigned && (
        <span
          className={`signed-pill ${padX} ${padY} ${textSize} uppercase tracking-widest font-black rounded-full inline-flex items-center gap-1`}
          data-testid="founder-signed"
          title="Founder Signed — minted by the founder"
        >
          <Crown size={iconSize} weight="fill" /> Signed
        </span>
      )}
    </div>
  );
}
