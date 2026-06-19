import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Check, X, Lightning, Crown, Sparkle, Robot, ChatCircle, Trophy,
  ShareNetwork, Cube, FireSimple, Rocket,
} from "@phosphor-icons/react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { TID } from "../constants/testIds";

/* All copy is original — does NOT replicate UGCraft's wording.
   Every line below maps to a real feature actually implemented in BloxDrops AI. */
const PLAN_DETAILS = {
  free: {
    name: "Starter",
    sub: "Kick the tires. Mint your first item without spending a dime.",
    monthly: 0,
    annual: 0,
    accent: "#a1a1aa",
    icon: <Sparkle size={28} weight="duotone" />,
    features: [
      ["20 free generation credits, no card required", true],
      ["Both Text → 3D and Image → 3D pipelines", true],
      ["AI prompt booster (1 boost per generation)", true],
      ["Browse the full community feed", true],
      ["Vote in 1v1 battles + earn streak boosts", true],
      ["In-browser 3D preview with avatar try-on", true],
      ["Generic starter materials only", false],
      ["Personal use only — no resale rights", false],
    ],
    cta: "Start free now",
  },
  pro: {
    name: "Studio",
    sub: "For makers chasing the top of the marketplace charts.",
    monthly: 30,
    annual: 18,
    badge: "Top pick",
    accent: "#ff0055",
    icon: <Crown size={28} weight="duotone" />,
    glow: true,
    features: [
      ["700 credits every month — 35+ items easily", true],
      ["3 AI re-rolls per prompt (best-of-3 quality)", true],
      ["All 10 design lanes: cyberpunk, kawaii, gothic, y2k, anime, fantasy, streetwear, gothic, horror, realistic", true],
      ["PBR materials on every export (BloxDrops engine)", true],
      ["Direct push to your 3D platform via Open Cloud API", true],
      ["1 free Featured boost per week", true],
      ["Skip-the-line generation queue", true],
      ["Hidden creations + private studio mode", true],
      ["Full commercial license — sell anywhere", true],
      ["Battle streak multiplier (2× wins toward boost)", true],
      ["First access to every new BloxDrops feature", true],
      ["1:1 onboarding from our team", true],
    ],
    cta: "Become a Studio",
    tid: TID.pricingPlanPro,
  },
  creator: {
    name: "Indie",
    sub: "The sweet spot for weekend hobbyists shipping their first UGC drop.",
    monthly: 15,
    annual: 9,
    accent: "#ccff00",
    icon: <Lightning size={28} weight="duotone" />,
    features: [
      ["300 credits every month — 15+ items comfortably", true],
      ["1 AI re-roll per prompt (regenerate if you don't love it)", true],
      ["All 10 design lanes unlocked", true],
      ["Standard PBR-quality .GLB exports", true],
      ["Direct push to your 3D platform via Open Cloud API", true],
      ["Priority queue (~2× faster than free tier)", true],
      ["Hidden creations + private studio mode", true],
      ["Full commercial license", true],
      ["Email support within 24 hours", true],
    ],
    cta: "Go Indie",
    tid: TID.pricingPlanCreator,
  },
};

const COMPARISON_ROWS = [
  { label: "Monthly generation credits", free: "20 one-time", indie: "300 / mo", studio: "700 / mo" },
  { label: "AI re-rolls per prompt", free: "1", indie: "1", studio: "3 (best of)" },
  { label: "Design styles", free: "Basic 4", indie: "All 10", studio: "All 10 + early access" },
  { label: "Generation queue speed", free: "Standard", indie: "Priority", studio: "Highest priority" },
  { label: "Direct platform push", free: "—", indie: "✔", studio: "✔" },
  { label: "Featured boost", free: "Earn via 5 wins", indie: "Earn via 5 wins", studio: "1 free / week" },
  { label: "Private creations", free: "—", indie: "✔", studio: "✔" },
  { label: "Commercial license", free: "—", indie: "✔", studio: "✔" },
  { label: "Support SLA", free: "Community", indie: "Email · 24h", studio: "1:1 onboarding" },
];

