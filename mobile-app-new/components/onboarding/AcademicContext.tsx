import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useLanguage } from '@/contexts/LanguageContext';

interface AcademicContextProps {
  currentSituation: string;
  onContinue: (currentSituation: string) => void;
}

type SituationKey = 'preparingExams' | 'maintainingConsistency' | 'catchingUp' | 'highPerformance' | 'stressManagement';

const situations: { key: SituationKey; value: string }[] = [
  { key: 'preparingExams', value: 'preparingExams' },
  { key: 'maintainingConsistency', value: 'maintainingConsistency' },
  { key: 'catchingUp', value: 'catchingUp' },
  { key: 'highPerformance', value: 'highPerformance' },
  { key: 'stressManagement', value: 'stressManagement' },
];

export function AcademicContext({ currentSituation: initial, onContinue }: AcademicContextProps) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(initial);

  const isValid = selected.length > 0;

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.header}>
          <Text style={styles.title}>{t('currentSituation')}</Text>
          <Text style={styles.subtitle}>{t('selectOne')}</Text>
        </Animated.View>

        <View style={styles.optionsContainer}>
          {situations.map((situation, index) => (
            <Animated.View
              key={situation.value}
              entering={FadeInDown.delay(200 + index * 80).duration(400)}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selected === situation.value && styles.optionButtonSelected
                ]}
                onPress={() => setSelected(situation.value)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radio,
                  selected === situation.value && styles.radioSelected
                ]}>
                  {selected === situation.value && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  selected === situation.value && styles.optionTextSelected
                ]}>
                  {t(situation.key)}
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
    alignItems: 'flex-start',
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
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioSelected: {
    borderColor: '#16A34A',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
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

