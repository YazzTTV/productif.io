import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PlanPhase = 'entry' | 'recording' | 'transcription' | 'processing' | 'overview';

export function PlanMyDay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<PlanPhase>('entry');
  const [transcription, setTranscription] = useState('');
  const [processingStep, setProcessingStep] = useState(0);

  if (phase === 'entry') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.entryContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="sparkles" size={40} color="#16A34A" />
            </View>

            <Text style={styles.entryTitle}>Plan your day in 60 seconds</Text>
            <Text style={styles.entrySubtitle}>Speak. We'll structure it.</Text>

            <View style={styles.ctaContainer}>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={() => setPhase('transcription')}
                activeOpacity={0.8}
              >
                <Ionicons name="mic" size={20} color="#FFFFFF" />
                <Text style={styles.recordButtonText}>Record voice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.typeButton}
                onPress={() => setPhase('transcription')}
                activeOpacity={0.7}
              >
                <Text style={styles.typeButtonText}>Type instead</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'transcription') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.transcriptionContent}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
            </View>
            <Text style={styles.transcriptionTitle}>We got it.</Text>

            <View style={styles.transcriptionCard}>
              <TextInput
                style={styles.transcriptionInput}
                value={transcription}
                onChangeText={setTranscription}
                placeholder="Your transcription appears here..."
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                multiline
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.editHint}>You can edit if needed</Text>

            <TouchableOpacity
              style={styles.generateButton}
              onPress={() => setPhase('processing')}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate my ideal day</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recordAgainButton}
              onPress={() => setPhase('entry')}
              activeOpacity={0.7}
            >
              <Text style={styles.recordAgainText}>Record again</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'processing') {
    const steps = [
      'Extracting tasks',
      'Prioritizing by impact + time + energy',
      'Scheduling realistic blocks',
    ];

    // Simulate processing
    React.useEffect(() => {
      const timers = steps.map((_, index) =>
        setTimeout(() => {
          setProcessingStep(index + 1);
          if (index === steps.length - 1) {
            setTimeout(() => setPhase('overview'), 500);
          }
        }, (index + 1) * 800)
      );

      return () => timers.forEach(timer => clearTimeout(timer));
    }, []);

    return (
      <View style={[styles.container, styles.processingContainer, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.processingContent}>
          <View style={styles.processingIcon}>
            <Ionicons name="sparkles" size={40} color="#16A34A" />
          </View>

          <Text style={styles.processingTitle}>Building your ideal day…</Text>

          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View
                key={index}
                style={[
                  styles.stepItem,
                  processingStep > index && styles.stepItemCompleted,
                ]}
              >
                <View
                  style={[
                    styles.stepIcon,
                    processingStep > index && styles.stepIconCompleted,
                  ]}
                >
                  {processingStep > index && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    processingStep > index && styles.stepTextCompleted,
                  ]}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    );
  }

  if (phase === 'overview') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#000" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Your Ideal Day</Text>
              <Text style={styles.headerSubtitle}>Tomorrow, March 11</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>Your schedule</Text>
            <View style={styles.blocksList}>
              {[
                { time: '09:00 - 11:00', title: 'Organic Chemistry Class', type: 'class' },
                { time: '11:15 - 12:45', title: 'Deep Work: Chapter 12 Summary', type: 'deepwork' },
                { time: '12:45 - 13:30', title: 'Lunch Break', type: 'meal' },
                { time: '14:00 - 16:00', title: 'Physics Lecture', type: 'class' },
              ].map((block, index) => (
                <View key={index} style={styles.blockCard}>
                  <View style={styles.blockTime}>
                    <Text style={styles.blockTimeText}>{block.time}</Text>
                  </View>
                  <View style={styles.blockContent}>
                    <Text style={styles.blockTitle}>{block.title}</Text>
                    <Text style={styles.blockType}>{block.type}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.reassuranceCard}>
            <Text style={styles.reassuranceText}>
              This covers what matters. Nothing more, nothing less.
            </Text>
          </Animated.View>

          {/* Bottom spacing */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Fixed Bottom CTA */}
        <View style={styles.bottomCTA}>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
            <Text style={styles.syncButtonText}>Sync to Google Calendar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
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
    paddingTop: 16,
  },
  entryContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 600,
    gap: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryTitle: {
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -1.5,
    color: '#000000',
    textAlign: 'center',
  },
  entrySubtitle: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  ctaContainer: {
    width: '100%',
    gap: 16,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  typeButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  typeButtonText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'rgba(0, 0, 0, 0.4)',
    fontSize: 16,
  },
  transcriptionContent: {
    flex: 1,
    gap: 24,
  },
  checkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  transcriptionTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
    textAlign: 'center',
  },
  transcriptionCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    minHeight: 200,
  },
  transcriptionInput: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.8)',
    minHeight: 200,
  },
  editHint: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  recordAgainButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  recordAgainText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
  },
  processingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    width: '100%',
    maxWidth: 400,
    gap: 48,
    alignItems: 'center',
  },
  processingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
    textAlign: 'center',
  },
  stepsContainer: {
    width: '100%',
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  stepItemCompleted: {
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconCompleted: {
    backgroundColor: '#16A34A',
  },
  stepText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  stepTextCompleted: {
    color: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 32,
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  blocksList: {
    gap: 12,
  },
  blockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  blockTime: {
    width: 80,
    alignItems: 'flex-end',
  },
  blockTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  blockContent: {
    flex: 1,
    gap: 4,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.3,
    color: '#000000',
  },
  blockType: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
    textTransform: 'capitalize',
  },
  reassuranceCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  reassuranceText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

