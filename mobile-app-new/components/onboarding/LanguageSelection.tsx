import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Language } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSelectionProps {
  onSelect: (language: Language) => void;
}

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export function LanguageSelection({ onSelect }: LanguageSelectionProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('chooseLanguage')}</Text>
          <Text style={styles.subtitle}>{t('changeAnytime')}</Text>
        </View>

        <View style={styles.languageList}>
          {languages.map((lang, index) => (
            <Animated.View
              key={lang.code}
              entering={FadeInDown.delay(200 + index * 100).duration(400)}
            >
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => onSelect(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={styles.languageLabel}>{lang.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -1,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
  },
  languageList: {
    gap: 12,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  flag: {
    fontSize: 36,
  },
  languageLabel: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.5,
    color: '#000000',
  },
});

