import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, MagnifyingGlass, ShieldStar, User, Lightning, CaretDown, X, Check,
} from "@phosphor-icons/react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

const PLAN_OPTIONS = [
  { id: "free", label: "Free", color: "#a1a1aa", desc: "Disable subscription" },
  { id: "creator", label: "Indie · monthly", color: "#ccff00", desc: "$15/mo · 300 credits" },
  { id: "creator_annual", label: "Indie · annual", color: "#ccff00", desc: "$108/yr · 300 credits" },
  { id: "pro", label: "Studio · monthly", color: "#ff0055", desc: "$30/mo · 700 credits" },
  { id: "pro_annual", label: "Studio · annual", color: "#ff0055", desc: "$216/yr · 700 credits" },
];

export default function Admin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(null);
  const [planMenu, setPlanMenu] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/users?q=${encodeURIComponent(q)}&limit=200`);
      setUsers(data.items || []);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    if (user === false) { nav("/login"); return; }
    if (user && user.role !== "admin") { nav("/"); return; }
    if (user) load();
  }, [user, load, nav]);

  const toggleRole = async (target) => {
    setBusy(target.id);
    try {
      const endpoint = target.role === "admin" ? "demote" : "promote";
      await api.post(`/admin/users/${target.id}/${endpoint}`);
      toast.success(target.role === "admin" ? `${target.name || target.email} removed as admin` : `${target.name || target.email} promoted to admin`);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(null);
    }
  };

  const setPlan = async (target, plan_id, grant_credits) => {
    setBusy(target.id);
    setPlanMenu(null);
    try {
      const { data } = await api.post(`/admin/users/${target.id}/set-plan`, {
        plan_id,
        grant_credits,
      });
      toast.success(
        plan_id === "free"
          ? `Subscription disabled for ${target.name || target.email}`
          : `${target.name || target.email} → ${plan_id} ${grant_credits ? "(+credits)" : ""}`
      );
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(null);
    }
  };

  if (!user || user.role !== "admin") return null;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const paidCount = users.filter((u) => u.plan && u.plan !== "free").length;

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-4 mb-8"
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] font-bold text-[#ccff00] mb-2 flex items-center gap-2">
            <ShieldStar size={14} weight="fill" /> Admin console
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter">
            User Management
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            {users.length} users · {adminCount} admins · {paidCount} paid subscriptions
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/60 border border-white/10 rounded-full px-4 py-2 w-full sm:w-auto">
          <MagnifyingGlass size={14} weight="bold" className="text-zinc-400" />
          <input
            data-testid="admin-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by email or name…"
            className="bg-transparent text-sm outline-none w-full sm:w-72"
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="text-zinc-500 text-sm py-10 text-center">Loading…</div>
      ) : (
        <div className="bg-zinc-950/70 border border-white/8 rounded-2xl overflow-visible">
          <table className="w-full text-sm" data-testid="admin-users-table">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
              <tr>
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Subscription</th>
                <th className="text-left p-4 hidden sm:table-cell">Credits</th>
                <th className="text-left p-4">Role</th>
                <th className="text-right p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={i % 2 ? "bg-white/[0.015]" : ""}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                        {u.role === "admin" ? (
                          <Crown size={16} weight="fill" className="text-[#ccff00]" />
                        ) : (
                          <User size={16} weight="duotone" className="text-zinc-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{u.name || "—"}</p>
                        <p className="text-xs text-zinc-500 truncate font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* SUBSCRIPTION cell — interactive dropdown */}
                  <td className="p-4 relative">
                    <button
                      onClick={() => setPlanMenu(planMenu === u.id ? null : u.id)}
                      data-testid={`plan-toggle-${u.id}`}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest font-black border transition-colors ${
                        u.plan === "free"
                          ? "bg-zinc-900 text-zinc-300 border-white/10 hover:border-white/30"
                          : u.plan?.startsWith("pro")
                            ? "bg-[#ff0055]/15 text-[#ff0055] border-[#ff0055]/40"
                            : "bg-[#ccff00]/15 text-[#ccff00] border-[#ccff00]/40"
                      }`}
                    >
                      {u.plan || "free"}
                      <CaretDown size={10} weight="bold" />
                    </button>

                    <AnimatePresence>
                      {planMenu === u.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-30 top-full left-4 mt-1 w-72 bg-zinc-950 border border-white/15 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.7)] overflow-hidden"
                        >
                          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Set plan</p>
                            <button onClick={() => setPlanMenu(null)} className="text-zinc-400 hover:text-white">
                              <X size={14} weight="bold" />
                            </button>
                          </div>
                          <div className="py-1">
                            {PLAN_OPTIONS.map((p) => {
                              const isActive = u.plan === p.id;
                              const isFree = p.id === "free";
                              return (
                                <div
                                  key={p.id}
                                  className={`px-4 py-2.5 ${isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.025]"}`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm" style={{ color: p.color }}>{p.label}</span>
                                        {isActive && <Check size={12} weight="bold" className="text-[#ccff00]" />}
                                      </div>
                                      <p className="text-[10px] text-zinc-500 mt-0.5">{p.desc}</p>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                      {!isActive && (
                                        <button
                                          onClick={() => setPlan(u, p.id, false)}
                                          disabled={busy === u.id}
                                          data-testid={`set-plan-${u.id}-${p.id}`}
                                          className={`rounded-full px-2.5 py-1 text-[9px] uppercase tracking-widest font-black border ${
                                            isFree
                                              ? "bg-zinc-900 text-zinc-200 border-white/15 hover:bg-zinc-800"
                                              : "bg-white/[0.04] text-white border-white/15 hover:bg-white/10"
                                          }`}
                                        >
                                          {isFree ? "Disable" : "Activate"}
                                        </button>
                                      )}
                                      {!isFree && (
                                        <button
                                          onClick={() => setPlan(u, p.id, true)}
                                          disabled={busy === u.id}
                                          data-testid={`set-plan-${u.id}-${p.id}-grant`}
                                          className="rounded-full px-2.5 py-1 text-[9px] uppercase tracking-widest font-black bg-[#ccff00] text-black hover:shadow-[0_0_16px_rgba(204,255,0,0.5)]"
                                          title="Activate plan AND grant the plan's credits"
                                        >
                                          + credits
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>

                  <td className="p-4 hidden sm:table-cell text-zinc-300 font-mono">
                    {u.role === "admin" ? "—" : u.credits.toLocaleString()}
                  </td>

                  <td className="p-4">
                    {u.role === "admin" ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/40 rounded-full px-2 py-0.5 font-black">
                        <Lightning size={10} weight="fill" /> Admin
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">user</span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    {u.is_seed_admin ? (
                      <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">protected</span>
                    ) : u.id === user.id ? (
                      <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">you</span>
                    ) : (
                      <button
                        onClick={() => toggleRole(u)}
                        disabled={busy === u.id}
                        data-testid={`role-toggle-${u.id}`}
                        className={`rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] font-black transition-all disabled:opacity-50 ${
                          u.role === "admin"
                            ? "bg-[#ff0055]/15 text-[#ff0055] border border-[#ff0055]/50 hover:bg-[#ff0055] hover:text-white hover:shadow-[0_0_18px_rgba(255,0,85,0.5)]"
                            : "bg-[#ccff00] text-black border border-[#ccff00] hover:shadow-[0_0_18px_rgba(204,255,0,0.5)]"
                        }`}
                      >
                        {busy === u.id ? "…" : u.role === "admin" ? "Remove admin" : "Make admin"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-10 text-center text-zinc-500 text-sm">No users match.</div>
          )}
        </div>
      )}

      <p className="text-[10px] text-zinc-600 text-center mt-6 uppercase tracking-widest">
        Seed admin protected · "+ credits" grants the plan's monthly credits on activation
      </p>
    </div>
  );
}
