"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Preset Gear ──────────────────────────────────────────────
type GearPreset = {
  name: string;
  category: string;
  amps: number;
};

const GEAR_PRESETS: GearPreset[] = [
  // Audio — Consoles
  { name: "Yamaha CL5", category: "Audio Consoles", amps: 3 },
  { name: "Yamaha CL3", category: "Audio Consoles", amps: 2.5 },
  { name: "Yamaha CL1", category: "Audio Consoles", amps: 2.5 },
  { name: "Yamaha QL5", category: "Audio Consoles", amps: 2.5 },
  { name: "Yamaha TF5", category: "Audio Consoles", amps: 1.5 },
  { name: "DiGiCo SD12", category: "Audio Consoles", amps: 4 },
  { name: "DiGiCo SD10", category: "Audio Consoles", amps: 5 },
  { name: "Allen & Heath dLive S7000", category: "Audio Consoles", amps: 4 },
  { name: "Midas M32", category: "Audio Consoles", amps: 2 },

  // Audio — Amplifiers
  { name: "QSC PLD4.5", category: "Amplifiers", amps: 8 },
  { name: "QSC PLD4.3", category: "Amplifiers", amps: 7 },
  { name: "Crown I-Tech 12000HD", category: "Amplifiers", amps: 10 },
  { name: "Crown I-Tech 4x3500HD", category: "Amplifiers", amps: 9 },
  { name: "Lab Gruppen PLM 20K44", category: "Amplifiers", amps: 11 },
  { name: "Powersoft X4", category: "Amplifiers", amps: 8 },

  // Audio — Wireless
  { name: "Shure Axient Digital (receiver)", category: "Wireless", amps: 0.5 },
  { name: "Shure ULXD4Q (quad receiver)", category: "Wireless", amps: 0.4 },
  { name: "Shure PSM1000 (transmitter)", category: "Wireless", amps: 0.5 },
  { name: "Sennheiser EW-DX EM 4 (receiver)", category: "Wireless", amps: 0.5 },
  { name: "Sennheiser EM 6000 (receiver)", category: "Wireless", amps: 0.6 },
  { name: "Wisycom MCR54 (receiver)", category: "Wireless", amps: 0.3 },

  // Video — Switchers & Processing
  { name: "Barco E2", category: "Video Processing", amps: 4 },
  { name: "Barco S3-4K", category: "Video Processing", amps: 3 },
  { name: "Analog Way Aquilon RS4", category: "Video Processing", amps: 5 },
  { name: "Ross Carbonite Ultra", category: "Video Processing", amps: 3.5 },
  { name: "BMD ATEM 4 M/E", category: "Video Processing", amps: 2 },

  // Video — Projectors
  { name: "Projector — 10K lumen", category: "Projectors", amps: 8 },
  { name: "Projector — 20K lumen", category: "Projectors", amps: 12 },
  { name: "Projector — 30K+ lumen", category: "Projectors", amps: 15 },

  // Video — LED
  { name: "LED Wall Panel (per panel)", category: "LED Walls", amps: 1.5 },
  { name: "LED Processor (Novastar / Brompton)", category: "LED Walls", amps: 1.5 },

  // Video — Displays
  { name: "Monitor / Display (55\"–75\")", category: "Displays", amps: 1.5 },
  { name: "Monitor / Display (80\"–98\")", category: "Displays", amps: 3 },
  { name: "Confidence Monitor (17\"–24\")", category: "Displays", amps: 0.5 },

  // Lighting
  { name: "Moving Head — Spot (Robe, Martin)", category: "Lighting", amps: 7 },
  { name: "Moving Head — Wash (Robe, Martin)", category: "Lighting", amps: 5.5 },
  { name: "LED Par (per fixture)", category: "Lighting", amps: 1.5 },
  { name: "ETC Source Four LED", category: "Lighting", amps: 2 },
  { name: "Follow Spot (1200W)", category: "Lighting", amps: 10 },
  { name: "Haze Machine (MDG, Ultratec)", category: "Lighting", amps: 5 },

  // IT / Networking
  { name: "Network Switch (Cisco, Luminex)", category: "IT / Networking", amps: 1.5 },
  { name: "Media Server (Disguise, Watchout)", category: "IT / Networking", amps: 6 },
  { name: "Recording Laptop / Desktop", category: "IT / Networking", amps: 1.5 },

  // General
  { name: "Stage Box / I/O Rack", category: "General", amps: 1 },
  { name: "Intercom Base Station (Clear-Com)", category: "General", amps: 1.5 },
  { name: "UPS / Power Conditioner", category: "General", amps: 1 },
];


