import React, { useEffect, useState } from "react";
import { motion, useReducedMotion, animate } from "framer-motion";
import {
  Coins, Storefront, TrendUp, Bank, CurrencyDollar, ArrowRight, Sparkle,
  Lightning, Crown, ShieldCheck, ArrowsClockwise, Lock,
} from "@phosphor-icons/react";
import { api } from "../lib/api";

/* ----- animated counter ----- */
function CountUp({ to = 0, duration = 1.6, prefix = "", suffix = "" }) {
  const [v, setV] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { setV(to); return; }
    const ctl = animate(0, to, { duration, ease: "easeOut", onUpdate: (x) => setV(Math.round(x)) });
    return () => ctl.stop();
  }, [to, duration, reduced]);
  return <span>{prefix}{v.toLocaleString()}{suffix}</span>;
}

export default function BloxBucksExplainer() {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    api.get("/bloxbucks/packages")
      .then((r) => setPackages(r.data?.packages || []))
      .catch(() => {});
  }, []);

  return (
    <section className="relative max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16" data-testid="bb-explainer">
      {/* glow backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#fbbf24]/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-[#00f0ff]/15 blur-3xl" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="relative text-center max-w-3xl mx-auto mb-12"
      >
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#fbbf24] font-bold mb-3 flex items-center justify-center gap-2">
          <Coins size={12} weight="fill" /> The BloxBucks economy
        </p>
        <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.95]">
          How <span className="text-[#fbbf24] [text-shadow:0_0_24px_rgba(251,191,36,0.55)]">BloxBucks</span> power the marketplace
        </h2>
        <p className="text-zinc-400 mt-4 text-base md:text-lg leading-relaxed">
          BB is the native currency. Top up once, spend forever, earn back every time
          a buyer touches a drop you minted or own.
        </p>
      </motion.div>

      {/* === 4 STEP FLOW === */}
      <div className="relative grid md:grid-cols-4 gap-4 md:gap-5 mb-16">
        {/* connecting line */}
        <div className="hidden md:block absolute top-[58px] left-[12%] right-[12%] h-px bg-gradient-to-r from-[#fbbf24] via-[#ccff00] via-[#ff0055] to-[#00f0ff] opacity-50 pointer-events-none" />
        {[
          { n: "01", t: "Acquire", body: "Top up BB with USD via Stripe. Instant. 3 package tiers.",
            icon: <CurrencyDollar size={22} weight="duotone" />, color: "#fbbf24" },
          { n: "02", t: "Spend",   body: "Buy drops on the marketplace. Lower supply = higher rarity = higher resale value.",
            icon: <Storefront size={22} weight="duotone" />, color: "#ccff00" },
          { n: "03", t: "Earn",    body: "When others buy your drop, BB flows back. 5% royalty on every resale — forever.",
            icon: <TrendUp size={22} weight="duotone" />, color: "#ff0055" },
          { n: "04", t: "Cash out", body: "Convert BB → USD via Stripe Connect. Direct to your bank.",
            icon: <Bank size={22} weight="duotone" />, color: "#00f0ff", soon: true },
        ].map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative rounded-2xl border bg-zinc-950/80 p-5 flex flex-col gap-3"
            style={{ borderColor: `${s.color}55` }}
          >
            <div className="flex items-center justify-between">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center border z-10 bg-zinc-950"
                style={{ color: s.color, borderColor: `${s.color}80`, boxShadow: `0 0 22px ${s.color}55` }}
              >
                {s.icon}
              </div>
              <span className="font-mono text-3xl font-black opacity-15" style={{ color: s.color }}>{s.n}</span>
            </div>
            <div>
              <h3 className="font-display text-xl font-black uppercase tracking-tighter flex items-center gap-2" style={{ color: s.color }}>
                {s.t}
                {s.soon && (
                  <span className="text-[9px] uppercase tracking-widest font-black bg-black/60 border border-[#00f0ff]/40 text-[#00f0ff] rounded-full px-2 py-0.5">
                    Soon
                  </span>
                )}
              </h3>
              <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{s.body}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* === SALE SPLIT VISUALIZATION === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 p-6 md:p-10 mb-12 overflow-hidden relative"
      >
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#fbbf24]/15 blur-3xl pointer-events-none" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#fbbf24] font-bold mb-3 flex items-center gap-2">
              <Sparkle size={11} weight="fill" /> Where every BB goes
            </p>
            <h3 className="font-display text-2xl md:text-4xl font-black uppercase tracking-tighter mb-3">
              One sale.<br />Three smart payouts.
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-5">
              When a drop sells for <strong className="text-white">1,000 BB</strong>, the platform routes it instantly:
            </p>
            <div className="space-y-2.5">
              <SplitBar label="Seller" pct={90} amount="900 BB" color="#ccff00" delay={0.0} icon={<Crown size={14} weight="fill" />} />
              <SplitBar label="Original Creator royalty" pct={5}  amount="50 BB"  color="#fbbf24" delay={0.1} icon={<ShieldCheck size={14} weight="fill" />} />
              <SplitBar label="Platform fee · Blox"      pct={5}  amount="50 BB"  color="#ff0055" delay={0.2} icon={<Storefront size={14} weight="fill" />} />
            </div>
            <p className="text-[11px] text-zinc-500 mt-4 leading-relaxed">
              First sale: seller IS the creator → no royalty split, seller gets 95%.<br />
              Resale: original creator earns 5% royalty <strong className="text-white">forever</strong>.
            </p>
          </div>

          {/* Visual donut */}
          <div className="flex items-center justify-center">
            <SplitDonut />
          </div>
        </div>
      </motion.div>

      {/* === BB PACKAGE GRID === */}
      {packages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mb-12"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ccff00] font-bold mb-3 text-center flex items-center justify-center gap-2">
            <Lightning size={11} weight="fill" /> Top-up Packages · USD via Stripe
          </p>
          <h3 className="font-display text-2xl md:text-4xl font-black uppercase tracking-tighter mb-6 text-center">
            Pick your pack.<br />Bigger pack · bigger bonus.
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {packages.map((p, i) => {
              const accent = p.id === "starter" ? "#a1a1aa" : p.id === "pro" ? "#ccff00" : "#fbbf24";
              const isWhale = p.id === "whale";
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className={`relative rounded-2xl border-2 p-5 ${isWhale ? "bg-gradient-to-br from-[#fbbf24]/15 to-transparent" : "bg-zinc-950/60"}`}
                  style={{ borderColor: `${accent}80` }}
                >
                  {isWhale && (
                    <span className="absolute -top-3 left-4 text-[9px] uppercase tracking-widest font-black bg-[#fbbf24] text-black rounded-full px-2.5 py-1 shadow-[0_0_18px_rgba(251,191,36,0.6)]">
                      Best Value · +25%
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <Coins size={28} weight="duotone" style={{ color: accent }} />
                    <span className="font-mono text-[10px] uppercase tracking-widest font-black text-zinc-500">{p.label}</span>
                  </div>
                  <p className="font-display text-3xl md:text-4xl font-black tracking-tighter" style={{ color: accent }}>
                    <CountUp to={p.bb} /> <span className="text-base text-zinc-500 font-bold">BB</span>
                  </p>
                  <p className="font-display text-2xl font-black text-white mt-1">${p.usd}</p>
                  {p.perk && (
                    <p className="text-[10px] uppercase tracking-widest font-black mt-2" style={{ color: accent }}>
                      {p.perk}
                    </p>
                  )}
                  {/* per-BB rate */}
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-3 pt-3 border-t border-white/8">
                    {(p.usd / p.bb * 1000).toFixed(2)}¢ per BB
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* === WHY BLOXBUCKS === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="rounded-3xl border border-[#ccff00]/30 bg-gradient-to-r from-[#ccff00]/8 via-transparent to-[#00f0ff]/8 p-6 md:p-8"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ccff00] font-bold mb-2 text-center">
          ▍ Why a native currency?
        </p>
        <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter text-center mb-6">
          BloxBucks vs. crypto vs. raw cash
        </h3>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { t: "Instant", body: "Settle in milliseconds. No on-chain confirmation wait.",
              icon: <Lightning size={20} weight="fill" />, color: "#ccff00" },
            { t: "Safe",    body: "No wallet hacks, no gas fees, no seed-phrase loss.",
              icon: <ShieldCheck size={20} weight="fill" />, color: "#00f0ff" },
            { t: "Reversible", body: "Disputes? Admin can refund a tx. Try doing that on Ethereum.",
              icon: <ArrowsClockwise size={20} weight="fill" />, color: "#fbbf24" },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-white/8 bg-black/40 p-4">
              <div className="flex items-center gap-2 mb-2" style={{ color: f.color }}>
                {f.icon}
                <h4 className="font-display text-lg font-black uppercase tracking-tight">{f.t}</h4>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-zinc-500 mt-5 leading-relaxed">
          <Lock size={11} className="inline mb-0.5" /> Stripe-backed. KYC-compliant. Withdrawable to USD once you onboard Stripe Connect.
        </p>
      </motion.div>
    </section>
  );
}

/* -- bar inside the split block -- */
function SplitBar({ label, pct, amount, color, delay, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-3"
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ color, background: `${color}22`, border: `1px solid ${color}55` }}
      >{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1 text-xs">
          <span className="text-zinc-300 font-bold">{label}</span>
          <span className="font-mono font-black" style={{ color }}>{amount} · {pct}%</span>
        </div>
        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
            transition={{ duration: 1.2, delay: delay + 0.2, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 14px ${color}` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* -- SVG donut split visual -- */
function SplitDonut() {
  // 90 / 5 / 5
  const r = 70;
  const c = 2 * Math.PI * r;
  const segments = [
    { label: "Seller", pct: 90, color: "#ccff00" },
    { label: "Royalty", pct: 5, color: "#fbbf24" },
    { label: "Platform", pct: 5, color: "#ff0055" },
  ];
  let offset = 0;
  return (
    <div className="relative">
      <svg viewBox="0 0 200 200" className="w-56 h-56 md:w-72 md:h-72 -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="20" />
        {segments.map((s, i) => {
          const len = (s.pct / 100) * c;
          const dash = `${len} ${c}`;
          const dashoffset = -offset;
          offset += len;
          return (
            <motion.circle
              key={i}
              cx="100" cy="100" r={r} fill="none"
              stroke={s.color} strokeWidth="20" strokeLinecap="butt"
              strokeDasharray={dash}
              strokeDashoffset={dashoffset}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: i * 0.25 }}
              style={{ filter: `drop-shadow(0 0 6px ${s.color})` }}
            />
          );
        })}
      </svg>
      {/* center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Sale</span>
        <span className="font-display text-3xl md:text-4xl font-black text-white">1,000</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#fbbf24] font-black">BB</span>
      </div>
    </div>
  );
}
