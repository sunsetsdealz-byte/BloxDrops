import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue, animate, useReducedMotion } from "framer-motion";
import {
  ArrowRight, Sparkle, Lightning, Trophy, ChatCircle, Cube, FireSimple,
  Cpu, Robot, Code, Lightbulb, ShareNetwork, Crown,
} from "@phosphor-icons/react";
import { api } from "../lib/api";
import { TID } from "../constants/testIds";
import ModelViewer from "../components/ModelViewer";

const HERO_IMAGE = "https://customer-assets.emergentagent.com/job_ai-generator-66/artifacts/eu7kzqzc_me%20roblox.png";

/* ---------- AnimatedNumber: count-up on mount ---------- */
function AnimatedNumber({ value = 0, duration = 1.6, className = "" }) {
  const [display, setDisplay] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { setDisplay(value); return; }
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration, reduced]);
  return <span className={className}>{display.toLocaleString()}</span>;
}

/* ---------- TerminalTicker: typewriter-style status line ---------- */
function TerminalTicker({ lines = [] }) {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (!lines.length) return;
    const full = lines[idx];
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(t);
        setTimeout(() => {
          setShown("");
          setIdx((p) => (p + 1) % lines.length);
        }, 2200);
      }
    }, 32);
    return () => clearInterval(t);
  }, [idx, lines]);
  return (
    <span className="font-mono text-xs md:text-sm tracking-tight text-[#ccff00] blink-caret">
      {shown}
    </span>
  );
}