export default function Pricing() {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(null);
  const [interval, setInt] = useState("annual"); // default to annual to show the discount
  const [params] = useSearchParams();
  const nav = useNavigate();

  useEffect(() => {
    const sid = params.get("session_id");
    const status = params.get("status");
    if (status === "cancelled") { toast.info("Checkout cancelled."); return; }
    if (sid && user) {
      let attempts = 0;
      const poll = async () => {
        attempts += 1;
        try {
          const { data } = await api.get(`/payments/status/${sid}`);
          if (data.payment_status === "paid") {
            toast.success("Subscription active! Credits added.");
            refresh();
            nav("/pricing", { replace: true });
            return;
          }
          if (data.status === "expired") { toast.error("Checkout expired."); return; }
        } catch {}
        if (attempts < 6) setTimeout(poll, 2000);
      };
      poll();
    }
  }, [params, user, refresh, nav]);

  const checkout = async (planKey) => {
    if (!user) return nav("/login");
    const plan_id = interval === "annual" ? `${planKey}_annual` : planKey;
    setLoading(planKey);
    try {
      const { data } = await api.post("/payments/checkout", {
        plan_id,
        origin_url: window.location.origin,
      });
      window.location.href = data.url;
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(null);
    }
  };

  const order = ["free", "pro", "creator"];

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#ccff00] font-bold mb-3">
          ▍ Pricing
        </p>
        <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter">
          Pick a lane.<br/>Ship your drop.
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto mt-4">
          Every plan unlocks the full BloxDrops engine and the marketplace export pipeline.
          The only difference is how many ideas you want to ship this month.
        </p>
      </motion.div>

      {/* TOGGLE */}
      <div className="flex items-center justify-center mb-12">
        <div className="relative bg-zinc-950/80 border border-white/10 rounded-full p-1.5 flex items-center gap-1">
          <button
            onClick={() => setInt("annual")}
            data-testid="pricing-interval-annual"
            className={`relative px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
              interval === "annual" ? "bg-[#ccff00] text-black shadow-[0_0_20px_rgba(204,255,0,0.45)]" : "text-zinc-400 hover:text-white"
            }`}
          >
            Annual
            <span className={`ml-2 inline-block text-[10px] rounded-full px-1.5 py-0.5 font-black ${
              interval === "annual" ? "bg-black text-[#ccff00]" : "bg-[#ccff00] text-black"
            }`}>
              Save 40%
            </span>
          </button>
          <button
            onClick={() => setInt("monthly")}
            data-testid="pricing-interval-monthly"
            className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
              interval === "monthly" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* PLAN CARDS */}
      <div className="grid md:grid-cols-3 gap-5 md:gap-6">
        {order.map((key, i) => {
          const plan = PLAN_DETAILS[key];
          const isCurrent = user?.plan === key || (user?.plan === `${key}_annual`);
          const price = interval === "annual" ? plan.annual : plan.monthly;
          const popular = key === "pro";

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className={`relative rounded-3xl p-7 border transition-all ${
                popular
                  ? "border-[#ff0055]/60 md:-mt-4 bg-gradient-to-b from-[#ff0055]/8 via-zinc-950/80 to-zinc-950/40"
                  : "border-white/10 bg-zinc-950/70 hover:border-white/20"
              } ${plan.glow ? "shadow-[0_0_40px_rgba(255,0,85,0.18)]" : ""}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff0055] text-white text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1 shadow-[0_0_18px_rgba(255,0,85,0.5)]">
                  {plan.badge}
                </div>
              )}
              <div style={{ color: plan.accent }} className="mb-3">{plan.icon}</div>

              <h3 className="font-display text-2xl font-black uppercase tracking-tighter">{plan.name}</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-snug min-h-[2.5rem]">{plan.sub}</p>

              <div className="mt-5 mb-5">
                {price === 0 ? (
                  <>
                    <span className="text-5xl font-black tracking-tighter">$0</span>
                    <span className="text-zinc-400 text-sm ml-1">/forever</span>
                  </>
                ) : (
                  <>
                    {interval === "annual" && (
                      <span className="text-zinc-600 line-through text-lg mr-2 align-middle">${plan.monthly}</span>
                    )}
                    <span className="text-5xl font-black tracking-tighter">${price}</span>
                    <span className="text-zinc-400 text-sm ml-1">/month</span>
                    {interval === "annual" && (
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">
                        Billed annually at ${plan.annual * 12}
                      </p>
                    )}
                  </>
                )}
              </div>

              {key === "free" ? (
                <Link
                  to={user ? "/studio" : "/register"}
                  className="btn-ghost rounded-full w-full py-3 text-sm font-bold uppercase tracking-wider text-center block"
                >
                  {isCurrent ? "Current plan" : plan.cta}
                </Link>
              ) : (
                <button
                  data-testid={plan.tid}
                  onClick={() => checkout(key)}
                  disabled={loading === key || isCurrent}
                  className={`w-full rounded-full py-3 text-sm font-black uppercase tracking-wider transition-all ${
                    popular
                      ? "bg-[#ff0055] text-white hover:shadow-[0_0_28px_rgba(255,0,85,0.65)]"
                      : "btn-volt"
                  } disabled:opacity-50`}
                >
                  {loading === key ? "Loading…" : isCurrent ? "Current plan" : plan.cta}
                </button>
              )}

              <ul className="space-y-2.5 mt-6 text-sm">
                {plan.features.map(([f, ok]) => (
                  <li key={f} className="flex gap-2 items-start text-zinc-300">
                    {ok ? (
                      <Check size={16} weight="bold" style={{ color: plan.accent }} className="mt-0.5 flex-shrink-0" />
                    ) : (
                      <X size={16} weight="bold" className="mt-0.5 flex-shrink-0 text-zinc-600" />
                    )}
                    <span className={ok ? "" : "text-zinc-500"}>{f}</span>
                  </li>
                ))}
              </ul>

              {!isCurrent && key !== "free" && (
                <p data-testid={TID.pricingCheckout(key)} className="text-[10px] text-zinc-500 text-center mt-5 uppercase tracking-widest">
                  Secure checkout via Stripe · cancel any time
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* COMPARISON TABLE */}
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mt-20"
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00f0ff] font-bold mb-3 text-center">
          ▍ Side-by-side
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tighter text-center mb-8">
          What you actually get.
        </h2>
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-zinc-950/60">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
              <tr>
                <th className="text-left p-4">Feature</th>
                <th className="text-center p-4">Starter</th>
                <th className="text-center p-4 text-[#ccff00]">Indie</th>
                <th className="text-center p-4 text-[#ff0055]">Studio</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.label} className={i % 2 ? "bg-white/[0.015]" : ""}>
                  <td className="p-4 text-zinc-300 font-medium">{row.label}</td>
                  <td className="p-4 text-center text-zinc-400">{row.free}</td>
                  <td className="p-4 text-center font-bold text-white">{row.indie}</td>
                  <td className="p-4 text-center font-bold text-white">{row.studio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* BOOST CALLOUT */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mt-12 relative rounded-3xl overflow-hidden border border-[#00f0ff]/40 p-8 md:p-10 scanlines"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/10 via-transparent to-[#ccff00]/8" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-[#00f0ff] mb-2 flex items-center gap-1.5">
              <FireSimple size={12} weight="fill" /> Featured Boost
            </p>
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter">
              Pin your creation to the top<br/>of the feed for 24 hours.
            </h3>
            <p className="text-sm text-zinc-400 mt-2">$1.99 anytime · or win 5 battles for a free boost · Studio plan gets 1 free / week.</p>
          </div>
          <Link to="/profile" className="btn-ghost rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wider">
            Boost a creation
          </Link>
        </div>
      </motion.div>

      {/* FAQ-LITE */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mt-16 grid md:grid-cols-3 gap-4"
      >
        <FaqCard icon={<Rocket size={20} weight="duotone" className="text-[#ccff00]" />}
          q="What does a credit buy me?"
          a="One full generation (Text→3D or Image→3D). Re-rolls (AI re-edits) inside the same prompt session don't burn extra credits." />
        <FaqCard icon={<ShareNetwork size={20} weight="duotone" className="text-[#00f0ff]" />}
          q="How does the platform push work?"
          a="Paste your Open Cloud API key once. Hit 'Push' and the preview lands in your Inventory in seconds. The full .GLB downloads for marketplace publish." />
        <FaqCard icon={<Trophy size={20} weight="duotone" className="text-[#ff0055]" />}
          q="Can I cancel any time?"
          a="Yes — cancel from your profile in two clicks. Annual subscribers keep their credits until the renewal date." />
      </motion.section>
    </div>
  );
}

function FaqCard({ icon, q, a }) {
  return (
    <div className="bg-zinc-950/60 border border-white/8 rounded-2xl p-5">
      <div className="mb-3">{icon}</div>
      <h4 className="font-display font-bold text-base mb-2 tracking-tight">{q}</h4>
      <p className="text-sm text-zinc-400 leading-relaxed">{a}</p>
    </div>
  );
}
