import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, PanResponder, Dimensions, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { getAuthToken, journalService } from '@/lib/api';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '@/contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type JournalStep = 'entry' | 'emotional' | 'energy' | 'offload' | 'complete';

interface JournalEntry {
  id: string;
  date: string;
  emotionalLevel: number;
  energyLevel: number;
  note?: string;
}

// Slider Component
function Slider({ value, onValueChange, min = 0, max = 100 }: { value: number; onValueChange: (value: number) => void; min?: number; max?: number }) {
  const containerWidth = SCREEN_WIDTH - 48;
  const trackWidth = containerWidth - 32;
  const thumbSize = 24;
  const thumbPosition = ((value - min) / (max - min)) * trackWidth;
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<View>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (evt) => {
        if (trackRef.current) {
          trackRef.current.measure((x, y, w, h, pageX, pageY) => {
            const touchX = evt.nativeEvent.pageX - pageX;
            const newX = Math.max(0, Math.min(trackWidth, touchX));
            const newValue = Math.round(min + (newX / trackWidth) * (max - min));
            onValueChange(newValue);
          });
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
    })
  ).current;

  return (
    <View style={sliderStyles.container}>
      <View
        ref={trackRef}
        style={[sliderStyles.trackContainer, { width: trackWidth }]}
        {...panResponder.panHandlers}
      >
        <View style={[sliderStyles.trackBackground, { width: trackWidth }]} />
        <View style={[sliderStyles.trackFill, { width: thumbPosition }]} />
        <View
          style={[
            sliderStyles.thumb,
            { left: thumbPosition - thumbSize / 2 },
            isDragging && sliderStyles.thumbActive,
          ]}
        />
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    width: '100%',
    alignItems: 'center',
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    position: 'absolute',
  },
  trackFill: {
    height: 8,
    backgroundColor: '#000000',
    borderRadius: 4,
    position: 'absolute',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    position: 'absolute',
    top: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbActive: {
    transform: [{ scale: 1.2 }],
  },
});

