import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSent(true);
      if (data.dev_reset_link) setDevLink(data.dev_reset_link);
      toast.success("Check your inbox — if the account exists, a reset link is on its way.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter mb-1">
          Forgot password
        </h1>
        <p className="text-zinc-400 text-sm mb-8">
          Enter your email — we'll send a reset link.
        </p>

        {sent ? (
          <div className="bg-zinc-900/60 border border-[#ccff00]/30 rounded-2xl p-6 space-y-3">
            <p className="text-sm text-zinc-200">
              If an account exists for <strong>{email}</strong>, a reset link has been generated.
            </p>
            {devLink && (
              <div className="text-xs text-zinc-400 break-all p-3 bg-black/50 rounded-lg" data-testid="forgot-dev-link">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#ccff00] mb-1">Dev reset link</p>
                <a href={devLink} className="text-[#ccff00] underline">{devLink}</a>
              </div>
            )}
            <Link to="/login" className="text-[#ccff00] font-bold text-sm">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Email</label>
              <input
                data-testid="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark w-full rounded-lg px-4 py-3 mt-1"
                placeholder="you@studio.com"
              />
            </div>
            <button
              data-testid="forgot-submit"
              type="submit"
              disabled={loading || !email}
              className="btn-volt w-full rounded-lg py-3.5 text-sm"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <p className="text-sm text-zinc-400 text-center">
              <Link to="/login" className="text-[#ccff00] font-bold">Back to login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
