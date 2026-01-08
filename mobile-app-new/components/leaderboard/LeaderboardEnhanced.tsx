import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { gamificationService, authService } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

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

interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  type?: string;
}

export function LeaderboardEnhanced() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('friends');
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [friendsData, setFriendsData] = useState<LeaderboardUser[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [classData, setClassData] = useState<LeaderboardUser[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingClassData, setLoadingClassData] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [availableFriends, setAvailableFriends] = useState<LeaderboardUser[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Charger les amis depuis l'API
  const loadFriends = async () => {
    try {
      setLoadingFriends(true);
      const friendsLeaderboard = await gamificationService.getFriendsLeaderboard();
      
      // Récupérer l'ID de l'utilisateur actuel
      const { authService } = await import('@/lib/api');
      const currentUserData = await authService.checkAuth();
      const userId = currentUserData?.id;
      setCurrentUserId(userId || null);
      
      // Transformer les données de l'API en format LeaderboardUser
      const transformedFriends: LeaderboardUser[] = friendsLeaderboard.map((entry, index) => ({
        id: entry.userId,
        rank: entry.rank || index + 1,
        name: entry.userName || entry.userEmail?.split('@')[0] || 'User',
        xp: entry.totalPoints || 0,
        maxXP: 3000, // Valeur par défaut
        streak: entry.currentStreak || 0,
        focusSessions: entry.totalHabitsCompleted || 0,
        isCurrentUser: entry.userId === userId,
      }));
      
      // Trier par rang
      transformedFriends.sort((a, b) => a.rank - b.rank);
      
      setFriendsData(transformedFriends);
    } catch (error) {
      console.error('❌ Erreur chargement amis:', error);
      setFriendsData([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  // Charger les données au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'friends') {
        loadFriends();
      } else if (activeTab === 'class') {
        loadGroups();
      }
    }, [activeTab])
  );

  // Charger les groupes de l'utilisateur
  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      const userGroups = await gamificationService.getUserGroups();
      setGroups(userGroups);
      // Si un groupe est sélectionné, charger son classement
      if (userGroups.length > 0 && !selectedGroup) {
        setSelectedGroup(userGroups[0]);
        await loadGroupLeaderboard(userGroups[0].id);
      }
    } catch (error) {
      console.error('❌ Erreur chargement groupes:', error);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Charger le classement d'un groupe
  const loadGroupLeaderboard = async (groupId: string) => {
    try {
      setLoadingClassData(true);
      const groupLeaderboard = await gamificationService.getGroupLeaderboard(groupId);
      
      // Récupérer l'ID de l'utilisateur actuel
      const { authService } = await import('@/lib/api');
      const currentUserData = await authService.checkAuth();
      const userId = currentUserData?.id;
      
      // Transformer les données de l'API en format LeaderboardUser
      const transformedData: LeaderboardUser[] = groupLeaderboard.map((entry, index) => ({
        id: entry.userId,
        rank: entry.rank || index + 1,
        name: entry.userName || entry.userEmail?.split('@')[0] || 'User',
        xp: entry.totalPoints || 0,
        maxXP: 3000,
        streak: entry.currentStreak || 0,
        focusSessions: entry.totalHabitsCompleted || 0,
        isCurrentUser: entry.userId === userId,
      }));
      
      // Trier par rang
      transformedData.sort((a, b) => a.rank - b.rank);
      
      setClassData(transformedData);
    } catch (error) {
      console.error('❌ Erreur chargement classement groupe:', error);
      setClassData([]);
    } finally {
      setLoadingClassData(false);
    }
  };

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
      router.push('/paywall');
      return;
    }
    setActiveTab(tab);
    if (tab === 'friends') {
      loadFriends();
    } else if (tab === 'class') {
      loadGroups();
    }
  };

  const handleGroupSelect = async (group: Group) => {
    setSelectedGroup(group);
    await loadGroupLeaderboard(group.id);
  };

  // Charger les amis disponibles pour inviter
  const loadAvailableFriends = async () => {
    try {
      const friendsLeaderboard = await gamificationService.getFriendsLeaderboard();
      const transformedFriends: LeaderboardUser[] = friendsLeaderboard.map((entry, index) => ({
        id: entry.userId,
        rank: entry.rank || index + 1,
        name: entry.userName || entry.userEmail?.split('@')[0] || 'User',
        xp: entry.totalPoints || 0,
        maxXP: 3000,
        streak: entry.currentStreak || 0,
        focusSessions: entry.totalHabitsCompleted || 0,
      }));
      setAvailableFriends(transformedFriends);
    } catch (error) {
      console.error('❌ Erreur chargement amis disponibles:', error);
      setAvailableFriends([]);
    }
  };

  // Ouvrir le modal de création de groupe
  const handleCreateGroup = () => {
    console.log('🔄 Ouverture du modal de création de groupe');
    setShowCreateGroupModal(true);
    setNewGroupName('');
    setNewGroupDescription('');
    setSelectedFriendIds([]);
    loadAvailableFriends();
  };

  // Créer le groupe
  const handleSubmitGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert(t('error'), t('groupNameRequired'));
      return;
    }

    try {
      setIsCreatingGroup(true);
      
      // Récupérer l'ID de l'utilisateur actuel pour l'inclure dans les membres
      const { authService } = await import('@/lib/api');
      const currentUserData = await authService.checkAuth();
      const currentUserId = currentUserData?.id;
      
      // Inclure l'utilisateur actuel dans la liste des membres
      const allMemberIds = currentUserId 
        ? [currentUserId, ...selectedFriendIds]
        : selectedFriendIds;
      
      const newGroup = await gamificationService.createGroup({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        memberIds: allMemberIds.length > 0 ? allMemberIds : undefined,
      });

      // Recharger les groupes
      await loadGroups();
      
      // Attendre un peu avant de charger le classement pour que le backend traite la création
      setTimeout(async () => {
        try {
          // Sélectionner le nouveau groupe
          setSelectedGroup(newGroup);
          await loadGroupLeaderboard(newGroup.id);
        } catch (error) {
          console.error('❌ Erreur chargement classement après création:', error);
          // Ne pas bloquer si le classement ne charge pas immédiatement
        }
      }, 500);

      // Fermer le modal
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setSelectedFriendIds([]);

      Alert.alert(t('success'), t('groupCreated'));
    } catch (error: any) {
      console.error('❌ Erreur création groupe:', error);
      Alert.alert(t('error'), error.message || t('groupCreationError'));
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Toggle sélection d'un ami
  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
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
                  {tab === 'friends' ? t('friends') : tab === 'class' ? t('class') : t('global')}
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
            <Text style={styles.positionLabel}>{t('yourPosition') || 'Your position'}</Text>
            <View style={styles.positionContent}>
              <View style={styles.positionAvatar}>
                <Text style={styles.positionAvatarText}>{currentUser.name.charAt(0)}</Text>
              </View>
              <View style={styles.positionStats}>
                <View style={styles.positionRankRow}>
                  <Text style={styles.positionRank}>#{currentUser.rank}</Text>
                  <Text style={styles.positionContext}>
                    {activeTab === 'friends' ? (t('amongFriends') || 'among friends') : 
                     activeTab === 'class' ? (t('inYourClass') || 'in your class') : 
                     (t('globally') || 'globally')}
                  </Text>
                </View>
                <View style={styles.positionMeta}>
                  <Text style={styles.positionMetaText}>{currentUser.streak} {t('daysStreak')}</Text>
                  <Text style={styles.positionMetaText}>•</Text>
                  <Text style={styles.positionMetaText}>{currentUser.focusSessions} {t('sessions')}</Text>
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
          <TouchableOpacity 
            style={styles.inviteCard} 
            activeOpacity={0.7}
            onPress={() => router.push('/invite')}
          >
            <Text style={styles.inviteText}>Invite someone to stay consistent with you</Text>
            <Text style={styles.inviteCTA}>Invite a friend →</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Group Selection (for Class tab) */}
        {activeTab === 'class' && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.groupsContainer}>
            <View style={styles.groupsHeader}>
              <Text style={styles.groupsHeaderTitle}>Mes groupes</Text>
              <TouchableOpacity
                style={styles.createGroupButton}
                onPress={handleCreateGroup}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color="#16A34A" />
                  <Text style={styles.createGroupButtonText}>{t('create')}</Text>
              </TouchableOpacity>
            </View>
            {loadingGroups ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.loadingText}>{t('loadingGroups') || t('loading')}</Text>
              </View>
            ) : groups.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun groupe trouvé</Text>
                <Text style={styles.emptySubtext}>Créez un groupe pour commencer</Text>
              </View>
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.groupsScrollView}
                contentContainerStyle={styles.groupsScrollContent}
              >
                {groups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.groupCard,
                      selectedGroup?.id === group.id && styles.groupCardSelected
                    ]}
                    onPress={() => handleGroupSelect(group)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.groupCardTitle,
                      selectedGroup?.id === group.id && styles.groupCardTitleSelected
                    ]}>
                      {group.name}
                    </Text>
                    {group.memberCount && (
                      <Text style={styles.groupCardSubtitle}>
                        {group.memberCount} membres
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        )}

        {/* Leaderboard List */}
        <View style={styles.listContainer}>
          {activeTab === 'friends' && loadingFriends ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.loadingText}>{t('loadingFriends') || t('loading')}</Text>
            </View>
          ) : activeTab === 'class' && loadingClassData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.loadingText}>{t('loadingLeaderboard')}</Text>
            </View>
          ) : data.length === 0 && activeTab === 'friends' ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun ami trouvé</Text>
              <Text style={styles.emptySubtext}>Ajoutez des amis pour voir leur classement</Text>
            </View>
          ) : data.length === 0 && activeTab === 'class' ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun classement disponible</Text>
              <Text style={styles.emptySubtext}>Sélectionnez un groupe ci-dessus</Text>
            </View>
          ) : (
            data.map((user, index) => {
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
                          <Text style={styles.userMetaText}>{user.streak}{t('daysStreak').charAt(0)}</Text>
                          <Text style={styles.userMetaText}>•</Text>
                          <Text style={styles.userMetaText}>{user.focusSessions} {t('sessions')}</Text>
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
          }))}
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

      {/* Create Group Modal */}
      <Modal
        visible={showCreateGroupModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateGroupModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('createGroup')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCreateGroupModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Group Name */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>{t('groupName')} *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  placeholder={t('groupNamePlaceholder') || 'Ex: Ma classe de Mathématiques'}
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                />
              </View>

              {/* Group Description */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>{t('groupDescription')} ({t('optional') || 'optionnel'})</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={newGroupDescription}
                  onChangeText={setNewGroupDescription}
                  placeholder={t('describeGroup') || 'Décrivez votre groupe...'}
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Invite Friends */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>{t('inviteFriends')}</Text>
                {availableFriends.length === 0 ? (
                  <Text style={styles.modalHint}>{t('noFriendsAvailable') || 'Aucun ami disponible'}</Text>
                ) : (
                  <View style={styles.friendsList}>
                    {availableFriends.map((friend) => (
                      <TouchableOpacity
                        key={friend.id}
                        style={[
                          styles.friendItem,
                          selectedFriendIds.includes(friend.id) && styles.friendItemSelected
                        ]}
                        onPress={() => toggleFriendSelection(friend.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.friendItemContent}>
                          <View style={styles.friendAvatar}>
                            <Text style={styles.friendAvatarText}>{friend.name.charAt(0)}</Text>
                          </View>
                          <Text style={styles.friendName}>{friend.name}</Text>
                        </View>
                        {selectedFriendIds.includes(friend.id) && (
                          <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.modalSubmitButton, isCreatingGroup && styles.modalSubmitButtonDisabled]}
                onPress={handleSubmitGroup}
                activeOpacity={0.8}
                disabled={isCreatingGroup}
              >
                {isCreatingGroup ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>{t('createGroup')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
    flex: 1,
    padding: 24,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalField: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  modalInput: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#000000',
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalHint: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    fontStyle: 'italic',
  },
  friendsList: {
    gap: 12,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  friendItemSelected: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  friendItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  modalSubmitButton: {
    width: '100%',
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSubmitButtonDisabled: {
    opacity: 0.6,
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  groupsContainer: {
    marginBottom: 24,
  },
  groupsScrollView: {
    marginHorizontal: -24,
  },
  groupsScrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  groupCard: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    minWidth: 120,
  },
  groupCardSelected: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  groupCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  groupCardTitleSelected: {
    color: '#16A34A',
  },
  groupCardSubtitle: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupsHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  createGroupButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  modalField: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  modalInput: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#000000',
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalHint: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    fontStyle: 'italic',
  },
  friendsList: {
    gap: 12,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  friendItemSelected: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  friendItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  modalSubmitButton: {
    width: '100%',
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSubmitButtonDisabled: {
    opacity: 0.6,
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

