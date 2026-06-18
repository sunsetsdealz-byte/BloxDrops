import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { X, Storefront, Lightning, Coins, Check } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";

/**
 * Stripe-powered BloxBucks top-up modal.
 * Pulls packages from /api/bloxbucks/packages, kicks off /api/bloxbucks/topup/checkout,
 * polls /api/bloxbucks/topup/status/{session} on return.
 */
export default function TopUpModal({ open, onClose, onPurchased }) {
  const [packages, setPackages] = useState([]);
  const [selected, setSelected] = useState("pro");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    api.get("/bloxbucks/packages")
      .then((r) => setPackages(r.data?.packages || []))
      .catch(() => {});
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  // Detect return from Stripe (?topup_session=...) and poll status
  useEffect(() => {
    const url = new URL(window.location.href);
    const sid = url.searchParams.get("topup_session");
    if (!sid) return;
    let cancelled = false;
    const poll = async (attempt = 0) => {
      if (cancelled || attempt > 12) return;
      try {
        const { data } = await api.get(`/bloxbucks/topup/status/${sid}`);
        if (data.payment_status === "paid") {
          toast.success(`Topped up ${data.bb_amount?.toLocaleString()} BB! New balance: ${data.new_balance?.toLocaleString()} BB`);
          url.searchParams.delete("topup_session");
          window.history.replaceState({}, "", url.toString());
          onPurchased && onPurchased(data.new_balance);
          return;
        }
        if (data.status === "expired") return;
        setTimeout(() => poll(attempt + 1), 2000);
      } catch { setTimeout(() => poll(attempt + 1), 2500); }
    };
    poll();
    return () => { cancelled = true; };
  }, [onPurchased]);

  const buy = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/bloxbucks/topup/checkout", {
        package_id: selected,
        origin_url: window.location.origin,
      });
      window.location.href = data.url;
    } catch (e) { toast.error(formatApiError(e)); setSubmitting(false); }
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
        data-testid="topup-modal"
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }}
          className="relative w-full max-w-xl bg-zinc-950 border border-[#fbbf24]/30 rounded-3xl p-6 md:p-7"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black border border-white/10 flex items-center justify-center hover:bg-[#ff0055] hover:border-[#ff0055]">
            <X size={18} weight="bold" />
          </button>

          <p className="text-[10px] uppercase tracking-[0.3em] text-[#fbbf24] font-bold mb-2 flex items-center gap-1.5">
            <Storefront size={11} weight="fill" /> Top up
          </p>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter mb-1">
            Buy <span className="text-[#fbbf24]">BloxBucks</span>
          </h2>
          <p className="text-sm text-zinc-400 mb-5">
            Spend BloxBucks to buy drops on the marketplace. Stripe-secured · USD only.
          </p>

          <div className="space-y-2.5">
            {packages.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                data-testid={`pkg-${p.id}`}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all flex items-center gap-4 ${
                  selected === p.id
                    ? "border-[#fbbf24] bg-gradient-to-r from-[#fbbf24]/15 to-transparent"
                    : "border-white/10 bg-zinc-900/60 hover:border-white/25"
                }`}
              >
                <Coins size={24} weight="duotone" className={selected === p.id ? "text-[#fbbf24]" : "text-zinc-500"} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-xl font-black uppercase tracking-tight">{p.bb.toLocaleString()} BB</p>
                    {p.perk && <span className="text-[9px] uppercase tracking-widest font-black text-[#ccff00]">· {p.perk}</span>}
                  </div>
                  <p className="text-xs text-zinc-400">{p.label} pack</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-black">${p.usd}</p>
                </div>
                {selected === p.id && (
                  <Check size={20} weight="bold" className="text-[#fbbf24]" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={buy}
            disabled={submitting || packages.length === 0}
            data-testid="topup-confirm"
            className="w-full mt-5 bg-[#fbbf24] text-black rounded-full py-3.5 font-black uppercase tracking-widest text-sm hover:shadow-[0_0_24px_rgba(251,191,36,0.6)] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Lightning size={14} weight="fill" />
            {submitting ? "Redirecting…" : "Continue to Stripe"}
          </button>

          <p className="text-[10px] text-zinc-500 text-center mt-3 uppercase tracking-widest">
            Secure checkout · powered by Stripe
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
