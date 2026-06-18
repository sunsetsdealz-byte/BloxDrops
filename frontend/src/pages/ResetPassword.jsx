import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password updated. Please log in.");
      nav("/login");
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
          Reset password
        </h1>
        <p className="text-zinc-400 text-sm mb-8">Choose a new password to get back into your studio.</p>

        {!token ? (
          <div className="text-sm text-[#ff0055]">Missing reset token. <Link to="/forgot-password" className="text-[#ccff00] font-bold">Request a new link</Link>.</div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">New password</label>
              <input
                data-testid="reset-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark w-full rounded-lg px-4 py-3 mt-1"
                placeholder="6+ characters"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Confirm</label>
              <input
                data-testid="reset-confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-dark w-full rounded-lg px-4 py-3 mt-1"
                placeholder="Repeat new password"
              />
            </div>
            <button
              data-testid="reset-submit"
              type="submit"
              disabled={loading}
              className="btn-volt w-full rounded-lg py-3.5 text-sm"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
