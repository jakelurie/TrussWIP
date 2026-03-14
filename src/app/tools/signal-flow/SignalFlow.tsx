"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────

type Dept = "audio" | "video" | "lighting";
type Category = "source" | "transport" | "processing" | "output";

interface BlockDef {
  id: string;
  label: string;
  abbr: string;
  dept: Dept;
  category: Category;
  inputs: number;
  outputs: number;
  signalType: string;
  description: string;
}

interface CanvasBlock {
  instanceId: string;
  defId: string;
  x: number;
  y: number;
}

interface Connection {
  id: string;
  fromInstanceId: string;
  fromPort: number;
  toInstanceId: string;
  toPort: number;
}

interface ValidationResult {
  status: "ok" | "error" | "empty" | "incomplete";
  message: string;
  errorBlockIds: string[];
}

interface PendingPort {
  instanceId: string;
  port: number;
}

// ─── Block Catalog ───────────────────────────────────────────

const BLOCKS: BlockDef[] = [
  // Audio (9)
  { id: "mic",       label: "Microphone",       abbr: "MIC",  dept: "audio", category: "source",     inputs: 0, outputs: 1, signalType: "Analog",       description: "Dynamic or condenser microphone — the start of most audio chains." },
  { id: "stagebox",  label: "Stage Box",         abbr: "STG",  dept: "audio", category: "transport",  inputs: 1, outputs: 1, signalType: "AES / Dante",  description: "Converts analog mic signals to digital for transport to FOH." },
  { id: "snake",     label: "Digital Snake",     abbr: "SNK",  dept: "audio", category: "transport",  inputs: 1, outputs: 1, signalType: "Dante/AES50",  description: "Carries multiple channels of digital audio over a single cable run." },
  { id: "console",   label: "Console",           abbr: "CON",  dept: "audio", category: "processing", inputs: 1, outputs: 2, signalType: "Digital",      description: "Mixing console — routes, EQs, and mixes all audio signals." },
  { id: "dsp",       label: "DSP / Processing",  abbr: "DSP",  dept: "audio", category: "processing", inputs: 1, outputs: 1, signalType: "Digital",      description: "System processor — crossover, delay, limiting before amplification." },
  { id: "amp",       label: "Amplifier",         abbr: "AMP",  dept: "audio", category: "processing", inputs: 1, outputs: 1, signalType: "Amplified",    description: "Power amplifier — drives speaker-level signal to loudspeakers." },
  { id: "speaker",   label: "Speaker",           abbr: "SPK",  dept: "audio", category: "output",     inputs: 1, outputs: 0, signalType: "Sound",        description: "Loudspeaker — converts electrical signal to sound pressure." },
  { id: "iem-tx",    label: "IEM Transmitter",   abbr: "TX",   dept: "audio", category: "processing", inputs: 1, outputs: 1, signalType: "RF",           description: "Transmits a monitor mix wirelessly to performers' belt packs." },
  { id: "iem-rx",    label: "IEM Receiver",      abbr: "RX",   dept: "audio", category: "output",     inputs: 1, outputs: 0, signalType: "Audio (Ears)", description: "Belt-pack receiver with in-ear monitors for the performer." },

  // Video (9)
  { id: "camera",    label: "Camera",            abbr: "CAM",   dept: "video", category: "source",     inputs: 0, outputs: 1, signalType: "SDI/HDMI",     description: "Live camera — captures the image that feeds the video chain." },
  { id: "sdi-router",label: "SDI Router",        abbr: "RTR",   dept: "video", category: "transport",  inputs: 1, outputs: 2, signalType: "SDI",          description: "Routes multiple SDI sources to multiple destinations." },
  { id: "switcher",  label: "Video Switcher",    abbr: "SW",    dept: "video", category: "processing", inputs: 1, outputs: 2, signalType: "SDI/HDMI",     description: "Production switcher — cuts, dissolves, and keys between sources." },
  { id: "scaler",    label: "Scaler",            abbr: "SCL",   dept: "video", category: "processing", inputs: 1, outputs: 1, signalType: "HDMI/SDI",     description: "Converts resolution and frame rate to match the display." },
  { id: "led-proc",  label: "LED Processor",     abbr: "LED-P", dept: "video", category: "processing", inputs: 1, outputs: 1, signalType: "Proprietary",  description: "Maps and drives pixel data to LED wall panels." },
  { id: "led-wall",  label: "LED Wall",          abbr: "LED",   dept: "video", category: "output",     inputs: 1, outputs: 0, signalType: "Light",        description: "LED video display — the final output the audience sees." },
  { id: "projector", label: "Projector",         abbr: "PROJ",  dept: "video", category: "output",     inputs: 1, outputs: 0, signalType: "Light",        description: "Projects image onto a screen or surface." },
  { id: "recorder",  label: "Recording Device",  abbr: "REC",   dept: "video", category: "output",     inputs: 1, outputs: 0, signalType: "File",         description: "Records the program feed to SSD or disk." },
  { id: "encoder",   label: "Streaming Encoder", abbr: "ENC",   dept: "video", category: "output",     inputs: 1, outputs: 0, signalType: "IP Stream",    description: "Encodes video for live streaming to CDN platforms." },

  // Lighting (6)
  { id: "lx-console",label: "Lighting Console",  abbr: "LX",    dept: "lighting", category: "source",     inputs: 0, outputs: 2, signalType: "DMX / sACN",  description: "Lighting desk — programs and plays back cues for all fixtures." },
  { id: "dmx-node",  label: "DMX Node",          abbr: "NODE",  dept: "lighting", category: "transport",  inputs: 1, outputs: 2, signalType: "DMX512",      description: "Converts network (sACN/Art-Net) to DMX512 for fixtures." },
  { id: "dimmer",    label: "Dimmer Rack",       abbr: "DIM",   dept: "lighting", category: "processing", inputs: 1, outputs: 1, signalType: "Power",       description: "Controls power to conventional fixtures via DMX." },
  { id: "mover",     label: "Moving Light",      abbr: "MOV",   dept: "lighting", category: "output",     inputs: 1, outputs: 0, signalType: "Light",       description: "Automated fixture — pan, tilt, color, gobo via DMX." },
  { id: "led-fix",   label: "LED Fixture",       abbr: "LED-F", dept: "lighting", category: "output",     inputs: 1, outputs: 0, signalType: "Light",       description: "LED wash, spot, or strip controlled via DMX." },
  { id: "followspot",label: "Follow Spot",       abbr: "FS",    dept: "lighting", category: "output",     inputs: 1, outputs: 0, signalType: "Light",       description: "Manually operated spotlight that tracks a performer." },
];

