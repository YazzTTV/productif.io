import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { onboardingService, authService } from '@/lib/api';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
];

export default function LanguageSelectionScreen() {
  const { locale, setLocale } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(locale);
  const [isLoading, setIsLoading] = useState(false);
  const isProcessingRef = useRef(false);

  const handleContinue = async () => {
    if (isLoading || isProcessingRef.current) return; // Empêcher les doubles clics
    
    isProcessingRef.current = true;
    setIsLoading(true);
    
    try {
      await setLocale(selectedLanguage as 'fr' | 'en');
      await AsyncStorage.setItem('onboarding_language', selectedLanguage);
      
      // Sauvegarder la langue dans l'API si l'utilisateur est authentifié
      try {
        const user = await authService.checkAuth();
        if (user?.id) {
          await onboardingService.saveOnboardingData({
            language: selectedLanguage,
            currentStep: 2, // Étape de sélection de langue
          });
          console.log('✅ Langue sauvegardée dans l\'API');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de la langue:', error);
        // Ne pas bloquer le flux
      }
      
      router.push('/(onboarding-new)/connection');
    } catch (error) {
      console.error('❌ Erreur lors de la navigation:', error);
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.delay(100).duration(600)} style={styles.header}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              style={styles.iconGradient}
            >
              <Ionicons name="globe" size={40} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Choose Your Language</Text>
          <Text style={styles.description}>Select your preferred language to continue</Text>
        </Animated.View>

        {/* Language List */}
        <View style={styles.languageList}>
          {languages.map((language, index) => {
            const isSelected = selectedLanguage === language.code;
            
            return (
              <Animated.View
                key={language.code}
                entering={FadeInDown.delay(200 + index * 50).duration(400)}
              >
                <TouchableOpacity
                  onPress={() => setSelectedLanguage(language.code)}
                  style={[
                    styles.languageButton,
                    isSelected && styles.languageButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageButtonContent}>
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <View style={styles.languageInfo}>
                      <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
                        {language.name}
                      </Text>
                      <Text style={styles.languageNative}>{language.nativeName}</Text>
                    </View>
                  </View>

                  {isSelected && (
                    <Animated.View entering={FadeIn.springify()}>
                      <View style={styles.checkIcon}>
                        <LinearGradient
                          colors={['#00C27A', '#00D68F']}
                          style={styles.checkIconGradient}
                        >
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        </LinearGradient>
                      </View>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Continue Button */}
        <Animated.View entering={FadeInDown.delay(800).duration(600)}>
          <Pressable
            onPress={handleContinue}
            disabled={!selectedLanguage || isLoading}
            style={({ pressed }) => [
              styles.continueButtonWrapper,
              (pressed || isLoading) && styles.continueButtonPressed,
            ]}
          >
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.continueButton, (!selectedLanguage || isLoading) && styles.continueButtonDisabled]}
            >
              <Text style={styles.continueButtonText}>
                {isLoading ? 'Loading...' : 'Continue'}
              </Text>
              {!isLoading && <Text style={styles.continueButtonArrow}>→</Text>}
            </LinearGradient>
          </Pressable>

          <Text style={styles.infoText}>You can change this later in Settings</Text>
        </Animated.View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  languageList: {
    marginBottom: 32,
    gap: 12,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  languageButtonSelected: {
    borderColor: '#00C27A',
    backgroundColor: 'rgba(0, 194, 122, 0.05)',
  },
  languageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  languageFlag: {
    fontSize: 32,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  languageNameSelected: {
    color: '#111827',
  },
  languageNative: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  checkIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonPressed: {
    opacity: 0.9,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueButtonArrow: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
});

