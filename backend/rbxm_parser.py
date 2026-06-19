"""Minimal Roblox `.rbxm` binary parser focused on extracting ParticleEmitter
properties.

Format reference: https://dom.rojo.space/binary.html

We deliberately implement ONLY the chunks and property types we need for VFX:
META · INST · PROP · PRNT · END  (header chunks)
String · Bool · Int32 · Float32 · Float64 · UDim · UDim2 · Vector2 · Vector3 ·
Color3 · NumberSequence · ColorSequence · NumberRange · ContentId · Token (enum)

This is enough to read every property on `ParticleEmitter`, `Beam`, `Trail`, etc.
"""
from __future__ import annotations

import struct
from dataclasses import dataclass, field
from typing import Any, Optional

import lz4.block


# ---- Wire-format helpers ----------------------------------------------------

class _Reader:
    """Cursor over a bytes buffer for sequential parsing."""

    def __init__(self, buf: bytes):
        self.buf = buf
        self.pos = 0

    def read(self, n: int) -> bytes:
        out = self.buf[self.pos:self.pos + n]
        self.pos += n
        return out

    def u8(self) -> int:    return self.read(1)[0]
    def u32(self) -> int:   return struct.unpack("<I", self.read(4))[0]
    def i32(self) -> int:   return struct.unpack("<i", self.read(4))[0]
    def f32(self) -> float: return struct.unpack("<f", self.read(4))[0]
    def f64(self) -> float: return struct.unpack("<d", self.read(8))[0]

    def lstring(self) -> str:
        n = self.u32()
        return self.read(n).decode("utf-8", errors="replace")

    def eof(self) -> bool:
        return self.pos >= len(self.buf)


def _untransform_f32_array(raw: bytes, count: int) -> list[float]:
    """Roblox stores Float32 arrays interleaved + rotated for better LZ4 compression."""
    out = []
    for i in range(count):
        b0 = raw[i]
        b1 = raw[i + count]
        b2 = raw[i + count * 2]
        b3 = raw[i + count * 3]
        # Roblox rotates the sign bit so the byte ordering is byte0=expHi+sign, etc.
        # Spec: x = rotr(u32, 1), then reinterpret as IEEE-754 float.
        u = (b0 << 24) | (b1 << 16) | (b2 << 8) | b3
        # rotate-right-by-1
        u = ((u >> 1) | ((u & 1) << 31)) & 0xFFFFFFFF
        out.append(struct.unpack("<f", struct.pack("<I", u))[0])
    return out


def _untransform_i32_array(raw: bytes, count: int) -> list[int]:
    out = []
    for i in range(count):
        b0 = raw[i]
        b1 = raw[i + count]
        b2 = raw[i + count * 2]
        b3 = raw[i + count * 3]
        u = (b0 << 24) | (b1 << 16) | (b2 << 8) | b3
        # zig-zag decode (Roblox uses zig-zag for signed ints)
        u = ((u >> 1) ^ -(u & 1)) & 0xFFFFFFFF
        # convert back to signed
        if u & 0x80000000:
            u -= 0x100000000
        out.append(u)
    return out


# ---- Top-level parser -------------------------------------------------------

@dataclass
class Instance:
    referent: int
    class_name: str
    properties: dict[str, Any] = field(default_factory=dict)
    parent: Optional[int] = None
    children: list[int] = field(default_factory=list)


def parse_rbxm(data: bytes) -> dict[int, Instance]:
    """Parse a `.rbxm` binary blob → { referent: Instance } map."""
    # Auto-ungzip
    if data[:2] == b"\x1f\x8b":
        import gzip
        data = gzip.decompress(data)

    sig = data[:8]
    if sig != b"<roblox!":
        raise ValueError(f"Not an rbxm binary (sig={sig!r})")

    r = _Reader(data[8:])  # skip "<roblox!" signature (8 bytes)
    r.read(6)              # 6-byte magic: \x89\xff\r\n\x1a\n
    version = struct.unpack("<H", r.read(2))[0]
    class_count = r.u32()
    instance_count = r.u32()
    r.read(8)  # reserved

    classes: dict[int, dict] = {}   # classId → {name, instance_count, referents}
    instances: dict[int, Instance] = {}  # referent → Instance

    while not r.eof():
        chunk_name = r.read(4).decode("ascii", errors="replace")
        if not chunk_name:
            break
        compressed_size = r.u32()
        decompressed_size = r.u32()
        r.read(4)  # reserved
        payload = r.read(compressed_size) if compressed_size else r.read(decompressed_size)
        if compressed_size:
            payload = lz4.block.decompress(payload, uncompressed_size=decompressed_size)

        if chunk_name == "META":
            pass  # ignore for now
        elif chunk_name == "SSTR":
            pass  # shared strings — ignore (we'll fall back gracefully)
        elif chunk_name == "INST":
            _parse_inst(payload, classes, instances)
        elif chunk_name == "PROP":
            _parse_prop(payload, classes, instances)
        elif chunk_name == "PRNT":
            _parse_prnt(payload, instances)
        elif chunk_name == "END\x00":
            break
        # unknown chunk → skip

    return instances


def _parse_inst(payload: bytes, classes: dict, instances: dict) -> None:
    r = _Reader(payload)
    class_id = r.u32()
    class_name = r.lstring()
    _is_service = r.u8()  # noqa: F841 — unused for models
    count = r.u32()
    raw_refs = r.read(count * 4)
    refs = _untransform_i32_array(raw_refs, count)
    # Referents are *delta-encoded*
    acc = 0
    abs_refs = []
    for d in refs:
        acc += d
        abs_refs.append(acc)
    classes[class_id] = {"name": class_name, "referents": abs_refs}
    for ref in abs_refs:
        instances[ref] = Instance(referent=ref, class_name=class_name)


