import React from "react";
import { Sparkle, Hash, Crown } from "@phosphor-icons/react";
import { rarityOf, editionLabel } from "../lib/rarity";

/**
 * Compact drop badges row: rarity tier + edition number + founder signed.
 * Stacks horizontally; pass `size="sm"` for use inside cards.
 */
export default function DropBadges({ item, size = "md" }) {
  if (!item) return null;
  const r = rarityOf(item);
  const tier = item.rarity_tier || "common";
  const ed = editionLabel(item);
  const isSigned = !!item.is_founder_signed;

  const small = size === "sm";
  const padY = small ? "py-0.5" : "py-1";
  const padX = small ? "px-2" : "px-2.5";
  const textSize = small ? "text-[9px]" : "text-[10px]";
  const iconSize = small ? 9 : 11;

  return (
    <div className="flex flex-wrap gap-1.5 items-center" data-testid="drop-badges">
      {/* Rarity tier */}
      <span
        className={`rarity-pill rarity-pill-${tier} ${padX} ${padY} ${textSize} uppercase tracking-widest font-black rounded-full inline-flex items-center gap-1`}
        data-testid={`rarity-${tier}`}
      >
        <Sparkle size={iconSize} weight="fill" /> {r.label}
      </span>

      {/* Edition number */}
      <span
        className={`edition-pill ${padX} ${padY} ${textSize} uppercase tracking-widest font-bold rounded-full inline-flex items-center gap-1 bg-black/70 border border-white/20 text-white`}
        data-testid="edition-badge"
      >
        <Hash size={iconSize} weight="bold" /> {ed}
      </span>

      {/* Founder signed */}
      {isSigned && (
        <span
          className={`signed-pill ${padX} ${padY} ${textSize} uppercase tracking-widest font-black rounded-full inline-flex items-center gap-1`}
          data-testid="founder-signed"
          title="Founder Signed — minted by an admin / founder account"
        >
          <Crown size={iconSize} weight="fill" /> Signed
        </span>
      )}
    </div>
  );
}
