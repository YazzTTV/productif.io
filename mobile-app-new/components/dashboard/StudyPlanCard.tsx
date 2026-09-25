import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Switch, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { studyPlanService, type StudyBlock } from '@/lib/api';
import { syncStudyPlan } from '@/lib/studyPlanSync';
import { useStudyPlanCopy } from '@/hooks/useStudyPlanSync';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getAuthorizationStatus,
  hasBlockedAppsConfigured,
  isAppBlockingSupported,
  requestAuthorization,
} from '@/utils/appBlocking';
import { getScheduledAutoBlocks, isAutoBlockEnabled, setAutoBlockEnabled } from '@/utils/autoBlocking';
import { hasExamModeAccess } from '@/utils/premium';

type AutoBlockView =
  | { kind: 'hidden' }
  | { kind: 'off' }
  | { kind: 'on'; scheduled: number }
  | { kind: 'not_authorized' }
  | { kind: 'no_selection' };

async function readAutoBlockView(): Promise<AutoBlockView> {
  if (Platform.OS !== 'ios' || !isAppBlockingSupported()) return { kind: 'hidden' };
  if (!(await isAutoBlockEnabled())) return { kind: 'off' };
  if (getAuthorizationStatus() !== 'approved') return { kind: 'not_authorized' };
  if (!hasBlockedAppsConfigured()) return { kind: 'no_selection' };
  const now = Date.now();
  const scheduled = (await getScheduledAutoBlocks()).filter((b) => b.end > now).length;
  return { kind: 'on', scheduled };
}

const MAX_ROWS = 6;

const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const dayOffset = (iso: string) => {
  const start = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(start);
  day.setHours(0, 0, 0, 0);
  return Math.round((day.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
};

/**
 * Les blocs de revision places par le planificateur automatique : aujourd'hui,
 * puis demain. Avant cette carte, aucun ecran ne montrait un chapitre avec son
 * heure, donc un planning pouvait exister en base sans que l'etudiant le voie.
 */
export function StudyPlanCard() {
  const router = useRouter();
  const { t } = useLanguage();
  const copy = useStudyPlanCopy();
  const [blocks, setBlocks] = useState<StudyBlock[] | null>(null);
  const [autoBlock, setAutoBlock] = useState<AutoBlockView>({ kind: 'hidden' });

  const load = useCallback(async () => {
    try {
      // La synchronisation (creneaux Apple, calendrier, rappels) est limitee a
      // une toutes les 3 min ; la lecture des blocs, elle, est toujours fraiche.
      await syncStudyPlan(copy);
      const { blocks: fresh } = await studyPlanService.getBlocks(7);
      setBlocks(fresh.filter((b) => new Date(b.end).getTime() > Date.now()));
      setAutoBlock(await readAutoBlockView());
    } catch {
      setBlocks((current) => current ?? []);
    }
  }, [copy]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onToggleAutoBlock = async (next: boolean) => {
    if (!next) {
      await setAutoBlockEnabled(false);
      setAutoBlock(await readAutoBlockView());
      return;
    }
    // Premium, comme le Mode Examen dont c'est le prolongement.
    if (!(await hasExamModeAccess())) {
      router.push('/exam/preview');
      return;
    }
    if (getAuthorizationStatus() !== 'approved') {
      const granted = await requestAuthorization();
      if (!granted) {
        Alert.alert(t('autoBlockToggle'), t('autoBlockAuthDenied'));
        return;
      }
    }
    await setAutoBlockEnabled(true);
    if (!hasBlockedAppsConfigured()) {
      setAutoBlock({ kind: 'no_selection' });
      router.push('/exam/blocked-apps');
      return;
    }
    await syncStudyPlan(copy, { force: true });
    setAutoBlock(await readAutoBlockView());
  };

  if (blocks === null) return null;

  const soon = blocks.filter((b) => dayOffset(b.start) <= 1);
  const rows = soon.slice(0, MAX_ROWS);
  const moreThisWeek = blocks.length - rows.length;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{t('studyPlanTitle')}</Text>
      <View style={styles.card}>
        {rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('studyPlanEmpty')}</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/tasks-new')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>{t('studyPlanAddSubjects')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>{t('studyPlanSubtitle')}</Text>
            {rows.map((block, index) => {
              const offset = dayOffset(block.start);
              const showDay = index === 0 || dayOffset(rows[index - 1].start) !== offset;
              return (
                <View key={block.taskId}>
                  {showDay ? (
                    <Text style={styles.dayLabel}>
                      {offset === 0 ? t('studyPlanToday') : t('studyPlanTomorrow')}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    style={styles.row}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({
                        pathname: '/focus',
                        params: {
                          taskId: block.taskId,
                          title: block.title,
                          subject: block.subjectName ?? '',
                          duration: block.minutes,
                        },
                      } as any)
                    }
                  >
                    <Text style={styles.time}>{hhmm(block.start)}</Text>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {block.title}
                      </Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {[block.subjectName, `${block.minutes} min`].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(0, 0, 0, 0.35)" />
                  </TouchableOpacity>
                </View>
              );
            })}
            {moreThisWeek > 0 ? (
              <Text style={styles.more}>{t('studyPlanMore', { count: moreThisWeek })}</Text>
            ) : null}
            {autoBlock.kind !== 'hidden' ? (
              <View style={styles.autoBlock}>
                <View style={styles.autoBlockRow}>
                  <Text style={styles.autoBlockLabel}>{t('autoBlockToggle')}</Text>
                  <Switch
                    value={autoBlock.kind !== 'off'}
                    onValueChange={onToggleAutoBlock}
                    trackColor={{ false: 'rgba(0, 0, 0, 0.15)', true: '#16A34A' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                {autoBlock.kind === 'on' ? (
                  <Text style={styles.autoBlockHint}>{t('autoBlockOn', { count: autoBlock.scheduled })}</Text>
                ) : null}
                {autoBlock.kind === 'not_authorized' ? (
                  <Text style={styles.autoBlockWarning}>{t('autoBlockNotAuthorized')}</Text>
                ) : null}
                {autoBlock.kind === 'no_selection' ? (
                  <TouchableOpacity onPress={() => router.push('/exam/blocked-apps')} activeOpacity={0.7}>
                    <Text style={styles.autoBlockWarning}>
                      {t('autoBlockNoSelection')} <Text style={styles.autoBlockLink}>{t('autoBlockChooseApps')}</Text>
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 12,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(22, 163, 74, 0.25)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0,
    shadowRadius: 8,
    elevation: 0,
    gap: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.5)',
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
    marginTop: 10,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  time: {
    width: 48,
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    fontVariant: ['tabular-nums'],
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  rowMeta: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.55)',
    marginTop: 2,
  },
  more: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 6,
  },
  autoBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    gap: 6,
  },
  autoBlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  autoBlockLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  autoBlockHint: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(0, 0, 0, 0.55)',
  },
  autoBlockWarning: {
    fontSize: 13,
    lineHeight: 18,
    color: '#B45309',
  },
  autoBlockLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  empty: {
    gap: 14,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#374151',
  },
  emptyButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#16A34A',
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
