import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { onboardingService } from '@/lib/api';

interface Symptom {
  id: string;
  textKey: string;
}

export default function SymptomsAnalysisScreen() {
  const { t } = useLanguage();
  
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

  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (showAnalyzing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );

      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
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
        cancelAnimation(rotation);
        cancelAnimation(scale);
      };
    }
  }, [showAnalyzing]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
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
        currentStep: 7, // Étape des symptômes
      });
      console.log('✅ Symptômes sauvegardés dans l\'API:', selectedSymptoms);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des symptômes:', error);
      // Ne pas bloquer le flux
    }
    
    if (isMountedRef.current) {
      setShowAnalyzing(true);
    }
  };

  if (showAnalyzing) {
    return (
      <View style={styles.container}>
        <View style={styles.analyzingContainer}>
          <Animated.View style={[styles.analyzingIcon, animatedIconStyle]}>
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              style={styles.analyzingIconGradient}
            >
              <Ionicons name="brain" size={40} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={styles.analyzingTitle}>{t('analyzingSymptoms')}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Text style={styles.analyzingDescription}>
              {t('creatingPersonalizedProfile')}
            </Text>
          </Animated.View>

          {/* Loading Dots */}
          <View style={styles.loadingDots}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={styles.dot}
                entering={FadeIn.delay(i * 150).duration(300)}
              />
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Particules */}
      <View style={styles.particlesContainer}>
        {[...Array(15)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.header}>
          <View style={styles.headerIcon}>
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              style={styles.headerIconGradient}
            >
              <Ionicons name="brain" size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>{t('tellUsSymptoms')}</Text>
          <Text style={styles.description}>
            {t('selectAllApply')}
          </Text>
        </Animated.View>

        {/* Progress Indicator */}
        <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.progressIndicator}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressDotInactive]} />
        </Animated.View>

        {/* Symptoms List */}
        <View style={styles.symptomsList}>
          {symptoms.map((symptom, index) => {
            const isSelected = selectedSymptoms.includes(symptom.id);

            return (
              <Animated.View
                key={symptom.id}
                entering={FadeInDown.delay(300 + index * 100).duration(400)}
              >
                <TouchableOpacity
                  onPress={() => toggleSymptom(symptom.id)}
                  style={[
                    styles.symptomButton,
                    isSelected && styles.symptomButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={isSelected ? '#00C27A' : '#D1D5DB'}
                  />
                  <Text style={[styles.symptomText, isSelected && styles.symptomTextSelected]}>
                    {t(symptom.textKey)}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Info Box */}
        <Animated.View entering={FadeInDown.delay(800).duration(400)}>
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              {t('symptomInfo')}
            </Text>
          </View>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View entering={FadeInDown.delay(900).duration(400)}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleContinue}
            disabled={selectedSymptoms.length === 0}
          >
            <LinearGradient
              colors={selectedSymptoms.length > 0 ? ['#00C27A', '#00D68F'] : ['#E5E7EB', '#E5E7EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <Text style={[
                styles.continueButtonText,
                selectedSymptoms.length === 0 && styles.continueButtonTextDisabled
              ]}>
                {t('discoverProfile')}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={selectedSymptoms.length > 0 ? '#FFFFFF' : '#9CA3AF'}
              />
            </LinearGradient>
          </TouchableOpacity>

          {selectedSymptoms.length > 0 && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.selectedCount}>
                {selectedSymptoms.length} {t('symptomsSelected')}
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
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 194, 122, 0.1)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  progressDot: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00C27A',
  },
  progressDotInactive: {
    backgroundColor: 'rgba(0, 194, 122, 0.3)',
  },
  symptomsList: {
    marginBottom: 24,
    gap: 12,
  },
  symptomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  symptomButtonSelected: {
    borderColor: '#00C27A',
    backgroundColor: 'rgba(0, 194, 122, 0.05)',
  },
  symptomText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  symptomTextSelected: {
    color: '#374151',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueButtonTextDisabled: {
    color: '#9CA3AF',
  },
  selectedCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  analyzingIcon: {
    marginBottom: 32,
  },
  analyzingIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  analyzingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  analyzingDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00C27A',
  },
});

