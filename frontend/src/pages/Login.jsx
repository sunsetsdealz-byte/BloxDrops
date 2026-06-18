import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { TID } from "../constants/testIds";
import { formatApiError } from "../lib/api";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      nav("/studio");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter mb-1">
          Welcome back
        </h1>
        <p className="text-zinc-400 text-sm mb-8">Log in to keep shipping items.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Email</label>
            <input
              data-testid={TID.loginEmail}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark w-full rounded-lg px-4 py-3 mt-1"
              placeholder="you@studio.com"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Password</label>
            <input
              data-testid={TID.loginPassword}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark w-full rounded-lg px-4 py-3 mt-1"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div data-testid={TID.loginError} className="text-sm text-[#ff0055] font-medium">
              {error}
            </div>
          )}
          <button
            type="submit"
            data-testid={TID.loginSubmit}
            disabled={loading}
            className="btn-volt w-full rounded-lg py-3.5 text-sm"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-zinc-400 mt-6">
          New here?{" "}
          <Link to="/register" className="text-[#ccff00] font-bold">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
