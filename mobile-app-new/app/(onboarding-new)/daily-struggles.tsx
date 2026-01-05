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

const struggles = [
  { value: 'toomany', labelKey: 'tooManyTasks' },
  { value: 'focus', labelKey: 'difficultyFocusing' },
  { value: 'stress', labelKey: 'constantStress' },
  { value: 'guilt', labelKey: 'guiltyResting' },
  { value: 'fear', labelKey: 'fearFallingBehind' },
];

export default function DailyStrugglesScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { saveResponse, getResponse } = useOnboardingData();
  const [selectedStruggles, setSelectedStruggles] = useState<string[]>([]);

  // Charger les données sauvegardées
  useEffect(() => {
    const saved = getResponse('dailyStruggles');
    if (saved) setSelectedStruggles(saved as string[]);
  }, []);

  // Sauvegarder automatiquement
  useEffect(() => {
    if (selectedStruggles.length > 0) {
      saveResponse('dailyStruggles', selectedStruggles);
    }
  }, [selectedStruggles]);

  const toggleStruggle = (struggle: string) => {
    if (selectedStruggles.includes(struggle)) {
      setSelectedStruggles(selectedStruggles.filter(s => s !== struggle));
    } else {
      setSelectedStruggles([...selectedStruggles, struggle]);
    }
  };

  const handleContinue = async () => {
    await saveResponse('dailyStruggles', selectedStruggles);
    await saveResponse('currentStep', 6);
    router.push('/(onboarding-new)/work-style-diagnostic');
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
              {t('dailyDifficulties') || 'What makes your days difficult?'}
            </Text>
            <Text style={styles.subtitle}>
              {t('selectMultiple') || 'Select all that apply'}
            </Text>
          </Animated.View>

          {/* Struggles selection */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.strugglesContainer}>
            {struggles.map((struggle, index) => {
              const isSelected = selectedStruggles.includes(struggle.value);

              return (
                <Animated.View
                  key={struggle.value}
                  entering={FadeInDown.delay(300 + index * 50).duration(400)}
                >
                  <TouchableOpacity
                    onPress={() => toggleStruggle(struggle.value)}
                    style={[
                      styles.struggleButton,
                      isSelected && styles.struggleButtonSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.struggleButtonContent}>
                      <View style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}>
                        {isSelected && (
                          <View style={styles.checkboxInner} />
                        )}
                      </View>
                      <Text style={styles.struggleText}>
                        {t(struggle.labelKey)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Continue button */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleContinue}
              style={styles.continueButton}
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
  strugglesContainer: {
    gap: 12,
    marginBottom: 32,
  },
  struggleButton: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  struggleButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  struggleButtonContent: {
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
  struggleText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
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
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

