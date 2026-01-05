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
import { Slider } from '@/components/ui/Slider';
import { useOnboardingData } from '@/hooks/useOnboardingData';

const goalOptions = [
  { value: 'exams', labelKey: 'succeedExams' },
  { value: 'stress', labelKey: 'reduceStress' },
  { value: 'consistent', labelKey: 'stayConsistent' },
  { value: 'overwhelmed', labelKey: 'stopOverwhelmed' },
  { value: 'time', labelKey: 'useTimeBetter' },
];

export default function GoalsPressureScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { saveResponse, getResponse } = useOnboardingData();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [pressureLevel, setPressureLevel] = useState(3);

  // Charger les données sauvegardées
  useEffect(() => {
    const savedGoals = getResponse('goals');
    const savedPressure = getResponse('pressureLevel');
    if (savedGoals) setSelectedGoals(savedGoals as string[]);
    if (savedPressure !== undefined) setPressureLevel(savedPressure as number);
  }, []);

  // Sauvegarder automatiquement
  useEffect(() => {
    if (selectedGoals.length > 0) {
      saveResponse('goals', selectedGoals);
    }
  }, [selectedGoals]);

  useEffect(() => {
    saveResponse('pressureLevel', pressureLevel);
  }, [pressureLevel]);

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else if (selectedGoals.length < 2) {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleContinue = async () => {
    if (selectedGoals.length > 0) {
      await saveResponse('goals', selectedGoals);
      await saveResponse('pressureLevel', pressureLevel);
      await saveResponse('currentStep', 4);
      router.push('/(onboarding-new)/academic-context');
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
              {t('whatMatters') || 'What matters most right now?'}
            </Text>
            <Text style={styles.subtitle}>
              {t('selectUpTo2') || 'Select up to 2'}
            </Text>
          </Animated.View>

          {/* Goals selection */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.goalsContainer}>
            {goalOptions.map((goal, index) => {
              const isSelected = selectedGoals.includes(goal.value);
              const isDisabled = !isSelected && selectedGoals.length >= 2;

              return (
                <Animated.View
                  key={goal.value}
                  entering={FadeInDown.delay(300 + index * 50).duration(400)}
                >
                  <TouchableOpacity
                    onPress={() => !isDisabled && toggleGoal(goal.value)}
                    disabled={isDisabled}
                    style={[
                      styles.goalButton,
                      isSelected && styles.goalButtonSelected,
                      isDisabled && styles.goalButtonDisabled,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.goalButtonContent}>
                      <View style={[
                        styles.radioButton,
                        isSelected && styles.radioButtonSelected,
                      ]}>
                        {isSelected && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                      <Text style={[
                        styles.goalText,
                        isDisabled && styles.goalTextDisabled,
                      ]}>
                        {t(goal.labelKey)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Pressure slider */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.pressureSection}>
            <View style={styles.pressureHeader}>
              <Text style={styles.pressureLabel}>
                {t('pressureLevel') || 'How intense is your current pressure?'}
              </Text>
            </View>

            <Slider
              value={pressureLevel}
              onValueChange={setPressureLevel}
              min={1}
              max={5}
            />

            <View style={styles.pressureLabels}>
              <Text style={styles.pressureLabelText}>
                {t('low') || 'Low'}
              </Text>
              <Text style={styles.pressureLabelText}>
                {t('veryHigh') || 'Very high'}
              </Text>
            </View>

            {/* Pressure indicators */}
            <View style={styles.indicatorsContainer}>
              {[1, 2, 3, 4, 5].map(level => (
                <Animated.View
                  key={level}
                  style={[
                    styles.indicator,
                    {
                      height: level * 6 + 16,
                      opacity: level <= pressureLevel ? 1 : 0.3,
                      backgroundColor: level <= pressureLevel ? '#16A34A' : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}
                />
              ))}
            </View>
          </Animated.View>

          {/* Continue button */}
          <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={selectedGoals.length === 0}
              style={[
                styles.continueButton,
                selectedGoals.length === 0 && styles.continueButtonDisabled,
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
  goalButtonDisabled: {
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
  goalButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  radioButtonInner: {
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
  goalTextDisabled: {
    color: 'rgba(0, 0, 0, 0.3)',
  },
  pressureSection: {
    marginBottom: 32,
  },
  pressureHeader: {
    marginBottom: 16,
  },
  pressureLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    paddingLeft: 4,
  },
  pressureLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  pressureLabelText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 16,
  },
  indicator: {
    width: 8,
    borderRadius: 4,
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

