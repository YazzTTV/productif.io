import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useLanguage } from '@/contexts/LanguageContext';

interface GoalsPressureProps {
  goals: string[];
  pressureLevel: number;
  onContinue: (goals: string[], pressureLevel: number) => void;
}

type GoalKey = 'succeedExams' | 'reduceStress' | 'stayConsistent' | 'stopOverwhelmed' | 'useTimeBetter';

const goalOptions: { key: GoalKey; value: string }[] = [
  { key: 'succeedExams', value: 'succeedExams' },
  { key: 'reduceStress', value: 'reduceStress' },
  { key: 'stayConsistent', value: 'stayConsistent' },
  { key: 'stopOverwhelmed', value: 'stopOverwhelmed' },
  { key: 'useTimeBetter', value: 'useTimeBetter' },
];

export function GoalsPressure({ goals: initialGoals, pressureLevel: initialPressure, onContinue }: GoalsPressureProps) {
  const { t } = useLanguage();
  const [selectedGoals, setSelectedGoals] = useState<string[]>(initialGoals);
  const [pressureLevel, setPressureLevel] = useState(initialPressure);

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const isValid = selectedGoals.length > 0;

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.header}>
          <Text style={styles.title}>{t('whatMatters')}</Text>
        </Animated.View>

        <View style={styles.form}>
          {/* Goals Selection */}
          <View style={styles.goalsContainer}>
            {goalOptions.map((goal, index) => (
              <Animated.View
                key={goal.value}
                entering={FadeInDown.delay(200 + index * 50).duration(300)}
              >
                <TouchableOpacity
                  style={[
                    styles.goalButton,
                    selectedGoals.includes(goal.value) && styles.goalButtonSelected
                  ]}
                  onPress={() => toggleGoal(goal.value)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    selectedGoals.includes(goal.value) && styles.checkboxSelected
                  ]}>
                    {selectedGoals.includes(goal.value) && (
                      <View style={styles.checkmark} />
                    )}
                  </View>
                  <Text style={[
                    styles.goalText,
                    selectedGoals.includes(goal.value) && styles.goalTextSelected
                  ]}>
                    {t(goal.key)}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Pressure Level */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.pressureSection}>
            <Text style={styles.pressureLabel}>{t('pressureLevel')}</Text>
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderFill,
                    { width: `${((pressureLevel - 1) / 4) * 100}%` }
                  ]} 
                />
              </View>
              <View style={styles.sliderDots}>
                {[1, 2, 3, 4, 5].map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.sliderDot,
                      level <= pressureLevel && styles.sliderDotActive
                    ]}
                    onPress={() => setPressureLevel(level)}
                  />
                ))}
              </View>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>{t('low')}</Text>
              <Text style={styles.sliderLabelText}>{t('veryHigh')}</Text>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={() => isValid && onContinue(selectedGoals, pressureLevel)}
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
  },
  form: {
    flex: 1,
  },
  goalsContainer: {
    gap: 8,
    marginBottom: 40,
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  goalButtonSelected: {
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
  goalText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  goalTextSelected: {
    color: '#16A34A',
    fontWeight: '500',
  },
  pressureSection: {
    marginBottom: 32,
  },
  pressureLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 24,
  },
  sliderContainer: {
    position: 'relative',
    height: 40,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 2,
  },
  sliderDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  sliderDotActive: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sliderLabelText: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.4)',
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

