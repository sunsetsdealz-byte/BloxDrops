import React, { useEffect, useState } from "react";
import { X, CheckCircle, WarningCircle, Copy, DownloadSimple, Robot, Plug, ArrowSquareOut, Question } from "@phosphor-icons/react";
import { toast } from "sonner";
import { api, API, formatApiError } from "../lib/api";
import HowToEquipModal from "./HowToEquipModal";

// Maps a BloxDrops attachment_type → the exact Roblox "Save to Roblox" sub-category
// the user must pick in Studio. Picking "UGC Body" (or anything else) returns the
// dreaded "Invalid root instance, must be a model" error.
const ROBLOX_CATEGORY_HINT = {
  Hat: "Hats",
  Hair: "Hair Accessories",
  Back: "Back Accessories",
  Neck: "Neck Accessories",
  Face: "Face Accessories",
  Shoulder: "Shoulder Accessories",
  Front: "Front Accessories",
  Waist: "Waist Accessories",
  Hoodie: "Sweater (Layered Clothing)",
  Shirt: "T-Shirt (Layered Clothing)",
  Jacket: "Jacket (Layered Clothing)",
  Pants: "Pants (Layered Clothing)",
  auto: "Hats",
};

export default function RobloxExportModal({ generationId, onClose }) {
  const [manifest, setManifest] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [robloxStatus, setRobloxStatus] = useState(null);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingAccessory, setDownloadingAccessory] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

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
      toast.success(`3D Model uploaded · Asset #${data.asset_id}`);
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

  const downloadAccessory = async () => {
    const token = localStorage.getItem("bloxdrops_token");
    if (!token) return toast.error("Please sign in again");
    setDownloadingAccessory(true);
    try {
      const r = await fetch(`${API}/roblox/accessory/${generationId}.rbxmx`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        const msg = (await r.json().catch(() => ({}))).detail || "Download failed";
        throw new Error(msg);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(manifest?.asset_name || "bloxdrops_accessory").replace(/\s+/g, "_")}.rbxmx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Accessory file downloaded — drag into Roblox Studio");
    } catch (err) {
      toast.error(err.message || "Couldn't build the Accessory file");
    } finally {
      setDownloadingAccessory(false);
    }
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

        {/* Cross-promo: this Export flow publishes the model as an Accessory.
            If the user wanted a full avatar BODY, they should rig it first. */}
        <button
          type="button"
          onClick={() => setShowHowTo(true)}
          data-testid="export-switch-to-avatar"
          className="w-full text-left rounded-xl border border-[#00f0ff]/50 bg-[#00f0ff]/8 px-4 py-3 mb-5 flex items-center justify-between gap-3 hover:bg-[#00f0ff]/15 hover:border-[#00f0ff] transition-all group"
        >
          <p className="text-xs text-zinc-200 leading-relaxed">
            <strong className="text-[#00f0ff]">Wait — is this a full avatar (body) or an accessory (hat / hair)?</strong>{" "}
            This Export flow publishes Accessories. For a full character body, close this and click{" "}
            <strong className="text-white">&quot;Rig for Roblox&quot;</strong> in the Studio action
            bar instead — then follow the <strong>Full Rigged Avatar</strong> walkthrough.
          </p>
          <span className="text-[10px] uppercase tracking-widest font-black text-[#00f0ff] whitespace-nowrap group-hover:underline">
            Learn more →
          </span>
        </button>

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
              <PriceField
                generationId={generationId}
                manifest={manifest}
                onSaved={(m) => setManifest((prev) => ({ ...prev, ...m }))}
              />
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
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#ccff00]">Direct push · 3D Model</p>
              </div>
              {robloxStatus?.connected ? (
                <>
                  <p className="text-sm text-zinc-300 mb-3">
                    One-click upload pushes the <strong className="text-white">.glb</strong> as a real 3D Model to <strong>@{robloxStatus.roblox_user_id}</strong>&apos;s Roblox inventory via Open Cloud. Takes ~5 seconds.
                  </p>
                  {pushResult ? (
                    <div className="space-y-3">
                      <div className="bg-black/40 rounded-xl p-3 space-y-2">
                        <p className="text-xs uppercase tracking-widest text-[#ccff00] font-bold">3D Model uploaded ✓</p>
                        <p className="text-sm text-zinc-200">
                          Asset ID: <span className="font-mono">{pushResult.asset_id}</span>
                        </p>
                        {pushResult.inventory_url && (
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={pushResult.inventory_url}
                              target="_blank"
                              rel="noreferrer"
                              data-testid="export-open-in-roblox"
                              className="inline-flex items-center gap-2 bg-white text-black rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider hover:shadow-[0_0_18px_rgba(255,255,255,0.4)] transition-all"
                            >
                              <Robot size={14} weight="fill" />
                              Open in Roblox
                              <ArrowSquareOut size={11} weight="bold" />
                            </a>
                            <button
                              onClick={() => setShowHowTo(true)}
                              data-testid="export-how-to-equip"
                              className="inline-flex items-center gap-2 bg-black/60 text-zinc-200 border border-white/20 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider hover:border-[#ccff00]/70 hover:text-[#ccff00] transition-all"
                            >
                              <Question size={13} weight="fill" />
                              How to equip
                            </button>
                          </div>
                        )}
                      </div>

                      {/* === ACCESSORY WRAP FLOW (Roblox Accessory Fitting Tool) === */}
                      <div className="bg-gradient-to-br from-[#00f0ff]/10 to-[#ccff00]/8 border border-[#00f0ff]/30 rounded-xl p-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#00f0ff] mb-2 flex items-center gap-1.5">
                          <DownloadSimple size={12} weight="bold" /> Step 2 · Wrap as Accessory in Studio
                        </p>
                        <p className="text-sm text-zinc-200 mb-3 leading-relaxed">
                          To make your drop wearable, use Roblox Studio&apos;s built-in{" "}
                          <strong className="text-white">Accessory Fitting Tool</strong> — it auto-extracts
                          the mesh from your uploaded Model (which is the part the API can&apos;t expose).
                        </p>
                        <ol className="text-[11px] text-zinc-300 space-y-1.5 leading-snug list-decimal list-inside">
                          <li>In Studio: <strong className="text-white">View → Toolbox → Inventory tab → My Models</strong></li>
                          <li>Click your BloxDrops upload — it inserts into Workspace</li>
                          <li><strong className="text-white">Avatar tab → Accessory Fitting Tool</strong></li>
                          <li>
                            Asset Type:{" "}
                            <strong className="text-[#ccff00] font-mono" data-testid="studio-category-hint">
                              &ldquo;{ROBLOX_CATEGORY_HINT[manifest.attachment_type] || "Hats"}&rdquo;
                            </strong>
                            ; Selection: click the MeshPart inside your Model; click <strong className="text-white">Generate</strong>
                          </li>
                          <li>Right-click the new Accessory → <strong className="text-white">Save to Roblox</strong> → Submit</li>
                          <li>Wait for moderation → equip from your Avatar Editor</li>
                        </ol>
                        <button
                          onClick={() => setShowHowTo(true)}
                          data-testid="export-open-howto"
                          className="mt-3 bg-[#00f0ff] text-black rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider hover:shadow-[0_0_18px_rgba(0,240,255,0.5)] transition-all flex items-center gap-2"
                        >
                          See full step-by-step walkthrough →
                        </button>
                        <div className="mt-3 pt-3 border-t border-white/8 text-[10px] text-zinc-500 leading-relaxed space-y-1.5">
                          <p>
                            <strong className="text-[#fbbf24]">&ldquo;Failed to load mesh rbxassetid://…&rdquo;</strong> — you tried to use the Model assetId directly as MeshId. Roblox doesn&apos;t allow that. Use the Accessory Fitting Tool flow above.
                          </p>
                          <p>
                            <strong className="text-[#fbbf24]">&ldquo;Uploaded asset should be a Accessory but is a Model&rdquo;</strong> — in Explorer, right-click the Accessory child (hat icon), not the Model wrapper above it.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={pushToRoblox}
                      disabled={pushing}
                      data-testid="export-push-roblox"
                      className="bg-[#ccff00] text-black rounded-full px-5 py-2.5 text-sm font-black uppercase tracking-wider hover:shadow-[0_0_24px_rgba(204,255,0,0.55)] transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Robot size={16} weight="fill" />
                      {pushing ? "Uploading…" : "Push 3D Model to Roblox"}
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

      <HowToEquipModal
        open={showHowTo}
        onClose={() => setShowHowTo(false)}
        attachmentType={manifest?.attachment_type || "Hat"}
        itemName={manifest?.asset_name}
        dropId={manifest?.generation_id || manifest?.id}
      />
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

function PriceField({ generationId, manifest, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(manifest.recommended_price_robux);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setValue(manifest.recommended_price_robux);
  }, [manifest.recommended_price_robux]);

  const save = async () => {
    const num = parseInt(value, 10);
    if (!num || num < 1 || num > 1000000) {
      return toast.error("Price must be between 1 and 1,000,000 Robux");
    }
    setSaving(true);
    try {
      const { data } = await api.patch(`/export/${generationId}/price`, { price_robux: num });
      onSaved({ recommended_price_robux: data.price_robux, is_custom_price: data.is_custom_price });
      toast.success("Price updated");
      setEditing(false);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/export/${generationId}/price`, { price_robux: null });
      onSaved({ recommended_price_robux: data.price_robux, is_custom_price: data.is_custom_price });
      setValue(data.price_robux);
      toast.success("Reset to suggested price");
      setEditing(false);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-zinc-900/60 border border-[#ccff00]/40 rounded-xl p-3" data-testid="price-field-edit">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-1">Marketplace price · Robux</p>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            max={1000000}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
            autoFocus
            disabled={saving}
            data-testid="price-input"
            className="flex-1 min-w-0 bg-black/50 border border-white/15 focus:border-[#ccff00] rounded-lg px-2 py-1 text-sm font-bold text-[#ccff00] outline-none"
          />
          <button
            onClick={save}
            disabled={saving}
            data-testid="price-save"
            className="text-[10px] font-black uppercase tracking-wider text-black bg-[#ccff00] rounded-full px-2.5 py-1 hover:shadow-[0_0_12px_rgba(204,255,0,0.45)] transition-all disabled:opacity-40"
          >
            {saving ? "…" : "Save"}
          </button>
          <button
            onClick={() => { setValue(manifest.recommended_price_robux); setEditing(false); }}
            disabled={saving}
            data-testid="price-cancel"
            className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white px-1.5"
          >
            Cancel
          </button>
        </div>
        {manifest.is_custom_price && (
          <button
            onClick={resetToDefault}
            disabled={saving}
            data-testid="price-reset"
            className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-[#ff0055] mt-1.5 transition-colors"
          >
            Reset to suggested ({manifest.default_recommended_price_robux} R$)
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      data-testid="price-field"
      title="Click to edit"
      className="bg-zinc-900/60 border border-white/8 hover:border-[#ccff00]/60 rounded-xl p-3 text-left transition-colors group"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 flex items-center gap-1">
        {manifest.is_custom_price ? "Your price" : "Suggested price"}
        <span className="text-[#ccff00] opacity-0 group-hover:opacity-100 transition-opacity">·  edit</span>
      </p>
      <p className="text-sm font-bold mt-1 text-[#ccff00]">
        {manifest.recommended_price_robux.toLocaleString()} Robux
      </p>
    </button>
  );
}
