import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Lightning,
  MagicWand,
  Download,
  Question,
  CaretDown,
  CaretUp,
  Wrench,
  Upload,
  DownloadSimple,
} from "@phosphor-icons/react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

/**
 * Roblox Toolkit — collapsible card grouping all the GLB post-processing
 * pipelines (rigging, mesh optimization, future: custom VFX bake).
 * Owns its own polling for rig + optimize status so Studio.jsx doesn't have
 * to track 3+ background tasks. Calls `onUpdate(freshGen)` whenever the gen
 * doc changes so the parent stays in sync.
 */
export default function RobloxToolkitPanel({ generation, onUpdate, onOpenAvatarWalkthrough }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(true);
  const [rigging, setRigging] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [robloxConnected, setRobloxConnected] = useState(false);
  const rigPollRef = useRef(null);
  const optPollRef = useRef(null);

  const id = generation?.id;
  const status = generation?.status;
  const canRun = id && status === "completed";

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    api.get("/roblox/status")
      .then(({ data }) => setRobloxConnected(data.connected))
      .catch(() => {});
  }, [user]);

  // ── Polling: rigging
  useEffect(() => {
    if (!generation || generation.rigging_status !== "pending") {
      clearInterval(rigPollRef.current);
      return;
    }
    rigPollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/generate/${id}`);
        onUpdate?.(data);
        if (data.rigging_status !== "pending") {
          clearInterval(rigPollRef.current);
          if (data.rigging_status === "completed") {
            toast.success("Rigged avatar ready — Avatar Setup walkthrough is below");
          } else if (data.rigging_status === "failed") {
            toast.error("Rigging failed: " + (data.rigging_error || "unknown"));
          }
        }
      } catch { /* keep polling */ }
    }, 3500);
    return () => clearInterval(rigPollRef.current);
  }, [id, generation?.rigging_status, onUpdate]);

  // ── Polling: optimization
  useEffect(() => {
    if (!generation || generation.optimization_status !== "pending") {
      clearInterval(optPollRef.current);
      return;
    }
    optPollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/generate/${id}`);
        onUpdate?.(data);
        if (data.optimization_status !== "pending") {
          clearInterval(optPollRef.current);
          if (data.optimization_status === "completed") {
            toast.success("Mesh optimized — Roblox-ready topology");
          } else if (data.optimization_status === "failed") {
            toast.error("Optimization failed: " + (data.optimization_error || "unknown"));
          }
        }
      } catch { /* keep polling */ }
    }, 3500);
    return () => clearInterval(optPollRef.current);
  }, [id, generation?.optimization_status, onUpdate]);

  const handleRig = async () => {
    if (!canRun) return;
    setRigging(true);
    try {
      const { data } = await api.post(`/generations/${id}/rig`);
      onUpdate?.({ ...generation, rigging_status: data.rigging_status || "pending" });
      toast.success("Rigging started — ~1–3 min");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setRigging(false);
    }
  };

  const handleOptimize = async (density) => {
    if (!canRun) return;
    setOptimizing(true);
    try {
      const { data } = await api.post(`/generations/${id}/optimize`, { density });
      onUpdate?.({ ...generation, optimization_status: data.optimization_status || "pending" });
      toast.success(`Optimizing (${density}) — ~1–2 min`);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setOptimizing(false);
    }
  };

  const handlePushToRoblox = async () => {
    if (!canRun || !robloxConnected) return;
    setPushing(true);
    try {
      const { data } = await api.post(`/roblox/upload/${id}`);
      toast.success(`Pushed! Asset ID: ${data.asset_id}`);
      onUpdate?.({ ...generation, roblox_asset_id: data.asset_id });
      if (data.inventory_url) window.open(data.inventory_url, "_blank");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setPushing(false);
    }
  };

  if (!canRun) return null;

  const rigDone = !!generation?.rigged_model_url;
  const rigPending = generation?.rigging_status === "pending";
  const optDone = !!generation?.optimized_model_url;
  const optPending = generation?.optimization_status === "pending";

  return (
    <div
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-black/60 backdrop-blur-md overflow-hidden"
      data-testid="roblox-toolkit-panel"
    >
      {/* Header — click to collapse */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid="roblox-toolkit-toggle"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wrench size={16} weight="fill" className="text-[#ccff00]" />
          <span className="font-display text-sm font-black uppercase tracking-tighter text-white">
            Roblox Toolkit
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
            Post-process pipelines
          </span>
        </div>
        {open ? (
          <CaretUp size={14} weight="bold" className="text-zinc-400" />
        ) : (
          <CaretDown size={14} weight="bold" className="text-zinc-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-white/8 p-4 space-y-4">
          {/* ── Rigging ─────────────────────────────────────────────── */}
          <ToolkitRow
            accent="#00f0ff"
            icon={<Lightning size={14} weight="fill" className="text-[#00f0ff]" />}
            title="Auto-rig for Roblox Avatar"
            subtitle="Adds humanoid skeleton + skinning weights · ~$0.20 · 1–3 min"
            testid="toolkit-rig-section"
          >
            {!rigDone && !rigPending && (
              <button
                type="button"
                onClick={handleRig}
                disabled={rigging}
                data-testid="toolkit-rig-start"
                className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 hover:bg-[#00f0ff]/25 hover:shadow-[0_0_12px_rgba(0,240,255,0.4)] transition-all whitespace-nowrap disabled:opacity-50"
              >
                <Lightning size={11} weight="fill" />
                {rigging ? "Starting…" : "Run Rigging"}
              </button>
            )}
            {rigPending && (
              <span
                data-testid="toolkit-rig-pending"
                className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 animate-pulse"
              >
                <Lightning size={11} weight="fill" /> Rigging…
              </span>
            )}
            {rigDone && (
              <div className="flex flex-wrap gap-2">
                <a
                  href={generation.rigged_model_url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  data-testid="toolkit-rig-download"
                  className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-[#00f0ff] text-black hover:shadow-[0_0_14px_rgba(0,240,255,0.55)] transition-all"
                >
                  <Download size={11} weight="bold" /> Rigged .GLB
                </a>
                <button
                  type="button"
                  onClick={() => onOpenAvatarWalkthrough?.()}
                  data-testid="toolkit-rig-howto"
                  className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-black/70 text-[#00f0ff] border border-[#00f0ff]/40 hover:bg-[#00f0ff]/10 transition-all"
                >
                  <Question size={11} weight="fill" /> Avatar Setup walkthrough
                </button>
              </div>
            )}
          </ToolkitRow>

          {/* ── Push to Roblox ──────────────────────────────────────── */}
          {user?.role === "admin" && robloxConnected && generation?.model_url && (
            <ToolkitRow
              accent="#ccff00"
              icon={<Upload size={14} weight="fill" className="text-[#ccff00]" />}
              title="Push to Roblox"
              subtitle="Upload as Model to your Roblox inventory via Open Cloud · ~5 sec"
              testid="toolkit-push-section"
            >
              {!generation?.roblox_asset_id ? (
                <button
                  type="button"
                  onClick={handlePushToRoblox}
                  disabled={pushing}
                  data-testid="toolkit-push-button"
                  className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-[#ccff00] text-black hover:shadow-[0_0_14px_rgba(204,255,0,0.55)] transition-all disabled:opacity-50"
                >
                  <Upload size={11} weight="bold" />
                  {pushing ? "Pushing…" : "Push 3D Model"}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const response = await api.get(`/roblox/accessory/${id}.rbxmx`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `${generation.display_name || 'accessory'}.rbxmx`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (e) {
                      toast.error('Download failed');
                    }
                  }}
                  data-testid="toolkit-rbxmx-download"
                  className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-[#ccff00] text-black hover:shadow-[0_0_14px_rgba(204,255,0,0.55)] transition-all"
                >
                  <DownloadSimple size={11} weight="bold" /> Download .RBXMX
                </button>
              )}
            </ToolkitRow>
          )}

          {/* ── Mesh Optimization ───────────────────────────────────── */}
          <ToolkitRow
            accent="#fbbf24"
            icon={<MagicWand size={14} weight="fill" className="text-[#fbbf24]" />}
            title="Mesh Optimization"
            subtitle="Smart retopo + polycount reduction for UGC limits · ~$0.10 · 1–2 min"
            testid="toolkit-optimize-section"
          >
            {!optDone && !optPending && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Density:
                </span>
                {["low", "medium", "high"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleOptimize(d)}
                    disabled={optimizing}
                    data-testid={`toolkit-optimize-${d}`}
                    title={
                      d === "low"
                        ? "Lowest poly — fits inside hat/accessory limits"
                        : d === "medium"
                        ? "Balanced (default)"
                        : "Highest detail — only for tiny standalone parts"
                    }
                    className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/40 hover:bg-[#fbbf24]/25 transition-all disabled:opacity-50"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
            {optPending && (
              <span
                data-testid="toolkit-optimize-pending"
                className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30 animate-pulse"
              >
                <MagicWand size={11} weight="fill" /> Optimizing…
              </span>
            )}
            {optDone && (
              <a
                href={generation.optimized_model_url}
                download
                target="_blank"
                rel="noreferrer"
                data-testid="toolkit-optimize-download"
                title={`Polycount-optimized GLB (${generation.optimization_density || "medium"} density)`}
                className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 bg-[#fbbf24] text-black hover:shadow-[0_0_14px_rgba(251,191,36,0.55)] transition-all"
              >
                <Download size={11} weight="bold" /> Optimized .GLB
              </a>
            )}
          </ToolkitRow>
        </div>
      )}
    </div>
  );
}

function ToolkitRow({ accent, icon, title, subtitle, children, testid }) {
  return (
    <div
      className="rounded-xl border border-white/8 bg-black/40 p-3"
      style={{ boxShadow: `inset 0 0 0 1px ${accent}10` }}
      data-testid={testid}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {icon}
            <p className="font-display text-xs font-black uppercase tracking-tighter text-white">
              {title}
            </p>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
