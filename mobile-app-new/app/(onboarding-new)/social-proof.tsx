import React from 'react';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SocialProofScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const stats = [
    { value: "87%", label: t('reportMajorImprovements') || 'report improvements', icon: "trending-up" },
    { value: "1500+", label: t('earlyAdopters') || 'early adopters', icon: "people" },
    { value: "4.9★", label: t('averageRating') || 'average rating', icon: "star" },
    { value: "2.5hrs", label: t('savedDailyPerUser') || 'saved daily', icon: "time" }
  ];

  const testimonials = [
    { text: t('fabioTestimonial') || "This app changed how I study.", author: t('fabioName') || "Fabio, Student" },
    { text: t('noahTestimonial') || "Finally a system that works for me.", author: t('noahName') || "Noah, Student" },
    { text: t('arthurTestimonial') || "My productivity has doubled.", author: t('arthurName') || "Arthur, Student" },
  ];

  const handleContinue = async () => {
    router.push('/(onboarding-new)/profile-reveal');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '90%' }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.title}>
            {t('trustedByThousands') || 'Trusted by students everywhere'}
          </Text>
          <Text style={styles.subtitle}>
            {t('seeWhatUsersSay') || 'See what others are saying'}
          </Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsGrid}>
            {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name={stat.icon as any} size={20} color="#16A34A" />
              </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
            ))}
        </Animated.View>

        {/* Testimonials */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.testimonials}>
          <Text style={styles.sectionTitle}>
            {t('whatUsersSay') || 'What users say'}
          </Text>
          {testimonials.map((testimonial, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(500 + index * 100).duration(400)}
            >
              <View style={styles.testimonialCard}>
                <View style={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons key={i} name="star" size={14} color="#FCD34D" />
                  ))}
                </View>
                <Text style={styles.testimonialText}>"{testimonial.text}"</Text>
                <View style={styles.testimonialAuthor}>
                  <Text style={styles.authorName}>{testimonial.author}</Text>
                    <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                    </View>
                </View>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Trust Box */}
        <Animated.View entering={FadeInDown.delay(800).duration(400)}>
          <View style={styles.trustBox}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
              <Text style={styles.trustText}>
                {t('freeTrialCancelAnytime') || 'Free trial, cancel anytime'}
              </Text>
                </View>
            <View style={styles.trustItem}>
              <Ionicons name="lock-closed" size={20} color="#16A34A" />
              <Text style={styles.trustText}>
                {t('moneyBackGuarantee') || 'Money-back guarantee'}
              </Text>
              </View>
          </View>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View entering={FadeInDown.delay(1000).duration(400)} style={styles.ctaContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleContinue}
              style={styles.ctaButton}
            >
            <Text style={styles.ctaText}>
              {t('seeMyResults') || 'See my results'}
            </Text>
          </TouchableOpacity>
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
  progressBarContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: -0.03 * 24,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statItem: {
    width: '47%',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  testimonials: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    letterSpacing: -0.03 * 20,
  },
  testimonialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  testimonialText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 22,
    marginBottom: 12,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustBox: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trustText: {
    fontSize: 14,
    color: '#000000',
  },
  ctaContainer: {
    marginTop: 'auto',
  },
  ctaButton: {
    backgroundColor: '#16A34A',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
