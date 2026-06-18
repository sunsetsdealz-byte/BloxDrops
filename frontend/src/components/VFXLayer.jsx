import React, { useRef } from "react";
import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

/**
 * Per-preset visual config — designed to mirror Roblox UGC particle emitters
 * (e.g. Stormbreak Horns of the Tempest Skies = purple_tempest).
 *
 * Each preset returns props for drei's <Sparkles>. We layer two emitters per
 * preset: a tight core swarm + a wider halo, for that authentic "VFX field"
 * feel instead of flat dots.
 */
const PRESETS = {
  purple_tempest: {
    color:  "#a855f7",
    accent: "#ff00ff",
    coreCount: 60,  haloCount: 35,
    coreSize: 6,    haloSize: 3,
    coreSpeed: 0.9, haloSpeed: 0.35,
    coreScale: [1.6, 2.1, 1.6],
    haloScale: [3.2, 3.4, 3.2],
  },
  red_flame: {
    color:  "#ff4d2e",
    accent: "#ffae00",
    coreCount: 70,  haloCount: 50,
    coreSize: 7,    haloSize: 4,
    coreSpeed: 1.2, haloSpeed: 0.5,
    coreScale: [1.4, 2.4, 1.4],
    haloScale: [2.8, 3.6, 2.8],
  },
  blue_frost: {
    color:  "#00e5ff",
    accent: "#ffffff",
    coreCount: 55,  haloCount: 30,
    coreSize: 5,    haloSize: 3,
    coreSpeed: 0.55, haloSpeed: 0.2,
    coreScale: [1.8, 1.9, 1.8],
    haloScale: [3.4, 3.0, 3.4],
  },
  gold_aura: {
    color:  "#fbbf24",
    accent: "#ffffff",
    coreCount: 50,  haloCount: 25,
    coreSize: 6,    haloSize: 4,
    coreSpeed: 0.4, haloSpeed: 0.15,
    coreScale: [2.0, 2.2, 2.0],
    haloScale: [3.6, 3.4, 3.6],
  },
  toxic_green: {
    color:  "#a3e635",
    accent: "#00ff66",
    coreCount: 65,  haloCount: 35,
    coreSize: 6,    haloSize: 3,
    coreSpeed: 0.75, haloSpeed: 0.3,
    coreScale: [1.7, 2.0, 1.7],
    haloScale: [3.2, 3.2, 3.2],
  },
  volt_lightning: {
    color:  "#ccff00",
    accent: "#ffffff",
    coreCount: 75,  haloCount: 45,
    coreSize: 6,    haloSize: 3,
    coreSpeed: 1.4, haloSpeed: 0.6,
    coreScale: [1.5, 2.3, 1.5],
    haloScale: [3.0, 3.6, 3.0],
  },
};

function Rotator({ children, speed = 0.2 }) {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * speed; });
  return <group ref={ref}>{children}</group>;
}

/**
 * Renders a preset particle effect aurora around a 3D model. Mount as a
 * sibling of the <Model> inside the same <Bounds>/Canvas so it auto-centers.
 *
 * Props:
 *   preset   — preset key (e.g. "purple_tempest"). null/unknown → renders nothing.
 *   intensity — 0..2 multiplier on particle counts (default 1).
 */
export default function VFXLayer({ preset, intensity = 1 }) {
  const cfg = preset && PRESETS[preset];
  if (!cfg) return null;

  const c = (n) => Math.max(4, Math.round(n * intensity));
  return (
    <Rotator speed={0.15}>
      <Sparkles
        count={c(cfg.coreCount)}
        scale={cfg.coreScale}
        size={cfg.coreSize}
        speed={cfg.coreSpeed}
        color={cfg.color}
        opacity={1}
      />
      <Sparkles
        count={c(cfg.haloCount)}
        scale={cfg.haloScale}
        size={cfg.haloSize}
        speed={cfg.haloSpeed}
        color={cfg.accent}
        opacity={0.55}
      />
      <pointLight
        position={[0, 0, 0]}
        color={cfg.color}
        intensity={0.9}
        distance={3.2}
        decay={2}
      />
    </Rotator>
  );
}

export const VFX_PRESET_KEYS = Object.keys(PRESETS);
