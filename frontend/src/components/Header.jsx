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
        <Link to="/" className="flex items-center gap-2" data-testid={TID.navLogo}>
          <div className="w-8 h-8 rounded-lg bg-[#ccff00] flex items-center justify-center text-black font-black text-base">
            B
          </div>
          <span className="font-display font-black tracking-tighter text-lg uppercase">
            Blox<span className="text-[#ccff00]">Craft</span>
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
