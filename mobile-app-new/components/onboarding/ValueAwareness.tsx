import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { useLanguage } from '@/contexts/LanguageContext';

interface ValueAwarenessProps {
  onContinue: () => void;
}

export function ValueAwareness({ onContinue }: ValueAwarenessProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  
  const lines = [
    { key: 'notTheProblem', highlight: true },
    { key: 'workALot', highlight: false },
    { key: 'stayDisciplined', highlight: false },
    { key: 'feelsScattered', highlight: false },
    { key: 'lackOfSystem', highlight: true },
  ];

  useEffect(() => {
    if (step < lines.length) {
      const timer = setTimeout(() => {
        setStep(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const buttonOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (step >= lines.length) {
      buttonOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    }
  }, [step]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          {lines.map((line, index) => (
            <Animated.View
              key={line.key}
              entering={index < step ? FadeInUp.delay(index * 100).duration(400) : undefined}
              style={[
                styles.lineContainer,
                { opacity: index < step ? 1 : 0 }
              ]}
            >
              <Text style={[
                styles.lineText,
                line.highlight && styles.highlightText
              ]}>
                {t(line.key as any)}
              </Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <TouchableOpacity
            style={styles.button}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{t('continue')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    flex: 1,
    justifyContent: 'center',
  },
  textContainer: {
    gap: 16,
    marginBottom: 64,
  },
  lineContainer: {
    paddingHorizontal: 8,
  },
  lineText: {
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: -0.5,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    lineHeight: 32,
  },
  highlightText: {
    fontWeight: '600',
    color: '#000000',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
  },
  button: {
    backgroundColor: '#16A34A',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

