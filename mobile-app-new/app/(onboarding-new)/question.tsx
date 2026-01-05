import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { onboardingService } from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Option {
  id: string;
  textKey: string;
}

export default function QuestionScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const questions = [
    {
      questionKey: "q1",
      options: [
        { id: 'A', textKey: "q1a" },
        { id: 'B', textKey: "q1b" },
        { id: 'C', textKey: "q1c" },
        { id: 'D', textKey: "q1d" }
      ]
    },
    {
      questionKey: "q2",
      options: [
        { id: 'A', textKey: "q2a" },
        { id: 'B', textKey: "q2b" },
        { id: 'C', textKey: "q2c" },
        { id: 'D', textKey: "q2d" }
      ]
    },
    {
      questionKey: "q3",
      options: [
        { id: 'A', textKey: "q3a" },
        { id: 'B', textKey: "q3b" },
        { id: 'C', textKey: "q3c" },
        { id: 'D', textKey: "q3d" }
      ],
      socialProofKey: "q3social"
    },
    {
      questionKey: "q4",
      options: [
        { id: 'A', textKey: "q4a" },
        { id: 'B', textKey: "q4b" },
        { id: 'C', textKey: "q4c" },
        { id: 'D', textKey: "q4d" }
      ],
      socialProofKey: "q4social"
    },
    {
      questionKey: "q5",
      options: [
        { id: 'A', textKey: "q5a" },
        { id: 'B', textKey: "q5b" },
        { id: 'C', textKey: "q5c" },
        { id: 'D', textKey: "q5d" }
      ]
    },
    {
      questionKey: "q6",
      options: [
        { id: 'A', textKey: "q6a" },
        { id: 'B', textKey: "q6b" },
        { id: 'C', textKey: "q6c" },
        { id: 'D', textKey: "q6d" }
      ]
    }
  ];
  const params = useLocalSearchParams();
  const questionIndex = parseInt(params.index as string) || 0;
  const answersParam = params.answers as string;
  const previousAnswers = answersParam ? JSON.parse(answersParam) : [];
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showSocialProof, setShowSocialProof] = useState(false);
  
  const currentQuestion = questions[questionIndex];
  const totalQuestions = questions.length;
  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  const handleSelect = async (optionId: string) => {
    setSelectedOption(optionId);
    
    const newAnswers = [...previousAnswers, optionId];
    
    // Si c'est la question avec social proof, montrer le message
    if (currentQuestion.socialProofKey) {
      setTimeout(() => {
        setShowSocialProof(true);
      }, 300);
      
      setTimeout(() => {
        handleNext(newAnswers);
      }, 2500);
    } else {
      setTimeout(() => {
        handleNext(newAnswers);
      }, 400);
    }
  };

  const handleNext = async (answers: string[]) => {
    // Mapper les réponses aux champs de l'API
    const mapAnswerToField = (questionIndex: number, answer: string): string | null => {
      switch (questionIndex) {
        case 0: // Q1
          return answer === 'A' ? 'details' : answer === 'B' ? 'procrastination' : answer === 'C' ? 'distraction' : 'abandon';
        case 1: // Q2
          return answer === 'A' ? 'frustrated' : answer === 'B' ? 'tired' : answer === 'C' ? 'proud' : 'lost';
        case 2: // Q3
          return answer === 'A' ? 'enemy' : answer === 'B' ? 'twoMinutes' : answer === 'C' ? 'farButBack' : 'managed';
        case 5: // Q6
          return answer === 'A' ? 'growBusiness' : answer === 'B' ? 'manageStudies' : answer === 'C' ? 'buildDiscipline' : 'workLifeBalance';
        default:
          return null;
      }
    };

    // Sauvegarder les réponses dans l'API
    try {
      console.log('💾 [QUESTION] Tentative de sauvegarde des réponses:', answers);
      
      const payload: any = {
        currentStep: questionIndex + 2, // Prochaine étape
      };

      // Mapper les réponses connues
      if (answers[0]) payload.diagBehavior = mapAnswerToField(0, answers[0]);
      if (answers[1]) payload.timeFeeling = mapAnswerToField(1, answers[1]);
      if (answers[2]) payload.phoneHabit = mapAnswerToField(2, answers[2]);
      if (answers[5]) payload.mainGoal = mapAnswerToField(5, answers[5]);

      // Sauvegarder toutes les réponses dans utmParams pour référence
      payload.utmParams = { 
        allAnswers: answers,
        q4: answers[3] || null,
        q5: answers[4] || null,
      };

      console.log('📤 [QUESTION] Payload à envoyer:', JSON.stringify(payload, null, 2));
      
      await onboardingService.saveOnboardingData(payload);
      console.log('✅ [QUESTION] Réponses sauvegardées dans l\'API avec succès');
    } catch (error: any) {
      console.error('❌ [QUESTION] Erreur lors de la sauvegarde des réponses:', error);
      console.error('❌ [QUESTION] Message d\'erreur:', error?.message);
      console.error('❌ [QUESTION] Stack:', error?.stack);
      // Ne pas bloquer le flux si la sauvegarde échoue
    }

    if (questionIndex < totalQuestions - 1) {
      // Aller à la question suivante
      router.push({
        pathname: '/(onboarding-new)/question',
        params: { 
          index: questionIndex + 1,
          answers: JSON.stringify(answers)
        }
      });
    } else {
      // Toutes les questions sont répondues, aller au chargement
      await AsyncStorage.setItem('onboarding_answers', JSON.stringify(answers));
      router.push('/(onboarding-new)/building-plan');
    }
  };

  const handleBack = () => {
    if (questionIndex > 0) {
      const prevAnswers = previousAnswers.slice(0, -1);
      router.back();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress Bar - Fixed at top */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[styles.progressFill, { width: `${progress}%` }]}
            entering={FadeIn.duration(500)}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Back Button */}
          <Animated.View entering={FadeIn.duration(400)}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="rgba(0, 0, 0, 0.6)" />
            </TouchableOpacity>
          </Animated.View>

          {/* Question */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={styles.question}>{t(currentQuestion.questionKey)}</Text>
          </Animated.View>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <Animated.View
              key={option.id}
              entering={FadeInDown.delay(300 + index * 100).duration(400)}
            >
              <TouchableOpacity
                onPress={() => handleSelect(option.id)}
                disabled={selectedOption !== null}
                style={[
                  styles.optionButton,
                  selectedOption === option.id && styles.optionButtonSelected,
                  selectedOption && selectedOption !== option.id && styles.optionButtonDisabled,
                ]}
                activeOpacity={0.7}
              >
                  <Text style={[
                    styles.optionText,
                    selectedOption === option.id && styles.optionTextSelected,
                  ]}>
                    {t(option.textKey)}
                  </Text>
                {selectedOption === option.id && (
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark" size={20} color="#16A34A" />
                </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Social Proof */}
        {currentQuestion.socialProofKey && showSocialProof && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.socialProof}
          >
            <Text style={styles.socialProofEmoji}>💚</Text>
            <Text style={styles.socialProofText}>{t(currentQuestion.socialProofKey)}</Text>
          </Animated.View>
        )}

        {/* Padding bottom */}
        <View style={{ height: 100 }} />
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
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginBottom: 24,
    width: 44,
  },
  question: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 32,
    letterSpacing: -0.03 * 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
  },
  optionButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
  },
  optionTextSelected: {
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
  socialProof: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialProofEmoji: {
    fontSize: 24,
  },
  socialProofText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
});
