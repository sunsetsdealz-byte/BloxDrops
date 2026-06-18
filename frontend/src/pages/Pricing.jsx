import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, Lightning, Crown, Sparkle } from "@phosphor-icons/react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { TID } from "../constants/testIds";

const PLAN_DETAILS = {
  free: {
    name: "Free",
    price: 0,
    credits: 20,
    features: ["20 credits total", "Watermarked exports", "Community gallery", "Standard queue"],
    cta: "Current plan",
  },
  creator: {
    name: "Creator",
    price: 9,
    credits: 300,
    features: ["300 credits / month", "All design styles", "Watermark-free", "Priority queue", "Commercial rights"],
    accent: "#ccff00",
    cta: "Get Creator",
    tid: TID.pricingPlanCreator,
  },
  pro: {
    name: "Pro",
    price: 18,
    credits: 700,
    features: ["700 credits / month", "Highest priority queue", "Battle boost (2x wins)", "PBR textures", "Early access features", "Private creations"],
    accent: "#ff0055",
    cta: "Get Pro",
    tid: TID.pricingPlanPro,
    popular: true,
  },
};

export default function Pricing() {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(null);
  const [params] = useSearchParams();
  const nav = useNavigate();

  // Stripe return polling
  useEffect(() => {
    const sid = params.get("session_id");
    const status = params.get("status");
    if (status === "cancelled") {
      toast.info("Checkout cancelled.");
      return;
    }
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
          if (data.status === "expired") {
            toast.error("Checkout expired.");
            return;
          }
        } catch (err) {}
        if (attempts < 6) setTimeout(poll, 2000);
        else toast.info("Still processing — check back soon.");
      };
      poll();
    }
  }, [params, user, refresh, nav]);

  const checkout = async (plan_id) => {
    if (!user) return nav("/login");
    setLoading(plan_id);
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

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20">
      <div className="text-center mb-12">
        <p className="text-xs uppercase tracking-[0.3em] font-bold text-[#ccff00] mb-3">Pricing</p>
        <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter">
          Pick your plan.<br/>Ship more.
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto mt-4">
          All plans include commercial rights. Cancel anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {Object.entries(PLAN_DETAILS).map(([key, plan]) => {
          const isCurrent = user?.plan === key;
          return (
            <div
              key={key}
              className={`relative rounded-3xl p-7 border ${
                plan.popular ? "border-[#ff0055]/50 bg-gradient-to-b from-[#ff0055]/5 to-transparent" : "border-white/10 bg-zinc-900/60"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff0055] text-white text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1">
                  Most popular
                </div>
              )}
              {key === "pro" && <Crown size={28} weight="duotone" className="text-[#ff0055] mb-2" />}
              {key === "creator" && <Lightning size={28} weight="duotone" className="text-[#ccff00] mb-2" />}
              {key === "free" && <Sparkle size={28} weight="duotone" className="text-zinc-400 mb-2" />}

              <h3 className="font-display text-2xl font-black uppercase tracking-tighter">{plan.name}</h3>
              <div className="mt-3 mb-5">
                <span className="text-5xl font-black tracking-tighter">${plan.price}</span>
                <span className="text-zinc-400 text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-2.5 mb-7 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 items-start text-zinc-300">
                    <Check
                      size={16}
                      weight="bold"
                      style={{ color: plan.accent || "#a1a1aa" }}
                      className="mt-0.5 flex-shrink-0"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              {key === "free" ? (
                <Link
                  to={user ? "/studio" : "/register"}
                  className="btn-ghost rounded-full w-full py-3 text-sm font-bold uppercase tracking-wider text-center block"
                >
                  {isCurrent ? "Current plan" : "Start free"}
                </Link>
              ) : (
                <button
                  data-testid={plan.tid}
                  onClick={() => checkout(key)}
                  disabled={loading === key || isCurrent}
                  className={`w-full rounded-full py-3 text-sm font-black uppercase tracking-wider transition-all ${
                    plan.popular ? "bg-[#ff0055] text-white hover:shadow-[0_0_25px_rgba(255,0,85,0.5)]" : "btn-volt"
                  } disabled:opacity-50`}
                >
                  {loading === key ? "Loading…" : isCurrent ? "Current plan" : plan.cta}
                </button>
              )}
              {!isCurrent && key !== "free" && (
                <p data-testid={TID.pricingCheckout(key)} className="text-[10px] text-zinc-500 text-center mt-3 uppercase tracking-widest">
                  Secure checkout via Stripe
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
