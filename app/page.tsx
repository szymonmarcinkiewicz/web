"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

const FONTS = [
  "Arial",
  "Verdana",
  "Tahoma",
  "Segoe UI",
  "Calibri",
  "Trebuchet MS",
  "Times New Roman",
  "Georgia",
  "Courier New",
] as const;

const PLAYRES_W = 1920;
const PLAYRES_H = 1080;

type TabKey = "dual" | "translate";

type GoogleFcApi = {
  callbackQueue?: Array<() => void>;
  showRevocationMessage?: () => void;
};

const SITE_NAME = "DualSubs";
const SEO_TITLE = "Dual subtitles (SRT to ASS) - Merge and Translate Subtitles Online";
const SEO_DESCRIPTION =
  "Create dual subtitles easily. Merge two SRT files into one ASS or translate subtitles with AI. Works with VLC and MPV - timings preserved.";

const surfaceClass =
  "rounded-2xl border border-white/10 bg-zinc-950/70 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur";
const panelClass = "rounded-xl border border-white/10 bg-white/[0.035] p-4";
const inputClass =
  "mt-2 block w-full rounded-lg border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15 disabled:opacity-60";
const secondaryButtonClass =
  "rounded-lg border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-zinc-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10";

function primaryButtonClass(disabled: boolean) {
  return `rounded-lg px-4 py-2 text-sm font-medium transition ${
    disabled
      ? "cursor-not-allowed border border-white/10 bg-zinc-800 text-zinc-500"
      : "border border-cyan-200/60 bg-cyan-200 text-zinc-950 shadow-[0_0_28px_rgba(103,232,249,0.18)] hover:bg-cyan-100"
  }`;
}

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "What are dual subtitles?",
    a: "Dual subtitles show two languages at the same time - usually one line at the top and one at the bottom. This is popular for language learning and anime/movies when you want original + translation together.",
  },
  {
    q: "How do I merge two SRT files into one ASS?",
    a: "Use the Dual ASS Generator tab, upload both SRT files, adjust font and margins, then generate an ASS file. ASS supports multiple styles, which lets us place one language at the top and the other at the bottom.",
  },
  {
    q: "SRT vs ASS - what is the difference?",
    a: "SRT is a simple subtitle format (timings + text). ASS is an advanced format that supports styles, positioning, and rich formatting. ASS is ideal for dual subtitles because you can define separate Top and Bottom styles.",
  },
  {
    q: "Will timings be preserved after translation?",
    a: "Yes. The translator keeps the original timecodes and only replaces the text, so the output stays in sync with the video.",
  },
  {
    q: "Do you store my subtitle files?",
    a: "Files are processed to generate your output and are not intended to be stored long-term. If you need strict privacy guarantees, host your own instance or ask for a self-hosted setup.",
  },
];

