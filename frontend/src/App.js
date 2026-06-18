import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import Header from "@/components/Header";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Studio from "@/pages/Studio";
import Feed from "@/pages/Feed";
import Battle from "@/pages/Battle";
import Challenges from "@/pages/Challenges";
import Pricing from "@/pages/Pricing";
import Profile from "@/pages/Profile";
import ScrollFeed from "@/pages/ScrollFeed";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Admin from "@/pages/Admin";

function Layout() {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-64px)]">
        <Outlet />
      </main>
      <footer className="border-t border-white/5 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="font-display font-bold tracking-tighter uppercase">
            Blox<span className="text-[#ccff00]">Drops</span> AI
          </div>
          <div>Built for Roblox creators · &copy; {new Date().getFullYear()} BloxDrops</div>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "#18181b",
            border: "1px solid rgba(204,255,0,0.3)",
            color: "#fff",
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/feed/scroll" element={<ScrollFeed />} />
            <Route path="/battle" element={<Battle />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
