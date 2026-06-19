"""Import a Roblox UGC asset's actual ParticleEmitter config and persist it
on a BloxDrops generation.

Pipeline:
  1. URL/assetId → assetdelivery.roblox.com → signed CDN URL → binary rbxm
  2. parse rbxm → list of ParticleEmitter dicts (Color, Lifetime, Speed, …)
  3. resolve `rbxassetid://N` textures to real image URLs (via assetdelivery)
  4. return a clean JSON config the frontend particle renderer can replay
"""
from __future__ import annotations

import os
import re
import hashlib
from pathlib import Path
from typing import Optional

import httpx

from rbxm_parser import parse_rbxm, extract_particle_emitters, extract_all_vfx


_CACHE_DIR = Path(os.environ.get("RBXM_CACHE_DIR", "/tmp/bloxdrops_rbxm_cache"))
_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _cache_path(asset_id: str) -> Path:
    return _CACHE_DIR / f"{asset_id}.rbxm"


_ROBLOX_ID_RE = re.compile(r"roblox\.com/(?:catalog|library)/(\d+)", re.IGNORECASE)
_RBXASSET_RE  = re.compile(r"rbxassetid://(\d+)")


def _extract_asset_id(url_or_id: str) -> Optional[str]:
    s = url_or_id.strip()
    if s.isdigit():
        return s
    m = _ROBLOX_ID_RE.search(s)
    return m.group(1) if m else None


async def _resolve_cdn_url(asset_id: str, client: httpx.AsyncClient) -> str:
    r = await client.get(
        "https://assetdelivery.roblox.com/v2/asset",
        params={"id": asset_id},
        timeout=15.0,
    )
    r.raise_for_status()
    data = r.json()
    if "errors" in data:
        raise ValueError(f"Roblox asset delivery error: {data['errors']}")
    locs = data.get("locations") or []
    if not locs:
        raise ValueError(f"No CDN location returned for asset {asset_id}")
    return locs[0]["location"]


async def _resolve_texture_url(asset_id: str, client: httpx.AsyncClient) -> Optional[str]:
    """rbxassetid://N → public thumbnail URL (so the frontend can use it as a sprite)."""
    # Most particle textures are 256x256 alpha PNGs; thumbnails endpoint gives us
    # a stable, public PNG to load directly into a three.js TextureLoader.
    try:
        r = await client.get(
            "https://thumbnails.roblox.com/v1/assets",
            params={"assetIds": asset_id, "size": "420x420", "format": "Png"},
            timeout=12.0,
        )
        r.raise_for_status()
        data = r.json().get("data") or []
        if data and data[0].get("state") == "Completed":
            return data[0].get("imageUrl")
    except Exception:
        pass
    # Fallback: resolve via assetdelivery (textures are stored as raw image blobs)
    try:
        return await _resolve_cdn_url(asset_id, client)
    except Exception:
        return None


def _normalize_emitter(pe: dict, texture_map: dict[str, str]) -> dict:
    """Strip the raw rbxm props down to what our three.js renderer needs."""
    p = pe.get("props", {})

    def _seq(key):
        v = p.get(key)
        if isinstance(v, dict):
            return v.get("keypoints", [])
        return []

    def _range(key, default=None):
        v = p.get(key)
        if isinstance(v, dict):
            return {"min": v.get("min", 0.0), "max": v.get("max", 0.0)}
        return default or {"min": 0.0, "max": 0.0}

    tex_raw = p.get("Texture") or ""
    tex_match = _RBXASSET_RE.match(tex_raw)
    tex_url = texture_map.get(tex_match.group(1), tex_raw) if tex_match else tex_raw

    return {
        "name":          pe.get("name", "ParticleEmitter"),
        "class":         "ParticleEmitter",
        "texture":       tex_url,
        "rate":          float(p.get("Rate") or 0.0),
        "lifetime":      _range("Lifetime"),
        "speed":         _range("Speed"),
        "rotation":      _range("Rotation"),
        "rot_speed":     _range("RotSpeed"),
        "spread_angle":  p.get("SpreadAngle") or {"x": 0, "y": 0},
        "light_emission": float(p.get("LightEmission") or 0.0),
        "light_influence": float(p.get("LightInfluence") or 0.0),
        "z_offset":      float(p.get("ZOffset") or 0.0),
        "brightness":    float(p.get("Brightness") or 1.0),
        "locked_to_part": bool(p.get("LockedToPart", True)),
        "drag":          float(p.get("Drag") or 0.0),
        "acceleration":  p.get("Acceleration") or {"x": 0, "y": 0, "z": 0},
        "color_keypoints":        _seq("Color"),
        "size_keypoints":         _seq("Size"),
        "transparency_keypoints": _seq("Transparency"),
        "emission_direction": int(p.get("EmissionDirection") or -1),
    }


