import type { StudyAnalysis } from "./studyAnalysis";
export type AnalysisLanguage = "fr" | "en" | "es";
export function factText(
  f: StudyAnalysis["facts"][number],
  lang: AnalysisLanguage = "fr",
) {
  const v = f.values;
  const locale = lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "fr-FR";
  const rawDate = String(v.date || "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? new Date(`${rawDate}T12:00:00Z`).toLocaleDateString(locale, {
        day: "numeric", month: "short", timeZone: "UTC",
      })
    : rawDate;
  const texts: Record<string, [string, string, string]> = {
    deadline: [
      `${v.name} : ${v.remaining} ${Number(v.remaining) === 1 ? "chapitre restant" : "chapitres restants"} avant le ${date}. Commence par le prochain chapitre.`,
      `${v.name}: ${v.remaining} open ${Number(v.remaining) === 1 ? "chapter" : "chapters"}, due ${date}. Start with the next chapter.`,
      `${v.name}: ${v.remaining} ${Number(v.remaining) === 1 ? "capítulo pendiente" : "capítulos pendientes"}, fecha ${date}. Empieza por el siguiente.`,
    ],
    reports: [
      `« ${v.title} » a été reportée ${v.count} fois sur cette période. Prévois une étape plus petite.`,
      `“${v.title}” was postponed ${v.count} times in this period. Plan a smaller step.`,
      `«${v.title}» se aplazó ${v.count} veces en este período. Planifica un paso más pequeño.`,
    ],
    duration: [
      `${v.stopped} de tes ${v.total} sessions longues ont été écourtées. Essaie un format de 25 minutes.`,
      `${v.stopped} of ${v.total} long sessions ended early. Try a 25-minute session.`,
      `${v.stopped} de ${v.total} sesiones largas terminaron antes. Prueba 25 minutos.`,
    ],
    progress: [
      `${v.minutes} ${Number(v.minutes) === 1 ? "minute enregistrée" : "minutes enregistrées"} et ${v.tasks} ${Number(v.tasks) === 1 ? "tâche terminée" : "tâches terminées"} sur cette période. Choisis ta prochaine étape.`,
      `${v.minutes} ${Number(v.minutes) === 1 ? "minute" : "minutes"} recorded and ${v.tasks} ${Number(v.tasks) === 1 ? "task" : "tasks"} completed in this period. Choose your next step.`,
      `${v.minutes} ${Number(v.minutes) === 1 ? "minuto registrado" : "minutos registrados"} y ${v.tasks} ${Number(v.tasks) === 1 ? "tarea completada" : "tareas completadas"}. Elige tu siguiente paso.`,
    ],
    start: [
      "Ta première session alimentera ce bilan. Commence par une tâche accessible.",
      "Your first session will populate this report. Start with a manageable task.",
      "Tu primera sesión alimentará este informe. Empieza con una tarea accesible.",
    ],
  };
  return (texts[f.kind] || texts.start)[
    lang === "en" ? 1 : lang === "es" ? 2 : 0
  ];
}
