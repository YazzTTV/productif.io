import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useLanguage } from '@/contexts/LanguageContext';

interface DailyStrugglesProps {
  dailyStruggles: string[];
  onContinue: (dailyStruggles: string[]) => void;
}

type StruggleKey = 'tooManyTasks' | 'difficultyFocusing' | 'constantStress' | 'guiltyResting' | 'fearFallingBehind';

const struggles: { key: StruggleKey; value: string }[] = [
  { key: 'tooManyTasks', value: 'tooManyTasks' },
  { key: 'difficultyFocusing', value: 'difficultyFocusing' },
  { key: 'constantStress', value: 'constantStress' },
  { key: 'guiltyResting', value: 'guiltyResting' },
  { key: 'fearFallingBehind', value: 'fearFallingBehind' },
];

export function DailyStruggles({ dailyStruggles: initial, onContinue }: DailyStrugglesProps) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<string[]>(initial);

  const toggleStruggle = (struggle: string) => {
    setSelected(prev => 
      prev.includes(struggle) 
        ? prev.filter(s => s !== struggle)
        : [...prev, struggle]
    );
  };

  const isValid = selected.length > 0;

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.header}>
          <Text style={styles.title}>{t('dailyDifficulties')}</Text>
          <Text style={styles.subtitle}>{t('selectMultiple')}</Text>
        </Animated.View>

        <View style={styles.optionsContainer}>
          {struggles.map((struggle, index) => (
            <Animated.View
              key={struggle.value}
              entering={FadeInDown.delay(200 + index * 80).duration(400)}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selected.includes(struggle.value) && styles.optionButtonSelected
                ]}
                onPress={() => toggleStruggle(struggle.value)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  selected.includes(struggle.value) && styles.checkboxSelected
                ]}>
                  {selected.includes(struggle.value) && (
                    <View style={styles.checkmark} />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  selected.includes(struggle.value) && styles.optionTextSelected
                ]}>
                  {t(struggle.key)}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={() => isValid && onContinue(selected)}
            activeOpacity={0.8}
            disabled={!isValid}
          >
            <Text style={styles.buttonText}>{t('next')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -1,
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  optionsContainer: {
    flex: 1,
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    gap: 14,
  },
  optionButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  checkmark: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
    lineHeight: 24,
  },
  optionTextSelected: {
    color: '#16A34A',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    backgroundColor: '#16A34A',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

