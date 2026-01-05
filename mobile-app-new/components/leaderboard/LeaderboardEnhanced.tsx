import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gamificationService } from '@/lib/api';

type LeaderboardTab = 'friends' | 'class' | 'global';

interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  xp: number;
  maxXP: number;
  streak: number;
  focusSessions: number;
  isCurrentUser?: boolean;
}

export function LeaderboardEnhanced() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('class');
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  // Mock data - Friends
  const friendsData: LeaderboardUser[] = [
    { id: '1', rank: 1, name: 'Alex T.', xp: 2531, maxXP: 3000, streak: 7, focusSessions: 14 },
    { id: '2', rank: 2, name: 'You', xp: 2654, maxXP: 3000, streak: 9, focusSessions: 15, isCurrentUser: true },
    { id: '3', rank: 3, name: 'Emma R.', xp: 2408, maxXP: 3000, streak: 11, focusSessions: 16 },
    { id: '4', rank: 4, name: 'Lucas M.', xp: 2287, maxXP: 3000, streak: 5, focusSessions: 12 },
  ];

  // Mock data - Class/Group
  const classData: LeaderboardUser[] = [
    { id: '1', rank: 1, name: 'Marie D.', xp: 2847, maxXP: 3000, streak: 12, focusSessions: 18 },
    { id: '2', rank: 2, name: 'You', xp: 2654, maxXP: 3000, streak: 9, focusSessions: 15, isCurrentUser: true },
    { id: '3', rank: 3, name: 'Alex T.', xp: 2531, maxXP: 3000, streak: 7, focusSessions: 14 },
    { id: '4', rank: 4, name: 'Emma R.', xp: 2408, maxXP: 3000, streak: 11, focusSessions: 16 },
    { id: '5', rank: 5, name: 'Lucas M.', xp: 2287, maxXP: 3000, streak: 5, focusSessions: 12 },
    { id: '6', rank: 6, name: 'Sofia K.', xp: 2156, maxXP: 3000, streak: 14, focusSessions: 13 },
    { id: '7', rank: 7, name: 'Thomas B.', xp: 2089, maxXP: 3000, streak: 6, focusSessions: 11 },
    { id: '8', rank: 8, name: 'Nina L.', xp: 1967, maxXP: 3000, streak: 8, focusSessions: 10 },
  ];

  // Mock data - Global (Premium only)
  const globalData: LeaderboardUser[] = [
    { id: '1', rank: 1, name: 'Marie D.', xp: 2847, maxXP: 3000, streak: 12, focusSessions: 18 },
    { id: '2', rank: 2, name: 'Sofia K.', xp: 2776, maxXP: 3000, streak: 14, focusSessions: 17 },
    { id: '3', rank: 3, name: 'You', xp: 2654, maxXP: 3000, streak: 9, focusSessions: 15, isCurrentUser: true },
    { id: '4', rank: 4, name: 'Alex T.', xp: 2531, maxXP: 3000, streak: 7, focusSessions: 14 },
    { id: '5', rank: 5, name: 'Emma R.', xp: 2408, maxXP: 3000, streak: 11, focusSessions: 16 },
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case 'friends': return friendsData;
      case 'class': return classData;
      case 'global': return globalData;
      default: return classData;
    }
  };

  const data = getCurrentData();
  const currentUser = data.find(u => u.isCurrentUser);

  const handleTabPress = (tab: LeaderboardTab) => {
    if (!isPremium && tab === 'global') {
      // Navigate to paywall
      return;
    }
    setActiveTab(tab);
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
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Community</Text>
            <Text style={styles.headerSubtitle}>Others are showing up too.</Text>
          </View>
        </Animated.View>

        {/* Tabs */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.tabsContainer}>
          {(['friends', 'class', 'global'] as const).map((tab) => {
            const isLocked = !isPremium && tab === 'global';
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && styles.tabActive,
                  isLocked && styles.tabLocked
                ]}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive
                ]}>
                  {tab === 'class' ? 'Class' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                {isLocked && (
                  <Ionicons name="lock-closed" size={12} color="rgba(0,0,0,0.4)" style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Your Position Card */}
        {currentUser && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.positionCard}>
            <Text style={styles.positionLabel}>Your position</Text>
            <View style={styles.positionContent}>
              <View style={styles.positionAvatar}>
                <Text style={styles.positionAvatarText}>{currentUser.name.charAt(0)}</Text>
              </View>
              <View style={styles.positionStats}>
                <View style={styles.positionRankRow}>
                  <Text style={styles.positionRank}>#{currentUser.rank}</Text>
                  <Text style={styles.positionContext}>
                    {activeTab === 'friends' ? 'among friends' : 
                     activeTab === 'class' ? 'in your class' : 
                     'globally'}
                  </Text>
                </View>
                <View style={styles.positionMeta}>
                  <Text style={styles.positionMetaText}>{currentUser.streak}d streak</Text>
                  <Text style={styles.positionMetaText}>•</Text>
                  <Text style={styles.positionMetaText}>{currentUser.focusSessions} sessions</Text>
                </View>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    { width: `${(currentUser.xp / currentUser.maxXP) * 100}%` }
                  ]}
                />
              </View>
              <View style={styles.progressBarLabels}>
                <Text style={styles.progressBarLabel}>{currentUser.xp.toLocaleString()} XP</Text>
                <Text style={styles.progressBarLabel}>{currentUser.maxXP.toLocaleString()} XP</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Motivational Quote */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.quoteSection}>
          <Text style={styles.quoteText}>You're aligned with this group. Keep showing up.</Text>
        </Animated.View>

        {/* Invite CTA */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.inviteSection}>
          <TouchableOpacity style={styles.inviteCard} activeOpacity={0.7}>
            <Text style={styles.inviteText}>Invite someone to stay consistent with you</Text>
            <Text style={styles.inviteCTA}>Invite a friend →</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Leaderboard List */}
        <View style={styles.listContainer}>
          {data.map((user, index) => {
            if (user.isCurrentUser) return null;

            const progressPercent = (user.xp / user.maxXP) * 100;

            return (
              <Animated.View
                key={user.id}
                entering={FadeInDown.delay(600 + index * 50).duration(400)}
              >
                <TouchableOpacity
                  style={styles.userCard}
                  onPress={() => setSelectedUser(user)}
                  activeOpacity={0.7}
                >
                  <View style={styles.userCardContent}>
                    <View style={styles.userCardLeft}>
                      <Text style={styles.userRank}>{user.rank}</Text>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>{user.name.charAt(0)}</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <View style={styles.userMeta}>
                          <Text style={styles.userMetaText}>{user.streak}d</Text>
                          <Text style={styles.userMetaText}>•</Text>
                          <Text style={styles.userMetaText}>{user.focusSessions} sessions</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.userProgressBar}>
                    <View style={[styles.userProgressFill, { width: `${progressPercent}%` }]} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Premium Upgrade Prompt (for Global tab) */}
        {!isPremium && activeTab === 'global' && (
          <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.premiumPrompt}>
            <View style={styles.premiumCard}>
              <View style={styles.premiumIcon}>
                <Ionicons name="lock-closed" size={32} color="#16A34A" />
              </View>
              <Text style={styles.premiumTitle}>Join the global leaderboard</Text>
              <Text style={styles.premiumSubtitle}>
                Compete with students worldwide and track long-term progress.
              </Text>
              <View style={styles.premiumFeatures}>
                <View style={styles.premiumFeature}>
                  <View style={styles.premiumFeatureDot} />
                  <Text style={styles.premiumFeatureText}>Global rankings and insights</Text>
                </View>
                <View style={styles.premiumFeature}>
                  <View style={styles.premiumFeatureDot} />
                  <Text style={styles.premiumFeatureText}>Monthly and all-time views</Text>
                </View>
                <View style={styles.premiumFeature}>
                  <View style={styles.premiumFeatureDot} />
                  <Text style={styles.premiumFeatureText}>Advanced consistency metrics</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.premiumButton} activeOpacity={0.8}>
                <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
              <Text style={styles.premiumNote}>
                Continue tracking with friends and class for free
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* User Profile Modal */}
      <Modal
        visible={selectedUser !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedUser(null)}
      >
        {selectedUser && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setSelectedUser(null)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedUser(null)}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalUserHeader}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>{selectedUser.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                  <Text style={styles.modalUserRank}>Rank #{selectedUser.rank}</Text>
                </View>
              </View>

              <View style={styles.modalStats}>
                <View style={styles.modalStatCard}>
                  <Text style={styles.modalStatLabel}>Current streak</Text>
                  <View style={styles.modalStatValue}>
                    <Text style={styles.modalStatNumber}>{selectedUser.streak}</Text>
                    <Text style={styles.modalStatUnit}>days</Text>
                  </View>
                </View>

                <View style={styles.modalStatCard}>
                  <Text style={styles.modalStatLabel}>Weekly XP</Text>
                  <View style={styles.modalStatValue}>
                    <Text style={styles.modalStatNumber}>{selectedUser.xp.toLocaleString()}</Text>
                    <Text style={styles.modalStatUnit}>XP</Text>
                  </View>
                </View>

                <View style={styles.modalStatCard}>
                  <Text style={styles.modalStatLabel}>Focus sessions</Text>
                  <View style={styles.modalStatValue}>
                    <Text style={styles.modalStatNumber}>{selectedUser.focusSessions}</Text>
                    <Text style={styles.modalStatUnit}>this week</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalNote}>
                <Text style={styles.modalNoteText}>
                  Stats are private. No messaging available.
                </Text>
              </View>
            </View>
          </View>
        )}
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
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabLocked: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
    textTransform: 'capitalize',
  },
  tabTextActive: {
    color: '#000000',
  },
  positionCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    marginBottom: 24,
  },
  positionLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 16,
  },
  positionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  positionAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionAvatarText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#16A34A',
  },
  positionStats: {
    flex: 1,
  },
  positionRankRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  positionRank: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#16A34A',
  },
  positionContext: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  positionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  positionMetaText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBarLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  quoteSection: {
    marginBottom: 24,
  },
  quoteText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
  },
  inviteSection: {
    marginBottom: 24,
  },
  inviteCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    alignItems: 'center',
    gap: 8,
  },
  inviteText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  inviteCTA: {
    fontSize: 16,
    fontWeight: '500',
    color: '#16A34A',
  },
  listContainer: {
    gap: 12,
    marginBottom: 24,
  },
  userCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  userCardContent: {
    marginBottom: 12,
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userRank: {
    width: 32,
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.4)',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userMetaText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  userProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  userProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
  },
  premiumPrompt: {
    marginBottom: 24,
  },
  premiumCard: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    alignItems: 'center',
    gap: 24,
  },
  premiumIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
    textAlign: 'center',
  },
  premiumSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  premiumFeatures: {
    width: '100%',
    gap: 12,
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumFeatureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  premiumFeatureText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  premiumButton: {
    width: '100%',
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
  premiumButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumNote: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  modalHeader: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontSize: 24,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  modalUserName: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
    marginBottom: 4,
  },
  modalUserRank: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  modalStats: {
    gap: 12,
    marginBottom: 32,
  },
  modalStatCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  modalStatLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 8,
  },
  modalStatValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  modalStatNumber: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1,
    color: '#000000',
  },
  modalStatUnit: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  modalNote: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
  },
  modalNoteText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
});

