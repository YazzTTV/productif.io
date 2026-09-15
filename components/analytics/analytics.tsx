"use client";
import { useCallback, useEffect, useState } from "react";
import type { StudyAnalysis } from "@/lib/study-analysis/engine";
import { factText, type AnalysisLanguage } from "@/lib/study-analysis/copy";

const duration = (n: number) =>
  `${Math.floor(n / 3600)} h ${Math.floor((n % 3600) / 60)} min`;
export function Analytics() {
  const [data, setData] = useState<StudyAnalysis | null>(null),
    [days, setDays] = useState(7),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [language, setLanguage] = useState<AnalysisLanguage>("fr");
  const [selected, setSelected] = useState<
      StudyAnalysis["facts"][number] | null
    >(null),
    [question, setQuestion] = useState(""),
    [journal, setJournal] = useState(false),
    [answer, setAnswer] = useState(""),
    [asking, setAsking] = useState(false);
  const tr = (fr: string, en: string, es: string) =>
    language === "en" ? en : language === "es" ? es : fr;
  useEffect(() => {
    const lang = navigator.language.slice(0, 2);
    setLanguage(lang === "en" ? "en" : lang === "es" ? "es" : "fr");
  }, []);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setBusy(true);
      setError("");
      try {
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const r = await fetch(
          `/api/study-analysis?days=${days}&timezone=${encodeURIComponent(zone)}`,
          { signal, credentials: "include" },
        );
        if (!r.ok)
          throw new Error(r.status === 403 ? "premium" : "unavailable");
        const result = await r.json();
        if (!signal?.aborted) setData(result);
      } catch (e) {
        if (!signal?.aborted) {
          setData(null);
          setError(e instanceof Error ? e.message : "unavailable");
        }
      } finally {
        if (!signal?.aborted) setBusy(false);
      }
    },
    [days],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  async function explain() {
    if (!selected) return;
    setAsking(true);
    try {
      const r = await fetch("/api/study-analysis/explain", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language,
          factId: selected.id,
          question,
          includeJournal: journal,
        }),
      });
      if (!r.ok) throw new Error();
      const result = await r.json();
      setAnswer(
        result.generated === false
          ? tr(
              "Synthèse calculée (explication IA indisponible) : ",
              "Calculated summary (AI explanation unavailable): ",
              "Resumen calculado (explicación IA no disponible): ",
            ) + result.response
          : result.response,
      );
    } catch {
      setAnswer(
        tr(
          "Explication indisponible. Les faits restent accessibles.",
          "Explanation unavailable. The facts remain available.",
          "Explicación no disponible. Los datos siguen disponibles.",
        ),
      );
    } finally {
      setAsking(false);
    }
  }
  const card = "rounded-2xl border border-black/10 bg-white p-6 space-y-4";
  return (
    <div className="space-y-6 px-4 sm:px-0 pb-12 max-w-5xl mx-auto text-slate-900">
      <header>
        <p className="text-sm text-green-700 font-medium">
          Productif · {tr("Analyses", "Analysis", "Análisis")}
        </p>
        <h1 className="text-3xl font-semibold mt-2">
          {tr(
            "Comprendre tes progrès",
            "Understand your progress",
            "Entiende tu progreso",
          )}
        </h1>
        <p className="text-slate-500 mt-2">
          {tr(
            "Ton travail, tes révisions, ton ressenti.",
            "Your work, your studies, your experience.",
            "Tu trabajo, tus estudios, tus sensaciones.",
          )}
        </p>
      </header>
      <div className="flex flex-wrap gap-2">
        {[7, 14, 30, 90].map((n) => (
          <button
            key={n}
            aria-pressed={days === n}
            onClick={() => setDays(n)}
            className={`rounded-xl px-4 py-3 ${days === n ? "bg-green-800 text-white" : "bg-slate-100"}`}
          >
            {n} {tr("jours", "days", "días")}
          </button>
        ))}
      </div>
      {busy && (
        <p role="status">{tr("Chargement…", "Loading…", "Cargando…")}</p>
      )}
      {error && (
        <div role="alert" className={card}>
          <p>
            {error === "premium"
              ? tr(
                  "Cet historique nécessite Premium.",
                  "This history requires Premium.",
                  "Este historial requiere Premium.",
                )
              : tr(
                  "Bilan indisponible.",
                  "Report unavailable.",
                  "Informe no disponible.",
                )}
          </p>
          <button onClick={() => void load()}>
            {tr("Réessayer", "Retry", "Reintentar")}
          </button>
        </div>
      )}
      {data && (
        <>
          <p className="text-sm text-slate-500">
            {data.period.start} → {data.period.end} · {data.timezone}
          </p>
          <section className="grid sm:grid-cols-3 gap-4">
            {[
              [
                duration(data.summary.seconds),
                tr("Temps enregistré", "Recorded time", "Tiempo registrado"),
              ],
              [
                data.summary.completedTasks,
                tr("Tâches terminées", "Tasks completed", "Tareas completadas"),
              ],
              [
                `${data.summary.activeDays}/${days}`,
                tr("Jours actifs", "Active days", "Días activos"),
              ],
            ].map(([value, label]) => (
              <div key={label} className={card}>
                <strong className="text-3xl text-green-700">{value}</strong>
                <p>{label}</p>
              </div>
            ))}
          </section>
          <p className="text-sm text-slate-500">
            {tr(
              "Le temps enregistré ne mesure pas l’attention ni le travail hors de Productif.",
              "Recorded time does not measure attention or work outside Productif.",
              "El tiempo registrado no mide atención ni trabajo fuera de Productif.",
            )}
          </p>
          {(data.coverage.partial ||
            data.coverage.legacySessions > 0 ||
            data.coverage.unknownCompletions > 0) && (
            <p className="text-sm text-amber-800">
              {tr(
                "Historique partiel : les anciennes activités sans durée fiable ou date de complétion ne sont pas reconstruites.",
                "Partial history: older activities without reliable time or completion dates are not reconstructed.",
                "Historial parcial: no se reconstruyen actividades antiguas sin duración o fecha fiables.",
              )}
            </p>
          )}
          {data.summary.previousSeconds !== null && (
            <p>
              {tr(
                "Période précédente comparable",
                "Comparable previous period",
                "Período anterior comparable",
              )}{" "}
              : {duration(data.summary.previousSeconds)}
            </p>
          )}
          <section className={card}>
            <h2 className="text-xl font-semibold">
              {tr("Ta prochaine étape", "Your next step", "Tu siguiente paso")}
            </h2>
            {data.facts.map((f) => (
              <div key={f.id} className="space-y-3">
                <p>{factText(f, language)}</p>
                <button
                  className="text-green-800 underline"
                  onClick={() => {
                    setSelected(f);
                    setAnswer("");
                    setQuestion("");
                    setJournal(false);
                  }}
                >
                  {tr(
                    "Comprendre avec l’assistant",
                    "Understand with the assistant",
                    "Entender con el asistente",
                  )}
                </button>
              </div>
            ))}
          </section>
          <section className={card}>
            <h2 className="text-xl font-semibold">
              {tr("Sessions", "Sessions", "Sesiones")}
            </h2>
            <div className="flex items-end gap-2 overflow-x-auto min-h-40">
              {data.daily.map((d) => (
                <div
                  key={d.date}
                  className="flex flex-col items-center gap-2 min-w-9"
                >
                  <span className="text-xs">{Math.floor(d.seconds / 60)}</span>
                  <div
                    className={
                      d.seconds
                        ? "bg-green-600 rounded-t-lg w-6"
                        : "bg-slate-200 rounded-t-lg w-6"
                    }
                    style={{
                      height: Math.max(
                        3,
                        (d.seconds /
                          Math.max(...data.daily.map((x) => x.seconds), 1)) *
                          100,
                      ),
                    }}
                  />
                  <span className="text-xs">{d.date.slice(8)}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500">
              {tr("Minutes par jour", "Minutes per day", "Minutos por día")}
            </p>
          </section>
          <section className={card}>
            <h2 className="text-xl font-semibold">
              {tr(
                "Progression par matière",
                "Subject progress",
                "Progreso por asignatura",
              )}
            </h2>
            {!data.subjects.length && (
              <p>
                {tr(
                  "Ajoute tes matières pour suivre ton programme.",
                  "Add subjects to track your syllabus.",
                  "Añade asignaturas para seguir tu programa.",
                )}
              </p>
            )}
            {data.subjects.map((s) => (
              <div key={s.id} className="space-y-2">
                <h3 className="font-semibold">{s.name}</h3>
                <p>
                  {s.completed}/{s.total} · {duration(s.seconds)}
                  {s.deadline
                    ? ` · ${new Date(s.deadline).toLocaleDateString(language)}`
                    : ""}
                </p>
                <progress
                  className="w-full accent-green-700"
                  value={s.completed}
                  max={s.total || 1}
                />
              </div>
            ))}
            <p className="text-sm text-slate-500">
              {tr(
                "Chapitres cochés, pas une mesure de maîtrise.",
                "Checked chapters, not a measure of mastery.",
                "Capítulos marcados, no una medida de dominio.",
              )}
            </p>
          </section>
          <section className={card}>
            <h2 className="text-xl font-semibold">
              {tr("Organisation", "Planning", "Organización")}
            </h2>
            {data.organization.delayed.map((t) => (
              <p key={t.id}>
                {t.title} · {t.reports}{" "}
                {tr("reports", "postponements", "aplazamientos")}
              </p>
            ))}
            {!data.organization.delayed.length && (
              <p>
                {tr(
                  "Aucun report répété enregistré.",
                  "No repeated postponements recorded.",
                  "No hay aplazamientos repetidos registrados.",
                )}
              </p>
            )}
            {data.organization.estimates.map((t) => (
              <p key={t.id}>
                {t.title} : {t.estimatedMinutes} / {t.actualMinutes} min
              </p>
            ))}
          </section>
          <section className={card}>
            <h2 className="text-xl font-semibold">
              {tr(
                "Ressenti déclaré",
                "Self-reported experience",
                "Sensaciones declaradas",
              )}
            </h2>
            {data.moods.map((m) => (
              <p key={m.type}>
                {
                  (
                    {
                      focus: tr("Concentration", "Focus", "Concentración"),
                      mood: tr("Humeur", "Mood", "Ánimo"),
                      stress: tr("Stress", "Stress", "Estrés"),
                      energy: tr("Énergie", "Energy", "Energía"),
                      motivation: tr("Motivation", "Motivation", "Motivación"),
                    } as Record<string, string>
                  )[m.type]
                }{" "}
                : {m.average === null ? "—" : `${m.average}/10`} ({m.count})
              </p>
            ))}
          </section>
          <section className={card}>
            <h2 className="text-xl font-semibold">
              {tr("Habitudes", "Habits", "Hábitos")}
            </h2>
            {data.habits.map((h) => (
              <p key={h.id}>
                {h.name} : {h.completed}/{h.expected} ·{" "}
                {h.percent === null ? "—" : `${h.percent}%`}
              </p>
            ))}
            {!data.habits.length && (
              <p>
                {tr(
                  "Aucune habitude renseignée.",
                  "No habits entered.",
                  "No hay hábitos registrados.",
                )}
              </p>
            )}
          </section>
        </>
      )}
      {selected && (
        <section
          className={card}
          aria-label={tr(
            "Discussion avec l’assistant",
            "Assistant discussion",
            "Conversación con el asistente",
          )}
        >
          <h2 className="text-xl font-semibold">
            {tr(
              "Comprendre et agir",
              "Understand and act",
              "Entender y actuar",
            )}
          </h2>
          <p>{factText(selected, language)}</p>
          <label className="block">
            {tr("Ta question", "Your question", "Tu pregunta")}
            <textarea
              maxLength={700}
              className="block w-full border rounded-xl p-3 mt-2"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </label>
          <label className="flex gap-3 items-center">
            <input
              type="checkbox"
              checked={journal}
              onChange={(e) => setJournal(e.target.checked)}
            />
            {tr(
              "Inclure mes dernières entrées de journal dans cette demande",
              "Include recent journal entries in this request",
              "Incluir mis últimas entradas del diario en esta solicitud",
            )}
          </label>
          <button
            disabled={asking}
            className="bg-green-800 text-white px-5 py-3 rounded-xl"
            onClick={explain}
          >
            {asking
              ? "…"
              : tr(
                  "Demander à l’assistant",
                  "Ask the assistant",
                  "Preguntar al asistente",
                )}
          </button>
          {answer && (
            <p aria-live="polite" className="whitespace-pre-wrap">
              {answer}
            </p>
          )}
          <a className="block text-green-800 underline" href="/dashboard">
            {tr(
              "Ouvrir mon espace de travail",
              "Open my workspace",
              "Abrir mi espacio de trabajo",
            )}
          </a>
        </section>
      )}
    </div>
  );
}