// ─── Lookup helpers ──────────────────────────────────────────

const BLOCK_MAP = new Map(BLOCKS.map((b) => [b.id, b]));
function getDef(id: string): BlockDef {
  return BLOCK_MAP.get(id)!;
}

// ─── Category ordering & display ─────────────────────────────

const CAT_ORDER: Record<Category, number> = { source: 0, transport: 1, processing: 2, output: 3 };
const CAT_LABEL: Record<Category, string> = { source: "Source", transport: "Transport", processing: "Processing", output: "Output" };
const CAT_COLOR: Record<Category, string> = { source: "var(--color-cue-blue)", transport: "var(--color-standby-amber)", processing: "var(--color-signal-orange)", output: "var(--color-go-green)" };
const CAT_BG: Record<Category, string> = { source: "rgba(74,158,255,0.12)", transport: "rgba(255,179,0,0.12)", processing: "rgba(255,77,0,0.12)", output: "rgba(0,200,83,0.12)" };

// ─── Dimensions ──────────────────────────────────────────────

const BW = 120;   // block width
const BH = 64;    // block height
const PR = 7;     // port radius

// ─── Port positions (canvas-relative) ────────────────────────

function outPortXY(b: CanvasBlock, port: number, def: BlockDef) {
  const gap = BH / (def.outputs + 1);
  return { x: b.x + BW, y: b.y + gap * (port + 1) };
}

