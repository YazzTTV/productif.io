import React, { useState, useEffect, useRef } from 'react';
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
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { onboardingService } from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Symptom {
  id: string;
  textKey: string;
}

export default function SymptomsAnalysisScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const symptoms: Symptom[] = [
    { id: 'distraction', textKey: 'symptomDistraction' },
    { id: 'procrastination', textKey: 'symptomProcrastination' },
    { id: 'overwhelmed', textKey: 'symptomOverwhelmed' },
    { id: 'focus', textKey: 'symptomFocus' },
    { id: 'motivation', textKey: 'symptomMotivation' },
    { id: 'sleep', textKey: 'symptomSleep' },
  ];
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showAnalyzing, setShowAnalyzing] = useState(false);
  const isMountedRef = useRef(true);
  const isNavigatingRef = useRef(false);

  const spinnerRotation = useSharedValue(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (showAnalyzing) {
      spinnerRotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );

      const timer = setTimeout(() => {
        if (isMountedRef.current && !isNavigatingRef.current) {
          isNavigatingRef.current = true;
          router.push('/(onboarding-new)/analyzing-symptoms');
        }
      }, 2000);

      return () => {
        clearTimeout(timer);
        cancelAnimation(spinnerRotation);
      };
    }
  }, [showAnalyzing]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptomId)
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleContinue = async () => {
    if (!isMountedRef.current) return;
    
    // Sauvegarder les symptômes sélectionnés dans l'API
    try {
      await onboardingService.saveOnboardingData({
        symptoms: selectedSymptoms,
        currentStep: 7,
      });
      console.log('✅ Symptômes sauvegardés dans l\'API:', selectedSymptoms);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des symptômes:', error);
    }
    
    if (isMountedRef.current) {
      setShowAnalyzing(true);
    }
  };

  if (showAnalyzing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.analyzingContainer}>
          <Animated.View style={[styles.spinnerContainer, spinnerStyle]}>
            <View style={styles.spinner} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={styles.analyzingTitle}>
              {t('analyzingSymptoms') || 'Analyzing your answers…'}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Text style={styles.analyzingDescription}>
              {t('creatingPersonalizedProfile') || 'Creating your personalized profile'}
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '75%' }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.header}>
          <Text style={styles.title}>
            {t('tellUsSymptoms') || 'What makes your days difficult?'}
          </Text>
          <Text style={styles.description}>
            {t('selectAllApply') || 'Select all that apply'}
          </Text>
        </Animated.View>

        {/* Symptoms List */}
        <View style={styles.symptomsList}>
          {symptoms.map((symptom, index) => {
            const isSelected = selectedSymptoms.includes(symptom.id);

            return (
              <Animated.View
                key={symptom.id}
                entering={FadeInDown.delay(200 + index * 80).duration(400)}
              >
                <TouchableOpacity
                  onPress={() => toggleSymptom(symptom.id)}
                  style={[
                    styles.symptomButton,
                    isSelected && styles.symptomButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.symptomText, isSelected && styles.symptomTextSelected]}>
                    {t(symptom.textKey)}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Ionicons name="checkmark" size={20} color="#16A34A" />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Continue Button */}
        <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.buttonContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleContinue}
            disabled={selectedSymptoms.length === 0}
            style={[
              styles.continueButton,
              selectedSymptoms.length === 0 && styles.continueButtonDisabled,
            ]}
          >
            <Text style={[
              styles.continueButtonText,
              selectedSymptoms.length === 0 && styles.continueButtonTextDisabled
            ]}>
              {t('continue') || 'Continue'}
            </Text>
          </TouchableOpacity>

          {selectedSymptoms.length > 0 && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.selectedCount}>
                {selectedSymptoms.length} {t('symptomsSelected') || 'selected'}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressBarContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: -0.03 * 24,
  },
  description: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 24,
  },
  symptomsList: {
    marginBottom: 32,
    gap: 12,
  },
  symptomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  symptomButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  symptomText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  symptomTextSelected: {
    fontWeight: '500',
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  continueButton: {
    backgroundColor: '#16A34A',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueButtonTextDisabled: {
    color: '#FFFFFF',
  },
  selectedCount: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
    marginTop: 12,
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  spinnerContainer: {
    marginBottom: 32,
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    borderTopColor: '#16A34A',
  },
  analyzingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.03 * 24,
  },
  analyzingDescription: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
});
