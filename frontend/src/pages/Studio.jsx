import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Sparkle, MagicWand, ImageSquare, TextT, Download, ArrowsClockwise, Heart } from "@phosphor-icons/react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import ModelViewer from "../components/ModelViewer";
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

  const [mode, setMode] = useState("text"); // text | image
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageMode, setImageMode] = useState("url"); // url | upload
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState("Hat");
  const [style, setStyle] = useState("auto");
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [currentGen, setCurrentGen] = useState(null);
  const [history, setHistory] = useState([]);
  const pollRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  const loadHistory = async () => {
    try {
      const { data } = await api.get("/me/generations");
      setHistory(data.items || []);
    } catch {}
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
      } catch {}
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
        prompt, attachment_type: attachment, style,
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
        image_url: imageUrl, attachment_type: attachment, style,
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
            <div className="flex gap-2 mb-5 bg-zinc-900/60 rounded-full p-1">
              <button
                data-testid={TID.studioModeText}
                onClick={() => setMode("text")}
                className={`flex-1 rounded-full py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mode === "text" ? "bg-[#ccff00] text-black" : "text-zinc-400"}`}
              >
                <TextT size={14} className="inline mr-1" weight="bold" /> Text → 3D
              </button>
              <button
                data-testid={TID.studioModeImage}
                onClick={() => setMode("image")}
                className={`flex-1 rounded-full py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mode === "image" ? "bg-[#ccff00] text-black" : "text-zinc-400"}`}
              >
                <ImageSquare size={14} className="inline mr-1" weight="bold" /> Image → 3D
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
            ) : (
              <>
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
                    className="block border-2 border-dashed border-white/15 hover:border-[#ccff00]/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-zinc-900/40"
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-300">
                      {uploading ? "Uploading…" : imageUrl ? "Replace image" : "Drop image or click to upload"}
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
                data-testid={mode === "text" ? TID.studioGenerate : TID.studioImageGenerate}
                onClick={mode === "text" ? generateText : generateImage}
                disabled={generating || !user || (mode === "text" ? !prompt.trim() : !imageUrl.trim())}
                className="btn-volt rounded-lg flex-1 py-3 text-sm flex items-center justify-center gap-2"
              >
                <Sparkle size={16} weight="fill" />
                {generating ? "Submitting…" : "Generate (1 credit)"}
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
            />
            {currentGen?.status === "pending" && (
              <div
                data-testid={TID.studioStatus}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm rounded-2xl"
              >
                <div className="w-12 h-12 rounded-full border-2 border-[#ccff00] border-t-transparent animate-spin" />
                <p className="font-display font-bold text-lg uppercase tracking-wider">Generating</p>
                <p className="text-xs text-zinc-400">Usually under 2 minutes</p>
              </div>
            )}
            {currentGen?.status === "completed" && (
              <div className="absolute top-4 right-4 flex gap-2">
                <a
                  href={currentGen.model_url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <Download size={14} weight="bold" /> .GLB
                </a>
              </div>
            )}
          </div>

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