function inPortXY(b: CanvasBlock, port: number, def: BlockDef) {
  const gap = BH / (def.inputs + 1);
  return { x: b.x, y: b.y + gap * (port + 1) };
}

// ─── Presets ─────────────────────────────────────────────────

interface Preset {
  id: string;
  label: string;
  dept: Dept;
  blocks: { defId: string; x: number; y: number }[];
  conns: [number, number, number, number][]; // [fromIdx, fromPort, toIdx, toPort]
}

const PRESETS: Preset[] = [
  {
    id: "corporate-audio",
    label: "Corporate Audio",
    dept: "audio",
    blocks: [
      { defId: "mic",     x: 30,  y: 100 },
      { defId: "stagebox",x: 190, y: 100 },
      { defId: "console", x: 350, y: 100 },
      { defId: "dsp",     x: 510, y: 100 },
      { defId: "amp",     x: 670, y: 100 },
      { defId: "speaker", x: 830, y: 100 },
      { defId: "iem-tx",  x: 510, y: 260 },
      { defId: "iem-rx",  x: 670, y: 260 },
    ],
    conns: [
      [0, 0, 1, 0],
      [1, 0, 2, 0],
      [2, 0, 3, 0],
      [3, 0, 4, 0],
      [4, 0, 5, 0],
      [2, 1, 6, 0],
      [6, 0, 7, 0],
    ],
  },
  {
    id: "imag-video",
    label: "IMAG Video",
    dept: "video",
    blocks: [
      { defId: "camera",    x: 30,  y: 120 },
      { defId: "sdi-router",x: 210, y: 120 },
      { defId: "switcher",  x: 400, y: 120 },
      { defId: "led-proc",  x: 590, y: 120 },
      { defId: "led-wall",  x: 770, y: 120 },
      { defId: "encoder",   x: 590, y: 280 },
    ],
    conns: [
      [0, 0, 1, 0],
      [1, 0, 2, 0],
      [2, 0, 3, 0],
      [3, 0, 4, 0],
      [2, 1, 5, 0],
    ],
  },
  {
    id: "basic-lighting",
    label: "Basic Lighting",
    dept: "lighting",
    blocks: [
      { defId: "lx-console", x: 50,  y: 160 },
      { defId: "dmx-node",   x: 280, y: 160 },
      { defId: "mover",      x: 510, y: 80  },
      { defId: "led-fix",    x: 510, y: 280 },
    ],
    conns: [
      [0, 0, 1, 0],
      [1, 0, 2, 0],
      [1, 1, 3, 0],
    ],
  },
];

// ─── ID generator (stable across renders) ────────────────────

