import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { X, Download, TwitterLogo, Copy, ImageSquare } from "@phosphor-icons/react";
import { RARITY_DISPLAY, editionLabel, signatureShort } from "../lib/rarity";

const CARD_SIZE = 1080;
const FRAME_URL = `${typeof window !== "undefined" ? window.location.origin : ""}`;

function wrapText(ctx, text, maxWidth) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

async function drawCard(canvas, gen) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, CARD_SIZE, CARD_SIZE);

  const rarity = RARITY_DISPLAY[gen.rarity_tier] || RARITY_DISPLAY.common;

  // === BACKGROUND === radial dark with rarity-colored aura
  const bg = ctx.createRadialGradient(CARD_SIZE / 2, CARD_SIZE * 0.35, 80, CARD_SIZE / 2, CARD_SIZE * 0.35, CARD_SIZE);
  bg.addColorStop(0, "#101015");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  // Aura glow
  const aura = ctx.createRadialGradient(CARD_SIZE / 2, CARD_SIZE * 0.42, 0, CARD_SIZE / 2, CARD_SIZE * 0.42, 460);
  aura.addColorStop(0, rarity.glow);
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  // Subtle noise grid
  ctx.fillStyle = "rgba(255,255,255,0.015)";
  for (let i = 0; i < 60; i++) {
    ctx.fillRect(0, i * 18, CARD_SIZE, 1);
  }

  // === FRAME === inner border
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  roundRect(ctx, 32, 32, CARD_SIZE - 64, CARD_SIZE - 64, 36);
  ctx.stroke();

  // === HEADER === brand
  ctx.fillStyle = "#ccff00";
  ctx.font = "900 26px 'Inter', system-ui, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("BLOXDROPS", 72, 72);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "700 18px 'Inter', system-ui, sans-serif";
  ctx.fillText("·  NFT PROVENANCE  ·", 240, 78);

  // Top-right edition pill
  const edText = editionLabel(gen).toUpperCase();
  ctx.font = "900 22px 'Inter', system-ui, sans-serif";
  const edW = ctx.measureText(edText).width;
  const edPillW = edW + 56;
  const edPillX = CARD_SIZE - 72 - edPillW;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, edPillX, 60, edPillW, 48, 24);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText("#  " + edText, edPillX + 24, 84);

  // === TRY DRAWING THE THUMBNAIL ===
  let thumbY = 170;
  let thumbH = 380;
  const thumbX = 72;
  const thumbW = CARD_SIZE - 144;
  // Background panel for thumb
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  roundRect(ctx, thumbX, thumbY, thumbW, thumbH, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // try loading thumbnail
  const thumbSrc = gen.thumbnail_url || gen.source_image_url;
  if (thumbSrc) {
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = "anonymous";
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = thumbSrc;
        setTimeout(() => reject(new Error("timeout")), 4500);
      });
      // cover
      const ratio = Math.max(thumbW / img.width, thumbH / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const x = thumbX + (thumbW - w) / 2;
      const y = thumbY + (thumbH - h) / 2;
      ctx.save();
      roundRect(ctx, thumbX, thumbY, thumbW, thumbH, 28);
      ctx.clip();
      ctx.drawImage(img, x, y, w, h);
      // dark vignette for legibility
      const vg = ctx.createLinearGradient(0, thumbY, 0, thumbY + thumbH);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = vg;
      ctx.fillRect(thumbX, thumbY, thumbW, thumbH);
      ctx.restore();
    } catch {
      // Render a stylish glyph instead
      ctx.fillStyle = rarity.color + "33";
      ctx.font = "900 220px 'Inter', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("◆", CARD_SIZE / 2, thumbY + thumbH / 2);
      ctx.textAlign = "start";
    }
  } else {
    ctx.fillStyle = rarity.color + "33";
    ctx.font = "900 220px 'Inter', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("◆", CARD_SIZE / 2, thumbY + thumbH / 2);
    ctx.textAlign = "start";
  }

  // Rarity badge on thumb (top-left of image area)
  const rText = (rarity.label || "COMMON").toUpperCase();
  ctx.font = "900 22px 'Inter', system-ui, sans-serif";
  ctx.textBaseline = "middle";
  const rW = ctx.measureText(rText).width;
  const rPillW = rW + 56;
  ctx.fillStyle = rarity.color;
  roundRect(ctx, thumbX + 20, thumbY + 20, rPillW, 44, 22);
  ctx.fill();
  ctx.fillStyle = "#000000";
  ctx.fillText("✦  " + rText, thumbX + 44, thumbY + 42);

  // === DISPLAY NAME ===
  let cursorY = thumbY + thumbH + 40;
  const name = gen.display_name || gen.original_prompt || gen.prompt || "Untitled Drop";
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  ctx.font = "900 56px 'Inter', system-ui, sans-serif";
  const nameLines = wrapText(ctx, name, CARD_SIZE - 144).slice(0, 2);
  for (const l of nameLines) {
    ctx.fillText(l, 72, cursorY);
    cursorY += 62;
  }
  cursorY += 6;

  // === DESCRIPTION ===
  if (gen.description) {
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "400 22px 'Inter', system-ui, sans-serif";
    const descLines = wrapText(ctx, gen.description, CARD_SIZE - 144).slice(0, 2);
    for (const l of descLines) {
      ctx.fillText(l, 72, cursorY);
      cursorY += 32;
    }
    cursorY += 12;
  }

  // === TRAITS GRID ===
  const traits = (gen.traits || []).slice(0, 4);
  if (traits.length) {
    const gridX = 72;
    const gridW = CARD_SIZE - 144;
    const colGap = 16;
    const colW = (gridW - colGap) / 2;
    const cellH = 78;
    traits.forEach((t, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = gridX + col * (colW + colGap);
      const cy = cursorY + row * (cellH + 10);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      roundRect(ctx, cx, cy, colW, cellH, 14);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // trait_type
      ctx.fillStyle = "#ccff00";
      ctx.font = "900 14px 'Inter', system-ui, sans-serif";
      ctx.fillText((t.trait_type || "").toUpperCase().slice(0, 24), cx + 18, cy + 14);
      // value
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 22px 'Inter', system-ui, sans-serif";
      ctx.fillText((t.value || "").slice(0, 26), cx + 18, cy + 36);
    });
  }

  // === FOOTER === Mint ID + URL
  const footerY = CARD_SIZE - 96;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "700 18px 'Inter', system-ui, sans-serif";
  ctx.fillText("MINT ID", 72, footerY);
  ctx.fillStyle = "#ccff00";
  ctx.font = "800 26px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(signatureShort(gen), 72, footerY + 26);

  const urlText = (FRAME_URL || "bloxdrops").replace(/^https?:\/\//, "");
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "700 18px 'Inter', system-ui, sans-serif";
  ctx.fillText("VIEW LIVE ON", CARD_SIZE - 72, footerY);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 26px 'Inter', system-ui, sans-serif";
  ctx.fillText(urlText, CARD_SIZE - 72, footerY + 26);
  ctx.textAlign = "start";
}

