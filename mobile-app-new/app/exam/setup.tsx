import { beginStudySession } from '@/lib/studyAnalysis';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectExamTasks, TaskForExam } from '@/utils/taskSelection';
import { saveExamSession, getActiveExamSession } from '@/utils/examSession';
import { getRestorableFocusSession } from '@/utils/focusSession';
import { startSessionLiveActivity } from '@/utils/liveActivity';
import { getExamAccess, freeSessionsLeftLabel, type ExamAccess } from '@/utils/premium';
import { clampExamDuration, withPlannedTaskFirst, type PlannedBlockParams } from '@/utils/examAccessRules';
import {
  getAuthorizationStatus,
  getBlockedSelectionCount,
  isAppBlockingSupported,
  startBlocking,
} from '@/utils/appBlocking';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackEvent } from '@/lib/analytics';
import { trackFirstPlannedBlockStarted } from '@/lib/firstPlannedBlock';
import { trackBackendProductEvent } from '@/lib/productEvents';
import { examService, invalidateAuthCache, type ExamStartResult } from '@/lib/api';
import { readCache, writeCache, CACHE_KEYS } from '@/lib/dataCache';

const MIN_DURATION = 25;
const MAX_DURATION = 180;
const DEFAULT_DURATION = 45;

export default function ExamSetupScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Poses par la carte du planning quand on touche un bloc : la seance doit
  // partir sur CE chapitre, avec la duree du bloc.
  const planned = useLocalSearchParams<PlannedBlockParams>();
  const fromPlan = planned.fromPlan === '1';
  const [duration, setDuration] = useState(
    () => clampExamDuration(Number(planned.minutes), MIN_DURATION, MAX_DURATION) ?? DEFAULT_DURATION
  );
  const [hardMode, setHardMode] = useState(true);
  const [breaks, setBreaks] = useState(false);
  const [primaryTask, setPrimaryTask] = useState<TaskForExam | null>(null);
  const [nextTasks, setNextTasks] = useState<TaskForExam[]>([]);
  const [loading, setLoading] = useState(true);
  // Ne vider l'écran qu'au tout premier chargement.
  //
  // useFocusEffect rappelle le chargement à chaque retour sur cet écran, et
  // setLoading(true) y déclenchait un écran de chargement plein cadre. Résultat :
  // chaque navigation repassait par un écran vide, même quand les données
  // étaient déjà là et inchangées. On garde désormais le contenu affiché et on
  // rafraîchit en arrière-plan.
  const hasLoadedOnceRef = useRef(false);

  const [starting, setStarting] = useState(false);
  const [blockAppsEnabled, setBlockAppsEnabled] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);
  // Premium ou seances offertes : sert au controle d'acces ET a l'affichage du
  // nombre de seances offertes restantes.
  const [access, setAccess] = useState<ExamAccess | null>(null);

  const blockingSupported = isAppBlockingSupported();

  // Relu à chaque retour sur l'écran : l'utilisateur peut modifier sa sélection
  // dans l'écran dédié puis revenir ici.
  useFocusEffect(
    React.useCallback(() => {
      if (!blockingSupported) return;
      const count = getBlockedSelectionCount();
      setBlockedCount(count);
      setBlockAppsEnabled(count > 0 && getAuthorizationStatus() === 'approved');
    }, [blockingSupported])
  );

  /**
   * Les tâches sont rechargées au RETOUR sur l'écran, jamais au premier
   * affichage : le montage s'en charge déjà, en séquence après le contrôle
   * d'accès. Sans ce rechargement, modifier ses tâches puis revenir laissait
   * l'écran afficher la tâche principale d'avant modification, et c'est celle-là
   * qui partait en session.
   */
  const initialFocusHandledRef = useRef(false);
  useFocusEffect(
    React.useCallback(() => {
      if (!initialFocusHandledRef.current) {
        initialFocusHandledRef.current = true;
        return;
      }
      loadTasks();
    }, [])
  );

  useEffect(() => {
    // Séquencé volontairement : en parallèle, loadTasks pouvait lever le
    // spinner et rendre l'écran utilisable avant la réponse de checkAccess,
    // laissant un compte gratuit démarrer une vraie session sur réseau lent.
    (async () => {
      // Une session focus tourne encore : on y retourne. ExamMode fait deja ce
      // test, mais la carte du planning ouvre cet ecran directement, sans passer
      // par lui, et deux minuteurs actifs affichaient deux comptes a rebours.
      if (await getRestorableFocusSession()) {
        router.replace('/focus');
        return;
      }
      const allowed = await checkAccess();
      if (!allowed) return;
      if (await checkActiveSession()) return;
      await loadTasks();
    })();
  }, []);

  const checkActiveSession = async (): Promise<boolean> => {
    const activeSession = await getActiveExamSession();
    if (activeSession) {
      router.replace({
        pathname: '/exam/session',
        params: { sessionId: activeSession.sessionId },
      });
      return true;
    }
    return false;
  };

  /**
   * Premium, ou compte gratuit avec au moins une seance offerte. A zero, retour
   * a l'ecran de presentation, qui est la porte du paywall.
   */
  const checkAccess = async (): Promise<ExamAccess | null> => {
    const result = await getExamAccess();
    setAccess(result);
    if (!result.canStart) {
      router.replace('/exam/preview');
      return null;
    }
    return result;
  };

  const loadTasks = async () => {
    try {
      if (!hasLoadedOnceRef.current) setLoading(true);
      const selected = await selectExamTasks();
      // Le cache garde la selection brute : le chapitre touche dans le planning
      // ne vaut que pour cette ouverture de l'ecran.
      void writeCache(CACHE_KEYS.examTasks, selected);
      const { primary, next } = withPlannedTaskFirst(selected.primary, selected.next, planned);
      setPrimaryTask(primary);
      setNextTasks(next);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      hasLoadedOnceRef.current = true;
      setLoading(false);
    }
  };

  // Afficher d'entrée la sélection de la dernière fois. Elle est recalculée
  // juste après : c'est un point de départ visuel, pas une source de vérité.
  useEffect(() => {
    let annule = false;
    (async () => {
      const cached = await readCache<{ primary: TaskForExam | null; next: TaskForExam[] }>(
        CACHE_KEYS.examTasks
      );
      if (annule || !cached || hasLoadedOnceRef.current) return;
      const { primary, next } = withPlannedTaskFirst(cached.primary, cached.next || [], planned);
      setPrimaryTask(primary);
      setNextTasks(next);
      setLoading(false);
    })();
    return () => { annule = true; };
  }, []);

  const askFreeSessionWithoutBlocking = () =>
    new Promise<'choose' | 'start' | 'cancel'>((resolve) => {
      Alert.alert(
        t('examFreeNoBlockingTitle', undefined, 'Tes applis ne seront pas bloquées'),
        t(
          'examFreeNoBlockingMessage',
          undefined,
          "Aucune appli n'est choisie pour cette séance offerte. Choisis celles qui te déconcentrent : elles resteront verrouillées jusqu'à la fin, sans bouton pour les rouvrir."
        ),
        [
          { text: t('examFreeNoBlockingChoose', undefined, 'Choisir mes applis'), onPress: () => resolve('choose') },
          { text: t('examFreeNoBlockingStart', undefined, 'Lancer sans blocage'), onPress: () => resolve('start') },
          { text: t('cancel'), style: 'cancel', onPress: () => resolve('cancel') },
        ],
        { cancelable: true, onDismiss: () => resolve('cancel') }
      );
    });

  const handleStart = async () => {
    if (!primaryTask) {
      // Show empty state or task creation
      return;
    }

    setStarting(true);
    try {
      // Revérifié au moment de l'action : l'écran a pu rester ouvert, et c'est
      // ici qu'on crée une vraie session (non démo) avec durée et hardMode libres.
      const current = await checkAccess();
      if (!current) {
        return;
      }

      // Une séance offerte sans blocage perd l'essentiel de ce qu'elle doit
      // montrer, et il n'y en a que très peu : on le dit AVANT de la décompter.
      if (!current.premium && blockingSupported && !blockAppsEnabled) {
        const choice = await askFreeSessionWithoutBlocking();
        if (choice === 'choose') {
          router.push('/exam/blocked-apps');
          return;
        }
        if (choice === 'cancel') return;
      }

      // Séance offerte : c'est le serveur qui la décompte, et lui seul qui dit
      // non. Fail-closed : sans sa réponse, on ne lance rien, sinon une coupure
      // réseau donnerait des séances illimitées.
      let freeSession = false;
      let freeSessionToken: string | null = null;
      let freeRemainingAfter: number | null = null;
      if (!current.premium) {
        let result: ExamStartResult | null = null;
        // Une cle par lancement : si la reponse se perd, le 2e essai rejoue la
        // meme cle et le serveur renvoie le meme jeton sans decompter une 2e fois.
        const launchKey = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        try {
          result = await examService.start(duration, launchKey);
        } catch (error) {
          console.error('Error starting free exam session, retrying once:', error);
          try {
            result = await examService.start(duration, launchKey);
          } catch (retryError) {
            console.error('Error starting free exam session:', retryError);
          }
        } finally {
          // Le nombre de séances restantes vient de /auth/me, mis en cache 45 s.
          invalidateAuthCache();
        }
        if (!result) {
          // La reponse a pu se perdre APRES le decompte (delai de 15 s depasse,
          // reseau coupe au retour) : sans jeton, cette seance ne pourrait pas
          // etre rendue, et un nouvel essai en decompterait une seconde. On relit
          // donc le compteur hors cache : s'il a baisse d'une seance depuis la
          // lecture d'avant l'appel, la seance est deja payee et on la lance.
          // Seul manque le jeton, donc le remboursement d'une annulation dans
          // les 2 minutes. Ce cas ne reste possible que si les deux essais avec
          // la meme cle de lancement ont echoue.
          const before = current.freeRemaining;
          const recheck = before !== null ? await getExamAccess({ force: true }) : null;
          if (
            recheck &&
            !recheck.premium &&
            before !== null &&
            recheck.freeRemaining !== null &&
            recheck.freeRemaining === before - 1
          ) {
            result = { allowed: true, premium: false, sessionToken: null, freeRemaining: recheck.freeRemaining };
          }
        }
        if (!result) {
          Alert.alert(
            t('examFreeStartErrorTitle', undefined, 'Séance non lancée'),
            t(
              'examFreeStartErrorMessage',
              undefined,
              'Impossible de vérifier ta séance offerte. Vérifie ta connexion, puis réessaie.'
            )
          );
          return;
        }
        if (!result.allowed) {
          // La 3e séance : c'est ici que le paywall revient (spec 1.5, section 3).
          router.replace({
            pathname: '/exam/preview',
            params: { reason: 'quota_exhausted', at: String(Date.now()) },
          });
          return;
        }
        if (!result.premium) {
          freeSession = true;
          freeSessionToken = result.sessionToken;
          freeRemainingAfter = result.freeRemaining;
        }
      }

      const sessionId = `exam_${Date.now()}`;
      const allTaskIds = [primaryTask.id, ...nextTasks.map(t => t.id)].filter(Boolean);

      // Compte à rebours visible hors de l'app. Il vaut surtout pour ce mode :
      // le principe même du blocage est que l'utilisateur sort de l'app, donc
      // c'est le seul endroit où il peut encore voir le temps restant.
      const startedAt = Date.now();
      const liveActivityId = startSessionLiveActivity(
        'exam',
        startedAt + duration * 60 * 1000,
        primaryTask.title
      );

      await saveExamSession({
        sessionId,
        startedAt,
        plannedDuration: duration,
        hardMode,
        breaks,
        currentTaskIndex: 0,
        plannedTaskIds: allTaskIds,
        completedTaskIds: [],
        isDemo: false,
        liveActivityId,
        blockApps: blockAppsEnabled,
        freeSession,
        freeSessionToken,
      });

      await beginStudySession('exam', sessionId, duration, primaryTask.id);

      await trackEvent('exam_mode_started', {
        duration_minutes: duration,
        hard_mode: hardMode,
        breaks_enabled: breaks,
        app_blocking_enabled: blockAppsEnabled,
        task_count: allTaskIds.length,
        free_session: freeSession,
      });
      if (freeSession) {
        // Firebase ET la base, comme les evenements de l'onboarding : sans la
        // base, la seance offerte n'existe pas dans product_analytics_events.
        const freeStartParams = {
          planned_minutes: duration,
          free_remaining: freeRemainingAfter,
          app_blocking_enabled: blockAppsEnabled,
          from_plan: fromPlan,
        };
        void trackEvent('exam_free_session_started', freeStartParams);
        void trackBackendProductEvent('exam_free_session_started', freeStartParams);
      }
      if (fromPlan) {
        void trackFirstPlannedBlockStarted({
          mode: 'exam',
          planned_minutes: duration,
          free_session: freeSession,
        });
      }

      // Le blocage est un bonus, pas une condition : une session sans bouclier
      // reste une session de révision. On ne la fait donc jamais échouer ici.
      //
      // Mais le retour est LU, et c'est le correctif du 6 août qui avait disparu
      // avec le blocage quand il est sorti de focus.tsx : sans ça, l'utilisateur
      // lançait une session en croyant ses applications bloquées sans qu'elles le
      // soient, et rien ne le lui disait. C'est la promesse centrale du produit
      // qui échouait en silence.
      if (blockAppsEnabled) {
        const blocking = await startBlocking(sessionId, duration);
        if (!blocking.started) {
          Alert.alert(
            t('blockApps'),
            blocking.reason === 'not_authorized'
              ? t('blockAppsAuthorizationLost')
              : t('blockAppsCouldNotStart')
          );
        }
      }

      router.push({
        pathname: '/exam/session',
        params: { sessionId },
      });
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setStarting(false);
    }
  };

  /**
   * `/(tabs)/tasks` poussait le groupe d'ONGLETS par-dessus la pile du Mode
   * Examen. Un écran d'onglet n'a pas de bouton retour par construction, donc
   * cet écran de réglage se retrouvait enterré sous la barre d'onglets sans
   * aucun chemin de retour : cul-de-sac constaté sur device le 10 août.
   *
   * `/tasks-new` rend le même contenu avec une flèche de retour, et c'est déjà
   * la destination utilisée par l'onglet Assistant. Elle trie par matière et
   * par impact, ce qui est le cadre du Mode Examen.
   */
  const handleEditTasks = () => {
    router.push('/tasks-new');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>{t('loadingTasks') || t('loading')}</Text>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>{t('startExamMode')}</Text>
          </View>
          <View style={styles.backButton} />
        </Animated.View>

        {/* Duration Slider */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t('duration')}</Text>
          <View style={styles.durationCard}>
            <Text style={styles.durationValue}>{duration} min</Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setDuration(Math.max(MIN_DURATION, duration - 5))}
              >
                <Ionicons name="remove" size={20} color="#000" />
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${((duration - MIN_DURATION) / (MAX_DURATION - MIN_DURATION)) * 100}%` }]} />
              </View>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setDuration(Math.min(MAX_DURATION, duration + 5))}
              >
                <Ionicons name="add" size={20} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.durationPresets}>
              {[25, 45, 60, 90].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetButton,
                    duration === preset && styles.presetButtonActive,
                  ]}
                  onPress={() => setDuration(preset)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      duration === preset && styles.presetTextActive,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Primary Task */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t('primaryTask')}</Text>
          {primaryTask ? (
            <View style={styles.taskCard}>
              <Text style={styles.taskTitle} numberOfLines={0}>{primaryTask.title}</Text>
              <Text style={styles.taskSubject} numberOfLines={0}>{primaryTask.subjectName}</Text>
              {/* 0 = chapitre reconstruit depuis le planning, coefficient inconnu. */}
              {primaryTask.subjectCoefficient > 0 ? (
                <Text style={styles.taskCoeff}>Coef {primaryTask.subjectCoefficient}</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyTaskCard}>
              <Ionicons name="add-circle-outline" size={32} color="rgba(0, 0, 0, 0.3)" />
              <Text style={styles.emptyTaskText}>{t('noTasksAvailable') || 'No tasks available'}</Text>
              <TouchableOpacity
                style={styles.addTaskButton}
                onPress={handleEditTasks}
              >
                <Text style={styles.addTaskText}>{t('addFirstTask') || 'Add your first task'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Up Next */}
        {nextTasks.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>{t('upNext')}</Text>
            {nextTasks.map((task, index) => (
              <View key={task.id} style={styles.nextTaskItem}>
                <View style={styles.nextTaskNumber}>
                  <Text style={styles.nextTaskNumberText}>{index + 2}</Text>
                </View>
                <View style={styles.nextTaskContent}>
                  <Text style={styles.nextTaskTitle} numberOfLines={0}>{task.title}</Text>
                  <Text style={styles.nextTaskSubject} numberOfLines={0}>{task.subjectName}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Options */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          {blockingSupported && (
            <View style={styles.optionItem}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{t('blockApps')}</Text>
                <Text style={styles.optionDescription}>
                  {blockedCount > 0
                    ? `${blockedCount} ${t('blockAppsSelected')}`
                    : t('blockAppsNoSelection')}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/exam/blocked-apps')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.optionLink}>
                    {blockedCount > 0 ? t('blockAppsEdit') : t('blockAppsChoose')}
                  </Text>
                </TouchableOpacity>
              </View>
              <Switch
                value={blockAppsEnabled}
                onValueChange={setBlockAppsEnabled}
                disabled={blockedCount === 0}
                trackColor={{ false: 'rgba(0, 0, 0, 0.1)', true: '#16A34A' }}
                thumbColor="#FFFFFF"
              />
            </View>
          )}

          <View style={styles.optionItem}>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{t('hardMode')}</Text>
              <Text style={styles.optionDescription}>{t('hardModeDescription')}</Text>
            </View>
            <Switch
              value={hardMode}
              onValueChange={setHardMode}
              trackColor={{ false: 'rgba(0, 0, 0, 0.1)', true: '#16A34A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.optionItem}>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{t('breaks')}</Text>
              <Text style={styles.optionDescription}>{t('breaksDescription')}</Text>
            </View>
            <Switch
              value={breaks}
              onValueChange={setBreaks}
              trackColor={{ false: 'rgba(0, 0, 0, 0.1)', true: '#16A34A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.ctaSection}>
          {access && !access.premium && access.freeRemaining !== null ? (
            <View style={styles.freeBanner}>
              <Ionicons name="gift-outline" size={18} color="#16A34A" />
              <Text style={styles.freeBannerText}>
                {freeSessionsLeftLabel(t, access.freeRemaining)}{' '}
                {t(
                  'examFreeSetupHint',
                  undefined,
                  "Lancer cette séance en utilise une. Annulée dans les 2 premières minutes, elle t'est rendue, une seule fois."
                )}
              </Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.startButton, !primaryTask && styles.startButtonDisabled]}
            onPress={handleStart}
            disabled={!primaryTask || starting}
            activeOpacity={0.8}
          >
            {starting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.startButtonText}>{t('startExamMode')}</Text>
            )}
          </TouchableOpacity>

          {primaryTask && (
            <TouchableOpacity
              style={styles.editTasksButton}
              onPress={handleEditTasks}
            >
              <Text style={styles.editTasksText}>{t('editTasks')}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
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
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  durationCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    padding: 24,
  },
  durationValue: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 24,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#16A34A',
  },
  durationPresets: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  presetButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  presetButtonActive: {
    backgroundColor: '#000',
  },
  presetText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  taskCard: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  taskSubject: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 4,
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  taskCoeff: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  emptyTaskCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderStyle: 'dashed',
  },
  emptyTaskText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.4)',
    marginTop: 12,
    marginBottom: 16,
  },
  addTaskButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#16A34A',
  },
  addTaskText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  nextTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    marginBottom: 8,
  },
  nextTaskNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nextTaskNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  nextTaskContent: {
    flex: 1,
  },
  nextTaskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  nextTaskSubject: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    marginBottom: 8,
  },
  optionContent: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  optionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
    marginTop: 6,
  },
  ctaSection: {
    marginTop: 8,
    gap: 12,
  },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  freeBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  startButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    shadowOpacity: 0,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  editTasksButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  editTasksText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
});
