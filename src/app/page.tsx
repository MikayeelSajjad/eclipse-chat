import Link from "next/link";
import { IconEclipse } from "@/components/icons";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-indigo-600/25 blur-[120px]" />
        <div className="absolute -right-40 bottom-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <IconEclipse className="h-8 w-8" />
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Eclipse
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/nitro"
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            Nitro
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-indigo-500"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-16">
        <section className="text-center md:max-w-3xl md:mx-auto">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-4 py-1.5 text-sm text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            End-to-end encrypted — not like Instagram
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Private chat & groups.
            <span className="block bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Your keys. Your words.
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-400">
            Eclipse encrypts messages on your device before they leave your phone.
            The server only sees ciphertext — unlike mainstream social apps that
            read everything in plain text.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 py-4 text-base font-semibold text-white shadow-glow"
            >
              Create free account
            </Link>
            <Link
              href="/chat"
              className="rounded-2xl border border-slate-700 px-8 py-4 text-base font-semibold text-slate-200 hover:border-slate-500"
            >
              Open app
            </Link>
          </div>
        </section>

        <section className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "E2E direct messages",
              body: "ECDH + AES-GCM. Only you and your friend can read DMs.",
            },
            {
              title: "Encrypted group chats",
              body: "Create private groups with Nitro. Shared group keys wrapped per member.",
            },
            {
              title: "Nitro upgrades",
              body: "More friends, group creation, and support the project.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="glass rounded-2xl border border-slate-800/80 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-100">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{card.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-24 rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-center md:text-3xl">Nitro plans</h2>
          <p className="mt-2 text-center text-slate-400">
            Upgrade inside the app after you sign in.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
              <h3 className="text-xl font-bold text-indigo-300">Nitro Basic</h3>
              <p className="mt-1 text-3xl font-bold">$1.99<span className="text-base font-normal text-slate-500">/mo</span></p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>Friends: 20 → 40</li>
                <li>Create encrypted groups</li>
                <li>Invite friends to groups</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/50 p-6 ring-1 ring-cyan-500/20">
              <h3 className="text-xl font-bold text-cyan-300">Nitro+</h3>
              <p className="mt-1 text-3xl font-bold">$4.99<span className="text-base font-normal text-slate-500">/mo</span></p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>Friends: 40 → 60</li>
                <li>Everything in Nitro Basic</li>
                <li>Best for power users</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/nitro"
              className="inline-flex rounded-xl bg-cyan-600 px-6 py-3 font-semibold text-white hover:bg-cyan-500"
            >
              View Nitro & subscribe
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        Eclipse — encrypted chat. Built for people who want privacy, not feeds.
      </footer>
    </div>
  );
}
