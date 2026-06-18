import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Crown, MagnifyingGlass, ShieldCheck, ShieldStar, User, Lightning } from "@phosphor-icons/react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Admin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(null);

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

  if (!user || user.role !== "admin") return null;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
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
            {users.length} users · {adminCount} admins
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
        <div className="bg-zinc-950/70 border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm" data-testid="admin-users-table">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
              <tr>
                <th className="text-left p-4">User</th>
                <th className="text-left p-4 hidden md:table-cell">Plan</th>
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
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-[10px] uppercase tracking-widest bg-white/5 border border-white/8 rounded-full px-2 py-0.5 font-bold">
                      {u.plan}
                    </span>
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
        The seed admin (<code className="font-mono">{user.email}</code>) is protected from demotion.
      </p>
    </div>
  );
}
