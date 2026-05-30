"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEclipse } from "@/context/EclipseProvider";
import { IconEclipse } from "@/components/icons";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { hydrated, currentUser, login, signup } = useEclipse();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && currentUser) {
      router.replace("/");
    }
  }, [hydrated, currentUser, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const err =
      mode === "login"
        ? await login(username, password)
        : await signup(username, password, avatarUrl || undefined);

    setSubmitting(false);

    if (err) {
      setError(err);
      return;
    }
    router.replace("/");
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-8 safe-top safe-bottom">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-indigo-600/20 blur-[100px]" />
        <div className="absolute -right-32 bottom-1/4 h-64 w-64 rounded-full bg-cyan-500/15 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <IconEclipse className="h-12 w-12" />
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-300 via-slate-100 to-cyan-300 bg-clip-text text-transparent">
            Eclipse
          </h1>
          <p className="text-sm text-slate-500">
            Sign in with your database account
          </p>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glow md:p-8">
          <div className="mb-6 flex rounded-xl border border-slate-800 bg-slate-950/50 p-1">
            {(["login", "signup"] as AuthMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold capitalize transition ${
                  mode === m
                    ? "bg-indigo-600 text-white shadow-glow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-slate-400">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                required
                autoComplete="username"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3.5 text-[15px] text-slate-100 placeholder:text-slate-600 focus:border-indigo-500/60 focus:shadow-glow"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3.5 text-[15px] text-slate-100 placeholder:text-slate-600 focus:border-indigo-500/60 focus:shadow-glow"
              />
            </div>

            {mode === "signup" && (
              <div>
                <label htmlFor="avatarUrl" className="mb-1.5 block text-xs font-medium text-slate-400">
                  Avatar URL (optional)
                </label>
                <input
                  id="avatarUrl"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3.5 text-[15px] text-slate-100 placeholder:text-slate-600 focus:border-indigo-500/60 focus:shadow-glow"
                />
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-3.5 text-[15px] font-semibold text-white shadow-glow transition hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] disabled:opacity-60"
            >
              {submitting
                ? "Please wait..."
                : mode === "login"
                  ? "Enter Eclipse"
                  : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
