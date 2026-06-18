import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Sparkle, MagicWand, ImageSquare, TextT, Download, ArrowsClockwise, Heart, Robot, Hash, Camera, Lock, Lightning, Trash, ArrowClockwise } from "@phosphor-icons/react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import ModelViewer from "../components/ModelViewer";
import RobloxExportModal from "../components/RobloxExportModal";
import DropBadges from "../components/DropBadges";
import { EDITION_CAP_OPTIONS, signatureShort } from "../lib/rarity";
import { TID } from "../constants/testIds";

const ATTACHMENTS = ["Hat", "Hair", "Back", "Neck", "Face", "Shoulder", "Hoodie", "Shirt", "Jacket", "auto"];
const STYLES = ["auto", "anime", "gothic", "streetwear", "cyberpunk", "realistic", "fantasy", "kawaii", "horror", "y2k"];
const SAMPLES = [
  "Glowing red demon hoodie with stitched smile",
  "Anime spiky white hair with blue tips",
  "Gothic black cross necklace with silver pendant",
  "Cyberpunk LED visor with circuit patterns",
  "Cozy knitted holiday sweater with snowflakes",
  "Flaming axe with crystal handle",
];

export default function Studio() {
  const { user, refresh } = useAuth();
  const [searchParams] = useSearchParams();
  const viewId = searchParams.get("view");

  const PAID_PLANS = ["creator", "creator_annual", "pro", "pro_annual"];
  const isPaid = user && (user.role === "admin" || PAID_PLANS.includes(user.plan));

  const [mode, setMode] = useState("text"); // text | image | photo
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageMode, setImageMode] = useState("url"); // url | upload
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState("Hat");
  const [style, setStyle] = useState("auto");
  const [editionCap, setEditionCap] = useState(0); // 0 = unlimited
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [currentGen, setCurrentGen] = useState(null);
  const [history, setHistory] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [genesisRemaining, setGenesisRemaining] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [vfxPresets, setVfxPresets] = useState([]);
  const [savingVfx, setSavingVfx] = useState(false);
  const pollRef = useRef(null);

  // Pull live Genesis counter
  useEffect(() => {
    api.get("/stats")
      .then((r) => setGenesisRemaining(r.data?.genesis_remaining ?? null))
      .catch(() => {});
  }, []);

  const uploadFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please drop an image file");
    if (file.size > 8 * 1024 * 1024) return toast.error("Max 8 MB.");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fullUrl = data.url.startsWith("http") ? data.url : `${process.env.REACT_APP_BACKEND_URL}${data.url}`;
      setImageUrl(fullUrl);
      toast.success("Uploaded.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e) => uploadFile(e.target.files?.[0]);

  const loadHistory = async () => {
    try {
      const { data } = await api.get("/me/generations");
      setHistory(data.items || []);
    } catch { /* ignore */ }
  };

  const ownsCurrent = currentGen && user && (user.role === "admin" || currentGen.user_id === user.id);

  const deleteCurrent = async () => {
    if (!currentGen) return;
    const ok = window.confirm(
      `Delete "${(currentGen.original_prompt || currentGen.prompt || "this creation").slice(0, 60)}"?\n\nThis permanently removes the drop, its likes and any cancelled listings. This action cannot be undone.`
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await api.delete(`/generations/${currentGen.id}`);
      setHistory((prev) => prev.filter((i) => i.id !== currentGen.id));
      setCurrentGen(null);
      toast.success("Creation deleted");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  const regenerateCurrent = async () => {
    if (!currentGen) return;
    const ok = window.confirm(
      "Regenerate this drop with the latest HD/PBR quality settings? The existing model will be replaced (likes, edition #, and badges are preserved)."
    );
    if (!ok) return;
    setRegenerating(true);
    try {
      const { data } = await api.post(`/generations/${currentGen.id}/regenerate`);
      // Flip to pending locally so the GENERATING overlay shows immediately
      setCurrentGen((prev) => prev ? { ...prev, status: "pending", model_url: null } : prev);
      toast.success("Regenerating with HD/PBR — usually under 2 minutes");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setRegenerating(false);
    }
  };

  // Admin-only: VFX preset attachment for drops
  const isAdmin = user?.role === "admin";
  useEffect(() => {
    if (!isAdmin) return;
    api.get("/admin/vfx/presets")
      .then(({ data }) => setVfxPresets(data.presets || []))
      .catch(() => {});
  }, [isAdmin]);

  const setVfxPreset = async (presetKey) => {
    if (!currentGen) return;
    setSavingVfx(true);
    try {
      await api.post(`/admin/generations/${currentGen.id}/vfx`, { preset: presetKey });
      setCurrentGen((prev) => prev ? { ...prev, vfx_preset: presetKey } : prev);
      toast.success(presetKey ? "VFX preset attached" : "VFX preset cleared");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSavingVfx(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  useEffect(() => {
    if (viewId) {
      api.get(`/generate/${viewId}`).then((r) => setCurrentGen(r.data)).catch(() => {});
    }
  }, [viewId]);

  // Poll pending generation
  useEffect(() => {
    if (!currentGen || currentGen.status !== "pending") {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/generate/${currentGen.id}`);
        setCurrentGen(data);
        if (data.status !== "pending") {
          clearInterval(pollRef.current);
          loadHistory();
          if (data.status === "completed") toast.success("Your creation is ready!");
          if (data.status === "failed") toast.error("Generation failed: " + (data.error || "unknown"));
        }
      } catch { /* keep polling */ }
    }, 2200);
    return () => clearInterval(pollRef.current);
  }, [currentGen?.id, currentGen?.status]);

  const enhance = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try {
      const { data } = await api.post("/prompt/enhance", { prompt, attachment_type: attachment, style });
      setPrompt(data.enhanced);
      toast.success("Prompt boosted ✨");
    } catch (err) {
      toast.error("Enhance failed: " + formatApiError(err));
    } finally {
      setEnhancing(false);
    }
  };

  const generateText = async () => {
    if (!prompt.trim()) return toast.error("Add a prompt first");
    setGenerating(true);
    try {
      const { data } = await api.post("/generate/text-to-3d", {
        prompt, attachment_type: attachment, style, edition_cap: editionCap,
      });
      setCurrentGen({ id: data.id, status: "pending", original_prompt: prompt, attachment_type: attachment, style });
      refresh();
      toast.success(data.demo_mode ? "Generating (demo mode)…" : "Submitted to fal.ai…");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setGenerating(false);
    }
  };

  const generateImage = async () => {
    if (!imageUrl.trim()) return toast.error("Paste an image URL");
    setGenerating(true);
    try {
      const { data } = await api.post("/generate/image-to-3d", {
        image_url: imageUrl, attachment_type: attachment, style, edition_cap: editionCap,
      });
      setCurrentGen({ id: data.id, status: "pending", source_image_url: imageUrl, attachment_type: attachment, style });
      refresh();
      toast.success(data.demo_mode ? "Generating (demo mode)…" : "Submitted to fal.ai…");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setGenerating(false);
    }
  };

  const generatePhoto = async () => {
    if (!imageUrl.trim()) return toast.error("Upload a real-world photo first");
    if (!isPaid) return toast.error("Photo Scanner requires Creator or Pro plan");
    setGenerating(true);
    try {
      const { data } = await api.post("/generate/photo-to-3d", {
        image_url: imageUrl, attachment_type: attachment, style, edition_cap: editionCap,
      });
      setCurrentGen({ id: data.id, status: "pending", source_image_url: imageUrl, attachment_type: attachment, style, source_type: "photo_scan" });
      refresh();
      toast.success("Scanning photo into 3D…");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12">
      {!user && (
        <div className="mb-6 glass rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-zinc-300">Sign in to start generating — it takes 10 seconds.</p>
          <Link to="/register" className="btn-volt rounded-full px-5 py-2 text-sm">Sign up free</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Control Room */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex gap-1 mb-5 bg-zinc-900/60 rounded-full p-1">
              <button
                data-testid={TID.studioModeText}
                onClick={() => setMode("text")}
                className={`flex-1 rounded-full py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${mode === "text" ? "bg-[#ccff00] text-black" : "text-zinc-400"}`}
              >
                <TextT size={13} className="inline mr-1" weight="bold" /> Text
              </button>
              <button
                data-testid={TID.studioModeImage}
                onClick={() => setMode("image")}
                className={`flex-1 rounded-full py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${mode === "image" ? "bg-[#ccff00] text-black" : "text-zinc-400"}`}
              >
                <ImageSquare size={13} className="inline mr-1" weight="bold" /> Image
              </button>
              <button
                data-testid="studio-mode-photo"
                onClick={() => setMode("photo")}
                className={`flex-1 rounded-full py-2 text-[11px] font-bold uppercase tracking-wider transition-colors relative ${
                  mode === "photo"
                    ? "bg-gradient-to-r from-[#ff0055] to-[#fbbf24] text-black"
                    : "text-zinc-400"
                }`}
              >
                <Camera size={13} className="inline mr-1" weight="bold" /> Photo
                {!isPaid && (
                  <Lock size={9} weight="fill" className="absolute -top-0.5 -right-0.5 text-[#fbbf24]" />
                )}
              </button>
            </div>

            {mode === "text" ? (
              <>
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Prompt</label>
                <textarea
                  data-testid={TID.studioPrompt}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A glowing red demon hoodie with stitched smile…"
                  rows={4}
                  className="input-dark w-full rounded-lg px-4 py-3 mt-1 resize-none text-sm"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SAMPLES.slice(0, 4).map((s) => (
                    <button
                      key={s}
                      onClick={() => setPrompt(s)}
                      className="text-[10px] px-2 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                    >
                      {s.slice(0, 30)}…
                    </button>
                  ))}
                </div>
              </>
            ) : mode === "photo" && !isPaid ? (
              /* Paywall — non-paid users on Photo Scan tab */
              <div className="rounded-2xl border border-[#fbbf24]/30 bg-gradient-to-br from-[#fbbf24]/8 via-zinc-950 to-[#ff0055]/8 p-5 text-center" data-testid="photo-scanner-paywall">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#fbbf24]/15 border border-[#fbbf24]/40 flex items-center justify-center mb-3">
                  <Camera size={22} weight="duotone" className="text-[#fbbf24]" />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#fbbf24] font-bold mb-2">Pro feature · Photo Scanner</p>
                <h3 className="font-display text-lg font-black uppercase tracking-tighter mb-2 leading-tight">
                  Turn real-world photos into Roblox 3D drops
                </h3>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Selfies, sneakers, props, plushies — point at anything in real life, snap a photo, and the AI scans it into a fully Roblox-ready 3D model in 60 seconds.
                </p>
                <ul className="text-[11px] text-zinc-300 text-left max-w-xs mx-auto mb-5 space-y-1.5">
                  <li className="flex items-center gap-2"><Lightning size={12} weight="fill" className="text-[#ccff00]" /> Photogrammetry-grade scan accuracy</li>
                  <li className="flex items-center gap-2"><Lightning size={12} weight="fill" className="text-[#ccff00]" /> Roblox-optimized topology + materials</li>
                  <li className="flex items-center gap-2"><Lightning size={12} weight="fill" className="text-[#ccff00]" /> Unlimited scans on Pro · 50/mo on Creator</li>
                </ul>
                <Link
                  to="/pricing"
                  data-testid="photo-scanner-upgrade"
                  className="inline-block bg-[#fbbf24] text-black rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:shadow-[0_0_24px_rgba(251,191,36,0.6)] transition-all"
                >
                  Upgrade to unlock
                </Link>
                <p className="text-[10px] text-zinc-600 mt-3 uppercase tracking-widest">
                  Starting at $15/mo · cancel anytime
                </p>
              </div>
            ) : (
              <>
                {mode === "photo" && (
                  <div className="rounded-lg border border-[#ccff00]/30 bg-[#ccff00]/5 p-2.5 mb-3 flex items-center gap-2">
                    <Camera size={14} weight="duotone" className="text-[#ccff00] flex-shrink-0" />
                    <p className="text-[10px] text-[#ccff00] uppercase tracking-widest font-bold">
                      Photo Scanner · upload a real-world reference photo
                    </p>
                  </div>
                )}
                <div className="flex gap-1 mb-2 bg-zinc-900/60 rounded-full p-1 text-[10px]">
                  <button
                    onClick={() => setImageMode("upload")}
                    className={`flex-1 rounded-full py-1.5 font-bold uppercase tracking-wider transition-colors ${imageMode === "upload" ? "bg-[#ccff00] text-black" : "text-zinc-400"}`}
                  >
                    Upload
                  </button>
                  <button
                    onClick={() => setImageMode("url")}
                    className={`flex-1 rounded-full py-1.5 font-bold uppercase tracking-wider transition-colors ${imageMode === "url" ? "bg-[#ccff00] text-black" : "text-zinc-400"}`}
                  >
                    Paste URL
                  </button>
                </div>
                {imageMode === "upload" ? (
                  <label
                    data-testid="studio-image-file"
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) uploadFile(f);
                    }}
                    className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors touch-manipulation ${
                      dragOver
                        ? "border-[#ccff00] bg-[#ccff00]/10"
                        : "border-white/15 hover:border-[#ccff00]/60 bg-zinc-900/40"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-300">
                      {uploading ? "Uploading…" : imageUrl ? "Replace image" : "Tap or drop image"}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1">PNG / JPG / WEBP · max 8 MB</p>
                  </label>
                ) : (
                  <>
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Image URL</label>
                    <input
                      data-testid={TID.studioImageInput}
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/concept-art.png"
                      className="input-dark w-full rounded-lg px-4 py-3 mt-1 text-sm"
                    />
                  </>
                )}
                {imageUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-white/10 max-h-48">
                    <img src={imageUrl} alt="ref" className="w-full object-contain" />
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Type</label>
                <select
                  data-testid={TID.studioAttachment}
                  value={attachment}
                  onChange={(e) => setAttachment(e.target.value)}
                  className="input-dark w-full rounded-lg px-3 py-2.5 mt-1 text-sm"
                >
                  {ATTACHMENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Style</label>
                <select
                  data-testid={TID.studioStyle}
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="input-dark w-full rounded-lg px-3 py-2.5 mt-1 text-sm"
                >
                  {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* EDITION CAP SELECTOR — drop scarcity */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 flex items-center gap-1.5">
                  <Hash size={11} weight="bold" /> Edition supply
                </label>
                {genesisRemaining !== null && genesisRemaining > 0 && (
                  <span
                    className={`genesis-counter text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 ${
                      genesisRemaining <= 20 ? "genesis-counter-urgent" : ""
                    }`}
                    data-testid="genesis-counter"
                    title="First 100 mints on BloxDrops are GENESIS forever"
                  >
                    <span className="genesis-counter-dot" />
                    Genesis · {genesisRemaining} / 100 left
                  </span>
                )}
                {genesisRemaining === 0 && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Genesis · Sold Out
                  </span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1 mt-1" data-testid="studio-edition-caps">
                {EDITION_CAP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    data-testid={`edition-cap-${opt.value}`}
                    onClick={() => setEditionCap(opt.value)}
                    title={opt.sub}
                    className={`edition-cap-pill rarity-${opt.tier} ${
                      editionCap === opt.value ? "edition-cap-active" : ""
                    } rounded-lg py-2 text-[10px] font-black uppercase tracking-wider transition-all`}
                  >
                    {opt.value === 0 ? "∞" : opt.value === 1 ? "1/1" : opt.value}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1.5 leading-snug">
                {EDITION_CAP_OPTIONS.find((o) => o.value === editionCap)?.sub}
              </p>
            </div>

            <div className="flex gap-2 mt-5">
              {mode === "text" && (
                <button
                  data-testid={TID.studioEnhance}
                  onClick={enhance}
                  disabled={!prompt.trim() || enhancing || !user}
                  className="btn-ghost rounded-lg px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                >
                  <MagicWand size={14} weight="bold" />
                  {enhancing ? "Boosting…" : "AI Boost"}
                </button>
              )}
              <button
                data-testid={mode === "text" ? TID.studioGenerate : mode === "photo" ? "studio-photo-generate" : TID.studioImageGenerate}
                onClick={mode === "text" ? generateText : mode === "photo" ? generatePhoto : generateImage}
                disabled={
                  generating || !user ||
                  (mode === "text" ? !prompt.trim() : !imageUrl.trim()) ||
                  (mode === "photo" && !isPaid)
                }
                className={`rounded-lg flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${
                  mode === "photo" && isPaid
                    ? "bg-gradient-to-r from-[#ff0055] to-[#fbbf24] text-black font-black uppercase tracking-widest hover:shadow-[0_0_24px_rgba(251,191,36,0.5)]"
                    : "btn-volt"
                }`}
              >
                {mode === "photo" ? <Camera size={16} weight="fill" /> : <Sparkle size={16} weight="fill" />}
                {generating
                  ? "Submitting…"
                  : mode === "photo"
                    ? user?.role === "admin" ? "Scan photo (free · admin)" : "Scan photo (1 credit)"
                    : user?.role === "admin"
                      ? "Generate (free · admin)"
                      : "Generate (1 credit)"}
              </button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400 mb-3">Your creations</h3>
              <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto scrollbar-hidden">
                {history.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setCurrentGen(g)}
                    className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-[#ccff00] transition-colors bg-zinc-900"
                  >
                    {g.thumbnail_url ? (
                      <img src={g.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500">
                        {g.status === "pending" ? "..." : "?"}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* CENTER: Viewer */}
        <main className="lg:col-span-8 space-y-4">
          <div className="relative">
            <ModelViewer
              url={currentGen?.status === "completed" ? currentGen.model_url : null}
              height={520}
              vfxPreset={currentGen?.vfx_preset || null}
            />
            {currentGen?.status === "pending" && (
              <div
                data-testid={TID.studioStatus}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black rounded-2xl"
                style={{
                  background: "radial-gradient(circle at 50% 50%, #1a1a1d 0%, #0a0a0c 75%)",
                }}
              >
                <div className="w-12 h-12 rounded-full border-2 border-[#ccff00] border-t-transparent animate-spin" />
                <p className="font-display font-bold text-lg uppercase tracking-wider">Generating</p>
                <p className="text-xs text-zinc-400">Usually under 2 minutes</p>
              </div>
            )}
            {currentGen?.status === "failed" && (
              <div
                data-testid="studio-status-failed"
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl px-6 text-center"
                style={{
                  background: "radial-gradient(circle at 50% 50%, #2a1015 0%, #0a0a0c 75%)",
                }}
              >
                <div className="w-14 h-14 rounded-2xl border border-[#ff0055]/50 flex items-center justify-center"
                     style={{ boxShadow: "0 0 28px rgba(255,0,85,0.25), inset 0 0 18px rgba(255,0,85,0.08)" }}>
                  <Lightning size={26} weight="duotone" className="text-[#ff0055]" />
                </div>
                <div>
                  <p className="font-display text-base font-black uppercase tracking-[0.3em] text-white mb-1"
                     style={{ textShadow: "0 0 18px rgba(255,0,85,0.35)" }}>
                    Generation failed
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-bold max-w-sm">
                    The 3D model couldn&apos;t be created. Tap Regenerate to try again — your prompt &amp; image are saved.
                  </p>
                </div>
                {ownsCurrent && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={regenerateCurrent}
                      disabled={regenerating}
                      data-testid="studio-failed-regenerate"
                      className="rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 bg-[#ccff00] text-black hover:shadow-[0_0_18px_rgba(204,255,0,0.5)] transition-all disabled:opacity-50"
                    >
                      <ArrowClockwise size={14} weight="bold" />
                      {regenerating ? "Queuing…" : "Regenerate"}
                    </button>
                    <button
                      onClick={deleteCurrent}
                      disabled={deleting}
                      data-testid="studio-failed-delete"
                      className="rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 bg-black/70 text-zinc-300 border border-white/15 hover:border-[#ff0055]/70 hover:text-[#ff0055] hover:bg-[#ff0055]/10 transition-all disabled:opacity-50"
                    >
                      <Trash size={14} weight="bold" />
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            )}
            {currentGen?.status === "completed" && (
              <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 items-start">
                <a
                  href={currentGen.model_url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <Download size={14} weight="bold" /> .GLB
                </a>
                <button
                  onClick={() => setExporting(true)}
                  data-testid="studio-export-roblox"
                  className="bg-[#ccff00] text-black rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:shadow-[0_0_18px_rgba(204,255,0,0.5)] transition-shadow"
                >
                  <Robot size={14} weight="fill" /> Export to Roblox
                </button>
                {ownsCurrent && (
                  <>
                    <button
                      onClick={regenerateCurrent}
                      disabled={regenerating}
                      data-testid="studio-regenerate-creation"
                      title="Re-run with the latest HD/PBR quality settings"
                      className="rounded-full px-3.5 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 bg-black/70 text-zinc-300 border border-white/15 hover:border-[#00f0ff]/70 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 hover:shadow-[0_0_14px_rgba(0,240,255,0.25)] transition-all disabled:opacity-50 backdrop-blur-md"
                    >
                      <ArrowClockwise size={13} weight="bold" />
                      {regenerating ? "Queuing…" : "Regenerate"}
                    </button>
                    <button
                      onClick={deleteCurrent}
                      disabled={deleting}
                      data-testid="studio-delete-creation"
                      title="Delete this creation"
                      className="rounded-full px-3.5 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 bg-black/70 text-zinc-300 border border-white/15 hover:border-[#ff0055]/70 hover:text-[#ff0055] hover:bg-[#ff0055]/10 hover:shadow-[0_0_14px_rgba(255,0,85,0.25)] transition-all disabled:opacity-50 backdrop-blur-md"
                    >
                      <Trash size={13} weight="bold" />
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {exporting && currentGen?.id && (
            <RobloxExportModal
              generationId={currentGen.id}
              onClose={() => setExporting(false)}
            />
          )}

          {currentGen && currentGen.status === "completed" && (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold mb-1">Prompt</p>
                  <p className="text-sm text-zinc-200 leading-relaxed">
                    {currentGen.original_prompt || currentGen.prompt}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="text-[10px] uppercase tracking-widest bg-white/10 rounded-full px-2 py-1 font-bold">{currentGen.attachment_type}</span>
                    <span className="text-[10px] uppercase tracking-widest bg-[#ccff00] text-black rounded-full px-2 py-1 font-bold">{currentGen.style}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Heart size={14} weight="duotone" className="text-[#ff0055]" />
                    {currentGen.likes || 0}
                  </span>
                  <span className="flex items-center gap-1 text-zinc-400">
                    <ArrowsClockwise size={14} weight="duotone" className="text-[#ccff00]" />
                    {currentGen.remix_count || 0}
                  </span>
                </div>
              </div>

              {/* === DROP PROVENANCE / COLLECTIBILITY PANEL === */}
              {currentGen.rarity_tier && (
                <div className="mt-5 pt-5 border-t border-white/8" data-testid="drop-provenance">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-2">
                        Drop · Provenance
                      </p>
                      <DropBadges item={currentGen} />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Mint ID</p>
                      <p className="font-mono text-xs text-[#ccff00]" data-testid="mint-signature">
                        {signatureShort(currentGen)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* === ADMIN: VFX PRESET PICKER === */}
              {isAdmin && vfxPresets.length > 0 && (
                <div className="mt-5 pt-5 border-t border-white/8" data-testid="admin-vfx-picker">
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold flex items-center gap-2">
                      <Lightning size={11} weight="fill" className="text-[#ccff00]" />
                      Admin · VFX Animation
                    </p>
                    {currentGen.vfx_preset && (
                      <button
                        onClick={() => setVfxPreset(null)}
                        disabled={savingVfx}
                        data-testid="vfx-clear"
                        className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 hover:text-[#ff0055] transition-colors disabled:opacity-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {vfxPresets.map((p) => {
                      const active = currentGen.vfx_preset === p.key;
                      return (
                        <button
                          key={p.key}
                          onClick={() => setVfxPreset(p.key)}
                          disabled={savingVfx}
                          data-testid={`vfx-preset-${p.key}`}
                          className={`rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.15em] font-black flex items-center gap-2 border transition-all disabled:opacity-50 ${
                            active
                              ? "bg-white/10 text-white border-white/40 shadow-[0_0_14px_rgba(255,255,255,0.15)]"
                              : "bg-black/40 text-zinc-300 border-white/10 hover:border-white/30 hover:bg-white/5"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }}
                          />
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] tracking-wider text-zinc-500 mt-3">
                    Effects render live in the viewer above. Inspired by Roblox UGC particle emitters (e.g. Stormbreak Tempest).
                  </p>
                </div>
              )}
            </div>
          )}

          {!currentGen && (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="font-display text-xl font-black uppercase tracking-tighter">
                Drop your idea on the left
              </p>
              <p className="text-sm text-zinc-400 mt-2">
                Hit <span className="text-[#ccff00] font-bold">Generate</span> and watch your accessory come to life.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
