import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Share,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Clipboard } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiCall, authService } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

const ONELINK_BASE_URL = 'https://productif.onelink.me/HCEk';

interface AffiliateStats {
  affiliateId: string;
  referralLink: string;
  referredUsersCount: number;
  paidUsersCount: number;
  revenueTotal: number;
  revenue30d: number;
  commissionsPending: number;
  commissionsEligible: number;
  commissionsPaid: number;
}

interface ScoreData {
  score: number;
  tier: 'bronze' | 'silver' | 'gold';
  tierLabel: string;
  commissionRate: number;
  nextTier: 'bronze' | 'silver' | 'gold' | null;
  nextTierLabel: string | null;
  pointsToNext: number;
  breakdown: {
    reach: number;
    activity: number;
    revenue: number;
    trust: number;
  };
  thresholds: {
    bronze: number;
    silver: number;
    gold: number;
  };
}

const TIER_COLORS = {
  bronze: { bg: 'rgba(245, 158, 11, 0.12)', text: '#B45309', border: 'rgba(245, 158, 11, 0.3)' },
  silver: { bg: 'rgba(107, 114, 128, 0.12)', text: '#4B5563', border: 'rgba(107, 114, 128, 0.3)' },
  gold: { bg: 'rgba(234, 179, 8, 0.12)', text: '#A16207', border: 'rgba(234, 179, 8, 0.3)' },
};

const TIER_EMOJI = { bronze: '🛡️', silver: '⚡', gold: '🏆' };

