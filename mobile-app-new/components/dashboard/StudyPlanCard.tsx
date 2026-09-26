import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Switch, Alert, Linking, AppState } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { studyPlanService, subjectsService, type StudyBlock } from '@/lib/api';
import { syncStudyPlan } from '@/lib/studyPlanSync';
import { onPlanChanged } from '@/lib/planRefresh';
import { useStudyPlanCopy } from '@/hooks/useStudyPlanSync';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSuperwall } from '@/hooks/useSuperwall';
import { SUPERWALL_EVENTS } from '@/lib/superwallEvents';
import {
  getAuthorizationStatus,
  hasBlockedAppsConfigured,
  isAppBlockingSupported,
  requestAuthorization,
  resolveAuthorizationStatus,
} from '@/utils/appBlocking';
import { getLastAutoBlockReport, getScheduledAutoBlocks, isAutoBlockEnabled, setAutoBlockEnabled } from '@/utils/autoBlocking';
import { freeSessionsLeftLabel, getExamAccess, hasExamModeAccess, type ExamAccess } from '@/utils/premium';
import { getPushPermissionStatus, maybePrimePushPermission, requestPushPermissionAndRegisterToken } from '@/lib/pushPermission';

/**
 * Derniere proposition Premium faite depuis un bloc du planning. Une par jour au
 * plus : a chaque toucher, ce serait une alerte de plus entre l'etudiant et sa
 * revision, et le Focus gratuit doit rester a un geste.
 */
const PLAN_PREMIUM_OFFER_KEY = 'study_plan_premium_offer_at';
const PLAN_PREMIUM_OFFER_EVERY_MS = 24 * 60 * 60 * 1000;