// ─── Types ────────────────────────────────────────────────────
type GearItem = {
  id: number;
  name: string;
  amps: number;
  qty: number;
};

const CIRCUIT_AMPS = 20;
const SAFE_LOAD = 0.8;
const VOLTAGE = 120;

let nextId = 1;

// ─── GearRow Component ───────────────────────────────────────
function GearRow({
  item,
  onFill,
  onUpdateQty,
  onRemove,
}: {
  item: GearItem;
  onFill: (id: number, name: string, amps: number) => void;
  onUpdateQty: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}) {
  const isEmpty = item.name === "";
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [customAmps, setCustomAmps] = useState("");
  const [communityResults, setCommunityResults] = useState<GearPreset[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const rowRef = useRef<HTMLTableRowElement>(null);

  // Filter presets client-side
  const searchLower = search.toLowerCase();
  const presetResults = search.length >= 1
    ? GEAR_PRESETS.filter(
        (g) =>
          g.name.toLowerCase().includes(searchLower) ||
          g.category.toLowerCase().includes(searchLower)
      )
    : [];

  // Debounced community API search
  const searchCommunity = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setCommunityResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/gear?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setCommunityResults(Array.isArray(data) ? data : []);
        }
      } catch { /* silently skip if API not ready */ }
    }, 250);
  }, []);

  useEffect(() => {
    searchCommunity(search);
  }, [search, searchCommunity]);

  // Merge preset + community, dedup by name
  const presetNames = new Set(presetResults.map((g) => g.name.toLowerCase()));
  const dedupedCommunity = communityResults.filter(
    (g) => !presetNames.has(g.name.toLowerCase())
  );
  const allResults = [...presetResults, ...dedupedCommunity].slice(0, 12);
  const hasExactMatch = allResults.some((g) => g.name.toLowerCase() === searchLower);

  const selectResult = (g: GearPreset) => {
    onFill(item.id, g.name, g.amps);
    setSearch("");
    setCommunityResults([]);
  };

  const addCustom = () => {
    const amps = parseFloat(customAmps);
    if (!search.trim() || isNaN(amps) || amps <= 0) return;
    const name = search.trim();
    onFill(item.id, name, amps);
    // Save to community database (fire and forget)
    fetch("/api/gear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amps, category: "Community" }),
    }).catch(() => {});
    setSearch("");
    setCustomAmps("");
    setCommunityResults([]);
  };

  if (isEmpty) {
    return (
      <tr
        ref={rowRef}
        className="border-b border-ink/[0.03]"
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(e) => {
          if (!rowRef.current?.contains(e.relatedTarget as Node)) {
            setFocused(false);
          }
        }}
      >
        <td className="py-2 px-4 relative" colSpan={3}>
          <input
            type="text"
            placeholder="Search gear..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-blackout/60 border border-white/10 rounded px-3 py-2 text-sm font-mono text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/40"
          />
          {focused && search.length >= 1 && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-deep-stage border border-white/10 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
              {allResults.map((g) => (
                <button
                  key={g.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectResult(g)}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-3 border-b border-ink/[0.03] last:border-0"
                >
                  <div>
                    <span className="text-sm text-house-lights">{g.name}</span>
                    <span className="text-[10px] text-aluminum/50 font-mono ml-2">{g.category}</span>
                  </div>
                  <span className="text-xs font-mono text-signal-orange flex-shrink-0">{g.amps}A</span>
                </button>
              ))}
              {allResults.length === 0 && (
                <div className="px-4 py-3 text-sm text-aluminum/50">
                  No matches found
                </div>
              )}
              {search.trim().length >= 2 && !hasExactMatch && (
                <div className="px-4 py-3 border-t border-white/10">
                  <div className="text-[10px] font-mono text-aluminum/60 tracking-wider uppercase mb-2">
                    Add &ldquo;{search.trim()}&rdquo; as custom
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        placeholder="Amps"
                        value={customAmps}
                        onChange={(e) => setCustomAmps(e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
                        className="w-24 bg-blackout/60 border border-white/10 rounded px-3 py-1.5 text-sm font-mono text-house-lights text-right placeholder:text-aluminum/35 focus:outline-none focus:border-signal-orange/40"
                      />
                      <span className="text-xs text-aluminum/60 font-mono">A</span>
                    </div>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={addCustom}
                      disabled={!customAmps || parseFloat(customAmps) <= 0}
                      className="px-4 py-1.5 bg-signal-orange text-white text-xs font-heading font-bold tracking-wider uppercase rounded hover:bg-orange-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </td>
        <td className="py-2 px-4 text-right font-mono text-xs text-aluminum/35">&mdash;</td>
        <td className="py-2 pr-3">
          <button
            onClick={() => onRemove(item.id)}
            className="text-aluminum/35 hover:text-red-400 transition-colors text-xs"
          >
            &times;
          </button>
        </td>
      </tr>
    );
  }

  // Filled row
  return (
    <tr className="border-b border-ink/[0.03]">
      <td className="py-2.5 px-4 text-house-lights text-xs">{item.name}</td>
      <td className="py-2.5 px-3 text-center font-mono text-xs text-aluminum/65">{item.amps}A</td>
      <td className="py-2.5 px-3">
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => onUpdateQty(item.id, item.qty - 1)}
            className="w-6 h-6 rounded bg-blackout/60 border border-white/10 text-aluminum/65 hover:text-house-lights hover:border-white/20 text-xs flex items-center justify-center transition-colors"
          >
            -
          </button>
          <span className="font-mono text-xs text-house-lights w-6 text-center">
            {item.qty}
          </span>
          <button
            onClick={() => onUpdateQty(item.id, item.qty + 1)}
            className="w-6 h-6 rounded bg-blackout/60 border border-white/10 text-aluminum/65 hover:text-house-lights hover:border-white/20 text-xs flex items-center justify-center transition-colors"
          >
            +
          </button>
        </div>
      </td>
      <td className="py-2.5 px-4 text-right font-mono text-xs text-signal-orange font-bold">
        {(item.amps * item.qty).toFixed(1)}A
      </td>
      <td className="py-2.5 pr-3">
        <button
          onClick={() => onRemove(item.id)}
          className="text-aluminum/35 hover:text-red-400 transition-colors text-xs"
        >
          &times;
        </button>
      </td>
    </tr>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function PowerCalculator() {
  const [items, setItems] = useState<GearItem[]>([
    { id: nextId++, name: "", amps: 0, qty: 1 },
  ]);

  const filledItems = items.filter((i) => i.name !== "");

  const fillRow = (id: number, name: string, amps: number) => {
    // Check if this gear already exists in filled rows
    const existing = filledItems.find((i) => i.name === name);
    if (existing) {
      // Bump qty on existing, remove the empty row
      setItems(
        items
          .map((i) => (i.id === existing.id ? { ...i, qty: i.qty + 1 } : i))
          .filter((i) => i.id !== id)
      );
    } else {
      setItems(items.map((i) => (i.id === id ? { ...i, name, amps } : i)));
    }
  };

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) {
      setItems(items.filter((i) => i.id !== id));
    } else {
      setItems(items.map((i) => (i.id === id ? { ...i, qty } : i)));
    }
  };

  const removeItem = (id: number) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const addEmptyRow = () => {
    setItems([...items, { id: nextId++, name: "", amps: 0, qty: 1 }]);
  };

  const exportPDF = () => {
    if (filledItems.length === 0) return;
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("POWER CALCULATOR", 14, 22);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(`Generated ${dateStr}  •  truss.tech`, 14, 29);
    doc.setTextColor(0);

    // Gear table
    autoTable(doc, {
      startY: 36,
      head: [["Item", "Amps", "Qty", "Total"]],
      body: filledItems.map((i) => [
        i.name,
        `${i.amps}A`,
        String(i.qty),
        `${(i.amps * i.qty).toFixed(1)}A`,
      ]),
      foot: [["", "", "TOTAL", `${totalAmps.toFixed(1)}A`]],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [255, 77, 0], textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [40, 40, 40], textColor: [255, 77, 0], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "center", cellWidth: 24 },
        2: { halign: "center", cellWidth: 20 },
        3: { halign: "right", cellWidth: 28 },
      },
    });

    // Summary below the table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY ?? 120;
    const summaryY = finalY + 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, summaryY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = [
      `Total Draw: ${totalAmps.toFixed(1)}A  (${totalWatts.toLocaleString()}W @ 120V)`,
      `Circuits Needed: ${circuitsNeeded}  (120V / 20A @ 80% rule)`,
      `Load per Circuit: ${loadPerCircuit > 0 ? Math.round(loadPerCircuit) + "%" : "—"}`,
      `Gear Items: ${filledItems.reduce((s, i) => s + i.qty, 0)}  (${filledItems.length} line items)`,
    ];
    lines.forEach((line, idx) => {
      doc.text(line, 14, summaryY + 7 + idx * 6);
    });

    doc.save(`power-calc-${now.toISOString().slice(0, 10)}.pdf`);
  };

  // ─── Calculations (filled rows only) ───────────────────────
  const totalAmps = filledItems.reduce((sum, i) => sum + i.amps * i.qty, 0);
  const totalWatts = totalAmps * VOLTAGE;
  const safeAmpsPerCircuit = CIRCUIT_AMPS * SAFE_LOAD;
  const circuitsNeeded = totalAmps > 0 ? Math.ceil(totalAmps / safeAmpsPerCircuit) : 0;
  const loadPerCircuit = circuitsNeeded > 0 ? (totalAmps / circuitsNeeded / CIRCUIT_AMPS) * 100 : 0;
  const overloaded = circuitsNeeded > 0 && loadPerCircuit > 80;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="font-mono text-[10px] text-signal-orange/50 tracking-[4px] uppercase">
          Tools
        </span>
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mt-2">
          POWER <span className="text-signal-orange">CALCULATOR</span>
        </h1>
        <p className="text-sm text-aluminum/65 mt-3 max-w-2xl mx-auto">
          Build your gear list and calculate total power draw. See how many
          120V/20A circuits you need and whether you&apos;re within safe load limits.
        </p>
      </div>

      {/* ===== GEAR LIST ===== */}
      <section className="mb-8">
        <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
          Gear List
        </h2>
        <div className="rounded-xl bg-deep-stage/40 border border-ink/[0.05] overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2.5 px-4 font-mono text-[10px] text-aluminum/60 tracking-wider">ITEM</th>
                <th className="text-center py-2.5 px-3 font-mono text-[10px] text-aluminum/60 tracking-wider w-20">AMPS</th>
                <th className="text-center py-2.5 px-3 font-mono text-[10px] text-aluminum/60 tracking-wider w-28">QTY</th>
                <th className="text-right py-2.5 px-4 font-mono text-[10px] text-aluminum/60 tracking-wider w-20">TOTAL</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <GearRow
                  key={item.id}
                  item={item}
                  onFill={fillRow}
                  onUpdateQty={updateQty}
                  onRemove={removeItem}
                />
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-ink/[0.05] flex items-center justify-between">
            <button
              onClick={addEmptyRow}
              className="text-xs font-mono text-aluminum/60 hover:text-signal-orange transition-colors tracking-wider"
            >
              + Add Item
            </button>
            {filledItems.length > 0 && (
              <button
                onClick={exportPDF}
                className="text-xs font-mono text-aluminum/60 hover:text-signal-orange transition-colors tracking-wider"
              >
                Export PDF
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ===== RESULTS ===== */}
      <section className="mb-12">
        <div className={`p-6 rounded-xl bg-deep-stage border ${overloaded ? "border-red-500/30" : filledItems.length > 0 ? "border-signal-orange/20" : "border-ink/[0.05]"}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-[9px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">
                Total Draw
              </div>
              <div className="font-heading text-2xl font-bold text-signal-orange">
                {totalAmps.toFixed(1)}A
              </div>
              <div className="text-[10px] text-aluminum/50 font-mono">
                {totalWatts.toLocaleString()}W @ 120V
              </div>
            </div>
            <div className="text-center">
              <div className="text-[9px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">
                Circuits Needed
              </div>
              <div className="font-heading text-2xl font-bold text-house-lights">
                {circuitsNeeded}
              </div>
              <div className="text-[10px] text-aluminum/50 font-mono">
                120V / 20A @ 80%
              </div>
            </div>
            <div className="text-center">
              <div className="text-[9px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">
                Load / Circuit
              </div>
              <div className={`font-heading text-2xl font-bold ${loadPerCircuit > 80 ? "text-red-400" : loadPerCircuit > 60 ? "text-standby-amber" : "text-go-green"}`}>
                {loadPerCircuit > 0 ? `${Math.round(loadPerCircuit)}%` : "—"}
              </div>
              <div className="text-[10px] text-aluminum/50 font-mono">
                {loadPerCircuit > 80 ? "Over 80% — add circuits" : loadPerCircuit > 60 ? "Moderate" : filledItems.length > 0 ? "Within safe range" : "No gear added"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[9px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">
                Gear Items
              </div>
              <div className="font-heading text-2xl font-bold text-house-lights">
                {filledItems.reduce((sum, i) => sum + i.qty, 0)}
              </div>
              <div className="text-[10px] text-aluminum/50 font-mono">
                {filledItems.length} line items
              </div>
            </div>
          </div>

          {overloaded && (
            <div className="p-3 rounded-lg bg-red-500/[0.06] border border-red-500/15 text-center">
              <span className="text-[11px] text-red-400 font-mono">
                Circuits are above 80% safe load. Add more circuits or reduce gear per circuit.
              </span>
            </div>
          )}

          {filledItems.length === 0 && (
            <div className="text-center py-4">
              <span className="text-sm text-aluminum/50">
                Add gear above to calculate power requirements.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ===== THE 80% RULE ===== */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          The 80% Rule
        </h2>
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05]">
            <h3 className="font-heading text-sm font-bold tracking-wider uppercase text-signal-orange mb-3">
              Why We Derate to 80%
            </h3>
            <p className="text-[12px] text-aluminum/65 leading-[1.8] mb-3">
              The National Electrical Code (NEC) requires that continuous loads —
              loads expected to run for 3 hours or more — do not exceed 80% of
              the circuit breaker&apos;s rated capacity. AV gear on a show floor
              qualifies as a continuous load.
            </p>
            <p className="text-[12px] text-aluminum/65 leading-[1.8]">
              A standard 120V/20A circuit is rated for 20 amps, but the safe
              continuous limit is <strong className="text-house-lights">16 amps</strong>.
              Exceeding this causes heat buildup in the wiring and breaker,
              leading to nuisance trips during your show — usually at the worst
              possible moment.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-deep-stage/40 border border-ink/[0.05] text-center">
              <div className="font-heading text-2xl font-bold text-go-green mb-1">16A</div>
              <div className="text-[10px] font-mono text-aluminum/60">Safe continuous load</div>
              <div className="text-[10px] text-aluminum/40">80% of 20A circuit</div>
            </div>
            <div className="p-4 rounded-xl bg-deep-stage/40 border border-ink/[0.05] text-center">
              <div className="font-heading text-2xl font-bold text-standby-amber mb-1">1,920W</div>
              <div className="text-[10px] font-mono text-aluminum/60">Max watts per circuit</div>
              <div className="text-[10px] text-aluminum/40">16A × 120V</div>
            </div>
            <div className="p-4 rounded-xl bg-deep-stage/40 border border-ink/[0.05] text-center">
              <div className="font-heading text-2xl font-bold text-red-400 mb-1">20A</div>
              <div className="text-[10px] font-mono text-aluminum/60">Breaker trips here</div>
              <div className="text-[10px] text-aluminum/40">Don&apos;t find out live</div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-deep-stage/40 border border-standby-amber/10">
            <h3 className="font-heading text-sm font-bold tracking-wider uppercase text-standby-amber mb-3">
              Real-World Notes
            </h3>
            <ul className="space-y-2 text-[12px] text-aluminum/65 leading-[1.8]">
              <li className="flex items-start gap-2">
                <span className="text-standby-amber mt-0.5 flex-shrink-0">▸</span>
                <span>Inrush current on power-up can spike 2–5x the rated draw. Power on gear in stages, not all at once.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-standby-amber mt-0.5 flex-shrink-0">▸</span>
                <span>Amplifiers draw rated current only at full output. Typical corporate speech reinforcement uses 30–50% of rated power. Music playback uses more.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-standby-amber mt-0.5 flex-shrink-0">▸</span>
                <span>LED walls and moving lights vary significantly with content brightness. A full white screen or full intensity wash draws maximum rated power.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-standby-amber mt-0.5 flex-shrink-0">▸</span>
                <span>Always confirm available power with the venue before the show. Many hotel ballrooms have limited circuit counts in the floor boxes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-standby-amber mt-0.5 flex-shrink-0">▸</span>
                <span>For large shows, you&apos;ll need 208V/3-phase distro from a tie-in or generator. This calculator covers 120V/20A single-phase only.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="text-center py-12 border-t border-ink/[0.03]">
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
          Power Planning Is a <span className="text-signal-orange">Skill</span>
        </h2>
        <p className="text-sm text-aluminum/60 mb-6 max-w-md mx-auto">
          List your technical production skills on Truss. Producers need techs
          who can plan power, run distro, and keep the show running.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-signal-orange text-white font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
          >
            Create Your Profile — Free
          </Link>
          <Link
            href="/resources"
            className="inline-block px-8 py-4 bg-transparent text-aluminum font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl border border-white/10 hover:border-signal-orange/30 hover:bg-signal-orange/[0.03] transition-all"
          >
            More Tools
          </Link>
        </div>
      </section>

      <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-[11px] text-aluminum/40 leading-relaxed">
          This calculator provides estimates for planning purposes only. Actual power requirements depend on equipment specifications, venue infrastructure, and environmental conditions. Always consult a qualified electrician for load calculations and power distribution on live events.
        </p>
      </footer>
    </main>
  );
}
