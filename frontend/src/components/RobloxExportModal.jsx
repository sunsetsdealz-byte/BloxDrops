import React, { useEffect, useState } from "react";
import { X, CheckCircle, WarningCircle, Copy, DownloadSimple, Robot, Plug, ArrowSquareOut } from "@phosphor-icons/react";
import { toast } from "sonner";
import { api, API, formatApiError } from "../lib/api";

export default function RobloxExportModal({ generationId, onClose }) {
  const [manifest, setManifest] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [robloxStatus, setRobloxStatus] = useState(null);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [m, c, rs] = await Promise.all([
          api.get(`/export/${generationId}/manifest`),
          api.get(`/export/${generationId}/checklist`),
          api.get(`/roblox/status`).catch(() => ({ data: { connected: false } })),
        ]);
        setManifest(m.data);
        setChecklist(c.data);
        setRobloxStatus(rs.data);
      } catch (err) {
        toast.error("Couldn't load export details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [generationId]);

  const pushToRoblox = async () => {
    setPushing(true);
    setPushResult(null);
    try {
      const { data } = await api.post(`/roblox/upload/${generationId}`);
      setPushResult(data);
      toast.success(`Decal pushed · Asset #${data.asset_id}`);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setPushing(false);
    }
  };

  const copyManifest = () => {
    if (!manifest) return;
    navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
    toast.success("Manifest copied to clipboard");
  };

  const downloadGlb = () => {
    const token = localStorage.getItem("bloxdrops_token");
    const a = document.createElement("a");
    a.href = `${API}/export/${generationId}/glb`;
    a.target = "_blank";
    // Append token to URL is not possible; use fetch & blob instead
    fetch(`${API}/export/${generationId}/glb`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${(manifest?.asset_name || "bloxdrops-item").replace(/\s+/g, "_")}.glb`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error("Download failed"));
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      data-testid="roblox-export-modal"
    >
      <div
        className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-2xl p-6 md:p-8 my-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
          data-testid="export-close"
        >
          <X size={22} weight="bold" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Robot size={20} weight="duotone" className="text-[#ccff00]" />
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-[#ccff00]">Roblox Marketplace</p>
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter mb-1">
          Export & Upload
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          Download the .GLB, copy the manifest, and follow the steps in Roblox Studio.
        </p>

        {loading || !manifest || !checklist ? (
          <div className="text-zinc-500 text-sm text-center py-10">Loading…</div>
        ) : (
          <>
            {/* CHECKLIST */}
            <div className="bg-zinc-900/60 border border-white/8 rounded-2xl p-5 mb-5">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 mb-3">
                Pre-flight checklist · {checklist.attachment}
              </p>
              <ul className="space-y-2">
                {checklist.checks.map((c) => (
                  <li key={c.name} className="flex items-start gap-2 text-sm">
                    {c.ok ? (
                      <CheckCircle size={18} weight="fill" className="text-[#ccff00] flex-shrink-0 mt-0.5" />
                    ) : (
                      <WarningCircle size={18} weight="fill" className="text-[#ff0055] flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-zinc-200">{c.name}</p>
                      <p className="text-xs text-zinc-500">{c.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* MANIFEST PREVIEW */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <Field label="Asset name" value={manifest.asset_name} />
              <Field label="Attachment" value={manifest.attachment_point} />
              <Field label="Category" value={manifest.category} />
              <Field label="Suggested price" value={`${manifest.recommended_price_robux} Robux`} accent />
            </div>

            {/* ACTIONS */}
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={downloadGlb}
                data-testid="export-download-glb"
                className="btn-volt rounded-full px-5 py-2.5 text-sm flex items-center gap-2"
              >
                <DownloadSimple size={16} weight="bold" /> Download .GLB
              </button>
              <button
                onClick={copyManifest}
                data-testid="export-copy-manifest"
                className="btn-ghost rounded-full px-5 py-2.5 text-sm flex items-center gap-2 font-bold uppercase tracking-wider"
              >
                <Copy size={16} weight="bold" /> Copy manifest
              </button>
            </div>

            {/* ROBLOX PUSH */}
            <div className="bg-gradient-to-br from-[#ccff00]/8 via-zinc-900/40 to-[#ff0055]/8 border border-[#ccff00]/30 rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Robot size={18} weight="duotone" className="text-[#ccff00]" />
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#ccff00]">Direct push · Preview Decal only</p>
              </div>
              {robloxStatus?.connected ? (
                <>
                  <p className="text-sm text-zinc-300 mb-2">
                    One-click push uploads the <strong className="text-white">PNG preview</strong> as a Decal to <strong>@{robloxStatus.roblox_user_id}</strong>'s inventory — handy for thumbnails &amp; tests.
                  </p>
                  <div className="text-[11px] text-zinc-400 bg-black/30 border border-white/8 rounded-lg px-3 py-2 mb-3 leading-relaxed">
                    <strong className="text-[#fbbf24]">Heads up:</strong> Roblox Open Cloud only accepts <code className="text-[#ccff00]">.fbx</code> for Model assets — not <code className="text-[#ccff00]">.glb</code>. To publish the 3D accessory to the Marketplace, download the .GLB below, open Roblox Studio &gt; <em>Home → Import 3D</em>, then use <em>Avatar → Accessory Fitting Tool</em> to publish.
                  </div>
                  {pushResult ? (
                    <div className="bg-black/40 rounded-xl p-3 space-y-1.5">
                      <p className="text-xs uppercase tracking-widest text-[#ccff00] font-bold">Decal pushed ✓</p>
                      <p className="text-sm text-zinc-200">
                        Asset ID: <span className="font-mono">{pushResult.asset_id}</span>
                      </p>
                      {pushResult.inventory_url && (
                        <a
                          href={pushResult.inventory_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#ccff00] font-bold underline flex items-center gap-1"
                        >
                          Open in Roblox Inventory <ArrowSquareOut size={12} weight="bold" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={pushToRoblox}
                      disabled={pushing}
                      data-testid="export-push-roblox"
                      className="bg-[#ccff00] text-black rounded-full px-5 py-2.5 text-sm font-black uppercase tracking-wider hover:shadow-[0_0_24px_rgba(204,255,0,0.55)] transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Robot size={16} weight="fill" />
                      {pushing ? "Pushing…" : "Push preview decal"}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-zinc-300">
                    Connect your Roblox account to push creations straight to your Inventory.
                  </p>
                  <a
                    href="/profile"
                    onClick={onClose}
                    className="btn-ghost rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    data-testid="export-connect-roblox-cta"
                  >
                    <Plug size={12} weight="bold" /> Connect now
                  </a>
                </div>
              )}
            </div>

            {/* INSTRUCTIONS */}
            <div className="bg-zinc-900/40 rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 mb-3">
                Upload to Roblox Marketplace
              </p>
              <ol className="space-y-2 text-sm text-zinc-200">
                {manifest.upload_instructions.map((step, i) => (
                  <li key={i} className="leading-relaxed">
                    <span className="text-[#ccff00] font-bold mr-1">{step.split(".")[0]}.</span>
                    {step.split(".").slice(1).join(".")}
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, accent }) {
  return (
    <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">{label}</p>
      <p className={`text-sm font-bold mt-1 ${accent ? "text-[#ccff00]" : "text-zinc-200"}`}>{value}</p>
    </div>
  );
}
