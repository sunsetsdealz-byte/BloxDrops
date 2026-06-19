import React, { useEffect } from "react";
import { X, ArrowRight, CheckCircle, WarningCircle } from "@phosphor-icons/react";

// Maps a BloxDrops attachment_type → the exact Roblox "Save to Roblox" sub-category
// the user must pick. Picking "UGC Body" returns "Invalid root instance, must be a model".
const ROBLOX_CATEGORY_HINT = {
  Hat: "Hats",
  Hair: "Hair Accessories",
  Back: "Back Accessories",
  Neck: "Neck Accessories",
  Face: "Face Accessories",
  Shoulder: "Shoulder Accessories",
  Front: "Front Accessories",
  Waist: "Waist Accessories",
  Hoodie: "Sweater (Layered Clothing)",
  Shirt: "T-Shirt (Layered Clothing)",
  Jacket: "Jacket (Layered Clothing)",
  Pants: "Pants (Layered Clothing)",
  auto: "Hats",
};

const STEPS = (attachment, name) => [
  {
    title: "Open Roblox Studio",
    body: `Launch Roblox Studio and open any place (an empty Baseplate works fine — you don't need a real game).`,
  },
  {
    title: "Open Toolbox → My Models",
    body: (
      <>
        Click <strong className="text-white">View</strong> →{" "}
        <strong className="text-white">Toolbox</strong>. In the Toolbox panel, switch to the{" "}
        <strong className="text-[#ccff00]">Inventory</strong> tab and pick{" "}
        <strong className="text-[#ccff00]">My Models</strong>. Your BloxDrops upload should be there.
      </>
    ),
  },
  {
    title: "Drag the Model into Workspace",
    body: (
      <>
        Click your BloxDrops model in Toolbox — it inserts into Workspace. In Explorer you&apos;ll see
        a <strong className="text-white">Model</strong> with a{" "}
        <strong className="text-white">MeshPart</strong> inside.
        <br />
        <span className="text-[#ff0055] font-bold">
          ⛔ STOP — do NOT right-click this Model and pick &ldquo;Save to Roblox&rdquo; yet.
        </span>{" "}
        It will fail with{" "}
        <span className="font-mono text-[#ff0055]">
          &ldquo;Uploaded asset should be a Accessory but is a Model&rdquo;
        </span>
        . You must wrap it with AFT first (next step).
      </>
    ),
  },
  {
    title: "Open the Accessory Fitting Tool (MANDATORY)",
    body: (
      <>
        Go to the <strong className="text-white">Avatar</strong> tab in Studio&apos;s top ribbon →
        click <strong className="text-[#ccff00]">Accessory Fitting Tool</strong>. A floating panel
        opens. <strong className="text-white">This step converts your Model → Accessory,</strong>{" "}
        which is the only format Roblox accepts for wearable UGC.
      </>
    ),
  },
  {
    title: "Configure the fitting tool",
    body: (
      <>
        In the Accessory Fitting Tool panel:
        <br />• <strong className="text-white">Asset Type</strong>: pick{" "}
        <strong className="text-[#ccff00] font-mono">
          &ldquo;{ROBLOX_CATEGORY_HINT[attachment] || "Hats"}&rdquo;
        </strong>
        <br />• <strong className="text-white">Selection</strong>: click your MeshPart in Explorer or
        Workspace
        <br />• Click <strong className="text-white">Generate</strong> — the tool auto-wraps it as an
        Accessory with the correct attachment point.
      </>
    ),
  },
  {
    title: "Save to Roblox — pick the NEW Accessory, not the Model",
    body: (
      <>
        After AFT runs, Explorer now contains a brand-new{" "}
        <strong className="text-[#ccff00]">Accessory</strong> object (next to your original Model).
        Right-click <strong className="text-white">that Accessory</strong> →{" "}
        <strong className="text-white">Save to Roblox</strong>. In the dialog the category should
        auto-fill as{" "}
        <strong className="text-[#ccff00] font-mono">
          &ldquo;{ROBLOX_CATEGORY_HINT[attachment] || "Hats"}&rdquo;
        </strong>
        . Click <strong className="text-white">Submit</strong>.
        <br />
        <span className="text-[#ff0055] font-bold">
          Do NOT pick &ldquo;UGC Body&rdquo;
        </span>{" "}
        — that&apos;s for full-avatar bundles.
        <br />
        <span className="text-[#ff0055] font-bold">
          Do NOT right-click the original Model
        </span>{" "}
        — only the Accessory the fitting tool just generated.
      </>
    ),
  },
  {
    title: "Wait for moderation",
    body: `Roblox runs the asset through automated moderation (usually a few minutes, sometimes hours for first-time creators). You'll get an email + notification when approved.`,
  },
  {
    title: "Equip on your avatar",
    body: (
      <>
        Once approved, go to{" "}
        <a
          href="https://www.roblox.com/my/avatar"
          target="_blank"
          rel="noreferrer"
          className="text-[#ccff00] underline font-bold"
        >
          roblox.com/my/avatar
        </a>{" "}
        → <strong className="text-white">Inventory</strong> on the right → pick the right category
        tab → click <strong className="text-white">{name || "your accessory"}</strong> to equip →
        click <strong className="text-white">Save</strong>.
      </>
    ),
  },
];

