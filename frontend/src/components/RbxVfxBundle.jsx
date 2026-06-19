import React, { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import RbxParticleEmitter from "./RbxParticleEmitter";

/**
 * Dispatch renderer for an entire imported Roblox VFX bundle.
 * Picks the right component per emitter class — ParticleEmitter, Beam, Trail,
 * Fire, Smoke, Sparkles, PointLight, SpotLight.
 *
 * Props:
 *   vfx — object { emitters: [...] } as returned by the .rbxm import.
 */
export default function RbxVfxBundle({ vfx }) {
  if (!vfx || !Array.isArray(vfx.emitters)) return null;
  return (
    <>
      {vfx.emitters.map((emitter, idx) => {
        const cls = emitter.class || "ParticleEmitter"; // back-compat for pre-class imports
        const key = `${cls}-${emitter.name}-${idx}`;
        switch (cls) {
          case "ParticleEmitter":
            if (!emitter.texture || emitter.texture.startsWith("rbxassetid://")) return null;
            return <RbxParticleEmitter key={key} config={emitter} />;
          case "Beam":
            return <RbxBeam key={key} config={emitter} />;
          case "Trail":
            return <RbxTrail key={key} config={emitter} />;
          case "Fire":
          case "Smoke":
          case "Sparkles":
            return <RbxLegacyEffect key={key} config={emitter} />;
          case "PointLight":
          case "SpotLight":
            return <RbxLight key={key} config={emitter} />;
          default:
            return null;
        }
      })}
    </>
  );
}

// ============================================================================
//  Beam — textured strip between two attachment points (curve-controllable)
// ============================================================================
function RbxBeam({ config }) {
  const valid = config.texture && !config.texture.startsWith("rbxassetid://") && config.att0 && config.att1;
  const texture = useLoader(THREE.TextureLoader, valid ? config.texture : "/hero/character.png");
  const matRef = useRef();
  const offsetRef = useRef(0);

  useFrame((_, dt) => {
    if (matRef.current && config.texture_speed) {
      offsetRef.current += dt * config.texture_speed;
      texture.offset.x = offsetRef.current % 1;
    }
  });

  const { geometry, color, alpha } = useMemo(() => {
    if (!valid) return { geometry: null, color: null, alpha: 1 };
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const a = new THREE.Vector3(config.att0.x, config.att0.y, config.att0.z);
    const b = new THREE.Vector3(config.att1.x, config.att1.y, config.att1.z);
    const segs = Math.max(2, config.segments || 10);

    // Build a flat ribbon between a and b with curve control if present
    const positions = [];
    const indices = [];
    const uvs = [];
    const dir = new THREE.Vector3().subVectors(b, a);
    const up = new THREE.Vector3(0, 0, 1); // simple default normal — fine for FaceCamera-less beams
    const side = new THREE.Vector3().crossVectors(dir, up).normalize();

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const w = config.width0 * (1 - t) + config.width1 * t;
      // Quadratic bezier-ish curve via midpoint perturbation if curve_size set
      const mid = new THREE.Vector3().lerpVectors(a, b, t);
      const curve = config.curve_size0 * (1 - t) + config.curve_size1 * t;
      if (curve) {
        mid.y += Math.sin(Math.PI * t) * curve;
      }
      const top    = new THREE.Vector3().copy(mid).add(side.clone().multiplyScalar(w * 0.5));
      const bottom = new THREE.Vector3().copy(mid).sub(side.clone().multiplyScalar(w * 0.5));
      positions.push(top.x, top.y, top.z, bottom.x, bottom.y, bottom.z);
      uvs.push(t * (1 / (config.texture_length || 1)), 0, t * (1 / (config.texture_length || 1)), 1);
      if (i < segs) {
        const o = i * 2;
        indices.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv",       new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    // Average the first color keypoint for the tint
    const ck = config.color_keypoints && config.color_keypoints[0];
    const tk = config.transparency_keypoints && config.transparency_keypoints[0];
    const col = ck ? new THREE.Color(ck.r, ck.g, ck.b) : new THREE.Color(1, 1, 1);
    const alphaVal = tk ? 1 - tk.v : 1;
    return { geometry: geo, color: col, alpha: alphaVal };
  }, [config, texture, valid]);

  if (!valid || !geometry) return null;

  return (
    <mesh geometry={geometry} renderOrder={2}>
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        color={color}
        transparent
        opacity={alpha * (config.brightness || 1)}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
//  Trail — static ribbon between two attachments (our model is fixed in the
//          viewer so it functions as a glow streak between the two points)
// ============================================================================
function RbxTrail({ config }) {
  // A Trail with no attachments cannot be rendered
  if (!config.att0 || !config.att1) return null;
  // Trails are visually very similar to beams when model is static — reuse beam render
  return (
    <RbxBeam
      config={{
        ...config,
        width0: config.max_length || 1,
        width1: config.min_length || 0.2,
        segments: 8,
        texture_length: 1,
        texture_speed: 0,
        curve_size0: 0,
        curve_size1: 0,
      }}
    />
  );
}

// ============================================================================
//  Legacy Fire / Smoke / Sparkles — synthesize particle config on the fly
// ============================================================================
function RbxLegacyEffect({ config }) {
  // Synthesize a ParticleEmitter-shaped config so the same renderer works.
  // We use a tiny 2x2 white sprite (programmatic data-URL) as the texture
  // so we don't depend on a fetch — color comes from the keypoints.
  const synth = useMemo(() => {
    const c1 = config.color || { r: 1, g: 0.6, b: 0.2 };
    const c2 = config.secondary_color || { r: 1, g: 1, b: 0.4 };
    const isFire    = config.class === "Fire";
    const isSmoke   = config.class === "Smoke";
    const isSpark   = config.class === "Sparkles";

    return {
      // 1x1 white PNG as base64 — colored by per-particle vertex color
      texture: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
      rate: isSpark ? 12 : (isFire ? 18 : 8),
      lifetime: { min: isSmoke ? 1.8 : 0.7, max: isSmoke ? 3.0 : 1.4 },
      speed:    { min: isSmoke ? config.rise_velocity * 0.5 : 0.4, max: isSmoke ? config.rise_velocity : 1.0 },
      rotation: { min: 0, max: 360 },
      rot_speed: { min: -40, max: 40 },
      spread_angle: { x: 360, y: 360 },
      light_emission: 0.85,
      light_influence: 0,
      z_offset: 0,
      brightness: 1.2,
      locked_to_part: true,
      drag: 0,
      acceleration: { x: 0, y: isSmoke ? 0.6 : (isFire ? -0.4 : 0), z: 0 },
      color_keypoints: [
        { t: 0, r: c1.r, g: c1.g, b: c1.b },
        { t: 0.5, r: c2.r, g: c2.g, b: c2.b },
        { t: 1, r: c1.r * 0.4, g: c1.g * 0.4, b: c1.b * 0.4 },
      ],
      size_keypoints: [
        { t: 0, v: (config.size || 5) * 0.18, envelope: 0 },
        { t: 1, v: (config.size || 5) * 0.05, envelope: 0 },
      ],
      transparency_keypoints: [
        { t: 0, v: 1 - (config.opacity || 1), envelope: 0 },
        { t: 0.3, v: 0.1, envelope: 0 },
        { t: 1, v: 1, envelope: 0 },
      ],
    };
  }, [config]);

  return <RbxParticleEmitter config={synth} />;
}

// ============================================================================
//  PointLight / SpotLight — native three.js lights
// ============================================================================
function RbxLight({ config }) {
  if (!config.enabled) return null;
  const color = new THREE.Color(config.color.r, config.color.g, config.color.b);
  if (config.class === "SpotLight") {
    return (
      <spotLight
        color={color}
        intensity={(config.brightness || 1) * 1.5}
        distance={config.range || 8}
        decay={2}
      />
    );
  }
  return (
    <pointLight
      position={[0, 0, 0]}
      color={color}
      intensity={(config.brightness || 1) * 1.5}
      distance={config.range || 8}
      decay={2}
    />
  );
}
