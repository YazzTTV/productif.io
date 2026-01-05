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

const situations = [
  { value: 'exams', labelKey: 'preparingExams' },
  { value: 'consistency', labelKey: 'maintainingConsistency' },
  { value: 'catchingup', labelKey: 'catchingUp' },
  { value: 'highperformance', labelKey: 'highPerformance' },
  { value: 'stressmanagement', labelKey: 'stressManagement' },
];

export default function AcademicContextScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { saveResponse, getResponse } = useOnboardingData();
  const [currentSituation, setCurrentSituation] = useState('');

  // Charger les données sauvegardées
  useEffect(() => {
    const saved = getResponse('currentSituation');
    if (saved) setCurrentSituation(saved as string);
  }, []);

  // Sauvegarder automatiquement
  useEffect(() => {
    if (currentSituation) {
      saveResponse('currentSituation', currentSituation);
    }
  }, [currentSituation]);

  const handleContinue = async () => {
    if (currentSituation) {
      await saveResponse('currentSituation', currentSituation);
      await saveResponse('currentStep', 5);
      router.push('/(onboarding-new)/daily-struggles');
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
              {t('currentSituation') || 'Which of these feels closest to your situation?'}
            </Text>
            <Text style={styles.subtitle}>
              {t('selectOne') || 'Select one'}
            </Text>
          </Animated.View>

          {/* Situations selection */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.optionsContainer}>
            {situations.map((situation, index) => {
              const isSelected = currentSituation === situation.value;

              return (
                <Animated.View
                  key={situation.value}
                  entering={FadeInDown.delay(300 + index * 50).duration(400)}
                >
                  <TouchableOpacity
                    onPress={() => setCurrentSituation(situation.value)}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}>
                      {t(situation.labelKey)}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Continue button */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={!currentSituation}
              style={[
                styles.continueButton,
                !currentSituation && styles.continueButtonDisabled,
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
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionButton: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
  },
  optionTextSelected: {
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

