import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Switch,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiCall } from '@/lib/api';

interface NotificationPreferences {
  isEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  whatsappEnabled: boolean;
  whatsappNumber?: string;
  startHour: number;
  endHour: number;
  allowedDays: number[];
  notificationTypes: string[];
  morningReminder: boolean;
  taskReminder: boolean;
  habitReminder: boolean;
  motivation: boolean;
  dailySummary: boolean;
  morningTime: string;
  noonTime: string;
  afternoonTime: string;
  eveningTime: string;
  nightTime: string;
}

const defaultPreferences: NotificationPreferences = {
  isEnabled: true,
  emailEnabled: true,
  pushEnabled: true,
  whatsappEnabled: false,
  whatsappNumber: '',
  startHour: 9,
  endHour: 18,
  allowedDays: [1, 2, 3, 4, 5],
  notificationTypes: ['TASK_DUE', 'HABIT_REMINDER', 'DAILY_SUMMARY'],
  morningReminder: true,
  taskReminder: true,
  habitReminder: true,
  motivation: true,
  dailySummary: true,
  morningTime: '08:00',
  noonTime: '12:00',
  afternoonTime: '14:00',
  eveningTime: '18:00',
  nightTime: '22:00'
};

const daysOfWeek = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

const notificationTypeLabels: Record<string, string> = {
  'TASK_DUE': 'Échéances de tâches',
  'HABIT_REMINDER': 'Rappels d\'habitudes',
  'DAILY_SUMMARY': 'Résumé quotidien',
  'MOTIVATION': 'Messages de motivation',
  'MORNING_REMINDER': 'Rappel matinal'
};

