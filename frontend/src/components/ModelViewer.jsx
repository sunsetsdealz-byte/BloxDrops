import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Bounds, Html } from "@react-three/drei";

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} dispose={null} />;
}

function Loader() {
  return (
    <Html center>
      <div className="text-zinc-400 text-sm font-medium tracking-wider">LOADING 3D…</div>
    </Html>
  );
}

export default function ModelViewer({ url, height = 360, showHint = true }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/10"
      style={{
        height,
        background:
          "radial-gradient(circle at 50% 40%, #1a1a1d 0%, #0a0a0c 70%)",
      }}
      data-testid="model-viewer"
    >
      {url ? (
        <Canvas camera={{ position: [0, 0, 4], fov: 35 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1.4} color="#ccff00" />
          <directionalLight position={[-5, -3, -5]} intensity={0.6} color="#ff0055" />
          <Suspense fallback={<Loader />}>
            <Bounds fit clip observe margin={1.2}>
              <Model url={url} />
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
      {showHint && (
        <div className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          drag to rotate · scroll to zoom
        </div>
      )}
    </div>
  );
}
