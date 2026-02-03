"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const SEARCH_ENGINE = "https://duckduckgo.com/html/?q=";
const QR_CODE_URL = "/qr/scan.svg";
const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL || "https://apps.apple.com/app/id0000000000";

const MICRO_COPY = [
  "Extraction des salles…",
  "Analyse des matières…",
  "Optimisation de tes pauses…",
  "Création des coefficients…",
  "Assemblage du planning…",
];

type Step = "landing" | "webview" | "voice" | "wait" | "reveal";

type ScanResult = {
  subjects?: Array<{ name: string; coefficient: number; ue?: string }>;
  schedule?: Array<{
    day: string;
    start: string;
    end: string;
    subject: string;
    location?: string;
    teacher?: string;
  }>;
  summary?: string;
};

function resolveUrlFromQuery(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return `${SEARCH_ENGINE}${encodeURIComponent("ENT Pronote")}`;
  const looksLikeUrl = trimmed.includes(".") && !trimmed.includes(" ");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (looksLikeUrl) {
    return `https://${trimmed}`;
  }
  return `${SEARCH_ENGINE}${encodeURIComponent(trimmed)}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ScanClient() {
  const [step, setStep] = useState<Step>("landing");
  const [query, setQuery] = useState("");
  const [activeUrl, setActiveUrl] = useState(resolveUrlFromQuery(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const loadedRef = useRef(false);
  const [email, setEmail] = useState("");
  const [progress, setProgress] = useState(0);
  const [copyIndex, setCopyIndex] = useState(0);
  const sessionIdRef = useRef<string | null>(null);
  const attributionRef = useRef<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const [qrOpen, setQrOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const qrControlsRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const attribution = {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
      entry: params.get("entry"),
      ts: new Date().toISOString(),
    };
    const serialized = JSON.stringify(attribution);
    attributionRef.current = serialized;
    window.localStorage.setItem("scan_attribution", serialized);

    const sessionId =
      window.crypto?.randomUUID?.() ||
      `scan_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
    sessionIdRef.current = sessionId;
    window.localStorage.setItem("scan_session_id", sessionId);
  }, []);

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  useEffect(() => {
    if (step !== "webview") return;
    setIsLoading(true);
    setIsBlocked(false);
    loadedRef.current = false;

    const timeoutId = window.setTimeout(() => {
      if (!loadedRef.current) {
        setIsLoading(false);
        setIsBlocked(true);
      }
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [step, activeUrl]);

  useEffect(() => {
    if (step !== "wait") return;
    setProgress(0);
    setCopyIndex(0);

    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        if (isSubmitting) {
          return Math.min(95, current + 2);
        }
        if (current >= 90) return 90;
        return Math.min(90, current + 4);
      });
    }, 220);

    const copyTimer = window.setInterval(() => {
      setCopyIndex((current) => (current + 1) % MICRO_COPY.length);
    }, 1400);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(copyTimer);
    };
  }, [step, isSubmitting]);

  useEffect(() => {
    if (!qrOpen) return;
    let isActive = true;

    const startScanner = async () => {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      if (!videoRef.current || !isActive) return;
      qrControlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (!result) return;
          const text = result.getText();
          setQuery(text);
          const url = resolveUrlFromQuery(text);
          setActiveUrl(url);
          setStep("webview");
          setQrOpen(false);
          if (qrControlsRef.current) {
            qrControlsRef.current.stop();
          }
        }
      );
    };

    startScanner();

    return () => {
      isActive = false;
      if (qrControlsRef.current) {
        qrControlsRef.current.stop();
        qrControlsRef.current = null;
      }
    };
  }, [qrOpen]);

  const handleSearch = () => {
    const url = resolveUrlFromQuery(query);
    setActiveUrl(url);
    setIsBlocked(false);
  };

  const handleSelectFile = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setUploadError(null);
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
  };

  const handleCapture = () => {
    if (!selectedFile) {
      setUploadError("Ajoute une capture d’écran de ton planning pour continuer.");
      return;
    }
    setStep("wait");
  };

  const handleEmailSubmit = async () => {
    if (!isValidEmail(email) || !selectedFile || isSubmitting) return;
    setUploadError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("email", email);
      if (sessionIdRef.current) formData.append("sessionId", sessionIdRef.current);
      if (query) formData.append("query", query);
      if (activeUrl) formData.append("sourceUrl", activeUrl);
      if (attributionRef.current) formData.append("attribution", attributionRef.current);

      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Erreur lors de l'analyse");
      }

      const data = await response.json();
      setResult(data.result);
      setProgress(100);
      window.setTimeout(() => setStep("reveal"), 800);
    } catch (error) {
      setUploadError(String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const appStoreLink = useMemo(() => {
    const url = new URL(APP_STORE_URL);
    if (sessionIdRef.current) {
      url.searchParams.set("scan_id", sessionIdRef.current);
    }
    return url.toString();
  }, []);

  useEffect(() => {
    if (step !== "reveal") return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.05;
    oscillator.connect(gainNode).connect(audioContext.destination);
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 140);
  }, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Productif Hybrid Scan</p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Ton emploi du temps, version cerveau.
          </h1>
          <p className="max-w-2xl text-base text-emerald-100/80">
            Scanne ton ENT, on transforme ton planning en un agenda personnalisé avec matières, coefficients et
            routines intelligentes.
          </p>
        </header>

        {step === "landing" && (
          <section className="grid gap-8 rounded-3xl border border-emerald-200/20 bg-white/5 p-6 backdrop-blur md:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Prêt à importer ton planning ?</h2>
                <p className="text-sm text-emerald-100/70">
                  Choisis ton point d&apos;entrée, puis laisse Productif générer ton planning idéal.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setStep("webview")}
                  className="rounded-2xl bg-emerald-400 px-6 py-4 text-base font-semibold text-emerald-950 transition hover:translate-y-[-1px] hover:bg-emerald-300"
                >
                  Scanner mon emploi du temps
                </button>
                <button
                  type="button"
                  onClick={() => setStep("voice")}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white"
                >
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                  Ou configure-le à la voix
                </button>
                <button
                  type="button"
                  onClick={() => setQrOpen(true)}
                  className="text-xs font-semibold text-emerald-200/80 underline underline-offset-4"
                >
                  Scanner un QR
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">QR Code</p>
              <img
                src={QR_CODE_URL}
                alt="QR code vers productif.io/scan"
                className="h-48 w-48 rounded-xl border border-white/10 bg-white p-3"
              />
              <p className="text-xs text-emerald-100/70">
                Affiche-le sur tes supports physiques pour rediriger directement vers ce scan.
              </p>
            </div>
          </section>
        )}

        {step === "webview" && (
          <section className="grid gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ex: ent moma"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSearch();
                  }}
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950"
                >
                  Rechercher
                </button>
              </div>
              <button
                type="button"
                onClick={() => window.open(activeUrl, "_blank", "noopener,noreferrer")}
                className="rounded-2xl border border-white/20 px-4 py-3 text-xs font-semibold text-white/80"
              >
                Ouvrir dans un nouvel onglet
              </button>
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                className="rounded-2xl border border-white/20 px-4 py-3 text-xs font-semibold text-white/80"
              >
                Scanner un QR
              </button>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-emerald-200/20 bg-white/5">
              {isBlocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/70 p-8 text-center">
                  <p className="text-base font-semibold">L&apos;ENT bloque l&apos;intégration.</p>
                  <p className="text-sm text-white/70">
                    Ouvre l&apos;ENT dans un nouvel onglet, puis reviens ici.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.open(activeUrl, "_blank", "noopener,noreferrer")}
                    className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950"
                  >
                    Ouvrir l&apos;ENT
                  </button>
                </div>
              )}
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-transparent" />
                </div>
              )}
              <iframe
                key={activeUrl}
                src={activeUrl}
                title="Connexion ENT"
                className="h-[70vh] w-full bg-white"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                onLoad={() => {
                  loadedRef.current = true;
                  setIsLoading(false);
                  setIsBlocked(false);
                }}
                onError={() => {
                  setIsLoading(false);
                  setIsBlocked(true);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-6 right-6 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-emerald-950 shadow-lg"
              >
                C&apos;est ma page, scanne !
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleSelectFile(event.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white/80"
              >
                Importer une capture
              </button>
              {selectedFile && (
                <span className="text-xs text-emerald-200">{selectedFile.name}</span>
              )}
              {filePreview && (
                <img
                  src={filePreview}
                  alt="Capture sélectionnée"
                  className="h-12 w-12 rounded-lg border border-white/10 object-cover"
                />
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
              <p className="font-semibold text-white">Comment faire la capture ?</p>
              <p className="mt-2">
                Connecte-toi sur l&apos;ENT dans la fenêtre ci-dessus, affiche ton planning complet, puis
                fais une capture d&apos;écran et importe-la ici. On ne peut pas capturer automatiquement une
                page ENT (sécurité navigateur).
              </p>
            </div>

            {uploadError && <p className="text-sm text-rose-200">{uploadError}</p>}

            <button
              type="button"
              onClick={handleCapture}
              className={`w-full rounded-2xl px-6 py-4 text-sm font-semibold ${
                selectedFile
                  ? "bg-white text-emerald-950"
                  : "cursor-not-allowed bg-white/10 text-white/40"
              }`}
            >
              Importe ton emploi du temps
            </button>
          </section>
        )}

        {step === "voice" && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-semibold">Dis-nous ta promo</h2>
                <p className="text-sm text-white/70">
                  Dicte ta formation et on retrouve le planning correspondant.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span
                    key={index}
                    className="inline-flex w-2 animate-pulse rounded-full bg-emerald-300"
                    style={{ height: `${12 + (index % 5) * 6}px`, animationDelay: `${index * 120}ms` }}
                  />
                ))}
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ex: MOMA 2026, L2 économie..."
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUploadError("Le flux vocal arrive bientôt. Utilise la capture pour l'instant.");
                    setStep("webview");
                  }}
                  className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-emerald-950"
                >
                  Lancer l&apos;analyse
                </button>
                <button
                  type="button"
                  onClick={() => setStep("landing")}
                  className="rounded-2xl border border-white/20 px-6 py-3 text-sm text-white/80"
                >
                  Revenir
                </button>
              </div>
            </div>
          </section>
        )}

        {step === "wait" && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-semibold">On prépare ton planning</h2>
                <p className="text-sm text-white/70">{MICRO_COPY[copyIndex]}</p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-300 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-sm text-white/80">
                  C&apos;est presque prêt. Laisse ton mail pour recevoir ton accès privé.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ton@email.fr"
                    className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/50"
                  />
                  <button
                    type="button"
                    onClick={handleEmailSubmit}
                    disabled={!isValidEmail(email) || !selectedFile || isSubmitting}
                    className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                      isValidEmail(email) && selectedFile && !isSubmitting
                        ? "bg-emerald-400 text-emerald-950"
                        : "cursor-not-allowed bg-white/10 text-white/40"
                    }`}
                  >
                    {isSubmitting ? "Analyse…" : "Terminer"}
                  </button>
                </div>
                {uploadError && <p className="mt-3 text-sm text-rose-200">{uploadError}</p>}
              </div>
            </div>
          </section>
        )}

        {step === "reveal" && (
          <section className="rounded-3xl border border-emerald-300/30 bg-gradient-to-br from-emerald-300/20 via-white/10 to-white/5 p-8">
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Succès</p>
                <h2 className="text-3xl font-semibold">Ton planning est prêt. Ouvre-le dans l&apos;app.</h2>
                {result?.summary && (
                  <p className="mt-2 text-sm text-white/70">{result.summary}</p>
                )}
              </div>
              <div className="rounded-2xl border border-white/20 bg-black/40 p-5">
                <p className="text-sm text-white/80">
                  Salut ! J&apos;ai vu que tu as 3h de trou le jeudi, on prévoit quoi ?
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={appStoreLink}
                  className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-emerald-950"
                >
                  Prendre mon planning avec moi
                </a>
                <button
                  type="button"
                  onClick={() => setStep("landing")}
                  className="rounded-2xl border border-white/20 px-6 py-3 text-sm text-white/80"
                >
                  Revenir au début
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Scanner un QR</h3>
              <button
                type="button"
                onClick={() => setQrOpen(false)}
                className="text-xs font-semibold text-white/60"
              >
                Fermer
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <video ref={videoRef} className="h-64 w-full bg-black object-cover" />
            </div>
            <p className="mt-3 text-xs text-white/60">
              Autorise la caméra pour scanner le QR. Tu peux ensuite continuer sur l&apos;ENT.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