export default function HowToEquipModal({ open, onClose, attachmentType = "Hat", itemName }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const steps = STEPS(attachmentType, itemName);
  const category = ROBLOX_CATEGORY_HINT[attachmentType] || "Hats";

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      data-testid="how-to-equip-modal"
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl w-full max-w-2xl border border-white/10 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-black/85 backdrop-blur-xl border-b border-white/8 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-display text-lg font-black uppercase tracking-tighter">
              How to equip on your avatar
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-0.5">
              Category for this drop · <span className="text-[#ccff00] font-bold">{category}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            data-testid="how-to-equip-close"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Top callout */}
          <div className="rounded-xl border border-[#fbbf24]/40 bg-[#fbbf24]/8 px-4 py-3 mb-3 flex items-start gap-2">
            <WarningCircle size={16} weight="fill" className="text-[#fbbf24] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-200 leading-relaxed">
              Roblox does <strong>not</strong> have an API to publish wearable Accessories directly —
              every UGC creator on the platform (us included) has to go through Studio + their
              Marketplace submit flow. These 7 steps take ~3 minutes the first time, then ~30 seconds
              per drop.
            </p>
          </div>

          {/* Red common-error troubleshooting callout */}
          <div className="rounded-xl border border-[#ff0055]/50 bg-[#ff0055]/8 px-4 py-3 mb-5">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#ff0055] mb-2 flex items-center gap-1.5">
              <WarningCircle size={12} weight="fill" /> Seeing one of these errors?
            </p>
            <ul className="text-xs text-zinc-200 leading-relaxed space-y-2">
              <li>
                <span className="font-mono text-[#ff8080]">
                  &ldquo;Uploaded asset should be a Accessory but is a Model&rdquo;
                </span>
                <br />→ You right-clicked the <strong>Model</strong> in Explorer. Run the{" "}
                <strong className="text-[#ccff00]">Accessory Fitting Tool</strong> first (steps 4–5),
                then right-click the new <strong>Accessory</strong> it generates.
              </li>
              <li>
                <span className="font-mono text-[#ff8080]">
                  &ldquo;Failed to load mesh rbxassetid://…&rdquo; / &ldquo;instances not part of approved schema&rdquo;
                </span>
                <br />→ Your Accessory&apos;s <strong>Handle</strong> contains a legacy{" "}
                <strong>Mesh</strong> or <strong>SpecialMesh</strong> child. Delete that child node;
                the Handle should only be a single <strong>MeshPart</strong>. Re-run AFT and it
                builds the clean structure for you.
              </li>
            </ul>
          </div>

          {/* Step list */}
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-3 bg-zinc-900/50 border border-white/8 rounded-xl p-3.5"
                data-testid={`how-to-equip-step-${i + 1}`}
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#ccff00] text-black flex items-center justify-center font-display font-black text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-black uppercase tracking-tight text-white flex items-center gap-1.5">
                    {s.title}
                    {i === steps.length - 1 && <CheckCircle size={14} weight="fill" className="text-[#ccff00]" />}
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed mt-1">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Quick reference card */}
          <div className="mt-5 rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#00f0ff] mb-2">
              Quick Reference
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-zinc-500">Studio category</p>
                <p className="text-[#ccff00] font-mono font-bold">{category}</p>
              </div>
              <div>
                <p className="text-zinc-500">Avatar Editor URL</p>
                <a
                  href="https://www.roblox.com/my/avatar"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#ccff00] underline font-bold inline-flex items-center gap-1"
                >
                  roblox.com/my/avatar <ArrowRight size={10} weight="bold" />
                </a>
              </div>
              <div>
                <p className="text-zinc-500">Creator Dashboard</p>
                <a
                  href="https://create.roblox.com/dashboard/creations/inventory"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#ccff00] underline font-bold inline-flex items-center gap-1"
                >
                  My Inventory <ArrowRight size={10} weight="bold" />
                </a>
              </div>
              <div>
                <p className="text-zinc-500">Moderation status</p>
                <a
                  href="https://create.roblox.com/store"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#ccff00] underline font-bold inline-flex items-center gap-1"
                >
                  Marketplace mgmt <ArrowRight size={10} weight="bold" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-black/85 backdrop-blur-xl border-t border-white/8 px-6 py-4 flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            data-testid="how-to-equip-got-it"
            className="bg-[#ccff00] text-black rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-wider hover:shadow-[0_0_20px_rgba(204,255,0,0.5)] transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
