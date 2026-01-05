import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Using a custom slider component

type JournalStep = 'entry' | 'emotional' | 'energy' | 'offload' | 'complete';

export function DailyJournal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<JournalStep>('entry');
  const [emotionalLevel, setEmotionalLevel] = useState(50);
  const [energyLevel, setEnergyLevel] = useState(50);
  const [note, setNote] = useState('');

  const getEmotionalLabel = (value: number) => {
    if (value < 25) return 'Calm';
    if (value < 50) return 'Steady';
    if (value < 75) return 'Tense';
    return 'Heavy';
  };

  const getEnergyLabel = (value: number) => {
    if (value < 25) return 'Low';
    if (value < 50) return 'Moderate';
    if (value < 75) return 'Good';
    return 'High';
  };

  if (step === 'entry') {
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
              <Text style={styles.headerTitle}>Daily journal</Text>
              <Text style={styles.headerSubtitle}>A moment to unload your thoughts.</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <TouchableOpacity
              style={styles.beginButton}
              onPress={() => setStep('emotional')}
              activeOpacity={0.8}
            >
              <Text style={styles.beginButtonText}>Begin today's entry</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  if (step === 'emotional') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('entry')}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>

          <View style={styles.progressDots}>
            <View style={styles.progressDotActive} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>
        </View>

        <View style={styles.sliderContainer}>
          <Text style={styles.sliderTitle}>How did today feel overall?</Text>
          <Text style={styles.sliderValue}>{getEmotionalLabel(emotionalLevel)}</Text>
          <Text style={styles.sliderHint}>No right or wrong answer</Text>

          <View style={styles.sliderWrapper}>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  { width: `${emotionalLevel}%` },
                ]}
              />
            </View>
            <View style={styles.sliderButtons}>
              {[0, 25, 50, 75, 100].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.sliderButton,
                    emotionalLevel === value && styles.sliderButtonActive,
                  ]}
                  onPress={() => setEmotionalLevel(value)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.sliderButtonDot,
                      emotionalLevel === value && styles.sliderButtonDotActive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Calm</Text>
            <Text style={styles.sliderLabel}>Heavy</Text>
          </View>
        </View>

        <View style={styles.bottomCTA}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => setStep('energy')}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'energy') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('emotional')}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>

          <View style={styles.progressDots}>
            <View style={styles.progressDotActive} />
            <View style={styles.progressDotActive} />
            <View style={styles.progressDot} />
          </View>
        </View>

        <View style={styles.sliderContainer}>
          <Text style={styles.sliderTitle}>How was your energy today?</Text>
          <Text style={styles.sliderValue}>{getEnergyLabel(energyLevel)}</Text>
          <Text style={styles.sliderHint}>Just observe</Text>

          <View style={styles.sliderWrapper}>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  { width: `${energyLevel}%` },
                ]}
              />
            </View>
            <View style={styles.sliderButtons}>
              {[0, 25, 50, 75, 100].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.sliderButton,
                    energyLevel === value && styles.sliderButtonActive,
                  ]}
                  onPress={() => setEnergyLevel(value)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.sliderButtonDot,
                      energyLevel === value && styles.sliderButtonDotActive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Low</Text>
            <Text style={styles.sliderLabel}>High</Text>
          </View>
        </View>

        <View style={styles.bottomCTA}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => setStep('offload')}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'offload') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('energy')}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>

          <View style={styles.progressDots}>
            <View style={styles.progressDotActive} />
            <View style={styles.progressDotActive} />
            <View style={styles.progressDotActive} />
          </View>
        </View>

        <View style={styles.offloadContainer}>
          <Text style={styles.offloadTitle}>Anything on your mind?</Text>
          <Text style={styles.offloadSubtitle}>Completely optional</Text>

          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              value={note}
              onChangeText={setNote}
              placeholder="Write freely. No one will analyze this."
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.micButton} activeOpacity={0.7}>
              <Ionicons name="mic" size={24} color="#16A34A" />
            </TouchableOpacity>
          </View>

          <Text style={styles.offloadHint}>
            This stays private. No AI feedback.
          </Text>
        </View>

        <View style={styles.bottomCTA}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setStep('complete')}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Close journal</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'complete') {
    return (
      <View style={[styles.container, styles.completionContainer, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.completionContent}>
          <View style={styles.completionIcon}>
            <View style={styles.completionIconInner} />
          </View>
          <Text style={styles.completionTitle}>Noted.</Text>
          <Text style={styles.completionSubtitle}>No action required.</Text>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Close journal</Text>
          </TouchableOpacity>

          <Text style={styles.completionHint}>The day is closed.</Text>
        </Animated.View>
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
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
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
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -1.5,
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  beginButton: {
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
  beginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sliderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 48,
  },
  sliderTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
    textAlign: 'center',
  },
  sliderValue: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: -2,
    color: '#000000',
  },
  sliderHint: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  sliderWrapper: {
    width: '100%',
    gap: 24,
  },
  sliderTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 4,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 0,
  },
  sliderButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonActive: {
    // Active state styling
  },
  sliderButtonDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  sliderButtonDotActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  sliderLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  bottomCTA: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  offloadContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 24,
  },
  offloadTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
  },
  offloadSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  textAreaContainer: {
    position: 'relative',
  },
  textArea: {
    minHeight: 256,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.5,
  },
  micButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  offloadHint: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
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
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  completionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionContent: {
    alignItems: 'center',
    gap: 48,
    paddingHorizontal: 24,
  },
  completionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16A34A',
  },
  completionTitle: {
    fontSize: 48,
    fontWeight: '600',
    letterSpacing: -2,
    color: '#000000',
  },
  completionSubtitle: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  doneButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 24,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  completionHint: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.3)',
  },
});

