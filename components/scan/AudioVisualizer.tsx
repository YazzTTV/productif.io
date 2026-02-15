"use client";

import { motion } from "framer-motion";

interface AudioVisualizerProps {
  isRecording: boolean;
  stream?: MediaStream | null; // Gardé pour compatibilité, mais plus nécessaire
}

const BAR_COUNT = 24;

export default function AudioVisualizer({ isRecording }: AudioVisualizerProps) {
  if (!isRecording) {
    // Idle state - barres statiques légères
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex h-16 items-center justify-center gap-[3px]"
      >
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-white/20"
            animate={{
              height: [4, 8, 4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.05,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    );
  }

  // Recording state - animation dynamique (CSS only, pas de getUserMedia)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex h-16 items-center justify-center gap-[3px]"
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        // Chaque barre a une amplitude et un timing différent pour un look organique
        const center = BAR_COUNT / 2;
        const distFromCenter = Math.abs(i - center) / center;
        const maxH = 28 - distFromCenter * 16; // Les barres au centre sont plus hautes
        const minH = 4;
        const duration = 0.4 + Math.random() * 0.3;
        const delay = i * 0.03;

        return (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-emerald-400"
            animate={{
              height: [minH, maxH, minH * 1.5, maxH * 0.7, minH],
              opacity: [0.6, 1, 0.8, 1, 0.6],
            }}
            transition={{
              duration: duration + 0.5,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
            style={{ minHeight: minH }}
          />
        );
      })}
    </motion.div>
  );
}
