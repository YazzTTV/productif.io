import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Progress } from '../ui/Progress';
import { apiCall } from '@/lib/api';

// Temps par défaut en secondes
const DEFAULT_WORK_TIME = 25 * 60; // 25 minutes
const DEFAULT_SHORT_BREAK = 5 * 60; // 5 minutes
const DEFAULT_LONG_BREAK = 15 * 60; // 15 minutes
const POMODOROS_BEFORE_LONG_BREAK = 4;

// Clés pour AsyncStorage
const STORAGE_KEYS = {
  WORK_TIME: 'pomodoro_work_time',
  SHORT_BREAK: 'pomodoro_short_break',
  LONG_BREAK: 'pomodoro_long_break',
  SOUND_ENABLED: 'pomodoro_sound_enabled',
  SESSIONS_COUNT: 'pomodoro_sessions_count',
};

interface PomodoroTimerProps {
  onComplete: () => void;
  taskTitle?: string;
}

export function PomodoroTimer({ onComplete, taskTitle }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Paramètres
  const [workTime, setWorkTime] = useState(DEFAULT_WORK_TIME);
  const [shortBreakTime, setShortBreakTime] = useState(DEFAULT_SHORT_BREAK);
  const [longBreakTime, setLongBreakTime] = useState(DEFAULT_LONG_BREAK);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionsCount, setSessionsCount] = useState(4);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les paramètres sauvegardés
  useEffect(() => {
    loadSettings();
  }, []);

  // Sauvegarder les paramètres
  const saveSettings = async () => {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.WORK_TIME, workTime.toString()],
        [STORAGE_KEYS.SHORT_BREAK, shortBreakTime.toString()],
        [STORAGE_KEYS.LONG_BREAK, longBreakTime.toString()],
        [STORAGE_KEYS.SOUND_ENABLED, soundEnabled.toString()],
        [STORAGE_KEYS.SESSIONS_COUNT, sessionsCount.toString()],
      ]);
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
    }
  };

  // Charger les paramètres
  const loadSettings = async () => {
    try {
      const values = await AsyncStorage.multiGet([
        STORAGE_KEYS.WORK_TIME,
        STORAGE_KEYS.SHORT_BREAK,
        STORAGE_KEYS.LONG_BREAK,
        STORAGE_KEYS.SOUND_ENABLED,
        STORAGE_KEYS.SESSIONS_COUNT,
      ]);

      values.forEach(([key, value]) => {
        if (value) {
          switch (key) {
            case STORAGE_KEYS.WORK_TIME:
              setWorkTime(parseInt(value));
              break;
            case STORAGE_KEYS.SHORT_BREAK:
              setShortBreakTime(parseInt(value));
              break;
            case STORAGE_KEYS.LONG_BREAK:
              setLongBreakTime(parseInt(value));
              break;
            case STORAGE_KEYS.SOUND_ENABLED:
              setSoundEnabled(value === 'true');
              break;
            case STORAGE_KEYS.SESSIONS_COUNT:
              setSessionsCount(parseInt(value));
              break;
          }
        }
      });
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  // Réinitialiser le timer
  const resetTimer = () => {
    setTimeLeft(workTime);
    setIsRunning(false);
    setIsBreak(false);
    setIsLongBreak(false);
    setPomodoroCount(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Effet principal du timer
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            if (!isBreak) {
              // Fin du temps de travail
              const newPomodoroCount = pomodoroCount + 1;
              setPomodoroCount(newPomodoroCount);

              // Enregistrer l'entrée de temps pour ce cycle de travail
              try {
                const now = new Date();
                const startedAt = new Date(now.getTime() - (workTime - 1) * 1000); // approx start for this cycle
                apiCall('/time-entries', {
                  method: 'POST',
                  body: JSON.stringify({
                    startTime: startedAt.toISOString(),
                    endTime: now.toISOString(),
                    note: `Pomodoro ${newPomodoroCount}`,
                  })
                }).catch((e) => console.error('Erreur création time-entry:', e));
              } catch (e) {
                console.error('Erreur enregistrement time-entry:', e);
              }
              
              // Vérifier si on a atteint le nombre de sessions souhaité
              if (newPomodoroCount >= sessionsCount) {
                setIsRunning(false);
                Alert.alert('🎉 Session terminée !', 'Félicitations, vous avez terminé toutes vos sessions !');
                onComplete();
                return 0;
              }
              
              // Déterminer le type de pause
              const shouldTakeLongBreak = newPomodoroCount % POMODOROS_BEFORE_LONG_BREAK === 0;
              setIsLongBreak(shouldTakeLongBreak);
              setIsBreak(true);
              
              Alert.alert(
                '⏰ Temps de travail terminé !',
                shouldTakeLongBreak 
                  ? `C'est l'heure de la longue pause de ${Math.floor(longBreakTime / 60)} minutes.`
                  : `C'est l'heure de la pause de ${Math.floor(shortBreakTime / 60)} minutes.`
              );
              
              return shouldTakeLongBreak ? longBreakTime : shortBreakTime;
            } else {
              // Fin de la pause
              Alert.alert('✨ Pause terminée !', 'Reprenons le travail.');
              setIsBreak(false);
              setIsLongBreak(false);
              return workTime;
            }
          }
          return time - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, isBreak, isLongBreak, workTime, shortBreakTime, longBreakTime, pomodoroCount, sessionsCount, onComplete]);

  // Basculer le timer
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Formater le temps
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculer le pourcentage de progression
  const getProgress = () => {
    const totalTime = isBreak 
      ? (isLongBreak ? longBreakTime : shortBreakTime)
      : workTime;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Obtenir la couleur du timer
  const getTimerColor = () => {
    if (isBreak) {
      return isLongBreak ? '#8b5cf6' : '#06b6d4'; // Purple pour longue pause, Cyan pour courte pause
    }
    return '#10b981'; // Vert pour le travail
  };

  // Obtenir le statut actuel
  const getCurrentStatus = () => {
    if (isBreak) {
      return isLongBreak ? 'Longue pause' : 'Pause';
    }
    return 'Travail';
  };

  return (
    <View style={styles.container}>
      {/* Header avec titre de la tâche */}
      {taskTitle && (
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{taskTitle}</Text>
        </View>
      )}

      {/* Timer principal */}
      <View style={styles.timerCard}>
        <Text style={styles.statusLabel}>{getCurrentStatus()}</Text>
        <Text style={[styles.timeDisplay, { color: getTimerColor() }]}>
          {formatTime(timeLeft)}
        </Text>
        
        {/* Barre de progression */}
        <Progress
          value={getProgress()}
          style={styles.progressBar}
          progressColor={getTimerColor()}
          height={6}
        />

        {/* Compteur de sessions */}
        <View style={styles.sessionCounter}>
          <Text style={styles.sessionText}>
            Session {pomodoroCount + 1} / {sessionsCount}
          </Text>
          <View style={styles.dots}>
            {Array.from({ length: sessionsCount }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < pomodoroCount && styles.dotCompleted,
                  i === pomodoroCount && isRunning && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Contrôles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={resetTimer}
        >
          <Ionicons name="refresh" size={24} color="#6b7280" />
          <Text style={styles.controlButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.playButton,
            { backgroundColor: isRunning ? '#f59e0b' : getTimerColor() }
          ]}
          onPress={toggleTimer}
        >
          <Ionicons
            name={isRunning ? "pause" : "play"}
            size={32}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowSettings(true)}
        >
          <Ionicons name="settings" size={24} color="#6b7280" />
          <Text style={styles.controlButtonText}>Réglages</Text>
        </TouchableOpacity>
      </View>

      {/* Modal des paramètres */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.settingsModal}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Paramètres Pomodoro</Text>
            <TouchableOpacity
              onPress={() => {
                saveSettings();
                setShowSettings(false);
              }}
            >
              <Text style={styles.doneButton}>Terminé</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.settingsContent}>
            {/* Temps de travail */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Temps de travail (minutes)</Text>
              <TextInput
                style={styles.settingInput}
                value={(workTime / 60).toString()}
                onChangeText={(text) => {
                  const minutes = parseInt(text) || 25;
                  setWorkTime(minutes * 60);
                }}
                keyboardType="numeric"
                placeholder="25"
              />
            </View>

            {/* Pause courte */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Pause courte (minutes)</Text>
              <TextInput
                style={styles.settingInput}
                value={(shortBreakTime / 60).toString()}
                onChangeText={(text) => {
                  const minutes = parseInt(text) || 5;
                  setShortBreakTime(minutes * 60);
                }}
                keyboardType="numeric"
                placeholder="5"
              />
            </View>

            {/* Pause longue */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Pause longue (minutes)</Text>
              <TextInput
                style={styles.settingInput}
                value={(longBreakTime / 60).toString()}
                onChangeText={(text) => {
                  const minutes = parseInt(text) || 15;
                  setLongBreakTime(minutes * 60);
                }}
                keyboardType="numeric"
                placeholder="15"
              />
            </View>

            {/* Nombre de sessions */}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Nombre de sessions</Text>
              <TextInput
                style={styles.settingInput}
                value={sessionsCount.toString()}
                onChangeText={(text) => {
                  const count = parseInt(text) || 4;
                  setSessionsCount(Math.max(1, Math.min(10, count)));
                }}
                keyboardType="numeric"
                placeholder="4"
              />
            </View>

            {/* Son activé */}
            <View style={[styles.settingItem, styles.switchItem]}>
              <Text style={styles.settingLabel}>Notifications sonores</Text>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                thumbColor={soundEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  timerCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeDisplay: {
    fontSize: 64,
    fontWeight: '200',
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    marginBottom: 24,
  },
  sessionCounter: {
    alignItems: 'center',
  },
  sessionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  dotCompleted: {
    backgroundColor: '#10b981',
  },
  dotActive: {
    backgroundColor: '#f59e0b',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
  },
  controlButtonText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  settingsModal: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  doneButton: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  settingsContent: {
    flex: 1,
    padding: 16,
  },
  settingItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchItem: {
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  settingInput: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'right',
    minWidth: 60,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
});