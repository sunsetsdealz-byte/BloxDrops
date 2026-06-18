import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Storefront, Coins, Tag, X, CurrencyDollar, Crown } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import CreationCard from "../components/CreationCard";
import { rarityOf, editionLabel } from "../lib/rarity";

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("browse"); // browse | collection
  const [listings, setListings] = useState([]);
  const [collection, setCollection] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listingFor, setListingFor] = useState(null); // ownership item to list
  const [sort, setSort] = useState("newest");

  const refresh = async () => {
    setLoading(true);
    try {
      const [m, bb, c] = await Promise.all([
        api.get(`/marketplace?sort=${sort}`),
        user ? api.get("/bloxbucks/me") : Promise.resolve({ data: { balance: 0 } }),
        user ? api.get("/me/collection") : Promise.resolve({ data: { items: [] } }),
      ]);
      setListings(m.data?.items || []);
      setBalance(bb.data?.balance || 0);
      setCollection(c.data?.items || []);
    } catch (e) { toast.error(formatApiError(e)); }
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user, sort]);

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
              Buy and sell drops with <strong className="text-[#fbbf24]">BloxBucks</strong>. Every resale auto-pays <strong className="text-[#ccff00]">5% royalty</strong> to the original creator. USD checkout coming Phase 2.4.
            </p>
          </div>
          {user && (
            <div className="rounded-2xl border border-[#fbbf24]/40 bg-gradient-to-br from-[#fbbf24]/15 to-transparent px-5 py-3">
              <p className="text-[10px] uppercase tracking-widest text-[#fbbf24]/80 font-bold">Your Balance</p>
              <p className="font-display text-3xl font-black text-[#fbbf24]" data-testid="bb-balance">
                {balance.toLocaleString()} <span className="text-base text-[#fbbf24]/70">BB</span>
              </p>
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
                <ListingCard key={l.id} listing={l} onBuy={() => buy(l)} canBuy={user && user.id !== l.seller_user_id} />
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

      {/* Listing modal */}
      <AnimatePresence>
        {listingFor && (
          <ListForSaleModal
            ownership={listingFor}
            onClose={() => setListingFor(null)}
            onListed={() => { setListingFor(null); refresh(); setTab("browse"); }}
          />
        )}
      </AnimatePresence>
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

function ListingCard({ listing, onBuy, canBuy }) {
  const drop = listing.drop;
  return (
    <div className="flex flex-col gap-3" data-testid={`listing-${listing.id}`}>
      <CreationCard item={drop} compact />
      <div className="rounded-xl border border-white/8 bg-zinc-950/70 p-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Price</p>
          <p className="font-display text-lg font-black text-[#fbbf24]">
            {listing.price_bloxbucks.toLocaleString()} <span className="text-zinc-500 text-xs">BB</span>
          </p>
        </div>
        <button
          onClick={onBuy}
          disabled={!canBuy}
          data-testid={`buy-${listing.id}`}
          className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
            canBuy
              ? "bg-[#ccff00] text-black hover:shadow-[0_0_18px_rgba(204,255,0,0.55)]"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
        >
          {canBuy ? "Buy" : "Yours"}
        </button>
      </div>
    </div>
  );
}

function CollectionCard({ ownership, onList, onUnlist }) {
  const drop = ownership.drop;
  return (
    <div className="flex flex-col gap-3" data-testid={`owned-${ownership.ownership_id}`}>
      <CreationCard item={drop} compact />
      <div className="rounded-xl border border-white/8 bg-zinc-950/70 p-3">
        {ownership.is_listed ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#ccff00] font-bold">Listed</p>
              <p className="font-display text-base font-black text-[#fbbf24]">
                {ownership.listing_price_bb?.toLocaleString()} BB
              </p>
            </div>
            <button
              onClick={onUnlist}
              data-testid={`unlist-${ownership.ownership_id}`}
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-[#ff0055] hover:text-white transition-colors"
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

function ListForSaleModal({ ownership, onClose, onListed }) {
  const drop = ownership.drop;
  const [price, setPrice] = useState(500);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (price < 100) return toast.error("Minimum listing is 100 BB");
    setSubmitting(true);
    try {
      await api.post("/marketplace/list", {
        generation_id: drop.id,
        edition_number: ownership.edition_number,
        price_bloxbucks: parseInt(price, 10),
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
        className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6"
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
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Price (BloxBucks)</span>
            <div className="relative mt-1">
              <input
                type="number"
                min={100}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-dark w-full rounded-lg pl-10 pr-3 py-3 text-lg font-black"
                data-testid="list-price-input"
              />
              <Coins size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#fbbf24]" />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Min 100 BB. Sale gives original creator 5% royalty automatically.</p>
          </label>
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          data-testid="confirm-list"
          className="w-full mt-5 bg-[#fbbf24] text-black rounded-full py-3 font-black uppercase tracking-widest text-sm hover:shadow-[0_0_24px_rgba(251,191,36,0.6)] transition-all disabled:opacity-60"
        >
          {submitting ? "Listing…" : `List for ${parseInt(price || 0, 10).toLocaleString()} BB`}
        </button>
      </motion.div>
    </motion.div>
  );
}
