"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

function ResendVerification({ token }: { token: string | null }) {
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleResend = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(token ? { token } : {}),
      });
      if (res.ok) {
        setMessage("Email de vérification envoyé.");
      } else if (res.status === 429) {
        setMessage("Merci d'attendre un peu avant de renvoyer.");
      } else {
        setMessage("Impossible d'envoyer l'email.");
      }
    } catch {
      setMessage("Impossible d'envoyer l'email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <button
        onClick={handleResend}
        disabled={loading}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: "#10B981",
          color: "#fff",
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "Envoi..." : "Renvoyer l'email"}
      </button>
      {message && <p style={{ marginTop: 12, color: "#333" }}>{message}</p>}
    </div>
  );
}

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const [status, setStatus] = React.useState<"loading" | "ok" | "error" | "expired">("loading");
  const [message, setMessage] = React.useState("Vérification en cours...");

  React.useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Lien invalide. Le token est manquant.");
        return;
      }
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          setStatus("ok");
          setMessage("Email vérifié. Tu peux retourner dans l'app.");
        } else if (res.status === 410) {
          setStatus("expired");
          setMessage("Lien expiré. Demande un nouvel email de vérification.");
        } else {
          setStatus("error");
          setMessage("Lien invalide. Demande un nouvel email de vérification.");
        }
      } catch {
        setStatus("error");
        setMessage("Impossible de vérifier le lien. Réessaie plus tard.");
      }
    };
    run();
  }, [token]);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 32, color: "#111" }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>
        {status === "ok" ? "Email vérifié" : "Vérification email"}
      </h1>
      <p style={{ fontSize: 15, color: "#333" }}>{message}</p>
      <ResendVerification token={token} />
    </div>
  );
}
