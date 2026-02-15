"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AudioVisualizer from "@/components/scan/AudioVisualizer";
import DiagnosticChart, { DiagnosticMessage } from "@/components/scan/DiagnosticChart";
import EnergyTimeline, { TimelineTask } from "@/components/scan/EnergyTimeline";
import EmailCapture from "@/components/scan/EmailCapture";

const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL || "https://apps.apple.com/app/id0000000000";

// Chips de suggestions pour l'entrée des tâches
const PROMPT_CHIPS = [
  { key: "classesLectures", label: "Cours / TD", icon: "📚" },
  { key: "deadlines", label: "Deadlines", icon: "⏰" },
  { key: "revisions", label: "Révisions", icon: "📖" },
  { key: "avoiding", label: "Ce que j'évite", icon: "😅" },
  { key: "personalObligations", label: "Obligations perso", icon: "🏃" },
  { key: "duration", label: "Temps estimé", icon: "⏱️" },
];

// Étapes de construction du plan - Labels améliorés
const BUILD_STEPS = [
  { key: "analysis", text: "Analyse de ta charge mentale…", duration: 1800 },
  { key: "priorities", text: "Priorisation des dossiers complexes…", duration: 2200 },
  { key: "energy", text: "Calcul des niveaux d'énergie optimaux…", duration: 2000 },
  { key: "recovery", text: "Intégration des temps de récupération…", duration: 1800 },
  { key: "plan", text: "Finalisation de ton plan de victoire…", duration: 1500 },
];

type Step = 
  | "hook" 
  | "tasks-input" 
  | "task-clarification" 
  | "diagnostic" 
  | "building-plan" 
  | "ideal-day";

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

