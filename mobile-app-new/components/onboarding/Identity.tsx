import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useLanguage } from '@/contexts/LanguageContext';

interface IdentityProps {
  firstName: string;
  studentType: string;
  onContinue: (firstName: string, studentType: string) => void;
}

type StudentTypeKey = 'highSchool' | 'university' | 'medLawPrepa' | 'engineeringBusiness' | 'other';

const studentTypes: { key: StudentTypeKey; value: string }[] = [
  { key: 'highSchool', value: 'highSchool' },
  { key: 'university', value: 'university' },
  { key: 'medLawPrepa', value: 'medLawPrepa' },
  { key: 'engineeringBusiness', value: 'engineeringBusiness' },
  { key: 'other', value: 'other' },
];

export function Identity({ firstName: initialFirstName, studentType: initialStudentType, onContinue }: IdentityProps) {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [studentType, setStudentType] = useState(initialStudentType);

  const isValid = firstName.trim().length > 0 && studentType.length > 0;

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.header}>
          <Text style={styles.title}>{t('tellAboutYourself')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.form}>
          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('firstName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('firstName')}
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Student Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('studentType')}</Text>
            <View style={styles.optionsContainer}>
              {studentTypes.map((type, index) => (
                <Animated.View
                  key={type.value}
                  entering={FadeInDown.delay(300 + index * 50).duration(300)}
                >
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      studentType === type.value && styles.optionButtonSelected
                    ]}
                    onPress={() => setStudentType(type.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      studentType === type.value && styles.optionTextSelected
                    ]}>
                      {t(type.key)}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>

          <Text style={styles.helperText}>{t('helpsAdapt')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={() => isValid && onContinue(firstName.trim(), studentType)}
            activeOpacity={0.8}
            disabled={!isValid}
          >
            <Text style={styles.buttonText}>{t('next')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -1,
    color: '#000000',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 8,
  },
  input: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#000000',
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
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
  },
  optionTextSelected: {
    color: '#16A34A',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
    marginTop: 24,
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    backgroundColor: '#16A34A',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

