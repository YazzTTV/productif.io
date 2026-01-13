import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { behaviorService, authService, PlanLimits } from '@/lib/api';
import { format, parseISO, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const { width } = Dimensions.get('window');

type CheckInType = 'mood' | 'stress' | 'focus';

interface AnalyticsData {
  date: string;
  mood: number | null;
  stress: number | null;
  focus: number | null;
  moodCount: number;
  stressCount: number;
  focusCount: number;
}

interface AnalyticsScreenProps {
  checkInType?: CheckInType;
  isActive?: boolean; // Nouvelle prop pour indiquer si l'onglet est actif
}

export default function AnalyticsScreen({ checkInType: propCheckInType, isActive = true }: AnalyticsScreenProps = {}) {
  const params = useLocalSearchParams();
  const checkInType = (propCheckInType || params.checkInType) as CheckInType | undefined;
  const hasLoadedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [averages, setAverages] = useState<{
    mood: number | null;
    stress: number | null;
    focus: number | null;
  }>({ mood: null, stress: null, focus: null });
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [showCheckInForm, setShowCheckInForm] = useState(!!checkInType);
  const [checkInValue, setCheckInValue] = useState('');
  const [checkInNote, setCheckInNote] = useState('');

  // Charger les données au montage
  useEffect(() => {
    console.log('🔄 [Analytics] useEffect - Montage du composant, isActive:', isActive);
    console.log('🔄 [Analytics] hasLoadedRef.current:', hasLoadedRef.current);
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      console.log('🔄 [Analytics] Premier chargement...');
      loadPlan();
      loadAnalytics();
    } else if (isActive) {
      console.log('🔄 [Analytics] Composant déjà monté, rechargement...');
      loadAnalytics();
    }
  }, []);

  // Recharger les données quand l'onglet devient actif
  useEffect(() => {
    console.log('🔄 [Analytics] useEffect - isActive changé:', isActive);
    if (isActive) {
      console.log('🔄 [Analytics] Onglet actif, rechargement des données...');
      loadAnalytics();
    }
  }, [isActive]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      console.log('📊 [Analytics] ===== DÉBUT DU CHARGEMENT =====');
      console.log('📊 [Analytics] Appel à behaviorService.getAnalytics()...');
      const response = await behaviorService.getAnalytics();
      console.log('✅ [Analytics] Données reçues:', JSON.stringify(response, null, 2));
      console.log('✅ [Analytics] response.data:', response.data);
      console.log('✅ [Analytics] response.averages:', response.averages);
      setAnalyticsData(response.data || []);
      setAverages(response.averages || { mood: null, stress: null, focus: null });
      if (response.planLimits) {
        setPlanLimits(response.planLimits);
      }
      if (response.plan) {
        setPlan(response.plan);
      }
      console.log('✅ [Analytics] State mis à jour');
      console.log('📊 [Analytics] ===== FIN DU CHARGEMENT =====');
    } catch (error: any) {
      console.error('❌ [Analytics] Erreur lors du chargement des analytics:', error);
      console.error('❌ [Analytics] Type d\'erreur:', error?.constructor?.name);
      console.error('❌ [Analytics] Message:', error?.message);
      console.error('❌ [Analytics] Stack:', error?.stack);
      
      // Si l'endpoint n'existe pas encore (404), afficher un message plus informatif
      if (error.message && (error.message.includes('Endpoint non trouvé') || error.message.includes('404'))) {
        Alert.alert(
          'Fonctionnalité en cours de déploiement',
          'L\'endpoint analytics est en cours de déploiement. Veuillez réessayer dans quelques instants.',
          [{ text: 'OK' }]
        );
      } else if (error.message && error.message.toLowerCase().includes('premium')) {
        Alert.alert(
          'Analytics Premium',
          'Analytics détaillés réservés au plan Premium. Débloquez plus de jours d\'historique.',
          [
            { text: 'Plus tard' },
            { text: 'Passer en Premium', onPress: () => router.push('/paywall') }
          ]
        );
      } else if (error.message && error.message.includes('Non authentifié') || error.message.includes('401')) {
        Alert.alert(
          'Erreur d\'authentification',
          'Vous devez être connecté pour voir vos analytics. Veuillez vous reconnecter.',
          [{ text: 'OK' }]
        );
      } else if (error.message && error.message.includes('réseau') || error.message.includes('timeout')) {
        Alert.alert(
          'Erreur de connexion',
          'Vérifiez votre connexion internet et réessayez.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Erreur',
          `Impossible de charger les données analytics. ${error?.message ? `\n\n${error.message}` : ''}`,
          [{ text: 'OK' }]
        );
      }
      
      // Initialiser avec des données vides pour éviter les erreurs d'affichage
      setAnalyticsData([]);
      setAverages({ mood: null, stress: null, focus: null });
    } finally {
      setLoading(false);
    }
  };

  const loadPlan = async () => {
    try {
      const user = await authService.checkAuth();
      setPlanLimits(user?.planLimits || null);
      setPlan(user?.plan || null);
    } catch (error) {
      setPlanLimits(null);
      setPlan(null);
    }
  };

  const handleSubmitCheckIn = async () => {
    if (!checkInType || !checkInValue) {
      Alert.alert('Erreur', 'Veuillez entrer une note entre 1 et 10');
      return;
    }

    const value = parseInt(checkInValue, 10);
    if (isNaN(value) || value < 1 || value > 10) {
      Alert.alert('Erreur', 'La note doit être entre 1 et 10');
      return;
    }

    try {
      setSubmitting(true);
      console.log('💾 [Analytics] Enregistrement du check-in:', { type: checkInType, value, note: checkInNote });
      
      const result = await behaviorService.createCheckIn({
        type: checkInType,
        value,
        note: checkInNote || undefined,
        context: {
          triggeredBy: 'notification',
          timestamp: new Date().toISOString(),
        },
      });

      console.log('✅ [Analytics] Check-in enregistré avec succès:', result);

      Alert.alert('Succès', 'Votre note a été enregistrée !', [
        {
          text: 'OK',
          onPress: () => {
            setShowCheckInForm(false);
            setCheckInValue('');
            setCheckInNote('');
            loadAnalytics();
          },
        },
      ]);
    } catch (error: any) {
      console.error('❌ [Analytics] Erreur lors de l\'enregistrement:', error);
      console.error('❌ [Analytics] Type d\'erreur:', error?.constructor?.name);
      console.error('❌ [Analytics] Message:', error?.message);
      console.error('❌ [Analytics] Stack:', error?.stack);
      
      let errorMessage = 'Impossible d\'enregistrer votre note';
      if (error?.message) {
        if (error.message.includes('Non authentifié') || error.message.includes('401')) {
          errorMessage = 'Vous devez être connecté pour enregistrer une note. Veuillez vous reconnecter.';
        } else if (error.message.includes('réseau') || error.message.includes('timeout')) {
          errorMessage = 'Erreur de connexion. Vérifiez votre internet et réessayez.';
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeLabel = (type: CheckInType) => {
    const labels = {
      mood: 'Humeur',
      stress: 'Stress',
      focus: 'Focus',
    };
    return labels[type];
  };

  const getTypeEmoji = (type: CheckInType) => {
    const emojis = {
      mood: '🙂',
      stress: '😌',
      focus: '🎯',
    };
    return emojis[type];
  };

  const getTypeColor = (type: CheckInType) => {
    const colors = {
      mood: '#10B981',
      stress: '#F59E0B',
      focus: '#3B82F6',
    };
    return colors[type];
  };

  const prepareChartData = (type: CheckInType) => {
    const labels = analyticsData.map((d) => {
      const date = parseISO(d.date);
      return format(date, 'EEE', { locale: fr }).substring(0, 3);
    });

    const data = analyticsData.map((d) => {
      const value = d[type];
      return value !== null ? value : 0;
    });

    return { labels, data };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {planLimits?.analyticsRetentionDays !== null && (
          <View style={styles.planNotice}>
            <View style={styles.planNoticeLeft}>
              <Text style={styles.planNoticeTitle}>Analytics en aperçu</Text>
              <Text style={styles.planNoticeText}>
                Vous voyez les {planLimits.analyticsRetentionDays} derniers jours. Passez en Premium pour un historique complet.
              </Text>
            </View>
            <TouchableOpacity style={styles.planNoticeButton} onPress={() => router.push('/paywall')}>
              <Text style={styles.planNoticeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Formulaire de check-in si arrivé depuis une notification */}
        {showCheckInForm && checkInType && (
          <View style={styles.checkInCard}>
            <View style={styles.checkInHeader}>
              <Text style={styles.checkInEmoji}>{getTypeEmoji(checkInType)}</Text>
              <Text style={styles.checkInTitle}>
                Notez votre {getTypeLabel(checkInType).toLowerCase()}
              </Text>
            </View>
            <Text style={styles.checkInSubtitle}>
              Sur une échelle de 1 à 10, comment vous sentez-vous ?
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Note (1-10)</Text>
              <TextInput
                style={styles.numberInput}
                value={checkInValue}
                onChangeText={setCheckInValue}
                keyboardType="number-pad"
                placeholder="8"
                maxLength={2}
                autoFocus
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Note (optionnel)</Text>
              <TextInput
                style={styles.noteInput}
                value={checkInNote}
                onChangeText={setCheckInNote}
                placeholder="Ajoutez une note si vous le souhaitez..."
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitCheckIn}
              disabled={submitting || !checkInValue}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Enregistrer</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => setShowCheckInForm(false)}
            >
              <Text style={styles.skipButtonText}>Passer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Résumé des moyennes */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Moyennes sur 7 jours</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>🙂</Text>
              <Text style={styles.summaryLabel}>Humeur</Text>
              <Text style={styles.summaryValue}>
                {averages.mood !== null ? averages.mood.toFixed(1) : '—'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>😌</Text>
              <Text style={styles.summaryLabel}>Stress</Text>
              <Text style={styles.summaryValue}>
                {averages.stress !== null ? averages.stress.toFixed(1) : '—'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>🎯</Text>
              <Text style={styles.summaryLabel}>Focus</Text>
              <Text style={styles.summaryValue}>
                {averages.focus !== null ? averages.focus.toFixed(1) : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Graphiques */}
        {['mood', 'stress', 'focus'].map((type) => {
          const checkInType = type as CheckInType;
          const chartData = prepareChartData(checkInType);
          const hasData = analyticsData.some((d) => d[checkInType] !== null);

          if (!hasData) return null;

          return (
            <View key={type} style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartEmoji}>{getTypeEmoji(checkInType)}</Text>
                <Text style={styles.chartTitle}>{getTypeLabel(checkInType)}</Text>
              </View>
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      data: chartData.data,
                      color: (opacity = 1) => getTypeColor(checkInType),
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={width - 48}
                height={200}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 1,
                  color: (opacity = 1) => getTypeColor(checkInType),
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '5',
                    strokeWidth: '2',
                    stroke: getTypeColor(checkInType),
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                yAxisLabel=""
                yAxisSuffix="/10"
                yAxisInterval={1}
                fromZero={true}
              />
            </View>
          );
        })}

        {/* Espacement pour le bas */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  planNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF3',
    borderColor: '#16A34A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  planNoticeLeft: {
    flex: 1,
    gap: 4,
  },
  planNoticeTitle: {
    color: '#14532D',
    fontSize: 15,
    fontWeight: '600',
  },
  planNoticeText: {
    color: '#166534',
    fontSize: 13,
  },
  planNoticeButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  planNoticeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  checkInCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  checkInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkInEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  checkInTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  checkInSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
});
