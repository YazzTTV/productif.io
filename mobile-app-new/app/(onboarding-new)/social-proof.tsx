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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';

// Case studies will be built dynamically with translations

export default function SocialProofScreen() {
  const { t } = useLanguage();
  
  const caseStudies = [
    {
      name: t('benjaminName'),
      role: t('benjaminRole'),
      image: "👨‍💼",
      before: t('benjaminBefore'),
      after: t('benjaminAfter'),
      quote: t('benjaminQuote'),
      timeframe: t('benjaminTimeframe'),
      metrics: [
        { label: t('benjaminMetric1'), value: "+180%" },
        { label: t('benjaminMetric2'), value: "+65%" }
      ]
    },
    {
      name: t('sabrinaName'),
      role: t('sabrinaRole'),
      image: "👩‍💼",
      before: t('sabrinaBefore'),
      after: t('sabrinaAfter'),
      quote: t('sabrinaQuote'),
      timeframe: t('sabrinaTimeframe'),
      metrics: [
        { label: t('sabrinaMetric1'), value: "+250%" },
        { label: t('sabrinaMetric2'), value: "+195%" }
      ]
    },
    {
      name: t('gaetanName'),
      role: t('gaetanRole'),
      image: "👨‍💻",
      before: t('gaetanBefore'),
      after: t('gaetanAfter'),
      quote: t('gaetanQuote'),
      timeframe: t('gaetanTimeframe'),
      metrics: [
        { label: t('gaetanMetric1'), value: "+320%" },
        { label: t('gaetanMetric2'), value: "+145%" }
      ]
    }
  ];

  const testimonials = [
    { text: t('fabioTestimonial'), author: t('fabioName'), verified: true },
    { text: t('noahTestimonial'), author: t('noahName'), verified: true },
    { text: t('arthurTestimonial'), author: t('arthurName'), verified: true },
  ];
  
  const stats = [
    { value: "87%", label: t('reportMajorImprovements'), icon: "trending-up" },
    { value: "1500+", label: t('earlyAdopters'), icon: "people" },
    { value: "4.9★", label: t('averageRating'), icon: "star" },
    { value: "2.5hrs", label: t('savedDailyPerUser'), icon: "trophy" }
  ];
  const handleContinue = async () => {
    router.push('/(onboarding-new)/profile-reveal');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <Animated.View entering={FadeIn.duration(600)}>
          <LinearGradient
            colors={['#00C27A', '#00D68F']}
            style={styles.headerGradient}
          >
            <Animated.View entering={FadeIn.delay(200).springify()} style={styles.headerIcon}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="trophy" size={40} color="#FFFFFF" />
              </View>
            </Animated.View>

            <Text style={styles.headerTitle}>{t('trustedByThousands')}</Text>
            <Text style={styles.headerSubtitle}>{t('seeWhatUsersSay')}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Trust Bar */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.trustBar}>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <Animated.View
                key={index}
                entering={FadeIn.delay(400 + index * 100).duration(400)}
                style={styles.statItem}
              >
                <Ionicons name={stat.icon as any} size={18} color="#00C27A" />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Case Studies */}
        <View style={styles.section}>
          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <Text style={styles.sectionTitle}>{t('successStories')}</Text>
          </Animated.View>

          {caseStudies.map((study, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(600 + index * 150).duration(600)}
            >
              <View style={styles.caseStudyCard}>
                {/* Header */}
                <View style={styles.caseStudyHeader}>
                  <Text style={styles.caseStudyImage}>{study.image}</Text>
                  <View style={styles.caseStudyInfo}>
                    <View style={styles.caseStudyNameRow}>
                      <Text style={styles.caseStudyName}>{study.name}</Text>
                      <Ionicons name="checkmark-circle" size={16} color="#00C27A" />
                    </View>
                    <Text style={styles.caseStudyRole}>{study.role}</Text>
                  </View>
                  <View style={styles.timeframeBadge}>
                    <Text style={styles.timeframeText}>{study.timeframe}</Text>
                  </View>
                </View>

                {/* Transformation */}
                <View style={styles.transformation}>
                  <View style={styles.transformationSide}>
                    <Text style={styles.transformationLabel}>{t('before')}</Text>
                    <Text style={styles.transformationBefore}>{study.before}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                  <View style={styles.transformationSide}>
                    <Text style={styles.transformationLabel}>{t('after')}</Text>
                    <Text style={styles.transformationAfter}>{study.after}</Text>
                  </View>
                </View>

                {/* Quote */}
                <Text style={styles.quote}>"{study.quote}"</Text>

                {/* Metrics */}
                <View style={styles.metricsRow}>
                  {study.metrics.map((metric, i) => (
                    <View key={i} style={styles.metricBox}>
                      <Text style={styles.metricValue}>{metric.value}</Text>
                      <Text style={styles.metricLabel}>{metric.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Quick Testimonials */}
        <Animated.View entering={FadeInDown.delay(1200).duration(600)}>
          <Text style={styles.sectionTitle}>{t('whatUsersSay')}</Text>
          {testimonials.map((testimonial, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(1300 + index * 100).duration(600)}
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
                  {testimonial.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#00C27A" />
                      <Text style={styles.verifiedText}>{t('verified')}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Social Proof Banner */}
        <Animated.View entering={FadeInDown.delay(1600).duration(600)}>
          <LinearGradient
            colors={['#00C27A', '#00D68F']}
            style={styles.socialBanner}
          >
            <Text style={styles.bannerStars}>⭐⭐⭐⭐⭐</Text>
            <Text style={styles.bannerRating}>
              {t('ratingFromReviews')}
            </Text>
            <Text style={styles.bannerCompanies}>
              {t('trustedByProfessionals')}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Trust Indicators */}
        <Animated.View entering={FadeInDown.delay(1800).duration(600)}>
          <View style={styles.trustBox}>
            {[
              t('freeTrialCancelAnytime'),
              t('moneyBackGuarantee')
            ].map((text, i) => (
              <View key={i} style={styles.trustItem}>
                <View style={styles.trustIconCircle}>
                  <Ionicons name="checkmark-circle" size={16} color="#00C27A" />
                </View>
                <Text style={styles.trustText}>{text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View entering={FadeInDown.delay(2000).duration(600)}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleContinue}
          >
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>{t('seeMyResults')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom Padding */}
        <View style={{ height: 60 }} />
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
    paddingBottom: 20,
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 64,
    position: 'relative',
    overflow: 'hidden',
  },
  headerIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
  },
  trustBar: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 12,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
  },
  caseStudyCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  caseStudyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  caseStudyImage: {
    fontSize: 36,
  },
  caseStudyInfo: {
    flex: 1,
  },
  caseStudyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  caseStudyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  caseStudyRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeframeBadge: {
    backgroundColor: 'rgba(0, 194, 122, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeframeText: {
    fontSize: 10,
    color: '#00C27A',
    fontWeight: '600',
  },
  transformation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  transformationSide: {
    flex: 1,
    alignItems: 'center',
  },
  transformationLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  transformationBefore: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
    textAlign: 'center',
  },
  transformationAfter: {
    fontSize: 11,
    color: '#00C27A',
    fontWeight: '500',
    textAlign: 'center',
  },
  quote: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00C27A',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 9,
    color: '#6B7280',
  },
  testimonialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  testimonialText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 8,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 11,
    color: '#6B7280',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    color: '#00C27A',
    fontWeight: '500',
  },
  socialBanner: {
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  bannerStars: {
    fontSize: 24,
    marginBottom: 8,
  },
  bannerRating: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerCompanies: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  trustBox: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trustIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 194, 122, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

