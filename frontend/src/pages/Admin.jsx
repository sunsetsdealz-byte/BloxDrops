import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, MagnifyingGlass, ShieldStar, User, Lightning, CaretDown, X, Check, Storefront, Coins, TrendUp,
  CurrencyDollar, Warning, PlugsConnected, Prohibit, Key, Trash,
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

function StatCard({ label, value, icon, accent }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-3.5">
      <div className="flex items-center justify-between mb-1">
        {icon}
      </div>
      <p className="font-display text-xl md:text-2xl font-black tracking-tight leading-tight" style={{ color: accent }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">{label}</p>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(null);
  const [planMenu, setPlanMenu] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [connectStatus, setConnectStatus] = useState(null);

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
    if (user) {
      load();
      api.get("/admin/platform-stats")
        .then((r) => setPlatformStats(r.data))
        .catch(() => {});
      api.get("/admin/creators-connect-status")
        .then((r) => setConnectStatus(r.data))
        .catch(() => {});
    }
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

  const toggleBan = async (target) => {
    setBusy(target.id);
    try {
      const action = target.banned ? "unban" : "ban";
      await api.post(`/admin/users/${target.id}/${action}`);
      toast.success(target.banned ? `${target.email} unbanned` : `${target.email} BANNED`);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(null);
    }
  };

  const deleteUser = async (target) => {
    if (!window.confirm(`PERMANENTLY DELETE ${target.email}?\n\nThis will wipe their account, drops, ownerships, listings, and BloxBucks history. This cannot be undone.`)) return;
    setBusy(target.id);
    try {
      await api.delete(`/admin/users/${target.id}`);
      toast.success(`${target.email} deleted permanently`);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(null);
    }
  };

  const resetPassword = async (target) => {
    const newPwd = window.prompt(
      `Set a new password for ${target.email}.\n\n⚠️ Existing passwords cannot be revealed (they are stored as one-way bcrypt hashes — same as Google/Stripe/every other secure service do).\n\nThe new password must be at least 6 characters. Share it with the user out-of-band (email/SMS).`,
      ""
    );
    if (!newPwd) return;
    if (newPwd.length < 6) return toast.error("Password must be at least 6 characters.");
    setBusy(target.id);
    try {
      await api.post(`/admin/users/${target.id}/reset-password`, { new_password: newPwd });
      toast.success(`Password reset for ${target.email}. Tell them the new password securely.`);
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

      {/* PLATFORM EARNINGS WIDGET */}
      {platformStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 rounded-2xl border border-[#fbbf24]/30 bg-gradient-to-br from-[#fbbf24]/10 via-zinc-950/80 to-zinc-950/80 p-5 md:p-7"
          data-testid="platform-earnings"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] font-bold text-[#fbbf24] mb-2 flex items-center gap-2">
                <Storefront size={12} weight="fill" /> Platform Earnings · Blox
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter">
                Lifetime Revenue
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-5">
            <StatCard label="Platform fees (lifetime)" value={`${platformStats.lifetime_fees_bb?.toLocaleString()} BB`} icon={<Coins size={20} weight="duotone" className="text-[#fbbf24]" />} accent="#fbbf24" />
            <StatCard label="Fees · 24h" value={`${platformStats.fees_24h_bb?.toLocaleString()} BB`} icon={<TrendUp size={20} weight="duotone" className="text-[#ccff00]" />} accent="#ccff00" />
            <StatCard label="Royalties paid out" value={`${platformStats.total_royalties_bb?.toLocaleString()} BB`} icon={<Crown size={20} weight="duotone" className="text-[#ff0055]" />} accent="#ff0055" />
            <StatCard label="Total sales" value={platformStats.total_sales_count?.toLocaleString()} icon={<Lightning size={20} weight="duotone" className="text-[#00f0ff]" />} accent="#00f0ff" />
            <StatCard label="USD topup revenue" value={`$${platformStats.total_topup_revenue_usd?.toLocaleString() || '0.00'}`} icon={<TrendUp size={20} weight="duotone" className="text-[#c084fc]" />} accent="#c084fc" />
          </div>

          {platformStats.recent_fee_transactions?.length > 0 && (
            <div className="mt-6 pt-5 border-t border-white/8">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3">Recent platform fees</p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {platformStats.recent_fee_transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-xs bg-black/40 border border-white/5 rounded-lg px-3 py-2">
                    <span className="text-zinc-400">{new Date(tx.created_at).toLocaleString()}</span>
                    <span className="font-mono text-zinc-500 truncate max-w-[200px]">listing · {tx.related?.listing_id?.slice(0,8)}…</span>
                    <span className="font-black text-[#fbbf24]">+{tx.amount} BB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* CREATOR CONNECT STATUS PANEL */}
      {connectStatus && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-8 rounded-2xl border border-[#ccff00]/25 bg-gradient-to-br from-[#ccff00]/8 via-zinc-950/80 to-zinc-950/80 p-5 md:p-7"
          data-testid="creators-connect-panel"
        >
          <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] font-bold text-[#ccff00] mb-2 flex items-center gap-2">
                <CurrencyDollar size={12} weight="fill" /> Creator USD Payouts · Stripe Connect
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter">
                KYC Pipeline
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <CountChip label="Onboarded" value={connectStatus.counts.onboarded} color="#ccff00" icon={<PlugsConnected size={16} weight="fill" />} />
              <CountChip label="Pending" value={connectStatus.counts.pending} color="#fbbf24" icon={<Warning size={16} weight="fill" />} />
              <CountChip label="Not started" value={connectStatus.counts.never_started} color="#71717a" icon={<User size={16} weight="fill" />} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ConnectColumn
              title="Onboarded"
              accent="#ccff00"
              empty="No creator has finished onboarding yet."
              items={connectStatus.onboarded}
              renderItem={(c) => (
                <CreatorRow
                  key={c.id}
                  name={c.name}
                  email={c.email}
                  rightLabel="USD ready"
                  rightColor="#ccff00"
                  meta={`Onboarded ${c.onboarded_at ? new Date(c.onboarded_at).toLocaleDateString() : '—'}`}
                />
              )}
            />
            <ConnectColumn
              title="Pending KYC"
              accent="#fbbf24"
              empty="No accounts pending KYC."
              items={connectStatus.pending}
              renderItem={(c) => (
                <CreatorRow
                  key={c.id}
                  name={c.name}
                  email={c.email}
                  rightLabel={c.details_submitted ? "Review" : "Started"}
                  rightColor="#fbbf24"
                  meta={c.stripe_account_id?.slice(0, 16) + "…"}
                />
              )}
            />
            <ConnectColumn
              title="Never started"
              accent="#71717a"
              empty="Every active creator has at least started Connect."
              items={connectStatus.never_started}
              renderItem={(c) => (
                <CreatorRow
                  key={c.id}
                  name={c.name}
                  email={c.email}
                  rightLabel="Encourage"
                  rightColor="#71717a"
                  meta="No Stripe account yet"
                />
              )}
            />
          </div>
        </motion.div>
      )}

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
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white truncate">{u.name || "—"}</p>
                          {u.banned && (
                            <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-widest bg-[#ff0055]/15 text-[#ff0055] border border-[#ff0055]/50 rounded-full px-1.5 py-0.5 font-black flex-shrink-0">
                              <Prohibit size={9} weight="fill" /> Banned
                            </span>
                          )}
                        </div>
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
                      <div className="flex items-center gap-1.5 justify-end flex-wrap">
                        <button
                          onClick={() => toggleRole(u)}
                          disabled={busy === u.id}
                          data-testid={`role-toggle-${u.id}`}
                          className={`rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] font-black transition-all disabled:opacity-50 ${
                            u.role === "admin"
                              ? "bg-[#ff0055]/15 text-[#ff0055] border border-[#ff0055]/50 hover:bg-[#ff0055] hover:text-white"
                              : "bg-[#ccff00] text-black border border-[#ccff00] hover:shadow-[0_0_18px_rgba(204,255,0,0.5)]"
                          }`}
                        >
                          {busy === u.id ? "…" : u.role === "admin" ? "Remove admin" : "Make admin"}
                        </button>

                        <IconAction
                          title={u.banned ? "Unban this user" : "Ban this user (block login)"}
                          onClick={() => toggleBan(u)}
                          disabled={busy === u.id}
                          color={u.banned ? "#fbbf24" : "#fb923c"}
                          testId={`ban-${u.id}`}
                          icon={<Prohibit size={13} weight={u.banned ? "regular" : "fill"} />}
                        />
                        <IconAction
                          title="Reset password (existing one cannot be revealed — bcrypt)"
                          onClick={() => resetPassword(u)}
                          disabled={busy === u.id}
                          color="#00f0ff"
                          testId={`reset-pwd-${u.id}`}
                          icon={<Key size={13} weight="fill" />}
                        />
                        <IconAction
                          title="Permanently delete this user + all data"
                          onClick={() => deleteUser(u)}
                          disabled={busy === u.id}
                          color="#ff0055"
                          testId={`delete-${u.id}`}
                          icon={<Trash size={13} weight="fill" />}
                        />
                      </div>
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
        Seed admin protected · plus credits grants the plan&apos;s monthly credits on activation
      </p>
    </div>
  );
}

function IconAction({ title, onClick, disabled, color, icon, testId }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className="rounded-full w-7 h-7 flex items-center justify-center border transition-all disabled:opacity-40"
      style={{ color, borderColor: `${color}55`, backgroundColor: `${color}10` }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color; e.currentTarget.style.color = "#000"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${color}10`; e.currentTarget.style.color = color; }}
    >
      {icon}
    </button>
  );
}

function CountChip({ label, value, color, icon }) {
  return (
    <div className="rounded-xl border bg-black/40 px-3 py-2 min-w-[90px]" style={{ borderColor: `${color}40` }}>
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="font-display text-xl font-black leading-none">{value}</span>
      </div>
      <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mt-1">{label}</p>
    </div>
  );
}

function ConnectColumn({ title, accent, items, empty, renderItem }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/40 p-3">
      <p className="text-[10px] uppercase tracking-[0.25em] font-black mb-3 pb-2 border-b border-white/8" style={{ color: accent }}>
        {title} <span className="text-zinc-600">· {items.length}</span>
      </p>
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-[11px] text-zinc-600 italic py-2">{empty}</p>
        ) : items.map(renderItem)}
      </div>
    </div>
  );
}

function CreatorRow({ name, email, rightLabel, rightColor, meta }) {
  return (
    <div className="bg-zinc-950/70 border border-white/5 rounded-lg px-2.5 py-2 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-bold truncate">{name}</p>
        <p className="text-[10px] text-zinc-500 truncate font-mono">{email}</p>
        {meta && <p className="text-[9px] text-zinc-600 mt-0.5 truncate font-mono">{meta}</p>}
      </div>
      <span
        className="text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full border flex-shrink-0"
        style={{ color: rightColor, borderColor: `${rightColor}50`, backgroundColor: `${rightColor}10` }}
      >
        {rightLabel}
      </span>
    </div>
  );
}