export default function Landing() {
  const [feed, setFeed] = useState([]);
  const [stats, setStats] = useState({
    total_creations: 0, creators: 0, battles_settled: 0, today_creations: 0, pending_now: 0, total_likes: 0,
  });
  const heroRef = useRef(null);

  useEffect(() => {
    api.get("/feed?sort=popular&limit=12").then((r) => setFeed(r.data.items || [])).catch(() => {});
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
    // refresh stats every 20s
    const t = setInterval(() => {
      api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
    }, 20000);
    return () => clearInterval(t);
  }, []);

  // Spotlight cursor effect
  const handleMove = (e) => {
    if (!heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    heroRef.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
    heroRef.current.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div className="relative overflow-hidden">
      {/* SYSTEM STATUS STRIP — terminal */}
      <div className="border-b border-white/5 bg-black/40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-9 flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="live-dot" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-400">SYS · ONLINE</span>
          </div>
          <div className="hidden md:flex items-center gap-2 flex-1 min-w-0 justify-center">
            <TerminalTicker lines={[
              `> ${stats.total_creations.toLocaleString()} CREATIONS · ${stats.creators.toLocaleString()} CREATORS ONLINE`,
              `> ${stats.today_creations} ITEMS MINTED IN THE LAST 24H`,
              `> ${stats.battles_settled} BATTLES SETTLED · TRIPO H3.1 ENGINE LIVE`,
              `> READY: TEXT→3D · IMAGE→3D · ROBLOX MARKETPLACE PIPELINE`,
            ]} />
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            <Cpu size={12} weight="duotone" />
            <span>GPU 87%</span>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section
        ref={heroRef}
        onMouseMove={handleMove}
        className="relative scanlines spotlight"
      >
        {/* Neon grid floor */}
        <div className="neon-grid" />
        {/* Conic glow accent */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[800px] conic-glow pointer-events-none opacity-70" />

        <div className="relative max-w-7xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-20">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-7">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-[#ccff00]/40 text-xs uppercase tracking-[0.3em] font-bold"
              >
                <Sparkle size={14} weight="fill" className="text-[#ccff00]" />
                <span>v3 · tripo h3.1 engine</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05 }}
                className="font-display text-5xl sm:text-6xl lg:text-7xl font-black uppercase leading-[0.92] tracking-tighter"
              >
                <span className="block">From prompt</span>
                <span className="block">to marketplace</span>
                <span className="glitch text-[#ccff00] block" data-text="in 60 seconds.">
                  in 60 seconds.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="text-zinc-300 text-lg max-w-xl leading-relaxed"
              >
                Drop a prompt or an image. Watch AI sculpt your idea into a Roblox-ready 3D
                accessory while you wait. Battle other creators. Climb the leaderboard.
                Cash in the Robux.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap gap-3"
              >
                <Link
                  to="/register"
                  data-testid={TID.heroCtaPrimary}
                  className="btn-volt rounded-full px-7 py-3.5 text-base inline-flex items-center gap-2"
                >
                  Start creating free <ArrowRight size={18} weight="bold" />
                </Link>
                <Link
                  to="/feed/scroll"
                  data-testid={TID.heroCtaSecondary}
                  className="btn-ghost rounded-full px-7 py-3.5 text-base font-semibold inline-flex items-center gap-2"
                >
                  <Cube size={18} weight="duotone" /> Watch the drop
                </Link>
              </motion.div>

              {/* LIVE COUNTERS — replaces the old "127 creations in last hour" pill */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                className="grid grid-cols-3 gap-3 pt-4 max-w-xl"
                data-testid="hero-live-stats"
              >
                <LiveStat label="Creations" value={stats.total_creations} accent="#ccff00" />
                <LiveStat label="Creators" value={stats.creators} accent="#00f0ff" />
                <LiveStat label="Battles" value={stats.battles_settled} accent="#ff0055" />
              </motion.div>
            </div>

            {/* HERO SHOWCASE — custom Roblox-style creator character */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="lg:col-span-5 relative"
            >
              <div className="absolute -inset-8 bg-[#ccff00]/12 blur-3xl rounded-full pointer-events-none" />
              <div
                className="relative rounded-2xl overflow-hidden border border-white/10 aspect-square w-full max-w-[480px] mx-auto"
                style={{
                  background:
                    "radial-gradient(circle at 50% 60%, #1a1a1d 0%, #050507 80%)",
                }}
              >
                <motion.img
                  src={HERO_IMAGE}
                  alt="BloxCraft creator character — generated with AI"
                  className="absolute inset-0 w-full h-full object-contain select-none"
                  draggable={false}
                  initial={{ y: 0 }}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity }}
                />
                {/* Bottom shadow */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-2/3 h-3 rounded-[50%] bg-black/70 blur-md pointer-events-none" />
                <div className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono">
                  blox/character_v3.glb
                </div>

                {/* Floating spec chips */}
                <motion.div
                  className="absolute -top-3 -left-3 glass rounded-xl px-3 py-2 float-1 hidden md:flex items-center gap-2 z-10"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Robot size={14} weight="duotone" className="text-[#ccff00]" />
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400">engine</p>
                    <p className="text-[11px] font-bold">Tripo H3.1</p>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-3 -right-3 glass rounded-xl px-3 py-2 float-2 hidden md:flex items-center gap-2 z-10"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.75, duration: 0.5 }}
                >
                  <Code size={14} weight="duotone" className="text-[#00f0ff]" />
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400">export</p>
                    <p className="text-[11px] font-bold">.GLB · 1024px PBR</p>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute top-1/2 -right-5 glass rounded-full px-3 py-1.5 hidden lg:flex items-center gap-1.5 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                >
                  <span className="live-dot" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">live</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-white/5 py-6 overflow-hidden bg-black/40 relative">
        <div className="marquee gap-12 text-zinc-500 font-display text-2xl font-black uppercase tracking-tighter whitespace-nowrap">
          {Array.from({ length: 2 }).flatMap((_, i) =>
            ["Text → 3D", "Image → 3D", "Battle Mode", "Daily Challenges", "AI Prompt Boost", "Remix Anything", "Marketplace Ready", "Tripo H3.1"]
              .map((w, j) => (
                <span key={`${i}-${j}`} className="flex items-center gap-12">
                  {w} <span className="text-[#ccff00]">✦</span>
                </span>
              ))
          )}
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#ccff00] font-bold mb-3">
              ▍ Stack
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter">
              Built for creators<br/>who actually ship.
            </h2>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-6 gap-4 md:gap-6">
          <FeatureCard delay={0} span="md:col-span-3" icon={<Cube size={28} weight="duotone" />} title="Text & Image → 3D"
            body="Drop a prompt or a reference image. Tripo H3.1 sculpts a Roblox-ready GLB in under 2 minutes." kbd="01" />
          <FeatureCard delay={0.08} span="md:col-span-3" icon={<ChatCircle size={28} weight="duotone" />} title="AI Prompt Booster"
            body="Stuck at 'cool hat'? Our Claude-powered prompt engine upgrades it into a vivid 60-word spec." kbd="02" />
          <FeatureCard delay={0.16} span="md:col-span-2" icon={<Trophy size={28} weight="duotone" />} title="1v1 Battles"
            body="Vote your way through pairs. Win 5 → free 24h feature boost." accent="magenta" kbd="03" />
          <FeatureCard delay={0.22} span="md:col-span-2" icon={<Lightning size={28} weight="duotone" />} title="Daily Themes"
            body="Cyberpunk Monday, Anime Tuesday, Gothic Wednesday — fresh prompts every day." accent="cyan" kbd="04" />
          <FeatureCard delay={0.28} span="md:col-span-2" icon={<ShareNetwork size={28} weight="duotone" />} title="Roblox Marketplace Export"
            body="One-click .GLB + manifest + checklist for the Roblox Asset Configuration upload." kbd="05" />
        </div>
      </section>

      {/* GALLERY STRIP */}
      {feed.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 md:px-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between mb-6"
          >
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00f0ff] font-bold mb-2">▍ The Drop</p>
              <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter">
                Fresh from the studio
              </h3>
            </div>
            <Link to="/feed" className="text-sm font-bold text-[#ccff00] flex items-center gap-1">
              See all <ArrowRight size={14} weight="bold" />
            </Link>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {feed.slice(0, 6).map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="holo-border aspect-[4/5] rounded-xl bg-zinc-900 border border-white/8 overflow-hidden group"
              >
                {g.thumbnail_url && (
                  <img src={g.thumbnail_url} alt={g.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-5 md:px-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden border border-[#ccff00]/30 p-10 md:p-16 text-center scanlines"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#ccff00]/10 via-transparent to-[#ff0055]/10" />
          <div className="relative">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#ccff00] font-bold mb-3">
              ▍ Final boss: shipping
            </p>
            <h3 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">
              Your next bestseller<br/>is one prompt away.
            </h3>
            <p className="text-zinc-300 mb-7 max-w-xl mx-auto">
              Join the creators turning ideas into Robux. Start with 20 free credits — no card required.
            </p>
            <Link to="/register" className="btn-volt rounded-full px-8 py-4 text-base inline-flex items-center gap-2">
              Create your first item <ArrowRight size={18} weight="bold" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function LiveStat({ label, value, accent }) {
  return (
    <div className="bg-zinc-950/60 border border-white/10 rounded-xl px-3 py-3 backdrop-blur">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold mb-1">
        ▍ {label}
      </p>
      <div className="flex items-baseline gap-1">
        <AnimatedNumber value={value} className="font-display text-2xl font-black tracking-tighter" />
        <span className="text-xs font-bold" style={{ color: accent }}>●</span>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, body, span = "", accent = "volt", delay = 0, kbd }) {
  const accentClass = {
    volt: "text-[#ccff00]",
    magenta: "text-[#ff0055]",
    cyan: "text-[#00f0ff]",
  }[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className={`holo-border relative ${span} p-6 md:p-8 hover:border-white/20 transition-colors`}
    >
      {kbd && (
        <span className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          /{kbd}
        </span>
      )}
      <div className={`${accentClass} mb-4`}>{icon}</div>
      <h4 className="font-display font-bold text-xl mb-2 tracking-tight">{title}</h4>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </motion.div>
  );
}
