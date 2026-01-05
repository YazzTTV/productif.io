import React, { useState, useEffect } from 'react';
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
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ValueAwarenessScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [currentStatement, setCurrentStatement] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const statements = [
    t('workALot') || 'You work a lot.',
    t('stayDisciplined') || 'You try to stay disciplined.',
    t('feelsScattered') || 'But everything feels scattered.',
  ];

  useEffect(() => {
    if (currentStatement < statements.length) {
      const timer = setTimeout(() => {
        setCurrentStatement(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShowAll(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStatement, statements.length]);

  const handleContinue = () => {
    router.push('/(onboarding-new)/identity');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Title */}
          <Animated.View entering={FadeIn.delay(200).duration(400)}>
            <Text style={styles.title}>
              {t('notTheProblem') || "You're not the problem."}
            </Text>
          </Animated.View>

          {/* Animated statements */}
          <View style={styles.statementsContainer}>
            {statements.slice(0, currentStatement + 1).map((statement, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(300 + index * 100).duration(400)}
              >
                <View style={styles.statementCard}>
                  <Text style={styles.statementText}>{statement}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Final message */}
          {showAll && (
            <Animated.View entering={FadeInDown.delay(600).duration(400)}>
              <View style={styles.divider} />
              <Text style={styles.finalMessage}>
                {t('lackOfSystem') || 'The problem is the lack of a clear system.'}
              </Text>
            </Animated.View>
          )}

          {/* CTA */}
          {showAll && (
            <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleContinue}
                style={styles.continueButton}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>
                  {t('continue') || 'Continue'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.03 * 24,
  },
  statementsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  statementCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statementText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.7)',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    width: '100%',
    marginVertical: 24,
  },
  finalMessage: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.02 * 20,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto',
  },
  continueButton: {
    backgroundColor: '#16A34A',
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

