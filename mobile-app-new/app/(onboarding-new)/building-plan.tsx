import React, { useEffect, useState } from 'react';
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
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function BuildingPlanScreen() {
  const { t } = useLanguage();
  
  const loadingSteps = [
    t('analyzingAnswers'),
    t('identifyingPatterns'),
    t('buildingProfile'),
    t('personalizingInsights'),
    t('almostReady'),
  ];
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Animation de rotation continue
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1,
      false
    );

    // Animation de scale
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    // Progression smooth
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 60); // 6 secondes pour atteindre 100%

    // Update loading text
    const stepInterval = setInterval(() => {
      setProgress((current) => {
        if (current >= 20 && current < 40) setCurrentStepIndex(1);
        else if (current >= 40 && current < 60) setCurrentStepIndex(2);
        else if (current >= 60 && current < 80) setCurrentStepIndex(3);
        else if (current >= 80) setCurrentStepIndex(4);
        return current;
      });
    }, 100);

    // Navigate après completion
    const completeTimer = setTimeout(() => {
      router.push('/(onboarding-new)/symptoms');
    }, 6500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearTimeout(completeTimer);
    };
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  // Calculate circular progress
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.container}>
      {/* Particules animées */}
      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, i) => (
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

      <View style={styles.content}>
        {/* Circular Progress */}
        <View style={styles.circularProgress}>
          <Svg width="280" height="280" style={styles.progressSvg}>
            {/* Background Circle */}
            <Circle
              cx="140"
              cy="140"
              r={radius}
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
            />
            
            {/* Progress Circle */}
            <AnimatedCircle
              cx="140"
              cy="140"
              r={radius}
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
            
            <Defs>
              <SvgLinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#00C27A" />
                <Stop offset="100%" stopColor="#00D68F" />
              </SvgLinearGradient>
            </Defs>
          </Svg>

          {/* Percentage in Center */}
          <View style={styles.progressCenter}>
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </Animated.View>
            {progress === 100 && (
              <Animated.View entering={FadeIn.springify()}>
                <Text style={styles.checkmark}>✓</Text>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Loading Status Text */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.statusContainer}>
          <Text style={styles.statusText}>{loadingSteps[currentStepIndex]}</Text>
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
    backgroundColor: 'rgba(0, 194, 122, 0.2)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  circularProgress: {
    marginBottom: 48,
    position: 'relative',
  },
  progressSvg: {
    transform: [{ rotate: '-90deg' }],
  },
  progressCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 56,
    fontWeight: '800',
    color: '#374151',
  },
  checkmark: {
    fontSize: 48,
    marginTop: 8,
  },
  statusContainer: {
    marginBottom: 32,
  },
  statusText: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00C27A',
  },
});

