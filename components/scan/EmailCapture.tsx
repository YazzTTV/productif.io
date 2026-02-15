"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EmailCaptureProps {
  onSubmit: (email: string) => Promise<void>;
  onClose: () => void;
}

export default function EmailCapture({ onSubmit, onClose }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setError("Entre une adresse email valide");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(email);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-gray-900 p-8"
      >
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20"
              >
                <svg
                  className="h-8 w-8 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">
                C&apos;est envoyé !
              </h3>
              <p className="text-white/60 text-sm mb-6">
                Ton planning arrive dans ta boîte mail. Vérifie tes spams si tu ne le vois pas.
              </p>
              <button
                onClick={onClose}
                className="w-full rounded-2xl bg-white/10 py-3 font-medium text-white transition hover:bg-white/20"
              >
                Fermer
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Recevoir mon planning
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 text-white/40 hover:text-white/60 transition"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <p className="text-white/60 text-sm mb-6">
                On t&apos;envoie ton planning optimisé par email. Gratuit, sans spam.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="ton@email.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-white placeholder:text-white/30 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    autoFocus
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-400"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full rounded-2xl bg-emerald-500 py-4 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Envoi en cours…
                    </span>
                  ) : (
                    "Recevoir mon planning"
                  )}
                </button>
              </form>

              {/* Privacy note */}
              <p className="mt-4 text-center text-xs text-white/30">
                En continuant, tu acceptes de recevoir des emails de productif.io
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
