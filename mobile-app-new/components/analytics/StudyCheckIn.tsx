import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { queueStudyCheckin } from "@/lib/studyAnalysis";
import { useLanguage } from "@/contexts/LanguageContext";
export function StudyCheckIn({
  sessionId,
  initialType = "focus",
  onSaved,
}: {
  sessionId?: string;
  initialType?: string;
  onSaved?: () => void;
}) {
  const { language } = useLanguage();
  const colors = { background: "#F4F8F5", surface: "#FFFFFF", text: "#173B35", textSecondary: "#61736D" };
  const tr = (fr: string, en: string, es: string) =>
    language === "en" ? en : language === "es" ? es : fr;
  const [type, setType] = useState(initialType),
    [value, setValue] = useState<number | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const types = [
    ["focus", tr("Concentration", "Focus", "Concentración")],
    ["energy", tr("Énergie", "Energy", "Energía")],
    ["mood", tr("Humeur", "Mood", "Ánimo")],
    ["stress", tr("Stress", "Stress", "Estrés")],
  ];
  async function save() {
    if (value === null) return;
    setBusy(true);
    try {
      await queueStudyCheckin(type, value, sessionId);
      setMessage(
        tr(
          "Enregistré sur cet appareil. Synchronisation automatique.",
          "Saved on this device. Syncs automatically.",
          "Guardado en este dispositivo. Sincronización automática.",
        ),
      );
      onSaved?.();
    } catch {
      setMessage(
        tr(
          "Impossible d’enregistrer. Réessaie.",
          "Could not save. Try again.",
          "No se pudo guardar. Inténtalo otra vez.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View
      style={{
        padding: 18,
        borderRadius: 20,
        backgroundColor: colors.surface,
        gap: 14,
        marginVertical: 12,
      }}
    >
      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 18 }}>
        {tr(
          "Comment s’est passé ce moment ?",
          "How did it feel?",
          "¿Cómo te sentiste?",
        )}
      </Text>
      <Text style={{ color: colors.textSecondary }}>
        {tr(
          "Facultatif · ton ressenti, de 1 (faible) à 10 (élevé).",
          "Optional · your rating, from 1 (low) to 10 (high).",
          "Opcional · tu valoración, de 1 (bajo) a 10 (alto).",
        )}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {types.map(([id, label]) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: type === id }}
            key={id}
            onPress={() => {
              setType(id);
              setValue(null);
              setMessage("");
            }}
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: type === id ? "#166534" : colors.background,
            }}
          >
            <Text style={{ color: type === id ? "white" : colors.text }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${n}/10`}
            accessibilityState={{ selected: value === n }}
            key={n}
            onPress={() => {
              setValue(n);
              setMessage("");
            }}
            style={{
              minWidth: 44,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor: value === n ? "#166534" : colors.background,
            }}
          >
            <Text style={{ color: value === n ? "white" : colors.text }}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        disabled={busy || value === null}
        onPress={save}
        style={{
          padding: 14,
          borderRadius: 12,
          backgroundColor: "#166534",
          opacity: value === null ? 0.45 : 1,
        }}
      >
        {busy ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", textAlign: "center" }}>
            {tr("Enregistrer", "Save", "Guardar")}
          </Text>
        )}
      </TouchableOpacity>
      {!!message && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.textSecondary }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
