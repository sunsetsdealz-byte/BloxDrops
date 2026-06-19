"""BloxDrops — collectibility helpers: rarity tiers, editions, signing.

Drop fields stored on each generation doc:
- edition_cap:        int (0 = unlimited, else 1 / 10 / 50 / 100)
- edition_number:     int (1 for the creator's original mint; future mints get 2, 3, …)
- editions_minted:    int (how many editions claimed so far)
- mint_id:            str (uuid hex — immutable provenance ID)
- signature_hash:     str (sha256 fingerprint = user_id + mint_id + created_at)
- is_founder_signed:  bool (creator was admin OR drop was signed by an admin)
"""
import hashlib
import uuid
from typing import Dict, Any


# Valid edition caps. 0 = unlimited.
EDITION_CAPS = [0, 100, 50, 10, 1]

# Rarity tiers ordered low → high
RARITY_TIERS = ["common", "rare", "epic", "legendary", "mythic"]

RARITY_DISPLAY = {
    "common":    {"label": "Common",    "color": "#a1a1aa", "glow": "rgba(161,161,170,0.45)"},
    "rare":      {"label": "Rare",      "color": "#00f0ff", "glow": "rgba(0,240,255,0.65)"},
    "epic":      {"label": "Epic",      "color": "#c084fc", "glow": "rgba(192,132,252,0.70)"},
    "legendary": {"label": "Legendary", "color": "#fbbf24", "glow": "rgba(251,191,36,0.85)"},
    "mythic":    {"label": "Mythic",    "color": "#ff0055", "glow": "rgba(255,0,85,0.85)"},
}

# VFX presets — modeled after Roblox UGC particle-emitter effects (e.g. Stormbreak
# Horns of the Tempest Skies). Admin-attached per drop; rendered in the BloxDrops
# 3D viewer via drei <Sparkles>. The frontend reads the `label` + `color` and
# applies its own particle config tuned per preset.
VFX_PRESETS = {
    "purple_tempest": {"label": "Purple Tempest", "color": "#a855f7"},
    "red_flame":      {"label": "Red Flame",      "color": "#ff4d2e"},
    "blue_frost":     {"label": "Blue Frost",     "color": "#00e5ff"},
    "gold_aura":      {"label": "Gold Aura",      "color": "#fbbf24"},
    "toxic_green":    {"label": "Toxic Green",    "color": "#a3e635"},
    "volt_lightning": {"label": "Volt Lightning", "color": "#ccff00"},
}


def make_mint_id() -> str:
    return uuid.uuid4().hex


def make_signature(user_id: str, mint_id: str, created_at: str) -> str:
    raw = f"{user_id}|{mint_id}|{created_at}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:32]


def compute_rarity_tier(doc: Dict[str, Any]) -> str:
    """Auto-grade rarity from engagement + scarcity + provenance."""
    likes = int(doc.get("likes") or 0)
    wins = int(doc.get("battle_wins") or 0)
    remixes = int(doc.get("remix_count") or 0)
    score = likes + wins * 3 + remixes * 2

    edition_cap = doc.get("edition_cap")
    is_founder_signed = bool(doc.get("is_founder_signed"))

    # 1-of-1 drops are inherently scarce — minimum Legendary.
    # 1-of-1 + founder-signed = automatic Mythic (top of provenance).
    if edition_cap == 1:
        if is_founder_signed:
            return "mythic"
        if score >= 20:
            return "mythic"
        if score >= 5:
            return "legendary"
        return "legendary"

    # Limited (10 or 50 cap) — minimum Rare
    if edition_cap in (10, 50):
        if score >= 80:
            return "mythic"
        if score >= 35:
            return "legendary"
        if score >= 12:
            return "epic"
        return "rare"

    # Standard (100 / unlimited) — score-driven
    if score >= 100:
        return "mythic"
    if score >= 50:
        return "legendary"
    if score >= 20:
        return "epic"
    if score >= 5:
        return "rare"
    return "common"


def rarity_score(doc: Dict[str, Any]) -> int:
    likes = int(doc.get("likes") or 0)
    wins = int(doc.get("battle_wins") or 0)
    remixes = int(doc.get("remix_count") or 0)
    return likes + wins * 3 + remixes * 2


def enrich_drop(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Add computed rarity + sane drop defaults for legacy docs (in-place + returns)."""
    # Backfill defaults so older docs render correctly
    if "edition_cap" not in doc:
        doc["edition_cap"] = 0          # legacy = unlimited
    if "edition_number" not in doc:
        doc["edition_number"] = 1
    if "editions_minted" not in doc:
        doc["editions_minted"] = 1
    if "mint_id" not in doc:
        # Use ObjectId-as-string from id when missing — stable fallback
        doc["mint_id"] = (doc.get("id") or "").replace("-", "")[:32] or "legacy"
    if "is_founder_signed" not in doc:
        doc["is_founder_signed"] = bool(doc.get("free_by_admin"))
    if "is_genesis" not in doc:
        doc["is_genesis"] = False
    if "is_coming_soon" not in doc:
        doc["is_coming_soon"] = False
    # VFX preset (admin-attached particle effect)
    if "vfx_preset" not in doc:
        doc["vfx_preset"] = None
    # VFX custom config (imported from Roblox .rbxm — takes precedence over preset)
    if "vfx_custom" not in doc:
        doc["vfx_custom"] = None
    # NFT metadata (owner-editable until first marketplace listing)
    if "display_name" not in doc:
        doc["display_name"] = None
    if "description" not in doc:
        doc["description"] = None
    if "traits" not in doc:
        doc["traits"] = []

    # Admin rarity override: when set, skip auto-compute and trust the stored tier.
    override_tier = doc.get("rarity_tier") if doc.get("rarity_override") else None
    if override_tier in RARITY_DISPLAY:
        tier = override_tier
    else:
        tier = compute_rarity_tier(doc)
    display = RARITY_DISPLAY[tier]
    doc["rarity_tier"] = tier
    doc["rarity_label"] = display["label"]
    doc["rarity_color"] = display["color"]
    doc["rarity_score"] = rarity_score(doc)
    return doc
