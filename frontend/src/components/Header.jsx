import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { TID } from "../constants/testIds";
import { Coins, SignOut, User, ShieldStar, Storefront, Plus, List, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import TopUpModal from "./TopUpModal";

function NavItem({ to, children, testid, onClick }) {
  return (
    <NavLink
      to={to}
      data-testid={testid}
      onClick={onClick}
      className={({ isActive }) =>
        `px-3 py-1.5 text-sm font-semibold tracking-wide transition-colors ${
          isActive ? "text-[#ccff00]" : "text-zinc-300 hover:text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [bbBalance, setBbBalance] = useState(null);
  const [topupOpen, setTopupOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const refreshBalance = () => {
    if (!user) { setBbBalance(null); return; }
    api.get("/bloxbucks/me")
      .then((r) => setBbBalance(r.data?.balance ?? 0))
      .catch(() => {});
  };

  useEffect(() => { refreshBalance(); /* eslint-disable-next-line */ }, [user]);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const closeMenu = () => setMobileOpen(false);

  return (
    <header
      className="sticky top-0 z-50 glass border-b border-white/5"
      style={{ borderBottomColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center gap-3">
        <Link
          to="/"
          className="brand-logo group flex items-center gap-2.5 select-none"
          data-testid={TID.navLogo}
        >
          {/* 3D isometric cube mark + droplet */}
          <span className="brand-mark relative inline-flex items-center justify-center w-9 h-9">
            <svg
              viewBox="0 0 40 40"
              className="brand-mark-svg w-9 h-9"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="bd-face-top" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#e8ff66" />
                  <stop offset="100%" stopColor="#ccff00" />
                </linearGradient>
                <linearGradient id="bd-face-left" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="100%" stopColor="#0098b0" />
                </linearGradient>
                <linearGradient id="bd-face-right" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff3380" />
                  <stop offset="100%" stopColor="#b3003d" />
                </linearGradient>
                <radialGradient id="bd-drop" cx="50%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="55%" stopColor="#ccff00" />
                  <stop offset="100%" stopColor="#79a800" />
                </radialGradient>
              </defs>
              {/* Isometric cube faces */}
              <polygon
                points="20,4 35,12 20,20 5,12"
                fill="url(#bd-face-top)"
              />
              <polygon
                points="5,12 20,20 20,36 5,28"
                fill="url(#bd-face-left)"
              />
              <polygon
                points="35,12 20,20 20,36 35,28"
                fill="url(#bd-face-right)"
              />
              {/* Edge highlights */}
              <polyline
                points="20,4 20,20 5,12"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.6"
              />
              <polyline
                points="20,20 35,12"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="0.6"
              />
              {/* Falling droplet */}
              <path
                className="brand-droplet"
                d="M32 6 C 34 9, 35 11, 33 12.5 C 31 14, 30 10.5, 32 6 Z"
                fill="url(#bd-drop)"
              />
            </svg>
            <span className="brand-glow" aria-hidden="true" />
          </span>

          {/* Wordmark */}
          <span className="brand-word font-display font-black tracking-tighter text-lg uppercase leading-none flex items-baseline">
            <span className="brand-word-blox">Blox</span>
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-word-drops">Drops</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-6">
          <NavItem to="/studio" testid={TID.navStudio}>Studio</NavItem>
          <NavItem to="/feed" testid={TID.navFeed}>Feed</NavItem>
          <NavItem to="/battle" testid={TID.navBattle}>Battle</NavItem>
          <NavItem to="/challenges" testid={TID.navChallenges}>Challenges</NavItem>
          <NavItem to="/pricing" testid={TID.navPricing}>Pricing</NavItem>
          <NavItem to="/marketplace" testid="nav-marketplace">Marketplace</NavItem>
          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              data-testid="nav-admin"
              className={({ isActive }) =>
                `px-3 py-1.5 text-sm font-bold tracking-wide transition-colors flex items-center gap-1 ${
                  isActive ? "text-[#ccff00]" : "text-[#ccff00]/80 hover:text-[#ccff00]"
                }`
              }
            >
              <ShieldStar size={14} weight="fill" /> Admin
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              {/* BloxBucks balance pill + top-up button — visible on ALL viewports */}
              <div className="flex items-center bg-gradient-to-r from-[#fbbf24]/15 to-[#ff0055]/10 border border-[#fbbf24]/40 rounded-full overflow-hidden">
                <Link
                  to="/marketplace"
                  data-testid="header-bloxbucks"
                  title={`${bbBalance ?? 0} BloxBucks`}
                  className="flex items-center gap-1.5 pl-2.5 sm:pl-3 pr-2 py-1.5 hover:bg-[#fbbf24]/10 transition-colors"
                >
                  <Storefront size={14} weight="duotone" className="text-[#fbbf24]" />
                  <span className="text-xs sm:text-sm font-black text-[#fbbf24] tracking-tight">
                    {bbBalance === null ? "—" : bbBalance.toLocaleString()}
                  </span>
                  <span className="hidden sm:inline text-[9px] text-[#fbbf24]/75 uppercase tracking-widest font-bold">BB</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setTopupOpen(true)}
                  data-testid="header-topup"
                  title="Top up BloxBucks"
                  className="border-l border-[#fbbf24]/30 px-2 py-1.5 hover:bg-[#fbbf24] hover:text-black transition-colors text-[#fbbf24]"
                >
                  <Plus size={15} weight="bold" />
                </button>
              </div>

              {user.role === "admin" ? (
                <div
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ccff00]/15 border border-[#ccff00]/40"
                  data-testid={TID.navCredits}
                  title="Admin · unlimited free generations"
                >
                  <Coins size={16} weight="duotone" className="text-[#ccff00]" />
                  <span className="text-[10px] font-black text-[#ccff00] uppercase tracking-widest">Admin · Free</span>
                </div>
              ) : (
                <div
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
                  data-testid={TID.navCredits}
                >
                  <Coins size={16} weight="duotone" className="text-[#ccff00]" />
                  <span className="text-sm font-bold">{user.credits}</span>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider">credits</span>
                </div>
              )}
              <Link
                to="/profile"
                data-testid={TID.navProfile}
                className="hidden md:inline-flex btn-ghost rounded-full p-2"
                title={user.name}
              >
                <User size={18} weight="duotone" />
              </Link>
              <button
                onClick={() => { logout(); navigate("/"); }}
                data-testid={TID.navLogout}
                className="hidden md:inline-flex btn-ghost rounded-full p-2"
                title="Log out"
              >
                <SignOut size={18} weight="duotone" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" data-testid={TID.navLogin} className="hidden sm:inline-flex btn-ghost rounded-full px-4 py-1.5 text-sm font-semibold">
                Log in
              </Link>
              <Link to="/register" data-testid={TID.navRegister} className="btn-volt rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm">
                Sign up
              </Link>
            </>
          )}

          {/* Mobile hamburger — visible <md only */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            data-testid={TID.navMobileToggle}
            className="md:hidden w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-200 hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            {mobileOpen ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 z-40 md:hidden bg-black/85 backdrop-blur-md"
            onClick={closeMenu}
            data-testid="mobile-menu"
          >
            <motion.nav
              initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="bg-zinc-950 border-b border-white/8 px-5 pt-3 pb-6 flex flex-col gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <MobileLink to="/studio"     testid="m-nav-studio"     onClick={closeMenu}>Studio</MobileLink>
              <MobileLink to="/feed"       testid="m-nav-feed"       onClick={closeMenu}>Feed</MobileLink>
              <MobileLink to="/battle"     testid="m-nav-battle"     onClick={closeMenu}>Battle</MobileLink>
              <MobileLink to="/challenges" testid="m-nav-challenges" onClick={closeMenu}>Challenges</MobileLink>
              <MobileLink to="/pricing"    testid="m-nav-pricing"    onClick={closeMenu}>Pricing</MobileLink>
              <MobileLink to="/marketplace" testid="m-nav-marketplace" onClick={closeMenu}>Marketplace</MobileLink>
              {user?.role === "admin" && (
                <MobileLink to="/admin" testid="m-nav-admin" onClick={closeMenu} accent>
                  <span className="inline-flex items-center gap-1.5"><ShieldStar size={14} weight="fill" /> Admin</span>
                </MobileLink>
              )}

              {user ? (
                <div className="mt-3 pt-3 border-t border-white/8 grid grid-cols-2 gap-2">
                  <Link
                    to="/profile"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 rounded-full bg-white/5 border border-white/10 py-3 text-sm font-bold"
                  >
                    <User size={16} weight="duotone" /> Profile
                  </Link>
                  <button
                    onClick={() => { closeMenu(); logout(); navigate("/"); }}
                    className="flex items-center justify-center gap-2 rounded-full bg-[#ff0055]/15 border border-[#ff0055]/40 text-[#ff0055] py-3 text-sm font-bold"
                  >
                    <SignOut size={16} weight="duotone" /> Log out
                  </button>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-white/8 grid grid-cols-2 gap-2">
                  <Link to="/login" onClick={closeMenu} className="btn-ghost rounded-full py-3 text-sm font-bold text-center">Log in</Link>
                  <Link to="/register" onClick={closeMenu} className="btn-volt rounded-full py-3 text-sm text-center">Sign up free</Link>
                </div>
              )}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <TopUpModal open={topupOpen} onClose={() => setTopupOpen(false)} onPurchased={() => setTopupOpen(false)} />
    </header>
  );
}

function MobileLink({ to, children, testid, onClick, accent }) {
  return (
    <NavLink
      to={to}
      data-testid={testid}
      onClick={onClick}
      className={({ isActive }) =>
        `px-3 py-3 text-base font-bold tracking-wide rounded-lg transition-colors ${
          isActive
            ? "bg-[#ccff00]/12 text-[#ccff00]"
            : accent
              ? "text-[#ccff00]/90 hover:bg-[#ccff00]/8"
              : "text-zinc-200 hover:bg-white/5"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
