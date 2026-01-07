import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkPremiumStatus } from '@/utils/premium';

export default function ExamPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    checkPremium();
  }, []);

  const checkPremium = async () => {
    const status = await checkPremiumStatus();
    setIsPremium(status.isPremium);
  };

  const handleUnlock = () => {
    setShowPaywall(true);
  };

  const handleStartDemo = () => {
    // Demo mode - show limited functionality
    // For now, just show paywall
    setShowPaywall(true);
  };

  const handlePaywallClose = () => {
    setShowPaywall(false);
    checkPremium();
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
            <Text style={styles.headerTitle}>Exam Mode</Text>
            <Text style={styles.headerSubtitle}>Preview</Text>
          </View>
          <View style={styles.backButton} />
        </Animated.View>

        {/* Preview Content */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.previewSection}>
          <Text style={styles.previewTitle}>What is Exam Mode?</Text>
          <Text style={styles.previewDescription}>
            Exam Mode helps you focus intensely on your most important tasks before exams. 
            It chains tasks automatically, tracks your progress, and keeps you locked in.
          </Text>
        </Animated.View>

        {/* Demo Timer */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.demoSection}>
          <View style={styles.demoTimerCard}>
            <Text style={styles.demoTimerLabel}>Demo Timer</Text>
            <Text style={styles.demoTimerValue}>45:00</Text>
            <Text style={styles.demoTimerNote}>Static preview - timer doesn't run</Text>
          </View>
        </Animated.View>

        {/* Sample Task Card */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.demoSection}>
          <View style={styles.taskCard}>
            <Text style={styles.taskCardLabel}>Sample Task</Text>
            <Text style={styles.taskCardTitle}>Complete Chapter 12 Summary</Text>
            <Text style={styles.taskCardSubject}>Organic Chemistry</Text>
            <View style={styles.lockedOverlay}>
              <Ionicons name="lock-closed" size={24} color="rgba(0, 0, 0, 0.4)" />
              <Text style={styles.lockedText}>Task chaining locked</Text>
            </View>
          </View>
        </Animated.View>

        {/* Locked Features */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Premium Features</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={20} color="rgba(0, 0, 0, 0.4)" />
            <Text style={styles.featureText}>Automatic task chaining</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={20} color="rgba(0, 0, 0, 0.4)" />
            <Text style={styles.featureText}>Pressure pacing & analytics</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={20} color="rgba(0, 0, 0, 0.4)" />
            <Text style={styles.featureText}>Full session history</Text>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={handleUnlock}
            activeOpacity={0.8}
          >
            <Text style={styles.unlockButtonText}>Unlock Exam Mode</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleStartDemo}
            activeOpacity={0.7}
          >
            <Text style={styles.demoButtonText}>Try 5-min demo</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        animationType="slide"
        transparent={true}
        onRequestClose={handlePaywallClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handlePaywallClose}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Unlock Exam Mode</Text>
            <Text style={styles.modalDescription}>
              Get full access to Exam Mode and all premium features
            </Text>
            <TouchableOpacity
              style={styles.paywallButton}
              onPress={() => {
                router.push('/onboarding/paywall');
                handlePaywallClose();
              }}
            >
              <Text style={styles.paywallButtonText}>View Plans</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 4,
  },
  previewSection: {
    marginBottom: 32,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  previewDescription: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 24,
  },
  demoSection: {
    marginBottom: 24,
  },
  demoTimerCard: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  demoTimerLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 8,
  },
  demoTimerValue: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  demoTimerNote: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  taskCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    position: 'relative',
  },
  taskCardLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 8,
  },
  taskCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  taskCardSubject: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  lockedText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  ctaSection: {
    gap: 12,
  },
  unlockButton: {
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
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  demoButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  demoButtonText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 24,
  },
  paywallButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  paywallButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