export default function NotificationsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      
      // D'abord, récupérer l'utilisateur actuel
      const me = await apiCall<{ user: { id: string } }>('/auth/me');
      console.log('✅ User info récupéré:', me);
      setUserId(me?.user?.id || '');

      // Récupérer les préférences (l'API utilise automatiquement l'utilisateur authentifié)
      const url = `/notifications/preferences`;
      console.log('🌐 URL préférences:', url);
      const prefs = await apiCall<NotificationPreferences>(url);
      
      console.log('✅ Préférences récupérées:', prefs);
      
      const finalPrefs = {
        ...defaultPreferences,
        ...prefs,
        allowedDays: Array.isArray(prefs.allowedDays) ? prefs.allowedDays : defaultPreferences.allowedDays,
        notificationTypes: Array.isArray(prefs.notificationTypes) ? prefs.notificationTypes : defaultPreferences.notificationTypes
      };
      
      setPreferences(finalPrefs);
      setOriginalPreferences(finalPrefs);
      setHasChanges(false);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des préférences:', error);
      // En cas d'erreur, utiliser les préférences par défaut
      setPreferences(defaultPreferences);
      Alert.alert(
        'Avertissement',
        'Impossible de charger vos préférences existantes. Les valeurs par défaut seront utilisées.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    // L'API se base sur l'utilisateur authentifié via JWT, pas besoin d'userId

    if (!hasChanges) {
      console.log('ℹ️ Pas de changements à sauvegarder');
      Alert.alert('Info', 'Aucune modification à sauvegarder.');
      return;
    }

    try {
      setIsSaving(true);
      
      console.log('💾 Début sauvegarde préférences:', preferences);
      console.log('🔄 Changements depuis original:', {
        original: originalPreferences,
        current: preferences
      });
      
      const response = await apiCall('/notifications/preferences', {
        method: 'POST',
        body: JSON.stringify(preferences)
      });

      console.log('✅ Réponse sauvegarde:', response);

      // Mettre à jour les préférences originales après sauvegarde réussie
      setOriginalPreferences(preferences);
      setHasChanges(false);

      Alert.alert(
        'Succès',
        'Vos préférences de notification ont été sauvegardées avec succès !',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      Alert.alert(
        'Erreur',
        'Impossible de sauvegarder vos préférences. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resetPreferences = () => {
    Alert.alert(
      'Réinitialiser',
      'Voulez-vous annuler tous vos changements non sauvegardés ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            console.log('🔄 Réinitialisation des préférences');
            setPreferences(originalPreferences);
            setHasChanges(false);
          }
        }
      ]
    );
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    console.log(`🔄 Modification préférence: ${key} = ${JSON.stringify(value)}`);
    setPreferences(prev => {
      const newPrefs = {
        ...prev,
        [key]: value
      };
      console.log('📋 Nouvelles préférences:', newPrefs);
      
      // Vérifier s'il y a des changements
      const hasChangedNow = JSON.stringify(newPrefs) !== JSON.stringify(originalPreferences);
      setHasChanges(hasChangedNow);
      console.log('🔄 Changements détectés:', hasChangedNow);
      
      return newPrefs;
    });
  };

  const toggleDay = (day: number) => {
    const newDays = preferences.allowedDays.includes(day)
      ? preferences.allowedDays.filter(d => d !== day)
      : [...preferences.allowedDays, day].sort();
    
    updatePreference('allowedDays', newDays);
  };

  const toggleNotificationType = (type: string) => {
    const newTypes = preferences.notificationTypes.includes(type)
      ? preferences.notificationTypes.filter(t => t !== type)
      : [...preferences.notificationTypes, type];
    
    updatePreference('notificationTypes', newTypes);
  };

  const renderSectionHeader = (title: string, icon: keyof typeof Ionicons.glyphMap) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color="#374151" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderToggleItem = (
    title: string,
    subtitle: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    disabled = false
  ) => (
    <View style={[styles.toggleItem, disabled && styles.toggleItemDisabled]}>
      <View style={styles.toggleContent}>
        <Text style={[styles.toggleTitle, disabled && styles.toggleTitleDisabled]}>{title}</Text>
        <Text style={[styles.toggleSubtitle, disabled && styles.toggleSubtitleDisabled]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#E5E7EB', true: '#10B981' }}
        thumbColor={value ? '#fff' : '#9CA3AF'}
      />
    </View>
  );

  const renderTimeInput = (label: string, value: string, onChange: (value: string) => void) => (
    <View style={styles.timeInputContainer}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput
        style={styles.timeInput}
        value={value}
        onChangeText={onChange}
        placeholder="HH:MM"
        maxLength={5}
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Chargement des préférences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            hasChanges && styles.saveButtonWithChanges,
            !hasChanges && styles.saveButtonNoChanges
          ]}
          onPress={savePreferences}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <Text style={[
              styles.saveButtonText,
              hasChanges && styles.saveButtonTextActive,
              !hasChanges && styles.saveButtonTextInactive
            ]}>
              {hasChanges ? 'Sauver *' : 'Sauvé'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Indicateur de changements */}
      {hasChanges && (
        <View style={styles.changesIndicator}>
          <Ionicons name="warning" size={16} color="#F59E0B" />
          <Text style={styles.changesIndicatorText}>
            Modifications non sauvegardées
          </Text>
          <TouchableOpacity onPress={resetPreferences} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Activation générale */}
        <View style={styles.section}>
          {renderSectionHeader('Paramètres généraux', 'settings')}
          <View style={styles.card}>
            {renderToggleItem(
              'Notifications activées',
              'Activer ou désactiver toutes les notifications',
              preferences.isEnabled,
              (value) => updatePreference('isEnabled', value)
            )}
          </View>
        </View>

        {/* Canaux de notification */}
        <View style={styles.section}>
          {renderSectionHeader('Canaux de notification', 'notifications')}
          <View style={styles.card}>
            {renderToggleItem(
              'Notifications email',
              'Recevoir des notifications par email',
              preferences.emailEnabled,
              (value) => updatePreference('emailEnabled', value),
              !preferences.isEnabled
            )}
            {renderToggleItem(
              'Notifications push',
              'Recevoir des notifications sur l\'appareil',
              preferences.pushEnabled,
              (value) => updatePreference('pushEnabled', value),
              !preferences.isEnabled
            )}
            {renderToggleItem(
              'Notifications WhatsApp',
              'Recevoir des notifications via WhatsApp',
              preferences.whatsappEnabled,
              (value) => updatePreference('whatsappEnabled', value),
              !preferences.isEnabled
            )}
            
            {preferences.whatsappEnabled && (
              <View style={styles.whatsappNumberContainer}>
                <Text style={styles.inputLabel}>Numéro WhatsApp</Text>
                <TextInput
                  style={styles.textInput}
                  value={preferences.whatsappNumber}
                  onChangeText={(value) => updatePreference('whatsappNumber', value)}
                  placeholder="+33 6 XX XX XX XX"
                  keyboardType="phone-pad"
                />
              </View>
            )}
          </View>
        </View>

        {/* Types de notifications */}
        <View style={styles.section}>
          {renderSectionHeader('Types de notifications', 'list')}
          <View style={styles.card}>
            {renderToggleItem(
              'Rappels de tâches',
              'Notifications pour les échéances de tâches',
              preferences.taskReminder,
              (value) => updatePreference('taskReminder', value),
              !preferences.isEnabled
            )}
            {renderToggleItem(
              'Rappels d\'habitudes',
              'Notifications pour suivre vos habitudes',
              preferences.habitReminder,
              (value) => updatePreference('habitReminder', value),
              !preferences.isEnabled
            )}
            {renderToggleItem(
              'Résumé quotidien',
              'Résumé de votre journée le soir',
              preferences.dailySummary,
              (value) => updatePreference('dailySummary', value),
              !preferences.isEnabled
            )}
            {renderToggleItem(
              'Messages de motivation',
              'Messages motivationnels personnalisés',
              preferences.motivation,
              (value) => updatePreference('motivation', value),
              !preferences.isEnabled
            )}
            {renderToggleItem(
              'Rappel matinal',
              'Notification pour commencer la journée',
              preferences.morningReminder,
              (value) => updatePreference('morningReminder', value),
              !preferences.isEnabled
            )}
          </View>
        </View>

        {/* Jours de la semaine */}
        <View style={styles.section}>
          {renderSectionHeader('Jours de notification', 'calendar')}
          <View style={styles.card}>
            <View style={styles.daysGrid}>
              {daysOfWeek.map(day => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dayButton,
                    preferences.allowedDays.includes(day.value) && styles.dayButtonActive,
                    !preferences.isEnabled && styles.dayButtonDisabled
                  ]}
                  onPress={() => toggleDay(day.value)}
                  disabled={!preferences.isEnabled}
                >
                  <Text style={[
                    styles.dayButtonText,
                    preferences.allowedDays.includes(day.value) && styles.dayButtonTextActive,
                    !preferences.isEnabled && styles.dayButtonTextDisabled
                  ]}>
                    {day.label.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Heures de notification */}
        <View style={styles.section}>
          {renderSectionHeader('Heures de notification', 'time')}
          <View style={styles.card}>
            <View style={styles.hoursContainer}>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursLabel}>Heures actives :</Text>
                <Text style={styles.hoursValue}>
                  {preferences.startHour}h - {preferences.endHour}h
                </Text>
              </View>
              <Text style={styles.hoursSubtitle}>
                Les notifications seront envoyées uniquement entre ces heures
              </Text>
            </View>
          </View>
        </View>

        {/* Horaires spécifiques */}
        <View style={styles.section}>
          {renderSectionHeader('Horaires spécifiques', 'alarm')}
          <View style={styles.card}>
            <View style={styles.timesGrid}>
              {renderTimeInput('Matin', preferences.morningTime, (value) => updatePreference('morningTime', value))}
              {renderTimeInput('Midi', preferences.noonTime, (value) => updatePreference('noonTime', value))}
              {renderTimeInput('Après-midi', preferences.afternoonTime, (value) => updatePreference('afternoonTime', value))}
              {renderTimeInput('Soir', preferences.eveningTime, (value) => updatePreference('eveningTime', value))}
            </View>
          </View>
        </View>

        {/* Espacement pour le bouton flottant */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bouton de sauvegarde flottant - visible seulement s'il y a des changements */}
      {hasChanges && (
        <TouchableOpacity
          style={[styles.floatingButton, isSaving && styles.floatingButtonDisabled]}
          onPress={savePreferences}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.floatingButtonText}>Sauvegarder</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
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
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonWithChanges: {
    backgroundColor: '#10B981',
  },
  saveButtonNoChanges: {
    backgroundColor: 'transparent',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextActive: {
    color: '#fff',
  },
  saveButtonTextInactive: {
    color: '#9CA3AF',
  },
  changesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  changesIndicatorText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleItemDisabled: {
    opacity: 0.5,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  toggleTitleDisabled: {
    color: '#9CA3AF',
  },
  toggleSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  toggleSubtitleDisabled: {
    color: '#9CA3AF',
  },
  whatsappNumberContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    minWidth: 45,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dayButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  dayButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  dayButtonTextDisabled: {
    color: '#9CA3AF',
  },
  hoursContainer: {
    alignItems: 'center',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hoursLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8,
  },
  hoursValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  hoursSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  timesGrid: {
    gap: 12,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
    textAlign: 'center',
    width: 80,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonDisabled: {
    opacity: 0.7,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});