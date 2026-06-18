import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Heart, ArrowsClockwise, Crown, Sword, DownloadSimple, X } from "@phosphor-icons/react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import ModelViewer from "../components/ModelViewer";

export default function ScrollFeed() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/feed?sort=trending&limit=30");
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Track which card is in view for performance (only render active 3D)
  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll("[data-card-idx]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            setActiveIdx(parseInt(e.target.getAttribute("data-card-idx"), 10));
          }
        });
      },
      { root: containerRef.current, threshold: [0.6] }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [items]);

  const toggleLike = async (id) => {
    if (!user) { toast.error("Log in to like"); return; }
    try {
      const { data } = await api.post(`/generations/${id}/like`);
      setItems((prev) => prev.map((it) =>
        it.id === id ? { ...it, is_liked: data.liked, likes: it.likes + (data.liked ? 1 : -1) } : it
      ));
    } catch {}
  };

  const handleRemix = async (item) => {
    try {
      const { data } = await api.post(`/generations/${item.id}/remix`);
      sessionStorage.setItem("remix_seed", JSON.stringify(data));
      toast.success("Loaded into Studio");
      nav("/studio");
    } catch {}
  };

  if (loading) return <div className="text-center py-20 text-zinc-500">Loading feed…</div>;
  if (items.length === 0) return <div className="text-center py-20 text-zinc-500">No creations yet.</div>;

  return (
    <div className="relative">
      <Link
        to="/feed"
        className="fixed top-20 left-4 z-50 bg-black/70 backdrop-blur-md border border-white/15 rounded-full p-2.5 text-white hover:bg-black/90 transition-colors"
        title="Exit scroll mode"
      >
        <X size={18} weight="bold" />
      </Link>

      <div
        ref={containerRef}
        data-testid="scroll-feed"
        className="snap-y snap-mandatory overflow-y-scroll scrollbar-hidden"
        style={{ height: "calc(100vh - 64px)" }}
      >
        {items.map((item, idx) => (
          <ScrollCard
            key={item.id}
            item={item}
            idx={idx}
            isActive={idx === activeIdx}
            onLike={() => toggleLike(item.id)}
            onRemix={() => handleRemix(item)}
          />
        ))}
      </div>
    </div>
  );
}

function ScrollCard({ item, idx, isActive, onLike, onRemix }) {
  return (
    <section
      data-card-idx={idx}
      className="snap-start relative w-full flex items-center justify-center"
      style={{ height: "calc(100vh - 64px)" }}
    >
      <div className="absolute inset-0">
        {isActive ? (
          <ModelViewer url={item.model_url} height="100%" showHint={false} allowTryOn />
        ) : item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover opacity-50" />
        ) : null}
      </div>

      {item.is_featured && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-[#00f0ff] text-black text-[10px] uppercase tracking-[0.3em] font-black rounded-full px-3 py-1 flex items-center gap-1.5">
          <Crown size={12} weight="fill" /> Featured
        </div>
      )}

      {/* Right rail — like / remix */}
      <div className="absolute right-3 md:right-6 bottom-32 md:bottom-1/3 z-10 flex flex-col gap-4 items-center">
        <button
          onClick={onLike}
          className="flex flex-col items-center gap-1"
          data-testid={`scroll-like-${item.id}`}
        >
          <div className={`w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center transition-colors ${item.is_liked ? "text-[#ff0055]" : "text-white"}`}>
            <Heart size={22} weight={item.is_liked ? "fill" : "regular"} />
          </div>
          <span className="text-xs font-black text-white">{item.likes || 0}</span>
        </button>
        <button onClick={onRemix} className="flex flex-col items-center gap-1" data-testid={`scroll-remix-${item.id}`}>
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:text-[#ccff00] transition-colors">
            <ArrowsClockwise size={20} weight="bold" />
          </div>
          <span className="text-xs font-black text-white">{item.remix_count || 0}</span>
        </button>
        <a
          href={item.model_url}
          download
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
            <DownloadSimple size={20} weight="bold" />
          </div>
          <span className="text-xs font-black text-white">GLB</span>
        </a>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-5 md:p-8 bg-gradient-to-t from-black via-black/70 to-transparent">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black text-white">@{item.creator_name || "anon"}</span>
            <span className="text-[10px] uppercase tracking-widest bg-white/10 rounded-full px-2 py-0.5 font-bold text-white">{item.attachment_type}</span>
            {item.style && item.style !== "auto" && (
              <span className="text-[10px] uppercase tracking-widest bg-[#ccff00] text-black rounded-full px-2 py-0.5 font-bold">{item.style}</span>
            )}
            {item.battle_wins > 0 && (
              <span className="text-[10px] uppercase tracking-widest bg-[#ff0055] text-white rounded-full px-2 py-0.5 font-bold flex items-center gap-1">
                <Sword size={10} weight="fill" /> {item.battle_wins}W
              </span>
            )}
          </div>
          <p className="text-base md:text-lg text-white leading-snug line-clamp-3">
            {item.original_prompt || item.prompt}
          </p>
        </div>
      </div>
    </section>
  );
}
