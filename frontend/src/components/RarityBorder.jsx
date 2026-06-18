import React from "react";
import { rarityOf } from "../lib/rarity";

/**
 * Holographic / tier-colored border wrapper for a drop card.
 * Wraps children in a rounded container with a glowing border that pulses for higher tiers.
 */
export default function RarityBorder({ item, className = "", children, intensity = 1 }) {
  const r = rarityOf(item);
  const tier = item?.rarity_tier || "common";
  return (
    <div
      className={`rarity-wrap rarity-${tier} ${className}`}
      style={{
        "--tier-color": r.color,
        "--tier-glow": r.glow,
        "--tier-intensity": intensity,
      }}
    >
      {children}
    </div>
  );
}
