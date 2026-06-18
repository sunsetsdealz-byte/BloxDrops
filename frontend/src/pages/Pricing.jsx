import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, Lightning, Crown, Sparkle, X } from "@phosphor-icons/react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { TID } from "../constants/testIds";

const PLAN_DETAILS = {
  free: {
    name: "Free",
    sub: "Start creating — no credit card required",
    monthly: 0,
    annual: 0,
    features: [
      ["20 credits to get started", true],
      ["1 Free AI Edit per task", true],
      ["Export 10 community designs", true],
      ["Text-to-3D generation", true],
      ["Image-to-3D generation", true],
      ["Basic design styles", true],
      ["Non-commercial use only", false],
      ["Standard queue priority", false],
    ],
    cta: "Use Now",
  },
  pro: {
    name: "Pro",
    sub: "Perfect for creators building their Roblox business",
    monthly: 30,
    annual: 18, // -40%
    badge: "Most Popular",
    accent: "#ff0055",
    icon: <Crown size={28} weight="duotone" />,
    features: [
      ["700 credits / month", true],
      ["Generate 35 Roblox accessories / month", true],
      ["3 Free AI Edits per task", true],
      ["Text-to-3D generation", true],
      ["Image-to-3D generation", true],
      ["All design styles unlocked", true],
      ["PBR texture support", true],
      ["Unlimited exports", true],
      ["Highest priority queue", true],
      ["Private creations", true],
      ["Commercial usage rights", true],
      ["Priority email support", true],
      ["Early access to new features", true],
    ],
    cta: "Get Pro",
    tid: TID.pricingPlanPro,
  },
  creator: {
    name: "Creator",
    sub: "Perfect for hobbyists and aspiring UGC creators",
    monthly: 15,
    annual: 9, // -40%
    accent: "#ccff00",
    icon: <Lightning size={28} weight="duotone" />,
    features: [
      ["300 credits / month", true],
      ["Generate 15 Roblox accessories / month", true],
      ["1 Free AI Edit per task", true],
      ["Text-to-3D generation", true],
      ["Image-to-3D generation", true],
      ["All design styles unlocked", true],
      ["Unlimited exports", true],
      ["Priority processing queue", true],
      ["Private creations", true],
      ["Commercial usage rights", true],
      ["Email support", true],
    ],
    cta: "Get Creator",
    tid: TID.pricingPlanCreator,
  },
};

export default function Pricing() {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(null);
  const [interval, setInterval] = useState("monthly"); // monthly | annual
  const [params] = useSearchParams();
  const nav = useNavigate();

  // Stripe return polling
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
        else toast.info("Still processing — check back soon.");
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

  const order = ["free", "pro", "creator"]; // Most popular center

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.3em] font-bold text-[#ccff00] mb-3">Pricing</p>
        <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter">
          Pick your plan.<br/>Ship more.
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto mt-4">
          Choose the plan that fits your Roblox UGC creation needs. From beginners to pros, BloxCraft AI has you covered.
        </p>
      </div>

      {/* INTERVAL TOGGLE */}
      <div className="flex items-center justify-center mb-12">
        <div className="bg-zinc-900/80 border border-white/8 rounded-full p-1.5 flex items-center gap-1 relative">
          <button
            onClick={() => setInterval("annual")}
            data-testid="pricing-interval-annual"
            className={`relative px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${
              interval === "annual" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Annually
            <span className="ml-2 inline-block text-[10px] bg-[#ccff00] text-black rounded-full px-1.5 py-0.5 font-black">
              Save 40%
            </span>
          </button>
          <button
            onClick={() => setInterval("monthly")}
            data-testid="pricing-interval-monthly"
            className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${
              interval === "monthly" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {order.map((key) => {
          const plan = PLAN_DETAILS[key];
          const isCurrent = user?.plan === key || (user?.plan === `${key}_annual`);
          const price = interval === "annual" ? plan.annual : plan.monthly;
          const popular = key === "pro";

          return (
            <div
              key={key}
              className={`relative rounded-3xl p-7 border ${
                popular
                  ? "border-[#ff0055]/60 bg-gradient-to-b from-[#ff0055]/8 to-transparent md:-mt-4"
                  : "border-white/10 bg-zinc-900/60"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff0055] text-white text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1">
                  {plan.badge}
                </div>
              )}
              {plan.icon ? plan.icon : <Sparkle size={28} weight="duotone" className="text-zinc-400 mb-2" />}

              <h3 className="font-display text-2xl font-black uppercase tracking-tighter mt-2">{plan.name}</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-snug min-h-[2.5rem]">{plan.sub}</p>

              <div className="mt-5 mb-6">
                {price === 0 ? (
                  <span className="text-5xl font-black tracking-tighter">Free</span>
                ) : (
                  <>
                    <span className="text-zinc-600 line-through text-lg mr-2">
                      {interval === "annual" ? `$${plan.monthly}` : ""}
                    </span>
                    <span className="text-5xl font-black tracking-tighter">${price}</span>
                    <span className="text-zinc-400 text-sm ml-1">/month</span>
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
                    popular ? "bg-[#ff0055] text-white hover:shadow-[0_0_25px_rgba(255,0,85,0.5)]" : "btn-volt"
                  } disabled:opacity-50`}
                >
                  {loading === key ? "Loading…" : isCurrent ? "Current plan" : "Buy Now"}
                </button>
              )}

              <ul className="space-y-2.5 mt-6 text-sm">
                {plan.features.map(([f, ok]) => (
                  <li key={f} className="flex gap-2 items-start text-zinc-300">
                    {ok ? (
                      <Check size={16} weight="bold" style={{ color: plan.accent || "#a1a1aa" }} className="mt-0.5 flex-shrink-0" />
                    ) : (
                      <X size={16} weight="bold" className="mt-0.5 flex-shrink-0 text-zinc-600" />
                    )}
                    <span className={ok ? "" : "text-zinc-500"}>{f}</span>
                  </li>
                ))}
              </ul>

              {!isCurrent && key !== "free" && (
                <p data-testid={TID.pricingCheckout(key)} className="text-[10px] text-zinc-500 text-center mt-5 uppercase tracking-widest">
                  Secure checkout via Stripe
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* BOOST CALLOUT */}
      <div className="mt-16 relative rounded-3xl overflow-hidden border border-[#00f0ff]/30 p-8 md:p-10 bg-gradient-to-br from-[#00f0ff]/10 via-transparent to-[#ccff00]/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#00f0ff] mb-2">Featured for Robux</p>
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter">
              Pin your creation to the top<br/>of the feed for 24 hours.
            </h3>
            <p className="text-sm text-zinc-400 mt-2">$1.99 one-time · or win 5 battles for a free boost.</p>
          </div>
          <Link to="/profile" className="btn-ghost rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wider">
            Boost a creation
          </Link>
        </div>
      </div>
    </div>
  );
}