function upsertMeta(name: string, content: string) {
  if (typeof document === "undefined") return;
  const head = document.head;
  let el = head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertProperty(property: string, content: string) {
  if (typeof document === "undefined") return;
  const head = document.head;
  let el = head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  if (typeof document === "undefined") return;
  const head = document.head;
  let el = head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const LANGS = [
  { code: "auto", label: "Auto-detect" },
  { code: "en", label: "English" },
  { code: "pl", label: "Polish" },
  { code: "ru", label: "Russian" },
  { code: "es", label: "Spanish" },
  { code: "uk", label: "Ukrainian" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "it", label: "Italian" },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function errorMessage(err: unknown, fallback = "Unknown error") {
  return err instanceof Error ? err.message : fallback;
}

function openPrivacySettings() {
  const googlefc = (window as Window & { googlefc?: GoogleFcApi }).googlefc;

  if (googlefc?.callbackQueue && googlefc.showRevocationMessage) {
    googlefc.callbackQueue.push(googlefc.showRevocationMessage);
    return;
  }

  alert("Privacy and cookie settings are available after the consent message loads.");
}

function ChainIcon(props: { linked: boolean }) {
  const { linked } = props;
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={linked ? 0.35 : 1}
      />
      <path
        d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={linked ? 1 : 0.6}
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function FilePicker(props: {
  id: string;
  label: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  onChange: (file: File | null) => void;
  onClear: () => void;
}) {
  const { id, label, file, inputRef, disabled = false, onChange, onClear } = props;

  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{label}</label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept=".srt"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        disabled={disabled}
      />

      <div className="mt-2 flex items-center gap-2">
        <label
          htmlFor={id}
          className={`group flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3 py-3 transition ${
            disabled
              ? "pointer-events-none border-white/10 bg-zinc-900/50 opacity-60"
              : file
                ? "border-cyan-300/35 bg-cyan-300/[0.055] hover:border-cyan-200/60"
                : "border-white/10 bg-zinc-950/60 hover:border-cyan-300/45 hover:bg-cyan-300/[0.04]"
          }`}
          title={file ? "Kliknij, aby zmienic plik" : "Wybierz plik"}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-cyan-200">
            <FileIcon />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-zinc-100">
              {file ? file.name : "Wybierz plik SRT"}
            </span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              {file ? "Gotowe do przetworzenia" : "UTF-8 recommended"}
            </span>
          </span>
        </label>

        {file && !disabled && (
          <button type="button" onClick={onClear} className={secondaryButtonClass} title="Wyczysc">
            Usun
          </button>
        )}
      </div>
    </div>
  );
}

function AdSlot(props: { variant?: "rail" | "inline" | "modal"; title?: string }) {
  const { variant = "inline", title = "Advertisement" } = props;

  const sizeClass =
    variant === "rail"
      ? "h-[600px] w-[160px]"
      : variant === "modal"
        ? "min-h-[220px] w-full"
        : "min-h-[250px] w-full";

  return (
    <div className="text-center">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">{title}</div>
      <div
        className={`${sizeClass} overflow-hidden rounded-xl border border-dashed border-white/10 bg-white/[0.025] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]`}
      >
        <div className="flex h-full min-h-[inherit] flex-col items-center justify-center gap-3 p-5">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
            Sample ad
          </div>
          <div className="max-w-[220px] text-sm font-medium text-zinc-300">Your ad creative here</div>
          <div className="max-w-[220px] text-xs leading-5 text-zinc-500">
            Fixed-size placeholder for AdSense or another display network.
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopAdRail(props: { side: "left" | "right" }) {
  return (
    <aside
      className={`sticky top-8 hidden self-start 2xl:block ${
        props.side === "left" ? "justify-self-end" : "justify-self-start"
      }`}
      aria-label={`${props.side} advertisement rail`}
    >
      <AdSlot variant="rail" />
    </aside>
  );
}

function ProgressBar(props: { pct: number; label: string }) {
  const { pct, label } = props;
  const clamped = clamp(Number.isFinite(pct) ? pct : 0, 0, 100);

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/55 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-zinc-200">{label}</div>
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-xs tabular-nums text-cyan-100">
          {Math.round(clamped)}%
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className="h-2 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.42)]"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function SliderRow(props: {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const { label, value, unit = "px", min, max, step = 1, onChange } = props;

  return (
    <div className={panelClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-zinc-200">{label}</div>
          <div className="mt-0.5 text-xs text-zinc-400">
            {min}
            {unit} to {max}
            {unit}
          </div>
        </div>

        <div className="shrink-0 rounded-lg border border-white/10 bg-zinc-950/70 px-2 py-1 text-sm text-zinc-100">
          {value}
          {unit}
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
        className="ds-range mt-4 w-full"
      />
    </div>
  );
}

function PreviewCanvas(props: {
  fontName: string;
  fontSize: number;
  marginVTop: number;
  marginVBottom: number;
  previewTop: string;
  previewBottom: string;
  scale: number;
}) {
  const { fontName, fontSize, marginVTop, marginVBottom, previewTop, previewBottom, scale } = props;

  const scaledFont = Math.max(10, Math.round(fontSize * scale));
  const scaledTop = Math.round(marginVTop * scale);
  const scaledBottom = Math.round(marginVBottom * scale);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-[inset_0_0_80px_rgba(0,0,0,0.65)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(34,211,238,0.16),transparent_28%),linear-gradient(135deg,#18181b,#09090b_62%,#050505)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute left-3 top-3 rounded-md border border-white/10 bg-black/35 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400 backdrop-blur">
        {PLAYRES_W}x{PLAYRES_H}
      </div>

      <div
        className="absolute left-0 right-0 px-10 text-center text-zinc-100"
        style={{
          top: `${scaledTop}px`,
          fontFamily: fontName,
          fontSize: `${scaledFont}px`,
          lineHeight: 1.15,
          textShadow:
            "0 2px 10px rgba(0,0,0,0.95), 2px 0 0 rgba(0,0,0,0.95), -2px 0 0 rgba(0,0,0,0.95), 0 -2px 0 rgba(0,0,0,0.95)",
        }}
      >
        {previewTop}
      </div>

      <div
        className="absolute left-0 right-0 px-10 text-center text-zinc-100"
        style={{
          bottom: `${scaledBottom}px`,
          fontFamily: fontName,
          fontSize: `${scaledFont}px`,
          lineHeight: 1.15,
          textShadow:
            "0 2px 10px rgba(0,0,0,0.95), 2px 0 0 rgba(0,0,0,0.95), -2px 0 0 rgba(0,0,0,0.95), 0 -2px 0 rgba(0,0,0,0.95)",
        }}
      >
        {previewBottom}
      </div>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<TabKey>("translate");

  useEffect(() => {
    document.title = SEO_TITLE;
    upsertMeta("description", SEO_DESCRIPTION);

    upsertProperty("og:title", SEO_TITLE);
    upsertProperty("og:description", SEO_DESCRIPTION);
    upsertProperty("og:type", "website");

    upsertProperty("twitter:card", "summary");
    upsertProperty("twitter:title", SEO_TITLE);
    upsertProperty("twitter:description", SEO_DESCRIPTION);

    try {
      const url = new URL(window.location.href);
      const canonical = `${url.origin}${url.pathname}`;
      upsertLink("canonical", canonical);
      upsertProperty("og:url", canonical);
    } catch {
      // ignore
    }
  }, []);

  // Dual ASS Generator state
  const [topFile, setTopFile] = useState<File | null>(null);
  const [bottomFile, setBottomFile] = useState<File | null>(null);

  const topInputRef = useRef<HTMLInputElement | null>(null);
  const bottomInputRef = useRef<HTMLInputElement | null>(null);

  const [fontName, setFontName] = useState<(typeof FONTS)[number]>("Arial");
  const [fontSize, setFontSize] = useState<number>(48);

  const [marginVTop, setMarginVTop] = useState<number>(60);
  const [marginVBottom, setMarginVBottom] = useState<number>(60);
  const [linkMargins, setLinkMargins] = useState<boolean>(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fullscreen
  const [isTrueFullscreen, setIsTrueFullscreen] = useState(false);
  const fullscreenTargetRef = useRef<HTMLDivElement | null>(null);

  // Preview scaling
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [previewHeight, setPreviewHeight] = useState<number>(0);

  useEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setPreviewHeight(rect.height);
    });

    ro.observe(el);
    setPreviewHeight(el.getBoundingClientRect().height);

    return () => ro.disconnect();
  }, []);

  const previewScale = useMemo(() => {
    if (!previewHeight) return 1;
    return previewHeight / PLAYRES_H;
  }, [previewHeight]);

  const canGenerate = !!topFile && !!bottomFile;

  const previewTop = useMemo(
    () =>
      topFile
        ? "This is a top subtitle preview. Adjust font, size and margins."
        : "Top subtitle preview...",
    [topFile]
  );

  const previewBottom = useMemo(
    () =>
      bottomFile
        ? "This is a bottom subtitle preview. Use the sliders to see the effect."
        : "Bottom subtitle preview...",
    [bottomFile]
  );

  async function generateAss() {
    if (!topFile || !bottomFile) return;

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const form = new FormData();
      form.append("srt_top", topFile);
      form.append("srt_bottom", bottomFile);
      form.append("font_name", fontName);
      form.append("font_size", String(fontSize));
      form.append("margin_v_top", String(marginVTop));
      form.append("margin_v_bottom", String(marginVBottom));

      const res = await fetch(`${API_BASE}/v1/merge`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Backend error (${res.status}): ${text || "Unknown error"}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "dual-subtitles.ass";
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setErrorMsg(errorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  }

  async function enterFullscreen() {
    const el = fullscreenTargetRef.current;
    if (!el) return;

    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else alert("Fullscreen is not supported in this browser.");
    } catch {
      alert("Fullscreen request was blocked by the browser.");
    }
  }

  async function exitFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    function onFsChange() {
      setIsTrueFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function setTopMargin(v: number) {
    setMarginVTop(v);
    if (linkMargins) setMarginVBottom(v);
  }

  function setBottomMargin(v: number) {
    setMarginVBottom(v);
    if (linkMargins) setMarginVTop(v);
  }

  function clearTopFile() {
    setTopFile(null);
    if (topInputRef.current) topInputRef.current.value = "";
  }

  function clearBottomFile() {
    setBottomFile(null);
    if (bottomInputRef.current) bottomInputRef.current.value = "";
  }

  // AI Translate
  const [translateFile, setTranslateFile] = useState<File | null>(null);
  const translateInputRef = useRef<HTMLInputElement | null>(null);

  const [sourceLang, setSourceLang] = useState<string>("auto");
  const [targetLang, setTargetLang] = useState<string>("pl");

  const [translateError, setTranslateError] = useState<string | null>(null);
  const [translateInfo, setTranslateInfo] = useState<string | null>(null);

  const [isTranslating, setIsTranslating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const [progressPct, setProgressPct] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>("Idle");
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  const pollRef = useRef<number | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const canTranslate = !!translateFile && !!targetLang && !isTranslating;

  async function downloadResult(finalJobId: string) {
    const res = await fetch(`${API_BASE}/v1/translate/result/${finalJobId}`);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Result error (${res.status}): ${text || "Unknown error"}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;

    const base = (translateFile?.name || "translated").replace(/\.[^/.]+$/, "");
    a.download = `${base}.${targetLang}.srt`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  async function translateStart() {
    if (!translateFile) return;

    setTranslateError(null);
    setTranslateInfo(null);
    setIsTranslating(true);
    setIsProgressModalOpen(true);
    setProgressPct(0);
    setProgressStage("Queued");
    setJobId(null);

    try {
      const form = new FormData();
      form.append("srt_file", translateFile);
      form.append("target_lang", targetLang);
      form.append("source_lang", sourceLang);

      const res = await fetch(`${API_BASE}/v1/translate/start`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Backend error (${res.status}): ${text || "Unknown error"}`);
      }

      const data = await res.json();
      const id = data?.job_id as string;
      if (!id) throw new Error("Missing job_id from backend.");

      setJobId(id);

      stopPolling();
      pollRef.current = window.setInterval(async () => {
        try {
          const sres = await fetch(`${API_BASE}/v1/translate/status/${id}`);
          if (!sres.ok) return;

          const sdata = await sres.json();
          const status = String(sdata.status || "running");
          const stage = String(sdata.stage || "Working...");
          const pct = Number(sdata.progress_pct ?? 0);

          setProgressStage(stage);
          setProgressPct(pct);

          if (status === "error") {
            stopPolling();
            setIsTranslating(false);
            setTranslateError(String(sdata.error || "Translation failed."));
          }

          if (status === "done") {
            stopPolling();
            setProgressStage("Done");
            setProgressPct(100);
            await downloadResult(id);
            setIsTranslating(false);
            setTranslateInfo("Done. Download started.");
          }
        } catch {
          // ignore polling errors
        }
      }, 500);
    } catch (err: unknown) {
      stopPolling();
      setIsTranslating(false);
      setTranslateError(errorMessage(err));
    }
  }

  function clearTranslateFile() {
    setTranslateFile(null);
    if (translateInputRef.current) translateInputRef.current.value = "";
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050607] text-zinc-100">
      <style jsx global>{`
        .ds-range {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 999px;
          background: rgba(39, 39, 42, 0.92);
          outline: none;
        }
        .ds-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: rgb(165 243 252);
          border: 2px solid rgb(8 47 73);
          box-shadow: 0 0 0 2px rgba(103, 232, 249, 0.32), 0 0 18px rgba(103, 232, 249, 0.24);
          cursor: pointer;
        }
        .ds-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: rgb(165 243 252);
          border: 2px solid rgb(8 47 73);
          box-shadow: 0 0 0 2px rgba(103, 232, 249, 0.32), 0 0 18px rgba(103, 232, 249, 0.24);
          cursor: pointer;
        }
        .ds-range::-moz-range-track {
          height: 8px;
          border-radius: 999px;
          background: rgba(39, 39, 42, 0.92);
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,0.15),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(74,222,128,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative mx-auto grid max-w-[1500px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:py-10 2xl:grid-cols-[180px_minmax(0,72rem)_180px]">
        <DesktopAdRail side="left" />

        <div className="min-w-0">
        <header className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold tracking-[0.22em] text-cyan-200/80">{SITE_NAME}</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-50 md:text-4xl">
              Dual subtitles, without the heavy editor.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400 md:text-base">
              Translate SRT files with preserved timings or generate ASS subtitles with top and bottom language tracks.
            </p>
          </div>

          <div className="inline-grid w-full grid-cols-2 rounded-xl border border-white/10 bg-black/30 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur md:w-auto">
            <button
              type="button"
              onClick={() => setTab("translate")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === "translate"
                  ? "bg-cyan-200 text-zinc-950 shadow-[0_0_22px_rgba(103,232,249,0.18)]"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
              aria-pressed={tab === "translate"}
            >
              AI Translate
            </button>

            <button
              type="button"
              onClick={() => setTab("dual")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === "dual"
                  ? "bg-cyan-200 text-zinc-950 shadow-[0_0_22px_rgba(103,232,249,0.18)]"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
              aria-pressed={tab === "dual"}
            >
              Dual ASS Generator
            </button>
          </div>
        </header>

        {tab === "translate" && (
          <section className={`${surfaceClass} p-5 sm:p-6`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/70">AI workflow</div>
                <h2 className="mt-2 text-xl font-semibold">Translate SRT</h2>
                <p className="mt-1 text-sm text-zinc-400">Upload one file and get a translated SRT with original timings.</p>
              </div>
              <div className="w-fit rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                Timings preserved
              </div>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div className={panelClass}>
                <div className="text-sm font-medium text-zinc-200">Input</div>
                <div className="mt-3">
                  <FilePicker
                    id="translateSrtInput"
                    label="SRT file"
                    file={translateFile}
                    inputRef={translateInputRef}
                    disabled={isTranslating}
                    onChange={setTranslateFile}
                    onClear={clearTranslateFile}
                  />
                </div>
              </div>

              <div className={panelClass}>
                <div className="text-sm font-medium text-zinc-200">Languages</div>

                <label className="mt-3 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">From</label>
                <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className={inputClass} disabled={isTranslating}>
                  {LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label} ({l.code})
                    </option>
                  ))}
                </select>

                <label className="mt-4 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">To</label>
                <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className={inputClass} disabled={isTranslating}>
                  {LANGS.filter((x) => x.code !== "auto").map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button disabled={!canTranslate} className={primaryButtonClass(!canTranslate)} onClick={translateStart}>
                {isTranslating ? "Translating..." : "Translate and download"}
              </button>

              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => {
                  stopPolling();
                  setIsTranslating(false);
                  setIsProgressModalOpen(false);
                  setJobId(null);
                  setProgressPct(0);
                  setProgressStage("Idle");
                  setTranslateError(null);
                  setTranslateInfo(null);
                  clearTranslateFile();
                  setSourceLang("auto");
                  setTargetLang("pl");
                }}
              >
                Reset
              </button>
            </div>

            {translateInfo && <p className="mt-3 text-center text-xs text-emerald-300">{translateInfo}</p>}
            {translateError && <p className="mt-3 text-center text-xs text-red-300">{translateError}</p>}
          </section>
        )}

        {tab === "dual" && (
          <>
            <section className={`${surfaceClass} p-5 sm:p-6`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/70">ASS generator</div>
                  <h2 className="mt-2 text-xl font-semibold">Preview and export</h2>
                  <p className="mt-1 max-w-2xl text-sm text-zinc-400">
                    Tune the 1080p subtitle canvas and export a single ASS file for VLC, MPV, and compatible players.
                  </p>
                </div>
                <button disabled={!canGenerate || isGenerating} className={primaryButtonClass(!canGenerate || isGenerating)} onClick={generateAss}>
                  {isGenerating ? "Generating..." : "Generate dual subtitles file"}
                </button>
              </div>

              <div className="relative mt-5" ref={fullscreenTargetRef}>
                <div ref={previewWrapRef}>
                  <PreviewCanvas
                    fontName={fontName}
                    fontSize={fontSize}
                    marginVTop={marginVTop}
                    marginVBottom={marginVBottom}
                    previewTop={previewTop}
                    previewBottom={previewBottom}
                    scale={previewScale}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => (isTrueFullscreen ? exitFullscreen() : enterFullscreen())}
                  className="absolute bottom-3 right-3 z-20 rounded-lg border border-white/10 bg-zinc-950/70 px-2.5 py-2 text-zinc-100 backdrop-blur transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
                  aria-label={isTrueFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  title={isTrueFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M9 3H5a2 2 0 0 0-2 2v4m8 12H5a2 2 0 0 1-2-2v-4m12-12h4a2 2 0 0 1 2 2v4m-6 12h4a2 2 0 0 0 2-2v-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {isTrueFullscreen && (
                  <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-lg border border-white/10 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-200 backdrop-blur">
                    Press Esc to exit fullscreen
                  </div>
                )}
              </div>

              <div className="mt-3 flex justify-center text-xs text-zinc-500">
                {!canGenerate ? "Upload both SRT files to enable generating." : "Ready to generate."}
              </div>

              {errorMsg && <p className="mt-2 text-center text-xs text-red-300">{errorMsg}</p>}
            </section>

            <section className={`${surfaceClass} mt-6 p-5 sm:p-6`}>
              <h2 className="text-xl font-semibold">Settings</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Choose font and adjust size/margins. Output keeps original timings from both SRT files.
              </p>

              <div className="mt-5 grid gap-6 lg:grid-cols-3">
                <div className={panelClass}>
                  <div className="text-sm font-medium text-zinc-200">Files</div>

                  <div className="mt-3 space-y-4">
                    <FilePicker id="srtTopInput" label="SRT top" file={topFile} inputRef={topInputRef} onChange={setTopFile} onClear={clearTopFile} />
                    <FilePicker
                      id="srtBottomInput"
                      label="SRT bottom"
                      file={bottomFile}
                      inputRef={bottomInputRef}
                      onChange={setBottomFile}
                      onClear={clearBottomFile}
                    />
                  </div>
                </div>

                <div className={panelClass}>
                  <div className="text-sm font-medium text-zinc-200">Font</div>

                  <label className="mt-3 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Font family</label>
                  <select value={fontName} onChange={(e) => setFontName(e.target.value as (typeof FONTS)[number])} className={inputClass}>
                    {FONTS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs text-zinc-500">The font must be installed on the device where you play the video.</p>

                  <div className="mt-4">
                    <SliderRow label="Font size" value={fontSize} min={24} max={90} onChange={setFontSize} />
                  </div>
                </div>

                <div className="space-y-4">
                  <SliderRow label="Top margin" value={marginVTop} min={0} max={200} onChange={setTopMargin} />

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLinkMargins((v) => !v)}
                      className={`rounded-lg border px-3 py-2 transition ${
                        linkMargins
                          ? "border-cyan-200/60 bg-cyan-200 text-zinc-950"
                          : "border-white/10 bg-white/[0.035] text-zinc-200 hover:border-cyan-300/40 hover:bg-cyan-300/10"
                      }`}
                      title={linkMargins ? "Margins linked (click to unlink)" : "Margins separate (click to link)"}
                      aria-pressed={linkMargins}
                    >
                      <ChainIcon linked={linkMargins} />
                    </button>

                    <span className="text-xs text-zinc-500">{linkMargins ? "Margins are linked" : "Margins are separate"}</span>
                  </div>

                  <SliderRow label="Bottom margin" value={marginVBottom} min={0} max={200} onChange={setBottomMargin} />
                </div>
              </div>
            </section>

            <div className="mt-8 2xl:hidden">
              <AdSlot />
            </div>
          </>
        )}

        {isProgressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
            <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_30px_120px_rgba(0,0,0,0.7)]">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/70">
                    Translation progress
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-zinc-50">
                    {isTranslating ? "Working on your subtitles" : translateError ? "Translation needs attention" : "Download ready"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    This window keeps the task visible while the file is being translated.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProgressModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-zinc-300 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
                  aria-label="Close progress modal"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-4">
                  <ProgressBar pct={progressPct} label={translateError ? "Error" : progressStage} />

                  <div className={panelClass}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-zinc-200">Status</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.035] px-2 py-0.5 text-xs text-zinc-400">
                        {translateError ? "Error" : isTranslating ? "Running" : "Finished"}
                      </span>
                    </div>
                    <div className="mt-3 truncate text-xs text-zinc-500">{jobId ? `Job: ${jobId}` : "Preparing job..."}</div>
                    {translateInfo && <p className="mt-3 text-sm text-emerald-300">{translateInfo}</p>}
                    {translateError && <p className="mt-3 text-sm text-red-300">{translateError}</p>}
                  </div>
                </div>

                <AdSlot variant="modal" />
              </div>
            </div>
          </div>
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              {
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "SoftwareApplication",
                    name: SITE_NAME,
                    applicationCategory: "MultimediaApplication",
                    operatingSystem: "Web",
                    description: SEO_DESCRIPTION,
                    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                  },
                  {
                    "@type": "FAQPage",
                    mainEntity: FAQ_ITEMS.map((item) => ({
                      "@type": "Question",
                      name: item.q,
                      acceptedAnswer: { "@type": "Answer", text: item.a },
                    })),
                  },
                ],
              },
              null,
              0
            ),
          }}
        />

        <section className="mx-auto mt-12 max-w-4xl border-t border-white/10 pt-8 text-left">
          <h2 className="text-xl font-semibold text-zinc-100">What this tool does</h2>
          <p className="mt-3 leading-7 text-zinc-400">
            DualSubs helps you create dual subtitles, convert SRT to ASS, and translate subtitles with AI while keeping original timings.
          </p>

          <div className="mt-7 grid gap-7 md:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Who is this for?</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-400">
                <li>Anime watchers who want original + translation on-screen</li>
                <li>Language learners combining native and target language</li>
                <li>Movie/TV translators who need quick bilingual output</li>
                <li>VLC and MPV users who want subtitles on top and bottom</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-semibold text-zinc-100">Why ASS instead of SRT?</h3>
              <p className="mt-2 leading-7 text-zinc-400">
                SRT is simple and widely supported, but it cannot reliably position two languages at different screen locations. ASS supports styles, margins, and positioning.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-7 md:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Popular searches</h3>
              <p className="mt-2 leading-7 text-zinc-400">
                dual subtitles VLC, two languages subtitles VLC, merge SRT files, SRT to ASS dual subtitles, anime dual subtitles, learn language with subtitles
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-zinc-100">Trust and privacy</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-400">
                <li>Your files are processed only to generate the output.</li>
                <li>No accounts required.</li>
                <li>If you need strict guarantees, consider self-hosting.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-4xl border-t border-white/10 pt-8 text-left">
          <h2 className="text-xl font-semibold text-zinc-100">FAQ</h2>
          <div className="mt-4 space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                <summary className="cursor-pointer text-zinc-100">{item.q}</summary>
                <p className="mt-2 leading-7 text-zinc-400">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="mx-auto mt-10 flex max-w-4xl flex-col gap-3 border-t border-white/10 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <div>DualSubs</div>
          <div className="flex flex-wrap gap-4">
            <a href="/privacy" className="transition hover:text-cyan-200">
              Privacy Policy
            </a>
            <button type="button" onClick={openPrivacySettings} className="transition hover:text-cyan-200">
              Privacy and cookie settings
            </button>
          </div>
        </footer>

        {translateInfo && <p className="mt-3 text-center text-xs text-emerald-300">{translateInfo}</p>}
        {translateError && <p className="mt-3 text-center text-xs text-red-300">{translateError}</p>}
        </div>

        <DesktopAdRail side="right" />
      </div>
    </main>
  );
}

