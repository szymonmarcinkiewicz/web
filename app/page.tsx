// Header1: app/page.tsx (final - keeps ALL current features + fixes SEO + keeps Preview + adds YouTube-like fullscreen)
// Description1: This is your current file with minimal-safe edits: (1) SEO H1/title/description + canonical/OG/Twitter via upsert helpers, (2) JSON-LD (SoftwareApplication + FAQPage), (3) SEO landing content + visible FAQ, (4) Preview stays and fullscreen uses Fullscreen API (like YouTube).

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

// --- Header2: SEO copy + FAQ + helpers ---
// --- Description2: Title/description, FAQ, and meta helpers + JSON-LD (SoftwareApplication + FAQPage)
const SITE_NAME = "DualSubs";
const SEO_TITLE = "Dual subtitles (SRT to ASS) - Merge and Translate Subtitles Online";
const SEO_DESCRIPTION =
  "Create dual subtitles easily. Merge two SRT files into one ASS or translate subtitles with AI. Works with VLC and MPV - timings preserved.";

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

function ProgressBar(props: { pct: number; label: string }) {
  const { pct, label } = props;
  const clamped = clamp(Number.isFinite(pct) ? pct : 0, 0, 100);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-zinc-200">{label}</div>
        <div className="text-sm tabular-nums text-zinc-200">{Math.round(clamped)}%</div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className="h-2 rounded-full bg-white" style={{ width: `${clamped}%` }} />
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
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-zinc-200">{label}</div>
          <div className="mt-0.5 text-xs text-zinc-400">
            {min}
            {unit} to {max}
            {unit}
          </div>
        </div>

        <div className="shrink-0 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100">
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
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950" />

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

  // --- Header3: SEO meta + canonical + social tags (client fallback) ---
  // --- Description3: This helps now; best practice later is Next.js metadata in layout.tsx.
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

  // -----------------------------
  // Dual ASS Generator state
  // -----------------------------
  const [topFile, setTopFile] = useState<File | null>(null);
  const [bottomFile, setBottomFile] = useState<File | null>(null);

  const [fontName, setFontName] = useState<(typeof FONTS)[number]>("Arial");
  const [fontSize, setFontSize] = useState<number>(48);

  const [marginVTop, setMarginVTop] = useState<number>(60);
  const [marginVBottom, setMarginVBottom] = useState<number>(60);
  const [linkMargins, setLinkMargins] = useState<boolean>(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Header4: Fullscreen (YouTube-like) ---
  // --- Description4: Uses the Fullscreen API. ESC exits naturally (like YouTube).
  const [isTrueFullscreen, setIsTrueFullscreen] = useState(false);
  const fullscreenTargetRef = useRef<HTMLDivElement | null>(null);

  // --- Header5: Preview scaling ---
  // --- Description5: Preview is fixed 1920x1080 but scaled by current element height.
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
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Unknown error");
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

  // -----------------------------
  // AI Translate (with progress)
  // -----------------------------
  const [translateFile, setTranslateFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState<string>("auto");
  const [targetLang, setTargetLang] = useState<string>("pl");

  const [translateError, setTranslateError] = useState<string | null>(null);
  const [translateInfo, setTranslateInfo] = useState<string | null>(null);

  const [isTranslating, setIsTranslating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const [progressPct, setProgressPct] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>("Idle");

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
          // ignore polling errors (dev)
        }
      }, 500);
    } catch (err: any) {
      stopPolling();
      setIsTranslating(false);
      setTranslateError(err?.message ?? "Unknown error");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <style jsx global>{`
        .ds-range {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 999px;
          background: rgb(39 39 42);
          outline: none;
        }
        .ds-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: rgb(244 244 245);
          border: 2px solid rgb(24 24 27);
          box-shadow: 0 0 0 2px rgb(63 63 70);
          cursor: pointer;
        }
        .ds-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: rgb(244 244 245);
          border: 2px solid rgb(24 24 27);
          box-shadow: 0 0 0 2px rgb(63 63 70);
          cursor: pointer;
        }
        .ds-range::-moz-range-track {
          height: 8px;
          border-radius: 999px;
          background: rgb(39 39 42);
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-6 text-center">
          {/* Header6: SEO H1 */}
          {/* Description6: Replace brand-only H1 with SEO-targeted H1 */}
          <h1 className="text-2xl font-semibold">{SEO_TITLE}</h1>
          <p className="mt-2 text-zinc-300">{SEO_DESCRIPTION}</p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setTab("translate")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                tab === "translate"
                  ? "border-white bg-white text-black"
                  : "border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
              }`}
              aria-pressed={tab === "translate"}
            >
              AI Translate
            </button>

            <button
              type="button"
              onClick={() => setTab("dual")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                tab === "dual"
                  ? "border-white bg-white text-black"
                  : "border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
              }`}
              aria-pressed={tab === "dual"}
            >
              Dual ASS Generator
            </button>
          </div>
        </header>

        {tab === "translate" && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="text-center">
              <h2 className="text-lg font-medium">AI Translation</h2>
              <p className="mt-1 text-sm text-zinc-300">
                Upload 1 SRT, get translated SRT (timings preserved).
              </p>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="text-sm font-medium text-zinc-200">Input</div>

                <label className="mt-3 block text-xs text-zinc-400">SRT file</label>
                <input
                  type="file"
                  accept=".srt"
                  className="mt-2 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  onChange={(e) => setTranslateFile(e.target.files?.[0] ?? null)}
                  disabled={isTranslating}
                />

                <p className="mt-2 text-xs text-zinc-400">UTF-8 recommended.</p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="text-sm font-medium text-zinc-200">Languages</div>

                <label className="mt-3 block text-xs text-zinc-400">From</label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="mt-2 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  disabled={isTranslating}
                >
                  {LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label} ({l.code})
                    </option>
                  ))}
                </select>

                <label className="mt-4 block text-xs text-zinc-400">To</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="mt-2 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  disabled={isTranslating}
                >
                  {LANGS.filter((x) => x.code !== "auto").map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <div className="text-sm font-medium text-zinc-200">Progress</div>

                <div className="mt-3">
                  <ProgressBar pct={progressPct} label={progressStage} />
                </div>

                <div className="mt-3 text-xs text-zinc-400">
                  {jobId ? `Job: ${jobId}` : "No job yet"}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                disabled={!canTranslate}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  !canTranslate
                    ? "cursor-not-allowed bg-zinc-700 text-zinc-300"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
                onClick={translateStart}
              >
                {isTranslating ? "Translating..." : "Translate and download"}
              </button>

              <button
                type="button"
                className="rounded-md border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                onClick={() => {
                  stopPolling();
                  setIsTranslating(false);
                  setJobId(null);
                  setProgressPct(0);
                  setProgressStage("Idle");
                  setTranslateError(null);
                  setTranslateInfo(null);
                  setTranslateFile(null);
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
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="text-center">
                <h2 className="text-lg font-medium">Preview</h2>
                <p className="mt-1 text-sm text-zinc-300">
                  Preview uses a fixed {PLAYRES_W}x{PLAYRES_H} canvas. Exported values are in 1080p pixels (ASS PlayRes).
                </p>
                <p className="mt-1 text-xs text-zinc-400">The on-page preview is scaled to match its current size.</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  disabled={!canGenerate || isGenerating}
                  className={`rounded-md px-4 py-2 text-sm font-medium ${
                    !canGenerate || isGenerating
                      ? "bg-zinc-700 text-zinc-300 cursor-not-allowed"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                  onClick={generateAss}
                >
                  {isGenerating ? "Generating..." : "Generate dual subtitles file"}
                </button>
              </div>

              {/* Header7: Fullscreen target (YouTube-like) */}
              {/* Description7: Fullscreen API on the preview stage, ESC exits */}
              <div className="mt-5 relative" ref={fullscreenTargetRef}>
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
                  className="absolute bottom-3 right-3 z-20 rounded-md border border-zinc-700 bg-zinc-950/70 px-2.5 py-2 text-zinc-100 backdrop-blur hover:bg-zinc-900/80"
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
                  <div className="pointer-events-none absolute top-3 left-3 z-20 rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-200 backdrop-blur">
                    Press Esc to exit fullscreen
                  </div>
                )}
              </div>

              <div className="mt-3 flex justify-center text-xs text-zinc-400">
                {!canGenerate ? "Upload both SRT files to enable generating." : "Ready to generate."}
              </div>

              {errorMsg && <p className="mt-2 text-center text-xs text-red-300">{errorMsg}</p>}
            </section>

            <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h2 className="text-lg font-medium">Settings</h2>
              <p className="mt-1 text-sm text-zinc-300">
                Choose font and adjust size/margins. Output keeps original timings from both SRT files.
              </p>

              <div className="mt-5 grid gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <div className="text-sm font-medium text-zinc-200">Files</div>

                  <div className="mt-3">
                    <label className="text-xs text-zinc-400">SRT (Top)</label>
                    <input
                      type="file"
                      accept=".srt"
                      className="mt-2 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                      onChange={(e) => setTopFile(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  <div className="mt-4">
                    <label className="text-xs text-zinc-400">SRT (Bottom)</label>
                    <input
                      type="file"
                      accept=".srt"
                      className="mt-2 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                      onChange={(e) => setBottomFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <div className="text-sm font-medium text-zinc-200">Font</div>

                  <label className="mt-3 block text-xs text-zinc-400">Font family</label>
                  <select
                    value={fontName}
                    onChange={(e) => setFontName(e.target.value as (typeof FONTS)[number])}
                    className="mt-2 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  >
                    {FONTS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs text-zinc-400">
                    The font must be installed on the device where you play the video.
                  </p>

                  <div className="mt-4">
                    <SliderRow label="Font size" value={fontSize} min={24} max={90} onChange={setFontSize} />
                  </div>
                </div>

                <div className="space-y-4">
                  <SliderRow
                    label="Top margin (distance from top)"
                    value={marginVTop}
                    min={0}
                    max={200}
                    onChange={setTopMargin}
                  />

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLinkMargins((v) => !v)}
                      className={`rounded-md border px-3 py-2 transition ${
                        linkMargins
                          ? "border-white bg-white text-black"
                          : "border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
                      }`}
                      title={linkMargins ? "Margins linked (click to unlink)" : "Margins separate (click to link)"}
                      aria-pressed={linkMargins}
                    >
                      <ChainIcon linked={linkMargins} />
                    </button>

                    <span className="text-xs text-zinc-400">
                      {linkMargins ? "Margins are linked" : "Margins are separate"}
                    </span>
                  </div>

                  <SliderRow
                    label="Bottom margin (distance from bottom)"
                    value={marginVBottom}
                    min={0}
                    max={200}
                    onChange={setBottomMargin}
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {/* Header8: JSON-LD structured data */}
        {/* Description8: SoftwareApplication + FAQPage for rich results */}
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
                    offers: {
                      "@type": "Offer",
                      price: "0",
                      priceCurrency: "USD",
                    },
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

        {/* Header9: SEO landing content */}
        {/* Description9: Adds readable content for Google without breaking UX */}
        <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-left">
          <h2 className="text-xl font-semibold text-zinc-100">What this tool does</h2>
          <p className="mt-3 text-zinc-300">
            DualSubs helps you create dual subtitles (two languages at once) and convert subtitles from SRT to ASS.
            You can also translate subtitles with AI while keeping the original timings.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Who is this for?</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-300">
                <li>Anime watchers who want original + translation on-screen</li>
                <li>Language learners combining native and target language</li>
                <li>Movie/TV translators who need quick bilingual output</li>
                <li>VLC and MPV users who want subtitles on top and bottom</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-semibold text-zinc-100">Why ASS instead of SRT?</h3>
              <p className="mt-2 text-zinc-300">
                SRT is simple and widely supported, but it cannot reliably position two languages at different screen
                locations. ASS supports styles, margins, and positioning, so you can keep one language at the top and
                the other at the bottom.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-base font-semibold text-zinc-100">Popular searches</h3>
            <p className="mt-2 text-zinc-300">
              dual subtitles VLC, two languages subtitles VLC, merge SRT files, SRT to ASS dual subtitles, anime dual subtitles,
              learn language with subtitles
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-base font-semibold text-zinc-100">Trust and privacy</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-300">
              <li>Your files are processed only to generate the output.</li>
              <li>No accounts required.</li>
              <li>If you need strict guarantees, consider self-hosting.</li>
            </ul>
          </div>
        </section>

        {/* Header10: Visible FAQ (matches FAQPage JSON-LD) */}
        {/* Description10: On-page FAQ content for users and SEO */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-left">
          <h2 className="text-xl font-semibold text-zinc-100">FAQ</h2>
          <div className="mt-4 space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <summary className="cursor-pointer text-zinc-100">{item.q}</summary>
                <p className="mt-2 text-zinc-300">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
