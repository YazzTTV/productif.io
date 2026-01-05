import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { connectGoogleCalendar, connectAppleCalendar } from '@/lib/calendarAuth';

interface CalendarSyncProps {
  onConnect: () => void;
  onSkip: () => void;
}

export function CalendarSync({ onConnect, onSkip }: CalendarSyncProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState<'google' | 'apple' | null>(null);

  const handleGoogleCalendar = async () => {
    setIsLoading('google');
    try {
      const success = await connectGoogleCalendar();
      if (success) {
        onConnect();
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('somethingWentWrong'));
    } finally {
      setIsLoading(null);
    }
  };

  const handleAppleCalendar = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(t('error'), 'Apple Calendar est disponible uniquement sur iOS');
      return;
    }

    setIsLoading('apple');
    try {
      const success = await connectAppleCalendar();
      if (success) {
        onConnect();
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('somethingWentWrong'));
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.content}>
        <View style={styles.header}>
          <Animated.View 
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.iconContainer}
          >
            <Ionicons name="calendar" size={40} color="#16A34A" />
          </Animated.View>

          <Text style={styles.title}>{t('syncYourDay')}</Text>
          <Text style={styles.subtitle}>{t('createEvents')}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {/* Google Calendar */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={handleGoogleCalendar}
              activeOpacity={0.7}
              disabled={isLoading !== null}
            >
              <View style={styles.calendarIcon}>
                <Ionicons name="logo-google" size={28} color="#4285F4" />
              </View>
              <View style={styles.calendarInfo}>
                <Text style={styles.calendarName}>{t('googleCalendar')}</Text>
              </View>
              {isLoading === 'google' && (
                <ActivityIndicator size="small" color="#16A34A" />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Apple Calendar (iOS only) */}
          {Platform.OS === 'ios' && (
            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={handleAppleCalendar}
                activeOpacity={0.7}
                disabled={isLoading !== null}
              >
                <View style={styles.calendarIcon}>
                  <Ionicons name="logo-apple" size={28} color="#000000" />
                </View>
                <View style={styles.calendarInfo}>
                  <Text style={styles.calendarName}>{t('appleCalendar')}</Text>
                </View>
                {isLoading === 'apple' && (
                  <ActivityIndicator size="small" color="#16A34A" />
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>{t('skip')}</Text>
          </TouchableOpacity>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -1,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  calendarIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarInfo: {
    flex: 1,
  },
  calendarName: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.5,
    color: '#000000',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.6)',
  },
});