export default function AmbassadorScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [referralLink, setReferralLink] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [user, affiliateData, scoreResult] = await Promise.all([
        authService.checkAuth(),
        apiCall<AffiliateStats>('/affiliate/me').catch(() => null),
        apiCall<ScoreData>('/affiliate/score').catch(() => null),
      ]);

      if (user) {
        setUserName(user.name || '');
        const link = affiliateData?.referralLink ||
          `${ONELINK_BASE_URL}?af_sub1=${user.id}&pid=ambassador`;
        setReferralLink(link);
      }

      if (affiliateData) {
        setStats(affiliateData);
      }
      if (scoreResult) {
        setScoreData(scoreResult);
      }
    } catch (error) {
      console.error('[Ambassador] Erreur chargement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleCopyLink = async () => {
    try {
      Clipboard.setString(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Erreur', 'Impossible de copier le lien');
    }
  };

  const handleShare = async () => {
    const message = userName
      ? `${userName} t'invite à rejoindre Productif.io — le système de discipline pour les étudiants sérieux.\n\n${referralLink}`
      : `Rejoins Productif.io — le système de discipline pour les étudiants sérieux.\n\n${referralLink}`;

    try {
      await Share.share({
        message,
        title: 'Productif.io — Programme Ambassadeur',
      });
    } catch {
      // cancelled
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} €`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />
        }
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
            <Text style={styles.headerTitle}>Programme Ambassadeur</Text>
            <Text style={styles.headerSubtitle}>
              Partagez Productif.io et gagnez {scoreData ? `${Math.round(scoreData.commissionRate * 100)}%` : '50%'} de commission sur chaque abonnement.
            </Text>
          </View>
        </Animated.View>

        {/* Lien de parrainage */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.linkCard}>
            <View style={styles.linkHeader}>
              <Ionicons name="link" size={20} color="#16A34A" />
              <Text style={styles.linkLabel}>Mon lien de parrainage</Text>
            </View>
            <TextInput
              style={styles.linkInput}
              value={referralLink}
              editable={false}
              selectTextOnFocus
            />
            <View style={styles.linkActions}>
              <TouchableOpacity
                style={[styles.actionButton, copied && styles.actionButtonActive]}
                onPress={handleCopyLink}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={copied ? '#16A34A' : '#000'}
                />
                <Text style={[styles.actionButtonText, copied && styles.actionButtonTextActive]}>
                  {copied ? 'Copié' : 'Copier'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={18} color="#000" />
                <Text style={styles.actionButtonText}>Partager</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* APS Score & Tier */}
        {scoreData && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <View style={styles.scoreCard}>
              {/* Score header */}
              <View style={styles.scoreHeader}>
                <View style={[styles.tierBadgeIcon, { backgroundColor: TIER_COLORS[scoreData.tier].bg }]}>
                  <Text style={styles.tierEmoji}>{TIER_EMOJI[scoreData.tier]}</Text>
                </View>
                <View style={styles.scoreHeaderText}>
                  <View style={styles.scoreValueRow}>
                    <Text style={styles.scoreValue}>{scoreData.score}</Text>
                    <Text style={styles.scoreMax}> / 1000</Text>
                  </View>
                  <View style={styles.tierBadgeRow}>
                    <View style={[styles.tierBadge, {
                      backgroundColor: TIER_COLORS[scoreData.tier].bg,
                      borderColor: TIER_COLORS[scoreData.tier].border,
                    }]}>
                      <Text style={[styles.tierBadgeText, { color: TIER_COLORS[scoreData.tier].text }]}>
                        {TIER_EMOJI[scoreData.tier]} {scoreData.tierLabel}
                      </Text>
                    </View>
                    {scoreData.nextTier && (
                      <Text style={styles.nextTierHint}>
                        {scoreData.pointsToNext} pts → {scoreData.nextTierLabel}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.commissionBlock}>
                  <Text style={styles.commissionLabel}>Commission</Text>
                  <Text style={styles.commissionRate}>
                    {Math.round(scoreData.commissionRate * 100)}%
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, (scoreData.score / 1000) * 100)}%` }]} />
                  <View style={[styles.progressMarker, { left: `${(scoreData.thresholds.silver / 1000) * 100}%` }]} />
                  <View style={[styles.progressMarker, { left: `${(scoreData.thresholds.gold / 1000) * 100}%` }]} />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={[styles.progressLabel, scoreData.tier === 'bronze' && styles.progressLabelActive]}>Explorateur</Text>
                  <Text style={[styles.progressLabel, styles.progressLabelCenter, scoreData.tier === 'silver' && styles.progressLabelActive]}>Performer</Text>
                  <Text style={[styles.progressLabel, styles.progressLabelRight, scoreData.tier === 'gold' && styles.progressLabelActive]}>Élite</Text>
                </View>
              </View>

              {/* Breakdown */}
              <View style={styles.breakdownGrid}>
                <BreakdownBar label="Reach" value={scoreData.breakdown.reach} max={200} color="#3B82F6" icon="eye-outline" />
                <BreakdownBar label="Activité" value={scoreData.breakdown.activity} max={200} color="#F97316" icon="flame-outline" />
                <BreakdownBar label="Revenu" value={scoreData.breakdown.revenue} max={500} color="#16A34A" icon="cash-outline" />
                <BreakdownBar label="Confiance" value={scoreData.breakdown.trust} max={100} color="#8B5CF6" icon="shield-checkmark-outline" />
              </View>

              {/* Tier cards */}
              <View style={styles.tierCardsRow}>
                <MiniTierCard tier="bronze" label="Explorateur" threshold="0" commission="50%" active={scoreData.tier === 'bronze'} />
                <MiniTierCard tier="silver" label="Performer" threshold="250" commission="50%" active={scoreData.tier === 'silver'} />
                <MiniTierCard tier="gold" label="Élite" threshold="600" commission="60%" active={scoreData.tier === 'gold'} />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Stats */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#16A34A" />
          </View>
        ) : stats ? (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Mes performances</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.referredUsersCount}</Text>
                <Text style={styles.statLabel}>Inscrits</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.paidUsersCount}</Text>
                <Text style={styles.statLabel}>Abonnés</Text>
              </View>
            </View>

            <View style={styles.revenueCard}>
              <View style={styles.revenueRow}>
                <Text style={styles.revenueLabel}>Revenu total généré</Text>
                <Text style={styles.revenueValue}>{formatCurrency(stats.revenueTotal)}</Text>
              </View>
              <View style={styles.revenueDivider} />
              <View style={styles.revenueRow}>
                <Text style={styles.revenueLabel}>Revenu 30 derniers jours</Text>
                <Text style={styles.revenueValue}>{formatCurrency(stats.revenue30d)}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Mes commissions</Text>

            <View style={styles.commissionsCard}>
              <View style={styles.commissionRow}>
                <View style={styles.commissionDot}>
                  <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                </View>
                <Text style={styles.commissionLabel}>En attente</Text>
                <Text style={styles.commissionValue}>
                  {formatCurrency(stats.commissionsPending)}
                </Text>
              </View>
              <View style={styles.commissionRow}>
                <View style={styles.commissionDot}>
                  <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
                </View>
                <Text style={styles.commissionLabel}>Disponible</Text>
                <Text style={[styles.commissionValue, { color: '#16A34A' }]}>
                  {formatCurrency(stats.commissionsEligible)}
                </Text>
              </View>
              <View style={styles.commissionRow}>
                <View style={styles.commissionDot}>
                  <View style={[styles.dot, { backgroundColor: '#6B7280' }]} />
                </View>
                <Text style={styles.commissionLabel}>Déjà payé</Text>
                <Text style={styles.commissionValue}>
                  {formatCurrency(stats.commissionsPaid)}
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={18} color="rgba(0,0,0,0.4)" />
              <Text style={styles.infoText}>
                Les commissions deviennent disponibles 14 jours après le paiement pour couvrir les éventuels remboursements.
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="rgba(0,0,0,0.2)" />
            <Text style={styles.emptyTitle}>Aucun filleul pour le moment</Text>
            <Text style={styles.emptyDescription}>
              Partagez votre lien pour commencer à parrainer des utilisateurs et gagner des commissions.
            </Text>
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

