import React from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StudyCheckIn } from "@/components/analytics/StudyCheckIn";
import { useLanguage } from "@/contexts/LanguageContext";
export default function StudySummary() {
  const p = useLocalSearchParams(),
    router = useRouter(),
    insets = useSafeAreaInsets();
  const colors = { background: "#F4F8F5", text: "#173B35", textSecondary: "#61736D" };
  const { language } = useLanguage();
  const tr = (fr: string, en: string, es: string) =>
    language === "en" ? en : language === "es" ? es : fr;
  const minutes = Math.floor(Math.max(0, Number(p.seconds) || 0) / 60),
    seconds = Math.max(0, Number(p.seconds) || 0) % 60;
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 24,
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        gap: 20,
      }}
    >
      <StatusBar style="dark" />
      <Text style={{ fontSize: 30, fontWeight: "700", color: colors.text }}>
        {tr(
          "Ton bilan de session",
          "Your session report",
          "Tu informe de sesión",
        )}
      </Text>
      <Text style={{ fontSize: 40, color: "#16a34a", fontWeight: "700" }}>
        {minutes} min {seconds}s
      </Text>
      <Text style={{ color: colors.textSecondary }}>
        {tr(
          "Temps enregistré, hors pauses.",
          "Recorded time, excluding pauses.",
          "Tiempo registrado, sin pausas.",
        )}
      </Text>
      {!!p.sessionId && <StudyCheckIn sessionId={String(p.sessionId)} />}
      <TouchableOpacity
        accessibilityRole="button"
        style={{ padding: 18, backgroundColor: "#166534", borderRadius: 16 }}
        onPress={() =>
          router.replace({
            pathname: "/(tabs)/assistant",
            params: { tab: "analytics" },
          })
        }
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          {tr("Voir mes analyses", "View my analysis", "Ver mis análisis")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        style={{ padding: 18 }}
        onPress={() => router.replace("/(tabs)")}
      >
        <Text style={{ color: colors.text, textAlign: "center" }}>
          {tr("Retour à l’accueil", "Back home", "Volver al inicio")}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
