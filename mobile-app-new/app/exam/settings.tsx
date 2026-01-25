import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExamSettings } from '@/hooks/useExamSettings';

const EXAM_DURATION_PRESETS = [25, 45, 60, 90, 120];
const MAX_TASKS_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10];

export default function ExamSettingsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, loading, saveSettings } = useExamSettings();

  const [examDuration, setExamDuration] = useState(settings.examDuration);
  const [maxTasks, setMaxTasks] = useState(settings.maxTasks);
  const [hardMode, setHardMode] = useState(settings.hardMode);
  const [breaksEnabled, setBreaksEnabled] = useState(settings.breaksEnabled);

  useEffect(() => {
    if (!loading) {
      setExamDuration(settings.examDuration);
      setMaxTasks(settings.maxTasks);
      setHardMode(settings.hardMode);
      setBreaksEnabled(settings.breaksEnabled);
    }
  }, [settings, loading]);

  const handleSaveSettings = async () => {
    const success = await saveSettings({
      examDuration,
      maxTasks,
      hardMode,
      breaksEnabled,
    });

    if (success) {
      router.back();
    }
  };

  const resetToDefaults = () => {
    setExamDuration(45); // Default exam duration
    setMaxTasks(3); // Default max tasks
    setHardMode(true); // Default hard mode
    setBreaksEnabled(false); // Default breaks enabled
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('examSettings') || 'Exam Settings'}</Text>
            <Text style={styles.headerSubtitle}>{t('customizeYourExamExperience') || 'Customize your exam experience'}</Text>
          </View>

          <View style={styles.backButton} />
        </Animated.View>

        {/* Exam Duration */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('examDuration') || 'Exam duration'}</Text>
          <Text style={styles.sectionSubtitle}>{t('totalTimeForExamSession') || 'Total time for your exam session'}</Text>
          <View style={styles.buttonRow}>
            {EXAM_DURATION_PRESETS.map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationButton,
                  examDuration === duration && styles.durationButtonActive
                ]}
                onPress={() => setExamDuration(duration)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    examDuration === duration && styles.durationButtonTextActive
                  ]}
                >
                  {duration}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Maximum Tasks */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('maximumTasks') || 'Maximum tasks'}</Text>
          <Text style={styles.sectionSubtitle}>{t('tasksToCompletePerSession') || 'Tasks to complete per session'}</Text>
          <View style={styles.buttonRow}>
            {MAX_TASKS_OPTIONS.slice(0, 4).map((tasks) => (
              <TouchableOpacity
                key={tasks}
                style={[
                  styles.tasksButton,
                  maxTasks === tasks && styles.tasksButtonActive
                ]}
                onPress={() => setMaxTasks(tasks)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tasksButtonText,
                    maxTasks === tasks && styles.tasksButtonTextActive
                  ]}
                >
                  {tasks}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.buttonRow}>
            {MAX_TASKS_OPTIONS.slice(4).map((tasks) => (
              <TouchableOpacity
                key={tasks}
                style={[
                  styles.tasksButton,
                  maxTasks === tasks && styles.tasksButtonActive
                ]}
                onPress={() => setMaxTasks(tasks)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tasksButtonText,
                    maxTasks === tasks && styles.tasksButtonTextActive
                  ]}
                >
                  {tasks}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Mode Options */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('examMode') || 'Exam Mode'}</Text>

          {/* Hard Mode */}
          <View style={styles.optionItem}>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{t('hardMode')}</Text>
              <Text style={styles.optionDescription}>{t('hardModeDescription')}</Text>
            </View>
            <Switch
              value={hardMode}
              onValueChange={setHardMode}
              trackColor={{ false: 'rgba(0, 0, 0, 0.1)', true: '#16A34A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Breaks */}
          <View style={styles.optionItem}>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{t('breaks')}</Text>
              <Text style={styles.optionDescription}>{t('breaksDescription')}</Text>
            </View>
            <Switch
              value={breaksEnabled}
              onValueChange={setBreaksEnabled}
              trackColor={{ false: 'rgba(0, 0, 0, 0.1)', true: '#16A34A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Animated.View>

        {/* Session Preview */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.previewCard}>
          <Text style={styles.previewLabel}>{t('sessionPreview') || 'Session preview'}</Text>
          <Text style={styles.previewText}>
            {examDuration}{t('min')} {t('examMode')} • {t('max')} {maxTasks} {t('tasks')}
          </Text>
          <Text style={styles.previewSubtext}>
            {hardMode ? t('hardMode') : t('normalMode')} • {breaksEnabled ? t('breaksEnabled') : t('breaksDisabled')}
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.actionSection}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSettings}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>{t('saveSettings') || t('save')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetToDefaults}
            activeOpacity={0.7}
          >
            <Text style={styles.resetButtonText}>{t('resetToDefaults') || 'Reset to defaults'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    gap: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.5,
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: '#16A34A',
  },
  durationButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  durationButtonTextActive: {
    color: '#FFFFFF',
  },
  tasksButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  tasksButtonActive: {
    backgroundColor: '#16A34A',
  },
  tasksButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  tasksButtonTextActive: {
    color: '#FFFFFF',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    marginBottom: 8,
  },
  optionContent: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  previewCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    marginBottom: 32,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  previewText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 8,
  },
  previewSubtext: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  actionSection: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  resetButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  resetButtonText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
  },
});