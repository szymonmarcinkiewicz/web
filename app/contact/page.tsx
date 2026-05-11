import Image from "next/image";
import Link from "next/link";

const CONTACT_EMAIL = "szymon.marcinkiewicz0@gmail.com";

export default function ContactPage() {
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
          <h1 className="mt-4 text-3xl font-semibold text-zinc-50">Contact</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Send suggestions, bug reports, and feedback about DualSubs.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-950/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Get in touch</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            If something breaks, a translation looks wrong, or you have an idea for improving the tool, send an email.
          </p>

          <a
            href={`mailto:${CONTACT_EMAIL}?subject=DualSubs%20feedback`}
            className="mt-5 inline-flex rounded-lg border border-blue-400/60 bg-blue-400 px-4 py-2 text-sm font-medium text-zinc-950 shadow-[0_0_28px_rgba(59,130,246,0.22)] transition hover:bg-blue-100"
          >
            {CONTACT_EMAIL}
          </a>
        </section>

        <footer className="mt-10 flex flex-wrap gap-4 border-t border-white/10 pt-6 text-sm text-zinc-500">
          <Link href="/" className="transition hover:text-blue-400">
            Back to DualSubs
          </Link>
          <Link href="/privacy" className="transition hover:text-blue-400">
            Privacy Policy
          </Link>
        </footer>
      </div>
    </main>
  );
}