def _normalize_beam(pe: dict, texture_map: dict[str, str], att_pos: dict) -> dict:
    """Beam: textured plane between two Attachment points (curve-controllable)."""
    p = pe.get("props", {})
    tex_raw = p.get("Texture") or ""
    tex_match = _RBXASSET_RE.match(tex_raw)
    tex_url = texture_map.get(tex_match.group(1), tex_raw) if tex_match else tex_raw

    att0_ref = p.get("Attachment0")
    att1_ref = p.get("Attachment1")

    return {
        "name":      pe.get("name", "Beam"),
        "class":     "Beam",
        "texture":   tex_url,
        "color_keypoints":        (p.get("Color") or {}).get("keypoints", []) if isinstance(p.get("Color"), dict) else [],
        "transparency_keypoints": (p.get("Transparency") or {}).get("keypoints", []) if isinstance(p.get("Transparency"), dict) else [],
        "width0":         float(p.get("Width0") or 1.0),
        "width1":         float(p.get("Width1") or 1.0),
        "texture_length": float(p.get("TextureLength") or 1.0),
        "texture_speed":  float(p.get("TextureSpeed") or 0.0),
        "texture_mode":   int(p.get("TextureMode") or 0),
        "curve_size0":    float(p.get("CurveSize0") or 0.0),
        "curve_size1":    float(p.get("CurveSize1") or 0.0),
        "segments":       int(p.get("Segments") or 10),
        "face_camera":    bool(p.get("FaceCamera", False)),
        "light_emission": float(p.get("LightEmission") or 0.0),
        "brightness":     float(p.get("Brightness") or 1.0),
        "att0":           att_pos.get(att0_ref) if att0_ref else None,
        "att1":           att_pos.get(att1_ref) if att1_ref else None,
    }


def _normalize_trail(pe: dict, texture_map: dict[str, str], att_pos: dict) -> dict:
    """Trail: motion-tracked strip between two Attachments. We render it static
    (our model doesn't move) so it looks like an aurora ribbon between the two points."""
    p = pe.get("props", {})
    tex_raw = p.get("Texture") or ""
    tex_match = _RBXASSET_RE.match(tex_raw)
    tex_url = texture_map.get(tex_match.group(1), tex_raw) if tex_match else tex_raw

    return {
        "name":      pe.get("name", "Trail"),
        "class":     "Trail",
        "texture":   tex_url,
        "color_keypoints":        (p.get("Color") or {}).get("keypoints", []) if isinstance(p.get("Color"), dict) else [],
        "transparency_keypoints": (p.get("Transparency") or {}).get("keypoints", []) if isinstance(p.get("Transparency"), dict) else [],
        "lifetime":       float(p.get("Lifetime") or 1.0),
        "min_length":     float(p.get("MinLength") or 0.0),
        "max_length":     float(p.get("MaxLength") or 0.0),
        "width_scale":    (p.get("WidthScale") or {}).get("keypoints", []) if isinstance(p.get("WidthScale"), dict) else [],
        "light_emission": float(p.get("LightEmission") or 0.0),
        "brightness":     float(p.get("Brightness") or 1.0),
        "att0":           att_pos.get(p.get("Attachment0")) if p.get("Attachment0") else None,
        "att1":           att_pos.get(p.get("Attachment1")) if p.get("Attachment1") else None,
    }