async function shouldOfferPremiumFromPlan(): Promise<boolean> {
  try {
    const last = Number(await AsyncStorage.getItem(PLAN_PREMIUM_OFFER_KEY));
    if (Number.isFinite(last) && last > 0 && Date.now() - last < PLAN_PREMIUM_OFFER_EVERY_MS) return false;
    await AsyncStorage.setItem(PLAN_PREMIUM_OFFER_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

type AutoBlockView =
  | { kind: 'hidden' }
  | { kind: 'off' }
  | { kind: 'on'; scheduled: number; failed: number; error: string | null }
  | { kind: 'not_authorized' }
  | { kind: 'no_selection' };

async function readAutoBlockView(): Promise<AutoBlockView> {
  if (Platform.OS !== 'ios' || !isAppBlockingSupported()) return { kind: 'hidden' };
  if (!(await isAutoBlockEnabled())) return { kind: 'off' };
  if ((await resolveAuthorizationStatus()) !== 'approved') return { kind: 'not_authorized' };
  if (!hasBlockedAppsConfigured()) return { kind: 'no_selection' };
  const now = Date.now();
  const scheduled = (await getScheduledAutoBlocks()).filter((b) => b.end > now).length;
  const report = await getLastAutoBlockReport();
  return { kind: 'on', scheduled, failed: report?.failed ?? 0, error: report?.error ?? null };
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
  const { triggerEvent } = useSuperwall();
  const [blocks, setBlocks] = useState<StudyBlock[] | null>(null);
  // Premium ou seances offertes : decide ou mene le toucher d'un bloc.
  const [examAccess, setExamAccess] = useState<ExamAccess | null>(null);
  // Lu seulement quand le planning est vide : sans matiere, la carte propose de
  // construire le planning ; avec des matieres, il manque des chapitres ou des
  // dates, et c'est l'ecran des taches qui les ajoute.
  const [hasSubjects, setHasSubjects] = useState<boolean | null>(null);
  const [openingBlock, setOpeningBlock] = useState(false);
  const [autoBlock, setAutoBlock] = useState<AutoBlockView>({ kind: 'hidden' });
  const [toggling, setToggling] = useState(false);
  // Statut des notifications : sans elles, ni rappel 10 min avant ni « Bloc
  // demarre ». Un compte reconnecte sur une nouvelle installation n'etait
  // sollicite nulle part hors onboarding.
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  // Pose quand l'interrupteur envoie choisir les applis : au retour, la
  // synchronisation doit etre FORCEE. Sans ca elle tombait dans la limite des
  // 3 min et la carte affichait « 0 programme » juste apres le choix des applis
  // (25 septembre, 1.4 (20)) : le premier usage de chaque utilisateur.
  const pendingSelectionRef = useRef(false);

  const load = useCallback(async () => {
    try {
      // Les blocs d'abord : la carte s'affiche sans attendre la synchronisation,
      // qui peut attendre plusieurs secondes le statut Temps d'ecran au
      // demarrage a froid.
      const { blocks: fresh } = await studyPlanService.getBlocks(7);
      const upcoming = fresh.filter((b) => new Date(b.end).getTime() > Date.now());
      setBlocks(upcoming);
      getPushPermissionStatus().then(setPushStatus).catch(() => {});
      getExamAccess().then(setExamAccess).catch(() => {});
      if (upcoming.length === 0) {
        subjectsService
          .getAll()
          .then((subjects: unknown) => setHasSubjects(Array.isArray(subjects) ? subjects.length > 0 : null))
          .catch(() => setHasSubjects(null));
      } else {
        setHasSubjects(true);
      }
      // La synchronisation (creneaux Apple, calendrier, rappels) est limitee a
      // une toutes les 3 min, sauf au retour du choix des applis, et sauf si un
      // blocage programme ne correspond plus a aucun bloc du planning (chapitre
      // coche, bloc deplace) : sans ca, cocher un chapitre puis verrouiller le
      // telephone laissait partir le blocage a l'ancienne heure (test A9).
      const selectionForce = pendingSelectionRef.current && hasBlockedAppsConfigured();
      if (selectionForce) pendingSelectionRef.current = false;
      const now = Date.now();
      const planned = new Set(fresh.map((b) => `${b.taskId}@${new Date(b.start).getTime()}`));
      const stale = (await getScheduledAutoBlocks()).some(
        (b) => b.start > now && !planned.has(`${b.taskId}@${b.start}`)
      );
      await syncStudyPlan(copy, { force: selectionForce || stale });
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

  // Au-dela du retour sur l'onglet : un chapitre coche dans une feuille ouverte
  // par-dessus l'accueil, et le retour depuis les Reglages de l'iPhone (ou l'on
  // vient d'accorder les notifications). Les deux laissaient la carte perimee
  // jusqu'a ce qu'on tue l'app (test du 26 septembre sur 1.4 (22)).
  useEffect(() => {
    const offPlan = onPlanChanged(() => {
      load();
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => {
      offPlan();
      appState.remove();
    };
  }, [load]);

  const onEnablePush = async () => {
    if (pushStatus === 'denied') {
      // iOS ne reaffiche jamais la boite apres un refus : seuls les Reglages le peuvent.
      Linking.openSettings().catch(() => {});
      return;
    }
    const { outcome } = await requestPushPermissionAndRegisterToken();
    setPushStatus(outcome === 'granted' ? 'granted' : outcome === 'denied' ? 'denied' : pushStatus);
    if (outcome === 'granted') await syncStudyPlan(copy, { force: true });
  };

  const onToggleAutoBlock = async (next: boolean) => {
    if (toggling) return;
    setToggling(true);
    try {
      await applyToggle(next);
    } finally {
      setToggling(false);
    }
  };

  const applyToggle = async (next: boolean) => {
    if (!next) {
      await setAutoBlockEnabled(false);
      setAutoBlock(await readAutoBlockView());
      return;
    }
    // Premium, comme le Mode Examen dont c'est le prolongement. Les seances
    // offertes n'y donnent PAS droit (spec 1.5, section 4), donc plus de passage
    // par `/exam/preview` : pour un gratuit qui a encore des seances, cet ecran
    // renvoie desormais vers le lancement d'une seance, pas vers l'offre. C'est
    // l'un des trois moments ou le paywall revient.
    if (!(await hasExamModeAccess())) {
      await triggerEvent(SUPERWALL_EVENTS.FEATURE_LOCKED, {
        params: { source: 'auto_block_toggle' },
        bypassCooldown: true,
      });
      // Achat fait dans le paywall : StoreKit le sait avant le webhook.
      if (!(await hasExamModeAccess({ force: true }))) return;
    }
    // Lecture instantanee ici, pas resolveAuthorizationStatus : l'utilisateur
    // vient de toucher l'interrupteur, et si le statut est vraiment inconnu
    // l'attente de 5 s repoussait d'autant la boite d'autorisation (15 s
    // mesurees le 25 septembre). requestAuthorization rend la main tout de
    // suite quand l'autorisation est deja donnee.
    if (getAuthorizationStatus() !== 'approved') {
      const granted = await requestAuthorization();
      if (!granted) {
        Alert.alert(t('autoBlockToggle'), t('autoBlockAuthDenied'));
        return;
      }
    }
    await setAutoBlockEnabled(true);
    // La notification « Bloc demarre » est envoyee par l'extension : sans
    // permission, le blocage marche mais l'utilisateur n'en sait rien. Le seul
    // autre endroit qui la demande est l'onboarding, donc un compte reconnecte
    // sur une nouvelle installation n'etait jamais sollicite.
    await maybePrimePushPermission({
      title: t('pushPrimingTitle', undefined, 'Autoriser les rappels ?'),
      message: t(
        'pushPrimingMessage',
        undefined,
        "Sans notification, l'app ne peut rien te rappeler : ni ta session du matin, ni ce que tu as prévu de réviser. Tu règles la fréquence, et tu peux tout couper dans les réglages."
      ),
      later: t('pushPrimingLater', undefined, 'Plus tard'),
      enable: t('pushPrimingEnable', undefined, 'Activer'),
    });
    if (!hasBlockedAppsConfigured()) {
      setAutoBlock({ kind: 'no_selection' });
      pendingSelectionRef.current = true;
      router.push('/exam/blocked-apps');
      return;
    }
    await syncStudyPlan(copy, { force: true });
    setAutoBlock(await readAutoBlockView());
  };

  const openFocusOn = (block: StudyBlock) => {
    router.push({
      pathname: '/focus',
      params: {
        taskId: block.taskId,
        title: block.title,
        subject: block.subjectName ?? '',
        duration: block.minutes,
        // Lu par focus.tsx pour `first_planned_block_started` : un gratuit sans
        // seance offerte lance son premier bloc ici, pas dans le Mode Examen.
        fromPlan: '1',
      },
    } as any);
  };

  const openExamOn = (block: StudyBlock) => {
    router.push({
      pathname: '/exam/setup',
      params: {
        taskId: block.taskId,
        title: block.title,
        subjectId: block.subjectId ?? '',
        subjectName: block.subjectName ?? '',
        minutes: String(block.minutes),
        fromPlan: '1',
      },
    });
  };

  /**
   * Toucher une seance du planning ouvre le Mode Examen sur CE chapitre, et plus
   * `/focus` : c'est le Mode Examen qui bloque les applis, donc c'est lui qui
   * fait respecter le planning.
   *
   * Sauf pour un gratuit sans seance offerte restante (critique de la spec 1.5,
   * point 5) : l'y envoyer lui ferait perdre le Focus gratuit depuis son propre
   * planning, alors que le planning est gratuit. Il garde donc le Focus, avec
   * une proposition Premium au plus une fois par jour.
   */
  const onOpenBlock = async (block: StudyBlock) => {
    if (openingBlock) return;
    setOpeningBlock(true);
    try {
      const access = await getExamAccess();
      setExamAccess(access);
      if (access.canStart) {
        openExamOn(block);
        return;
      }
      if (!(await shouldOfferPremiumFromPlan())) {
        openFocusOn(block);
        return;
      }
      Alert.alert(
        t('studyPlanPremiumOfferTitle', undefined, 'Réviser avec tes applis bloquées ?'),
        t(
          'studyPlanPremiumOfferMessage',
          undefined,
          "Tes séances Mode Examen offertes sont utilisées. Avec Premium, tes applis se bloquent pendant chaque séance, et le blocage se lance tout seul à l'heure de ton planning. Sinon, révise ce chapitre en Focus, sans blocage."
        ),
        [
          {
            text: t('studyPlanPremiumOfferFocus', undefined, 'Continuer en Focus'),
            style: 'cancel',
            onPress: () => openFocusOn(block),
          },
          {
            text: t('studyPlanPremiumOfferCta', undefined, 'Voir Premium'),
            onPress: async () => {
              try {
                await triggerEvent(SUPERWALL_EVENTS.FEATURE_LOCKED, {
                  params: { source: 'study_plan_block' },
                  bypassCooldown: true,
                });
              } catch (error) {
                console.warn('[StudyPlanCard] paywall en échec', error);
              }
              if (await hasExamModeAccess({ force: true })) {
                openExamOn(block);
              } else {
                openFocusOn(block);
              }
            },
          },
        ]
      );
    } finally {
      setOpeningBlock(false);
    }
  };

  if (blocks === null) return null;

  const soon = blocks.filter((b) => dayOffset(b.start) <= 1);
  const rows = soon.slice(0, MAX_ROWS);
  const moreThisWeek = blocks.length - rows.length;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{t('studyPlanTitle')}</Text>
      <View style={styles.card}>
        {rows.length === 0 && hasSubjects === false ? (
          /*
            Compte sans aucune matiere, typiquement un utilisateur d'avant la
            1.5 qui met a jour : il n'a jamais vu les ecrans examens, matieres,
            chapitres et cours, donc on l'y emmene au lieu de l'envoyer creer
            des taches a la main. Le parcours est celui de l'onboarding, a
            partir de l'ecran des examens (ecrans 3 a 10 de la spec 1.5).
          */
          <View style={styles.empty}>
            <Text style={styles.buildTitle}>
              {t('studyPlanBuildTitle', undefined, 'Construis ton planning')}
            </Text>
            <Text style={styles.emptyText}>
              {t(
                'studyPlanBuildText',
                undefined,
                "Ta date d'examen, tes matières et tes chapitres : l'app place tes séances dans ta semaine, autour de tes cours."
              )}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() =>
                router.push({
                  pathname: '/(onboarding-new)/exams',
                  params: { entry: 'study_plan_card' },
                } as any)
              }
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>
                {t('studyPlanBuildCta', undefined, 'Construire mon planning')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : rows.length === 0 ? (
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
            {examAccess && !examAccess.premium && (examAccess.freeRemaining ?? 0) > 0 ? (
              <Text style={styles.freeHint}>
                {t(
                  'studyPlanFreeHint',
                  undefined,
                  'Touche une séance pour la lancer en Mode Examen, applis bloquées.'
                )}{' '}
                {freeSessionsLeftLabel(t, examAccess.freeRemaining ?? 0)}
              </Text>
            ) : null}
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
                    disabled={openingBlock}
                    onPress={() => onOpenBlock(block)}
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
            {pushStatus === 'undetermined' || pushStatus === 'denied' ? (
              <TouchableOpacity onPress={onEnablePush} activeOpacity={0.7} style={styles.pushPrompt}>
                <Text style={styles.autoBlockWarning}>
                  {t('studyPlanPushOff', undefined, 'Rappels désactivés : tu ne seras pas prévenu avant tes blocs.')}{' '}
                  <Text style={styles.autoBlockLink}>
                    {pushStatus === 'denied'
                      ? t('studyPlanPushOpenSettings', undefined, 'Ouvrir les réglages')
                      : t('studyPlanPushEnable', undefined, 'Activer les rappels')}
                  </Text>
                </Text>
              </TouchableOpacity>
            ) : null}
            {autoBlock.kind !== 'hidden' ? (
              <View style={styles.autoBlock}>
                <View style={styles.autoBlockRow}>
                  <Text style={styles.autoBlockLabel}>{t('autoBlockToggle')}</Text>
                  <Switch
                    value={autoBlock.kind !== 'off'}
                    onValueChange={onToggleAutoBlock}
                    disabled={toggling}
                    trackColor={{ false: 'rgba(0, 0, 0, 0.15)', true: '#16A34A' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                {autoBlock.kind === 'on' ? (
                  <Text style={styles.autoBlockHint}>{t('autoBlockOn', { count: autoBlock.scheduled })}</Text>
                ) : null}
                {autoBlock.kind === 'on' && autoBlock.failed > 0 ? (
                  <Text style={styles.autoBlockWarning}>
                    {t('autoBlockFailed', { count: autoBlock.failed })}
                    {autoBlock.error ? ` (${autoBlock.error})` : ''}
                  </Text>
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
  pushPrompt: {
    paddingTop: 8,
  },
  autoBlockLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  empty: {
    gap: 14,
  },
  buildTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  freeHint: {
    fontSize: 13,
    lineHeight: 18,
    color: '#15803D',
    marginBottom: 4,
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
