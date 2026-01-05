import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { onboardingService, authService } from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingData } from '@/hooks/useOnboardingData';

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export default function LanguageSelectionScreen() {
  const { language, setLanguage, t } = useLanguage();
  const { saveResponse } = useOnboardingData();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(language);
  const [isLoading, setIsLoading] = useState(false);
  const isProcessingRef = useRef(false);
  const insets = useSafeAreaInsets();

  const handleSelectLanguage = async (langCode: string) => {
    if (isLoading || isProcessingRef.current) return;
    
    setSelectedLanguage(langCode);
    isProcessingRef.current = true;
    setIsLoading(true);
    
    try {
      await setLanguage(langCode as 'fr' | 'en' | 'es');
      await AsyncStorage.setItem('onboarding_language', langCode);
      
      // Sauvegarder la langue avec le hook (qui gère aussi le backend)
      await saveResponse('language', langCode);
      await saveResponse('currentStep', 2);
      
      router.push('/(onboarding-new)/connection');
    } catch (error) {
      console.error('❌ Erreur lors de la navigation:', error);
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
        {/* Header */}
          <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.header}>
            <Text style={styles.title}>
              {t('chooseLanguage') || 'Choose your language'}
            </Text>
            <Text style={styles.subtitle}>
              {t('changeAnytime') || 'You can change this anytime.'}
            </Text>
        </Animated.View>

        {/* Language List */}
        <View style={styles.languageList}>
            {languages.map((lang, index) => {
              const isSelected = selectedLanguage === lang.code;
            
            return (
              <Animated.View
                  key={lang.code}
                  entering={FadeInDown.delay(200 + index * 100).duration(400)}
              >
                <TouchableOpacity
                    onPress={() => handleSelectLanguage(lang.code)}
                  style={[
                    styles.languageButton,
                    isSelected && styles.languageButtonSelected,
                  ]}
                  activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text style={styles.languageLabel}>{lang.label}</Text>
                  {isSelected && (
                      <View style={styles.checkIcon}>
                        <Ionicons name="checkmark" size={20} color="#16A34A" />
                      </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        </View>
      </ScrollView>
    </View>
  );
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
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.03 * 24,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
  },
  languageList: {
    gap: 12,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  languageButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  languageFlag: {
    fontSize: 40,
  },
  languageLabel: {
    flex: 1,
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
    letterSpacing: -0.02 * 20,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
