"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const PROVIDERS = [
  {
    id: "ent" as const,
    label: "ENT",
    envKey: "NEXT_PUBLIC_ENT_URL",
  },
  {
    id: "pronote" as const,
    label: "Pronote",
    envKey: "NEXT_PUBLIC_PRONOTE_URL",
  },
];

type ProviderId = (typeof PROVIDERS)[number]["id"];

type ProviderInfo = {
  id: ProviderId;
  label: string;
  url: string;
};

const STORAGE_KEY = "connect_ent_last_provider";

export default function ConnectEntClient() {
  const loadedRef = useRef(false);
  const [selectedId, setSelectedId] = useState<ProviderId>("ent");
  const [activeUrl, setActiveUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const providers = useMemo<ProviderInfo[]>(
    () =>
      PROVIDERS.map((provider) => ({
        id: provider.id,
        label: provider.label,
        url: process.env[provider.envKey] ?? "",
      })),
    []
  );

  const selectedProvider = providers.find((p) => p.id === selectedId) ?? providers[0];
  const hasUrl = Boolean(selectedProvider?.url);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as ProviderId | null;
    if (saved && PROVIDERS.some((p) => p.id === saved)) {
      setSelectedId(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!activeUrl) {
      setIsLoading(false);
      setIsBlocked(false);
      setHasLoaded(false);
      loadedRef.current = false;
      return;
    }

    setIsLoading(true);
    setIsBlocked(false);
    setHasLoaded(false);
    loadedRef.current = false;

    const timeoutId = window.setTimeout(() => {
      setIsLoading(false);
      if (!loadedRef.current) {
        setIsBlocked(true);
      }
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeUrl]);

  const handleContinue = () => {
    if (!selectedProvider?.url) return;
    setActiveUrl(selectedProvider.url);
  };

  const handleOpenExternal = () => {
    if (!selectedProvider?.url) return;
    window.open(selectedProvider.url, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    if (!selectedProvider?.url) return;
    try {
      await navigator.clipboard.writeText(selectedProvider.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Connexion ENT / Pronote</h1>
        <p className="mt-2 text-sm text-slate-600">
          Certains portails ENT/Pronote bloquent l&apos;intégration dans une iframe pour des raisons de
          sécurité. Dans ce cas, vous pourrez ouvrir la connexion dans un nouvel onglet.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Fournisseur</h2>
          <div className="mt-4 flex flex-col gap-3">
            {providers.map((provider) => (
              <label
                key={provider.id}
                className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition hover:border-slate-400 ${
                  selectedId === provider.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <span>{provider.label}</span>
                <input
                  type="radio"
                  name="provider"
                  value={provider.id}
                  className="sr-only"
                  checked={selectedId === provider.id}
                  onChange={() => setSelectedId(provider.id)}
                />
              </label>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <div className="font-medium text-slate-700">URL configurée</div>
            <div className="mt-1 break-all">
              {hasUrl ? selectedProvider.url : "Aucune URL définie"}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!hasUrl}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                hasUrl
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "cursor-not-allowed bg-slate-200 text-slate-500"
              }`}
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={handleOpenExternal}
              disabled={!hasUrl}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                hasUrl
                  ? "border-slate-300 text-slate-700 hover:border-slate-500"
                  : "cursor-not-allowed border-slate-200 text-slate-400"
              }`}
            >
              Ouvrir dans un nouvel onglet
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!hasUrl}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                hasUrl
                  ? "border-slate-300 text-slate-700 hover:border-slate-500"
                  : "cursor-not-allowed border-slate-200 text-slate-400"
              }`}
            >
              {copied ? "Lien copié" : "Copier le lien"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Aperçu</h2>
            <span className="text-xs text-slate-400">70vh</span>
          </div>

          <div className="mt-4 min-h-[360px] rounded-2xl border border-slate-100 bg-slate-50 p-4">
            {!activeUrl && (
              <div className="flex h-full flex-col items-center justify-center text-sm text-slate-500">
                Sélectionnez un fournisseur puis cliquez sur Continuer.
              </div>
            )}

            {activeUrl && isLoading && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-slate-500">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                Chargement de la page…
              </div>
            )}

            {activeUrl && isBlocked && (
              <div className="flex h-full flex-col items-start justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <div className="text-base font-semibold text-red-800">Intégration bloquée</div>
                <p>
                  Ce portail empêche l&apos;affichage dans une iframe. Utilisez le bouton ci-dessous pour ouvrir
                  la connexion dans un nouvel onglet.
                </p>
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
                >
                  Ouvrir dans un nouvel onglet
                </button>
              </div>
            )}

            {activeUrl && !isBlocked && (
              <iframe
                key={activeUrl}
                src={activeUrl}
                title="Connexion ENT"
                className={`h-[70vh] w-full rounded-xl border border-slate-200 bg-white ${
                  isLoading ? "opacity-60" : "opacity-100"
                }`}
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                onLoad={() => {
                  loadedRef.current = true;
                  setHasLoaded(true);
                  setIsLoading(false);
                  setIsBlocked(false);
                }}
                onError={() => {
                  setIsLoading(false);
                  setIsBlocked(true);
                }}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