export function DailyJournal() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<JournalStep>('entry');
  const [emotionalLevel, setEmotionalLevel] = useState(50);
  const [energyLevel, setEnergyLevel] = useState(50);
  const [note, setNote] = useState('');

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // History data from API
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [todayJournal, setTodayJournal] = useState<JournalEntry | null>(null);

  const getEmotionalLabel = (value: number) => {
    if (value < 25) return t('calm');
    if (value < 50) return t('steady');
    if (value < 75) return t('tense');
    return t('heavy');
  };

  const getEnergyLabel = (value: number) => {
    if (value < 25) return t('low');
    if (value < 50) return t('moderate');
    if (value < 75) return t('high');
    return t('veryHigh');
  };

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const handleStartRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('permissionDenied'), t('microphoneAccessRequired'));
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
      setIsPaused(false);
      setRecordingTime(0);
    } catch (error: any) {
      console.error('Erreur démarrage enregistrement:', error);
      Alert.alert(t('error'), t('recordingStartError'));
    }
  };

  const handlePauseRecording = async () => {
    if (!recording) return;
    
    try {
      if (isPaused) {
        await recording.startAsync();
        setIsPaused(false);
      } else {
        await recording.pauseAsync();
        setIsPaused(true);
      }
    } catch (error: any) {
      console.error('Erreur pause/reprise enregistrement:', error);
      Alert.alert(t('error'), t('recordingPauseError'));
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      setIsPaused(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await transcribeAudio(uri);
      }
      setRecordingTime(0);
    } catch (error: any) {
      console.error('Erreur arrêt enregistrement:', error);
      Alert.alert(t('error'), t('recordingStopError'));
    }
  };

  const transcribeAudio = async (audioUri: string) => {
    try {
      setIsTranscribing(true);

      // Lire le fichier audio
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error(t('audioFileNotFound'));
      }

      // Vérifier le token d'authentification
      const token = await getAuthToken();
      if (!token) {
        throw new Error(t('unauthenticated'));
      }

      // Préparer l'URI selon la plateforme
      const uri = Platform.OS === 'ios' ? audioUri.replace('file://', '') : audioUri;

      // Créer FormData pour l'upload
      const formData = new FormData();
      formData.append('audio', {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      console.log('🎤 Envoi de l\'audio pour transcription...', { uri, hasToken: !!token });

      // Appeler l'API de transcription
      const response = await fetch('https://www.productif.io/api/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Ne pas définir Content-Type, FormData le fait automatiquement
        },
        body: formData,
      });

      console.log('📡 Réponse transcription:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `Erreur ${response.status}` };
        }
        console.error('❌ Erreur API transcription:', errorData);
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Transcription réussie:', { success: data.success, hasTranscription: !!data.transcription });

      if (data.success && data.transcription) {
        // Ajouter la transcription au texte existant (ou remplacer si vide)
        const newText = note.trim() ? `${note}\n\n${data.transcription}` : data.transcription;
        setNote(newText);
      } else {
        throw new Error(data.error || t('transcriptionError'));
      }
    } catch (error: any) {
      console.error('❌ Erreur transcription:', error);
      const errorMessage = error.message || t('transcriptionError');
      Alert.alert(t('error'), errorMessage);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleEmotionalContinue = () => {
    setStep('energy');
  };

  const handleEnergyContinue = () => {
    setStep('offload');
  };

  // Load today's journal
  const loadTodayJournal = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await journalService.getByDate(today);
      
      if (response && (response.journal || response.id)) {
        const journal = response.journal || response;
        const todayEntry: JournalEntry = {
          id: journal.id || journal._id || Date.now().toString(),
          date: journal.date || today,
          emotionalLevel: journal.emotionalLevel || 50,
          energyLevel: journal.energyLevel || 50,
          note: journal.note || journal.transcription,
        };
        setTodayJournal(todayEntry);
        // Pré-remplir les valeurs si on veut modifier
        setEmotionalLevel(todayEntry.emotionalLevel);
        setEnergyLevel(todayEntry.energyLevel);
        setNote(todayEntry.note || '');
      } else {
        setTodayJournal(null);
      }
    } catch (error: any) {
      console.log('ℹ️ Pas de journal pour aujourd\'hui');
      setTodayJournal(null);
    }
  };

  // Load journal history from API
  const loadJournalHistory = async () => {
    try {
      setLoadingHistory(true);
      
      // Charger le journal d'aujourd'hui en premier
      await loadTodayJournal();
      
      const response = await journalService.getAll();
      
      // Si la réponse est vide ou n'existe pas, on garde l'historique vide
      if (!response || (Array.isArray(response) && response.length === 0)) {
        setHistory([]);
        setLoadingHistory(false);
        return;
      }
      
      // Handle different response formats
      let journalsData = [];
      if (Array.isArray(response)) {
        journalsData = response;
      } else if (response && response.journals) {
        journalsData = response.journals;
      } else if (response && Array.isArray(response.data)) {
        journalsData = response.data;
      } else if (response && response.journal) {
        // Si c'est un seul journal
        journalsData = [response.journal];
      }

      // Transform API data to JournalEntry format
      const entries: JournalEntry[] = journalsData
        .filter((journal: any) => journal) // Filtrer les valeurs null/undefined
        .map((journal: any) => ({
          id: journal.id || journal._id || Date.now().toString(),
          date: journal.date || journal.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          emotionalLevel: journal.emotionalLevel || 50,
          energyLevel: journal.energyLevel || 50,
          note: journal.note || journal.transcription,
        }));

      // Sort by date (most recent first)
      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Exclure le journal d'aujourd'hui de l'historique (il est affiché séparément)
      const today = new Date().toISOString().split('T')[0];
      const pastEntries = entries.filter(entry => entry.date !== today);
      setHistory(pastEntries);
    } catch (error: any) {
      console.error('❌ Erreur chargement historique journaux:', error);
      // Ne pas afficher d'alerte, juste logger l'erreur et garder l'historique vide
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load history when component mounts or screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (step === 'entry') {
        loadJournalHistory();
      }
    }, [step])
  );

  const handleOffloadContinue = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Save to API
      await journalService.saveJournalEntry({
        date: today,
        emotionalLevel,
        energyLevel,
        note: note.trim() || undefined,
      });

      // Update local history and today's journal
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: today,
        emotionalLevel,
        energyLevel,
        note: note.trim() || undefined,
      };
      setTodayJournal(newEntry);
      // Retirer l'ancien journal d'aujourd'hui de l'historique s'il existe
      const pastEntries = history.filter(entry => entry.date !== today);
      setHistory(pastEntries);
      
      setStep('complete');
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde journal:', error);
      Alert.alert(t('error'), t('saveJournalError'));
      
      // Save locally anyway
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: today,
        emotionalLevel,
        energyLevel,
        note: note.trim() || undefined,
      };
      setTodayJournal(newEntry);
      // Retirer l'ancien journal d'aujourd'hui de l'historique s'il existe
      const pastEntries = history.filter(entry => entry.date !== today);
      setHistory(pastEntries);
      setStep('complete');
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━
  // ENTRY SCREEN
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'entry') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.entryHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#000" />
            </TouchableOpacity>

            <View style={styles.entryHeaderContent}>
              <Text style={styles.entryTitle}>{t('dailyJournal')}</Text>
              <Text style={styles.entrySubtitle}>{t('momentToUnloadThoughts')}</Text>
            </View>
          </Animated.View>

          {/* Today's journal summary */}
          {todayJournal && (
            <Animated.View
              entering={FadeInDown.delay(150).duration(400)}
              style={styles.todayJournalCard}
            >
              <View style={styles.todayJournalHeader}>
                <View style={styles.todayJournalHeaderLeft}>
                  <View
                    style={[
                      styles.todayJournalDot,
                      {
                        backgroundColor:
                          todayJournal.emotionalLevel < 40 ? '#16A34A' :
                          todayJournal.emotionalLevel < 70 ? '#EAB308' :
                          '#F97316',
                      },
                    ]}
                  />
                  <Text style={styles.todayJournalLabel}>{t('today')}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setEmotionalLevel(todayJournal.emotionalLevel);
                    setEnergyLevel(todayJournal.energyLevel);
                    setNote(todayJournal.note || '');
                    setStep('offload');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.todayJournalEdit}>{t('edit')}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.todayJournalSummary}>
                <View style={styles.todayJournalMetric}>
                  <Text style={styles.todayJournalMetricLabel}>{t('emotionalLevel')}</Text>
                  <Text style={styles.todayJournalMetricValue}>
                    {getEmotionalLabel(todayJournal.emotionalLevel)}
                  </Text>
                </View>
                <View style={styles.todayJournalMetric}>
                  <Text style={styles.todayJournalMetricLabel}>{t('energyLevel')}</Text>
                  <Text style={styles.todayJournalMetricValue}>
                    {getEnergyLabel(todayJournal.energyLevel)}
                  </Text>
                </View>
              </View>

              {todayJournal.note && (
                <View style={styles.todayJournalNote}>
                  <Text style={styles.todayJournalNoteText} numberOfLines={3}>
                    {todayJournal.note}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Recent entries preview */}
          {loadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#16A34A" />
              <Text style={styles.loadingText}>{t('loading')}</Text>
            </View>
          ) : history.length > 0 ? (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={styles.recentEntriesContainer}
            >
              <Text style={styles.recentEntriesLabel}>{t('recentEntries')}</Text>
              <View style={styles.recentEntriesList}>
                {history.slice(0, 3).map((entry, index) => (
                  <Animated.View
                    key={entry.id}
                    entering={FadeInDown.delay(250 + index * 50).duration(400)}
                  >
                    <TouchableOpacity
                      style={styles.recentEntryCard}
                      onPress={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.recentEntryHeader}>
                        <View style={styles.recentEntryLeft}>
                          <View
                            style={[
                              styles.recentEntryDot,
                              {
                                backgroundColor:
                                  entry.emotionalLevel < 40 ? '#16A34A' :
                                  entry.emotionalLevel < 70 ? '#EAB308' :
                                  '#F97316',
                              },
                            ]}
                          />
                          <Text style={styles.recentEntryDate}>
                            {format(new Date(entry.date), 'MMM d')}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="rgba(0, 0, 0, 0.4)"
                          style={{
                            transform: [{ rotate: expandedEntryId === entry.id ? '90deg' : '0deg' }],
                          }}
                        />
                      </View>

                      {expandedEntryId === entry.id && entry.note && (
                        <Animated.View entering={FadeIn} style={styles.recentEntryNote}>
                          <Text style={styles.recentEntryNoteText}>{entry.note}</Text>
                        </Animated.View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <TouchableOpacity
              style={styles.beginButton}
              onPress={() => setStep('emotional')}
              activeOpacity={0.8}
            >
              <Text style={styles.beginButtonText}>{t('beginTodayEntry')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // STEP 1 — EMOTIONAL CHECK-IN
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'emotional') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.stepHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('entry')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#000" />
          </TouchableOpacity>

          <View style={styles.progressDots}>
            <View style={styles.progressDotActive} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>
        </View>

        <View style={styles.stepHeaderContent}>
          <Text style={styles.stepTitle}>{t('emotionalCheck')}</Text>
        </View>

        <View style={styles.stepContent}>
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.sliderContent}
          >
            {/* Current feeling label */}
            <View style={styles.sliderLabelContainer}>
          <Text style={styles.sliderValue}>{getEmotionalLabel(emotionalLevel)}</Text>
          <Text style={styles.sliderHint}>{t('noRightOrWrong')}</Text>
            </View>

            {/* Slider */}
          <View style={styles.sliderWrapper}>
              <Slider
                value={emotionalLevel}
                onValueChange={setEmotionalLevel}
                min={0}
                max={100}
              />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>{t('calm')}</Text>
            <Text style={styles.sliderLabel}>{t('heavy')}</Text>
          </View>
            </View>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={styles.bottomCTA}
        >
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleEmotionalContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>{t('continue')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // STEP 2 — ENERGY CHECK
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'energy') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.stepHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('emotional')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#000" />
          </TouchableOpacity>

          <View style={styles.progressDots}>
            <View style={styles.progressDotActive} />
            <View style={styles.progressDotActive} />
            <View style={styles.progressDot} />
          </View>
        </View>

        <View style={styles.stepHeaderContent}>
          <Text style={styles.stepTitle}>{t('energyCheck')}</Text>
        </View>

        <View style={styles.stepContent}>
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.sliderContent}
          >
            {/* Current energy label */}
            <View style={styles.sliderLabelContainer}>
          <Text style={styles.sliderValue}>{getEnergyLabel(energyLevel)}</Text>
          <Text style={styles.sliderHint}>{t('justObserve')}</Text>
            </View>

            {/* Slider */}
          <View style={styles.sliderWrapper}>
              <Slider
                value={energyLevel}
                onValueChange={setEnergyLevel}
                min={0}
                max={100}
              />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>{t('low')}</Text>
            <Text style={styles.sliderLabel}>{t('high')}</Text>
          </View>
            </View>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={styles.bottomCTA}
        >
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleEnergyContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>{t('continue')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // STEP 3 — OPTIONAL TEXT OFFLOAD
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'offload') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.stepHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('energy')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#000" />
          </TouchableOpacity>

          <View style={styles.progressDots}>
            <View style={styles.progressDotActive} />
            <View style={styles.progressDotActive} />
            <View style={styles.progressDotActive} />
          </View>
        </View>

        <View style={styles.stepHeaderContent}>
          <Text style={styles.stepTitle}>{t('offload')}</Text>
          <Text style={styles.stepSubtitle}>{t('completelyOptional')}</Text>
        </View>

        <View style={styles.offloadContent}>
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.textAreaContainer}
          >
            <TextInput
              style={styles.textArea}
              value={note}
              onChangeText={setNote}
              placeholder={t('writeFreely')}
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              multiline
              textAlignVertical="top"
            />

            {/* Microphone button */}
            <View style={styles.micButtonContainer}>
              {isRecording && (
                <Animated.View
                  entering={FadeIn}
                  style={styles.recordingIndicator}
                >
                  <View style={styles.recordingBars}>
                    {[...Array(3)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.recordingBar,
                          {
                            height: isPaused ? 8 : 12,
                            opacity: isPaused ? 0.5 : 1,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
                </Animated.View>
              )}

              <View style={styles.micButtonsRow}>
                {isRecording && (
                  <>
                    <TouchableOpacity
                      style={styles.pauseButton}
                      onPress={handlePauseRecording}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={isPaused ? "play" : "pause"} size={20} color="rgba(0, 0, 0, 0.6)" />
            </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stopButton}
                      onPress={handleStopRecording}
                      activeOpacity={0.7}
                      disabled={isTranscribing}
                    >
                      {isTranscribing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="stop" size={20} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {!isRecording && (
                  <TouchableOpacity
                    style={styles.micButton}
                    onPress={handleStartRecording}
                    activeOpacity={0.7}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="mic" size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
          </View>

          <Text style={styles.offloadHint}>
              {isTranscribing 
                ? t('transcribing') 
                : isRecording 
                  ? t('recordVoice') 
                  : t('offloadDescription')}
          </Text>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={styles.bottomCTA}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleOffloadContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>{t('closeJournal')}</Text>
          </TouchableOpacity>
          {note.trim() && (
            <Text style={styles.characterCount}>
              {note.trim().length} {t('charactersWritten')}
            </Text>
          )}
        </Animated.View>
      </View>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // STEP 4 — CLOSING CONFIRMATION
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'complete') {
    return (
      <View style={[styles.container, styles.completionContainer, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.completionContent}>
          <Animated.View
            entering={FadeInUp.delay(300).duration(400)}
            style={styles.completionIcon}
          >
            <View style={styles.completionIconInner} />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={styles.completionText}
          >
          <Text style={styles.completionTitle}>{t('noted')}</Text>
          <Text style={styles.completionSubtitle}>{t('noActionRequired')}</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(600).duration(400)}
            style={styles.completionActions}
          >
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>{t('closeJournal')}</Text>
          </TouchableOpacity>
          <Text style={styles.completionHint}>{t('dayClosed')}</Text>
          </Animated.View>
        </Animated.View>
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
    paddingBottom: 32,
  },
  entryHeader: {
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  entryHeaderContent: {
    gap: 12,
  },
  entryTitle: {
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -1.6, // -0.04em * 40
    color: '#000000',
  },
  entrySubtitle: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  todayJournalCard: {
    marginBottom: 32,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  todayJournalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  todayJournalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todayJournalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  todayJournalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  todayJournalEdit: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '500',
  },
  todayJournalSummary: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  todayJournalMetric: {
    gap: 4,
  },
  todayJournalMetricLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayJournalMetricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  todayJournalNote: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  todayJournalNoteText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 20,
  },
  loadingContainer: {
    marginBottom: 48,
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  recentEntriesContainer: {
    marginBottom: 48,
  },
  recentEntriesLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 16,
  },
  recentEntriesList: {
    gap: 8,
  },
  recentEntryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  recentEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentEntryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentEntryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recentEntryDate: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  recentEntryNote: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  recentEntryNoteText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 20,
  },
  beginButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  beginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  stepHeaderContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 8,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.28, // -0.04em * 32
    color: '#000000',
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sliderContent: {
    width: '100%',
    maxWidth: 400,
    gap: 48,
  },
  sliderLabelContainer: {
    alignItems: 'center',
    gap: 8,
  },
  sliderValue: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: -1.92, // -0.04em * 48
    color: '#000000',
  },
  sliderHint: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  sliderWrapper: {
    width: '100%',
    gap: 24,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  sliderLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  bottomCTA: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  offloadContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  textAreaContainer: {
    flex: 1,
  },
  textArea: {
    flex: 1,
    minHeight: 256,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.36, // -0.02em * 18
  },
  micButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  recordingBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  recordingBar: {
    width: 3,
    backgroundColor: '#16A34A',
    borderRadius: 1.5,
  },
  recordingTime: {
    fontSize: 14,
    color: '#16A34A',
    fontVariant: ['tabular-nums'],
  },
  micButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pauseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  offloadHint: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.3)',
    marginTop: 12,
  },
  closeButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  characterCount: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
    marginTop: 12,
  },
  completionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionContent: {
    alignItems: 'center',
    gap: 48,
    paddingHorizontal: 24,
    maxWidth: 400,
  },
  completionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16A34A',
  },
  completionText: {
    alignItems: 'center',
    gap: 12,
  },
  completionTitle: {
    fontSize: 48,
    fontWeight: '600',
    letterSpacing: -1.92, // -0.04em * 48
    color: '#000000',
  },
  completionSubtitle: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  completionActions: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  doneButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  completionHint: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.3)',
  },
});
