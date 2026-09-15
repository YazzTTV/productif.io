import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { apiCall } from "@/lib/api";
import { flushStudyQueue, type StudyAnalysis } from "@/lib/studyAnalysis";
import { factText, type AnalysisLanguage } from "@/lib/studyCopy";
import { trackEvent } from "@/lib/analytics";
import { StudyCheckIn } from "@/components/analytics/StudyCheckIn";
import { useSuperwall } from "@/hooks/useSuperwall";
import { SUPERWALL_EVENTS } from "@/lib/superwallEvents";

type Fact = StudyAnalysis["facts"][number];
const duration = (seconds: number) =>
  `${Math.floor(seconds / 3600)} h ${Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0")} min`;
export default function AnalyticsScreen({
  checkInType,
  isActive = true,
}: { checkInType?: "mood" | "stress" | "focus"; isActive?: boolean } = {}) {
  const router = useRouter(),
    { language } = useLanguage(),
    { colors } = useTheme(),
    { triggerEvent } = useSuperwall();
  const lang: AnalysisLanguage =
    language === "en" ? "en" : language === "es" ? "es" : "fr";
  const tr = (fr: string, en: string, es: string) =>
    lang === "en" ? en : lang === "es" ? es : fr;
  const [days, setDays] = useState(7),
    [data, setData] = useState<StudyAnalysis | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false),
    [locked, setLocked] = useState(false);
  const [section, setSection] = useState("work"),
    [selected, setSelected] = useState<Fact | null>(null),
    [question, setQuestion] = useState(""),
    [journal, setJournal] = useState(false),
    [answer, setAnswer] = useState(""),
    [asking, setAsking] = useState(false);
  const request = useRef(0),
    explainRequest = useRef(0);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const load = useCallback(async () => {
    const id = ++request.current;
    setBusy(true);
    setError("");
    setLocked(false);
    try {
      const queued = await flushStudyQueue();
      const result = await apiCall<StudyAnalysis>(
        `/study-analysis?days=${days}&timezone=${encodeURIComponent(timezone)}`,
      );
      if (id === request.current) {
        setData(result);
        setPending(queued > 0);
      }
    } catch (e: any) {
      if (id === request.current) {
        setData(null);
        setLocked(e?.status === 403 || e?.locked === true);
        setError("unavailable");
      }
    } finally {
      if (id === request.current) setBusy(false);
    }
  }, [days, timezone]);
  useEffect(() => {
    if (isActive) {
      void load();
      void trackEvent("analysis_opened", { period_days: days });
    }
    return () => {
      request.current++;
    };
  }, [load, isActive]);
  const text = (content: React.ReactNode, style: object = {}) => (
    <Text style={[{ color: colors.text }, style]}>{content}</Text>
  );
  const card = (children: React.ReactNode, key?: string) => (
    <View
      key={key}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {children}
    </View>
  );
  function open(f: Fact) {
    explainRequest.current++;
    setSelected(f);
    setQuestion("");
    setAnswer("");
    setJournal(false);
    setAsking(false);
    void trackEvent("analysis_evidence_opened", { fact_kind: f.kind });
  }
  async function explain() {
    if (!selected) return;
    const id = ++explainRequest.current;
    setAsking(true);
    try {
      const r = await apiCall<{ response: string; generated?: boolean }>(
        "/study-analysis/explain",
        {
          method: "POST",
          body: JSON.stringify({
            days,
            timezone,
            language: lang,
            factId: selected.id,
            question,
            includeJournal: journal,
          }),
        },
      );
      if (id === explainRequest.current)
        setAnswer(
          r.generated === false
            ? tr(
                "Synthèse calculée (explication IA indisponible) : ",
                "Calculated summary (AI explanation unavailable): ",
                "Resumen calculado (explicación IA no disponible): ",
              ) + r.response
            : r.response,
        );
    } catch {
      if (id === explainRequest.current)
        setAnswer(
          tr(
            "L’explication est indisponible. Les faits ci-dessus restent accessibles.",
            "Explanation unavailable. The facts above remain available.",
            "Explicación no disponible. Los datos siguen disponibles.",
          ),
        );
    } finally {
      if (id === explainRequest.current) setAsking(false);
    }
  }
  function act(f: Fact) {
    setSelected(null);
    void trackEvent("analysis_action_opened", {
      fact_kind: f.kind,
      recommendation_id: f.id,
    });
    if (f.action === "plan") {
      router.push("/plan-my-day");
      return;
    }
    const task = data?.organization.delayed.find((t) => t.id === f.taskId),
      subject = data?.subjects.find((s) => s.nextTaskId === f.taskId);
    router.push({
      pathname: "/focus",
      params: {
        duration: "25",
        recommendationId: f.id,
        ...(f.taskId
          ? {
              taskId: f.taskId,
              title: task?.title || subject?.nextTaskTitle || "",
              subject: subject?.name || tr("Tâche", "Task", "Tarea"),
            }
          : {}),
      },
    });
  }
  const actionLabel = tr(
    "Préparer une session",
    "Prepare a session",
    "Preparar una sesión",
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={
          <RefreshControl
            refreshing={busy}
            onRefresh={load}
            tintColor={colors.primary}
          />
        }
      >
        {text(
          tr(
            "Comprendre tes progrès",
            "Understand your progress",
            "Entiende tu progreso",
          ),
          styles.title,
        )}
        {text(
          tr(
            "Ton travail, tes révisions, ton ressenti.",
            "Your work, your studies, your experience.",
            "Tu trabajo, tus estudios, tus sensaciones.",
          ),
          { color: colors.textSecondary },
        )}
        <View style={styles.row}>
          {[7, 14, 30, 90].map((n) => (
            <TouchableOpacity
              key={n}
              accessibilityRole="button"
              accessibilityState={{ selected: days === n }}
              onPress={() => setDays(n)}
              style={[
                styles.chip,
                { backgroundColor: days === n ? "#166534" : colors.surface },
              ]}
            >
              {text(`${n} ${tr("jours", "days", "días")}`, {
                color: days === n ? "white" : colors.text,
              })}
            </TouchableOpacity>
          ))}
        </View>
        {!!error &&
          card(
            <>
              {text(
                locked
                  ? tr(
                      "Cet historique est réservé au Premium.",
                      "This history requires Premium.",
                      "Este historial requiere Premium.",
                    )
                  : tr(
                      "Impossible de charger ton bilan. Aucune donnée n’a été remplacée par zéro.",
                      "Could not load your report. Missing data was not replaced with zero.",
                      "No se pudo cargar el informe. Los datos ausentes no se sustituyen por cero.",
                    ),
              )}
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.button}
                onPress={() =>
                  locked
                    ? triggerEvent(SUPERWALL_EVENTS.FEATURE_LOCKED, {
                        params: { source: "study_analysis_history" },
                        bypassCooldown: true,
                      })
                    : load()
                }
              >
                {text(
                  locked
                    ? tr("Voir le Premium", "View Premium", "Ver Premium")
                    : tr("Réessayer", "Retry", "Reintentar"),
                  styles.buttonText,
                )}
              </TouchableOpacity>
            </>,
          )}
        {busy && !data && !error && (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
        {data && (
          <>
            {text(
              `${data.period.start} → ${data.period.end} · ${data.timezone}`,
              styles.small,
            )}
            {pending &&
              text(
                tr(
                  "Des activités attendent encore leur synchronisation.",
                  "Some activities are waiting to sync.",
                  "Algunas actividades están pendientes de sincronizar.",
                ),
                { color: "#b45309" },
              )}
            {card(
              <>
                <View style={styles.kpis}>
                  <View style={styles.kpi}>
                    {text(duration(data.summary.seconds), styles.number)}
                    {text(
                      tr(
                        "Temps enregistré",
                        "Recorded time",
                        "Tiempo registrado",
                      ),
                      styles.small,
                    )}
                  </View>
                  <View style={styles.kpi}>
                    {text(data.summary.completedTasks, styles.number)}
                    {text(
                      tr(
                        "Tâches terminées",
                        "Tasks completed",
                        "Tareas completadas",
                      ),
                      styles.small,
                    )}
                  </View>
                  <View style={styles.kpi}>
                    {text(`${data.summary.activeDays}/${days}`, styles.number)}
                    {text(
                      tr("Jours actifs", "Active days", "Días activos"),
                      styles.small,
                    )}
                  </View>
                </View>
                {data.summary.previousSeconds !== null &&
                  text(
                    `${tr("Période précédente comparable", "Comparable previous period", "Período anterior comparable")} : ${duration(data.summary.previousSeconds)}`,
                    styles.small,
                  )}
                {data.coverage.partial &&
                  text(
                    tr(
                      "Historique partiel : les mesures ont commencé pendant cette période.",
                      "Partial history: recording began during this period.",
                      "Historial parcial: las mediciones comenzaron durante este período.",
                    ),
                    styles.small,
                  )}
                {!!(
                  data.coverage.legacySessions ||
                  data.coverage.unknownCompletions
                ) &&
                  text(
                    tr(
                      `Historique incomplet : ${data.coverage.legacySessions} anciennes sessions sans durée fiable hors pauses ; ${data.coverage.unknownCompletions} tâches sans date de complétion.`,
                      `Incomplete history: ${data.coverage.legacySessions} older sessions without reliable active time; ${data.coverage.unknownCompletions} tasks without a completion date.`,
                      `Historial incompleto: ${data.coverage.legacySessions} sesiones sin duración activa fiable; ${data.coverage.unknownCompletions} tareas sin fecha de finalización.`,
                    ),
                    styles.small,
                  )}
                {text(
                  tr(
                    "Le temps enregistré ne mesure pas ton attention ni le travail fait hors de Productif.",
                    "Recorded time does not measure attention or work outside Productif.",
                    "El tiempo registrado no mide tu atención ni el trabajo fuera de Productif.",
                  ),
                  styles.small,
                )}
              </>,
            )}
            {text(
              tr("Ta prochaine étape", "Your next step", "Tu siguiente paso"),
              styles.heading,
            )}
            {data.facts.map((f) =>
              card(
                <>
                  {text(factText(f, lang), { fontSize: 17, lineHeight: 25 })}
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.button}
                    onPress={() => act(f)}
                  >
                    {text(
                      f.action === "plan"
                        ? tr(
                            "Revoir mon planning",
                            "Review my plan",
                            "Revisar mi plan",
                          )
                        : actionLabel,
                      styles.buttonText,
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.link}
                    onPress={() => open(f)}
                  >
                    {text(
                      tr(
                        "Pourquoi ? En discuter avec l’assistant",
                        "Why? Discuss with the assistant",
                        "¿Por qué? Hablar con el asistente",
                      ),
                      { color: colors.primary },
                    )}
                  </TouchableOpacity>
                </>,
                f.id,
              ),
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
            >
              {[
                ["work", tr("Sessions", "Sessions", "Sesiones")],
                ["subjects", tr("Matières", "Subjects", "Asignaturas")],
                [
                  "organization",
                  tr("Organisation", "Planning", "Organización"),
                ],
                ["mood", tr("Ressenti", "Experience", "Sensaciones")],
                ["habits", tr("Habitudes", "Habits", "Hábitos")],
              ].map(([id, label]) => (
                <TouchableOpacity
                  key={id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: section === id }}
                  onPress={() => setSection(id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        section === id ? "#166534" : colors.surface,
                    },
                  ]}
                >
                  {text(label, {
                    color: section === id ? "white" : colors.text,
                  })}
                </TouchableOpacity>
              ))}
            </ScrollView>
            {section === "work" &&
              card(
                <>
                  {text(
                    tr(
                      "Ton rythme de travail",
                      "Your work rhythm",
                      "Tu ritmo de trabajo",
                    ),
                    styles.heading,
                  )}
                  <ScrollView horizontal>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-end",
                        gap: 10,
                        paddingVertical: 10,
                      }}
                    >
                      {data.daily.map((d) => (
                        <View
                          key={d.date}
                          style={{ width: 42, alignItems: "center", gap: 6 }}
                        >
                          {text(Math.floor(d.seconds / 60), styles.small)}
                          <View
                            accessibilityLabel={`${d.date}: ${Math.floor(d.seconds / 60)} min`}
                            style={{
                              height: Math.max(
                                3,
                                (d.seconds /
                                  Math.max(
                                    ...data.daily.map((x) => x.seconds),
                                    1,
                                  )) *
                                  95,
                              ),
                              width: 26,
                              borderRadius: 6,
                              backgroundColor: d.seconds
                                ? "#16a34a"
                                : colors.border,
                            }}
                          />
                          {text(d.date.slice(8), styles.small)}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                  {text(
                    tr(
                      "Minutes enregistrées par jour",
                      "Recorded minutes per day",
                      "Minutos registrados por día",
                    ),
                    styles.small,
                  )}
                  {text(
                    `${tr("Terminées", "Completed", "Finalizadas")} : ${data.summary.completedSessions} · ${tr("Écourtées", "Stopped early", "Interrumpidas")} : ${data.summary.stoppedSessions} · ${tr("En cours / inconnues", "Ongoing / unknown", "En curso / desconocidas")} : ${data.summary.unknownSessions}`,
                  )}
                  {text(
                    `${tr("Temps non attribué à une matière", "Time not assigned to a subject", "Tiempo sin asignatura")} : ${duration(data.summary.unassignedSeconds)}`,
                    styles.small,
                  )}
                  {text(
                    tr(
                      "Formats de session",
                      "Session lengths",
                      "Duración de sesiones",
                    ),
                    styles.heading,
                  )}
                  {data.durationPatterns.map((g) => (
                    <View key={g.key}>
                      {text(
                        `${g.key === "short" ? "≤ 25 min" : g.key === "medium" ? "26–45 min" : "> 45 min"} : ${g.completed}/${g.count} ${tr("terminées", "completed", "finalizadas")}`,
                      )}
                      {!g.available &&
                        text(
                          tr(
                            "Échantillon encore limité.",
                            "Sample still limited.",
                            "Muestra aún limitada.",
                          ),
                          styles.small,
                        )}
                    </View>
                  ))}
                  {text(
                    tr(
                      "Créneaux observés",
                      "Observed time slots",
                      "Franjas observadas",
                    ),
                    styles.heading,
                  )}
                  {data.timePatterns.map((g) => (
                    <View key={g.key}>
                      {text(
                        `${g.key === "morning" ? tr("Matin", "Morning", "Mañana") : g.key === "afternoon" ? tr("Après-midi", "Afternoon", "Tarde") : tr("Soir", "Evening", "Noche")} : ${g.count} ${tr("sessions", "sessions", "sesiones")}`,
                      )}
                      {text(
                        g.available
                          ? `${g.completed}/${g.count} ${tr("terminées ; observation, pas une cause.", "completed; observation, not a cause.", "finalizadas; observación, no causa.")}`
                          : tr(
                              "Pas encore assez de sessions sur plusieurs jours pour comparer.",
                              "Not enough sessions across several days to compare.",
                              "Aún faltan sesiones en varios días para comparar.",
                            ),
                        styles.small,
                      )}
                    </View>
                  ))}
                </>,
              )}
            {section === "subjects" && (
              <>
                {!data.subjects.length &&
                  card(
                    <>
                      {text(
                        tr(
                          "Ajoute tes matières et chapitres pour suivre ton programme.",
                          "Add subjects and chapters to track your syllabus.",
                          "Añade asignaturas y capítulos para seguir tu programa.",
                        ),
                      )}
                      <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push("/tasks-new")}
                      >
                        {text(
                          tr("Mes matières", "My subjects", "Mis asignaturas"),
                          styles.buttonText,
                        )}
                      </TouchableOpacity>
                    </>,
                  )}
                {data.subjects.map((s) =>
                  card(
                    <>
                      {text(s.name, styles.heading)}
                      {text(
                        `${s.completed}/${s.total} ${tr("chapitres cochés", "chapters checked", "capítulos marcados")} · ${tr("Coefficient", "Weight", "Coeficiente")} ${s.coefficient}`,
                      )}
                      <View
                        style={{
                          height: 8,
                          borderRadius: 5,
                          backgroundColor: colors.border,
                        }}
                      >
                        <View
                          style={{
                            height: 8,
                            borderRadius: 5,
                            width: `${s.total ? (s.completed / s.total) * 100 : 0}%`,
                            backgroundColor: "#16a34a",
                          }}
                        />
                      </View>
                      {text(
                        `${duration(s.seconds)} · ${s.deadline ? new Date(s.deadline).toLocaleDateString(lang) : tr("Échéance non renseignée", "No deadline set", "Sin fecha límite")}`,
                      )}
                      {s.estimatedRemainingMinutes !== null &&
                        text(
                          `${tr("Charge restante estimée", "Estimated remaining workload", "Carga restante estimada")} : ${s.estimatedRemainingMinutes} min`,
                          styles.small,
                        )}
                      {text(
                        tr(
                          "Avancement du programme saisi, pas une mesure de maîtrise.",
                          "Progress through your entered syllabus, not a measure of mastery.",
                          "Avance en el programa introducido, no una medida de dominio.",
                        ),
                        styles.small,
                      )}
                      <TouchableOpacity
                        onPress={() => router.push("/tasks-new")}
                        style={styles.link}
                      >
                        {text(
                          tr(
                            "Voir les chapitres",
                            "View chapters",
                            "Ver capítulos",
                          ),
                          { color: colors.primary },
                        )}
                      </TouchableOpacity>
                    </>,
                    s.id,
                  ),
                )}
              </>
            )}
            {section === "organization" &&
              card(
                <>
                  {text(
                    `${tr("Tâches planifiées avec une session liée", "Scheduled tasks with a linked session", "Tareas planificadas con sesión vinculada")} : ${data.organization.plannedTasksWithSession}/${data.organization.plannedTasks}`,
                  )}
                  {text(
                    tr(
                      "Une absence de session ne prouve pas une absence de travail.",
                      "No recorded session does not mean no work was done.",
                      "Sin sesión registrada no significa que no se haya trabajado.",
                    ),
                    styles.small,
                  )}
                  {text(
                    tr(
                      "Ce qui reste reporté",
                      "Repeatedly postponed",
                      "Lo que se sigue aplazando",
                    ),
                    styles.heading,
                  )}
                  {!data.organization.delayed.length &&
                    text(
                      tr(
                        "Aucun report répété enregistré sur cette période.",
                        "No repeated postponements recorded in this period.",
                        "No hay aplazamientos repetidos registrados.",
                      ),
                      styles.small,
                    )}
                  {data.organization.delayed.map((t) => (
                    <View key={t.id}>
                      {text(
                        `${t.title} · ${t.reports} ${tr("reports", "postponements", "aplazamientos")}`,
                      )}
                    </View>
                  ))}
                  {text(
                    tr(
                      "Durée estimée / enregistrée",
                      "Estimate / available recorded time",
                      "Duración estimada / registrada",
                    ),
                    styles.heading,
                  )}
                  {!data.organization.estimates.length &&
                    text(
                      tr(
                        "Associe tes sessions à des tâches avec une durée estimée pour comparer.",
                        "Link sessions to tasks with estimates to compare.",
                        "Vincula sesiones a tareas con estimaciones para comparar.",
                      ),
                      styles.small,
                    )}
                  {data.organization.estimates.map((t) => (
                    <View key={t.id}>
                      {text(
                        `${t.title} : ${t.estimatedMinutes} / ${t.actualMinutes} min`,
                      )}
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push("/plan-my-day")}
                  >
                    {text(
                      tr(
                        "Préparer mon planning",
                        "Prepare my plan",
                        "Preparar mi plan",
                      ),
                      styles.buttonText,
                    )}
                  </TouchableOpacity>
                </>,
              )}
            {section === "mood" && (
              <>
                {card(
                  <>
                    {text(
                      tr(
                        "Ton ressenti déclaré",
                        "Your self-reported experience",
                        "Tus sensaciones declaradas",
                      ),
                      styles.heading,
                    )}
                    {text(
                      `${data.coverage.checkins} ${tr("réponses sur la période", "responses in this period", "respuestas en este período")}`,
                      styles.small,
                    )}
                    {data.moods.map((m) => (
                      <View key={m.type} style={{ gap: 8 }}>
                        {text(
                          `${({ focus: tr("Concentration", "Focus", "Concentración"), energy: tr("Énergie", "Energy", "Energía"), mood: tr("Humeur", "Mood", "Ánimo"), stress: tr("Stress", "Stress", "Estrés"), motivation: tr("Motivation", "Motivation", "Motivación") } as Record<string, string>)[m.type]} : ${m.average === null ? "—" : `${m.average}/10`} (${m.count})`,
                          { fontWeight: "600" },
                        )}
                        <ScrollView horizontal>
                          <View style={styles.row}>
                            {m.daily.map((d) => (
                              <View
                                key={d.date}
                                style={{ width: 35, alignItems: "center" }}
                              >
                                {text(
                                  d.value === null ? "—" : String(d.value),
                                  {
                                    color:
                                      d.value === null
                                        ? colors.textSecondary
                                        : colors.primary,
                                  },
                                )}
                                {text(d.date.slice(8), styles.small)}
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    ))}
                    {text(
                      tr(
                        "— signifie aucune réponse. Une association ne prouve pas une cause.",
                        "— means no response. An association does not establish a cause.",
                        "— significa sin respuesta. Una asociación no demuestra una causa.",
                      ),
                      styles.small,
                    )}
                  </>,
                )}
                {card(
                  <>
                    {text(
                      tr(
                        "Énergie et concentration",
                        "Energy and focus",
                        "Energía y concentración",
                      ),
                      styles.heading,
                    )}
                    {text(
                      data.moodAssociation.available
                        ? tr(
                            `Concentration moyenne déclarée : ${data.moodAssociation.highFocus}/10 avec énergie élevée (${data.moodAssociation.highCount} sessions), ${data.moodAssociation.lowFocus}/10 avec énergie faible (${data.moodAssociation.lowCount} sessions).`,
                            `Average reported focus: ${data.moodAssociation.highFocus}/10 with high energy (${data.moodAssociation.highCount} sessions), ${data.moodAssociation.lowFocus}/10 with low energy (${data.moodAssociation.lowCount} sessions).`,
                            `Concentración declarada: ${data.moodAssociation.highFocus}/10 con energía alta (${data.moodAssociation.highCount} sesiones), ${data.moodAssociation.lowFocus}/10 con energía baja (${data.moodAssociation.lowCount} sesiones).`,
                          )
                        : tr(
                            "Il faut davantage de réponses énergie et concentration liées aux mêmes sessions, sur plusieurs semaines.",
                            "More energy and focus ratings linked to the same sessions over several weeks are needed.",
                            "Hacen falta más respuestas de energía y concentración vinculadas a las mismas sesiones durante varias semanas.",
                          ),
                    )}
                    {text(
                      tr(
                        "Observation personnelle ; aucun lien de cause à effet démontré.",
                        "Personal observation; no cause-and-effect relationship established.",
                        "Observación personal; no demuestra causa y efecto.",
                      ),
                      styles.small,
                    )}
                  </>,
                )}
                <StudyCheckIn
                  initialType={checkInType || "focus"}
                  onSaved={() => void load()}
                />
              </>
            )}
            {section === "habits" &&
              card(
                <>
                  {text(
                    tr("Tes habitudes", "Your habits", "Tus hábitos"),
                    styles.heading,
                  )}
                  {!data.habits.length &&
                    text(
                      tr(
                        "Aucune habitude renseignée.",
                        "No habits entered.",
                        "No hay hábitos registrados.",
                      ),
                    )}
                  {data.habits.map((h) => (
                    <View key={h.id}>
                      {text(h.name, { fontWeight: "600" })}
                      {text(
                        `${h.completed}/${h.expected} · ${h.percent === null ? "—" : `${h.percent}%`}`,
                        styles.small,
                      )}
                    </View>
                  ))}
                  {text(
                    tr(
                      "Calcul sur les jours prévus depuis la création de chaque habitude.",
                      "Based on scheduled days since each habit was created.",
                      "Calculado sobre días previstos desde la creación de cada hábito.",
                    ),
                    styles.small,
                  )}
                  <TouchableOpacity
                    style={styles.link}
                    onPress={() => router.push("/review-habits")}
                  >
                    {text(
                      tr(
                        "Revoir mes habitudes",
                        "Review my habits",
                        "Revisar mis hábitos",
                      ),
                      { color: colors.primary },
                    )}
                  </TouchableOpacity>
                </>,
              )}
            {!!checkInType && section !== "mood" && (
              <StudyCheckIn
                initialType={checkInType}
                onSaved={() => void load()}
              />
            )}
            {text(
              `${tr("Mis à jour", "Updated", "Actualizado")} ${new Date(data.generatedAt).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })}`,
              styles.small,
            )}
          </>
        )}
      </ScrollView>
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          explainRequest.current++;
          setSelected(null);
        }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={[styles.page, { paddingTop: 36 }]}
        >
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              explainRequest.current++;
              setSelected(null);
            }}
            style={styles.link}
          >
            {text(tr("Fermer", "Close", "Cerrar"), { color: colors.primary })}
          </TouchableOpacity>
          {text(
            tr("Comprendre et agir", "Understand and act", "Entender y actuar"),
            styles.title,
          )}
          {selected &&
            card(
              <>
                {text(factText(selected, lang), {
                  fontSize: 18,
                  lineHeight: 26,
                })}
                {text(
                  `${data?.period.start} → ${data?.period.end}`,
                  styles.small,
                )}
                {text(
                  tr(
                    "Ce constat est calculé à partir de tes activités enregistrées. Il peut manquer du travail réalisé ailleurs.",
                    "This fact is calculated from recorded activities. Work done elsewhere may be missing.",
                    "Este dato se calcula con actividades registradas. Puede faltar trabajo realizado fuera.",
                  ),
                  styles.small,
                )}
              </>,
            )}
          <TextInput
            accessibilityLabel={tr(
              "Ta question",
              "Your question",
              "Tu pregunta",
            )}
            multiline
            maxLength={700}
            placeholder={tr(
              "Ajoute du contexte ou pose une question…",
              "Add context or ask a question…",
              "Añade contexto o haz una pregunta…",
            )}
            placeholderTextColor={colors.textSecondary}
            value={question}
            onChangeText={setQuestion}
            style={{
              minHeight: 100,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              color: colors.text,
            }}
          />
          <View style={styles.row}>
            <Switch
              value={journal}
              onValueChange={setJournal}
              accessibilityLabel={tr(
                "Inclure mon journal",
                "Include my journal",
                "Incluir mi diario",
              )}
            />
            <View style={{ flex: 1 }}>
              {text(
                tr(
                  "Inclure mes dernières entrées de journal dans cette demande",
                  "Include recent journal entries in this request",
                  "Incluir mis últimas entradas del diario en esta solicitud",
                ),
                styles.small,
              )}
            </View>
          </View>
          <TouchableOpacity
            disabled={asking}
            accessibilityRole="button"
            onPress={explain}
            style={styles.button}
          >
            {asking ? (
              <ActivityIndicator color="white" />
            ) : (
              text(
                tr(
                  "Demander à l’assistant",
                  "Ask the assistant",
                  "Preguntar al asistente",
                ),
                styles.buttonText,
              )
            )}
          </TouchableOpacity>
          {!!answer && card(text(answer, { lineHeight: 25, fontSize: 16 }))}
          {selected && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => act(selected)}
            >
              {text(
                selected.action === "plan"
                  ? tr(
                      "Revoir mon planning",
                      "Review my plan",
                      "Revisar mi plan",
                    )
                  : actionLabel,
                styles.buttonText,
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 130, gap: 16 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.6 },
  heading: { fontSize: 19, fontWeight: "600" },
  card: { padding: 18, borderWidth: 1, borderRadius: 22, gap: 14 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  chip: { paddingHorizontal: 15, paddingVertical: 13, borderRadius: 15 },
  small: { fontSize: 12, lineHeight: 18, opacity: 0.7 },
  number: { fontSize: 23, fontWeight: "700", color: "#16a34a" },
  kpis: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  kpi: { minWidth: 90, flex: 1, gap: 6 },
  button: { padding: 15, borderRadius: 14, backgroundColor: "#166534" },
  buttonText: { color: "white", fontWeight: "600", textAlign: "center" },
  link: { paddingVertical: 12, minHeight: 44 },
});
