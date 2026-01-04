"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/status-banner";

export default function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = (formData.get("username") as string)?.trim();
    const password = (formData.get("password") as string) ?? "";

    if (!username || !password) {
      setMessage("Merci de renseigner les identifiants.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setMessage(data.error ?? "Échec de la connexion.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Erreur de connexion admin", error);
      setMessage("Une erreur est survenue, réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {message ? (
        <StatusBanner message={message} tone="error" onClose={() => setMessage(null)} />
      ) : null}

      <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
        Identifiant
        <input
          name="username"
          type="text"
          className="w-full rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="admin"
          autoComplete="username"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
        Mot de passe
        <input
          name="password"
          type="password"
          className="w-full rounded-xl border border-border bg-white px-3 py-2 text-base text-ink shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
