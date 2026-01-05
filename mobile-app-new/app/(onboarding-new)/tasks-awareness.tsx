import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tasksService } from '@/lib/api';
import { useOnboardingData } from '@/hooks/useOnboardingData';

const promptChips = [
  'classesLectures',
  'deadlines',
  'revisions',
  'avoiding',
  'personalObligations',
];

export default function TasksAwarenessScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChipClick = (chipKey: string) => {
    const chipText = t(chipKey) || chipKey;
    const newText = tasks ? `${tasks}\n${chipText}: ` : `${chipText}: `;
    setTasks(newText);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, would start/stop speech recognition here
  };

  const handleContinue = async () => {
    if (!tasks.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // L'API gère les dates relatives dans le userInput (aujourd'hui, demain, mercredi, etc.)
      // On n'a pas besoin de passer une date spécifique, l'API va extraire les dates du texte
      console.log('📤 Envoi des tâches à l\'API:', tasks.trim());
      
      // Appeler l'API pour créer les tâches intelligemment
      // L'API va analyser le texte et extraire les dates (aujourd'hui, demain, mercredi, etc.)
      const result = await tasksService.planTomorrow(tasks.trim());
      
      console.log('📥 Réponse de l\'API:', result);
      
      if (!result || !result.tasks) {
        throw new Error('Aucune tâche créée par l\'API');
      }
      
      // Sauvegarder les tâches brutes
      await saveResponse('rawTasks', tasks.trim());
      await saveResponse('currentStep', 9);
      
      // Passer les tâches créées à l'écran suivant
      router.push({
        pathname: '/(onboarding-new)/task-clarification',
        params: {
          tasks: JSON.stringify(result.tasks || []),
          rawInput: tasks.trim(),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la création des tâches:', error);
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Une erreur est survenue lors de la création des tâches'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Title */}
          <Animated.View entering={FadeIn.delay(100).duration(400)}>
            <Text style={styles.title}>
              {t('whatToDo') || 'What do you have to do tomorrow?'}
            </Text>
            <Text style={styles.subtitle}>
              {t('writeOrSpeak') || "Write or speak freely. We'll organize it."}
            </Text>
          </Animated.View>

          {/* Prompt chips */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.chipsContainer}>
            {promptChips.map((chipKey, index) => (
              <TouchableOpacity
                key={chipKey}
                onPress={() => handleChipClick(chipKey)}
                style={styles.chip}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>
                  {t(chipKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Text input with mic */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder={t('typeOrSpeak') || 'Type here or tap mic to speak...'}
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                value={tasks}
                onChangeText={setTasks}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity
                onPress={toggleRecording}
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonRecording,
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isRecording ? 'stop' : 'mic'}
                  size={20}
                  color={isRecording ? '#FFFFFF' : 'rgba(0, 0, 0, 0.6)'}
                />
              </TouchableOpacity>
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording...</Text>
                </View>
              )}
            </View>
            <Text style={styles.helpText}>
              {t('messyIsFine') || 'Messy is fine.'}
            </Text>
          </Animated.View>

          {/* Continue button */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={!tasks.trim() || isLoading}
              style={[
                styles.continueButton,
                (!tasks.trim() || isLoading) && styles.continueButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueButtonText}>
                  {t('continue') || 'Continue'}
                </Text>
              )}
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
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    marginBottom: 32,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  chipText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  textInput: {
    padding: 16,
    paddingRight: 60,
    minHeight: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#000000',
    letterSpacing: -0.01 * 16,
  },
  micButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonRecording: {
    backgroundColor: '#EF4444',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    fontSize: 12,
    color: '#EF4444',
  },
  helpText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
    paddingLeft: 4,
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

