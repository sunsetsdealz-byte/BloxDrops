import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ArrowSquareOut, Warning, Lightning, CurrencyDollar } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { api, formatApiError } from "../lib/api";

/**
 * Stripe Connect onboarding panel — drop into Profile page.
 * Self-fetches /api/connect/status + /api/connect/configured on mount.
 */
export default function ConnectPayoutsCard() {
  const [status, setStatus] = useState(null);
  const [configured, setConfigured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [cfg, st] = await Promise.all([
        api.get("/connect/configured"),
        api.get("/connect/status"),
      ]);
      setConfigured(cfg.data);
      setStatus(st.data);
    } catch (e) { /* silent */ }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // Auto-poll if user just returned from Stripe onboarding
    const url = new URL(window.location.href);
    if (url.searchParams.get("connect") === "success") {
      const t = setTimeout(refresh, 800);
      url.searchParams.delete("connect");
      window.history.replaceState({}, "", url.toString());
      return () => clearTimeout(t);
    }
  }, []);

  const onboard = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/connect/onboard", { origin_url: window.location.origin });
      window.location.href = data.url;
    } catch (e) { toast.error(formatApiError(e)); setSubmitting(false); }
  };

  const openDashboard = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/connect/login-link");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e) { toast.error(formatApiError(e)); }
    setSubmitting(false);
  };

  if (loading) return null;

  // Backend has the emergent proxy key only — Connect not available
  if (configured && !configured.configured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#fbbf24]/30 bg-[#fbbf24]/5 p-5"
        data-testid="connect-not-configured"
      >
        <div className="flex items-start gap-3">
          <Warning size={22} weight="duotone" className="text-[#fbbf24] mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-display text-lg font-black uppercase tracking-tight mb-1">Get paid · Stripe Connect</p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              USD payouts are not yet activated on this BloxDrops instance.
              Admin needs to add a real Stripe secret key (<code className="text-[#ccff00]">STRIPE_API_KEY=sk_test_…</code>) from{" "}
              <a className="text-[#ccff00] underline" href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noreferrer">
                dashboard.stripe.com/test/apikeys
              </a>{" "}before creators can onboard for cash-out.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const onboarded = status?.charges_enabled && status?.payouts_enabled;
  const started = !!status?.account_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 ${onboarded ? "border-[#ccff00]/40 bg-gradient-to-br from-[#ccff00]/10 to-transparent" : "border-[#fbbf24]/40 bg-gradient-to-br from-[#fbbf24]/8 to-transparent"}`}
      data-testid="connect-card"
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {onboarded
            ? <ShieldCheck size={26} weight="duotone" className="text-[#ccff00] mt-0.5 flex-shrink-0" />
            : <CurrencyDollar size={26} weight="duotone" className="text-[#fbbf24] mt-0.5 flex-shrink-0" />}
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold mb-1" style={{ color: onboarded ? "#ccff00" : "#fbbf24" }}>
              Stripe Connect · Express
            </p>
            <p className="font-display text-xl font-black uppercase tracking-tight">
              {onboarded ? "USD payouts active" : started ? "Finish onboarding" : "Get paid in USD"}
            </p>
            <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
              {onboarded
                ? "Sales of your drops cash out directly to your bank. 5% royalty + 5% platform fee auto-split."
                : "Link your bank account to receive real USD when your drops sell. Stripe handles KYC + fraud."}
            </p>
            {status?.requirements?.disabled_reason && (
              <p className="mt-2 text-xs text-[#ff0055] font-bold">
                Issue: {status.requirements.disabled_reason}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!onboarded ? (
            <button
              onClick={onboard}
              disabled={submitting}
              data-testid="connect-onboard-btn"
              className="bg-[#fbbf24] text-black rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:shadow-[0_0_22px_rgba(251,191,36,0.6)] transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              <Lightning size={13} weight="fill" />
              {submitting ? "Opening…" : started ? "Continue" : "Connect Stripe"}
            </button>
          ) : (
            <button
              onClick={openDashboard}
              disabled={submitting}
              data-testid="connect-dashboard-btn"
              className="bg-[#ccff00] text-black rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:shadow-[0_0_22px_rgba(204,255,0,0.55)] transition-all flex items-center gap-1.5"
            >
              Open dashboard <ArrowSquareOut size={13} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Status row */}
      {started && (
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/8">
          <StatusPill label="Details" ok={status.details_submitted} />
          <StatusPill label="Charges" ok={status.charges_enabled} />
          <StatusPill label="Payouts" ok={status.payouts_enabled} />
        </div>
      )}
    </motion.div>
  );
}

function StatusPill({ label, ok }) {
  return (
    <div className={`text-center rounded-lg border px-2 py-1.5 ${ok ? "border-[#ccff00]/40 bg-[#ccff00]/10 text-[#ccff00]" : "border-zinc-700 bg-zinc-900/50 text-zinc-500"}`}>
      <p className="text-[9px] uppercase tracking-widest font-black">{label}</p>
      <p className="text-sm font-black mt-0.5">{ok ? "✓" : "—"}</p>
    </div>
  );
}
