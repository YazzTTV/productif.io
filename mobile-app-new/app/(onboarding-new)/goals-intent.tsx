import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingData } from '@/hooks/useOnboardingData';

const goals = [
  { value: 'clarity', labelKey: 'workWithClarity' },
  { value: 'control', labelKey: 'feelInControl' },
  { value: 'reducestress', labelKey: 'reduceStress' },
  { value: 'consistent', labelKey: 'beConsistent' },
  { value: 'mentalenergy', labelKey: 'stopWastingEnergy' },
];

const horizons = [
  { value: 'twoweeks', labelKey: 'next2Weeks' },
  { value: 'semester', labelKey: 'thisSemester' },
  { value: 'year', labelKey: 'thisYear' },
];

export default function GoalsIntentScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { saveResponse, getResponse } = useOnboardingData();
  const [wantToChange, setWantToChange] = useState<string[]>([]);
  const [timeHorizon, setTimeHorizon] = useState('');

  // Charger les données sauvegardées
  useEffect(() => {
    const savedWantToChange = getResponse('wantToChange');
    const savedTimeHorizon = getResponse('timeHorizon');
    if (savedWantToChange) setWantToChange(savedWantToChange as string[]);
    if (savedTimeHorizon) setTimeHorizon(savedTimeHorizon as string);
  }, []);

  // Sauvegarder automatiquement
  useEffect(() => {
    if (wantToChange.length > 0) {
      saveResponse('wantToChange', wantToChange);
    }
  }, [wantToChange]);

  useEffect(() => {
    if (timeHorizon) {
      saveResponse('timeHorizon', timeHorizon);
    }
  }, [timeHorizon]);

  const toggleGoal = (goal: string) => {
    if (wantToChange.includes(goal)) {
      setWantToChange(wantToChange.filter(g => g !== goal));
    } else {
      setWantToChange([...wantToChange, goal]);
    }
  };

  const handleContinue = async () => {
    if (wantToChange.length > 0 && timeHorizon) {
      await saveResponse('wantToChange', wantToChange);
      await saveResponse('timeHorizon', timeHorizon);
      await saveResponse('currentStep', 8);
      router.push('/(onboarding-new)/tasks-awareness');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Title */}
          <Animated.View entering={FadeIn.delay(100).duration(400)}>
            <Text style={styles.title}>
              {t('whatToChange') || 'What do you want to change?'}
            </Text>
            <Text style={styles.subtitle}>
              {t('selectMultiple') || 'Select all that apply'}
            </Text>
          </Animated.View>

          {/* Goals selection */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.goalsContainer}>
            {goals.map((goal, index) => {
              const isSelected = wantToChange.includes(goal.value);

              return (
                <Animated.View
                  key={goal.value}
                  entering={FadeInDown.delay(300 + index * 50).duration(400)}
                >
                  <TouchableOpacity
                    onPress={() => toggleGoal(goal.value)}
                    style={[
                      styles.goalButton,
                      isSelected && styles.goalButtonSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.goalButtonContent}>
                      <View style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}>
                        {isSelected && (
                          <View style={styles.checkboxInner} />
                        )}
                      </View>
                      <Text style={styles.goalText}>
                        {t(goal.labelKey)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Time horizon */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.horizonSection}>
            <Text style={styles.horizonLabel}>
              {t('timeHorizon') || 'Time horizon'}
            </Text>
            <View style={styles.horizonsContainer}>
              {horizons.map((horizon) => {
                const isSelected = timeHorizon === horizon.value;

                return (
                  <TouchableOpacity
                    key={horizon.value}
                    onPress={() => setTimeHorizon(horizon.value)}
                    style={[
                      styles.horizonButton,
                      isSelected && styles.horizonButtonSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.horizonText,
                      isSelected && styles.horizonTextSelected,
                    ]}>
                      {t(horizon.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Continue button */}
          <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={wantToChange.length === 0 || !timeHorizon}
              style={[
                styles.continueButton,
                (wantToChange.length === 0 || !timeHorizon) && styles.continueButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {t('next') || 'Next'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.03 * 24,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
    marginBottom: 32,
  },
  goalsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  goalButton: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  goalButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  goalButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  goalText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  horizonSection: {
    marginBottom: 32,
  },
  horizonLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 12,
    paddingLeft: 4,
  },
  horizonsContainer: {
    gap: 8,
  },
  horizonButton: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  horizonButtonSelected: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  horizonText: {
    fontSize: 16,
    color: '#000000',
  },
  horizonTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  continueButton: {
    backgroundColor: '#16A34A',
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

