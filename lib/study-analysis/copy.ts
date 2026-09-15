import type { StudyAnalysis } from "./engine";
export type AnalysisLanguage = "fr" | "en" | "es";
export function factText(
  f: StudyAnalysis["facts"][number],
  lang: AnalysisLanguage = "fr",
) {
  const v = f.values;
  const texts: Record<string, [string, string, string]> = {
    deadline: [
      `${v.name} : ${v.remaining} chapitres ouverts, échéance le ${v.date}. Commence par le prochain chapitre.`,
      `${v.name}: ${v.remaining} open chapters, due ${v.date}. Start with the next chapter.`,
      `${v.name}: ${v.remaining} capítulos pendientes, fecha ${v.date}. Empieza por el siguiente.`,
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
      `${v.minutes} minutes enregistrées et ${v.tasks} tâches terminées sur cette période. Choisis ta prochaine étape.`,
      `${v.minutes} minutes recorded and ${v.tasks} tasks completed in this period. Choose your next step.`,
      `${v.minutes} minutos registrados y ${v.tasks} tareas completadas. Elige tu siguiente paso.`,
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
