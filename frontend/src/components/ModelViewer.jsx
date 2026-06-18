import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center, Html, Bounds, useBounds } from "@react-three/drei";
import { Person } from "@phosphor-icons/react";

// Avatar try-on mannequin
const AVATAR_URL = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} dispose={null} />;
}

function AutoFit() {
  // Refit the camera once on mount — drei's <Bounds> + useBounds gives clean centered framing
  const bounds = useBounds();
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        bounds.refresh().clip().fit();
      } catch (e) {}
    }, 60);
    return () => clearTimeout(t);
  }, [bounds]);
  return null;
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
        background: "radial-gradient(circle at 50% 50%, #1a1a1d 0%, #0a0a0c 75%)",
      }}
      data-testid="model-viewer"
    >
      {url ? (
        <Canvas
          camera={{ position: [0, 0, 4], fov: 35 }}
          dpr={[1, 1.5]}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[5, 5, 5]} intensity={1.4} color="#ccff00" />
          <directionalLight position={[-5, -3, -5]} intensity={0.6} color="#ff0055" />
          <Suspense fallback={<Loader />}>
            <Bounds fit clip observe margin={1.15}>
              <Center>
                {tryOn && url !== AVATAR_URL && <Model url={AVATAR_URL} />}
                <Model url={url} />
              </Center>
              <AutoFit />
            </Bounds>
            <Environment preset="city" />
          </Suspense>
          <OrbitControls
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.7}
            target={[0, 0, 0]}
            makeDefault
          />
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
          className={`absolute top-3 right-3 z-20 rounded-full pl-2.5 pr-3.5 py-2 text-[11px] uppercase tracking-[0.18em] font-black transition-all flex items-center gap-2 backdrop-blur-md ${
            tryOn
              ? "bg-[#ccff00] text-black shadow-[0_0_24px_rgba(204,255,0,0.55)]"
              : "bg-black/75 text-white border border-white/20 hover:border-[#ccff00]/70 hover:text-[#ccff00] hover:shadow-[0_0_18px_rgba(204,255,0,0.25)]"
          }`}
        >
          <Person size={15} weight="fill" />
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