function BreakdownBar({ label, value, max, color, icon }: {
  label: string; value: number; max: number; color: string; icon: string;
}) {
  return (
    <View style={styles.breakdownItem}>
      <View style={styles.breakdownHeader}>
        <Ionicons name={icon as any} size={14} color="rgba(0,0,0,0.35)" />
        <Text style={styles.breakdownLabel}>{label}</Text>
        <Text style={styles.breakdownValue}>{value}/{max}</Text>
      </View>
      <View style={styles.breakdownBarBg}>
        <View style={[styles.breakdownBarFill, { width: `${(value / max) * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function MiniTierCard({ tier, label, threshold, commission, active }: {
  tier: 'bronze' | 'silver' | 'gold'; label: string; threshold: string; commission: string; active: boolean;
}) {
  return (
    <View style={[
      styles.miniTierCard,
      active && {
        backgroundColor: TIER_COLORS[tier].bg,
        borderColor: TIER_COLORS[tier].border,
      },
    ]}>
      <Text style={styles.miniTierEmoji}>{TIER_EMOJI[tier]}</Text>
      <Text style={[styles.miniTierLabel, active && { fontWeight: '700', color: '#000' }]}>{label}</Text>
      <Text style={styles.miniTierInfo}>{threshold}+ pts</Text>
      <Text style={[styles.miniTierCommission, active && { color: '#16A34A' }]}>{commission}</Text>
      {active && <View style={styles.miniTierActiveDot} />}
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
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
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
    marginBottom: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -1,
    color: '#000000',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.5)',
    lineHeight: 22,
  },
  linkCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.15)',
    backgroundColor: 'rgba(22, 163, 74, 0.03)',
    marginBottom: 24,
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
  },
  linkInput: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.7)',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  linkActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: '#FFFFFF',
  },
  actionButtonActive: {
    borderColor: 'rgba(22, 163, 74, 0.3)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  actionButtonTextActive: {
    color: '#16A34A',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  statsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 4,
  },
  revenueCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  revenueDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 14,
  },
  commissionsCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    gap: 14,
  },
  commissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commissionDot: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  commissionLabel: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginLeft: 8,
  },
  commissionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.5)',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  emptyDescription: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },

  // APS Score styles
  scoreCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
    gap: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierBadgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierEmoji: {
    fontSize: 22,
  },
  scoreHeaderText: {
    flex: 1,
  },
  scoreValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -1,
  },
  scoreMax: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.3)',
    fontWeight: '500',
  },
  tierBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  nextTierHint: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.35)',
  },
  commissionBlock: {
    alignItems: 'flex-end',
  },
  commissionLabel: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  commissionRate: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16A34A',
    letterSpacing: -0.5,
  },

  progressBarContainer: {
    gap: 6,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  progressMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.3)',
    fontWeight: '500',
  },
  progressLabelCenter: {
    textAlign: 'center',
  },
  progressLabelRight: {
    textAlign: 'right',
  },
  progressLabelActive: {
    color: '#000',
    fontWeight: '600',
  },

  breakdownGrid: {
    gap: 12,
  },
  breakdownItem: {
    gap: 6,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  breakdownBarBg: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  tierCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniTierCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    alignItems: 'center',
    gap: 4,
  },
  miniTierEmoji: {
    fontSize: 18,
  },
  miniTierLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  miniTierInfo: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.35)',
  },
  miniTierCommission: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.7)',
  },
  miniTierActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginTop: 2,
  },
});