export default function ScanClient() {
  const [step, setStep] = useState<Step>("hook");
  const [tasks, setTasks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Task clarification state
  const [clarifiedTasks, setClarifiedTasks] = useState<ClarifiedTask[]>([]);
  
  // Diagnostic state
  const [availableHours, setAvailableHours] = useState(12);
  
  // Building plan state
  const [buildStep, setBuildStep] = useState(0);
  const [completedBuildSteps, setCompletedBuildSteps] = useState<number[]>([]);
  
  // Ideal day state
  const [timelineTasks, setTimelineTasks] = useState<TimelineTask[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  // (zones d'énergie affichées directement dans l'agenda)
  
  // Email capture state
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  
  // Transcription state
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const sessionIdRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Générer un session ID unique
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sessionId =
      window.crypto?.randomUUID?.() ||
      `scan_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
    sessionIdRef.current = sessionId;
  }, []);

  // Calcul du temps total de travail
  const totalWorkHours = useMemo(() => {
    return clarifiedTasks.reduce((sum, task) => sum + (task.estimatedDuration || 30), 0) / 60;
  }, [clarifiedTasks]);

  // Gestion des chips
  const handleChipClick = (label: string) => {
    const newText = tasks ? `${tasks}\n${label}: ` : `${label}: `;
    setTasks(newText);
  };

  // ─── Transcription vocale (MediaRecorder + Whisper API) ───
  // Fonctionne partout : PC Chrome, Android Chrome, iOS Safari
  // Enregistre l'audio localement avec MediaRecorder, puis envoie à Whisper via /api/scan/transcribe

  const toggleRecording = async () => {
    if (typeof window === "undefined") return;

    // Arrêter l'enregistrement → envoyer à Whisper
    if (isRecording) {
      console.log("[SCAN:VOICE] ⏹️ Arrêt de l'enregistrement");
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Démarrer l'enregistrement
    setError(null);
    try {
      console.log("[SCAN:VOICE] 🎤 Demande d'accès au micro…");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[SCAN:VOICE] ✅ Micro autorisé");

      // Choisir le format supporté
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";

      console.log("[SCAN:VOICE] 📦 Format audio:", mimeType || "défaut navigateur");

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Arrêter toutes les pistes du micro
        stream.getTracks().forEach((track) => track.stop());

        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          console.warn("[SCAN:VOICE] ⚠️ Aucun chunk audio enregistré");
          return;
        }

        const audioBlob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });
        console.log("[SCAN:VOICE] 📤 Envoi à Whisper…", {
          size: `${(audioBlob.size / 1024).toFixed(1)} KB`,
          type: audioBlob.type,
          chunks: chunks.length,
        });

        // Envoyer à Whisper pour transcription
        setIsTranscribing(true);
        try {
          const ext = audioBlob.type.includes("mp4") ? "mp4" : "webm";
          const formData = new FormData();
          formData.append("audio", audioBlob, `recording.${ext}`);

          const res = await fetch("/api/scan/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Erreur ${res.status}`);
          }

          const data = await res.json();
          console.log("[SCAN:VOICE] ✅ Transcription reçue:", data.transcription?.slice(0, 80));

          if (data.transcription) {
            setTasks((prev) => {
              const trimmed = data.transcription.trim();
              if (!trimmed) return prev;
              return prev ? `${prev} ${trimmed}` : trimmed;
            });
          }
        } catch (err) {
          console.error("[SCAN:VOICE] ❌ Erreur transcription:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Erreur lors de la transcription. Réessaie."
          );
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.onerror = (e: Event) => {
        console.error("[SCAN:VOICE] ❌ MediaRecorder error:", e);
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setError("Erreur lors de l'enregistrement audio.");
      };

      // Démarrer l'enregistrement (timeslice de 1s pour collecter les chunks régulièrement)
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      console.log("[SCAN:VOICE] 🔴 Enregistrement démarré");
    } catch (err: any) {
      console.error("[SCAN:VOICE] ❌ Erreur accès micro:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Autorise l'accès au micro pour utiliser la transcription.");
      } else if (err.name === "NotFoundError") {
        setError("Aucun micro détecté. Vérifie qu'un micro est branché.");
      } else {
        setError("Impossible d'accéder au micro. Réessaie.");
      }
    }
  };

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
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

  // Passer au diagnostic
  const handleGoToDiagnostic = () => {
    if (clarifiedTasks.length === 0) return;
    setStep("diagnostic");
  };

  // Lancer la construction du plan
  const handleBuildPlan = () => {
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
        
        // Créer la timeline : tâches séquentielles SANS chevauchement
        // Trier par priorité d'abord (les plus importantes en premier le matin),
        // puis par énergie requise (haute énergie = matin quand on est frais)
        const sorted = [...clarifiedTasks].sort((a, b) => {
          if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
          return (b.energyLevel || 0) - (a.energyLevel || 0);
        });

        let currentMinutes = 8 * 60; // Début à 8h
        const END_OF_DAY = 22 * 60; // Fin à 22h
        const timelineWithBreaks: TimelineTask[] = [];
        let consecutiveWork = 0;

        for (const task of sorted) {
          const duration = task.estimatedDuration || 30;

          // Vérifier qu'on reste dans la journée
          if (currentMinutes + duration > END_OF_DAY) break;

          const hours = Math.floor(currentMinutes / 60);
          const mins = currentMinutes % 60;
          const timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;

          timelineWithBreaks.push({
            id: task.id,
            title: task.title,
            time: timeStr,
            duration,
            priority: task.priority === 4,
            energyLevel: task.energyLevel,
            category: task.category,
          });

          currentMinutes += duration;
          consecutiveWork += duration;

          // Pause après 90 min de travail
          if (consecutiveWork >= 90 && currentMinutes + 15 <= END_OF_DAY) {
            const bh = Math.floor(currentMinutes / 60);
            const bm = currentMinutes % 60;
            timelineWithBreaks.push({
              id: `break-${task.id}`,
              title: "Pause récupération",
              time: `${bh.toString().padStart(2, "0")}:${bm.toString().padStart(2, "0")}`,
              duration: 15,
              priority: false,
              energyLevel: 0,
              category: "Récupération",
            });
            currentMinutes += 15;
            consecutiveWork = 0;
          }
        }

        setTimelineTasks(timelineWithBreaks);
        setStep("ideal-day");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, buildStep, clarifiedTasks]);

  // Gérer le changement de tâches
  const handleTimelineTasksChange = (newTasks: TimelineTask[]) => {
    setTimelineTasks(newTasks);
  };

  // Soumettre l'email — on envoie TOUTE la data
  const handleEmailSubmit = async (email: string) => {
    const response = await fetch("/api/scan/save-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        sessionId: sessionIdRef.current,
        rawInput: tasks,
        clarifiedTasks,
        timelineTasks,
        priorities,
        diagnostic: {
          totalWorkHours,
          availableHours,
          crashRatio: availableHours > 0 ? +(totalWorkHours / availableHours).toFixed(2) : 0,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error("Erreur lors de l'envoi");
    }
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-12">
        <AnimatePresence mode="wait">
          {/* ÉTAPE 0: Hook - Le premier contact */}
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
                {/* Logo ou icône */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20"
                >
                  <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </motion.div>

                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Vide ta tête en{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
                    20 secondes.
                  </span>
                </h1>
                <p className="mt-4 text-lg text-white/60">
                  Dis-moi tout ce que tu dois faire et je t&apos;organise ta journée automatiquement.
                </p>
                <p className="mt-3 text-base text-white/40">
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
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Organiser ma journée maintenant
                </button>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex items-center justify-center gap-6 text-white/30 text-sm"
              >
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  100% gratuit
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Privé
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  IA avancée
                </span>
              </motion.div>
            </motion.div>
          )}

          {/* ÉTAPE 1: Entrée des tâches avec visualiseur audio */}
          {step === "tasks-input" && (
            <motion.div
              key="tasks-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-1 flex-col justify-center"
            >
              {/* Titre */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 text-center"
              >
                <h2 className="text-2xl font-semibold">
                  Balance tout ce qui te pèse
                </h2>
                <p className="mt-2 text-white/50 text-sm">
                  Parle naturellement ou écris. Plus tu donnes de détails, meilleur sera le plan.
                </p>
              </motion.div>

              {/* Visualiseur audio quand on enregistre */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <AudioVisualizer isRecording={isRecording} />
              </motion.div>

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
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:border-white/20"
                  >
                    <span>{chip.icon}</span>
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
                  {/* Textarea */}
                  <div className="relative min-h-[200px] w-full rounded-2xl border border-white/10 bg-white/5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                    <textarea
                      value={tasks}
                      onChange={(e) => setTasks(e.target.value)}
                      placeholder={isRecording ? "Parle, je t'écoute… Clique sur stop quand tu as fini." : "Ex: Réviser le chapitre 12 de droit, finir le rapport de stage pour vendredi, appeler maman, sport à 18h, exposé à préparer..."}
                      className="min-h-[200px] w-full resize-none rounded-2xl bg-transparent p-4 pr-14 text-base text-white placeholder:text-white/30 focus:outline-none"
                      disabled={isTranscribing}
                    />
                    {/* Indicateur de transcription Whisper en cours */}
                    {isTranscribing && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                          <span className="text-sm font-medium text-emerald-400">Transcription en cours…</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bouton micro */}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    disabled={isLoading || isTranscribing}
                    className={`absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full transition disabled:opacity-50 ${
                      isRecording
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
                        : isTranscribing
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                    title={isRecording ? "Arrêter et transcrire" : isTranscribing ? "Transcription…" : "Dicter avec le micro"}
                  >
                    {isRecording ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    ) : isTranscribing ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </button>
                  {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      <span className="text-xs font-medium text-red-400">Enregistrement… Clique stop pour transcrire</span>
                    </div>
                  )}
                </div>
                <p className="mt-2 pl-1 text-xs text-white/30">
                  Le désordre, c&apos;est OK. L&apos;IA comprend tout.
                </p>
              </motion.div>

              {/* Erreur */}
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 text-center text-sm text-red-400"
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
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      L&apos;IA analyse…
                    </span>
                  ) : (
                    "Analyser mes tâches"
                  )}
                </button>
              </motion.div>

              {/* Retour */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setStep("hook")}
                className="mt-4 text-center text-sm text-white/40 hover:text-white/60 transition"
              >
                ← Retour
              </motion.button>
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
                  Voilà ce qu&apos;on a compris
                </h1>
                <p className="mt-2 text-white/50 text-sm">
                  Corrige les textes si besoin, ajuste les durées
                </p>
              </motion.div>

              {/* Résumé rapide */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-6 flex items-center justify-center gap-4"
              >
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
                  <span className="block text-2xl font-bold text-emerald-400">{clarifiedTasks.length}</span>
                  <span className="text-xs text-white/50">tâches</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
                  <span className="block text-2xl font-bold text-orange-400">{totalWorkHours.toFixed(1)}h</span>
                  <span className="text-xs text-white/50">estimées</span>
                </div>
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
                    <p className="mb-3 pl-1 text-sm text-white/40">{category}</p>
                    <div className="space-y-2">
                      {categoryTasks.map((task, taskIndex) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + categoryIndex * 0.1 + taskIndex * 0.05 }}
                          className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            {/* Titre éditable */}
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) => updateTaskTitle(task.id, e.target.value)}
                              className="w-full flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-base text-white placeholder:text-white/40 focus:border-emerald-500 focus:outline-none"
                            />

                            {/* Durée avec + / - simple */}
                            <div className="flex items-center justify-end gap-3 text-xs text-white/70">
                              <button
                                type="button"
                                onClick={() =>
                                  setClarifiedTasks((prev) =>
                                    prev.map((t) =>
                                      t.id === task.id
                                        ? {
                                            ...t,
                                            estimatedDuration: Math.max(5, (t.estimatedDuration || 30) - 15),
                                          }
                                        : t
                                    )
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/30 text-base font-medium text-white/80 active:scale-95"
                              >
                                –
                              </button>
                              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] font-medium text-white">
                                <span>{task.estimatedDuration}</span>
                                <span className="text-white/50">min</span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setClarifiedTasks((prev) =>
                                    prev.map((t) =>
                                      t.id === task.id
                                        ? {
                                            ...t,
                                            estimatedDuration: Math.min(600, (t.estimatedDuration || 30) + 15),
                                          }
                                        : t
                                    )
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-emerald-500/80 text-base font-medium text-white active:scale-95"
                              >
                                +
                              </button>
                            </div>

                            {/* Bouton supprimer */}
                            <button
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              className="p-1 text-white/30 transition hover:text-red-400"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}

                {clarifiedTasks.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-white/40">Aucune tâche détectée…</p>
                  </div>
                )}
              </div>

              {/* Footer fixe */}
              <div className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-gray-900/95 backdrop-blur-lg px-6 py-6">
                <div className="mx-auto max-w-2xl">
                  <button
                    type="button"
                    onClick={handleGoToDiagnostic}
                    disabled={clarifiedTasks.length === 0}
                    className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  >
                    Voir mon diagnostic
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 3: Diagnostic de Survie */}
          {step === "diagnostic" && (
            <motion.div
              key="diagnostic"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-1 flex-col pb-28"
            >
              {/* Titre */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-center"
              >
                <h1 className="text-2xl font-semibold tracking-tight">
                  Diagnostic de ta journée
                </h1>
                <p className="mt-2 text-white/50 text-sm">
                  Voici la réalité de ta charge
                </p>
              </motion.div>

              {/* Graphique */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <DiagnosticChart
                  workHours={totalWorkHours}
                  availableHours={availableHours}
                  variant="doughnut"
                />
              </motion.div>

              {/* Message de diagnostic */}
              <DiagnosticMessage
                workHours={totalWorkHours}
                availableHours={availableHours}
              />

              {/* Slider pour ajuster le temps disponible */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-white/70">Temps disponible aujourd&apos;hui</span>
                  <span className="text-lg font-semibold text-emerald-400">{availableHours}h</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="16"
                  step="1"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between mt-2 text-xs text-white/30">
                  <span>4h</span>
                  <span>10h</span>
                  <span>16h</span>
                </div>
              </motion.div>

              {/* Barres comparatives */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <DiagnosticChart
                  workHours={totalWorkHours}
                  availableHours={availableHours}
                  variant="bar"
                />
              </motion.div>

              {/* Footer fixe */}
              <div className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-gray-900/95 backdrop-blur-lg px-6 py-6">
                <div className="mx-auto max-w-2xl">
                  <button
                    type="button"
                    onClick={handleBuildPlan}
                    className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40"
                  >
                    Créer ma stratégie de survie
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 4: Construction du plan */}
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
                On construit ton plan de victoire…
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
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.5 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
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
                      className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${
                        isCurrent
                          ? "border-emerald-500/30 bg-emerald-500/10"
                          : isCompleted
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                          isCompleted
                            ? "bg-emerald-500"
                            : isCurrent
                            ? "bg-emerald-500/30"
                            : "bg-white/10"
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div
                            className={`h-2 w-2 rounded-full ${
                              isCurrent ? "bg-emerald-400" : "bg-white/30"
                            }`}
                          />
                        )}
                      </div>

                      <span
                        className={`flex-1 text-sm ${
                          isCurrent
                            ? "font-medium text-white"
                            : isCompleted
                            ? "text-emerald-400"
                            : "text-white/40"
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

          {/* ÉTAPE 5: Journée idéale — style agenda */}
          {step === "ideal-day" && (
            <motion.div
              key="ideal-day"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col pb-56"
            >
              {/* Header compact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6 text-center"
              >
                <h1 className="text-2xl font-bold tracking-tight">
                  Ta journée{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
                    optimisée
                  </span>
                </h1>
                <p className="mt-2 text-sm text-white/50">
                  Imagine avoir ça automatiquement tous les jours.
                </p>
              </motion.div>

              {/* Agenda */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <EnergyTimeline
                  tasks={timelineTasks}
                  onTasksChange={handleTimelineTasksChange}
                />
              </motion.div>

              {/* Bénéfices futurs — compact */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-white/40"
              >
                <span>✓ Rappels intelligents</span>
                <span>✓ Suivi de progrès</span>
                <span>✓ Planning auto</span>
                <span>✓ Sync calendrier</span>
              </motion.div>

              {/* Footer fixe avec double CTA */}
              <div className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-gray-900/95 backdrop-blur-lg px-6 py-5">
                <div className="mx-auto flex max-w-2xl flex-col gap-2.5">
                  {/* CTA Principal - App Store */}
                  <a
                    href={appStoreLink}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    Installer l&apos;app et garder mon planning
                  </a>

                  {/* CTA Secondaire - Email */}
                  <button
                    type="button"
                    onClick={() => setShowEmailCapture(true)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Recevoir mon planning par email
                  </button>

                  {/* Lien discret */}
                  <button
                    type="button"
                    onClick={() => setStep("hook")}
                    className="text-center text-xs text-white/25 transition hover:text-white/50"
                  >
                    Continuer sans sauvegarder
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Email Capture */}
      <AnimatePresence>
        {showEmailCapture && (
          <EmailCapture
            onSubmit={handleEmailSubmit}
            onClose={() => setShowEmailCapture(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