let _seq = 0;
function mkId() {
  return `sf_${++_seq}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Validation ──────────────────────────────────────────────

function validate(blocks: CanvasBlock[], conns: Connection[]): ValidationResult {
  if (blocks.length === 0) {
    return { status: "empty", message: "Drag gear blocks from the sidebar to start building a signal chain.", errorBlockIds: [] };
  }

  // Single block — no connections possible yet
  if (blocks.length === 1) {
    const def = getDef(blocks[0].defId);
    if (def.inputs === 0 && def.outputs === 0) {
      return { status: "ok", message: "Single standalone block.", errorBlockIds: [] };
    }
    return { status: "incomplete", message: "Add more blocks and connect them to form a chain.", errorBlockIds: [] };
  }

  // Find disconnected blocks
  const touched = new Set<string>();
  conns.forEach((c) => { touched.add(c.fromInstanceId); touched.add(c.toInstanceId); });
  const loose = blocks.filter((b) => !touched.has(b.instanceId));
  if (loose.length > 0) {
    return {
      status: "error",
      message: `Disconnected: ${loose.map((b) => getDef(b.defId).label).join(", ")}. Connect all blocks to form a chain.`,
      errorBlockIds: loose.map((b) => b.instanceId),
    };
  }

  // Must have at least one source
  const hasSource = blocks.some((b) => getDef(b.defId).category === "source");
  if (!hasSource) {
    return { status: "error", message: "No source block. Every chain needs a source (microphone, camera, console).", errorBlockIds: [] };
  }

  // Must have at least one output
  const hasOutput = blocks.some((b) => getDef(b.defId).category === "output");
  if (!hasOutput) {
    return { status: "error", message: "No output block. Every chain needs an endpoint (speaker, LED wall, fixture).", errorBlockIds: [] };
  }

  // Category order check
  for (const c of conns) {
    const fb = blocks.find((b) => b.instanceId === c.fromInstanceId);
    const tb = blocks.find((b) => b.instanceId === c.toInstanceId);
    if (!fb || !tb) continue;
    const fd = getDef(fb.defId);
    const td = getDef(tb.defId);
    if (CAT_ORDER[fd.category] > CAT_ORDER[td.category]) {
      return {
        status: "error",
        message: `${fd.label} (${CAT_LABEL[fd.category]}) → ${td.label} (${CAT_LABEL[td.category]}) is backwards. Signal flows Source → Transport → Processing → Output.`,
        errorBlockIds: [fb.instanceId, tb.instanceId],
      };
    }
  }

  // Every non-source block should have an incoming connection
  for (const b of blocks) {
    const def = getDef(b.defId);
    if (def.inputs > 0 && !conns.some((c) => c.toInstanceId === b.instanceId)) {
      return { status: "incomplete", message: `${def.label} has no input connection.`, errorBlockIds: [b.instanceId] };
    }
    if (def.outputs > 0 && !conns.some((c) => c.fromInstanceId === b.instanceId)) {
      return { status: "incomplete", message: `${def.label} has no output connection.`, errorBlockIds: [b.instanceId] };
    }
  }

  return { status: "ok", message: "Signal chain is valid — all blocks connected in correct order.", errorBlockIds: [] };
}

// ─── Bezier path string ──────────────────────────────────────

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.max(Math.abs(x2 - x1) * 0.45, 40);
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

// ═════════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════════

export default function SignalFlow() {
  const [dept, setDept] = useState<Dept>("audio");
  const [blocks, setBlocks] = useState<CanvasBlock[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pending, setPending] = useState<PendingPort | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Refs for drag state (avoids stale closures)
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);

  const sidebar = BLOCKS.filter((b) => b.dept === dept);
  const presets = PRESETS.filter((p) => p.dept === dept);
  const result = validate(blocks, connections);

  // ─── Sidebar → Canvas drag (HTML5) ─────────────────────

  const onSidebarDragStart = (e: React.DragEvent, defId: string) => {
    e.dataTransfer.setData("application/x-sf-block", defId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const onCanvasDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-sf-block")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const onCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const defId = e.dataTransfer.getData("application/x-sf-block");
    if (!defId || !BLOCK_MAP.has(defId)) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - BW / 2, rect.width - BW));
    const y = Math.max(0, Math.min(e.clientY - rect.top - BH / 2, rect.height - BH));
    setBlocks((prev) => [...prev, { instanceId: mkId(), defId, x, y }]);
  };

  // ─── Block repositioning (pointer events) ──────────────

  const onBlockPointerDown = (e: React.PointerEvent, instanceId: string) => {
    // Ignore if clicking a port
    if ((e.target as HTMLElement).dataset.port) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current!.getBoundingClientRect();
    const block = blocks.find((b) => b.instanceId === instanceId)!;
    // Offset from mouse to block's top-left, in canvas coords
    dragRef.current = {
      id: instanceId,
      ox: e.clientX - rect.left - block.x,
      oy: e.clientY - rect.top - block.y,
    };
    setSelected(instanceId);

    // Capture pointer on the canvas so we get events outside it
    canvasRef.current!.setPointerCapture(e.pointerId);
  };

  const onCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - drag.ox, rect.width - BW));
    const y = Math.max(0, Math.min(e.clientY - rect.top - drag.oy, rect.height - BH));
    setBlocks((prev) => prev.map((b) => (b.instanceId === drag.id ? { ...b, x, y } : b)));
  }, []);

  const onCanvasPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragRef.current) {
      canvasRef.current?.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  }, []);

  // ─── Connections ────────────────────────────────────────

  const onOutputClick = (e: React.MouseEvent, instanceId: string, port: number) => {
    e.stopPropagation();
    setPending({ instanceId, port });
  };

  const onInputClick = (e: React.MouseEvent, instanceId: string, port: number) => {
    e.stopPropagation();
    if (!pending) return;
    // Can't connect to self
    if (pending.instanceId === instanceId) { setPending(null); return; }
    // Input already occupied
    if (connections.some((c) => c.toInstanceId === instanceId && c.toPort === port)) { setPending(null); return; }
    // No duplicate connections
    if (connections.some((c) => c.fromInstanceId === pending.instanceId && c.fromPort === pending.port && c.toInstanceId === instanceId && c.toPort === port)) { setPending(null); return; }
    setConnections((prev) => [...prev, {
      id: mkId(),
      fromInstanceId: pending.instanceId,
      fromPort: pending.port,
      toInstanceId: instanceId,
      toPort: port,
    }]);
    setPending(null);
  };

  const deleteConn = (connId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connId));
  };

  const onCanvasClick = () => {
    setPending(null);
    setSelected(null);
  };

  // ─── Keyboard shortcuts ─────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPending(null); setSelected(null); }
      if ((e.key === "Delete" || e.key === "Backspace") && selected && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setBlocks((prev) => prev.filter((b) => b.instanceId !== selected));
        setConnections((prev) => prev.filter((c) => c.fromInstanceId !== selected && c.toInstanceId !== selected));
        setSelected(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected]);

  // ─── Presets & Clear ────────────────────────────────────

  const loadPreset = (p: Preset) => {
    const newBlocks: CanvasBlock[] = p.blocks.map((b) => ({ instanceId: mkId(), defId: b.defId, x: b.x, y: b.y }));
    const newConns: Connection[] = p.conns.map((c) => ({
      id: mkId(),
      fromInstanceId: newBlocks[c[0]].instanceId,
      fromPort: c[1],
      toInstanceId: newBlocks[c[2]].instanceId,
      toPort: c[3],
    }));
    setBlocks(newBlocks);
    setConnections(newConns);
    setPending(null);
    setSelected(null);
  };

  const clearCanvas = () => {
    setBlocks([]);
    setConnections([]);
    setPending(null);
    setSelected(null);
  };

  // ─── Sidebar grouping ──────────────────────────────────

  const grouped = sidebar.reduce<Record<string, BlockDef[]>>((a, b) => {
    const k = CAT_LABEL[b.category];
    (a[k] ??= []).push(b);
    return a;
  }, {});

  // ─── Render ─────────────────────────────────────────────

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/resources" className="inline-block text-[11px] font-mono text-aluminum/60 hover:text-signal-orange transition-colors mb-4">
          &larr; Resources
        </Link>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
          <span className="text-signal-orange">SIGNAL FLOW</span> SIMULATOR
        </h1>
        <p className="text-sm text-aluminum/65 mt-2 max-w-xl mx-auto">
          Build AV signal chains visually. Drag gear from the sidebar, connect outputs to inputs, and validate your signal flow.
        </p>
      </div>

      {/* Dept tabs */}
      <div className="flex justify-center gap-2 mb-4">
        {(["audio", "video", "lighting"] as Dept[]).map((d) => (
          <button
            key={d}
            onClick={() => { setDept(d); clearCanvas(); }}
            className={`px-5 py-2 rounded-lg font-heading text-sm font-bold tracking-wider uppercase transition-all ${
              dept === d ? "bg-signal-orange text-white" : "bg-deep-stage/60 text-aluminum/60 hover:text-house-lights border border-ink/[0.05]"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Presets + clear */}
      <div className="flex justify-center flex-wrap gap-2 mb-3">
        {presets.map((p) => (
          <button key={p.id} onClick={() => loadPreset(p)} className="px-3 py-1.5 rounded-md text-xs font-mono text-aluminum/65 bg-deep-stage/40 border border-ink/[0.05] hover:border-signal-orange/20 hover:text-house-lights transition-all">
            {p.label}
          </button>
        ))}
        <button onClick={clearCanvas} className="px-3 py-1.5 rounded-md text-xs font-mono text-aluminum/50 bg-deep-stage/40 border border-ink/[0.05] hover:border-red-500/20 hover:text-red-400 transition-all">
          Clear
        </button>
      </div>

      {/* Validation banner */}
      <div className={`mb-4 px-4 py-2.5 rounded-lg font-mono flex items-center gap-2 ${
        result.status === "ok"
          ? "bg-go-green/10 text-go-green border border-go-green/20"
          : result.status === "empty"
            ? "bg-deep-stage/40 text-aluminum/60 border border-ink/[0.05]"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
      }`}>
        <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${
          result.status === "ok" ? "bg-go-green" : result.status === "empty" ? "bg-aluminum/30" : "bg-red-500"
        }`} />
        <span className="font-bold text-xs tracking-wider uppercase mr-1">
          {result.status === "ok" ? "SIGNAL OK" : result.status === "empty" ? "EMPTY" : "SIGNAL BREAK"}
        </span>
        <span className="text-[11px] opacity-70 truncate">{result.message}</span>
      </div>

      {/* ── Main: Sidebar + Canvas ── */}
      <div className="flex gap-4 mb-8">
        {/* Sidebar */}
        <div className="w-44 shrink-0 space-y-4 hidden sm:block">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="text-[10px] font-mono font-bold tracking-widest uppercase text-aluminum/60 mb-1.5 px-1">{cat}</h3>
              <div className="space-y-1">
                {items.map((def) => (
                  <div
                    key={def.id}
                    draggable
                    onDragStart={(e) => onSidebarDragStart(e, def.id)}
                    className="group flex items-center gap-2 px-2 py-1.5 rounded-md bg-deep-stage/40 border border-ink/[0.05] cursor-grab active:cursor-grabbing hover:border-signal-orange/20 transition-all"
                    title={def.description}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CAT_COLOR[def.category] }} />
                    <span className="text-[11px] text-house-lights/70 group-hover:text-house-lights truncate">{def.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-ink/[0.03]">
            <p className="text-[9px] font-mono text-aluminum/50 leading-relaxed px-1">
              Drag blocks to canvas. Click output port → input port to connect. Click a wire to delete. Select block + Delete key to remove.
            </p>
          </div>
        </div>

        {/* Mobile sidebar (horizontal scroll) */}
        <div className="sm:hidden w-full mb-3 -mt-1">
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {sidebar.map((def) => (
              <button
                key={def.id}
                onClick={() => {
                  if (!canvasRef.current) return;
                  const rect = canvasRef.current.getBoundingClientRect();
                  const x = Math.random() * Math.max(rect.width - BW - 20, 20) + 10;
                  const y = Math.random() * Math.max(rect.height - BH - 20, 20) + 10;
                  setBlocks((prev) => [...prev, { instanceId: mkId(), defId: def.id, x, y }]);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-deep-stage/40 border border-ink/[0.05] shrink-0 text-[11px] text-house-lights/70 active:border-signal-orange/30"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLOR[def.category] }} />
                {def.label}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          onDrop={onCanvasDrop}
          onDragOver={onCanvasDragOver}
          onClick={onCanvasClick}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          className={`flex-1 relative rounded-xl border touch-none ${
            pending ? "border-signal-orange/30 bg-deep-stage/60" : "border-ink/[0.05] bg-deep-stage/30"
          }`}
          style={{ height: 480, minHeight: 400 }}
        >
          {/* Grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <pattern id="sf-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sf-grid)" />
          </svg>

          {/* Wires */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {connections.map((conn) => {
              const fb = blocks.find((b) => b.instanceId === conn.fromInstanceId);
              const tb = blocks.find((b) => b.instanceId === conn.toInstanceId);
              if (!fb || !tb) return null;
              const from = outPortXY(fb, conn.fromPort, getDef(fb.defId));
              const to = inPortXY(tb, conn.toPort, getDef(tb.defId));
              const d = bezier(from.x, from.y, to.x, to.y);
              const isErr = result.errorBlockIds.includes(conn.fromInstanceId) && result.errorBlockIds.includes(conn.toInstanceId);
              return (
                <g key={conn.id} style={{ pointerEvents: "auto" }}>
                  <path d={d} fill="none" stroke="transparent" strokeWidth="14" className="cursor-pointer" onClick={(e) => { e.stopPropagation(); deleteConn(conn.id); }} />
                  <path d={d} fill="none" stroke={isErr ? "#ef4444" : "var(--color-signal-orange)"} strokeWidth="2" strokeOpacity={isErr ? 0.8 : 0.5} className="pointer-events-none" />
                </g>
              );
            })}
          </svg>

          {/* Blocks */}
          {blocks.map((block) => {
            const def = getDef(block.defId);
            const isErr = result.errorBlockIds.includes(block.instanceId);
            const isSel = selected === block.instanceId;
            return (
              <div
                key={block.instanceId}
                onPointerDown={(e) => onBlockPointerDown(e, block.instanceId)}
                className={`absolute select-none rounded-lg border transition-colors ${
                  isErr ? "border-red-500/60" : isSel ? "border-signal-orange/60" : "border-white/10 hover:border-white/20"
                }`}
                style={{
                  left: block.x,
                  top: block.y,
                  width: BW,
                  height: BH,
                  background: CAT_BG[def.category],
                  zIndex: isSel ? 10 : 2,
                  cursor: dragRef.current?.id === block.instanceId ? "grabbing" : "grab",
                  touchAction: "none",
                }}
              >
                <div className="flex flex-col items-center justify-center h-full px-1 pointer-events-none">
                  <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: CAT_COLOR[def.category] }}>
                    {def.abbr}
                  </span>
                  <span className="text-[9px] text-house-lights/50 truncate max-w-[100px] text-center leading-tight">
                    {def.label}
                  </span>
                </div>

                {/* Input ports */}
                {Array.from({ length: def.inputs }).map((_, i) => {
                  const py = inPortXY(block, i, def).y - block.y;
                  return (
                    <div
                      key={`in-${i}`}
                      data-port="input"
                      onClick={(e) => onInputClick(e, block.instanceId, i)}
                      className={`absolute rounded-full border-2 transition-all ${
                        pending ? "border-signal-orange bg-signal-orange/30 scale-110" : "border-aluminum/40 bg-blackout hover:border-white/60"
                      }`}
                      style={{ width: PR * 2, height: PR * 2, left: -PR, top: py - PR, zIndex: 5, cursor: "pointer" }}
                    />
                  );
                })}

                {/* Output ports */}
                {Array.from({ length: def.outputs }).map((_, i) => {
                  const py = outPortXY(block, i, def).y - block.y;
                  const isActive = pending?.instanceId === block.instanceId && pending?.port === i;
                  return (
                    <div
                      key={`out-${i}`}
                      data-port="output"
                      onClick={(e) => onOutputClick(e, block.instanceId, i)}
                      className={`absolute rounded-full border-2 transition-all ${
                        isActive ? "border-signal-orange bg-signal-orange scale-125" : "border-aluminum/40 bg-blackout hover:border-signal-orange"
                      }`}
                      style={{ width: PR * 2, height: PR * 2, left: BW - PR, top: py - PR, zIndex: 5, cursor: "pointer" }}
                    />
                  );
                })}
              </div>
            );
          })}

          {/* Empty state */}
          {blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
              <div className="text-center">
                <p className="text-aluminum/35 text-sm font-mono">Drag gear blocks here</p>
                <p className="text-aluminum/30 text-xs font-mono mt-1">or load a preset above</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected block info */}
      {selected && (() => {
        const b = blocks.find((bl) => bl.instanceId === selected);
        if (!b) return null;
        const def = getDef(b.defId);
        return (
          <div className="mb-8 px-4 py-3 rounded-lg bg-deep-stage/40 border border-ink/[0.05]">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLOR[def.category] }} />
              <span className="font-heading text-sm font-bold">{def.label}</span>
              <span className="text-[10px] font-mono text-aluminum/60">{def.signalType}</span>
            </div>
            <p className="text-[11px] text-aluminum/65">{def.description}</p>
          </div>
        );
      })()}

      {/* Educational: Reading a Signal Chain */}
      <section className="mb-16">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-6 text-center">
          Reading a Signal Chain
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { cat: "source" as Category, title: "Source", desc: "Where the signal originates. Microphones capture sound, cameras capture images, lighting consoles generate DMX data.", ex: "Microphone, Camera, Lighting Console" },
            { cat: "transport" as Category, title: "Transport", desc: "Moves the signal from point A to point B. Converts formats (analog to digital) and carries signals over distance.", ex: "Stage Box, Digital Snake, SDI Router, DMX Node" },
            { cat: "processing" as Category, title: "Processing", desc: "Modifies, routes, or controls the signal. Mixing, switching, scaling — where decisions are made.", ex: "Console, Video Switcher, DSP, Amplifier" },
            { cat: "output" as Category, title: "Output", desc: "The final destination. Converts electrical signal into something the audience experiences — sound, images, light.", ex: "Speaker, LED Wall, Projector, Moving Light" },
          ]).map((c) => (
            <div key={c.cat} className="p-4 rounded-xl bg-deep-stage/40 border border-ink/[0.05]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CAT_COLOR[c.cat] }} />
                <h3 className="font-heading text-sm font-bold tracking-wide">{c.title}</h3>
              </div>
              <p className="text-[11px] text-aluminum/65 leading-relaxed mb-2">{c.desc}</p>
              <p className="text-[10px] font-mono text-aluminum/50">{c.ex}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-3 text-[10px] font-mono text-aluminum/50">
            {(["source", "transport", "processing", "output"] as Category[]).map((cat, i) => (
              <span key={cat} className="flex items-center gap-1">
                {i > 0 && <span className="mr-1">&rarr;</span>}
                <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLOR[cat] }} />
                {CAT_LABEL[cat]}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12 border-t border-ink/[0.03]">
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
          Signal Flow Is a <span className="text-signal-orange">Core Skill</span>
        </h2>
        <p className="text-sm text-aluminum/60 mb-6 max-w-md mx-auto">
          Understanding signal flow separates AV technicians from cable pullers. Build your profile on Truss and show producers you know your craft.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 bg-signal-orange text-white font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
        >
          Create Your Profile — Free
        </Link>
      </section>

      <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-[11px] text-aluminum/40 leading-relaxed">
          This simulator is an educational tool for planning purposes only. Signal flow behavior varies by manufacturer, firmware, and configuration. Always verify connections and routing with actual equipment before showtime.
        </p>
      </footer>
    </main>
  );
}
