import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnalyticsScreen from "./(tabs)/analytics";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
export default function AnalyticsPage() {
  const router = useRouter(),
    insets = useSafeAreaInsets(),
    { colors } = useTheme(),
    { language } = useLanguage();
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        backgroundColor: colors.background,
      }}
    >
      <TouchableOpacity
        accessibilityRole="button"
        style={{ padding: 18 }}
        onPress={() => router.back()}
      >
        <Text style={{ color: colors.text }}>
          {language === "en" ? "Back" : language === "es" ? "Volver" : "Retour"}
        </Text>
      </TouchableOpacity>
      <AnalyticsScreen />
    </View>
  );
}
