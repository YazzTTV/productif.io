"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL || "https://apps.apple.com/app/id0000000000";

// Chips de suggestions pour l'entrée des tâches
const PROMPT_CHIPS = [
  { key: "classesLectures", label: "Cours / TD" },
  { key: "deadlines", label: "Deadlines" },
  { key: "revisions", label: "Révisions" },
  { key: "avoiding", label: "Ce que j'évite" },
  { key: "personalObligations", label: "Obligations perso" },
];

// Étapes de construction du plan
const BUILD_STEPS = [
  { key: "priorities", text: "Analyse de tes priorités…", duration: 2000 },
  { key: "effort", text: "Estimation de l'effort…", duration: 2500 },
  { key: "plan", text: "Création de ton planning…", duration: 2000 },
];

type Step = "hook" | "tasks-input" | "task-clarification" | "building-plan" | "ideal-day";

interface ClarifiedTask {
  id: string;
  title: string;
  category: string;
  priority: number;
  energyLevel: number;
  dueDate: string;
  suggestedTime: string;
  estimatedDuration: number;
}

interface TimelineBlock {
  time: string;
  duration: number;
  activity: string;
  priority: boolean;
}

export default function ScanClient() {
  const [step, setStep] = useState<Step>("hook");
  const [tasks, setTasks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Task clarification state
  const [clarifiedTasks, setClarifiedTasks] = useState<ClarifiedTask[]>([]);
  
  // Building plan state
  const [buildStep, setBuildStep] = useState(0);
  const [completedBuildSteps, setCompletedBuildSteps] = useState<number[]>([]);
  
  // Ideal day state
  const [priorities, setPriorities] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<TimelineBlock[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTime, setEditingTime] = useState("");
  
  const sessionIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Générer un session ID unique
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sessionId =
      window.crypto?.randomUUID?.() ||
      `scan_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
    sessionIdRef.current = sessionId;
  }, []);

  // Gestion des chips
  const handleChipClick = (label: string) => {
    const newText = tasks ? `${tasks}\n${label}: ` : `${label}: `;
    setTasks(newText);
  };

  // Transcription vocale (Web Speech API)
  const toggleRecording = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError("La reconnaissance vocale n'est pas supportée par ton navigateur.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    setError(null);
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "fr-FR";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      if (finalTranscript) {
        setTasks((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
      }
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === "not-allowed") {
        setError("Autorise l'accès au micro pour utiliser la transcription.");
      } else if (event.error !== "aborted") {
        setError(`Erreur: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  // Nettoyage de la reconnaissance vocale au démontage
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  // Soumettre les tâches pour analyse
  const handleSubmitTasks = async () => {
    if (!tasks.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/scan/analyze-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: tasks.trim() }),
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de l'analyse");
      }
      
      const data = await response.json();
      
      if (!data.tasks || data.tasks.length === 0) {
        throw new Error("Aucune tâche détectée. Essaie d'être plus précis.");
      }
      
      setClarifiedTasks(data.tasks);
      setStep("task-clarification");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle priorité d'une tâche
  const togglePriority = (id: string) => {
    setClarifiedTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, priority: task.priority === 4 ? 0 : 4 }
          : task
      )
    );
  };

  // Supprimer une tâche
  const deleteTask = (id: string) => {
    setClarifiedTasks(prev => prev.filter(task => task.id !== id));
  };

  // Modifier le titre d'une tâche
  const updateTaskTitle = (id: string, title: string) => {
    setClarifiedTasks(prev =>
      prev.map(task => (task.id === id ? { ...task, title } : task))
    );
  };

  // Lancer la construction du plan
  const handleBuildPlan = () => {
    if (clarifiedTasks.length === 0) return;
    setStep("building-plan");
    setBuildStep(0);
    setCompletedBuildSteps([]);
  };

  // Animation de construction du plan
  useEffect(() => {
    if (step !== "building-plan") return;
    
    if (buildStep < BUILD_STEPS.length) {
      const timer = setTimeout(() => {
        setCompletedBuildSteps(prev => [...prev, buildStep]);
        setBuildStep(prev => prev + 1);
      }, BUILD_STEPS[buildStep].duration);
      return () => clearTimeout(timer);
    } else {
      // Toutes les étapes terminées, préparer ideal-day
      const timer = setTimeout(() => {
        // Extraire les priorités (tâches avec priority = 4)
        const priorityTasks = clarifiedTasks
          .filter(task => task.priority === 4)
          .slice(0, 3)
          .map(task => task.title);
        setPriorities(priorityTasks);
        
        // Créer la timeline
        const blocks: TimelineBlock[] = clarifiedTasks
          .filter(task => task.dueDate)
          .map(task => {
            const dueDate = new Date(task.dueDate);
            const hours = dueDate.getHours();
            const minutes = dueDate.getMinutes();
            const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
            
            // Durée basée sur energyLevel
            let duration = 60;
            if (task.energyLevel === 0) duration = 30;
            else if (task.energyLevel === 1) duration = 45;
            else if (task.energyLevel === 2) duration = 60;
            else if (task.energyLevel === 3) duration = 90;
            
            return {
              time: timeStr,
              duration,
              activity: task.title,
              priority: task.priority === 4,
            };
          })
          .sort((a, b) => {
            const [aHours, aMinutes] = a.time.split(":").map(Number);
            const [bHours, bMinutes] = b.time.split(":").map(Number);
            return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
          });
        
        // Ajouter des pauses
        const blocksWithBreaks: TimelineBlock[] = [];
        for (let i = 0; i < blocks.length; i++) {
          blocksWithBreaks.push(blocks[i]);
          
          if (blocks[i].duration >= 90 && i < blocks.length - 1) {
            const [hours, minutes] = blocks[i].time.split(":").map(Number);
            const endTime = hours * 60 + minutes + blocks[i].duration;
            const breakHours = Math.floor(endTime / 60);
            const breakMinutes = endTime % 60;
            const breakTimeStr = `${breakHours.toString().padStart(2, "0")}:${breakMinutes.toString().padStart(2, "0")}`;
            
            blocksWithBreaks.push({
              time: breakTimeStr,
              duration: 15,
              activity: "Pause",
              priority: false,
            });
          }
        }
        
        setTimeline(blocksWithBreaks);
        setStep("ideal-day");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, buildStep, clarifiedTasks]);

  // Édition de l'heure
  const handleTimeEdit = (index: number) => {
    if (!isEditing) return;
    setEditingIndex(index);
    setEditingTime(timeline[index].time);
  };

  const handleTimeSave = () => {
    if (editingIndex === null) return;
    
    const updatedTimeline = [...timeline];
    updatedTimeline[editingIndex] = {
      ...updatedTimeline[editingIndex],
      time: editingTime,
    };
    
    // Trier par heure
    updatedTimeline.sort((a, b) => {
      const [aHours, aMinutes] = a.time.split(":").map(Number);
      const [bHours, bMinutes] = b.time.split(":").map(Number);
      return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
    });
    
    setTimeline(updatedTimeline);
    setEditingIndex(null);
  };

  // Lien App Store avec session
  const appStoreLink = useMemo(() => {
    const url = new URL(APP_STORE_URL);
    if (sessionIdRef.current) {
      url.searchParams.set("scan_id", sessionIdRef.current);
    }
    return url.toString();
  }, []);

  // Grouper les tâches par catégorie
  const groupedTasks = clarifiedTasks.reduce((acc, task) => {
    const category = task.category || "Général";
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {} as Record<string, ClarifiedTask[]>);

  // Progress circulaire
  const circumference = 2 * Math.PI * 56;
  const progress = completedBuildSteps.length / BUILD_STEPS.length;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-12">
        <AnimatePresence mode="wait">
          {/* ÉTAPE 0: Hook - avant les tâches */}
          {step === "hook" && (
            <motion.div
              key="hook"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-1 flex-col justify-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-12 text-center"
              >
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Vide ta tête en 20 secondes.
                </h1>
                <p className="mt-4 text-lg text-black/60">
                  Dis-moi tout ce que tu dois faire et je t&apos;organise ta journée automatiquement.
                </p>
                <p className="mt-3 text-base text-black/50">
                  Devoirs, projets, exams, trucs en retard… balance tout. On s&apos;occupe du reste.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  type="button"
                  onClick={() => setStep("tasks-input")}
                  className="w-full rounded-3xl bg-emerald-500 py-4 text-lg font-semibold text-white transition hover:bg-emerald-600"
                >
                  Organiser ma journée maintenant
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ÉTAPE 1: Entrée des tâches */}
          {step === "tasks-input" && (
            <motion.div
              key="tasks-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-1 flex-col justify-center"
            >
              {/* Petit texte en haut - enlève la friction */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6 text-center text-base text-black/70"
              >
                Parle naturellement : ex: réviser partiels, finir exposé, sport 18h, appeler coloc
              </motion.p>

              {/* Chips de suggestions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 flex flex-wrap justify-center gap-2"
              >
                {PROMPT_CHIPS.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => handleChipClick(chip.label)}
                    className="rounded-full bg-black/5 px-4 py-2 text-sm text-black/60 transition hover:bg-black/10"
                  >
                    {chip.label}
                  </button>
                ))}
              </motion.div>

              {/* Zone de texte */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <div className="relative">
                  <textarea
                    value={tasks}
                    onChange={(e) => setTasks(e.target.value)}
                    placeholder="Ex: Réviser le chapitre 12, finir le rapport de stage, appeler maman..."
                    className="min-h-[200px] w-full resize-none rounded-2xl border border-black/10 bg-white p-4 pr-14 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={toggleRecording}
                    disabled={isLoading}
                    className={`absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full transition disabled:opacity-50 ${
                      isRecording
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-black/5 text-black/60 hover:bg-black/10"
                    }`}
                    title={isRecording ? "Arrêter l'enregistrement" : "Dicter avec le micro"}
                  >
                    {isRecording ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </button>
                  {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      <span className="text-xs font-medium text-red-600">Enregistrement…</span>
                    </div>
                  )}
                </div>
                <p className="mt-2 pl-1 text-xs text-black/40">
                  Le désordre, c&apos;est OK.
                </p>
              </motion.div>

              {/* Erreur */}
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 text-center text-sm text-red-500"
                >
                  {error}
                </motion.p>
              )}

              {/* Bouton continuer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <button
                  type="button"
                  onClick={handleSubmitTasks}
                  disabled={!tasks.trim() || isLoading}
                  className="w-full rounded-3xl bg-emerald-500 py-4 text-lg font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyse en cours…
                    </span>
                  ) : (
                    "Continuer"
                  )}
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ÉTAPE 2: Clarification des tâches */}
          {step === "task-clarification" && (
            <motion.div
              key="task-clarification"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-1 flex-col"
            >
              {/* Titre */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8 text-center"
              >
                <h1 className="text-2xl font-semibold tracking-tight">
                  Voilà ce qu&apos;on a compris.
                </h1>
              </motion.div>

              {/* Liste des tâches groupées */}
              <div className="flex-1 space-y-6 pb-28">
                {Object.entries(groupedTasks).map(([category, categoryTasks], categoryIndex) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + categoryIndex * 0.1 }}
                  >
                    <p className="mb-3 pl-1 text-sm text-black/40">{category}</p>
                    <div className="space-y-2">
                      {categoryTasks.map((task, taskIndex) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + categoryIndex * 0.1 + taskIndex * 0.05 }}
                          className={`rounded-2xl border p-4 ${
                            task.priority === 4
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "border-black/10 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkbox priorité */}
                            <button
                              type="button"
                              onClick={() => togglePriority(task.id)}
                              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                                task.priority === 4
                                  ? "border-emerald-500 bg-emerald-500"
                                  : "border-black/20"
                              }`}
                            >
                              {task.priority === 4 && (
                                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>

                            {/* Titre éditable */}
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) => updateTaskTitle(task.id, e.target.value)}
                              className="flex-1 bg-transparent text-base focus:outline-none"
                            />

                            {/* Bouton supprimer */}
                            <button
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              className="p-1 text-black/40 transition hover:text-red-500"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          {task.priority === 4 && (
                            <p className="mt-2 pl-9 text-xs text-emerald-600">
                              Priorité pour demain
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}

                {clarifiedTasks.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-black/40">Aucune tâche détectée…</p>
                  </div>
                )}
              </div>

              {/* Footer fixe */}
              <div className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-white px-6 py-6">
                <div className="mx-auto max-w-2xl">
                  <button
                    type="button"
                    onClick={handleBuildPlan}
                    disabled={clarifiedTasks.length === 0}
                    className="w-full rounded-3xl bg-emerald-500 py-4 text-lg font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Construire ma journée idéale
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 3: Construction du plan */}
          {step === "building-plan" && (
            <motion.div
              key="building-plan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col items-center justify-center"
            >
              {/* Titre */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center text-2xl font-semibold tracking-tight"
              >
                On prépare ta journée idéale…
              </motion.h1>

              {/* Progress circulaire */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative mb-12"
              >
                <svg width="160" height="160" className="-rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="56"
                    stroke="rgba(0,0,0,0.05)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="56"
                    stroke="#16A34A"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-semibold">
                    {completedBuildSteps.length}/{BUILD_STEPS.length}
                  </span>
                </div>
              </motion.div>

              {/* Liste des étapes */}
              <div className="w-full max-w-md space-y-3">
                {BUILD_STEPS.map((s, index) => {
                  const isCompleted = completedBuildSteps.includes(index);
                  const isCurrent = buildStep === index;

                  return (
                    <motion.div
                      key={s.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`flex items-center gap-4 rounded-2xl p-4 ${
                        isCurrent
                          ? "border border-emerald-500/20 bg-emerald-500/10"
                          : isCompleted
                          ? "bg-emerald-500/5"
                          : "bg-black/5"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          isCompleted
                            ? "bg-emerald-500"
                            : isCurrent
                            ? "bg-emerald-500/20"
                            : "bg-black/10"
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div
                            className={`h-2 w-2 rounded-full ${
                              isCurrent ? "bg-emerald-500" : "bg-black/30"
                            }`}
                          />
                        )}
                      </div>

                      <span
                        className={`flex-1 ${
                          isCurrent
                            ? "font-medium text-black"
                            : isCompleted
                            ? "text-emerald-600"
                            : "text-black/40"
                        }`}
                      >
                        {s.text}
                      </span>

                      {isCurrent && (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 4: Journée idéale */}
          {step === "ideal-day" && (
            <motion.div
              key="ideal-day"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col pb-52"
            >
              {/* Message dopamine */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8 text-center"
              >
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Ta journée est optimisée.
                </h1>
                <p className="mt-3 text-base text-black/60">
                  Imagine avoir ça automatiquement tous les jours.
                </p>
              </motion.div>

              {/* Priorités */}
              {priorities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6"
                >
                  <h2 className="mb-4 text-lg font-semibold">Tes 3 priorités</h2>
                  <div className="space-y-3">
                    {priorities.map((priority, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
                          {index + 1}
                        </div>
                        <span className="text-black/80">{priority}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8 space-y-2"
              >
                {timeline.map((block, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.03 }}
                    className={`flex items-center gap-4 rounded-2xl border p-4 ${
                      block.priority
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-black/10"
                    } ${isEditing ? "border-emerald-500/30" : ""}`}
                  >
                    {/* Heure */}
                    <button
                      type="button"
                      onClick={() => handleTimeEdit(index)}
                      disabled={!isEditing}
                      className={`flex w-16 flex-col items-center ${
                        isEditing ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      {editingIndex === index ? (
                        <input
                          type="time"
                          value={editingTime}
                          onChange={(e) => setEditingTime(e.target.value)}
                          onBlur={handleTimeSave}
                          onKeyDown={(e) => e.key === "Enter" && handleTimeSave()}
                          className="w-16 rounded border border-emerald-500 bg-white px-1 text-center text-sm font-semibold text-emerald-600 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`text-sm ${
                            isEditing ? "font-semibold text-emerald-600" : "text-black/60"
                          }`}
                        >
                          {block.time}
                        </span>
                      )}
                      <span className="text-xs text-black/40">{block.duration}min</span>
                    </button>

                    {/* Activité */}
                    <div className="flex-1">
                      <span
                        className={
                          block.priority ? "font-medium text-black" : "text-black/70"
                        }
                      >
                        {block.activity}
                      </span>
                    </div>

                    {/* Indicateur priorité */}
                    {block.priority && (
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {/* Bénéfices futurs */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mb-2 text-center text-sm text-black/60"
              >
                Rappels intelligents, suivi de progrès, planning auto chaque semaine.
              </motion.p>

              {/* Lien Ajuster discret */}
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85 }}
                onClick={() => setIsEditing(!isEditing)}
                className="mx-auto mb-6 block text-sm text-black/60 underline underline-offset-2 transition hover:text-black/80"
              >
                {isEditing ? "Sauvegarder les horaires" : "Ajuster les horaires"}
              </motion.button>

              {/* Footer fixe */}
              <div className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-white px-6 py-6">
                <div className="mx-auto flex max-w-2xl flex-col gap-3">
                  <a
                    href={appStoreLink}
                    className="flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-500 py-4 text-lg font-semibold text-white transition hover:bg-emerald-600"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    Installer l&apos;app et garder mon planning
                  </a>
                  <button
                    type="button"
                    onClick={() => setStep("hook")}
                    className="text-center text-sm text-black/50 transition hover:text-black/70"
                  >
                    Continuer sans sauvegarder
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
