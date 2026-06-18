import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, animate } from "framer-motion";
import {
  Coins, Crown, Diamond, Star, ArrowRight, Lock, CurrencyDollar,
  Stack, ShieldCheck, ChartLineUp, Lightning, TrendUp, Storefront, Fingerprint,
} from "@phosphor-icons/react";
import { api } from "../lib/api";

/* ----- count-up number ----- */
function CountUp({ to = 0, duration = 1.8, suffix = "", prefix = "" }) {
  const [v, setV] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { setV(to); return; }
    const ctl = animate(0, to, {
      duration, ease: "easeOut",
      onUpdate: (x) => setV(Math.round(x)),
    });
    return () => ctl.stop();
  }, [to, duration, reduced]);
  return <span>{prefix}{v.toLocaleString()}{suffix}</span>;
}

/* ----- Per-tier rarity preview card (used in scarcity grid) ----- */
function TierBar({ tier, label, count, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-4"
    >
      <div className={`rarity-pill rarity-pill-${tier} px-3 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-full min-w-[100px] text-center`}>
        {label}
      </div>
      <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${count}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: delay + 0.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 16px ${color}` }}
        />
      </div>
      <div className="font-mono text-xs text-zinc-400 w-16 text-right">{count}%</div>
    </motion.div>
  );
}

/* ----- Money flow visualization for royalty card ----- */
function RoyaltyFlow() {
  return (
    <div className="relative h-44 md:h-52 flex items-center justify-between text-center">
      {/* Buyer */}
      <div className="flex flex-col items-center gap-2 z-10">
        <div className="w-14 h-14 rounded-full bg-zinc-900 border border-[#00f0ff]/60 flex items-center justify-center">
          <UserGlyph color="#00f0ff" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">Buyer</p>
      </div>

      {/* Animated flowing coins */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 flex items-center pointer-events-none">
        <div className="relative w-full h-full">
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="absolute top-1/2 -translate-y-1/2 text-[#ccff00] text-2xl"
              initial={{ left: "5%", opacity: 0 }}
              animate={{ left: ["5%", "95%"], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6, ease: "linear" }}
            >
              <Coins size={22} weight="fill" />
            </motion.span>
          ))}
        </div>
      </div>

      {/* Royalty fork-off arrow up */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-2 flex flex-col items-center text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#fbbf24] font-black">+5% royalty</p>
        <div className="w-px h-5 bg-gradient-to-b from-[#fbbf24] to-transparent" />
      </div>

      {/* Seller */}
      <div className="flex flex-col items-center gap-2 z-10">
        <div className="w-14 h-14 rounded-full bg-zinc-900 border border-[#ccff00]/60 flex items-center justify-center">
          <UserGlyph color="#ccff00" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">Seller</p>
      </div>

      {/* Original creator (royalty recipient) — gold halo at top center */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-16 hidden md:flex flex-col items-center gap-1">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-[#fbbf24] flex items-center justify-center shadow-[0_0_22px_rgba(251,191,36,0.7)]">
          <Crown size={20} weight="fill" className="text-[#fbbf24]" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#fbbf24] font-black">Creator · forever</p>
      </div>
    </div>
  );
}
function UserGlyph({ color = "#fff" }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M4.5 20c1.5-3.5 4.5-5.4 7.5-5.4S18 16.5 19.5 20" strokeLinecap="round" />
    </svg>
  );
}

/* ----- Main monetization explainer section ----- */
export default function MonetizationSection() {
  const [genesisLeft, setGenesisLeft] = useState(99);

  useEffect(() => {
    api.get("/stats")
      .then((r) => setGenesisLeft(r.data?.genesis_remaining ?? 99))
      .catch(() => {});
  }, []);

  return (
    <section className="relative max-w-7xl mx-auto px-5 md:px-8 py-24 md:py-32" data-testid="monetization-section">
      {/* Background flair */}
      <div className="absolute inset-0 conic-glow opacity-50 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ccff00]/40 to-transparent" />

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="relative text-center max-w-3xl mx-auto mb-16"
      >
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#fbbf24] font-bold mb-4 flex items-center justify-center gap-2">
          <Diamond size={12} weight="fill" /> Why your drops are worth money
        </p>
        <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.95]">
          Every drop you forge is a<br/>
          <span className="text-[#fbbf24] [text-shadow:0_0_28px_rgba(251,191,36,0.55)]">collectible</span>{" "}with{" "}
          <span className="text-[#ccff00] [text-shadow:0_0_28px_rgba(204,255,0,0.6)]">real-money value</span>.
        </h2>
        <p className="text-zinc-400 mt-6 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          No blockchain. No crypto. Just bullet-proof scarcity, on-chain-grade provenance,
          and a 5% royalty stream that pays you <strong className="text-white">forever</strong>.
        </p>
      </motion.div>

      {/* === 4 BIG VALUE CARDS === */}
      <div className="grid md:grid-cols-2 gap-6 mb-16">

        {/* CARD 1 — SCARCITY */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl border border-white/10 p-7 md:p-9 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#c084fc]/20 blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c084fc] font-bold mb-3 flex items-center gap-2">
              <Stack size={12} weight="fill" /> 01 · Scarcity
            </p>
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2">
              Choose your supply.<br/>Lock it forever.
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              Mint as a 1-of-1 art piece or an open edition. Lower supply = higher rarity tier = higher resale value.
            </p>
            <div className="space-y-3">
              <TierBar tier="mythic"    label="1 of 1"    count={98} color="#ff0055" delay={0.0} />
              <TierBar tier="legendary" label="10 ed."    count={75} color="#fbbf24" delay={0.1} />
              <TierBar tier="epic"      label="50 ed."    count={50} color="#c084fc" delay={0.2} />
              <TierBar tier="rare"      label="100 ed."   count={28} color="#00f0ff" delay={0.3} />
              <TierBar tier="common"    label="Open"      count={10} color="#a1a1aa" delay={0.4} />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-4">
              Avg. resale premium (industry data)
            </p>
          </div>
        </motion.div>

        {/* CARD 2 — ROYALTIES */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative rounded-3xl border border-[#fbbf24]/30 p-7 md:p-9 overflow-hidden bg-gradient-to-br from-[#fbbf24]/10 via-zinc-950 to-zinc-950"
        >
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#fbbf24]/20 blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#fbbf24] font-bold mb-3 flex items-center gap-2">
              <CurrencyDollar size={12} weight="fill" /> 02 · Royalties
            </p>
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2">
              <span className="text-[#fbbf24]">5%</span> on every resale.<br/>For life.
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              Sell your drop once — keep earning every time it changes hands. Forever. Automatically.
            </p>
            <RoyaltyFlow />
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/8">
              <div>
                <p className="font-display text-2xl font-black text-[#fbbf24]"><CountUp to={5} suffix="%" /></p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">creator cut</p>
              </div>
              <div>
                <p className="font-display text-2xl font-black text-white">∞</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">resales</p>
              </div>
              <div>
                <p className="font-display text-2xl font-black text-[#ccff00]"><CountUp to={100} suffix="%" /></p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">first sale</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CARD 3 — GENESIS WINDOW */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative rounded-3xl border-2 border-[#fbbf24] p-7 md:p-9 overflow-hidden bg-gradient-to-br from-black via-zinc-950 to-[#3a2900]"
        >
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute inset-0" style={{
              background: "radial-gradient(circle at 50% 50%, rgba(251,191,36,0.35), transparent 60%)",
            }} />
          </div>
          <div className="relative">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#fbbf24] font-bold mb-3 flex items-center gap-2">
              <Star size={12} weight="fill" /> 03 · Genesis Collection
            </p>
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2">
              The first 100 mints.<br/>Branded forever.
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              Only the first 100 drops on BloxDrops carry the gold <strong className="text-[#fbbf24]">GENESIS</strong> badge.
              Once gone, they&apos;re gone. The platform&apos;s most permanent collectibles.
            </p>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-display text-6xl md:text-7xl font-black tracking-tighter text-[#fbbf24] [text-shadow:0_0_30px_rgba(251,191,36,0.7)]">
                  <CountUp to={genesisLeft} />
                </p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mt-1">
                  Genesis slots remaining of 100
                </p>
              </div>
              <Link
                to="/studio"
                data-testid="genesis-cta"
                className="bg-[#fbbf24] text-black rounded-full px-5 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-[0_0_28px_rgba(251,191,36,0.7)] transition-shadow"
              >
                Mint Now <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
            {/* Animated progress bar */}
            <div className="mt-5 h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${100 - genesisLeft}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#fbbf24] to-[#fde68a]"
                style={{ boxShadow: "0 0 14px #fbbf24" }}
              />
            </div>
          </div>
        </motion.div>

        {/* CARD 4 — MARKETPLACE */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative rounded-3xl border border-[#00f0ff]/40 p-7 md:p-9 overflow-hidden bg-gradient-to-br from-[#00f0ff]/10 via-zinc-950 to-[#ff0055]/10"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#00f0ff]/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#ff0055]/20 blur-3xl" />
          </div>
          <div className="relative">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00f0ff] font-bold mb-3 flex items-center gap-2">
              <Storefront size={12} weight="fill" /> 04 · Marketplace · Soon
            </p>
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2">
              List in USD<br/>or Robux.
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              Sell any owned drop in either currency. Real cash-out via Stripe.
              In-platform Robux economy for Roblox-native trades.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#00f0ff]/40 bg-black/40 p-4 text-center">
                <CurrencyDollar size={28} weight="duotone" className="text-[#00f0ff] mx-auto mb-2" />
                <p className="font-display text-lg font-black uppercase tracking-tight">USD</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-0.5">Stripe payout</p>
              </div>
              <div className="rounded-2xl border border-[#ff0055]/40 bg-black/40 p-4 text-center">
                <Coins size={28} weight="duotone" className="text-[#ff0055] mx-auto mb-2" />
                <p className="font-display text-lg font-black uppercase tracking-tight">Robux</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-0.5">In-platform</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
              <Lock size={12} weight="fill" className="text-[#fbbf24]" />
              <span>Marketplace launches with Phase 2. Mint your edition slot now.</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* === COMPARISON STRIP === */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative rounded-3xl border border-white/10 bg-black/40 p-6 md:p-10 backdrop-blur-sm mb-16"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ccff00] font-bold mb-2 text-center">
          ▍ Why creators are switching
        </p>
        <h3 className="font-display text-2xl md:text-4xl font-black uppercase tracking-tighter text-center mb-8">
          Traditional UGC vs. BloxDrops
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Traditional */}
          <div className="rounded-2xl border border-zinc-700/50 bg-zinc-950 p-6">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-4">Traditional Roblox UGC</p>
            <ul className="space-y-3 text-sm">
              {[
                "Unlimited copies = zero scarcity value",
                "30% Roblox cut, no royalties on resales",
                "No proof of authorship",
                "Compete against thousands of clones",
                "One-time sale only · no recurring revenue",
              ].map((t, i) => (
                <li key={i} className="flex gap-2 text-zinc-400">
                  <span className="text-zinc-600 mt-0.5">✕</span> {t}
                </li>
              ))}
            </ul>
          </div>
          {/* BloxDrops */}
          <div className="rounded-2xl border-2 border-[#ccff00]/60 bg-gradient-to-br from-[#ccff00]/8 to-transparent p-6 relative">
            <span className="absolute -top-3 left-6 bg-[#ccff00] text-black text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1">
              The BloxDrops Way
            </span>
            <p className="text-[10px] uppercase tracking-widest text-[#ccff00] font-black mb-4">BloxDrops</p>
            <ul className="space-y-3 text-sm">
              {[
                <>True scarcity — <strong className="text-white">1/1, 1/10, 1/50</strong> editions enforced forever</>,
                <>You keep <strong className="text-[#fbbf24]">95%</strong> first sale + <strong className="text-[#fbbf24]">5% royalty</strong> on every resale</>,
                <>Cryptographic <strong className="text-white">mint ID + signature hash</strong> = bulletproof provenance</>,
                <>Genesis & Founder Signed status — automatic collector demand</>,
                <>Battle wins push rarity tier up → more value as it trends</>,
              ].map((t, i) => (
                <li key={i} className="flex gap-2 text-zinc-200">
                  <span className="text-[#ccff00] font-black mt-0.5">✓</span> <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* === HOW IT MAKES YOU MONEY (3 step flow) === */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="grid md:grid-cols-3 gap-5"
      >
        {[
          {
            n: "01", t: "Mint", c: "Generate a 3D drop and choose its supply.",
            icon: <Lightning size={28} weight="duotone" className="text-[#ccff00]" />,
            border: "border-[#ccff00]/40",
          },
          {
            n: "02", t: "Trade", c: "Other creators buy your drop in USD or Robux.",
            icon: <TrendUp size={28} weight="duotone" className="text-[#00f0ff]" />,
            border: "border-[#00f0ff]/40",
          },
          {
            n: "03", t: "Earn forever", c: "Every resale auto-pays you 5%. Hands-off royalties.",
            icon: <Crown size={28} weight="duotone" className="text-[#fbbf24]" />,
            border: "border-[#fbbf24]/40",
          },
        ].map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className={`relative rounded-2xl border ${step.border} bg-zinc-950/80 p-6 overflow-hidden hover:-translate-y-1 transition-transform`}
          >
            <span className="absolute top-4 right-5 font-mono text-3xl font-black text-white/8">
              {step.n}
            </span>
            <div className="mb-4">{step.icon}</div>
            <h4 className="font-display text-xl font-black uppercase tracking-tighter mb-2">{step.t}</h4>
            <p className="text-sm text-zinc-400">{step.c}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom shimmer divider */}
      <div className="mt-20 h-px bg-gradient-to-r from-transparent via-[#ccff00]/30 to-transparent" />
    </section>
  );
}
