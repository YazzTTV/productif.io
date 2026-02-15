"use client";

import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface TimelineTask {
  id: string;
  title: string;
  time: string;
  duration: number;
  priority: boolean;
  energyLevel: number;
  category?: string;
}

export type EnergyZone = "green" | "orange" | "red";

/* ─── Helpers ─── */

function getEnergyColor(level: number): string {
  if (level >= 3) return "bg-emerald-500";
  if (level >= 2) return "bg-emerald-400";
  if (level >= 1) return "bg-orange-400";
  return "bg-red-400";
}

function getEnergyLabel(level: number): string {
  if (level >= 3) return "Fort";
  if (level >= 2) return "Bon";
  if (level >= 1) return "Moyen";
  return "Repos";
}

function getEnergyBadgeClasses(level: number): string {
  if (level >= 2) return "bg-emerald-500/15 text-emerald-400";
  if (level >= 1) return "bg-orange-500/15 text-orange-400";
  return "bg-red-500/15 text-red-400";
}

/** Hauteur en px pour une durée donnée. 1 minute = 1.2px, min 52px */
const PX_PER_MINUTE = 1.2;
const MIN_TASK_HEIGHT = 52;

function taskHeight(duration: number): number {
  return Math.max(MIN_TASK_HEIGHT, Math.round(duration * PX_PER_MINUTE));
}

/* ─── Élément triable ─── */

function SortableTask({ task }: { task: TimelineTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const height = taskHeight(task.duration);

  // N'utilise PAS motion.div ici — ça interfère avec le transform de dnd-kit
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
    height,
  };

  const isBreak = task.category === "Récupération";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2.5 rounded-xl px-3 cursor-grab active:cursor-grabbing select-none ${
        isBreak ? "bg-white/[0.04]" : "bg-white/[0.07]"
      } touch-none`}
    >
      {/* Barre d'énergie */}
      <div
        className={`w-1 rounded-full flex-shrink-0 self-stretch my-2 ${getEnergyColor(
          task.energyLevel
        )}`}
      />

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <span
          className={`block text-sm leading-tight ${
            isBreak ? "text-white/40 italic" : "text-white/90"
          }`}
        >
          {task.title}
        </span>
        <span className="text-[11px] text-white/35 mt-0.5 block">
          {task.time} • {task.duration} min
        </span>
      </div>

      {/* Badge énergie */}
      {!isBreak && (
        <span
          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${getEnergyBadgeClasses(
            task.energyLevel
          )}`}
        >
          {getEnergyLabel(task.energyLevel)}
        </span>
      )}
    </div>
  );
}

/* ─── Marqueur d'heure entre les blocs ─── */

function HourMarker({ hour }: { hour: number }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[11px] font-medium tabular-nums text-white/40 w-12 text-right flex-shrink-0">
        {hour.toString().padStart(2, "0")}:00
      </span>
      <div className="flex-1 h-px bg-white/[0.08]" />
    </div>
  );
}

/* ─── Composant principal ─── */

interface EnergyTimelineProps {
  tasks: TimelineTask[];
  onTasksChange: (tasks: TimelineTask[]) => void;
  onZoneToggle?: (zone: EnergyZone) => void;
  customZones?: Record<EnergyZone, EnergyZone>;
}

