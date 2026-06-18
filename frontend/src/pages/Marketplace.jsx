import React, { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Storefront, Coins, Tag, X, CurrencyDollar, Crown, Lightning, Sparkle, ShieldCheck } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import CreationCard from "../components/CreationCard";
import TopUpModal from "../components/TopUpModal";
import BloxBucksExplainer from "../components/BloxBucksExplainer";
import { rarityOf, editionLabel } from "../lib/rarity";

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState("browse"); // browse | collection
  const [listings, setListings] = useState([]);
  const [collection, setCollection] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listingFor, setListingFor] = useState(null); // ownership item to list
  const [sort, setSort] = useState("newest");
  const [topupOpen, setTopupOpen] = useState(false);
  const [connectStatus, setConnectStatus] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [m, bb, c, cs] = await Promise.all([
        api.get(`/marketplace?sort=${sort}`),
        user ? api.get("/bloxbucks/me") : Promise.resolve({ data: { balance: 0 } }),
        user ? api.get("/me/collection") : Promise.resolve({ data: { items: [] } }),
        user ? api.get("/connect/status").catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      ]);
      setListings(m.data?.items || []);
      setBalance(bb.data?.balance || 0);
      setCollection(c.data?.items || []);
      setConnectStatus(cs.data);
    } catch (e) { toast.error(formatApiError(e)); }
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user, sort]);

  // Scroll to #bloxbucks-explainer when arriving via deep link
  useEffect(() => {
    if (window.location.hash === "#bloxbucks-explainer") {
      const t = setTimeout(() => {
        document.getElementById("bloxbucks-explainer")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
      return () => clearTimeout(t);
    }
  }, []);

  // Poll USD purchase return
  useEffect(() => {
    const sid = params.get("usd_session_id");
    const status = params.get("usd_status");
    if (status === "cancelled") {
      toast.info("USD purchase cancelled.");
      params.delete("usd_status");
      setParams(params, { replace: true });
      return;
    }
    if (!sid || !user) return;
    let n = 0;
    const poll = async () => {
      n++;
      try {
        const { data } = await api.get(`/marketplace/buy_usd/status/${sid}`);
        if (data.settled) {
          toast.success("Purchase complete! The drop is now in your collection.");
          params.delete("usd_session_id");
          setParams(params, { replace: true });
          setTab("collection");
          refresh();
          return;
        }
      } catch {}
      if (n < 8) setTimeout(poll, 1500);
    };
    poll();
    // eslint-disable-next-line
  }, [params.get("usd_session_id"), user]);

  const buy = async (listing) => {
    if (!user) return navigate("/login");
    if (balance < listing.price_bloxbucks) {
      return toast.error("Not enough BloxBucks");
    }
    if (!window.confirm(`Buy this drop for ${listing.price_bloxbucks.toLocaleString()} BB?`)) return;
    try {
      const { data } = await api.post(`/marketplace/buy/${listing.id}`, { currency: "bloxbucks" });
      toast.success(`Purchased! New balance: ${data.buyer_balance_after.toLocaleString()} BB`);
      refresh();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const buyUsd = async (listing) => {
    if (!user) return navigate("/login");
    try {
      const { data } = await api.post(`/marketplace/buy_usd/${listing.id}`, {
        origin_url: window.location.origin,
      });
      window.location.href = data.url;
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const unlist = async (listingId) => {
    if (!window.confirm("Cancel this listing?")) return;
    try {
      await api.post(`/marketplace/unlist/${listingId}`);
      toast.success("Listing cancelled");
      refresh();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* PROMO BANNER — Whale package bonus */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden border-b border-[#fbbf24]/30 bg-gradient-to-r from-[#fbbf24]/15 via-[#ff0055]/10 to-[#00f0ff]/10"
          data-testid="promo-banner"
        >
          {/* Animated shimmer */}
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          />
          <div className="relative max-w-7xl mx-auto px-5 md:px-8 py-3 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Sparkle size={20} weight="fill" className="text-[#fbbf24] animate-pulse flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-display text-sm md:text-base font-black uppercase tracking-tight leading-tight">
                  <span className="text-[#fbbf24]">+25% Bonus BloxBucks</span>{" "}
                  <span className="text-white">on the Whale pack</span>{" "}
                  <span className="text-zinc-400 hidden sm:inline">· Limited time</span>
                </p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                  10,000 BB for $79.99 · best value · ships instantly
                </p>
              </div>
            </div>
            <button
              onClick={() => setTopupOpen(true)}
              data-testid="promo-cta"
              className="bg-[#fbbf24] text-black rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest hover:shadow-[0_0_22px_rgba(251,191,36,0.7)] transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <Lightning size={12} weight="fill" /> Claim bonus
            </button>
          </div>
        </motion.div>
      )}

      {/* Hero strip */}
      <section className="relative max-w-7xl mx-auto px-5 md:px-8 pt-12 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#fbbf24] font-bold mb-2 flex items-center gap-2">
              <Storefront size={12} weight="fill" /> The BloxDrops Marketplace
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95]">
              Trade <span className="text-[#fbbf24] [text-shadow:0_0_24px_rgba(251,191,36,0.5)]">collectible</span> drops
            </h1>
            <p className="text-zinc-400 mt-3 max-w-2xl">
              Buy and sell drops with <strong className="text-[#fbbf24]">BloxBucks</strong> or real <strong className="text-[#ccff00]">USD</strong>. Every resale auto-pays <strong className="text-[#ccff00]">5% royalty</strong> to the original creator + <strong className="text-[#ff0055]">5% platform fee</strong>.
            </p>
          </div>
          {user && (
            <div className="rounded-2xl border border-[#fbbf24]/40 bg-gradient-to-br from-[#fbbf24]/15 to-transparent px-5 py-3 flex items-center gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#fbbf24]/80 font-bold">Your Balance</p>
                <p className="font-display text-3xl font-black text-[#fbbf24]" data-testid="bb-balance">
                  {balance.toLocaleString()} <span className="text-base text-[#fbbf24]/70">BB</span>
                </p>
              </div>
              <button
                onClick={() => setTopupOpen(true)}
                data-testid="marketplace-topup"
                className="self-stretch px-3 rounded-xl border border-[#fbbf24]/50 text-[#fbbf24] hover:bg-[#fbbf24] hover:text-black transition-all flex items-center gap-1.5 text-xs font-black uppercase tracking-widest"
                title="Top up BloxBucks"
              >
                <Coins size={14} weight="fill" /> Top up
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-8 flex items-center gap-2 border-b border-white/8">
          {[
            { id: "browse", label: `Browse${listings.length ? ` · ${listings.length}` : ""}`, tid: "tab-browse" },
            { id: "collection", label: `My Collection${collection.length ? ` · ${collection.length}` : ""}`, tid: "tab-collection" },
          ].map((t) => (
            <button
              key={t.id}
              data-testid={t.tid}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-black uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                tab === t.id ? "text-[#ccff00] border-[#ccff00]" : "text-zinc-500 border-transparent hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
          {tab === "browse" && (
            <div className="ml-auto flex items-center gap-2 text-xs text-zinc-400">
              <span className="uppercase tracking-widest font-bold text-[10px]">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-sm"
                data-testid="marketplace-sort"
              >
                <option value="newest">Newest</option>
                <option value="floor">Floor (lowest price)</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Main grid */}
      <main className="max-w-7xl mx-auto px-5 md:px-8 pb-20">
        {loading ? (
          <p className="text-center text-zinc-500 py-20">Loading marketplace…</p>
        ) : tab === "browse" ? (
          listings.length === 0 ? (
            <EmptyState
              icon={<Tag size={40} weight="duotone" className="text-[#fbbf24]" />}
              title="No drops listed yet"
              body="Be the first to list. Mint a drop in Studio, then list it for sale from My Collection."
              cta={{ to: "/studio", label: "Mint a drop" }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  onBuyBB={() => buy(l)}
                  onBuyUSD={() => buyUsd(l)}
                  canBuy={user && user.id !== l.seller_user_id}
                />
              ))}
            </div>
          )
        ) : (
          // collection tab
          !user ? (
            <EmptyState
              icon={<Crown size={40} weight="duotone" className="text-[#ccff00]" />}
              title="Sign in to see your collection"
              cta={{ to: "/login", label: "Log in" }}
            />
          ) : collection.length === 0 ? (
            <EmptyState
              icon={<Crown size={40} weight="duotone" className="text-[#ccff00]" />}
              title="No drops yet"
              body="Mint your first drop in Studio."
              cta={{ to: "/studio", label: "Mint a drop" }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {collection.map((o) => (
                <CollectionCard
                  key={o.ownership_id}
                  ownership={o}
                  onList={() => setListingFor(o)}
                  onUnlist={() => unlist(o.listing_id)}
                />
              ))}
            </div>
          )
        )}
      </main>

      {/* === HOW BLOXBUCKS WORK · educational section === */}
      <div id="bloxbucks-explainer" className="scroll-mt-20">
        <BloxBucksExplainer />
      </div>

      {/* Listing modal */}
      <AnimatePresence>
        {listingFor && (
          <ListForSaleModal
            ownership={listingFor}
            connectStatus={connectStatus}
            onClose={() => setListingFor(null)}
            onListed={() => { setListingFor(null); refresh(); setTab("browse"); }}
          />
        )}
      </AnimatePresence>

      {/* Top-up modal */}
      <TopUpModal open={topupOpen} onClose={() => setTopupOpen(false)} onPurchased={() => { setTopupOpen(false); refresh(); }} />
    </div>
  );
}

// ===========================================================================

function EmptyState({ icon, title, body, cta }) {
  return (
    <div className="text-center py-20">
      <div className="inline-block mb-4">{icon}</div>
      <h3 className="font-display text-2xl font-black uppercase tracking-tighter mb-2">{title}</h3>
      {body && <p className="text-zinc-400 max-w-md mx-auto mb-6">{body}</p>}
      {cta && (
        <Link to={cta.to} className="inline-block btn-volt rounded-full px-5 py-2.5 text-sm font-black uppercase tracking-widest">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function ListingCard({ listing, onBuyBB, onBuyUSD, canBuy }) {
  const drop = listing.drop;
  const bb = listing.price_bloxbucks;
  const usd = listing.price_usd_cents;
  return (
    <div className="flex flex-col gap-3" data-testid={`listing-${listing.id}`}>
      <CreationCard item={drop} compact />
      <div className="rounded-xl border border-white/8 bg-zinc-950/70 p-3 space-y-2">
        {/* Prices row */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            {bb != null && (
              <div className="flex items-center gap-1.5">
                <Coins size={13} weight="fill" className="text-[#fbbf24]" />
                <span className="font-display text-base font-black text-[#fbbf24]">
                  {bb.toLocaleString()}<span className="text-zinc-500 text-[10px] ml-1">BB</span>
                </span>
              </div>
            )}
            {usd != null && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <CurrencyDollar size={13} weight="fill" className="text-[#ccff00]" />
                <span className="font-display text-base font-black text-[#ccff00]">
                  ${(usd / 100).toFixed(2)}<span className="text-zinc-500 text-[10px] ml-1">USD</span>
                </span>
              </div>
            )}
          </div>
          {listing.seller_name && (
            <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold truncate max-w-[80px] text-right">
              by @{listing.seller_name}
            </p>
          )}
        </div>
        {/* Buy buttons */}
        <div className="flex gap-2">
          {bb != null && (
            <button
              onClick={onBuyBB}
              disabled={!canBuy}
              data-testid={`buy-bb-${listing.id}`}
              className={`flex-1 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${
                canBuy
                  ? "bg-[#fbbf24] text-black hover:shadow-[0_0_16px_rgba(251,191,36,0.55)]"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <Coins size={11} weight="fill" /> Buy · BB
            </button>
          )}
          {usd != null && (
            <button
              onClick={onBuyUSD}
              disabled={!canBuy}
              data-testid={`buy-usd-${listing.id}`}
              className={`flex-1 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${
                canBuy
                  ? "bg-[#ccff00] text-black hover:shadow-[0_0_16px_rgba(204,255,0,0.55)]"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <CurrencyDollar size={11} weight="fill" /> Buy · USD
            </button>
          )}
        </div>
        {!canBuy && (bb != null || usd != null) && (
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold text-center">Your listing</p>
        )}
      </div>
    </div>
  );
}

function CollectionCard({ ownership, onList, onUnlist }) {
  const drop = ownership.drop;
  const bb = ownership.listing_price_bb;
  const usd = ownership.listing_price_usd_cents;
  return (
    <div className="flex flex-col gap-3" data-testid={`owned-${ownership.ownership_id}`}>
      <CreationCard item={drop} compact />
      <div className="rounded-xl border border-white/8 bg-zinc-950/70 p-3">
        {ownership.is_listed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-[#ccff00] font-bold mb-0.5">Listed</p>
              {bb != null && (
                <p className="font-display text-sm font-black text-[#fbbf24]">
                  {bb.toLocaleString()} <span className="text-[10px] text-zinc-500">BB</span>
                </p>
              )}
              {usd != null && (
                <p className="font-display text-sm font-black text-[#ccff00]">
                  ${(usd / 100).toFixed(2)} <span className="text-[10px] text-zinc-500">USD</span>
                </p>
              )}
            </div>
            <button
              onClick={onUnlist}
              data-testid={`unlist-${ownership.ownership_id}`}
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-[#ff0055] hover:text-white transition-colors flex-shrink-0"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onList}
            disabled={drop.is_coming_soon}
            data-testid={`list-${ownership.ownership_id}`}
            className={`w-full rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
              drop.is_coming_soon
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-[#fbbf24] text-black hover:shadow-[0_0_18px_rgba(251,191,36,0.55)]"
            }`}
          >
            <Tag size={12} weight="fill" /> {drop.is_coming_soon ? "Locked · Coming Soon" : "List for sale"}
          </button>
        )}
      </div>
    </div>
  );
}

function ListForSaleModal({ ownership, connectStatus, onClose, onListed }) {
  const drop = ownership.drop;
  const [priceBB, setPriceBB] = useState(500);
  const [priceUSD, setPriceUSD] = useState(""); // dollars (as string, e.g. "9.99")
  const [enableBB, setEnableBB] = useState(true);
  const [enableUSD, setEnableUSD] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const connectReady = !!(connectStatus?.charges_enabled);

  const submit = async () => {
    if (!enableBB && !enableUSD) return toast.error("Pick at least one price.");
    if (enableBB && (!priceBB || priceBB < 100)) return toast.error("BB price must be ≥ 100");
    let usdCents = null;
    if (enableUSD) {
      const dollars = parseFloat(priceUSD || "0");
      if (!dollars || dollars < 1) return toast.error("USD price must be ≥ $1.00");
      usdCents = Math.round(dollars * 100);
      if (!connectReady) return toast.error("Complete Stripe Connect on your Profile first.");
    }
    setSubmitting(true);
    try {
      await api.post("/marketplace/list", {
        generation_id: drop.id,
        edition_number: ownership.edition_number,
        price_bloxbucks: enableBB ? parseInt(priceBB, 10) : null,
        price_usd_cents: usdCents,
      });
      toast.success("Listed for sale!");
      onListed();
    } catch (e) { toast.error(formatApiError(e)); }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="list-modal"
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black border border-white/10 flex items-center justify-center hover:bg-[#ff0055] hover:border-[#ff0055]">
          <X size={18} weight="bold" />
        </button>
        <p className="text-[10px] uppercase tracking-widest text-[#fbbf24] font-bold mb-2">List for sale</p>
        <h2 className="font-display text-2xl font-black uppercase tracking-tighter mb-1 leading-tight">
          {drop.original_prompt || drop.prompt}
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Edition #{ownership.edition_number} · {rarityOf(drop).label} · {editionLabel(drop)}
        </p>

        <div className="space-y-3">
          {/* BloxBucks price */}
          <div className={`rounded-xl border p-3 transition-colors ${enableBB ? "border-[#fbbf24]/50 bg-[#fbbf24]/5" : "border-white/8 bg-zinc-900/40"}`}>
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableBB}
                onChange={(e) => setEnableBB(e.target.checked)}
                data-testid="enable-bb-price"
                className="accent-[#fbbf24] w-4 h-4"
              />
              <span className="text-xs uppercase tracking-[0.2em] font-black text-[#fbbf24] flex items-center gap-1">
                <Coins size={12} weight="fill" /> Accept BloxBucks
              </span>
            </label>
            {enableBB && (
              <div className="relative">
                <input
                  type="number"
                  min={100}
                  value={priceBB}
                  onChange={(e) => setPriceBB(e.target.value)}
                  className="input-dark w-full rounded-lg pl-10 pr-3 py-2.5 text-lg font-black"
                  data-testid="list-price-bb-input"
                />
                <Coins size={16} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#fbbf24]" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest font-bold text-zinc-500">BB · min 100</span>
              </div>
            )}
          </div>

          {/* USD price */}
          <div className={`rounded-xl border p-3 transition-colors ${enableUSD ? "border-[#ccff00]/50 bg-[#ccff00]/5" : "border-white/8 bg-zinc-900/40"}`}>
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableUSD}
                onChange={(e) => setEnableUSD(e.target.checked)}
                data-testid="enable-usd-price"
                disabled={!connectReady}
                className="accent-[#ccff00] w-4 h-4 disabled:opacity-40"
              />
              <span className={`text-xs uppercase tracking-[0.2em] font-black flex items-center gap-1 ${connectReady ? "text-[#ccff00]" : "text-zinc-500"}`}>
                <CurrencyDollar size={12} weight="fill" /> Accept USD
              </span>
              {connectReady && <ShieldCheck size={12} weight="fill" className="text-[#ccff00] ml-auto" />}
            </label>
            {!connectReady ? (
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Complete <Link to="/profile" className="text-[#ccff00] underline">Stripe Connect</Link> onboarding to accept real USD with auto-payout (90% to you).
              </p>
            ) : enableUSD && (
              <>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min={1}
                    value={priceUSD}
                    onChange={(e) => setPriceUSD(e.target.value)}
                    placeholder="9.99"
                    className="input-dark w-full rounded-lg pl-10 pr-3 py-2.5 text-lg font-black"
                    data-testid="list-price-usd-input"
                  />
                  <CurrencyDollar size={16} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ccff00]" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest font-bold text-zinc-500">USD · min $1</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5">
                  You receive 90% via Stripe. 5% royalty + 5% platform fee auto-deducted.
                </p>
              </>
            )}
          </div>

          <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
            5% royalty goes to the original creator on every resale. 5% platform fee supports BloxDrops.
          </p>
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          data-testid="confirm-list"
          className="w-full mt-5 bg-[#fbbf24] text-black rounded-full py-3 font-black uppercase tracking-widest text-sm hover:shadow-[0_0_24px_rgba(251,191,36,0.6)] transition-all disabled:opacity-60"
        >
          {submitting ? "Listing…" : "Confirm listing"}
        </button>
      </motion.div>
    </motion.div>
  );
}
