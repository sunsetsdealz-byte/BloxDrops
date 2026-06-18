import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center, Html, Bounds, useBounds } from "@react-three/drei";
import { MagnifyingGlassPlus, X } from "@phosphor-icons/react";
import UnavailablePlaceholder from "./UnavailablePlaceholder";
import VFXLayer from "./VFXLayer";

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} dispose={null} />;
}

function AutoFit() {
  const bounds = useBounds();
  React.useEffect(() => {
    const t = setTimeout(() => {
      try { bounds.refresh().clip().fit(); } catch (e) {}
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

/** Catches GLB load failures (404, CORS, network) and shows the branded
 *  placeholder instead of letting the whole viewer crash. Resets when `url`
 *  prop changes so a successful next load still renders. */
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(prev) {
    if (prev.url !== this.props.url && this.state.failed) {
      this.setState({ failed: false });
    }
  }
  componentDidCatch() { /* swallow — placeholder communicates the failure */ }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

// `allowTryOn` retained as a prop name for backwards-compat; semantically it now
// toggles the Zoom (fullscreen) button visibility.
export default function ModelViewer({ url, height = 360, showHint = true, allowTryOn = true, allowZoom, vfxPreset = null }) {
  const showZoomBtn = allowZoom ?? allowTryOn;
  const [zoomed, setZoomed] = useState(false);
  const isFullHeight = height === "100%";

  useEffect(() => {
    if (!zoomed) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") setZoomed(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomed]);

  const containerClass = zoomed
    ? "fixed inset-0 z-[100] w-screen h-screen rounded-none border-0 bg-black/95 backdrop-blur-xl"
    : "relative w-full rounded-2xl overflow-hidden border border-white/10";

  const containerStyle = zoomed
    ? { background: "radial-gradient(circle at 50% 50%, #15151a 0%, #050507 70%)" }
    : {
        height: isFullHeight ? "100%" : height,
        background: "radial-gradient(circle at 50% 50%, #1a1a1d 0%, #0a0a0c 75%)",
      };

  const placeholder = (
    <UnavailablePlaceholder
      title={url ? "MODEL FAILED TO LOAD" : "DROP UNAVAILABLE"}
      hint={
        url
          ? "We couldn't fetch this 3D file. It may have been removed or the CDN is offline."
          : "This 3D model is still cooking or has been removed."
      }
    />
  );

  return (
    <div
      className={containerClass}
      style={containerStyle}
      data-testid="model-viewer"
    >
      {url ? (
        <ModelErrorBoundary url={url} fallback={placeholder}>
          <Canvas
            camera={{ position: [0, 0, 4], fov: 35 }}
            dpr={[1, 1.5]}
            style={{ width: "100%", height: "100%" }}
          >
            <ambientLight intensity={0.55} />
            <directionalLight position={[5, 5, 5]} intensity={1.4} color="#ccff00" />
            <directionalLight position={[-5, -3, -5]} intensity={0.6} color="#ff0055" />
            <Suspense fallback={<Loader />}>
              <Bounds fit clip observe margin={zoomed ? 1.05 : 1.15}>
                <Center>
                  <Model url={url} />
                </Center>
                <AutoFit />
              </Bounds>
              <VFXLayer preset={vfxPreset} />
              <Environment preset="city" />
            </Suspense>
            <OrbitControls
              enablePan={zoomed}
              autoRotate={!zoomed}
              autoRotateSpeed={0.7}
              target={[0, 0, 0]}
              makeDefault
            />
          </Canvas>
        </ModelErrorBoundary>
      ) : (
        placeholder
      )}

      {url && showZoomBtn && (
        <button
          onClick={() => setZoomed((v) => !v)}
          data-testid="viewer-zoom-toggle"
          aria-label={zoomed ? "Exit fullscreen" : "Zoom in"}
          className={`absolute z-20 rounded-full pl-2.5 pr-3.5 py-2 text-[11px] uppercase tracking-[0.18em] font-black transition-all flex items-center gap-2 backdrop-blur-md ${
            zoomed ? "top-5 right-5" : "top-3 right-3"
          } ${
            zoomed
              ? "bg-[#ccff00] text-black shadow-[0_0_24px_rgba(204,255,0,0.55)] hover:bg-white"
              : "bg-black/75 text-white border border-white/20 hover:border-[#ccff00]/70 hover:text-[#ccff00] hover:shadow-[0_0_18px_rgba(204,255,0,0.25)]"
          }`}
        >
          {zoomed ? <X size={15} weight="bold" /> : <MagnifyingGlassPlus size={15} weight="bold" />}
          {zoomed ? "Close" : "Zoom"}
        </button>
      )}

      {url && showHint && (
        <div className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          drag to rotate · scroll to zoom
        </div>
      )}
    </div>
  );
}