def _normalize_simple_legacy(pe: dict) -> dict:
    """Fire / Smoke / Sparkles — legacy Roblox classes with a few simple properties."""
    p = pe.get("props", {})
    cls = pe.get("class")
    primary = p.get("Color") or p.get("SparkleColor") or {"r": 1, "g": 0.6, "b": 0.2}
    secondary = p.get("SecondaryColor") or {"r": 1, "g": 1, "b": 0.4}
    return {
        "name":  pe.get("name", cls),
        "class": cls,
        "color":           primary,
        "secondary_color": secondary,
        "size":            float(p.get("Size") or 5.0),
        "heat":            float(p.get("Heat") or 9.0),
        "opacity":         float(p.get("Opacity") or 1.0),
        "rise_velocity":   float(p.get("RiseVelocity") or 1.0),
        "enabled":         bool(p.get("Enabled", True)),
    }


def _normalize_light(pe: dict) -> dict:
    """PointLight / SpotLight — simple glow lights attached to the model."""
    p = pe.get("props", {})
    return {
        "name":       pe.get("name", pe.get("class")),
        "class":      pe.get("class"),
        "color":      p.get("Color") or {"r": 1, "g": 1, "b": 1},
        "brightness": float(p.get("Brightness") or 1.0),
        "range":      float(p.get("Range") or 8.0),
        "shadows":    bool(p.get("Shadows", False)),
        "enabled":    bool(p.get("Enabled", True)),
    }


async def import_roblox_vfx(url_or_id: str) -> dict:
    """End-to-end importer.

    Returns:
      {
        "asset_id": "76479271580913",
        "source_url": "https://www.roblox.com/...",
        "emitters": [ <normalized emitter>, ... ],
        "raw_emitter_count": 2,
      }
    """
    asset_id = _extract_asset_id(url_or_id)
    if not asset_id:
        raise ValueError("Couldn't extract a Roblox asset ID from that URL.")

    async with httpx.AsyncClient(follow_redirects=True) as client:
        cache_file = _cache_path(asset_id)
        if cache_file.exists() and cache_file.stat().st_size > 0:
            rbxm_bytes = cache_file.read_bytes()
        else:
            cdn_url = await _resolve_cdn_url(asset_id, client)
            r = await client.get(cdn_url, timeout=30.0)
            r.raise_for_status()
            rbxm_bytes = r.content
            try:
                cache_file.write_bytes(rbxm_bytes)
            except Exception:
                pass

        instances = parse_rbxm(rbxm_bytes)
        all_vfx = extract_all_vfx(instances)
        pes = [v for v in all_vfx if v["class"] == "ParticleEmitter"]
        beams = [v for v in all_vfx if v["class"] == "Beam"]
        trails = [v for v in all_vfx if v["class"] == "Trail"]
        legacy = [v for v in all_vfx if v["class"] in ("Fire", "Smoke", "Sparkles")]
        lights = [v for v in all_vfx if v["class"] in ("PointLight", "SpotLight")]

        if not (pes or beams or trails or legacy or lights):
            return {"asset_id": asset_id, "source_url": url_or_id, "emitters": [], "raw_emitter_count": 0}

        # Resolve every `rbxassetid://N` texture referenced by any emitter / beam / trail
        texture_map: dict[str, str] = {}
        for pe in pes + beams + trails:
            tex = (pe.get("props", {}).get("Texture") or "")
            m = _RBXASSET_RE.match(tex)
            if not m:
                continue
            tid = m.group(1)
            if tid in texture_map:
                continue
            url = await _resolve_texture_url(tid, client)
            if url:
                texture_map[tid] = url

        # Resolve every referenced Attachment position (for Beams + Trails)
        att_pos: dict[int, dict] = {}
        for v in beams + trails:
            for k in ("Attachment0", "Attachment1"):
                ref = v.get("props", {}).get(k)
                if ref and ref not in att_pos:
                    from rbxm_parser import find_attachment_position
                    pos = find_attachment_position(instances, ref)
                    if pos:
                        att_pos[ref] = pos

        emitters = []
        emitters.extend(_normalize_emitter(pe, texture_map) for pe in pes)
        emitters.extend(_normalize_beam(b, texture_map, att_pos) for b in beams)
        emitters.extend(_normalize_trail(t, texture_map, att_pos) for t in trails)
        emitters.extend(_normalize_simple_legacy(lg) for lg in legacy)
        emitters.extend(_normalize_light(li) for li in lights)

        return {
            "asset_id": asset_id,
            "source_url": url_or_id,
            "emitters": emitters,
            "raw_emitter_count": len(all_vfx),
        }
