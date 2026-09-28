/**
 * Onglet Communauté.
 *
 * Classement sur les minutes de révision des 7 derniers jours (séances Focus et
 * Mode Examen déjà synchronisées par lib/studyAnalysis.ts), calculé côté serveur
 * dans lib/community.ts. Trois vues :
 *  - Amis : ajoutés par code ou par lien, amitié mutuelle, gratuit.
 *  - Groupes : une promo, une classe, rejointe par code, gratuit.
 *  - Global : Premium.
 *
 * Avant le 28 septembre, « Amis » lisait les collègues d'une ENTREPRISE (reste
 * de la version entrepreneurs) et « Classe » ne se rejoignait pas : l'écran
 * était vide pour 100 % des étudiants.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authService,
  communityService,
  type CommunityEntry,
  type CommunityGroup,
  type CommunityLeaderboard,
} from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSuperwall } from '@/hooks/useSuperwall';
import { SUPERWALL_EVENTS } from '@/lib/superwallEvents';
import { takePendingCommunityCode } from '@/lib/communityPendingCode';

type Tab = 'friends' | 'groups' | 'global';

const SELECTED_GROUP_KEY = 'favorite_group_id';
const GREEN = '#16A34A';

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m.toString().padStart(2, '0')}`;
}

export function LeaderboardEnhanced() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { triggerEvent } = useSuperwall();

  const [tab, setTab] = useState<Tab>('friends');
  const [isPremium, setIsPremium] = useState(false);
  const [me, setMe] = useState<{ friendCode: string; shareUrl: string } | null>(null);
  const [board, setBoard] = useState<CommunityLeaderboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CommunityEntry | null>(null);
  // Ignore la réponse d'un chargement dépassé par un changement d'onglet.
  const requestId = useRef(0);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  const loadBoard = useCallback(
    async (nextTab: Tab, groupId: string | null) => {
      const id = ++requestId.current;
      setLoadError(false);
      if (nextTab === 'groups' && !groupId) {
        setBoard(null);
        return;
      }
      setLoading(true);
      try {
        const scope = nextTab === 'friends' ? 'friends' : nextTab === 'groups' ? 'group' : 'global';
        const result = await communityService.leaderboard(scope, groupId ?? undefined);
        if (id === requestId.current) setBoard(result);
      } catch (error) {
        if (id === requestId.current) {
          setBoard(null);
          setLoadError(true);
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [],
  );

  const loadGroups = useCallback(async (): Promise<string | null> => {
    try {
      const list = await communityService.groups();
      setGroups(list);
      const stored = await AsyncStorage.getItem(SELECTED_GROUP_KEY);
      const pick = list.find((g) => g.id === stored)?.id ?? list[0]?.id ?? null;
      setSelectedGroupId(pick);
      return pick;
    } catch {
      setGroups([]);
      return null;
    }
  }, []);

  const applyCode = useCallback(
    async (raw: string, silentSuccess = false) => {
      const code = raw.replace(/[\s-]/g, '').toUpperCase();
      if (code.length < 4) {
        Alert.alert(t('cmCodeInvalid'));
        return;
      }
      setJoining(true);
      try {
        const result = await communityService.join(code);
        setCodeInput('');
        if (result.type === 'friend') {
          const message = result.alreadyFriends
            ? t('cmAlreadyFriends', { name: result.friend.name })
            : t('cmFriendAdded', { name: result.friend.name });
          if (!silentSuccess || !result.alreadyFriends) Alert.alert(message);
          setTab('friends');
          await loadBoard('friends', null);
        } else {
          const message = result.alreadyMember
            ? t('cmAlreadyMember', { name: result.group.name })
            : t('cmGroupJoined', { name: result.group.name });
          if (!silentSuccess || !result.alreadyMember) Alert.alert(message);
          await AsyncStorage.setItem(SELECTED_GROUP_KEY, result.group.id);
          await loadGroups();
          setSelectedGroupId(result.group.id);
          setTab('groups');
          await loadBoard('groups', result.group.id);
        }
      } catch (error: any) {
        const reason = error?.errorData?.error ?? error?.message;
        Alert.alert(
          reason === 'own_code'
            ? t('cmOwnCode')
            : reason === 'not_found'
              ? t('cmCodeNotFound')
              : reason === 'invalid_code'
                ? t('cmCodeInvalid')
                : t('cmLoadError'),
        );
      } finally {
        setJoining(false);
      }
    },
    [loadBoard, loadGroups, t],
  );

  useEffect(() => {
    (async () => {
      try {
        const user = await authService.checkAuth();
        setIsPremium(Boolean(user?.isPremium || user?.plan === 'premium'));
      } catch {
        setIsPremium(false);
      }
      try {
        setMe(await communityService.me());
      } catch {
        setMe(null);
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        // Invitation ouverte par lien : elle passe avant tout le reste.
        const pending = await takePendingCommunityCode();
        if (pending) {
          await applyCode(pending, true);
          return;
        }
        if (tab === 'groups') {
          const groupId = await loadGroups();
          await loadBoard('groups', groupId);
        } else {
          if (tab === 'friends') void loadGroups();
          await loadBoard(tab, null);
        }
      })();
      // Rechargé à chaque retour sur l'onglet, sur l'onglet affiché.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    const groupId = tab === 'groups' ? await loadGroups() : null;
    await loadBoard(tab, groupId);
    setRefreshing(false);
  };

  const onTabPress = (next: Tab) => {
    if (next === 'global' && !isPremium) {
      triggerEvent(SUPERWALL_EVENTS.FEATURE_LOCKED, { params: { source: 'community_global_tab' } });
      return;
    }
    setBoard(null);
    setTab(next);
  };

  const onSelectGroup = async (group: CommunityGroup) => {
    setSelectedGroupId(group.id);
    await AsyncStorage.setItem(SELECTED_GROUP_KEY, group.id);
    await loadBoard('groups', group.id);
  };

  const shareFriendInvite = async () => {
    if (!me) return;
    try {
      await Share.share({ message: t('cmShareMessage', { url: me.shareUrl, code: me.friendCode }) });
    } catch {
      // Feuille de partage fermée : rien à faire.
    }
  };

  const shareGroupInvite = async (group: CommunityGroup) => {
    try {
      await Share.share({
        message: t('cmShareGroupMessage', { name: group.name, url: group.shareUrl, code: group.code }),
      });
    } catch {
      // Feuille de partage fermée.
    }
  };

  const submitNewGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const group = await communityService.createGroup(name);
      setShowCreate(false);
      setNewGroupName('');
      await AsyncStorage.setItem(SELECTED_GROUP_KEY, group.id);
      await loadGroups();
      setSelectedGroupId(group.id);
      await loadBoard('groups', group.id);
      // Un groupe seul ne sert à rien : on propose l'invitation tout de suite.
      await shareGroupInvite(group);
    } catch {
      Alert.alert(t('cmLoadError'));
    } finally {
      setCreating(false);
    }
  };

  const confirmLeaveGroup = (group: CommunityGroup) => {
    Alert.alert(group.name, t('cmLeaveGroupConfirm'), [
      { text: t('cmCancel'), style: 'cancel' },
      {
        text: t('cmLeaveGroup'),
        style: 'destructive',
        onPress: async () => {
          try {
            await communityService.leaveGroup(group.id);
          } catch {
            Alert.alert(t('cmLoadError'));
          }
          const next = await loadGroups();
          await loadBoard('groups', next);
        },
      },
    ]);
  };

  const confirmRemoveFriend = (entry: CommunityEntry) => {
    Alert.alert(entry.name, t('cmRemoveFriendConfirm', { name: entry.name }), [
      { text: t('cmCancel'), style: 'cancel' },
      {
        text: t('cmRemoveFriend'),
        style: 'destructive',
        onPress: async () => {
          setSelectedEntry(null);
          try {
            await communityService.removeFriend(entry.userId);
          } catch {
            Alert.alert(t('cmLoadError'));
          }
          await loadBoard(tab, selectedGroupId);
        },
      },
    ]);
  };

  const entries = board?.entries ?? [];
  const myEntry = board?.me ?? null;
  const others = entries.filter((e) => !e.isMe);
  const sessionsLabel = (n: number) => (n === 1 ? t('cmOneSession') : t('cmSessions', { n }));

  const renderCodeRow = () => (
    <View style={styles.codeRow}>
      <TextInput
        style={styles.codeInput}
        value={codeInput}
        onChangeText={setCodeInput}
        placeholder={t('cmCodePlaceholder')}
        placeholderTextColor="rgba(0, 0, 0, 0.35)"
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={() => codeInput.trim() && applyCode(codeInput)}
        maxLength={32}
      />
      <TouchableOpacity
        style={[styles.codeButton, (!codeInput.trim() || joining) && styles.codeButtonDisabled]}
        onPress={() => applyCode(codeInput)}
        disabled={!codeInput.trim() || joining}
        activeOpacity={0.8}
      >
        {joining ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.codeButtonText}>{t('cmAdd')}</Text>}
      </TouchableOpacity>
    </View>
  );

  const renderEntry = (entry: CommunityEntry, index: number) => (
    <Animated.View key={entry.userId} entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(300)}>
      <TouchableOpacity
        style={[styles.row, entry.isMe && styles.rowMe]}
        onPress={() => !entry.isMe && setSelectedEntry(entry)}
        activeOpacity={entry.isMe ? 1 : 0.7}
      >
        <Text style={[styles.rowRank, entry.rank <= 3 && styles.rowRankTop]}>{entry.rank}</Text>
        <View style={[styles.avatar, entry.isMe && styles.avatarMe]}>
          <Text style={[styles.avatarText, entry.isMe && styles.avatarTextMe]}>{entry.name.charAt(0)}</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>
            {entry.isMe ? t('cmMe') : entry.name}
          </Text>
          <Text style={styles.rowMeta}>
            {sessionsLabel(entry.weekSessions)} · {t('cmLevel', { n: entry.level })}
          </Text>
        </View>
        <Text style={[styles.rowMinutes, entry.weekMinutes === 0 && styles.rowMinutesZero]}>
          {formatMinutes(entry.weekMinutes)}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderList = () => {
    if (loading && !board) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={GREEN} />
        </View>
      );
    }
    if (loadError) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyBody}>{t('cmLoadError')}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.linkButton}>
            <Text style={styles.linkButtonText}>{t('cmRetry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (tab === 'friends' && others.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t('cmNoFriendsTitle')}</Text>
          <Text style={styles.emptyBody}>{t('cmNoFriendsBody')}</Text>
        </View>
      );
    }
    if (tab === 'groups' && groups.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t('cmNoGroupsTitle')}</Text>
          <Text style={styles.emptyBody}>{t('cmNoGroupsBody')}</Text>
        </View>
      );
    }
    if (tab === 'global' && entries.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyBody}>{t('cmGlobalEmpty')}</Text>
        </View>
      );
    }
    return <View style={styles.list}>{entries.map(renderEntry)}</View>;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('community')}</Text>
          <Text style={styles.subtitle}>{t('cmSubtitle')}</Text>
        </View>

        <View style={styles.tabs}>
          {(['friends', 'groups', 'global'] as const).map((key) => {
            const locked = key === 'global' && !isPremium;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.tab, tab === key && styles.tabActive]}
                onPress={() => onTabPress(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, tab === key && styles.tabTextActive, locked && styles.tabTextLocked]}>
                  {key === 'friends' ? t('friends') : key === 'groups' ? t('cmTabGroups') : t('global')}
                </Text>
                {locked && <Ionicons name="lock-closed" size={12} color="rgba(0,0,0,0.35)" style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ta semaine : toujours là, même seul, pour que l'écran ne soit jamais vide. */}
        {myEntry && (
          <View style={styles.weekCard}>
            <Text style={styles.weekLabel}>{t('cmYourWeek')}</Text>
            <View style={styles.weekRow}>
              <Text style={styles.weekMinutes}>{formatMinutes(myEntry.weekMinutes)}</Text>
              {entries.length > 1 && (
                <Text style={styles.weekRank}>{t('cmRankAmong', { rank: myEntry.rank, total: board?.total ?? entries.length })}</Text>
              )}
            </View>
            <Text style={styles.weekMeta}>
              {t('cmStudied')} · {sessionsLabel(myEntry.weekSessions)}
            </Text>
            {myEntry.weekMinutes === 0 && (
              <TouchableOpacity onPress={() => router.push('/exam-mode')} style={styles.weekCta} activeOpacity={0.8}>
                <Text style={styles.weekCtaText}>{t('cmStartSession')}</Text>
                <Ionicons name="arrow-forward" size={16} color={GREEN} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {tab === 'friends' && (
          <View style={styles.inviteCard}>
            <Text style={styles.inviteTitle}>{t('cmInviteTitle')}</Text>
            <Text style={styles.inviteBody}>{t('cmInviteBody')}</Text>
            <TouchableOpacity
              style={[styles.primaryButton, !me && styles.codeButtonDisabled]}
              onPress={shareFriendInvite}
              disabled={!me}
              activeOpacity={0.85}
            >
              <Ionicons name="share-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{t('inviteFriend')}</Text>
            </TouchableOpacity>
            {me && (
              <Text style={styles.myCode}>
                {t('cmYourCode')} : <Text style={styles.myCodeValue}>{me.friendCode}</Text>
              </Text>
            )}
            <Text style={styles.codeLabel}>{t('cmHaveCode')}</Text>
            {renderCodeRow()}
          </View>
        )}

        {tab === 'groups' && (
          <View style={styles.groupsBlock}>
            {groups.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {groups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={[styles.chip, selectedGroupId === group.id && styles.chipActive]}
                    onPress={() => onSelectGroup(group)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selectedGroupId === group.id && styles.chipTextActive]} numberOfLines={1}>
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.chipAdd} onPress={() => setShowCreate(true)} activeOpacity={0.7}>
                  <Ionicons name="add" size={18} color={GREEN} />
                </TouchableOpacity>
              </ScrollView>
            )}

            {selectedGroup && (
              <View style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName} numberOfLines={1}>{selectedGroup.name}</Text>
                    <Text style={styles.groupMeta}>
                      {selectedGroup.memberCount === 1 ? t('cmOneMember') : t('cmMembers', { n: selectedGroup.memberCount })}
                      {' · '}
                      {selectedGroup.code}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmLeaveGroup(selectedGroup)} hitSlop={10}>
                    <Ionicons name="exit-outline" size={20} color="rgba(0,0,0,0.35)" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.primaryButton} onPress={() => shareGroupInvite(selectedGroup)} activeOpacity={0.85}>
                  <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>{t('cmInviteToGroup')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {groups.length === 0 && (
              <TouchableOpacity style={styles.primaryButton} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>{t('cmCreateGroup')}</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.codeLabel}>{t('cmHaveCode')}</Text>
            {renderCodeRow()}
          </View>
        )}

        {tab === 'global' && board?.locked && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('cmGlobalLockedTitle')}</Text>
            <Text style={styles.emptyBody}>{t('cmGlobalLockedBody')}</Text>
          </View>
        )}

        {!(tab === 'global' && board?.locked) && renderList()}

        <Text style={styles.privacy}>{t('cmPrivacyNote')}</Text>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Création de groupe */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowCreate(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('cmCreateGroup')}</Text>
            <TextInput
              style={styles.sheetInput}
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder={t('cmGroupNamePlaceholder')}
              placeholderTextColor="rgba(0, 0, 0, 0.35)"
              autoFocus
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={submitNewGroup}
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowCreate(false)} activeOpacity={0.7}>
                <Text style={styles.secondaryButtonText}>{t('cmCancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, styles.sheetPrimary, (!newGroupName.trim() || creating) && styles.codeButtonDisabled]}
                onPress={submitNewGroup}
                disabled={!newGroupName.trim() || creating}
                activeOpacity={0.85}
              >
                {creating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{t('cmCreate')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fiche d'un membre */}
      <Modal visible={selectedEntry !== null} transparent animationType="fade" onRequestClose={() => setSelectedEntry(null)}>
        {selectedEntry && (
          <View style={styles.overlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSelectedEntry(null)} />
            <View style={styles.sheet}>
              <View style={styles.profileHeader}>
                <View style={[styles.avatar, styles.avatarLarge]}>
                  <Text style={[styles.avatarText, styles.avatarTextLarge]}>{selectedEntry.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>{selectedEntry.name}</Text>
                  <Text style={styles.groupMeta}>#{selectedEntry.rank}</Text>
                </View>
              </View>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{formatMinutes(selectedEntry.weekMinutes)}</Text>
                  <Text style={styles.statLabel}>{t('cmWeekLabel')}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{selectedEntry.weekSessions}</Text>
                  <Text style={styles.statLabel}>{sessionsLabel(selectedEntry.weekSessions).replace(/^\d+\s*/, '')}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{selectedEntry.level}</Text>
                  <Text style={styles.statLabel}>{t('cmLevel', { n: '' }).trim()}</Text>
                </View>
              </View>
              {selectedEntry.isFriend && (
                <TouchableOpacity onPress={() => confirmRemoveFriend(selectedEntry)} style={styles.linkButton}>
                  <Text style={styles.removeText}>{t('cmRemoveFriend')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24 },
  header: { marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '600', letterSpacing: -1.2, color: '#000000', marginBottom: 4 },
  subtitle: { fontSize: 16, color: 'rgba(0, 0, 0, 0.55)' },

  tabs: { flexDirection: 'row', backgroundColor: 'rgba(0, 0, 0, 0.04)', borderRadius: 20, padding: 4, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 16 },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: { fontSize: 15, fontWeight: '500', color: 'rgba(0, 0, 0, 0.55)' },
  tabTextActive: { color: '#000000', fontWeight: '600' },
  tabTextLocked: { color: 'rgba(0, 0, 0, 0.35)' },

  weekCard: { borderRadius: 24, backgroundColor: 'rgba(22, 163, 74, 0.08)', padding: 20, marginBottom: 16 },
  weekLabel: { fontSize: 12, fontWeight: '600', color: GREEN, textTransform: 'uppercase', letterSpacing: 1 },
  weekRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 },
  weekMinutes: { fontSize: 36, fontWeight: '700', letterSpacing: -1, color: '#000000' },
  weekRank: { fontSize: 16, fontWeight: '600', color: GREEN },
  weekMeta: { fontSize: 14, color: 'rgba(0, 0, 0, 0.5)', marginTop: 2 },
  weekCta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  weekCtaText: { fontSize: 15, fontWeight: '600', color: GREEN },

  inviteCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.06)', padding: 20, marginBottom: 20 },
  inviteTitle: { fontSize: 18, fontWeight: '600', color: '#000000' },
  inviteBody: { fontSize: 14, color: 'rgba(0, 0, 0, 0.55)', marginTop: 4, marginBottom: 16, lineHeight: 20 },
  myCode: { fontSize: 14, color: 'rgba(0, 0, 0, 0.5)', textAlign: 'center', marginTop: 12 },
  myCodeValue: { fontWeight: '700', color: '#000000', letterSpacing: 2 },
  codeLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(0, 0, 0, 0.4)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  codeRow: { flexDirection: 'row', gap: 8 },
  codeInput: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#000000',
    letterSpacing: 1,
  },
  codeButton: { height: 48, borderRadius: 16, backgroundColor: '#000000', paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' },
  codeButtonDisabled: { opacity: 0.4 },
  codeButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GREEN,
    borderRadius: 16,
    paddingVertical: 14,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.05)' },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', color: '#000000' },

  groupsBlock: { marginBottom: 20 },
  chips: { gap: 8, paddingBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.1)', maxWidth: 200 },
  chipActive: { borderColor: GREEN, backgroundColor: 'rgba(22, 163, 74, 0.08)' },
  chipText: { fontSize: 14, fontWeight: '500', color: 'rgba(0, 0, 0, 0.6)' },
  chipTextActive: { color: GREEN, fontWeight: '600' },
  chipAdd: { width: 38, height: 38, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(22, 163, 74, 0.4)', justifyContent: 'center', alignItems: 'center' },
  groupCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.06)', padding: 20, gap: 14 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupName: { fontSize: 18, fontWeight: '600', color: '#000000' },
  groupMeta: { fontSize: 14, color: 'rgba(0, 0, 0, 0.5)', marginTop: 2 },

  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.05)' },
  rowMe: { borderColor: 'rgba(22, 163, 74, 0.35)', backgroundColor: 'rgba(22, 163, 74, 0.04)' },
  rowRank: { width: 22, fontSize: 15, fontWeight: '600', color: 'rgba(0, 0, 0, 0.4)', textAlign: 'center' },
  rowRankTop: { color: GREEN },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 0, 0, 0.05)', justifyContent: 'center', alignItems: 'center' },
  avatarMe: { backgroundColor: 'rgba(22, 163, 74, 0.15)' },
  avatarText: { fontSize: 16, fontWeight: '600', color: 'rgba(0, 0, 0, 0.6)' },
  avatarTextMe: { color: GREEN },
  avatarLarge: { width: 56, height: 56, borderRadius: 28 },
  avatarTextLarge: { fontSize: 22 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '600', color: '#000000' },
  rowMeta: { fontSize: 13, color: 'rgba(0, 0, 0, 0.45)', marginTop: 2 },
  rowMinutes: { fontSize: 16, fontWeight: '700', color: '#000000' },
  rowMinutesZero: { color: 'rgba(0, 0, 0, 0.3)' },

  center: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyCard: { borderRadius: 24, backgroundColor: 'rgba(0, 0, 0, 0.03)', padding: 20, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#000000', marginBottom: 4 },
  emptyBody: { fontSize: 14, color: 'rgba(0, 0, 0, 0.55)', lineHeight: 20, textAlign: 'left' },
  linkButton: { paddingVertical: 8, alignItems: 'center' },
  linkButtonText: { fontSize: 15, fontWeight: '600', color: GREEN },
  removeText: { fontSize: 15, fontWeight: '600', color: '#DC2626' },
  privacy: { fontSize: 12, color: 'rgba(0, 0, 0, 0.35)', textAlign: 'center', marginTop: 24 },

  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, gap: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: '#000000' },
  sheetInput: { height: 52, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.1)', paddingHorizontal: 16, fontSize: 16, color: '#000000' },
  sheetActions: { flexDirection: 'row', gap: 12 },
  sheetPrimary: { flex: 1 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderRadius: 18, backgroundColor: 'rgba(0, 0, 0, 0.03)', paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#000000' },
  statLabel: { fontSize: 12, color: 'rgba(0, 0, 0, 0.45)', marginTop: 2 },
});
