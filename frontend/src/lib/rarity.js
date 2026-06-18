// BloxDrops — rarity tier display map (mirrors backend drops_utils.py)
export const RARITY_TIERS = ["common", "rare", "epic", "legendary", "mythic"];

export const RARITY_DISPLAY = {
  common:    { label: "Common",    color: "#a1a1aa", glow: "rgba(161,161,170,0.45)" },
  rare:      { label: "Rare",      color: "#00f0ff", glow: "rgba(0,240,255,0.65)" },
  epic:      { label: "Epic",      color: "#c084fc", glow: "rgba(192,132,252,0.70)" },
  legendary: { label: "Legendary", color: "#fbbf24", glow: "rgba(251,191,36,0.85)" },
  mythic:    { label: "Mythic",    color: "#ff0055", glow: "rgba(255,0,85,0.85)" },
};

export function rarityOf(item) {
  return RARITY_DISPLAY[item?.rarity_tier] || RARITY_DISPLAY.common;
}

export function editionLabel(item) {
  const cap = item?.edition_cap;
  if (!cap) return "∞"; // unlimited
  return `${item?.edition_number || 1} / ${cap}`;
}

// Pretty short signature for display: "0x4f7a…"
export function signatureShort(item) {
  const sig = item?.signature_hash || item?.mint_id || "";
  if (!sig) return "—";
  return `0x${sig.slice(0, 4)}…${sig.slice(-4)}`;
}

export const EDITION_CAP_OPTIONS = [
  { value: 0,   label: "Unlimited",   sub: "Open edition · no scarcity",     tier: "common" },
  { value: 100, label: "100 editions", sub: "Standard scarcity",              tier: "rare" },
  { value: 50,  label: "50 editions",  sub: "Limited drop",                   tier: "epic" },
  { value: 10,  label: "10 editions",  sub: "Ultra-rare drop",                tier: "legendary" },
  { value: 1,   label: "1 of 1",       sub: "Single-edition — most valuable", tier: "mythic" },
];
