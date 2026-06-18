import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Bounds, Html } from "@react-three/drei";
import { UserCircle, Cube } from "@phosphor-icons/react";

// A free Roblox-ish avatar GLB (Khronos sample) used as the try-on mannequin.
const AVATAR_URL = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

function Model({ url, scale = 1, position = [0, 0, 0] }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} scale={scale} position={position} dispose={null} />;
}

function Loader() {
  return (
    <Html center>
      <div className="text-zinc-400 text-sm font-medium tracking-wider">LOADING 3D…</div>
    </Html>
  );
}

export default function ModelViewer({ url, height = 360, showHint = true, allowTryOn = true }) {
  const [tryOn, setTryOn] = useState(false);
  const isFullHeight = height === "100%";

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/10"
      style={{
        height: isFullHeight ? "100%" : height,
        background: "radial-gradient(circle at 50% 40%, #1a1a1d 0%, #0a0a0c 70%)",
      }}
      data-testid="model-viewer"
    >
      {url ? (
        <Canvas camera={{ position: [0, 0, 4], fov: 35 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1.4} color="#ccff00" />
          <directionalLight position={[-5, -3, -5]} intensity={0.6} color="#ff0055" />
          <Suspense fallback={<Loader />}>
            <Bounds fit clip observe margin={tryOn ? 1.4 : 1.2}>
              {tryOn && url !== AVATAR_URL && (
                <Model url={AVATAR_URL} scale={1} position={[0, -0.2, 0]} />
              )}
              <Model
                url={url}
                scale={tryOn ? 0.5 : 1}
                position={tryOn ? [0, 0.8, 0.2] : [0, 0, 0]}
              />
            </Bounds>
            <Environment preset="city" />
          </Suspense>
          <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.7} />
        </Canvas>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm tracking-wider">
          NO MODEL LOADED
        </div>
      )}

      {url && allowTryOn && (
        <button
          onClick={() => setTryOn((v) => !v)}
          data-testid="viewer-tryon-toggle"
          className={`absolute top-3 right-3 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all flex items-center gap-1.5 ${
            tryOn ? "bg-[#ccff00] text-black" : "bg-black/70 text-white border border-white/15 hover:border-white/40"
          }`}
        >
          {tryOn ? <UserCircle size={12} weight="fill" /> : <Cube size={12} weight="fill" />}
          {tryOn ? "On avatar" : "Try on avatar"}
        </button>
      )}

      {showHint && (
        <div className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          drag to rotate · scroll to zoom
        </div>
      )}
    </div>
  );
}

useGLTF.preload(AVATAR_URL);
