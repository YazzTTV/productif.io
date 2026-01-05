import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
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
import Svg, { Circle } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { assistantService } from '@/lib/api';

const { width } = Dimensions.get('window');
const RING_SIZE = Math.min(width * 0.65, 260);
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function FocusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  
  const duration = parseInt(params.duration as string) || 25;
  const taskTitle = (params.title as string) || 'Deep Focus Session';
  const taskSubject = (params.subject as string) || '';
  
  const totalSeconds = duration * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
      } catch (error) {
        console.log('Session démarrée localement');
      }
    };
    startSession();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          setIsRunning(false);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Update progress animation
  useEffect(() => {
    progressAnimation.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.linear,
    });
  }, [progress]);

  const handleComplete = useCallback(async () => {
    if (sessionId) {
      try {
        await assistantService.endDeepWorkSession(sessionId, 'complete');
      } catch (error) {
        console.log('Session terminée localement');
      }
    }
    router.back();
  }, [sessionId, router]);

  const handleExit = useCallback(async () => {
    if (sessionId && timeLeft > 0) {
      try {
        await assistantService.endDeepWorkSession(sessionId, 'cancel');
      } catch (error) {
        console.log('Session annulée localement');
      }
    }
    router.back();
  }, [sessionId, timeLeft, router]);

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

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
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Background Circle */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress Circle */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="#16A34A"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation={-90}
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>

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
          {taskSubject ? <Text style={styles.taskSubject}>{taskSubject}</Text> : null}
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
  timerContainer: {
    position: 'absolute',
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

