"use client";

import Image from "next/image";
import Link from "next/link";

type GoogleFcApi = {
  callbackQueue?: Array<() => void>;
  showRevocationMessage?: () => void;
};

function openPrivacySettings() {
  const googlefc = (window as Window & { googlefc?: GoogleFcApi }).googlefc;

  if (googlefc?.callbackQueue && googlefc.showRevocationMessage) {
    googlefc.callbackQueue.push(googlefc.showRevocationMessage);
    return;
  }

  alert("Privacy and cookie settings are available after the consent message loads.");
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050607] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(37,99,235,0.18),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(239,68,68,0.12),transparent_28%)]" />

      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <header className="border-b border-white/10 pb-6">
          <Link href="/" className="flex w-fit items-center gap-3">
            <Image
              src="/Logo.png"
              alt="DualSubs"
              width={44}
              height={44}
              className="h-11 w-11 rounded-xl border border-white/10 object-cover shadow-[0_0_24px_rgba(59,130,246,0.16)]"
            />
            <span className="text-sm font-semibold tracking-[0.22em] text-blue-400/80">DualSubs</span>
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-zinc-50">Privacy Policy</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Effective date: May 5, 2026</p>
        </header>

        <section className="mt-8 space-y-7 text-sm leading-7 text-zinc-400">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Overview</h2>
            <p className="mt-2">
              DualSubs provides browser-based tools for translating subtitle files and creating dual subtitle files.
              This policy explains what information may be processed when you use the site.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Subtitle files</h2>
            <p className="mt-2">
              Files you upload are sent to our backend only to generate the requested output, such as translated SRT
              files or merged ASS subtitle files. Do not upload files that contain sensitive personal information.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Advertising and cookies</h2>
            <p className="mt-2">
              We use Google AdSense to show ads. Google and its partners may use cookies, local storage, device
              identifiers, and similar technologies to provide, measure, and personalize ads where permitted by your
              consent and applicable law.
            </p>
            <p className="mt-2">
              Visitors in regions where consent is required may see a Google consent message. You can revisit your
              choices using the button below.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Analytics and technical data</h2>
            <p className="mt-2">
              Our hosting and backend providers may process technical data such as IP address, browser information,
              request URLs, timestamps, and error logs to operate, secure, and debug the service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Third-party services</h2>
            <p className="mt-2">
              The site may use third-party providers for hosting, backend processing, AI translation, and advertising.
              These providers process data according to their own terms and privacy policies.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Your choices</h2>
            <p className="mt-2">
              You can avoid uploading files that contain personal data, use browser controls to manage cookies, and
              revisit advertising consent choices where available.
            </p>
            <button
              type="button"
              onClick={openPrivacySettings}
              className="mt-4 rounded-lg border border-blue-400/60 bg-blue-400 px-4 py-2 text-sm font-medium text-zinc-950 shadow-[0_0_28px_rgba(59,130,246,0.22)] transition hover:bg-blue-100"
            >
              Privacy and cookie settings
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Contact</h2>
            <p className="mt-2">
              For privacy questions, contact the site owner through the contact channel published with the DualSubs
              project or domain registration.
            </p>
          </div>
        </section>

        <footer className="mt-10 border-t border-white/10 pt-6 text-sm text-zinc-500">
          <Link href="/" className="transition hover:text-blue-400">
            Back to DualSubs
          </Link>
        </footer>
      </div>
    </main>
  );
}

