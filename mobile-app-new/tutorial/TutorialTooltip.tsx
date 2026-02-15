import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useCopilot, type TooltipProps } from 'react-native-copilot';
import { runTutorialNextHandler } from '@/tutorial/tutorialControls';

export function TutorialTooltip({ labels }: TooltipProps) {
  const {
    currentStep,
    isFirstStep,
    isLastStep,
    goToNext,
    goToPrev,
    goToNth,
    stop,
  } = useCopilot();

  const handleNext = () => {
    console.log('[TutorialTooltip] Next pressed', { step: currentStep?.name });
    const handled = runTutorialNextHandler({
      currentStep,
      goToNext,
      goToPrev,
      goToNth,
      stop,
    });
    console.log('[TutorialTooltip] Next handled', handled);
    if (handled) return;
    if (isLastStep) {
      void stop();
      return;
    }
    void goToNext();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{currentStep?.text}</Text>
      <View style={styles.actions}>
        {!isFirstStep && (
          <TouchableOpacity onPress={() => void goToPrev()} style={styles.button}>
            <Text style={styles.buttonText}>{labels.previous ?? 'Retour'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => void stop()} style={styles.button}>
          <Text style={styles.buttonText}>{labels.skip ?? 'Passer'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={[styles.button, styles.primaryButton]}>
          <Text style={[styles.buttonText, styles.primaryText]}>
            {isLastStep ? labels.finish ?? 'Terminer' : labels.next ?? 'Suivant'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    maxWidth: 320,
  },
  text: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 8,
  },
  buttonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
  },
  primaryText: {
    color: '#FFFFFF',
  },
});
