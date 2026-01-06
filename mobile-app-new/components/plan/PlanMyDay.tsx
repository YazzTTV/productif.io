import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { taskAssociationService } from '@/lib/api';
import { format } from 'date-fns';

type PlanPhase = 'entry' | 'recording' | 'transcription' | 'processing' | 'association' | 'overview';

interface TaskWithSubject {
  title: string;
  description?: string;
  priority: number;
  energy: number;
  estimatedDuration: number;
  subjectId: string | null;
  subjectName: string | null;
  confidence: number;
}

interface Subject {
  id: string;
  name: string;
  coefficient: number;
}

export function PlanMyDay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<PlanPhase>('entry');
  const [transcription, setTranscription] = useState('');
  const [processingStep, setProcessingStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tasks, setTasks] = useState<TaskWithSubject[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  useEffect(() => {
    return () => {
      // Nettoyer l'enregistrement si le composant est démonté
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission refusée', 'L\'accès au microphone est nécessaire pour enregistrer.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setPhase('recording');
    } catch (error: any) {
      console.error('Erreur démarrage enregistrement:', error);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (error: any) {
      console.error('Erreur arrêt enregistrement:', error);
      Alert.alert('Erreur', 'Impossible d\'arrêter l\'enregistrement.');
    }
  };

  const transcribeAudio = async (audioUri: string) => {
    try {
      setIsTranscribing(true);
      setPhase('transcription');

      // Lire le fichier audio
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Fichier audio introuvable');
      }

      // Créer FormData pour l'upload
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      // Appeler l'API de transcription
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch('https://www.productif.io/api/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la transcription');
      }

      const data = await response.json();
      if (data.success && data.transcription) {
        setTranscription(data.transcription);
      } else {
        throw new Error(data.error || 'Transcription échouée');
      }
    } catch (error: any) {
      console.error('Erreur transcription:', error);
      Alert.alert('Erreur', error.message || 'Impossible de transcrire l\'audio.');
      setPhase('entry');
    } finally {
      setIsTranscribing(false);
    }
  };

  const processTranscription = async () => {
    if (!transcription.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir ou enregistrer votre transcription.');
      return;
    }

    try {
      setIsProcessing(true);
      setPhase('processing');
      setProcessingStep(0);

      // Appeler l'API pour associer les tâches aux matières
      const result = await taskAssociationService.associateTasks(transcription);

      if (result.success && result.tasks && result.tasks.length > 0) {
        setTasks(result.tasks);
        setSubjects(result.subjects);
        setPhase('association');
      } else {
        Alert.alert('Aucune tâche', 'Aucune tâche n\'a pu être extraite de votre transcription.');
        setPhase('transcription');
      }
    } catch (error: any) {
      console.error('Erreur traitement:', error);
      Alert.alert('Erreur', error.message || 'Impossible de traiter la transcription.');
      setPhase('transcription');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateTaskSubject = (taskIndex: number, subjectId: string | null) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[taskIndex];
    const subject = subjects.find((s) => s.id === subjectId);

    task.subjectId = subjectId;
    task.subjectName = subject?.name || null;
    task.confidence = subjectId ? 1.0 : 0.0;

    setTasks(updatedTasks);
    setShowSubjectPicker(false);
    setSelectedTaskIndex(null);
  };

  const confirmAssociations = () => {
    // Ici, on pourrait créer les tâches dans la base de données
    // Pour l'instant, on passe à l'overview
    setPhase('overview');
  };

  if (phase === 'entry') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.entryContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="sparkles" size={40} color="#16A34A" />
            </View>

            <Text style={styles.entryTitle}>Plan your day in 60 seconds</Text>
            <Text style={styles.entrySubtitle}>Speak. We'll structure it.</Text>

            <View style={styles.ctaContainer}>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={startRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="mic" size={20} color="#FFFFFF" />
                <Text style={styles.recordButtonText}>Record voice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.typeButton}
                onPress={() => setPhase('transcription')}
                activeOpacity={0.7}
              >
                <Text style={styles.typeButtonText}>Type instead</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'recording') {
    return (
      <View style={[styles.container, styles.recordingContainer, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.recordingContent}>
          <View style={[styles.recordingCircle, isRecording && styles.recordingCircleActive]}>
            <Ionicons name="mic" size={60} color="#FFFFFF" />
          </View>
          <Text style={styles.recordingTitle}>Enregistrement en cours...</Text>
          <Text style={styles.recordingSubtitle}>Parlez maintenant</Text>

          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopRecording}
            activeOpacity={0.8}
          >
            <Ionicons name="stop" size={24} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>Arrêter</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  if (phase === 'transcription') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.transcriptionContent}>
            <View style={styles.checkIcon}>
              {isTranscribing ? (
                <ActivityIndicator size="large" color="#16A34A" />
              ) : (
                <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
              )}
            </View>
            <Text style={styles.transcriptionTitle}>
              {isTranscribing ? 'Transcription en cours...' : 'We got it.'}
            </Text>

            <View style={styles.transcriptionCard}>
              <TextInput
                style={styles.transcriptionInput}
                value={transcription}
                onChangeText={setTranscription}
                placeholder="Your transcription appears here..."
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                multiline
                textAlignVertical="top"
                editable={!isTranscribing}
              />
            </View>
            <Text style={styles.editHint}>You can edit if needed</Text>

            <TouchableOpacity
              style={[styles.generateButton, (!transcription.trim() || isTranscribing) && styles.generateButtonDisabled]}
              onPress={processTranscription}
              activeOpacity={0.8}
              disabled={!transcription.trim() || isTranscribing}
            >
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate my ideal day</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recordAgainButton}
              onPress={() => {
                setPhase('entry');
                setTranscription('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.recordAgainText}>Record again</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'processing') {
    const steps = [
      'Extracting tasks',
      'Associating with subjects',
      'Prioritizing by impact + time + energy',
    ];

    return (
      <View style={[styles.container, styles.processingContainer, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.processingContent}>
          <View style={styles.processingIcon}>
            <Ionicons name="sparkles" size={40} color="#16A34A" />
          </View>

          <Text style={styles.processingTitle}>Building your ideal day…</Text>

          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View
                key={index}
                style={[
                  styles.stepItem,
                  processingStep > index && styles.stepItemCompleted,
                ]}
              >
                <View
                  style={[
                    styles.stepIcon,
                    processingStep > index && styles.stepIconCompleted,
                  ]}
                >
                  {processingStep > index && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    processingStep > index && styles.stepTextCompleted,
                  ]}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    );
  }

  if (phase === 'association') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setPhase('transcription')}
            >
              <Ionicons name="arrow-back" size={22} color="#000" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Associer aux matières</Text>
              <Text style={styles.headerSubtitle}>Vérifiez et corrigez si nécessaire</Text>
            </View>
          </Animated.View>

          <View style={styles.tasksList}>
            {tasks.map((task, index) => (
              <View key={index} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.confidence < 0.7 && (
                    <View style={styles.lowConfidenceBadge}>
                      <Ionicons name="warning" size={14} color="#FF6B00" />
                      <Text style={styles.lowConfidenceText}>À vérifier</Text>
                    </View>
                  )}
                </View>

                {task.description && (
                  <Text style={styles.taskDescription}>{task.description}</Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.subjectSelector,
                    !task.subjectId && styles.subjectSelectorEmpty,
                  ]}
                  onPress={() => {
                    setSelectedTaskIndex(index);
                    setShowSubjectPicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={task.subjectId ? 'checkmark-circle' : 'add-circle-outline'}
                    size={20}
                    color={task.subjectId ? '#16A34A' : 'rgba(0, 0, 0, 0.4)'}
                  />
                  <Text style={[
                    styles.subjectSelectorText,
                    !task.subjectId && styles.subjectSelectorTextEmpty,
                  ]}>
                    {task.subjectName || 'Sélectionner une matière'}
                  </Text>
                  {task.subjectId && task.confidence < 1.0 && (
                    <Text style={styles.confidenceText}>
                      ({Math.round(task.confidence * 100)}% confiance)
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.taskMeta}>
                  <View style={styles.taskMetaItem}>
                    <Ionicons name="time-outline" size={14} color="rgba(0, 0, 0, 0.4)" />
                    <Text style={styles.taskMetaText}>{task.estimatedDuration} min</Text>
                  </View>
                  <View style={styles.taskMetaItem}>
                    <Ionicons name="flash-outline" size={14} color="rgba(0, 0, 0, 0.4)" />
                    <Text style={styles.taskMetaText}>Énergie: {task.energy}/5</Text>
                  </View>
                  <View style={styles.taskMetaItem}>
                    <Ionicons name="flag-outline" size={14} color="rgba(0, 0, 0, 0.4)" />
                    <Text style={styles.taskMetaText}>Priorité: {task.priority}/5</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmAssociations}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>Confirmer et continuer</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Subject Picker Modal */}
        <Modal
          visible={showSubjectPicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSubjectPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sélectionner une matière</Text>
                <TouchableOpacity
                  onPress={() => setShowSubjectPicker(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                <TouchableOpacity
                  style={styles.subjectOption}
                  onPress={() => {
                    if (selectedTaskIndex !== null) {
                      updateTaskSubject(selectedTaskIndex, null);
                    }
                  }}
                >
                  <Text style={styles.subjectOptionText}>Aucune matière</Text>
                </TouchableOpacity>

                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject.id}
                    style={styles.subjectOption}
                    onPress={() => {
                      if (selectedTaskIndex !== null) {
                        updateTaskSubject(selectedTaskIndex, subject.id);
                      }
                    }}
                  >
                    <Text style={styles.subjectOptionText}>{subject.name}</Text>
                    <Text style={styles.subjectOptionCoeff}>Coef {subject.coefficient}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (phase === 'overview') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#000" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Your Ideal Day</Text>
              <Text style={styles.headerSubtitle}>{format(new Date(), 'EEEE, d MMMM')}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>Your schedule</Text>
            <View style={styles.blocksList}>
              {tasks.map((task, index) => (
                <View key={index} style={styles.blockCard}>
                  <View style={styles.blockTime}>
                    <Text style={styles.blockTimeText}>
                      {Math.floor(task.estimatedDuration / 60)}h {task.estimatedDuration % 60}min
                    </Text>
                  </View>
                  <View style={styles.blockContent}>
                    <Text style={styles.blockTitle}>{task.title}</Text>
                    {task.subjectName && (
                      <View style={styles.blockSubjectBadge}>
                        <Text style={styles.blockSubjectText}>{task.subjectName}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.reassuranceCard}>
            <Text style={styles.reassuranceText}>
              This covers what matters. Nothing more, nothing less.
            </Text>
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.bottomCTA}>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
            <Text style={styles.syncButtonText}>Sync to Google Calendar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
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
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  entryContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 600,
    gap: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryTitle: {
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -1.5,
    color: '#000000',
    textAlign: 'center',
  },
  entrySubtitle: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  ctaContainer: {
    width: '100%',
    gap: 16,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  typeButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  typeButtonText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'rgba(0, 0, 0, 0.4)',
    fontSize: 16,
  },
  recordingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingContent: {
    alignItems: 'center',
    gap: 32,
  },
  recordingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingCircleActive: {
    backgroundColor: '#16A34A',
  },
  recordingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  recordingSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  transcriptionContent: {
    flex: 1,
    gap: 24,
  },
  checkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  transcriptionTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
    textAlign: 'center',
  },
  transcriptionCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    minHeight: 200,
  },
  transcriptionInput: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.8)',
    minHeight: 200,
  },
  editHint: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  recordAgainButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  recordAgainText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
  },
  processingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    width: '100%',
    maxWidth: 400,
    gap: 48,
    alignItems: 'center',
  },
  processingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
    textAlign: 'center',
  },
  stepsContainer: {
    width: '100%',
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  stepItemCompleted: {
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconCompleted: {
    backgroundColor: '#16A34A',
  },
  stepText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  stepTextCompleted: {
    color: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 32,
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  tasksList: {
    gap: 16,
    marginBottom: 24,
  },
  taskCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  lowConfidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  lowConfidenceText: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 20,
  },
  subjectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  subjectSelectorEmpty: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  subjectSelectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#16A34A',
  },
  subjectSelectorTextEmpty: {
    color: 'rgba(0, 0, 0, 0.4)',
  },
  confidenceText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskMetaText: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    marginBottom: 24,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    padding: 24,
  },
  subjectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    marginBottom: 8,
  },
  subjectOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  subjectOptionCoeff: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  blocksList: {
    gap: 12,
  },
  blockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  blockTime: {
    width: 80,
    alignItems: 'flex-end',
  },
  blockTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  blockContent: {
    flex: 1,
    gap: 4,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.3,
    color: '#000000',
  },
  blockSubjectBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    marginTop: 4,
  },
  blockSubjectText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
  },
  reassuranceCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  reassuranceText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
