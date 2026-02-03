"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ScanItem {
  id: string;
  email?: string | null;
  sessionId?: string | null;
  query?: string | null;
  sourceUrl?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  aiJson?: any;
}

interface ScanDetail extends ScanItem {
  error?: string | null;
  ocrText?: string | null;
  imageMime?: string | null;
  imageData?: string | null;
  attribution?: any;
}

export default function AdminScanPage() {
  const router = useRouter();
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ScanDetail | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/login?redirect=/dashboard/admin/scan");
          return;
        }
        const userData = await response.json();
        if (userData.user.role !== "SUPER_ADMIN") {
          setError("Accès refusé : SUPER_ADMIN requis");
          return;
        }
        await fetchScans();
      } catch (err) {
        router.push("/login?redirect=/dashboard/admin/scan");
      }
    };

    checkAuth();
  }, [router]);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/scan");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement");
      }
      const data = await response.json();
      setScans(data.scans || []);
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/scan/${id}`);
      if (!response.ok) {
        throw new Error("Impossible de charger le détail");
      }
      const data = await response.json();
      setSelected(data.scan);
    } catch (err: any) {
      setError(err.message || "Erreur");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-white">
        <div className="rounded-2xl border border-white/10 bg-slate-950 p-6">
          Chargement des scans…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-white">
        <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-6">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Scans ENT</h1>
          <p className="text-sm text-white/60">Derniers scans reçus via /scan</p>
        </div>
        <button
          type="button"
          onClick={fetchScans}
          className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white/80"
        >
          Rafraîchir
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60">
          <div className="border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.3em] text-white/50">
            Historique
          </div>
          <div className="divide-y divide-white/5">
            {scans.map((scan) => (
              <button
                key={scan.id}
                type="button"
                onClick={() => openDetail(scan.id)}
                className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/5"
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    {scan.email || "Email non renseigné"}
                  </div>
                  <div className="text-xs text-white/50">{scan.query || scan.sourceUrl || "Aucune requête"}</div>
                  <div className="text-xs text-white/40">
                    {new Date(scan.createdAt).toLocaleString()}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    scan.status === "done"
                      ? "bg-emerald-400/20 text-emerald-200"
                      : scan.status === "error"
                      ? "bg-rose-400/20 text-rose-200"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {scan.status}
                </span>
              </button>
            ))}
            {scans.length === 0 && (
              <div className="px-5 py-6 text-sm text-white/60">Aucun scan trouvé.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">Détail</div>
          {!selected && (
            <p className="mt-4 text-sm text-white/60">Sélectionne un scan pour afficher les détails.</p>
          )}
          {selected && (
            <div className="mt-4 space-y-4 text-sm text-white/80">
              <div>
                <div className="text-xs text-white/50">Email</div>
                <div>{selected.email || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-white/50">URL source</div>
                <div className="break-all text-white/80">{selected.sourceUrl || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-white/50">Résultat IA</div>
                <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-black/40 p-3 text-xs text-emerald-200">
{JSON.stringify(selected.aiJson, null, 2) || "-"}
                </pre>
              </div>
              {selected.imageData && (
                <div>
                  <div className="text-xs text-white/50">Capture</div>
                  <img
                    src={`data:${selected.imageMime || "image/jpeg"};base64,${selected.imageData}`}
                    alt="Capture scan"
                    className="mt-2 w-full rounded-xl border border-white/10"
                  />
                </div>
              )}
              {selected.error && (
                <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                  {selected.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
