import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkle, Lightning, Trophy, ChatCircle, Cube, FireSimple } from "@phosphor-icons/react";
import { api } from "../lib/api";
import { TID } from "../constants/testIds";
import ModelViewer from "../components/ModelViewer";

const SAMPLE_HERO_GLB = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

export default function Landing() {
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    api.get("/feed?sort=popular&limit=12").then((r) => setFeed(r.data.items || [])).catch(() => {});
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* HERO */}
      <section className="relative grain max-w-7xl mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-16">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-[#ccff00]/30 text-xs uppercase tracking-[0.2em] font-bold">
              <Sparkle size={14} weight="fill" className="text-[#ccff00]" />
              The next-gen Roblox UGC creator
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black uppercase leading-[0.95] tracking-tighter">
              From prompt<br/>
              to marketplace<br/>
              <span className="text-[#ccff00]">in 60 seconds.</span>
            </h1>
            <p className="text-zinc-300 text-lg max-w-xl leading-relaxed">
              Generate Roblox-ready 3D hats, hair, hoodies & weapons with AI. Battle other creators,
              join daily themes, and ship items to the marketplace — no Blender, no learning curve.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                data-testid={TID.heroCtaPrimary}
                className="btn-volt rounded-full px-7 py-3.5 text-base inline-flex items-center gap-2"
              >
                Start creating free <ArrowRight size={18} weight="bold" />
              </Link>
              <Link
                to="/feed"
                data-testid={TID.heroCtaSecondary}
                className="btn-ghost rounded-full px-7 py-3.5 text-base font-semibold inline-flex items-center gap-2"
              >
                <Cube size={18} weight="duotone" /> Explore the gallery
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
              <div>20 free credits</div>
              <div>·</div>
              <div>No card required</div>
              <div>·</div>
              <div>Commercial rights</div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-4 bg-[#ccff00]/10 blur-3xl rounded-full" />
            <div className="relative">
              <ModelViewer url={SAMPLE_HERO_GLB} height={460} showHint />
              <div className="absolute -bottom-4 -right-4 hidden md:flex items-center gap-2 glass rounded-full px-4 py-2 text-xs font-bold">
                <FireSimple size={14} weight="fill" className="text-[#ff0055]" />
                127 creations in the last hour
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-white/5 py-6 overflow-hidden bg-black/40">
        <div className="marquee gap-12 text-zinc-500 font-display text-2xl font-black uppercase tracking-tighter whitespace-nowrap">
          {Array.from({ length: 2 }).flatMap((_, i) =>
            ["Text → 3D", "Image → 3D", "Battle Mode", "Daily Challenges", "AI Prompt Boost", "Remix Anything", "Marketplace Ready"]
              .map((w, j) => (
                <span key={`${i}-${j}`} className="flex items-center gap-12">
                  {w} <span className="text-[#ccff00]">✦</span>
                </span>
              ))
          )}
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#ccff00] font-bold mb-3">What's inside</p>
            <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter">
              Built for creators<br/>who actually ship.
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-6 gap-4 md:gap-6">
          <FeatureCard span="md:col-span-3" icon={<Cube size={28} weight="duotone" />} title="Text & Image → 3D"
            body="Drop a prompt or a reference image. Fal.ai's Tripo turns it into a marketplace-ready GLB in under 2 minutes." />
          <FeatureCard span="md:col-span-3" icon={<ChatCircle size={28} weight="duotone" />} title="AI Prompt Booster"
            body="Stuck at 'cool hat'? Our Claude-powered prompt engine upgrades it into a vivid 60-word spec." />
          <FeatureCard span="md:col-span-2" icon={<Trophy size={28} weight="duotone" />} title="1v1 Battles"
            body="Vote your way through pairs. Win battles, climb the global leaderboard." accent="magenta" />
          <FeatureCard span="md:col-span-2" icon={<Lightning size={28} weight="duotone" />} title="Daily Themes"
            body="Cyberpunk Monday, Anime Tuesday, Gothic Wednesday — fresh prompts every day." accent="cyan" />
          <FeatureCard span="md:col-span-2" icon={<FireSimple size={28} weight="duotone" />} title="Remix Mode"
            body="See a creation you love? Hit remix, tweak the prompt, ship your own twist in seconds." />
        </div>
      </section>

      {/* GALLERY STRIP */}
      {feed.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 md:px-8 pb-20">
          <div className="flex items-end justify-between mb-6">
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tighter">
              Fresh from the studio
            </h3>
            <Link to="/feed" className="text-sm font-bold text-[#ccff00] flex items-center gap-1">
              See all <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {feed.slice(0, 6).map((g) => (
              <div key={g.id} className="aspect-[4/5] rounded-xl bg-zinc-900 border border-white/8 overflow-hidden group">
                {g.thumbnail_url && (
                  <img src={g.thumbnail_url} alt={g.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-5 md:px-8 pb-24">
        <div className="relative rounded-3xl overflow-hidden border border-[#ccff00]/30 p-10 md:p-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ccff00]/10 via-transparent to-[#ff0055]/10" />
          <div className="relative">
            <h3 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">
              Your next bestseller<br/>is one prompt away.
            </h3>
            <p className="text-zinc-300 mb-7 max-w-xl mx-auto">
              Join thousands of creators turning ideas into Robux. Start with 20 free credits — no card required.
            </p>
            <Link to="/register" className="btn-volt rounded-full px-8 py-4 text-base inline-flex items-center gap-2">
              Create your first item <ArrowRight size={18} weight="bold" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, body, span = "", accent = "volt" }) {
  const accentClass = {
    volt: "text-[#ccff00]",
    magenta: "text-[#ff0055]",
    cyan: "text-[#00f0ff]",
  }[accent];
  return (
    <div className={`relative ${span} bg-zinc-900/60 border border-white/8 rounded-2xl p-6 md:p-8 hover:border-white/20 transition-colors`}>
      <div className={`${accentClass} mb-4`}>{icon}</div>
      <h4 className="font-display font-bold text-xl mb-2 tracking-tight">{title}</h4>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}
