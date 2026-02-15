"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface DiagnosticChartProps {
  workHours: number;
  availableHours: number;
  variant?: "doughnut" | "bar";
}

export default function DiagnosticChart({ 
  workHours, 
  availableHours, 
  variant = "doughnut" 
}: DiagnosticChartProps) {
  const surplus = Math.max(0, workHours - availableHours);
  const freeTime = Math.max(0, availableHours - workHours);
  const actualWork = Math.min(workHours, availableHours);

  const crashRatio = workHours / availableHours;

  // Determine severity colors
  const getColor = () => {
    if (crashRatio > 1.5) return { main: "#ef4444", bg: "rgba(239, 68, 68, 0.2)" }; // red
    if (crashRatio > 1.2) return { main: "#f97316", bg: "rgba(249, 115, 22, 0.2)" }; // orange
    if (crashRatio > 1) return { main: "#eab308", bg: "rgba(234, 179, 8, 0.2)" }; // yellow
    return { main: "#10b981", bg: "rgba(16, 185, 129, 0.2)" }; // emerald
  };

  const colors = getColor();

  if (variant === "bar") {
    const barData = {
      labels: ["Travail requis", "Temps disponible"],
      datasets: [
        {
          data: [workHours, availableHours],
          backgroundColor: [colors.main, "rgba(255, 255, 255, 0.3)"],
          borderColor: [colors.main, "rgba(255, 255, 255, 0.5)"],
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };

    const barOptions = {
      indexAxis: "y" as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => `${context.raw.toFixed(1)}h`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255, 255, 255, 0.1)" },
          ticks: { color: "rgba(255, 255, 255, 0.6)" },
        },
        y: {
          grid: { display: false },
          ticks: { color: "rgba(255, 255, 255, 0.8)" },
        },
      },
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-32 w-full"
      >
        <Bar data={barData} options={barOptions} />
      </motion.div>
    );
  }

  // Doughnut chart
  const doughnutData = {
    labels: surplus > 0 
      ? ["Travail planifié", "Surplus (impossible)", ""] 
      : ["Travail planifié", "Temps libre", ""],
    datasets: [
      {
        data: surplus > 0 
          ? [actualWork, surplus, 0] 
          : [actualWork, freeTime, 0],
        backgroundColor: surplus > 0
          ? [colors.main, "#ef4444", "transparent"]
          : [colors.main, "rgba(255, 255, 255, 0.2)", "transparent"],
        borderColor: ["transparent", "transparent", "transparent"],
        borderWidth: 0,
        cutout: "70%",
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (context.dataIndex === 2) return "";
            return `${context.raw.toFixed(1)}h`;
          },
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative h-48 w-48 mx-auto"
    >
      <Doughnut data={doughnutData} options={doughnutOptions} />
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color: colors.main }}>
          {Math.round(crashRatio * 100)}%
        </span>
        <span className="text-xs text-white/60">charge</span>
      </div>
    </motion.div>
  );
}

// Diagnostic message component
export function DiagnosticMessage({ workHours, availableHours }: { workHours: number; availableHours: number }) {
  const crashRatio = workHours / availableHours;

  const getMessage = () => {
    if (crashRatio > 1.5) {
      return {
        title: "Zone de crash intense",
        description: `Tu as ${workHours.toFixed(1)}h de travail pour ${availableHours}h disponibles. Sans optimisation, c'est l'échec garanti.`,
        color: "text-red-400",
        bgColor: "bg-red-500/10 border-red-500/20",
        icon: "🔥",
      };
    }
    if (crashRatio > 1.2) {
      return {
        title: "Journée sous tension",
        description: `Volume détecté : ${workHours.toFixed(1)}h. Tu vas devoir prioriser sérieusement.`,
        color: "text-orange-400",
        bgColor: "bg-orange-500/10 border-orange-500/20",
        icon: "⚠️",
      };
    }
    if (crashRatio > 1) {
      return {
        title: "Objectif ambitieux",
        description: `${workHours.toFixed(1)}h de travail prévu. Serré mais faisable avec la bonne stratégie.`,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/10 border-yellow-500/20",
        icon: "💪",
      };
    }
    return {
      title: "Objectif atteignable",
      description: `${workHours.toFixed(1)}h de travail, ${availableHours}h disponibles. Tu as de la marge !`,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
      icon: "✅",
    };
  };

  const message = getMessage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`rounded-2xl border p-6 ${message.bgColor}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{message.icon}</span>
        <h3 className={`text-lg font-semibold ${message.color}`}>
          {message.title}
        </h3>
      </div>
      <p className="text-white/70 text-sm">
        {message.description}
      </p>
    </motion.div>
  );
}
