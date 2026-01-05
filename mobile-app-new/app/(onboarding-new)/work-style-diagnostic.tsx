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

export default function WorkStyleDiagnosticScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { saveResponse, getResponse } = useOnboardingData();
  const [mentalLoad, setMentalLoad] = useState(3);
  const [focusQuality, setFocusQuality] = useState(3);
  const [satisfaction, setSatisfaction] = useState(3);
  const [overthinkTasks, setOverthinkTasks] = useState<boolean | null>(null);
  const [shouldDoMore, setShouldDoMore] = useState<boolean | null>(null);

  // Charger les données sauvegardées
  useEffect(() => {
    const savedMentalLoad = getResponse('mentalLoad');
    const savedFocusQuality = getResponse('focusQuality');
    const savedSatisfaction = getResponse('satisfaction');
    const savedOverthink = getResponse('overthinkTasks');
    const savedShouldDoMore = getResponse('shouldDoMore');
    
    if (savedMentalLoad !== undefined) setMentalLoad(savedMentalLoad as number);
    if (savedFocusQuality !== undefined) setFocusQuality(savedFocusQuality as number);
    if (savedSatisfaction !== undefined) setSatisfaction(savedSatisfaction as number);
    if (savedOverthink !== undefined) setOverthinkTasks(savedOverthink as boolean);
    if (savedShouldDoMore !== undefined) setShouldDoMore(savedShouldDoMore as boolean);
  }, []);

  // Sauvegarder automatiquement
  useEffect(() => {
    saveResponse('mentalLoad', mentalLoad);
  }, [mentalLoad]);

  useEffect(() => {
    saveResponse('focusQuality', focusQuality);
  }, [focusQuality]);

  useEffect(() => {
    saveResponse('satisfaction', satisfaction);
  }, [satisfaction]);

  useEffect(() => {
    if (overthinkTasks !== null) {
      saveResponse('overthinkTasks', overthinkTasks);
    }
  }, [overthinkTasks]);

  useEffect(() => {
    if (shouldDoMore !== null) {
      saveResponse('shouldDoMore', shouldDoMore);
    }
  }, [shouldDoMore]);

  const getMentalLoadLabel = (value: number) => {
    if (value <= 2) return t('low') || 'Low';
    if (value === 3) return t('moderate') || 'Moderate';
    return t('overwhelming') || 'Overwhelming';
  };

  const getFocusQualityLabel = (value: number) => {
    if (value <= 2) return t('scattered') || 'Scattered';
    if (value === 3) return t('moderate') || 'Moderate';
    return t('deep') || 'Deep';
  };

  const getSatisfactionLabel = (value: number) => {
    if (value <= 2) return t('never') || 'Never';
    if (value === 3) return t('sometimes') || 'Sometimes';
    return t('often') || 'Often';
  };

  const handleContinue = async () => {
    if (overthinkTasks !== null && shouldDoMore !== null) {
      await saveResponse('mentalLoad', mentalLoad);
      await saveResponse('focusQuality', focusQuality);
      await saveResponse('satisfaction', satisfaction);
      await saveResponse('overthinkTasks', overthinkTasks);
      await saveResponse('shouldDoMore', shouldDoMore);
      await saveResponse('currentStep', 7);
      router.push('/(onboarding-new)/goals-intent');
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
              {t('workStyleTitle') || 'Help us understand your work style'}
            </Text>
            <Text style={styles.subtitle}>
              {t('helpUsUnderstand') || 'Be honest — this helps us adapt the system'}
            </Text>
          </Animated.View>

          {/* Sliders */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.slidersContainer}>
            {/* Mental Load */}
            <View style={styles.sliderSection}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>
                  {t('mentalLoad') || 'Mental load'}
                </Text>
                <Text style={styles.sliderValue}>
                  {getMentalLoadLabel(mentalLoad)}
                </Text>
              </View>
              <Slider
                value={mentalLoad}
                onValueChange={setMentalLoad}
                min={1}
                max={5}
              />
              <View style={styles.indicatorsContainer}>
                {[1, 2, 3, 4, 5].map(level => (
                  <View
                    key={level}
                    style={[
                      styles.indicator,
                      {
                        height: level * 6 + 16,
                        opacity: level <= mentalLoad ? 1 : 0.3,
                        backgroundColor: level <= mentalLoad ? '#16A34A' : 'rgba(0, 0, 0, 0.1)',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Focus Quality */}
            <View style={styles.sliderSection}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>
                  {t('focusQuality') || 'Focus quality'}
                </Text>
                <Text style={styles.sliderValue}>
                  {getFocusQualityLabel(focusQuality)}
                </Text>
              </View>
              <Slider
                value={focusQuality}
                onValueChange={setFocusQuality}
                min={1}
                max={5}
              />
              <View style={styles.indicatorsContainer}>
                {[1, 2, 3, 4, 5].map(level => (
                  <View
                    key={level}
                    style={[
                      styles.indicator,
                      {
                        height: level * 6 + 16,
                        opacity: level <= focusQuality ? 1 : 0.3,
                        backgroundColor: level <= focusQuality ? '#16A34A' : 'rgba(0, 0, 0, 0.1)',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Satisfaction */}
            <View style={styles.sliderSection}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>
                  {t('endOfDaySatisfaction') || 'End-of-day satisfaction'}
                </Text>
                <Text style={styles.sliderValue}>
                  {getSatisfactionLabel(satisfaction)}
                </Text>
              </View>
              <Slider
                value={satisfaction}
                onValueChange={setSatisfaction}
                min={1}
                max={5}
              />
              <View style={styles.indicatorsContainer}>
                {[1, 2, 3, 4, 5].map(level => (
                  <View
                    key={level}
                    style={[
                      styles.indicator,
                      {
                        height: level * 6 + 16,
                        opacity: level <= satisfaction ? 1 : 0.3,
                        backgroundColor: level <= satisfaction ? '#16A34A' : 'rgba(0, 0, 0, 0.1)',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Binary questions */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.questionsContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>
                {t('overthinkQuestion') || 'Do you overthink what to work on?'}
              </Text>
              <View style={styles.questionButtons}>
                <TouchableOpacity
                  onPress={() => setOverthinkTasks(true)}
                  style={[
                    styles.questionButton,
                    overthinkTasks === true && styles.questionButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.questionButtonText,
                    overthinkTasks === true && styles.questionButtonTextSelected,
                  ]}>
                    {t('yes') || 'Yes'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setOverthinkTasks(false)}
                  style={[
                    styles.questionButton,
                    overthinkTasks === false && styles.questionButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.questionButtonText,
                    overthinkTasks === false && styles.questionButtonTextSelected,
                  ]}>
                    {t('no') || 'No'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.questionCard}>
              <Text style={styles.questionText}>
                {t('shouldDoMoreQuestion') || 'Do you feel you should always do more?'}
              </Text>
              <View style={styles.questionButtons}>
                <TouchableOpacity
                  onPress={() => setShouldDoMore(true)}
                  style={[
                    styles.questionButton,
                    shouldDoMore === true && styles.questionButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.questionButtonText,
                    shouldDoMore === true && styles.questionButtonTextSelected,
                  ]}>
                    {t('yes') || 'Yes'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShouldDoMore(false)}
                  style={[
                    styles.questionButton,
                    shouldDoMore === false && styles.questionButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.questionButtonText,
                    shouldDoMore === false && styles.questionButtonTextSelected,
                  ]}>
                    {t('no') || 'No'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Continue button */}
          <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={overthinkTasks === null || shouldDoMore === null}
              style={[
                styles.continueButton,
                (overthinkTasks === null || shouldDoMore === null) && styles.continueButtonDisabled,
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
    marginBottom: 40,
  },
  slidersContainer: {
    gap: 32,
    marginBottom: 32,
  },
  sliderSection: {
    gap: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  sliderValue: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 8,
  },
  indicator: {
    width: 8,
    borderRadius: 4,
  },
  questionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  questionCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  questionText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 16,
  },
  questionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  questionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  questionButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  questionButtonTextSelected: {
    color: '#16A34A',
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

