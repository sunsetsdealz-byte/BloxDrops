import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { X, Plus, Trash, Lock, FloppyDisk, Tag } from "@phosphor-icons/react";
import { api, formatApiError } from "../lib/api";

/**
 * NFT Metadata Editor — owner-only.
 * Lets the creator set a display name, lore/description, and OpenSea-style
 * key/value traits (e.g. "Edition: 1 of 1", "Element: Fire").
 *
 * Locked once the drop has ever been listed on the marketplace.
 */
export default function NFTMetadataModal({ generation, onClose, onSaved }) {
  const locked = !!generation?.metadata_locked;
  const [displayName, setDisplayName] = useState(generation?.display_name || "");
  const [description, setDescription] = useState(generation?.description || "");
  const [traits, setTraits] = useState(
    Array.isArray(generation?.traits) && generation.traits.length
      ? generation.traits.map((t) => ({ trait_type: t.trait_type || "", value: t.value || "" }))
      : [{ trait_type: "", value: "" }]
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const addTrait = () => {
    if (traits.length >= 12) return;
    setTraits([...traits, { trait_type: "", value: "" }]);
  };
  const removeTrait = (i) => {
    setTraits(traits.filter((_, idx) => idx !== i));
  };
  const updateTrait = (i, field, val) => {
    const next = [...traits];
    next[i] = { ...next[i], [field]: val };
    setTraits(next);
  };

  const cleanedTraits = useMemo(
    () => traits.map((t) => ({
      trait_type: (t.trait_type || "").trim(),
      value: (t.value || "").trim(),
    })).filter((t) => t.trait_type && t.value),
    [traits]
  );

  const save = async () => {
    if (locked) return;
    setSaving(true);
    try {
      const { data } = await api.patch(`/generations/${generation.id}/metadata`, {
        display_name: displayName.trim() || null,
        description: description.trim() || null,
        traits: cleanedTraits,
      });
      toast.success("NFT info saved");
      onSaved?.(data);
      onClose?.();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      data-testid="nft-metadata-modal"
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/8 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={16} weight="fill" className="text-[#ccff00]" />
            <h2 className="font-display text-lg font-black uppercase tracking-tighter">NFT Info</h2>
          </div>
          <button
            onClick={onClose}
            data-testid="nft-metadata-close"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {locked && (
            <div
              className="rounded-xl border border-[#fbbf24]/40 bg-[#fbbf24]/8 px-4 py-3 text-xs text-[#fbbf24] flex items-start gap-2"
              data-testid="nft-metadata-locked"
            >
              <Lock size={14} weight="fill" className="mt-0.5 flex-shrink-0" />
              <span>
                Metadata is locked — this drop has been listed on the marketplace.
                Provenance is now permanent for buyer trust.
              </span>
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={locked}
              maxLength={80}
              placeholder="e.g. Stormbreak Horns — Genesis"
              data-testid="nft-metadata-name"
              className="input-dark w-full rounded-lg px-4 py-3 mt-1 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="text-[10px] text-zinc-500 mt-1">{displayName.length}/80</p>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Description / Lore</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={locked}
              maxLength={600}
              rows={4}
              placeholder="Forged in the eye of the tempest, one of 100 horns ever minted…"
              data-testid="nft-metadata-description"
              className="input-dark w-full rounded-lg px-4 py-3 mt-1 text-sm resize-y disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="text-[10px] text-zinc-500 mt-1">{description.length}/600</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">
                Traits ({cleanedTraits.length})
              </label>
              <button
                type="button"
                onClick={addTrait}
                disabled={locked || traits.length >= 12}
                data-testid="nft-metadata-add-trait"
                className="text-[10px] uppercase tracking-[0.2em] font-black text-[#ccff00] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Plus size={11} weight="bold" /> Add Trait
              </button>
            </div>
            <div className="space-y-2">
              {traits.map((t, i) => (
                <div key={i} className="flex gap-2 items-center" data-testid={`nft-metadata-trait-row-${i}`}>
                  <input
                    type="text"
                    value={t.trait_type}
                    onChange={(e) => updateTrait(i, "trait_type", e.target.value)}
                    disabled={locked}
                    maxLength={32}
                    placeholder="Edition"
                    data-testid={`nft-metadata-trait-key-${i}`}
                    className="input-dark flex-1 min-w-0 rounded-lg px-3 py-2 text-xs disabled:opacity-60"
                  />
                  <input
                    type="text"
                    value={t.value}
                    onChange={(e) => updateTrait(i, "value", e.target.value)}
                    disabled={locked}
                    maxLength={64}
                    placeholder="1 of 1"
                    data-testid={`nft-metadata-trait-value-${i}`}
                    className="input-dark flex-[1.4] min-w-0 rounded-lg px-3 py-2 text-xs disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => removeTrait(i)}
                    disabled={locked || traits.length <= 1}
                    data-testid={`nft-metadata-trait-remove-${i}`}
                    className="text-zinc-500 hover:text-[#ff0055] transition-colors disabled:opacity-30 disabled:cursor-not-allowed p-2"
                    title="Remove trait"
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
              Up to 12 key/value pairs. Empty rows are ignored. Example: <span className="text-zinc-400 font-mono">Edition · 1 of 1</span>, <span className="text-zinc-400 font-mono">Element · Fire</span>.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-black/80 backdrop-blur-xl border-t border-white/8 px-6 py-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            data-testid="nft-metadata-cancel"
            className="btn-ghost rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={locked || saving}
            data-testid="nft-metadata-save"
            className="rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 bg-[#ccff00] text-black hover:shadow-[0_0_18px_rgba(204,255,0,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FloppyDisk size={13} weight="fill" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