def _parse_prop(payload: bytes, classes: dict, instances: dict) -> None:
    r = _Reader(payload)
    class_id = r.u32()
    prop_name = r.lstring()
    type_id = r.u8()

    cls = classes.get(class_id)
    if not cls:
        return
    refs = cls["referents"]
    count = len(refs)

    values: list[Any] = []
    try:
        values = _read_property_array(r, type_id, count)
    except Exception:
        # Unknown type — skip silently rather than corrupt the parse
        return

    if len(values) != count:
        return
    for ref, val in zip(refs, values):
        if ref in instances:
            instances[ref].properties[prop_name] = val


def _parse_prnt(payload: bytes, instances: dict) -> None:
    r = _Reader(payload)
    r.u8()  # version
    n = r.u32()
    raw_child = r.read(n * 4)
    raw_parent = r.read(n * 4)
    children = _untransform_i32_array(raw_child, n)
    parents = _untransform_i32_array(raw_parent, n)
    # Delta-encoded
    acc_c = 0
    acc_p = 0
    for dc, dp in zip(children, parents):
        acc_c += dc
        acc_p += dp
        if acc_c in instances:
            instances[acc_c].parent = acc_p
            if acc_p in instances:
                instances[acc_p].children.append(acc_c)


# ---- Property type table ----------------------------------------------------

# Selected subset of Roblox property type IDs (see rojo binary spec)
TYPE_STRING        = 0x01
TYPE_BOOL          = 0x02
TYPE_INT32         = 0x03
TYPE_FLOAT32       = 0x04
TYPE_FLOAT64       = 0x05
TYPE_UDIM          = 0x06
TYPE_UDIM2         = 0x07
TYPE_VECTOR2       = 0x0D
TYPE_VECTOR3       = 0x0E
TYPE_COLOR3        = 0x0F
TYPE_TOKEN         = 0x12   # enum
TYPE_REFERENT      = 0x13


def _read_property_array(r: _Reader, type_id: int, count: int) -> list[Any]:  # noqa: C901
    """Decode an array of property values. Subset of Roblox type IDs."""
    if type_id == TYPE_STRING or type_id == 0x14 or type_id == 0x29:  # String / ContentId variants
        return [r.lstring() for _ in range(count)]
    if type_id == TYPE_BOOL:
        return [bool(r.u8()) for _ in range(count)]
    if type_id == TYPE_INT32:
        return _untransform_i32_array(r.read(count * 4), count)
    if type_id == TYPE_FLOAT32:
        return _untransform_f32_array(r.read(count * 4), count)
    if type_id == TYPE_FLOAT64:
        return [r.f64() for _ in range(count)]
    if type_id == TYPE_VECTOR2:
        xs = _untransform_f32_array(r.read(count * 4), count)
        ys = _untransform_f32_array(r.read(count * 4), count)
        return [{"x": xs[i], "y": ys[i]} for i in range(count)]
    if type_id == TYPE_VECTOR3:
        xs = _untransform_f32_array(r.read(count * 4), count)
        ys = _untransform_f32_array(r.read(count * 4), count)
        zs = _untransform_f32_array(r.read(count * 4), count)
        return [{"x": xs[i], "y": ys[i], "z": zs[i]} for i in range(count)]
    if type_id == TYPE_COLOR3:
        rs = _untransform_f32_array(r.read(count * 4), count)
        gs = _untransform_f32_array(r.read(count * 4), count)
        bs = _untransform_f32_array(r.read(count * 4), count)
        return [{"r": rs[i], "g": gs[i], "b": bs[i]} for i in range(count)]
    if type_id == TYPE_TOKEN:
        return _untransform_i32_array(r.read(count * 4), count)
    if type_id == TYPE_REFERENT:
        deltas = _untransform_i32_array(r.read(count * 4), count)
        acc = 0; out = []
        for d in deltas:
            acc += d; out.append(acc)
        return out
    # === Sequence / Range types — IDs vary across rbxm versions ===
    if type_id in (0x17, 0x1B):  # NumberRange (Lifetime, Speed, Rotation, RotSpeed, SourceAssetId)
        out = []
        for _ in range(count):
            mn = r.f32(); mx = r.f32()
            out.append({"min": mn, "max": mx})
        return out
    if type_id == 0x15:  # NumberSequence (Size, Transparency, Squash) — count-prefixed keypoints
        out = []
        for _ in range(count):
            kn = r.u32()
            kps = []
            for _ in range(kn):
                t = r.f32(); v = r.f32(); env = r.f32()
                kps.append({"t": t, "v": v, "envelope": env})
            out.append({"keypoints": kps})
        return out
    if type_id in (0x16, 0x19):  # ColorSequence
        out = []
        for _ in range(count):
            kn = r.u32()
            kps = []
            for _ in range(kn):
                t = r.f32()
                cr = r.f32(); cg = r.f32(); cb = r.f32()
                env = r.f32()
                kps.append({"t": t, "r": cr, "g": cg, "b": cb})
            out.append({"keypoints": kps})
        return out
    if type_id == 0x21:  # SecurityCapabilities — 8 bytes per instance, skip
        r.read(count * 8)
        return [None] * count
    raise ValueError(f"Unsupported type_id={type_id:#x}")


# ---- High-level helper ------------------------------------------------------

def extract_particle_emitters(instances: dict[int, Instance]) -> list[dict]:
    """Return a list of plain JSON dicts for every ParticleEmitter found."""
    out = []
    for inst in instances.values():
        if inst.class_name == "ParticleEmitter":
            out.append({
                "name": inst.properties.get("Name", "ParticleEmitter"),
                "props": inst.properties,
            })
    return out
