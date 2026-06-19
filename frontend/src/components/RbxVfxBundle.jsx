import React, { useMemo, useRef, useState, useEffect } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
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
//  Beam — lightning-bolt style render with animated zigzag displacement
//  + procedural "hot white core fading to purple/colored edges" shader
//  Matches the Roblox catalog look (sharp lightning, not smooth ribbon).
// ============================================================================
function RbxBeam({ config }) {
  const valid = !!(config.att0 && config.att1);
  // Try loading the supplied texture, but don't depend on it — we ship a
  // procedural lightning shader so it works even with rbxassetid:// URLs.
  const texture = useLoader(THREE.TextureLoader, "/hero/character.png");

  // Persistent ref structures so the shape mutates in place each frame.
  const segs = Math.max(16, config.segments || 24);
  const positionsRef = useRef(new Float32Array((segs + 1) * 6));
  const uvsRef       = useRef(null);
  const indicesRef   = useRef(null);
  const geoRef       = useRef();
  const flickerRef   = useRef(0);
  const accumRef     = useRef(0);

  const { color, alpha, brightness } = useMemo(() => {
    const ck = config.color_keypoints && config.color_keypoints[0];
    const tk = config.transparency_keypoints && config.transparency_keypoints[0];
    const col = ck ? new THREE.Color(ck.r, ck.g, ck.b) : new THREE.Color(0.5, 0.3, 1.0);
    const alphaVal = tk ? 1 - tk.v : 1;
    return { color: col, alpha: alphaVal, brightness: (config.brightness || 1) * 2.5 };
  }, [config]);

  // Static UVs + indices — built once
  useMemo(() => {
    const uvs = new Float32Array((segs + 1) * 4);
    const indices = new Uint16Array(segs * 6);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      uvs[i * 4 + 0] = t; uvs[i * 4 + 1] = 0;
      uvs[i * 4 + 2] = t; uvs[i * 4 + 3] = 1;
    }
    for (let i = 0; i < segs; i++) {
      const o = i * 2;
      indices[i * 6 + 0] = o;
      indices[i * 6 + 1] = o + 1;
      indices[i * 6 + 2] = o + 2;
      indices[i * 6 + 3] = o + 1;
      indices[i * 6 + 4] = o + 3;
      indices[i * 6 + 5] = o + 2;
    }
    uvsRef.current = uvs;
    indicesRef.current = indices;
  }, [segs]);

  const w0 = config.width0 ?? 0.3;
  const w1 = config.width1 ?? 0.3;
  const a = useMemo(() => new THREE.Vector3(config.att0.x, config.att0.y, config.att0.z), [config.att0]);
  const b = useMemo(() => new THREE.Vector3(config.att1.x, config.att1.y, config.att1.z), [config.att1]);
  const dir = useMemo(() => new THREE.Vector3().subVectors(b, a), [a, b]);
  // Pick a stable perpendicular axis. If dir is mostly vertical, side = (1,0,0);
  // otherwise compute cross with up.
  const side = useMemo(() => {
    const up = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    return new THREE.Vector3().crossVectors(dir, up).normalize();
  }, [dir]);

  // Pre-compute random zigzag amplitudes per segment so the shape flickers but
  // remains structurally coherent (re-seeded every ~80ms).
  const zigzagRef = useRef(new Float32Array(segs + 1));

  const reseedZigzag = () => {
    const arr = zigzagRef.current;
    const len = dir.length();
    const amp = Math.max(0.05, len * 0.12);
    arr[0] = 0;
    arr[segs] = 0;
    for (let i = 1; i < segs; i++) {
      // Sin envelope + random — biggest displacement near the middle
      const env = Math.sin((i / segs) * Math.PI);
      arr[i] = (Math.random() - 0.5) * 2 * amp * env;
    }
  };
  useMemo(() => reseedZigzag(), [a, b, segs]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, dt) => {
    accumRef.current += dt;
    flickerRef.current += dt;
    // Re-seed zigzag every 70ms for lightning flicker
    if (flickerRef.current > 0.07) {
      reseedZigzag();
      flickerRef.current = 0;
    }
    // Update positions
    const positions = positionsRef.current;
    const z = zigzagRef.current;
    const len = dir.length();
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const w = (w0 * (1 - t) + w1 * t) * 0.5;
      // base point along the line
      const px = a.x + dir.x * t + side.x * z[i];
      const py = a.y + dir.y * t + side.y * z[i];
      const pz = a.z + dir.z * t + side.z * z[i];
      // top / bottom of the ribbon (perpendicular to side)
      const tx = side.y * dir.z - side.z * dir.y;
      const ty = side.z * dir.x - side.x * dir.z;
      const tz = side.x * dir.y - side.y * dir.x;
      const tlen = Math.hypot(tx, ty, tz) || 1;
      const nx = (tx / tlen) * w;
      const ny = (ty / tlen) * w;
      const nz = (tz / tlen) * w;
      positions[i * 6 + 0] = px + nx;
      positions[i * 6 + 1] = py + ny;
      positions[i * 6 + 2] = pz + nz;
      positions[i * 6 + 3] = px - nx;
      positions[i * 6 + 4] = py - ny;
      positions[i * 6 + 5] = pz - nz;
    }
    if (geoRef.current && geoRef.current.attributes.position) {
      geoRef.current.attributes.position.needsUpdate = true;
    }
  });

  // Procedural lightning shader: hot white core, fades to config color, then
  // soft alpha edges. No texture dependency — works even with rbxassetid://.
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(color.r, color.g, color.b) },
        uAlpha: { value: alpha },
        uBrightness: { value: brightness },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uAlpha;
        uniform float uBrightness;
        varying vec2 vUv;
        void main() {
          // vUv.y goes 0..1 across the ribbon width.
          float yc = abs(vUv.y - 0.5) * 2.0;       // 0 at center, 1 at edges
          float core   = 1.0 - smoothstep(0.0, 0.25, yc); // bright white core
          float glow   = 1.0 - smoothstep(0.0, 1.0, yc);  // colored outer glow
          float a = glow * uAlpha;
          if (a < 0.005) discard;
          vec3 rgb = mix(uColor, vec3(1.0), core) * uBrightness;
          gl_FragColor = vec4(rgb, a);
        }
      `,
    });
  }, [color, alpha, brightness]);

  // Pulsing orb position = midpoint of the two attachments. Computed before
  // any conditional return to keep hooks order stable.
  const midPoint = useMemo(
    () => [a.x + dir.x * 0.5, a.y + dir.y * 0.5, a.z + dir.z * 0.5],
    [a, dir]
  );
  const orbBase = useMemo(() => Math.max(0.3, dir.length() * 0.45), [dir]);

  if (!valid) return null;
  if (!texture) return null; // ensure loader resolved (we don't actually use it but useLoader gates render)

  return (
    <group>
      {/* === ZIGZAG LIGHTNING RIBBON === */}
      <mesh renderOrder={3}>
        <bufferGeometry ref={geoRef}>
          <bufferAttribute attach="attributes-position" count={(segs + 1) * 2} array={positionsRef.current} itemSize={3} />
          <bufferAttribute attach="attributes-uv"       count={(segs + 1) * 2} array={uvsRef.current}       itemSize={2} />
          <bufferAttribute attach="index"                count={segs * 6}      array={indicesRef.current}   itemSize={1} />
        </bufferGeometry>
        <primitive object={material} attach="material" />
      </mesh>

      {/* === ORBITAL LIGHTNING GLOW (pulsing white→purple sphere) === */}
      <PulsingOrb position={midPoint} baseRadius={orbBase} color={color} brightness={brightness} />
    </group>
  );
}

// ============================================================================
//  PulsingOrb — billboard sprite with radial gradient + brightness pulse,
//  used as the bright "orbital lightning" core between Beam attachments.
// ============================================================================
function PulsingOrb({ position, baseRadius, color, brightness }) {
  const meshRef = useRef();
  const phaseRef = useRef(Math.random() * Math.PI * 2);
  const { camera } = useThree();

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor:      { value: new THREE.Color(color.r, color.g, color.b) },
        uBrightness: { value: brightness },
        uPulse:      { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uBrightness;
        uniform float uPulse;
        varying vec2 vUv;
        void main() {
          vec2 d = vUv - vec2(0.5);
          float r = length(d) * 2.0;
          if (r > 1.0) discard;
          // Bright hot core fading to colored halo
          float hotCore   = pow(1.0 - smoothstep(0.0, 0.35, r), 2.0);
          float midGlow   = pow(1.0 - smoothstep(0.0, 0.7, r), 1.5);
          float outerHalo = 1.0 - smoothstep(0.0, 1.0, r);
          vec3 rgb = mix(uColor, vec3(1.0), hotCore) * uBrightness * uPulse;
          float a = (hotCore + midGlow * 0.5 + outerHalo * 0.25) * uPulse;
          if (a < 0.005) discard;
          gl_FragColor = vec4(rgb, a);
        }
      `,
    });
  }, [color, brightness]);

  useFrame((_, dt) => {
    phaseRef.current += dt * 6.0; // ~1 Hz pulse
    const pulse = 0.85 + Math.sin(phaseRef.current) * 0.15 + (Math.random() < 0.08 ? 0.25 : 0);
    if (material.uniforms?.uPulse) material.uniforms.uPulse.value = pulse;
    // Billboard the orb so it always faces the camera (lookAt camera position)
    if (meshRef.current) {
      meshRef.current.lookAt(camera.position);
    }
  });

  return (
    <mesh ref={meshRef} position={position} renderOrder={4}>
      <planeGeometry args={[baseRadius * 2, baseRadius * 2]} />
      <primitive object={material} attach="material" />
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
