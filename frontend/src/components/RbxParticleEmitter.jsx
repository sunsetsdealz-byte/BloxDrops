import React, { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Custom particle emitter that *exactly* replays a Roblox ParticleEmitter config
 * imported from a .rbxm binary. One `<RbxParticleEmitter />` instance per emitter.
 *
 * Props:
 *   config — object with shape returned by backend/rbxm_vfx_import.py:
 *     { texture, rate, lifetime:{min,max}, speed:{min,max},
 *       rotation:{min,max}, rot_speed:{min,max}, spread_angle:{x,y},
 *       color_keypoints, size_keypoints, transparency_keypoints,
 *       light_emission, brightness, locked_to_part, acceleration }
 *
 *   maxParticles — pool cap (default derived from rate × maxLifetime + 30%)
 */
export default function RbxParticleEmitter({ config, maxParticles }) {
  const pointsRef = useRef();
  const cap = useMemo(() => {
    if (maxParticles) return maxParticles;
    const rate = config.rate || 10;
    const lifeMax = (config.lifetime && config.lifetime.max) || 2;
    return Math.max(8, Math.ceil(rate * lifeMax * 1.4));
  }, [config, maxParticles]);

  // Load the particle sprite texture from the (already-resolved) public URL
  const texture = useLoader(THREE.TextureLoader, config.texture || "");
  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
  }

  // Particle pool (CPU-side state)
  const pool = useMemo(() => {
    return Array.from({ length: cap }, () => ({
      alive: false,
      age: 0,
      lifetime: 1,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      rotation: 0,
      rotSpeed: 0,
    }));
  }, [cap]);

  // GPU buffers — positions, colors (rgba), sizes
  const { positions, colors, sizes, rotations } = useMemo(() => {
    return {
      positions: new Float32Array(cap * 3),
      colors:    new Float32Array(cap * 4),
      sizes:     new Float32Array(cap),
      rotations: new Float32Array(cap),
    };
  }, [cap]);

  const geometryRef = useRef();
  const spawnAccumRef = useRef(0);

  // ---- interpolation helpers ----
  const lerpScalar = (keypoints, t, defaultVal) => {
    if (!keypoints || keypoints.length === 0) return defaultVal;
    if (t <= keypoints[0].t) return keypoints[0].v;
    if (t >= keypoints[keypoints.length - 1].t) return keypoints[keypoints.length - 1].v;
    for (let i = 0; i < keypoints.length - 1; i++) {
      const a = keypoints[i], b = keypoints[i + 1];
      if (t >= a.t && t <= b.t) {
        const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
        return a.v + (b.v - a.v) * u;
      }
    }
    return defaultVal;
  };
  const lerpColor = (keypoints, t, out) => {
    if (!keypoints || keypoints.length === 0) { out.set(1, 1, 1); return; }
    if (t <= keypoints[0].t) { out.set(keypoints[0].r, keypoints[0].g, keypoints[0].b); return; }
    const last = keypoints[keypoints.length - 1];
    if (t >= last.t) { out.set(last.r, last.g, last.b); return; }
    for (let i = 0; i < keypoints.length - 1; i++) {
      const a = keypoints[i], b = keypoints[i + 1];
      if (t >= a.t && t <= b.t) {
        const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
        out.set(a.r + (b.r - a.r) * u, a.g + (b.g - a.g) * u, a.b + (b.b - a.b) * u);
        return;
      }
    }
  };

  // ---- main update loop ----
  const tmpColor = useMemo(() => new THREE.Color(), []);
  useFrame((_, dt) => {
    const clampedDt = Math.min(dt, 0.05); // protect against tab switches
    // Spawn budget
    spawnAccumRef.current += clampedDt * (config.rate || 0);
    while (spawnAccumRef.current >= 1) {
      spawnAccumRef.current -= 1;
      // Find a dead slot
      const slot = pool.find((p) => !p.alive);
      if (!slot) break;
      const lt = config.lifetime || { min: 1, max: 1 };
      slot.lifetime = lt.min + Math.random() * (lt.max - lt.min);
      slot.age = 0;
      slot.alive = true;
      // Spawn from a tight point (Roblox emitters spawn at a single Attachment).
      // Slight jitter so particles don't perfectly overlap on frame 0.
      slot.position.set(
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.08,
      );
      // Velocity from spread angle (degrees) — sample a cone in +Y up direction.
      const spread = config.spread_angle || { x: 0, y: 0 };
      const halfX = (spread.x * Math.PI) / 360;
      const halfY = (spread.y * Math.PI) / 360;
      const theta = (Math.random() - 0.5) * 2 * halfX;
      const phi   = (Math.random() - 0.5) * 2 * halfY;
      const sp = config.speed || { min: 0, max: 0 };
      const speed = sp.min + Math.random() * (sp.max - sp.min);
      slot.velocity.set(
        Math.sin(theta) * speed,
        Math.cos(theta) * Math.cos(phi) * speed,
        Math.sin(phi) * speed,
      );
      const rot = config.rotation || { min: 0, max: 0 };
      slot.rotation = ((rot.min + Math.random() * (rot.max - rot.min)) * Math.PI) / 180;
      const rs = config.rot_speed || { min: 0, max: 0 };
      slot.rotSpeed = ((rs.min + Math.random() * (rs.max - rs.min)) * Math.PI) / 180;
    }

    // Update all particles + push to GPU buffers
    const drag = config.drag || 0;
    const acc = config.acceleration || { x: 0, y: 0, z: 0 };
    for (let i = 0; i < cap; i++) {
      const p = pool[i];
      const o = i * 3;
      const oc = i * 4;
      if (!p.alive) {
        // Hide by pushing far away + alpha 0
        positions[o] = 9999;
        positions[o + 1] = 9999;
        positions[o + 2] = 9999;
        colors[oc + 3] = 0;
        sizes[i] = 0;
        continue;
      }
      p.age += clampedDt;
      const tNorm = p.age / p.lifetime;
      if (tNorm >= 1) { p.alive = false; sizes[i] = 0; colors[oc + 3] = 0; continue; }

      // Physics
      p.velocity.x = (p.velocity.x + acc.x * clampedDt) * (1 - drag * clampedDt);
      p.velocity.y = (p.velocity.y + acc.y * clampedDt) * (1 - drag * clampedDt);
      p.velocity.z = (p.velocity.z + acc.z * clampedDt) * (1 - drag * clampedDt);
      p.position.x += p.velocity.x * clampedDt;
      p.position.y += p.velocity.y * clampedDt;
      p.position.z += p.velocity.z * clampedDt;
      p.rotation  += p.rotSpeed * clampedDt;

      positions[o]     = p.position.x;
      positions[o + 1] = p.position.y;
      positions[o + 2] = p.position.z;
      rotations[i]     = p.rotation;

      // Interp color
      lerpColor(config.color_keypoints, tNorm, tmpColor);
      colors[oc]     = tmpColor.r;
      colors[oc + 1] = tmpColor.g;
      colors[oc + 2] = tmpColor.b;
      // Transparency: Roblox stores 0=opaque, 1=invisible → alpha = 1 - t
      const trans = lerpScalar(config.transparency_keypoints, tNorm, 0);
      colors[oc + 3] = Math.max(0, Math.min(1, 1 - trans));
      const sz = lerpScalar(config.size_keypoints, tNorm, 0.5);
      // Roblox stores Size in studs. Our viewer normalizes models to ~1.5 world units,
      // so 1 stud ≈ 0.3 world units. The point-shader scales by (300/-z) which gives
      // ~75× at default camera distance, so we use ×4 here for a ~visible-but-not-huge
      // wisp that matches the Roblox catalog thumbnail proportions.
      sizes[i] = sz * 4;
    }

    if (geometryRef.current) {
      geometryRef.current.attributes.position.needsUpdate = true;
      geometryRef.current.attributes.color.needsUpdate = true;
      geometryRef.current.attributes.size.needsUpdate = true;
      geometryRef.current.attributes.rotation.needsUpdate = true;
    }
  });

  // ---- material: additive blending + texture sample + per-particle rotation ----
  const material = useMemo(() => {
    const brightness = config.brightness ?? 1;
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTex: { value: texture },
        uBrightness: { value: brightness },
      },
      vertexShader: `
        attribute float size;
        attribute float rotation;
        attribute vec4 color;
        varying vec4 vColor;
        varying float vRotation;
        void main() {
          vColor = color;
          vRotation = rotation;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform float uBrightness;
        varying vec4 vColor;
        varying float vRotation;
        void main() {
          if (vColor.a < 0.001) discard;
          // Rotate the sprite UVs around (0.5, 0.5)
          float c = cos(vRotation), s = sin(vRotation);
          vec2 uv = gl_PointCoord - vec2(0.5);
          uv = mat2(c, -s, s, c) * uv + vec2(0.5);
          if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
          vec4 tex = texture2D(uTex, uv);
          gl_FragColor = vec4(tex.rgb * vColor.rgb * uBrightness, tex.a * vColor.a);
        }
      `,
    });
  }, [texture, config.brightness]);

  if (!texture) return null;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" count={cap} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color"    count={cap} array={colors}    itemSize={4} />
        <bufferAttribute attach="attributes-size"     count={cap} array={sizes}     itemSize={1} />
        <bufferAttribute attach="attributes-rotation" count={cap} array={rotations} itemSize={1} />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  );
}
