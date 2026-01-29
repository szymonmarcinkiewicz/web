// Header1: page.tsx (full file with SEO improvements)
// Description1: Adds SEO H1 + on-page content, meta tags (client fallback), canonical, JSON-LD (SoftwareApplication + FAQPage), and visible FAQ + trust signals.

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

///komentarz

const PLAYRES_W = 1920;
const PLAYRES_H = 1080;

type TabKey = "dual" | "translate";

// --- Header2: SEO constants (landing) ---
// --- Description2: Title, description, and FAQ data used for on-page SEO + JSON-LD
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
    a: "Files are processed to generate your output and are not intended to be stored long-term. If you need strict privacy guarantees, consider self-hosting.",
  },
];

// --- Header3: Meta helpers ---
// --- Description3: Utility functions to set meta tags client-side (fallback for a client page)
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
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "uk", label: "Ukrainian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
] as const;

type LangCode = (typeof LANGS)[number]["code"];

type JobStatus = "queued" | "running" | "done" | "error";

type TranslateStartResponse = {
  job_id: string;
};

type TranslateStatusResponse = {
  status: JobStatus;
  progress?: number;
  message?: string;
  download_url?: string;
};

type DualStartResponse = {
  job_id: string;
};

type DualStatusResponse = {
  status: JobStatus;
  progress?: number;
  message?: string;
  download_url?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatPercent(v: number | undefined) {
  if (typeof v !== "number" || Number.isNaN(v)) return "0%";
  return `${clamp(Math.round(v), 0, 100)}%`;
}

function ChainIcon({ linked }: { linked: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="inline-block"
      aria-hidden="true"
    >
      {linked ? (
        <path
          d="M10.59 13.41a1.996 1.996 0 0 0 2.82 0l2.83-2.83a2 2 0 0 0-2.83-2.83l-1.41 1.41"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <path
        d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={linked ? 0.4 : 1}
      />
    </svg>
  );
}

function SliderRow(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const { label, value, min, max, onChange } = props;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-zinc-200">{label}</div>
        <div className="min-w-[44px] text-right text-sm tabular-nums text-zinc-300">
          {value}
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full"
      />
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<TabKey>("translate");

  // --- Header4: SEO meta + canonical (client fallback) ---
  // --- Description4: Sets title/description/canonical + OpenGraph/Twitter tags. Best SEO is server metadata, but this helps now.
  useEffect(() => {
    document.title = SEO_TITLE;

    upsertMeta("description", SEO_DESCRIPTION);

    // Basic social previews (safe defaults)
    upsertProperty("og:title", SEO_TITLE);
    upsertProperty("og:description", SEO_DESCRIPTION);
    upsertProperty("og:type", "website");
    upsertProperty("twitter:card", "summary");
    upsertProperty("twitter:title", SEO_TITLE);
    upsertProperty("twitter:description", SEO_DESCRIPTION);

    // Canonical URL (current page)
    try {
      const url = new URL(window.location.href);
      upsertLink("canonical", `${url.origin}${url.pathname}`);
      upsertProperty("og:url", `${url.origin}${url.pathname}`);
    } catch {
      // ignore
    }
  }, []);

  // Translate tab state
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [fromLang, setFromLang] = useState<LangCode>("auto");
  const [toLang, setToLang] = useState<LangCode>("pl");
  const [tStatus, setTStatus] = useState<JobStatus | null>(null);
  const [tProgress, setTProgress] = useState<number>(0);
  const [tMessage, setTMessage] = useState<string>("");
  const [tError, setTError] = useState<string>("");
  const tPollRef = useRef<number | null>(null);

  // Dual tab state
  const [topFile, setTopFile] = useState<File | null>(null);
  const [bottomFile, setBottomFile] = useState<File | null>(null);

  const [fontName, setFontName] = useState<(typeof FONTS)[number]>("Arial");
  const [fontSize, setFontSize] = useState<number>(54);
  const [outline, setOutline] = useState<number>(2);
  const [shadow, setShadow] = useState<number>(0);
  const [marginL, setMarginL] = useState<number>(20);
  const [marginR, setMarginR] = useState<number>(20);
  const [marginVTop, setMarginVTop] = useState<number>(36);
  const [marginVBottom, setMarginVBottom] = useState<number>(36);
  const [linkMargins, setLinkMargins] = useState<boolean>(true);

  const [dStatus, setDStatus] = useState<JobStatus | null>(null);
  const [dProgress, setDProgress] = useState<number>(0);
  const [dMessage, setDMessage] = useState<string>("");
  const [dError, setDError] = useState<string>("");
  const dPollRef = useRef<number | null>(null);

  const canTranslate = useMemo(() => !!inputFile && !!API_BASE, [inputFile]);
  const canDual = useMemo(() => !!topFile && !!bottomFile && !!API_BASE, [topFile, bottomFile]);

  useEffect(() => {
    return () => {
      if (tPollRef.current) window.clearInterval(tPollRef.current);
      if (dPollRef.current) window.clearInterval(dPollRef.current);
    };
  }, []);

  function resetTranslate() {
    setInputFile(null);
    setTStatus(null);
    setTProgress(0);
    setTMessage("");
    setTError("");
    if (tPollRef.current) window.clearInterval(tPollRef.current);
    tPollRef.current = null;
  }

  function resetDual() {
    setTopFile(null);
    setBottomFile(null);
    setDStatus(null);
    setDProgress(0);
    setDMessage("");
    setDError("");
    if (dPollRef.current) window.clearInterval(dPollRef.current);
    dPollRef.current = null;
  }

  async function startTranslate() {
    setTError("");
    setTMessage("");
    setTStatus("queued");
    setTProgress(0);

    if (!API_BASE) {
      setTStatus("error");
      setTError("Missing NEXT_PUBLIC_API_BASE");
      return;
    }
    if (!inputFile) {
      setTStatus("error");
      setTError("Please pick an input SRT file.");
      return;
    }

    const fd = new FormData();
    fd.append("file", inputFile);
    fd.append("source_lang", fromLang);
    fd.append("target_lang", toLang);

    try {
      const r = await fetch(`${API_BASE}/v1/translate/start`, {
        method: "POST",
        body: fd,
      });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as TranslateStartResponse;
      setTStatus("running");
      pollTranslate(data.job_id);
    } catch (e: any) {
      setTStatus("error");
      setTError(e?.message || "Failed to start translation.");
    }
  }

  function pollTranslate(jobId: string) {
    if (tPollRef.current) window.clearInterval(tPollRef.current);

    tPollRef.current = window.setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/v1/translate/status/${jobId}`);
        if (!r.ok) throw new Error(await r.text());
        const data = (await r.json()) as TranslateStatusResponse;

        setTStatus(data.status);
        setTProgress(typeof data.progress === "number" ? data.progress : 0);
        setTMessage(data.message || "");

        if (data.status === "done" && data.download_url) {
          if (tPollRef.current) window.clearInterval(tPollRef.current);
          tPollRef.current = null;

          const d = await fetch(data.download_url);
          if (!d.ok) throw new Error(await d.text());
          const blob = await d.blob();
          const outName = inputFile?.name?.replace(/\.srt$/i, "") || "translated";
          downloadBlob(blob, `${outName}.${toLang}.srt`);
        }

        if (data.status === "error") {
          if (tPollRef.current) window.clearInterval(tPollRef.current);
          tPollRef.current = null;
        }
      } catch (e: any) {
        setTStatus("error");
        setTError(e?.message || "Failed to fetch status.");
        if (tPollRef.current) window.clearInterval(tPollRef.current);
        tPollRef.current = null;
      }
    }, 1500);
  }

  async function startDual() {
    setDError("");
    setDMessage("");
    setDStatus("queued");
    setDProgress(0);

    if (!API_BASE) {
      setDStatus("error");
      setDError("Missing NEXT_PUBLIC_API_BASE");
      return;
    }
    if (!topFile || !bottomFile) {
      setDStatus("error");
      setDError("Please pick both SRT files.");
      return;
    }

    const payload = {
      font_name: fontName,
      font_size: fontSize,
      outline: outline,
      shadow: shadow,
      margin_l: marginL,
      margin_r: marginR,
      margin_v_top: marginVTop,
      margin_v_bottom: marginVBottom,
      playres_w: PLAYRES_W,
      playres_h: PLAYRES_H,
    };

    const fd = new FormData();
    fd.append("top_file", topFile);
    fd.append("bottom_file", bottomFile);
    fd.append("settings_json", JSON.stringify(payload));

    try {
      const r = await fetch(`${API_BASE}/v1/dual/start`, {
        method: "POST",
        body: fd,
      });
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as DualStartResponse;
      setDStatus("running");
      pollDual(data.job_id);
    } catch (e: any) {
      setDStatus("error");
      setDError(e?.message || "Failed to start merge.");
    }
  }

  function pollDual(jobId: string) {
    if (dPollRef.current) window.clearInterval(dPollRef.current);

    dPollRef.current = window.setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/v1/dual/status/${jobId}`);
        if (!r.ok) throw new Error(await r.text());
        const data = (await r.json()) as DualStatusResponse;

        setDStatus(data.status);
        setDProgress(typeof data.progress === "number" ? data.progress : 0);
        setDMessage(data.message || "");

        if (data.status === "done" && data.download_url) {
          if (dPollRef.current) window.clearInterval(dPollRef.current);
          dPollRef.current = null;

          const d = await fetch(data.download_url);
          if (!d.ok) throw new Error(await d.text());
          const blob = await d.blob();

          const topName = topFile?.name?.replace(/\.srt$/i, "") || "top";
          const bottomName = bottomFile?.name?.replace(/\.srt$/i, "") || "bottom";
          downloadBlob(blob, `${topName}__${bottomName}.ass`);
        }

        if (data.status === "error") {
          if (dPollRef.current) window.clearInterval(dPollRef.current);
          dPollRef.current = null;
        }
      } catch (e: any) {
        setDStatus("error");
        setDError(e?.message || "Failed to fetch status.");
        if (dPollRef.current) window.clearInterval(dPollRef.current);
        dPollRef.current = null;
      }
    }, 1500);
  }

  const setLeftMargin = (v: number) => {
    setMarginL(v);
    if (linkMargins) setMarginR(v);
  };

  const setRightMargin = (v: number) => {
    setMarginR(v);
    if (linkMargins) setMarginL(v);
  };

  const setTopMargin = (v: number) => {
    setMarginVTop(v);
    if (linkMargins) setMarginVBottom(v);
  };

  const setBottomMargin = (v: number) => {
    setMarginVBottom(v);
    if (linkMargins) setMarginVTop(v);
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-6 text-center">
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

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          {tab === "translate" && (
            <>
              <section className="space-y-6">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
                  <div className="text-lg font-semibold">AI Translation</div>
                  <div className="mt-2 text-sm text-zinc-400">
                    Upload 1 SRT, get translated SRT (timings preserved).
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
                    <div className="mb-2 text-sm font-medium text-zinc-200">
                      Input
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-zinc-400">SRT file</div>
                      <input
                        type="file"
                        accept=".srt"
                        onChange={(e) =>
                          setInputFile(e.target.files?.[0] || null)
                        }
                        className="w-full text-sm"
                      />
                      <div className="text-xs text-zinc-500">
                        UTF-8 recommended.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
                    <div className="mb-2 text-sm font-medium text-zinc-200">
                      Languages
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-zinc-400">From</div>
                        <select
                          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100"
                          value={fromLang}
                          onChange={(e) => setFromLang(e.target.value as LangCode)}
                        >
                          {LANGS.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="text-xs text-zinc-400">To</div>
                        <select
                          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100"
                          value={toLang}
                          onChange={(e) => setToLang(e.target.value as LangCode)}
                        >
                          {LANGS.filter((l) => l.code !== "auto").map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
                  <div className="mb-2 text-sm font-medium text-zinc-200">
                    Progress
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>{tStatus ? tStatus : "No job yet"}</span>
                      <span>{formatPercent(tProgress)}</span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-zinc-800">
                      <div
                        className="h-2 rounded-full bg-white"
                        style={{ width: formatPercent(tProgress) }}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="text-xs text-zinc-400">
                      {tMessage || "No job yet"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      canTranslate
                        ? "bg-white text-black hover:bg-zinc-200"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                    onClick={startTranslate}
                    disabled={!canTranslate || tStatus === "running" || tStatus === "queued"}
                  >
                    Translate and download
                  </button>

                  <button
                    type="button"
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                    onClick={resetTranslate}
                  >
                    Reset
                  </button>
                </div>

                {tError && (
                  <div className="text-sm text-red-400">{tError}</div>
                )}
              </section>
            </>
          )}

          {tab === "dual" && (
            <>
              <section className="space-y-6">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
                  <div className="text-lg font-semibold">Dual ASS Generator</div>
                  <div className="mt-2 text-sm text-zinc-400">
                    Upload 2 SRT files and generate a single ASS with top + bottom styles.
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
                    <div className="mb-2 text-sm font-medium text-zinc-200">
                      Inputs
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-zinc-400">Top SRT</div>
                        <input
                          type="file"
                          accept=".srt"
                          onChange={(e) =>
                            setTopFile(e.target.files?.[0] || null)
                          }
                          className="mt-1 w-full text-sm"
                        />
                      </div>

                      <div>
                        <div className="text-xs text-zinc-400">Bottom SRT</div>
                        <input
                          type="file"
                          accept=".srt"
                          onChange={(e) =>
                            setBottomFile(e.target.files?.[0] || null)
                          }
                          className="mt-1 w-full text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
                    <div className="mb-2 text-sm font-medium text-zinc-200">
                      Progress
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>{dStatus ? dStatus : "No job yet"}</span>
                        <span>{formatPercent(dProgress)}</span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-zinc-800">
                        <div
                          className="h-2 rounded-full bg-white"
                          style={{ width: formatPercent(dProgress) }}
                          aria-hidden="true"
                        />
                      </div>

                      <div className="text-xs text-zinc-400">
                        {dMessage || "No job yet"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      canDual
                        ? "bg-white text-black hover:bg-zinc-200"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                    onClick={startDual}
                    disabled={!canDual || dStatus === "running" || dStatus === "queued"}
                  >
                    Generate and download
                  </button>

                  <button
                    type="button"
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                    onClick={resetDual}
                  >
                    Reset
                  </button>
                </div>

                {dError && (
                  <div className="text-sm text-red-400">{dError}</div>
                )}

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-semibold text-zinc-200">
                      Style settings
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-2 text-zinc-200 hover:bg-zinc-900"
                        onClick={() => setLinkMargins((v) => !v)}
                        title={linkMargins ? "Margins linked (click to unlink)" : "Margins separate (click to link)"}
                        aria-pressed={linkMargins}
                      >
                        <ChainIcon linked={linkMargins} />
                      </button>

                      <span className="text-xs text-zinc-400">
                        {linkMargins ? "Margins are linked" : "Margins are separate"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-zinc-400">Font</div>
                        <select
                          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100"
                          value={fontName}
                          onChange={(e) => setFontName(e.target.value as (typeof FONTS)[number])}
                        >
                          {FONTS.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>

                      <SliderRow
                        label="Font size"
                        value={fontSize}
                        min={24}
                        max={96}
                        onChange={setFontSize}
                      />
                      <SliderRow
                        label="Outline"
                        value={outline}
                        min={0}
                        max={10}
                        onChange={setOutline}
                      />
                      <SliderRow
                        label="Shadow"
                        value={shadow}
                        min={0}
                        max={10}
                        onChange={setShadow}
                      />
                    </div>

                    <div className="space-y-4">
                      <SliderRow
                        label="Left margin"
                        value={marginL}
                        min={0}
                        max={200}
                        onChange={setLeftMargin}
                      />
                      <SliderRow
                        label="Right margin"
                        value={marginR}
                        min={0}
                        max={200}
                        onChange={setRightMargin}
                      />
                      <SliderRow
                        label="Top margin (distance from top)"
                        value={marginVTop}
                        min={0}
                        max={200}
                        onChange={setTopMargin}
                      />
                      <SliderRow
                        label="Bottom margin (distance from bottom)"
                        value={marginVBottom}
                        min={0}
                        max={200}
                        onChange={setBottomMargin}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* --- Header5: JSON-LD structured data --- */}
        {/* --- Description5: Helps search engines understand this page as a tool + exposes FAQ rich results. */}
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

        {/* --- Header6: SEO landing content (under the tool) --- */}
        {/* --- Description6: Adds readable content for Google without hurting the UX. */}
        <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-left">
          <h2 className="text-xl font-semibold text-zinc-100">What this tool does</h2>
          <p className="mt-3 text-zinc-300">
            DualSubs helps you create dual subtitles (two languages at once) and convert subtitles from SRT to ASS. You can also translate subtitles with AI while keeping the original timings.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Who is this for?</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-300">
                <li>Anime watchers who want JP/EN (or any pair) on-screen</li>
                <li>Language learners combining native + target language</li>
                <li>Movie/TV translators who need quick bilingual output</li>
                <li>VLC / MPV users who want subtitles on top and bottom</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-semibold text-zinc-100">Why ASS instead of SRT?</h3>
              <p className="mt-2 text-zinc-300">
                SRT is simple and widely supported, but it cannot reliably position two languages at different screen locations. ASS supports styles, margins, and positioning, so you can keep one language at the top and the other at the bottom.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-base font-semibold text-zinc-100">Popular searches (long-tail)</h3>
            <p className="mt-2 text-zinc-300">
              dual subtitles VLC, two languages subtitles VLC, merge SRT files, SRT to ASS dual subtitles, anime dual subtitles, learn language with subtitles
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

        {/* --- Header7: FAQ (visible content) --- */}
        {/* --- Description7: On-page FAQ + matches the FAQPage JSON-LD. */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-left">
          <h2 className="text-xl font-semibold text-zinc-100">FAQ</h2>
          <div className="mt-4 space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"
              >
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
