import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Step {
  key: string;
  textKey: string;
  duration: number;
}

const steps: Step[] = [
  { key: 'priorities', textKey: 'understandingPriorities', duration: 2000 },
  { key: 'effort', textKey: 'estimatingEffort', duration: 2500 },
  { key: 'plan', textKey: 'creatingPlan', duration: 2000 },
];

export default function BuildingPlanScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const isMountedRef = useRef(true);
  const isNavigatingRef = useRef(false);

  const spinnerRotation = useSharedValue(0);

  useEffect(() => {
    isMountedRef.current = true;
    isNavigatingRef.current = false;
    
    // Spinner animation
    spinnerRotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
    
    return () => {
      isMountedRef.current = false;
      cancelAnimation(spinnerRotation);
    };
  }, []);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        if (!isMountedRef.current) return;
        setCompletedSteps(prev => [...prev, currentStep]);
        setCurrentStep(prev => prev + 1);
      }, steps[currentStep].duration);
      return () => clearTimeout(timer);
    } else {
      // All steps complete - navigate
      const timer = setTimeout(() => {
        if (isMountedRef.current && !isNavigatingRef.current) {
          isNavigatingRef.current = true;
          router.push('/(onboarding-new)/symptoms');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  // Calculate circular progress
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progress = completedSteps.length / steps.length;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Title */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.title}>
            {t('designingDay') || 'Designing your ideal day…'}
          </Text>
        </Animated.View>

        {/* Circular Progress */}
        <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.circularProgress}>
          <Svg width="160" height="160" style={styles.progressSvg}>
            {/* Background Circle */}
            <Circle
              cx="80"
              cy="80"
              r={radius}
              stroke="rgba(0, 0, 0, 0.05)"
              strokeWidth="8"
              fill="none"
            />
            
            {/* Progress Circle */}
            <AnimatedCircle
              cx="80"
              cy="80"
              r={radius}
              stroke="#16A34A"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </Svg>

          {/* Center content */}
          <View style={styles.progressCenter}>
            <Text style={styles.progressText}>
              {completedSteps.length}/{steps.length}
            </Text>
          </View>
        </Animated.View>

        {/* Steps list */}
        <View style={styles.stepsList}>
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = currentStep === index;

            return (
              <Animated.View
                key={step.key}
                entering={FadeInDown.delay(300 + index * 100).duration(400)}
                style={[
                  styles.stepItem,
                  isCurrent && styles.stepItemCurrent,
                  isCompleted && styles.stepItemCompleted,
                ]}
              >
                <View style={[
                  styles.stepIcon,
                  isCompleted && styles.stepIconCompleted,
                  isCurrent && styles.stepIconCurrent,
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  ) : (
                    <View style={[
                      styles.stepDot,
                      isCurrent && styles.stepDotCurrent,
                    ]} />
                  )}
                </View>

                <Text style={[
                  styles.stepText,
                  isCompleted && styles.stepTextCompleted,
                  isCurrent && styles.stepTextCurrent,
                ]}>
                  {t(step.textKey) || step.textKey}
                </Text>

                {isCurrent && (
                  <Animated.View style={[styles.spinner, spinnerStyle]}>
                    <View style={styles.spinnerCircle} />
                  </Animated.View>
                )}
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.03 * 24,
  },
  circularProgress: {
    marginBottom: 48,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSvg: {
    transform: [{ rotate: '-90deg' }],
  },
  progressCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.03 * 24,
  },
  stepsList: {
    width: '100%',
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    gap: 16,
  },
  stepItemCurrent: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  stepItemCompleted: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconCurrent: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
  },
  stepIconCompleted: {
    backgroundColor: '#16A34A',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  stepDotCurrent: {
    backgroundColor: '#16A34A',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  stepTextCurrent: {
    color: '#000000',
    fontWeight: '500',
  },
  stepTextCompleted: {
    color: '#16A34A',
  },
  spinner: {
    width: 20,
    height: 20,
  },
  spinnerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.3)',
    borderTopColor: '#16A34A',
  },
});
