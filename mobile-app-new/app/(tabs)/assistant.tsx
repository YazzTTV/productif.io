import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { assistantService, tasksService, habitsService, getAuthToken } from '@/lib/api';
import { format } from 'date-fns';

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: Date;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority?: number;
  dueDate?: string;
}

interface Habit {
  id: string;
  name: string;
  icon?: string;
  completed: boolean;
  streak?: number;
  bestStreak?: number;
  completionRate?: number;
  entries?: Array<{
    id: string;
    date: string;
    completed: boolean;
    note?: string;
    rating?: number;
  }>;
}

const quickActions = [
  { icon: 'brain' as const, label: 'Start Deep Work', action: 'deepwork' },
  { icon: 'book' as const, label: 'Daily Journal', action: 'journal' },
  { icon: 'bulb' as const, label: 'Learning', action: 'learning' },
  { icon: 'calendar' as const, label: 'Plan my day', action: 'plan' },
  { icon: 'flag' as const, label: 'Track habit', action: 'track' },
  { icon: 'trending-up' as const, label: 'Show stats', action: 'stats' },
];

const timeOptions = [
  { label: '15 min', minutes: 15, emoji: '⚡' },
  { label: '25 min', minutes: 25, emoji: '🎯' },
  { label: '45 min', minutes: 45, emoji: '🔥' },
  { label: '60 min', minutes: 60, emoji: '💪' },
];

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI productivity coach. I'm here to help you optimize your day and unlock your full potential. How can I assist you?",
      isAI: true,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [xp, setXp] = useState(340);
  const maxXp = 500;

  // Deep Work Mode State
  const [isDeepWorkActive, setIsDeepWorkActive] = useState(false);
  const [deepWorkTimeLeft, setDeepWorkTimeLeft] = useState(25 * 60);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [showTaskCompleteAnimation, setShowTaskCompleteAnimation] = useState(false);
  const [showSessionCompleteAnimation, setShowSessionCompleteAnimation] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionStats, setSessionStats] = useState({ timeSpent: 0, tasksCompleted: 0, xpEarned: 0 });
  const [customDuration, setCustomDuration] = useState('');
  const [customDurationError, setCustomDurationError] = useState('');

  // Journal State
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessingJournal, setIsProcessingJournal] = useState(false);
  const [journalText, setJournalText] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Day Planning Voice State
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [isPlanningRecording, setIsPlanningRecording] = useState(false);
  const [planningRecordingTime, setPlanningRecordingTime] = useState(0);
  const [isProcessingPlanning, setIsProcessingPlanning] = useState(false);
  const [planningText, setPlanningText] = useState('');
  const planningRecordingRef = useRef<Audio.Recording | null>(null);

  // Learning Voice State
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [isLearningRecording, setIsLearningRecording] = useState(false);
  const [learningRecordingTime, setLearningRecordingTime] = useState(0);
  const [isProcessingLearning, setIsProcessingLearning] = useState(false);
  const [learningText, setLearningText] = useState('');
  const learningRecordingRef = useRef<Audio.Recording | null>(null);

  // Habit Tracking State
  const [showHabitsModal, setShowHabitsModal] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoadingHabits, setIsLoadingHabits] = useState(false);
  const [deepWorkSessionId, setDeepWorkSessionId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isDeepWorkActive && deepWorkTimeLeft > 0) {
      interval = setInterval(() => {
        setDeepWorkTimeLeft((prev) => {
          if (prev <= 1) {
            setIsDeepWorkActive(false);
            const completionMessage: Message = {
              id: Date.now().toString(),
              text: '🎉 Deep work session complete! Great job staying focused. You earned 50 XP!',
              isAI: true,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, completionMessage]);
            setXp((prev) => Math.min(prev + 50, maxXp));
            setShowSessionCompleteAnimation(true);
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDeepWorkActive, deepWorkTimeLeft]);

  // Recording Timer Effects
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlanningRecording) {
      interval = setInterval(() => {
        setPlanningRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlanningRecording]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLearningRecording) {
      interval = setInterval(() => {
        setLearningRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLearningRecording]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLearningRecording) {
      interval = setInterval(() => {
        setLearningRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLearningRecording]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isAI: false,
      timestamp: new Date(),
    };

    const messageText = inputText;
    setMessages([...messages, userMessage]);
    setInputText('');

    // Afficher un indicateur de chargement
    const loadingMessageId = (Date.now() + 1).toString();
    const loadingMessage: Message = {
      id: loadingMessageId,
      text: '...',
      isAI: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Appeler l'API pour obtenir la réponse de l'agent IA
      const response = await assistantService.sendChatMessage(messageText);
      
      // Remplacer le message de chargement par la vraie réponse
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === loadingMessageId
            ? {
                ...msg,
                text: response.response || "Désolé, je n'ai pas pu générer de réponse.",
              }
            : msg
        )
      );
      setXp((prev) => Math.min(prev + 10, maxXp));
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      // Remplacer le message de chargement par un message d'erreur
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === loadingMessageId
            ? {
                ...msg,
                text: "Désolé, j'ai rencontré une erreur. Pouvez-vous réessayer ?",
              }
            : msg
        )
      );
    }
  };

  const handleQuickAction = (action: string) => {
    if (action === 'deepwork') {
      setShowTimeSelector(true);
      return;
    }
    if (action === 'journal') {
      setShowJournalModal(true);
      return;
    }
    if (action === 'learning') {
      setShowLearningModal(true);
      return;
    }
    if (action === 'plan') {
      setShowPlanningModal(true);
      return;
    }
    if (action === 'track') {
      setShowHabitsModal(true);
      return;
    }

    const actionTexts: { [key: string]: string } = {
      stats: 'Show me my productivity stats',
    };

    const text = actionTexts[action];
    if (text) {
      setInputText(text);
    }
  };

  const startDeepWork = async (minutes: number) => {
    try {
      setShowTimeSelector(false);
      setCustomDuration('');
      setCustomDurationError('');

      // Appeler l'API pour démarrer la session Deep Work
      const response = await assistantService.startDeepWorkSession(
        minutes,
        'deepwork',
        `Session Deep Work (${minutes}min)`
      );

      if (response.error) {
        Alert.alert('Erreur', response.error);
        return;
      }

      setIsDeepWorkActive(true);
      setDeepWorkTimeLeft(minutes * 60);
      setSelectedDuration(minutes);
      setDeepWorkSessionId(response.session?.id || null);

      // Charger les tâches d'aujourd'hui
      await loadTodayTasks();

      const deepWorkMessage: Message = {
        id: Date.now().toString(),
        text: `🧠 Deep work session started! I'll be here to keep you focused for the next ${minutes} minutes. Your tasks are ready below. Let's do this!`,
        isAI: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, deepWorkMessage]);
    } catch (error: any) {
      console.error('Erreur lors du démarrage de la session Deep Work:', error);
      Alert.alert('Erreur', error.message || 'Impossible de démarrer la session Deep Work');
    }
  };

  const startCustomDuration = () => {
    const minutes = parseInt(customDuration);

    if (!customDuration) {
      setCustomDurationError('Please enter a duration');
      return;
    }

    if (isNaN(minutes)) {
      setCustomDurationError('Please enter a valid number');
      return;
    }

    if (minutes < 1) {
      setCustomDurationError('Minimum 1 minute');
      return;
    }

    if (minutes > 120) {
      setCustomDurationError('Maximum 120 minutes (2 hours)');
      return;
    }

    startDeepWork(minutes);
  };

  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const newCompleted = !task.completed;

      // Mettre à jour optimistiquement
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: newCompleted } : t))
      );

      // Appeler l'API pour mettre à jour la tâche
      if (newCompleted) {
        await tasksService.complete(taskId);
        setXp((prevXp) => Math.min(prevXp + 15, maxXp));
        setShowTaskCompleteAnimation(true);
        setTimeout(() => setShowTaskCompleteAnimation(false), 2000);
      } else {
        // Si on décoche, on doit utiliser updateTask
        await tasksService.updateTask(taskId, { completed: false });
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la tâche');
      // Rollback
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
      );
    }
  };

  const startRecording = async () => {
    try {
      // Demander la permission d'utiliser le microphone
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès au microphone est nécessaire pour enregistrer votre voix.');
        return;
      }

      // Configurer le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Créer un nouvel enregistrement
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error: any) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) {
      return;
    }

    setIsRecording(false);
    setIsProcessingJournal(true);

    try {
      // Arrêter l'enregistrement
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // Réinitialiser le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      let transcription = journalText.trim();

      // Si un enregistrement audio existe, le transcrire
      if (uri) {
        try {
          // Lire le fichier audio
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (fileInfo.exists) {
            // Créer un FormData pour envoyer l'audio
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'recording.m4a';
            const fileType = 'audio/m4a';

            formData.append('audio', {
              uri: uri,
              name: filename,
              type: fileType,
            } as any);

            // Appeler l'API de transcription
            const token = await getAuthToken();
            const API_BASE_URL = 'https://www.productif.io/api';

            const transcriptionResponse = await fetch(`${API_BASE_URL}/transcribe`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });

            if (transcriptionResponse.ok) {
              const transcriptionData = await transcriptionResponse.json();
              if (transcriptionData.success && transcriptionData.transcription) {
                transcription = transcriptionData.transcription;
                // Mettre à jour le champ de texte avec la transcription
                setJournalText(transcription);
              }
            } else {
              console.error('Erreur transcription:', await transcriptionResponse.text());
            }

            // Nettoyer le fichier audio temporaire
            try {
              await FileSystem.deleteAsync(uri, { idempotent: true });
            } catch (cleanupError) {
              console.error('Erreur lors du nettoyage du fichier audio:', cleanupError);
            }
          }
        } catch (transcriptionError: any) {
          console.error('Erreur lors de la transcription:', transcriptionError);
          // Continuer avec le texte manuel si la transcription échoue
          // Nettoyer le fichier audio même en cas d'erreur
          try {
            if (uri) {
              await FileSystem.deleteAsync(uri, { idempotent: true });
            }
          } catch (cleanupError) {
            console.error('Erreur lors du nettoyage du fichier audio:', cleanupError);
          }
        }
      }

      // Si pas de transcription et pas de texte manuel, utiliser un placeholder
      if (!transcription) {
        transcription = `Note de ma journée: ${recordingTime} secondes d'enregistrement.`;
      }

      // Enregistrer le journaling
      const journalResponse = await assistantService.saveJournal(transcription);

      // Trouver l'habitude "Note de sa journée"
      const noteHabit = await assistantService.findHabitByName('note de sa journée');
      if (noteHabit) {
        const today = format(new Date(), 'yyyy-MM-dd');
        await assistantService.saveHabitEntry(noteHabit.id, today, transcription);
        // Recharger les habitudes
        await loadHabits();
      }

      setIsProcessingJournal(false);
      setShowJournalModal(false);
      setJournalText(''); // Réinitialiser le texte
      setRecordingTime(0);

      const aiMessage: Message = {
        id: Date.now().toString(),
        text: `📝 Merci pour ton partage ! J'ai enregistré ta note de journée.\n\nJe vais analyser tes réflexions et te donner mes insights demain matin 🌅\n\nTu peux aussi consulter ton journal sur la page /mon-espace de l'app web.\n\nTu as gagné 25 XP ! 🌟`,
        isAI: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setXp((prev) => Math.min(prev + 25, maxXp));
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement du journal:', error);
      setIsProcessingJournal(false);
      Alert.alert('Erreur', 'Impossible d\'enregistrer le journal');
    }
  };

  const startPlanningRecording = async () => {
    try {
      // Demander la permission d'utiliser le microphone
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès au microphone est nécessaire pour enregistrer votre voix.');
        return;
      }

      // Configurer le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Créer un nouvel enregistrement
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      planningRecordingRef.current = recording;
      setIsPlanningRecording(true);
      setPlanningRecordingTime(0);
    } catch (error: any) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement');
    }
  };

  const stopPlanningRecording = async () => {
    if (!planningRecordingRef.current) {
      return;
    }

    setIsPlanningRecording(false);
    setIsProcessingPlanning(true);

    try {
      // Arrêter l'enregistrement
      await planningRecordingRef.current.stopAndUnloadAsync();
      const uri = planningRecordingRef.current.getURI();
      planningRecordingRef.current = null;

      // Réinitialiser le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      let transcription = planningText.trim();

      // Si un enregistrement audio existe, le transcrire
      if (uri) {
        try {
          // Lire le fichier audio
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (fileInfo.exists) {
            // Créer un FormData pour envoyer l'audio
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'recording.m4a';
            const fileType = 'audio/m4a';

            formData.append('audio', {
              uri: uri,
              name: filename,
              type: fileType,
            } as any);

            // Appeler l'API de transcription
            const token = await getAuthToken();
            const API_BASE_URL = 'https://www.productif.io/api';

            const transcriptionResponse = await fetch(`${API_BASE_URL}/transcribe`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });

            if (transcriptionResponse.ok) {
              const transcriptionData = await transcriptionResponse.json();
              if (transcriptionData.success && transcriptionData.transcription) {
                transcription = transcriptionData.transcription;
                // Mettre à jour le champ de texte avec la transcription
                setPlanningText(transcription);
              }
            } else {
              console.error('Erreur transcription:', await transcriptionResponse.text());
            }

            // Nettoyer le fichier audio temporaire
            try {
              await FileSystem.deleteAsync(uri, { idempotent: true });
            } catch (cleanupError) {
              console.error('Erreur lors du nettoyage du fichier audio:', cleanupError);
            }
          }
        } catch (transcriptionError: any) {
          console.error('Erreur lors de la transcription:', transcriptionError);
          // Continuer avec le texte manuel si la transcription échoue
          // Nettoyer le fichier audio même en cas d'erreur
          try {
            if (uri) {
              await FileSystem.deleteAsync(uri, { idempotent: true });
            }
          } catch (cleanupError) {
            console.error('Erreur lors du nettoyage du fichier audio:', cleanupError);
          }
        }
      }

      // Si pas de transcription et pas de texte manuel, utiliser un placeholder
      if (!transcription) {
        transcription = `Plan pour demain: ${planningRecordingTime} secondes d'enregistrement.`;
      }

      // Appeler l'API plan tomorrow avec la transcription
      const result = await assistantService.planTomorrow(transcription);

      setIsProcessingPlanning(false);
      setShowPlanningModal(false);
      setPlanningText(''); // Réinitialiser le texte
      setPlanningRecordingTime(0);

      // Construire le message de réponse
      let responseMessage = `📅 Parfait ! J'ai créé ${result.tasksCreated} tâche${result.tasksCreated > 1 ? 's' : ''} pour demain !\n\n`;

      if (result.analysis?.summary) {
        responseMessage += `💭 Analyse :\n${result.analysis.summary}\n\n`;
      }

      if (result.analysis?.planSummary) {
        responseMessage += result.analysis.planSummary;
      }

      if (result.analysis?.totalEstimatedTime) {
        const hours = Math.floor(result.analysis.totalEstimatedTime / 60);
        const minutes = result.analysis.totalEstimatedTime % 60;
        responseMessage += `\n\n⏱️ Temps total estimé : ${hours}h${minutes > 0 ? minutes : ''}`;
      }

      responseMessage += `\n\n💡 Conseil : Commence par les tâches 🔴 haute priorité le matin quand ton énergie est au max !`;

      const planningResponse: Message = {
        id: Date.now().toString(),
        text: responseMessage,
        isAI: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, planningResponse]);
      setXp((prev) => Math.min(prev + 30, maxXp));
    } catch (error: any) {
      console.error('Erreur lors de la planification:', error);
      setIsProcessingPlanning(false);
      Alert.alert('Erreur', error.message || 'Impossible de créer le plan');
    }
  };

  const startLearningRecording = async () => {
    try {
      // Demander la permission d'utiliser le microphone
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès au microphone est nécessaire pour enregistrer votre voix.');
        return;
      }

      // Configurer le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Créer un nouvel enregistrement
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      learningRecordingRef.current = recording;
      setIsLearningRecording(true);
      setLearningRecordingTime(0);
    } catch (error: any) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement');
    }
  };

  const stopLearningRecording = async () => {
    if (!learningRecordingRef.current) {
      return;
    }

    setIsLearningRecording(false);
    setIsProcessingLearning(true);

    try {
      // Arrêter l'enregistrement
      await learningRecordingRef.current.stopAndUnloadAsync();
      const uri = learningRecordingRef.current.getURI();
      learningRecordingRef.current = null;

      // Réinitialiser le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      let transcription = learningText.trim();

      // Si un enregistrement audio existe, le transcrire
      if (uri) {
        try {
          // Lire le fichier audio
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (fileInfo.exists) {
            // Créer un FormData pour envoyer l'audio
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'recording.m4a';
            const fileType = 'audio/m4a';

            formData.append('audio', {
              uri: uri,
              name: filename,
              type: fileType,
            } as any);

            // Appeler l'API de transcription
            const token = await getAuthToken();
            const API_BASE_URL = 'https://www.productif.io/api';

            const transcriptionResponse = await fetch(`${API_BASE_URL}/transcribe`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });

            if (transcriptionResponse.ok) {
              const transcriptionData = await transcriptionResponse.json();
              if (transcriptionData.success && transcriptionData.transcription) {
                transcription = transcriptionData.transcription;
                // Mettre à jour le champ de texte avec la transcription
                setLearningText(transcription);
              }
            } else {
              console.error('Erreur transcription:', await transcriptionResponse.text());
            }

            // Nettoyer le fichier audio temporaire
            try {
              await FileSystem.deleteAsync(uri, { idempotent: true });
            } catch (cleanupError) {
              console.error('Erreur lors du nettoyage du fichier audio:', cleanupError);
            }
          }
        } catch (transcriptionError: any) {
          console.error('Erreur lors de la transcription:', transcriptionError);
          // Continuer avec le texte manuel si la transcription échoue
          // Nettoyer le fichier audio même en cas d'erreur
          try {
            if (uri) {
              await FileSystem.deleteAsync(uri, { idempotent: true });
            }
          } catch (cleanupError) {
            console.error('Erreur lors du nettoyage du fichier audio:', cleanupError);
          }
        }
      }

      // Si pas de transcription et pas de texte manuel, utiliser un placeholder
      if (!transcription) {
        transcription = `Apprentissage du jour: ${learningRecordingTime} secondes d'enregistrement.`;
      }

      // Trouver l'habitude "Apprentissage"
      const learningHabit = await assistantService.findHabitByName('apprentissage');
      if (learningHabit) {
        const today = format(new Date(), 'yyyy-MM-dd');
        await assistantService.saveHabitEntry(learningHabit.id, today, transcription);
        // Recharger les habitudes
        await loadHabits();
      } else {
        console.warn('Habitude "Apprentissage" non trouvée');
      }

      setIsProcessingLearning(false);
      setShowLearningModal(false);
      setLearningText(''); // Réinitialiser le texte
      setLearningRecordingTime(0);

      const learningResponse: Message = {
        id: Date.now().toString(),
        text: `💡 Excellent ! J'ai enregistré tes apprentissages du jour.\n\n📚 Tes apprentissages sont maintenant sauvegardés dans l'habitude "Apprentissage" et visibles sur /mon-espace de l'app web.\n\n✨ Continue à apprendre et à grandir chaque jour !\n\nTu as gagné 20 XP ! 🌟`,
        isAI: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, learningResponse]);
      setXp((prev) => Math.min(prev + 20, maxXp));
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement de l\'apprentissage:', error);
      setIsProcessingLearning(false);
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'apprentissage');
    }
  };

  const endSession = () => {
    const timeSpent = Math.floor((selectedDuration * 60 - deepWorkTimeLeft) / 60);
    const tasksCompleted = tasks.filter((t) => t.completed).length;
    const xpEarned = tasksCompleted * 15;

    setSessionStats({ timeSpent, tasksCompleted, xpEarned });
    setIsDeepWorkActive(false);
    setShowSessionSummary(true);

    if (xpEarned > 0) {
      setXp((prev) => Math.min(prev + xpEarned, maxXp));
    }
  };

  const toggleHabit = async (habitId: string) => {
    try {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const newCompleted = !habit.completed;
      const today = format(new Date(), 'yyyy-MM-dd');

      // Mettre à jour optimistiquement
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id === habitId) {
            return { ...h, completed: newCompleted };
          }
          return h;
        })
      );

      // Appeler l'API pour mettre à jour l'habitude
      await habitsService.complete(habitId, today, habit.completed);

      if (newCompleted) {
        setXp((prevXp) => Math.min(prevXp + 10, maxXp));

        const habitMessage: Message = {
          id: Date.now().toString(),
          text: `🎉 Excellent ! Tu as complété "${habit.name}" ! Continue cette série de ${habit.streak || 0} jours ! +10 XP`,
          isAI: true,
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, habitMessage]);
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'habitude:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'habitude');
      // Rollback
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id === habitId) {
            return { ...h, completed: !h.completed };
          }
          return h;
        })
      );
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const xpPercentage = (xp / maxXp) * 100;

  // Charger les tâches d'aujourd'hui
  useEffect(() => {
    if (isDeepWorkActive) {
      loadTodayTasks();
    }
  }, [isDeepWorkActive]);

  // Charger les habitudes
  useEffect(() => {
    loadHabits();
  }, []);

  const loadTodayTasks = async () => {
    try {
      setIsLoadingTasks(true);
      const todayTasks = await assistantService.getTodayTasks();
      // Limiter à 4-6 tâches pour la session deep work
      const limitedTasks = todayTasks.slice(0, 6).map((task: any) => ({
        id: task.id,
        title: task.title,
        completed: task.completed || false,
        priority: task.priority,
        dueDate: task.dueDate,
      }));
      setTasks(limitedTasks);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      Alert.alert('Erreur', 'Impossible de charger les tâches');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const loadHabits = async () => {
    try {
      setIsLoadingHabits(true);
      const allHabits = await assistantService.getHabits();
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const habitsWithStatus = allHabits.map((habit: any) => {
        const entry = habit.entries?.find((e: any) => {
          const entryDate = format(new Date(e.date), 'yyyy-MM-dd');
          return entryDate === today;
        });
        
        return {
          id: habit.id,
          name: habit.name,
          icon: getHabitIcon(habit.name),
          completed: entry?.completed || false,
          streak: habit.streak || 0,
          bestStreak: habit.bestStreak || 0,
          completionRate: habit.completionRate || 0,
          entries: habit.entries || [],
        };
      });
      
      setHabits(habitsWithStatus);
    } catch (error) {
      console.error('Erreur lors du chargement des habitudes:', error);
      Alert.alert('Erreur', 'Impossible de charger les habitudes');
    } finally {
      setIsLoadingHabits(false);
    }
  };

  const getHabitIcon = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('méditation') || lowerName.includes('meditation')) return '🧘';
    if (lowerName.includes('exercice') || lowerName.includes('sport')) return '💪';
    if (lowerName.includes('lecture') || lowerName.includes('read')) return '📚';
    if (lowerName.includes('eau') || lowerName.includes('water')) return '💧';
    if (lowerName.includes('journal') || lowerName.includes('note')) return '📝';
    if (lowerName.includes('apprentissage') || lowerName.includes('learning')) return '💡';
    if (lowerName.includes('phone') || lowerName.includes('téléphone')) return '📵';
    return '✅';
  };

  // Animated values
  const logoScale = useSharedValue(1);
  const logoY = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    logoScale.value = withRepeat(
      withTiming(1.05, { duration: 3000 }),
      -1,
      true
    );
    logoY.value = withRepeat(
      withTiming(-5, { duration: 3000 }),
      -1,
      true
    );
    pulseScale.value = withRepeat(
      withTiming(1.2, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { translateY: logoY.value },
    ],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.2], [0.5, 0], Extrapolate.CLAMP),
  }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.content}>
          {/* Header with AI Avatar */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                <View style={styles.logoWrapper}>
                  <Image
                    source={require('../../assets/images/productif-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
                <Animated.View style={[styles.pulseRing, pulseAnimatedStyle]} />
              </Animated.View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>AI Productivity Coach</Text>
                <Text style={styles.headerSubtitle}>Always learning, always improving</Text>
              </View>
            </View>

            {/* XP Progress Ring */}
            <View style={styles.xpCard}>
              <View style={styles.xpHeader}>
                <View style={styles.xpHeaderLeft}>
                  <Ionicons name="flash" size={16} color="#00C27A" />
                  <Text style={styles.xpLabel}>Progress to next level</Text>
                </View>
                <Text style={styles.xpValue}>{xp}/{maxXp} XP</Text>
              </View>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${xpPercentage}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message, index) => (
              <Animated.View
                key={message.id}
                entering={FadeInDown.delay(index * 100).duration(400)}
                style={[
                  styles.messageContainer,
                  message.isAI ? styles.messageAI : styles.messageUser,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.isAI ? styles.messageBubbleAI : styles.messageBubbleUser,
                  ]}
                >
                  <Text style={message.isAI ? styles.messageTextAI : styles.messageTextUser}>
                    {message.text}
                  </Text>
                </View>
              </Animated.View>
            ))}

            {/* Deep Work Timer & Tasks */}
            {isDeepWorkActive && (
              <Animated.View
                entering={FadeIn.duration(400)}
                exiting={FadeOut.duration(400)}
                style={styles.deepWorkContainer}
              >
                {/* Focus Bubble with Timer */}
                <LinearGradient
                  colors={['#00C27A', '#00D68F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.focusBubble}
                >
                  <View style={styles.focusHeader}>
                    <View style={styles.focusHeaderLeft}>
                      <Ionicons name="brain" size={24} color="#FFFFFF" />
                      <Text style={styles.focusTitle}>Deep Focus Mode</Text>
                    </View>
                    <TouchableOpacity onPress={endSession}>
                      <Text style={styles.endSessionText}>End Session</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>{formatTime(deepWorkTimeLeft)}</Text>
                    <Text style={styles.timerSubtext}>Stay focused! You're doing great 🎯</Text>
                  </View>

                  <View style={styles.timerProgressBar}>
                    <View
                      style={[
                        styles.timerProgressFill,
                        {
                          width: `${((selectedDuration * 60 - deepWorkTimeLeft) / (selectedDuration * 60)) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </LinearGradient>

                {/* Task List */}
                <View style={styles.tasksCard}>
                  <View style={styles.tasksHeader}>
                    <View style={styles.tasksHeaderLeft}>
                      <Ionicons name="flag" size={20} color="#00C27A" />
                      <Text style={styles.tasksTitle}>Your Tasks</Text>
                    </View>
                    <Text style={styles.tasksCount}>
                      {tasks.filter((t) => t.completed).length}/{tasks.length}
                    </Text>
                  </View>

                  {isLoadingTasks ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#00C27A" />
                      <Text style={styles.loadingText}>Chargement des tâches...</Text>
                    </View>
                  ) : tasks.length === 0 ? (
                    <Text style={styles.emptyText}>Aucune tâche pour aujourd'hui</Text>
                  ) : (
                    tasks.map((task, index) => (
                      <TouchableOpacity
                        key={task.id}
                        onPress={() => toggleTask(task.id)}
                        style={styles.taskItem}
                      >
                        <View
                          style={[
                            styles.taskCheckbox,
                            task.completed && styles.taskCheckboxCompleted,
                          ]}
                        >
                          {task.completed && (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.taskText,
                            task.completed && styles.taskTextCompleted,
                          ]}
                        >
                          {task.title}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </Animated.View>
            )}
          </ScrollView>

          {/* Quick Action Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsContainer}
            contentContainerStyle={styles.quickActionsContent}
          >
            {quickActions.map((action, index) => (
              <Animated.View
                key={action.action}
                entering={FadeInDown.delay(index * 100).duration(400)}
              >
                <TouchableOpacity
                  onPress={() => handleQuickAction(action.action)}
                  style={styles.quickActionChip}
                >
                  <Ionicons name={action.icon} size={16} color="#00C27A" />
                  <Text style={styles.quickActionText}>{action.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
              />
            </View>

            <TouchableOpacity style={styles.micButton}>
              <Ionicons name="mic" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
              <LinearGradient
                colors={['#00C27A', '#00D68F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Selector Modal */}
        <Modal
          visible={showTimeSelector}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimeSelector(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowTimeSelector(false)}
          >
            <Pressable style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="timer" size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.modalTitle}>Choose Focus Duration</Text>
                <Text style={styles.modalSubtitle}>How long do you want to focus?</Text>
              </View>

              <View style={styles.timeOptionsGrid}>
                {timeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.minutes}
                    onPress={() => startDeepWork(option.minutes)}
                    style={styles.timeOption}
                  >
                    <Text style={styles.timeOptionEmoji}>{option.emoji}</Text>
                    <Text style={styles.timeOptionLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.customDurationContainer}>
                <Text style={styles.customDurationLabel}>Or enter custom duration</Text>
                <View style={styles.customDurationInputRow}>
                  <TextInput
                    style={[
                      styles.customDurationInput,
                      customDurationError && styles.customDurationInputError,
                    ]}
                    value={customDuration}
                    onChangeText={(text) => {
                      setCustomDuration(text);
                      setCustomDurationError('');
                    }}
                    placeholder="e.g. 30"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <TouchableOpacity
                    onPress={startCustomDuration}
                    style={styles.customDurationButton}
                  >
                    <LinearGradient
                      colors={['#00C27A', '#00D68F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.customDurationButtonGradient}
                    >
                      <Text style={styles.customDurationButtonText}>Start</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                {customDurationError && (
                  <Text style={styles.customDurationError}>{customDurationError}</Text>
                )}
                <Text style={styles.customDurationHint}>Range: 1-120 minutes</Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowTimeSelector(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Voice Journal Modal */}
        <JournalModal
          visible={showJournalModal}
          onClose={async () => {
            // Arrêter l'enregistrement si en cours
            if (recordingRef.current) {
              try {
                await recordingRef.current.stopAndUnloadAsync();
                const uri = recordingRef.current.getURI();
                recordingRef.current = null;
                // Nettoyer le fichier audio
                if (uri) {
                  await FileSystem.deleteAsync(uri, { idempotent: true });
                }
              } catch (error) {
                console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
              }
            }
            setIsRecording(false);
            setRecordingTime(0);
            setJournalText('');
            setShowJournalModal(false);
          }}
          title="Daily Journal"
          subtitle={isProcessingJournal ? 'Processing your thoughts...' : isRecording ? "I'm listening..." : 'Tell me about your day'}
          emoji="📝"
          isRecording={isRecording}
          recordingTime={recordingTime}
          isProcessing={isProcessingJournal}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          journalText={journalText}
          onJournalTextChange={setJournalText}
          prompt="Share what went well and what needs improvement"
        />

        {/* Voice Planning Modal */}
        <JournalModal
          visible={showPlanningModal}
          onClose={async () => {
            // Arrêter l'enregistrement si en cours
            if (planningRecordingRef.current) {
              try {
                await planningRecordingRef.current.stopAndUnloadAsync();
                const uri = planningRecordingRef.current.getURI();
                planningRecordingRef.current = null;
                // Nettoyer le fichier audio
                if (uri) {
                  await FileSystem.deleteAsync(uri, { idempotent: true });
                }
              } catch (error) {
                console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
              }
            }
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
            });
            setIsPlanningRecording(false);
            setPlanningRecordingTime(0);
            setShowPlanningModal(false);
          }}
          title="Plan Tomorrow"
          subtitle={isProcessingPlanning ? 'Creating your personalized plan...' : isPlanningRecording ? "I'm listening..." : 'Tell me about your day tomorrow'}
          emoji="📅"
          isRecording={isPlanningRecording}
          recordingTime={planningRecordingTime}
          isProcessing={isProcessingPlanning}
          onStartRecording={startPlanningRecording}
          onStopRecording={stopPlanningRecording}
          journalText={planningText}
          onJournalTextChange={setPlanningText}
          prompt="Share your tasks, meetings, and priorities for tomorrow"
        />

        {/* Voice Learning Modal */}
        <JournalModal
          visible={showLearningModal}
          onClose={async () => {
            // Arrêter l'enregistrement si en cours
            if (learningRecordingRef.current) {
              try {
                await learningRecordingRef.current.stopAndUnloadAsync();
                const uri = learningRecordingRef.current.getURI();
                learningRecordingRef.current = null;
                // Nettoyer le fichier audio
                if (uri) {
                  await FileSystem.deleteAsync(uri, { idempotent: true });
                }
              } catch (error) {
                console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
              }
            }
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
            });
            setIsLearningRecording(false);
            setLearningRecordingTime(0);
            setShowLearningModal(false);
          }}
          title="What I Learned Today"
          subtitle={isProcessingLearning ? 'Processing your insights...' : isLearningRecording ? "I'm listening..." : 'Share what you learned today'}
          emoji="💡"
          isRecording={isLearningRecording}
          recordingTime={learningRecordingTime}
          isProcessing={isProcessingLearning}
          onStartRecording={startLearningRecording}
          onStopRecording={stopLearningRecording}
          journalText={learningText}
          onJournalTextChange={setLearningText}
          prompt="Describe new skills, insights, or knowledge you gained"
        />

        {/* Habit Tracking Modal */}
        <HabitsModal
          visible={showHabitsModal}
          onClose={() => setShowHabitsModal(false)}
          habits={habits}
          onToggleHabit={toggleHabit}
          isLoadingHabits={isLoadingHabits}
        />

        {/* Task Complete Animation */}
        {showTaskCompleteAnimation && (
          <TaskCompleteAnimation onComplete={() => setShowTaskCompleteAnimation(false)} />
        )}

        {/* Session Complete Animation */}
        {showSessionCompleteAnimation && (
          <SessionCompleteAnimation
            onComplete={() => setShowSessionCompleteAnimation(false)}
            selectedDuration={selectedDuration}
            tasksCompleted={tasks.filter((t) => t.completed).length}
          />
        )}

        {/* Session Summary Modal */}
        <SessionSummaryModal
          visible={showSessionSummary}
          onClose={() => {
            setShowSessionSummary(false);
            setTasks((prev) => prev.map((task) => ({ ...task, completed: false })));
          }}
          sessionStats={sessionStats}
          totalTasks={tasks.length}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Voice Modal Component
function VoiceModal({
  visible,
  onClose,
  title,
  subtitle,
  emoji,
  isRecording,
  recordingTime,
  isProcessing,
  onStartRecording,
  onStopRecording,
  prompt,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  emoji: string;
  isRecording: boolean;
  recordingTime: number;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  prompt: string;
}) {
  const micScale = useSharedValue(1);
  const processingRotation = useSharedValue(0);
  const pulseRings = [useSharedValue(1), useSharedValue(1), useSharedValue(1)];

  useEffect(() => {
    if (isRecording) {
      micScale.value = withRepeat(withTiming(1.1, { duration: 1500 }), -1, true);
      pulseRings.forEach((ring, i) => {
        ring.value = withRepeat(
          withTiming(2.2, { duration: 2000 }),
          -1,
          false
        );
      });
    } else {
      micScale.value = 1;
      pulseRings.forEach((ring) => {
        ring.value = 1;
      });
    }
  }, [isRecording]);

  useEffect(() => {
    if (isProcessing) {
      processingRotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );
    } else {
      processingRotation.value = 0;
    }
  }, [isProcessing]);

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const processingRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${processingRotation.value}deg` }],
  }));

  // Créer les styles animés pour chaque pulse ring en dehors du map
  const pulseRingStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: pulseRings[0].value }],
    opacity: interpolate(pulseRings[0].value, [1, 2.2], [0.5, 0], Extrapolate.CLAMP),
  }));

  const pulseRingStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: pulseRings[1].value }],
    opacity: interpolate(pulseRings[1].value, [1, 2.2], [0.5, 0], Extrapolate.CLAMP),
  }));

  const pulseRingStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: pulseRings[2].value }],
    opacity: interpolate(pulseRings[2].value, [1, 2.2], [0.5, 0], Extrapolate.CLAMP),
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={20} style={styles.voiceModalBackdrop}>
        <Pressable style={styles.voiceModalContent} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={['#00C27A', '#00D68F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.voiceModalHeader}
          >
            <Text style={styles.voiceModalEmoji}>{emoji}</Text>
            <Text style={styles.voiceModalTitle}>{title}</Text>
            <Text style={styles.voiceModalSubtitle}>{subtitle}</Text>
          </LinearGradient>

          <View style={styles.voiceModalBody}>
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <Animated.View style={[styles.processingIcon, processingRotationStyle]}>
                  <Ionicons name="flash" size={32} color="#00C27A" />
                </Animated.View>
                <Text style={styles.processingText}>
                  {title.includes('Journal') ? 'Analyzing your reflections...' : title.includes('Plan') ? 'Building your perfect day...' : 'Capturing your knowledge...'}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.micContainer}>
                  <Animated.View style={micAnimatedStyle}>
                    <TouchableOpacity
                      onPress={isRecording ? onStopRecording : onStartRecording}
                      activeOpacity={0.8}
                      style={[
                        styles.micButtonLarge,
                        isRecording && styles.micButtonRecording,
                        { zIndex: 10 },
                      ]}
                    >
                      <LinearGradient
                        colors={isRecording ? ['#EF4444', '#DC2626'] : ['#00C27A', '#00D68F']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.micButtonGradient}
                      >
                        <Ionicons name="mic" size={48} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  {isRecording && (
                    <>
                      <Animated.View
                        style={[styles.pulseRing, pulseRingStyle1]}
                        pointerEvents="none"
                      />
                      <Animated.View
                        style={[styles.pulseRing, pulseRingStyle2]}
                        pointerEvents="none"
                      />
                      <Animated.View
                        style={[styles.pulseRing, pulseRingStyle3]}
                        pointerEvents="none"
                      />
                      <View style={styles.recordingDot} pointerEvents="none" />
                    </>
                  )}
                </View>

                {isRecording && (
                  <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
                )}

                <Text style={styles.voicePrompt}>
                  {isRecording ? 'Tap again to stop recording' : 'Tap the microphone to start'}
                </Text>
                <Text style={styles.voicePromptHint}>{prompt}</Text>
              </>
            )}
          </View>

          {!isProcessing && (
            <TouchableOpacity onPress={onClose} style={styles.voiceModalCancel}>
              <Text style={styles.voiceModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </BlurView>
    </Modal>
  );
}

// Journal Modal Component (avec champ de texte)
function JournalModal({
  visible,
  onClose,
  title,
  subtitle,
  emoji,
  isRecording,
  recordingTime,
  isProcessing,
  onStartRecording,
  onStopRecording,
  journalText,
  onJournalTextChange,
  prompt,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  emoji: string;
  isRecording: boolean;
  recordingTime: number;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  journalText: string;
  onJournalTextChange: (text: string) => void;
  prompt: string;
}) {
  const micScale = useSharedValue(1);
  const processingRotation = useSharedValue(0);
  const pulseRings = [useSharedValue(1), useSharedValue(1), useSharedValue(1)];

  useEffect(() => {
    if (isRecording) {
      micScale.value = withRepeat(withTiming(1.1, { duration: 1500 }), -1, true);
      pulseRings.forEach((ring, i) => {
        ring.value = withRepeat(
          withTiming(2.2, { duration: 2000 }),
          -1,
          false
        );
      });
    } else {
      micScale.value = 1;
      pulseRings.forEach((ring) => {
        ring.value = 1;
      });
    }
  }, [isRecording]);

  useEffect(() => {
    if (isProcessing) {
      processingRotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );
    } else {
      processingRotation.value = 0;
    }
  }, [isProcessing]);

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const processingRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${processingRotation.value}deg` }],
  }));

  const pulseRingStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: pulseRings[0].value }],
    opacity: interpolate(pulseRings[0].value, [1, 2.2], [0.5, 0], Extrapolate.CLAMP),
  }));

  const pulseRingStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: pulseRings[1].value }],
    opacity: interpolate(pulseRings[1].value, [1, 2.2], [0.5, 0], Extrapolate.CLAMP),
  }));

  const pulseRingStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: pulseRings[2].value }],
    opacity: interpolate(pulseRings[2].value, [1, 2.2], [0.5, 0], Extrapolate.CLAMP),
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={20} style={styles.voiceModalBackdrop}>
        <Pressable style={styles.voiceModalContent} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={['#00C27A', '#00D68F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.voiceModalHeader}
          >
            <Text style={styles.voiceModalEmoji}>{emoji}</Text>
            <Text style={styles.voiceModalTitle}>{title}</Text>
            <Text style={styles.voiceModalSubtitle}>{subtitle}</Text>
          </LinearGradient>

          <View style={styles.voiceModalBody}>
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <Animated.View style={[styles.processingIcon, processingRotationStyle]}>
                  <Ionicons name="flash" size={32} color="#00C27A" />
                </Animated.View>
                <Text style={styles.processingText}>
                  Analyzing your reflections...
                </Text>
              </View>
            ) : (
              <>
                {/* Champ de texte pour saisie manuelle */}
                <View style={styles.journalTextContainer}>
                  <Text style={styles.journalTextLabel}>Écrivez votre note de journée :</Text>
                  <TextInput
                    style={styles.journalTextInput}
                    value={journalText}
                    onChangeText={onJournalTextChange}
                    placeholder="Partagez ce qui s'est bien passé aujourd'hui et ce qui peut être amélioré..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    editable={!isRecording}
                  />
                </View>

                <View style={styles.micContainer}>
                  <Animated.View style={micAnimatedStyle}>
                    <TouchableOpacity
                      onPress={isRecording ? onStopRecording : onStartRecording}
                      activeOpacity={0.8}
                      style={[
                        styles.micButtonLarge,
                        isRecording && styles.micButtonRecording,
                        { zIndex: 10 },
                      ]}
                    >
                      <LinearGradient
                        colors={isRecording ? ['#EF4444', '#DC2626'] : ['#00C27A', '#00D68F']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.micButtonGradient}
                      >
                        <Ionicons name="mic" size={48} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  {isRecording && (
                    <>
                      <Animated.View
                        style={[styles.pulseRing, pulseRingStyle1]}
                        pointerEvents="none"
                      />
                      <Animated.View
                        style={[styles.pulseRing, pulseRingStyle2]}
                        pointerEvents="none"
                      />
                      <Animated.View
                        style={[styles.pulseRing, pulseRingStyle3]}
                        pointerEvents="none"
                      />
                      <View style={styles.recordingDot} pointerEvents="none" />
                    </>
                  )}
                </View>

                {isRecording && (
                  <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
                )}

                <Text style={styles.voicePrompt}>
                  {isRecording ? 'Tap again to stop recording' : journalText.trim() ? 'Vous pouvez aussi enregistrer votre voix' : 'Écrivez votre note ou enregistrez votre voix'}
                </Text>
                <Text style={styles.voicePromptHint}>{prompt}</Text>
              </>
            )}
          </View>

          {!isProcessing && (
            <TouchableOpacity onPress={onClose} style={styles.voiceModalCancel}>
              <Text style={styles.voiceModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </BlurView>
    </Modal>
  );
}

// Habits Modal Component
function HabitsModal({
  visible,
  onClose,
  habits,
  onToggleHabit,
  isLoadingHabits,
}: {
  visible: boolean;
  onClose: () => void;
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  isLoadingHabits: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.habitsModalBackdrop} onPress={onClose}>
        <Pressable style={styles.habitsModalContent} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={['#00C27A', '#00D68F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.habitsModalHeader}
          >
            <View style={styles.habitsModalIconContainer}>
              <Ionicons name="flag" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.habitsModalTitle}>Today's Habits</Text>
            <Text style={styles.habitsModalSubtitle}>
              {habits.filter((h) => h.completed).length}/{habits.length} completed
            </Text>
          </LinearGradient>

          <View style={styles.habitsListContainer}>
            <ScrollView 
              style={styles.habitsList} 
              contentContainerStyle={styles.habitsListContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
            {isLoadingHabits ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#00C27A" />
                <Text style={styles.loadingText}>Chargement des habitudes...</Text>
              </View>
            ) : habits.length === 0 ? (
              <Text style={styles.emptyText}>Aucune habitude trouvée</Text>
            ) : (
              // Trier les habitudes : non complétées en premier
              (() => {
                const sortedHabits = [...habits].sort((a, b) => {
                  if (a.completed === b.completed) return 0;
                  return a.completed ? 1 : -1;
                });
                return sortedHabits.map((habit, index) => (
                <Animated.View
                  key={habit.id}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                >
                  <TouchableOpacity
                    onPress={() => onToggleHabit(habit.id)}
                    style={[
                      styles.habitItem,
                      habit.completed && styles.habitItemCompleted,
                    ]}
                  >
                    <View
                      style={[
                        styles.habitCheckbox,
                        habit.completed && styles.habitCheckboxCompleted,
                      ]}
                    >
                      {habit.completed && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <View style={styles.habitContent}>
                      <View style={styles.habitHeader}>
                        <Text style={styles.habitIcon}>{habit.icon || '✅'}</Text>
                        <Text
                          style={[
                            styles.habitName,
                            habit.completed && styles.habitNameCompleted,
                          ]}
                        >
                          {habit.name}
                        </Text>
                      </View>
                      <View style={styles.habitStats}>
                        <View style={styles.habitStat}>
                          <Text style={styles.habitStatIcon}>🔥</Text>
                          <Text style={styles.habitStatText}>{habit.streak || 0} jour{habit.streak !== 1 ? 's' : ''}</Text>
                        </View>
                        <View style={styles.habitStat}>
                          <Text style={styles.habitStatIcon}>📊</Text>
                          <Text style={styles.habitStatText}>{habit.completionRate || 0}%</Text>
                        </View>
                      </View>
                      {habit.streak === habit.bestStreak && habit.streak && habit.streak > 3 && (
                        <View style={styles.bestStreakBadge}>
                          <Text style={styles.bestStreakText}>⭐ Meilleure série !</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
                ));
              })()
            )}
            </ScrollView>
          </View>

          <View style={styles.habitsFooter}>
            <View style={styles.habitsStatsGrid}>
              <View style={styles.habitStatCard}>
                <Text style={styles.habitStatCardIcon}>✅</Text>
                <Text style={styles.habitStatCardValue}>
                  {habits.filter((h) => h.completed).length}
                </Text>
                <Text style={styles.habitStatCardLabel}>Done Today</Text>
              </View>
              <View style={styles.habitStatCard}>
                <Text style={styles.habitStatCardIcon}>📈</Text>
                <Text style={styles.habitStatCardValue}>
                  {habits.length > 0
                    ? Math.round((habits.filter((h) => h.completed).length / habits.length) * 100)
                    : 0}%
                </Text>
                <Text style={styles.habitStatCardLabel}>Avg Rate</Text>
              </View>
              <View style={styles.habitStatCard}>
                <Text style={styles.habitStatCardIcon}>🔥</Text>
                <Text style={styles.habitStatCardValue}>
                  {habits.length > 0
                    ? Math.max(...habits.map((h) => h.streak || 0))
                    : 0}
                </Text>
                <Text style={styles.habitStatCardLabel}>Top Streak</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.habitsDoneButton}>
              <LinearGradient
                colors={['#00C27A', '#00D68F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.habitsDoneButtonGradient}
              >
                <Text style={styles.habitsDoneButtonText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Task Complete Animation Component
function TaskCompleteAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={styles.animationOverlay} pointerEvents="none">
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)}>
        <View style={styles.animationContent}>
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark-circle" size={96} color="#00C27A" />
          </View>
          <Animated.Text
            entering={FadeIn.delay(200).duration(300)}
            style={styles.xpText}
          >
            +15 XP
          </Animated.Text>
        </View>
      </Animated.View>
    </View>
  );
}

// Session Complete Animation Component
function SessionCompleteAnimation({
  onComplete,
  selectedDuration,
  tasksCompleted,
}: {
  onComplete: () => void;
  selectedDuration: number;
  tasksCompleted: number;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Pressable style={styles.sessionCompleteOverlay} onPress={onComplete}>
      <BlurView intensity={80} style={styles.sessionCompleteBlur}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.sessionCompleteContent}>
          <Text style={styles.sessionCompleteEmoji}>🏆</Text>
          <Text style={styles.sessionCompleteTitle}>Amazing Work!</Text>
          <Text style={styles.sessionCompleteSubtitle}>Deep Work Session Complete</Text>
          <View style={styles.sessionCompleteXPBadge}>
            <Ionicons name="flash" size={24} color="#FCD34D" />
            <Text style={styles.sessionCompleteXPText}>+50 XP</Text>
          </View>
          <View style={styles.sessionCompleteStats}>
            <View style={styles.sessionCompleteStat}>
              <Text style={styles.sessionCompleteStatEmoji}>⏱️</Text>
              <Text style={styles.sessionCompleteStatText}>{selectedDuration} min focused</Text>
            </View>
            <View style={styles.sessionCompleteStat}>
              <Text style={styles.sessionCompleteStatEmoji}>✅</Text>
              <Text style={styles.sessionCompleteStatText}>{tasksCompleted} tasks done</Text>
            </View>
          </View>
          <Text style={styles.sessionCompleteHint}>Tap anywhere to continue</Text>
        </Animated.View>
      </BlurView>
    </Pressable>
  );
}

// Session Summary Modal Component
function SessionSummaryModal({
  visible,
  onClose,
  sessionStats,
  totalTasks,
}: {
  visible: boolean;
  onClose: () => void;
  sessionStats: { timeSpent: number; tasksCompleted: number; xpEarned: number };
  totalTasks: number;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.summaryModalBackdrop} onPress={onClose}>
        <Pressable style={styles.summaryModalContent} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={['#00C27A', '#00D68F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryModalHeader}
          >
            <Text style={styles.summaryModalEmoji}>📊</Text>
            <Text style={styles.summaryModalTitle}>Session Summary</Text>
            <Text style={styles.summaryModalSubtitle}>Here's how you did!</Text>
          </LinearGradient>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStatCard}>
              <View style={styles.summaryStatIconContainer}>
                <Ionicons name="timer" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.summaryStatContent}>
                <Text style={styles.summaryStatLabel}>Time Focused</Text>
                <Text style={styles.summaryStatValue}>{sessionStats.timeSpent} min</Text>
              </View>
              <Text style={styles.summaryStatEmoji}>⏱️</Text>
            </View>

            <View style={styles.summaryStatCard}>
              <View style={styles.summaryStatIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.summaryStatContent}>
                <Text style={styles.summaryStatLabel}>Tasks Completed</Text>
                <Text style={styles.summaryStatValue}>
                  {sessionStats.tasksCompleted} / {totalTasks}
                </Text>
              </View>
              <Text style={styles.summaryStatEmoji}>✅</Text>
            </View>

            <View style={[styles.summaryStatCard, styles.summaryStatCardXP]}>
              <View style={[styles.summaryStatIconContainer, styles.summaryStatIconContainerXP]}>
                <Ionicons name="flash" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.summaryStatContent}>
                <Text style={styles.summaryStatLabel}>XP Earned</Text>
                <Text style={styles.summaryStatValue}>+{sessionStats.xpEarned} XP</Text>
              </View>
              <Text style={styles.summaryStatEmoji}>⚡</Text>
            </View>

            <Text style={styles.summaryMotivational}>
              {sessionStats.tasksCompleted === totalTasks
                ? '🎉 Perfect! You completed all tasks!'
                : sessionStats.tasksCompleted > 0
                  ? '💪 Great progress! Keep it up!'
                  : '👍 Every minute counts! Try again soon!'}
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.summaryFinishButton}>
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.summaryFinishButtonGradient}
            >
              <Text style={styles.summaryFinishButtonText}>Finish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'visible',
  },
  logoWrapper: {
    width: 48,
    height: 48,
    zIndex: 1,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00C27A',
    opacity: 0.1,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#00C27A',
  },
  xpCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00C27A33',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpLabel: {
    fontSize: 14,
    color: '#374151',
  },
  xpValue: {
    fontSize: 14,
    color: '#00C27A',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00C27A',
    borderRadius: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 120 : 110,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageAI: {
    alignItems: 'flex-start',
  },
  messageUser: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  messageBubbleAI: {
    backgroundColor: '#F0FDF4',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#00C27A33',
  },
  messageBubbleUser: {
    backgroundColor: '#00C27A',
    borderTopRightRadius: 4,
  },
  messageTextAI: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 20,
  },
  messageTextUser: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  deepWorkContainer: {
    marginTop: 16,
  },
  focusBubble: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  focusHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  endSessionText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  timerSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  timerProgressBar: {
    height: 8,
    backgroundColor: '#FFFFFF33',
    borderRadius: 4,
    overflow: 'hidden',
  },
  timerProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  tasksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tasksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  tasksCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    gap: 12,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCheckboxCompleted: {
    backgroundColor: '#00C27A',
    borderColor: '#00C27A',
  },
  taskText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  taskTextCompleted: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  quickActionsContainer: {
    maxHeight: 60,
    marginBottom: 12,
    paddingBottom: 8,
  },
  quickActionsContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00C27A4D',
    gap: 6,
  },
  quickActionText: {
    fontSize: 14,
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 100 : 90,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 100,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00C27A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  timeOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00C27A4D',
  },
  timeOptionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  timeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  customDurationContainer: {
    marginBottom: 24,
  },
  customDurationLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  customDurationInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  customDurationInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  customDurationInputError: {
    borderColor: '#EF4444',
  },
  customDurationButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  customDurationButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customDurationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customDurationError: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  customDurationHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  // Voice Modal Styles
  voiceModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  voiceModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
  },
  voiceModalHeader: {
    padding: 24,
    alignItems: 'center',
  },
  voiceModalEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  voiceModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  voiceModalSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  voiceModalBody: {
    padding: 32,
    alignItems: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  processingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  processingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  micButtonLarge: {
    width: 128,
    height: 128,
    borderRadius: 64,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  micButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonRecording: {
    shadowColor: '#EF4444',
  },
  pulseRing: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: '#EF4444',
  },
  recordingDot: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  recordingTime: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 16,
  },
  voicePrompt: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  voicePromptHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  voiceModalCancel: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  voiceModalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  // Journal Text Input Styles
  journalTextContainer: {
    width: '100%',
    marginBottom: 24,
  },
  journalTextLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '600',
  },
  journalTextInput: {
    width: '100%',
    minHeight: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlignVertical: 'top',
  },
  // Habits Modal Styles
  habitsModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  habitsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  habitsModalHeader: {
    padding: 24,
    alignItems: 'center',
  },
  habitsModalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF33',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitsModalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  habitsModalSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  habitsListContainer: {
    flexShrink: 1,
    minHeight: 200,
    maxHeight: 350,
  },
  habitsList: {
    flex: 1,
  },
  habitsListContent: {
    padding: 24,
    gap: 12,
    paddingBottom: 24,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  habitItemCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00C27A',
  },
  habitCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  habitCheckboxCompleted: {
    backgroundColor: '#00C27A',
    borderColor: '#00C27A',
  },
  habitContent: {
    flex: 1,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  habitIcon: {
    fontSize: 24,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  habitNameCompleted: {
    color: '#374151',
  },
  habitStats: {
    flexDirection: 'row',
    gap: 16,
  },
  habitStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  habitStatIcon: {
    fontSize: 12,
  },
  habitStatText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bestStreakBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestStreakText: {
    fontSize: 12,
    color: '#92400E',
  },
  habitsFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  habitsStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  habitStatCard: {
    alignItems: 'center',
  },
  habitStatCardIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  habitStatCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00C27A',
    marginBottom: 4,
  },
  habitStatCardLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  habitsDoneButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  habitsDoneButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  habitsDoneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Animation Styles
  animationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  animationContent: {
    alignItems: 'center',
  },
  checkmarkCircle: {
    marginBottom: 16,
  },
  xpText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00C27A',
  },
  sessionCompleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  sessionCompleteBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sessionCompleteContent: {
    alignItems: 'center',
  },
  sessionCompleteEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  sessionCompleteTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  sessionCompleteSubtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 24,
  },
  sessionCompleteXPBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF33',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 12,
  },
  sessionCompleteXPText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sessionCompleteStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 32,
  },
  sessionCompleteStat: {
    alignItems: 'center',
  },
  sessionCompleteStatEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  sessionCompleteStatText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  sessionCompleteHint: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  // Summary Modal Styles
  summaryModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  summaryModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
  },
  summaryModalHeader: {
    padding: 24,
    alignItems: 'center',
  },
  summaryModalEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  summaryModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryModalSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  summaryStats: {
    padding: 24,
    gap: 16,
  },
  summaryStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#00C27A33',
    gap: 12,
  },
  summaryStatCardXP: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  summaryStatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#00C27A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryStatIconContainerXP: {
    backgroundColor: '#F59E0B',
  },
  summaryStatContent: {
    flex: 1,
  },
  summaryStatLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryStatEmoji: {
    fontSize: 24,
  },
  summaryMotivational: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 12,
  },
  summaryFinishButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  summaryFinishButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  summaryFinishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
