import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { TID } from "../constants/testIds";
import { Coins, SignOut, User, ShieldStar } from "@phosphor-icons/react";

function NavItem({ to, children, testid }) {
  return (
    <NavLink
      to={to}
      data-testid={testid}
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
                className="btn-ghost rounded-full p-2"
                title={user.name}
              >
                <User size={18} weight="duotone" />
              </Link>
              <button
                onClick={() => { logout(); navigate("/"); }}
                data-testid={TID.navLogout}
                className="btn-ghost rounded-full p-2"
                title="Log out"
              >
                <SignOut size={18} weight="duotone" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" data-testid={TID.navLogin} className="btn-ghost rounded-full px-4 py-1.5 text-sm font-semibold">
                Log in
              </Link>
              <Link to="/register" data-testid={TID.navRegister} className="btn-volt rounded-full px-4 py-1.5 text-sm">
                Sign up free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
