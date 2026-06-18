import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { TID } from "../constants/testIds";
import { formatApiError } from "../lib/api";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, name);
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
          Make your first item
        </h1>
        <p className="text-zinc-400 text-sm mb-8">20 free credits — no card needed.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Creator name</label>
            <input
              data-testid={TID.registerName}
              type="text"
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-dark w-full rounded-lg px-4 py-3 mt-1"
              placeholder="ShadowLord_99"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Email</label>
            <input
              data-testid={TID.registerEmail}
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
              data-testid={TID.registerPassword}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark w-full rounded-lg px-4 py-3 mt-1"
              placeholder="6+ characters"
            />
          </div>
          {error && (
            <div data-testid={TID.registerError} className="text-sm text-[#ff0055] font-medium">
              {error}
            </div>
          )}
          <button
            type="submit"
            data-testid={TID.registerSubmit}
            disabled={loading}
            className="btn-volt w-full rounded-lg py-3.5 text-sm"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-zinc-400 mt-6">
          Already a creator?{" "}
          <Link to="/login" className="text-[#ccff00] font-bold">Log in</Link>
        </p>
      </div>
    </div>
  );
}
