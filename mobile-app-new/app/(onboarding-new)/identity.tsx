import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingData } from '@/hooks/useOnboardingData';

const studentTypes = [
  { value: 'highschool', labelKey: 'highSchool' },
  { value: 'university', labelKey: 'university' },
  { value: 'medlawprepa', labelKey: 'medLawPrepa' },
  { value: 'engineering', labelKey: 'engineeringBusiness' },
  { value: 'other', labelKey: 'other' },
];

export default function IdentityScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { saveResponse, getResponse } = useOnboardingData();
  const [firstName, setFirstName] = useState('');
  const [studentType, setStudentType] = useState('');

  // Charger les données sauvegardées
  useEffect(() => {
    const savedFirstName = getResponse('firstName');
    const savedStudentType = getResponse('studentType');
    if (savedFirstName) setFirstName(savedFirstName as string);
    if (savedStudentType) setStudentType(savedStudentType as string);
  }, []);

  // Sauvegarder automatiquement quand les valeurs changent
  useEffect(() => {
    if (firstName) {
      saveResponse('firstName', firstName);
      AsyncStorage.setItem('onboarding_firstName', firstName);
    }
  }, [firstName]);

  useEffect(() => {
    if (studentType) {
      saveResponse('studentType', studentType);
    }
  }, [studentType]);

  const handleContinue = async () => {
    if (firstName && studentType) {
      // Sauvegarder les réponses finales
      await saveResponse('firstName', firstName);
      await saveResponse('studentType', studentType);
      await saveResponse('currentStep', 3);
      router.push('/(onboarding-new)/goals-pressure');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Title */}
          <Animated.View entering={FadeIn.delay(100).duration(400)}>
            <Text style={styles.title}>
              {t('tellAboutYourself') || 'Tell us about yourself.'}
            </Text>
          </Animated.View>

          {/* First name */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <Text style={styles.label}>
              {t('firstName') || 'First name'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Alex"
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </Animated.View>

          {/* Student type */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
            <Text style={styles.label}>
              {t('studentType') || 'Student type'}
            </Text>
            <View style={styles.optionsContainer}>
              {studentTypes.map((type, index) => (
                <Animated.View
                  key={type.value}
                  entering={FadeInDown.delay(400 + index * 50).duration(400)}
                >
                  <TouchableOpacity
                    onPress={() => setStudentType(type.value)}
                    style={[
                      styles.optionButton,
                      studentType === type.value && styles.optionButtonSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      studentType === type.value && styles.optionTextSelected,
                    ]}>
                      {t(type.labelKey)}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Help text */}
          <Animated.View entering={FadeInDown.delay(700).duration(400)}>
            <Text style={styles.helpText}>
              {t('helpsAdapt') || 'This helps us adapt the system to you.'}
            </Text>
          </Animated.View>

          {/* Continue button */}
          <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={!firstName || !studentType}
              style={[
                styles.continueButton,
                (!firstName || !studentType) && styles.continueButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {t('next') || 'Next'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.03 * 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 8,
    paddingLeft: 4,
  },
  input: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.01 * 18,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  helpText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
    paddingLeft: 4,
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  continueButton: {
    backgroundColor: '#16A34A',
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

