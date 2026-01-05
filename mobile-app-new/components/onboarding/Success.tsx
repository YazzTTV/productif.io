import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withDelay,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';

interface SuccessProps {
  firstName: string;
  onStartFocus: () => void;
}

export function Success({ firstName, onStartFocus }: SuccessProps) {
  const { t } = useLanguage();
  
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    checkOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));
    checkScale.value = withDelay(300, withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 15 })
    ));
  }, []);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.delay(100).duration(500)} style={styles.content}>
        {/* Success Icon */}
        <Animated.View style={[styles.iconContainer, checkAnimatedStyle]}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Text */}
        <Animated.View 
          entering={FadeInDown.delay(500).duration(500)}
          style={styles.textContainer}
        >
          <Text style={styles.title}>{t('dayIsReady')}</Text>
          <Text style={styles.subtitle}>{t('focusWithoutThinking')}</Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View 
          entering={FadeInDown.delay(700).duration(500)}
          style={styles.ctaContainer}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onStartFocus}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{t('startFocus')}</Text>
          </TouchableOpacity>

          <Text style={styles.planNote}>{t('freePlanActivated')}</Text>
        </Animated.View>
      </Animated.View>
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
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 48,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#16A34A',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  planNote: {
    marginTop: 24,
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
});