export default function ShareNFTCard({ generation, onClose }) {
  const canvasRef = useRef(null);
  const [building, setBuilding] = useState(true);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!canvasRef.current || !generation) return;
    setBuilding(true);
    drawCard(canvasRef.current, generation)
      .catch(() => {})
      .finally(() => setBuilding(false));
  }, [generation]);

  const shareUrl = `${FRAME_URL}/studio?view=${generation?.id || ""}`;

  const downloadPng = () => {
    if (!canvasRef.current) return;
    try {
      const filename = `bloxdrops-${(generation?.display_name || generation?.id || "card").replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40)}.png`;
      const link = document.createElement("a");
      link.download = filename;
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
      toast.success("Card downloaded — share away!");
    } catch (err) {
      toast.error("Couldn't export card. Try again.");
    }
  };

  const copyImage = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise((res) => canvasRef.current.toBlob(res, "image/png"));
      if (!blob) throw new Error("blob");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Image copied to clipboard");
    } catch {
      toast.error("Clipboard not supported — use Download instead");
    }
  };

  const tweet = () => {
    const text = `Just dropped on BloxDrops — ${generation?.display_name || generation?.original_prompt || "my latest NFT"} ✨\n${shareUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      data-testid="share-nft-modal"
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl w-full max-w-lg border border-white/10 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/8 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <ImageSquare size={16} weight="fill" className="text-[#ccff00]" />
            <h2 className="font-display text-lg font-black uppercase tracking-tighter">Share Card</h2>
          </div>
          <button
            onClick={onClose}
            data-testid="share-nft-close"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black aspect-square">
            <canvas
              ref={canvasRef}
              width={CARD_SIZE}
              height={CARD_SIZE}
              data-testid="share-nft-canvas"
              className="w-full h-full block"
              style={{ imageRendering: "auto" }}
            />
            {building && (
              <div className="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-full border-2 border-[#ccff00] border-t-transparent animate-spin" />
              </div>
            )}
          </div>
          <p className="text-[10px] tracking-wider text-zinc-500 text-center">
            1080 × 1080 · perfect for Twitter, Instagram, Discord
          </p>
        </div>

        <div className="sticky bottom-0 bg-black/80 backdrop-blur-xl border-t border-white/8 px-6 py-4 grid grid-cols-3 gap-2 rounded-b-2xl">
          <button
            onClick={downloadPng}
            disabled={building}
            data-testid="share-nft-download"
            className="rounded-full px-3 py-2.5 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-[#ccff00] text-black hover:shadow-[0_0_18px_rgba(204,255,0,0.5)] transition-all disabled:opacity-40"
          >
            <Download size={13} weight="bold" /> PNG
          </button>
          <button
            onClick={copyImage}
            disabled={building}
            data-testid="share-nft-copy"
            className="rounded-full px-3 py-2.5 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-white/10 text-white hover:bg-white/15 border border-white/20 transition-all disabled:opacity-40"
          >
            <Copy size={13} weight="bold" /> Copy
          </button>
          <button
            onClick={tweet}
            data-testid="share-nft-tweet"
            className="rounded-full px-3 py-2.5 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-[#1d9bf0] text-white hover:shadow-[0_0_18px_rgba(29,155,240,0.5)] transition-all"
          >
            <TwitterLogo size={13} weight="fill" /> Tweet
          </button>
        </div>
      </div>
    </div>
  );
}
