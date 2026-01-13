import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  FadeIn,
  FadeInDown
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { assistantService } from '@/lib/api';

const { width } = Dimensions.get('window');
const RING_SIZE = Math.min(width * 0.65, 260);
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface FocusModeProps {
  duration?: number; // in minutes
  taskTitle?: string;
  taskSubject?: string;
  onComplete?: (timeSpent: number) => void;
}

export function FocusMode({ 
  duration = 25, 
  taskTitle = 'Deep Focus Session', 
  taskSubject = '',
  onComplete 
}: FocusModeProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  
  const totalSeconds = duration * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const progress = (totalSeconds - timeLeft) / totalSeconds;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const progressAnimation = useSharedValue(0);

  // Démarrer la session Deep Work
  useEffect(() => {
    const startSession = async () => {
      try {
        const result = await assistantService.startDeepWorkSession(duration, 'deepwork', taskTitle);
        if (result?.session?.id) {
          setSessionId(result.session.id);
        }
      } catch (error: any) {
        const errorMessage = error?.message || '';
        const errorLower = errorMessage.toLowerCase();
        
        // Détecter les erreurs de limite Premium
        const isPlanLocked = 
          errorLower.includes('limite') || 
          errorLower.includes('premium') || 
          errorLower.includes('plan') ||
          errorLower.includes('durée max') ||
          errorLower.includes('freemium') ||
          error?.status === 403 ||
          error?.locked === true;
        
        if (isPlanLocked) {
          Alert.alert(
            'Focus limité',
            errorMessage || '1 session Focus par jour en freemium. Passez en Premium pour continuer.',
            [
              { text: 'Plus tard', style: 'cancel' },
              { text: 'Passer en Premium', onPress: () => router.push('/paywall') }
            ]
          );
          setIsRunning(false);
        } else {
          // Autres erreurs : afficher un message générique
          Alert.alert(
            'Erreur',
            errorMessage || 'Impossible de démarrer la session Focus',
            [{ text: 'OK' }]
          );
          setIsRunning(false);
        }
      }
    };
    startSession();
  }, []);

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          setIsRunning(false);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Update progress animation
  useEffect(() => {
    progressAnimation.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.linear,
    });
  }, [progress]);

  const handleComplete = useCallback(async () => {
    const timeSpent = totalSeconds - timeLeft;
    
    // Terminer la session sur le serveur
    if (sessionId) {
      try {
        await assistantService.endDeepWorkSession(sessionId, 'complete');
      } catch (error) {
        console.log('Session terminée localement');
      }
    }

    onComplete?.(timeSpent);
  }, [sessionId, timeLeft, totalSeconds, onComplete]);

  const handleExit = useCallback(async () => {
    // Annuler la session si on quitte tôt
    if (sessionId && timeLeft > 0) {
      try {
        await assistantService.endDeepWorkSession(sessionId, 'cancel');
      } catch (error) {
        console.log('Session annulée localement');
      }
    }
    router.back();
  }, [sessionId, timeLeft, router]);

  const animatedCircleStyle = useAnimatedStyle(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progressAnimation.value),
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Exit Button */}
      <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.exitButton}>
        <TouchableOpacity
          style={styles.exitButtonInner}
          onPress={handleExit}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.content}>
        {/* Progress Ring */}
        <Animated.View entering={FadeIn.delay(100).duration(600)} style={styles.ringContainer}>
          <svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
            {/* Background Circle */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress Circle */}
            <Animated.circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="#16A34A"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeLinecap="round"
              style={[animatedCircleStyle]}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </svg>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </Text>
          </View>
        </Animated.View>

        {/* Task Info */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{taskTitle}</Text>
          {taskSubject && <Text style={styles.taskSubject}>{taskSubject}</Text>}
        </Animated.View>

        {/* Controls */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setIsRunning(!isRunning)}
          >
            <Text style={styles.controlButtonText}>
              {isRunning ? t('pause') : t('resume')}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Subtle instruction */}
        <Animated.View entering={FadeIn.delay(700).duration(400)}>
          <Text style={styles.instruction}>{t('everythingElseDisappeared')}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

// Simple SVG components for React Native (using react-native-svg)
const svg = ({ width, height, style, children }: any) => (
  <View style={[{ width, height }, style]}>{children}</View>
);

const circle = ({ cx, cy, r, stroke, strokeWidth, fill }: any) => (
  <View
    style={{
      position: 'absolute',
      width: r * 2,
      height: r * 2,
      left: cx - r,
      top: cy - r,
      borderRadius: r,
      borderWidth: strokeWidth,
      borderColor: stroke,
      backgroundColor: fill || 'transparent',
    }}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  exitButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
  },
  exitButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  ring: {
    position: 'absolute',
  },
  timerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '300',
    letterSpacing: -2,
    color: '#FFFFFF',
  },
  taskInfo: {
    alignItems: 'center',
    marginBottom: 48,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  taskSubject: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  controlButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    marginBottom: 48,
  },
  controlButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  instruction: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
});