export default function EnergyTimeline({ tasks, onTasksChange }: EnergyTimelineProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // Trier par heure
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const [aH, aM] = a.time.split(":").map(Number);
      const [bH, bM] = b.time.split(":").map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });
  }, [tasks]);

  // Calculer les marqueurs d'heures pleines à insérer entre les tâches
  const itemsWithMarkers = useMemo(() => {
    const items: Array<{ type: "task"; task: TimelineTask } | { type: "marker"; hour: number }> = [];
    let lastRenderedHour = -1;

    for (const task of sortedTasks) {
      const [startH, startM] = task.time.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = startMinutes + task.duration;

      // Insérer un marqueur pour l'heure de début si on ne l'a pas encore montré
      const taskStartHour = startH;
      if (taskStartHour > lastRenderedHour) {
        // Ajouter tous les marqueurs d'heures pleines qu'on a sauté
        const fromHour = lastRenderedHour < 0 ? taskStartHour : lastRenderedHour + 1;
        for (let h = fromHour; h <= taskStartHour; h++) {
          items.push({ type: "marker", hour: h });
        }
      }

      items.push({ type: "task", task });

      // Mettre à jour la dernière heure rendue (basée sur la fin de la tâche)
      const endHour = Math.floor(endMinutes / 60);
      lastRenderedHour = Math.max(lastRenderedHour, endHour - (endMinutes % 60 === 0 ? 1 : 0));
    }

    // Ajouter le marqueur de l'heure de fin
    if (sortedTasks.length > 0) {
      const last = sortedTasks[sortedTasks.length - 1];
      const [lH, lM] = last.time.split(":").map(Number);
      const endMin = lH * 60 + lM + last.duration;
      const endHour = Math.floor(endMin / 60);
      if (endHour > lastRenderedHour && endHour <= 23) {
        items.push({ type: "marker", hour: endHour });
      }
    }

    return items;
  }, [sortedTasks]);

  // Bande d'énergie gauche : couleur par zone horaire
  function getZoneColor(hour: number): string {
    if (hour >= 8 && hour < 12) return "bg-emerald-500";
    if (hour >= 12 && hour < 14) return "bg-white/10";
    if (hour >= 14 && hour < 18) return "bg-orange-400";
    return "bg-red-400";
  }

  // Drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
    const newIndex = sortedTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedTasks, oldIndex, newIndex);

    // Recalculer les heures séquentiellement à partir de la première tâche
    const firstTaskMinutes = (() => {
      if (reordered.length === 0) return 8 * 60;
      const [h, m] = reordered[0].time.split(":").map(Number);
      // Garder l'heure de début de la première tâche d'origine
      return sortedTasks.length > 0
        ? (() => {
            const [fh, fm] = sortedTasks[0].time.split(":").map(Number);
            return fh * 60 + fm;
          })()
        : 8 * 60;
    })();

    let currentMinutes = firstTaskMinutes;
    const updated = reordered.map((task) => {
      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      const timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      currentMinutes += task.duration;
      return { ...task, time: timeStr };
    });

    onTasksChange(updated);
  };

  return (
    <div className="relative">
      {/* Légende énergie */}
      <div className="mb-4 flex items-center justify-center gap-4 text-[11px] text-white/50">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Focus max</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-orange-400" />
          <span>Moyen</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-400" />
          <span>Léger</span>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={sortedTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden p-2">
            {/* Bande énergie sur la gauche (fixed) */}
            <div className="flex gap-0">
              {/* Colonne énergie + heure */}
              <div className="flex flex-col">
                {itemsWithMarkers.map((item, idx) => {
                  if (item.type === "marker") {
                    return (
                      <div key={`m-${item.hour}`} className="flex items-center h-6">
                        <div
                          className={`w-1.5 h-full rounded-sm ${getZoneColor(item.hour)} opacity-50`}
                        />
                        <span className="text-[11px] font-medium tabular-nums text-white/40 w-12 text-right px-2">
                          {item.hour.toString().padStart(2, "0")}:00
                        </span>
                        <div className="flex-1" />
                      </div>
                    );
                  }
                  const task = item.task;
                  const [h] = task.time.split(":").map(Number);
                  const height = taskHeight(task.duration);
                  return (
                    <div key={`e-${task.id}`} className="flex" style={{ height }}>
                      <div
                        className={`w-1.5 rounded-sm ${getZoneColor(h)} opacity-50`}
                      />
                      <div className="w-12 flex items-start justify-end px-2 pt-2">
                        <span className="text-[11px] font-medium tabular-nums text-white/50">
                          {task.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Colonne tâches */}
              <div className="flex-1 flex flex-col gap-1">
                {itemsWithMarkers.map((item, idx) => {
                  if (item.type === "marker") {
                    return (
                      <div key={`ml-${item.hour}`} className="h-6 flex items-center">
                        <div className="flex-1 h-px bg-white/[0.08]" />
                      </div>
                    );
                  }
                  return <SortableTask key={item.task.id} task={item.task} />;
                })}
              </div>
            </div>
          </div>
        </SortableContext>
      </DndContext>

      {/* Instruction drag */}
      <p className="mt-3 text-center text-[11px] text-white/30">
        Maintiens une tâche pour la déplacer
      </p>
    </div>
  );
}
