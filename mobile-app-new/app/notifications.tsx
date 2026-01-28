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
 Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiCall } from '@/lib/api';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useLanguage } from '@/contexts/LanguageContext';

type TimeWindow = {
  start: string;
  end: string;
};

interface NotificationPreferences {
  isEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  // WhatsApp retiré (plus utilisé)
  startHour: number;
  endHour: number;
  allowedDays: number[];
  notificationTypes: string[];
  // Rappels fixes
  morningReminder: boolean;
  noonReminder: boolean;
  afternoonReminder: boolean;
  eveningReminder: boolean;
  nightReminder: boolean;
  improvementReminder: boolean;
  recapReminder: boolean;
  taskReminder: boolean;
  habitReminder: boolean;
  motivation: boolean;
  dailySummary: boolean;
  morningTime: string;
  noonTime: string;
  afternoonTime: string;
  eveningTime: string;
  nightTime: string;
  improvementTime: string;
  recapTime: string;
  timezone: string;
  // Questions aléatoires
  moodEnabled: boolean;
  stressEnabled: boolean;
  focusEnabled: boolean;
  moodWindows: TimeWindow[];
  stressWindows: TimeWindow[];
  focusWindows: TimeWindow[];
  moodDailyCount: number;
  stressDailyCount: number;
  focusDailyCount: number;
}

const defaultWindows: TimeWindow[] = [
  { start: '09:00', end: '12:00' },
  { start: '14:00', end: '18:00' },
];

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
  noonReminder: true,
  afternoonReminder: true,
  eveningReminder: true,
  nightReminder: true,
  improvementReminder: true,
  recapReminder: true,
  taskReminder: true,
  habitReminder: true,
  motivation: true,
  dailySummary: true,
  morningTime: '07:30',
  noonTime: '12:00',
  afternoonTime: '15:00',
  eveningTime: '18:30',
  nightTime: '21:30',
  improvementTime: '10:00',
  recapTime: '21:00',
  timezone: 'Europe/Paris',
  moodEnabled: true,
  stressEnabled: true,
  focusEnabled: true,
  moodWindows: defaultWindows,
  stressWindows: defaultWindows,
  focusWindows: defaultWindows,
  moodDailyCount: 1,
  stressDailyCount: 1,
  focusDailyCount: 1,
};

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { permissionStatus, requestPermissions, expoPushToken } = usePushNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const daysOfWeek = [
    { value: 1, label: t('monday', undefined, 'Lundi') },
    { value: 2, label: t('tuesday', undefined, 'Mardi') },
    { value: 3, label: t('wednesday', undefined, 'Mercredi') },
    { value: 4, label: t('thursday', undefined, 'Jeudi') },
    { value: 5, label: t('friday', undefined, 'Vendredi') },
    { value: 6, label: t('saturday', undefined, 'Samedi') },
    { value: 0, label: t('sunday', undefined, 'Dimanche') },
  ];

  const notificationTypeLabels: Record<string, string> = {
    'TASK_DUE': t('notifTaskDue', undefined, 'Échéances de tâches'),
    'HABIT_REMINDER': t('notifHabitReminder', undefined, "Rappels d'habitudes"),
    'DAILY_SUMMARY': t('notifDailySummary', undefined, 'Résumé quotidien'),
    'MOTIVATION': t('notifMotivation', undefined, 'Messages de motivation'),
    'MORNING_REMINDER': t('notifMorning', undefined, 'Rappel matinal'),
  };

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
      
      const finalPrefs: NotificationPreferences = {
        ...defaultPreferences,
        ...prefs,
        allowedDays: Array.isArray(prefs.allowedDays) ? prefs.allowedDays : defaultPreferences.allowedDays,
        notificationTypes: Array.isArray(prefs.notificationTypes) ? prefs.notificationTypes : defaultPreferences.notificationTypes,
        moodWindows: Array.isArray(prefs.moodWindows) && prefs.moodWindows.length ? prefs.moodWindows : defaultPreferences.moodWindows,
        stressWindows: Array.isArray(prefs.stressWindows) && prefs.stressWindows.length ? prefs.stressWindows : defaultPreferences.stressWindows,
        focusWindows: Array.isArray(prefs.focusWindows) && prefs.focusWindows.length ? prefs.focusWindows : defaultPreferences.focusWindows,
        timezone: prefs.timezone || defaultPreferences.timezone,
        moodDailyCount: prefs.moodDailyCount ?? defaultPreferences.moodDailyCount,
        stressDailyCount: prefs.stressDailyCount ?? defaultPreferences.stressDailyCount,
        focusDailyCount: prefs.focusDailyCount ?? defaultPreferences.focusDailyCount,
      };
      
      setPreferences(finalPrefs);
      setOriginalPreferences(finalPrefs);
      setHasChanges(false);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des préférences:', error);
      // En cas d'erreur, utiliser les préférences par défaut
      setPreferences(defaultPreferences);
      Alert.alert(
        t('warning', undefined, 'Avertissement'),
        t('notifLoadError', undefined, 'Impossible de charger vos préférences existantes. Les valeurs par défaut seront utilisées.'),
        [{ text: t('ok', undefined, 'OK') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    // L'API se base sur l'utilisateur authentifié via JWT, pas besoin d'userId

    if (!hasChanges) {
      console.log('ℹ️ Pas de changements à sauvegarder');
      Alert.alert(t('info', undefined, 'Info'), t('notifNoChanges', undefined, 'Aucune modification à sauvegarder.'));
      return;
    }

    // Vérifier si les notifications push sont activées mais que les permissions ne sont pas accordées
    if (preferences.pushEnabled && permissionStatus !== 'granted') {
      console.log('📱 Notifications push activées mais permissions non accordées, demande des permissions...');
      const granted = await handleRequestPermissions();
      
      // Si les permissions n'ont pas été accordées, désactiver pushEnabled ou annuler la sauvegarde
      if (!granted) {
        Alert.alert(
          t('notifPermissionsRequired', undefined, 'Permissions requises'),
          t('notifPermissionsMessage', undefined, 'Les notifications push nécessitent des permissions. Les notifications push ont été désactivées.'),
          [{ text: t('ok', undefined, 'OK') }]
        );
        // Désactiver pushEnabled si les permissions ne sont pas accordées
        setPreferences(prev => ({ ...prev, pushEnabled: false }));
        return;
      }
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
        t('success'),
        t('notifSaveSuccess', undefined, 'Vos préférences de notification ont été sauvegardées avec succès !'),
        [{ text: t('ok', undefined, 'OK') }]
      );
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      Alert.alert(
        t('error'),
        t('notifSaveError', undefined, 'Impossible de sauvegarder vos préférences. Veuillez réessayer.'),
        [{ text: t('ok', undefined, 'OK') }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      Alert.alert(t('info', undefined, 'Information'), t('notifPlatformUnsupported', undefined, 'Les notifications push ne sont disponibles que sur iOS et Android.'));
      return false;
    }

    setIsRequestingPermissions(true);
    try {
      const granted = await requestPermissions();
      
      if (granted) {
        Alert.alert(
          t('success'),
          t('notifPermissionsGranted', undefined, 'Les permissions de notification ont été accordées ! Vous recevrez maintenant les notifications push.'),
          [{ text: t('ok', undefined, 'OK') }]
        );
        return true;
      } else {
        if (permissionStatus === 'denied') {
          Alert.alert(
            t('notifPermissionsDenied', undefined, 'Permissions refusées'),
            t('notifPermissionsDeniedMessage', undefined, 'Les permissions de notification ont été refusées. Pour les activer, allez dans Réglages > Productif.io > Notifications.'),
            [
              { text: t('cancel'), style: 'cancel' },
              {
                text: t('notifOpenSettings', undefined, 'Ouvrir les réglages'),
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert(
            t('notifPermissionsRequired', undefined, 'Permissions requises'),
            t('notifPermissionsNeeded', undefined, 'Les permissions de notification sont nécessaires pour recevoir des notifications push.'),
            [{ text: t('ok', undefined, 'OK') }]
          );
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la demande de permissions:', error);
      Alert.alert(
        t('error'),
        t('notifPermissionsError', undefined, 'Une erreur est survenue lors de la demande de permissions.'),
        [{ text: t('ok', undefined, 'OK') }]
      );
      return false;
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  const resetPreferences = () => {
    Alert.alert(
      t('reset', undefined, 'Réinitialiser'),
      t('notifResetConfirm', undefined, 'Voulez-vous annuler tous vos changements non sauvegardés ?'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reset', undefined, 'Réinitialiser'),
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
        <Text style={[styles.toggleTitle, disabled && styles.toggleTitleDisabled]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.toggleSubtitle, disabled && styles.toggleSubtitleDisabled]} numberOfLines={2}>{subtitle}</Text>
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

  const renderTimeToggleRow = (
    label: string,
    enabled: boolean,
    onToggle: (value: boolean) => void,
    timeValue: string,
    onTimeChange: (value: string) => void,
    disabled: boolean
  ) => (
    <View style={[styles.timeToggleRow, disabled && styles.toggleItemDisabled]}>
      <View style={styles.timeToggleLeft}>
        <Text style={[styles.timeToggleLabel, disabled && styles.toggleTitleDisabled]}>{label}</Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ false: '#E5E7EB', true: '#10B981' }}
          thumbColor={enabled ? '#fff' : '#9CA3AF'}
        />
      </View>
      <TextInput
        style={[styles.timeInput, styles.timeInputInline, (!enabled || disabled) && styles.timeInputDisabled]}
        value={timeValue}
        onChangeText={onTimeChange}
        placeholder="HH:MM"
        maxLength={5}
        editable={enabled && !disabled}
      />
    </View>
  );

  const renderWindowEditor = (
    label: string,
    enabled: boolean,
    onToggle: (value: boolean) => void,
    windows: TimeWindow[],
    onWindowsChange: (value: TimeWindow[]) => void,
    dailyCount: number,
    onCountChange: (value: number) => void,
    disabled: boolean
  ) => (
    <View style={[styles.card, styles.windowCard, disabled && styles.toggleItemDisabled]}>
      <View style={styles.windowHeader}>
        <View style={styles.windowHeaderLeft}>
          <Text style={[styles.timeToggleLabel, disabled && styles.toggleTitleDisabled]}>{label}</Text>
          <Switch
            value={enabled}
            onValueChange={onToggle}
            disabled={disabled}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            thumbColor={enabled ? '#fff' : '#9CA3AF'}
          />
        </View>
        <View style={styles.countContainer}>
          <Text style={styles.countLabel}>/jour</Text>
          <TextInput
            style={[styles.countInput, (!enabled || disabled) && styles.timeInputDisabled]}
            value={String(dailyCount)}
            keyboardType="numeric"
            onChangeText={(v) => onCountChange(Number(v) || 0)}
            editable={enabled && !disabled}
          />
        </View>
      </View>

      {windows.slice(0, 2).map((w, idx) => (
        <View key={`${label}-${idx}`} style={styles.windowRow}>
          <View style={styles.windowInput}>
            <Text style={styles.timeLabel}>Début</Text>
            <TextInput
              style={[styles.timeInput, styles.timeInputInline, (!enabled || disabled) && styles.timeInputDisabled]}
              value={w.start}
              onChangeText={(val) => {
                const copy = [...windows];
                copy[idx] = { ...copy[idx], start: val };
                onWindowsChange(copy);
              }}
              placeholder="09:00"
              maxLength={5}
              editable={enabled && !disabled}
            />
          </View>
          <View style={styles.windowInput}>
            <Text style={styles.timeLabel}>Fin</Text>
            <TextInput
              style={[styles.timeInput, styles.timeInputInline, (!enabled || disabled) && styles.timeInputDisabled]}
              value={w.end}
              onChangeText={(val) => {
                const copy = [...windows];
                copy[idx] = { ...copy[idx], end: val };
                onWindowsChange(copy);
              }}
              placeholder="12:00"
              maxLength={5}
              editable={enabled && !disabled}
            />
          </View>
        </View>
      ))}
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
              async (value) => {
                // Si on active les notifications et que les permissions push ne sont pas accordées, les demander
                if (value && permissionStatus !== 'granted') {
                  console.log('📱 Activation des notifications, demande des permissions push...');
                  const granted = await handleRequestPermissions();
                  
                  if (granted) {
                    // Si les permissions sont accordées, activer les notifications
                    updatePreference('isEnabled', true);
                  } else {
                    // Si les permissions sont refusées, ne pas activer les notifications
                    // Le toggle reste désactivé
                    console.log('⚠️ Permissions refusées, notifications non activées');
                  }
                } else {
                  // Si on désactive ou si les permissions sont déjà accordées, mettre à jour normalement
                  updatePreference('isEnabled', value);
                }
              }
            )}
            <View style={styles.timeInputContainer}>
              <Text style={styles.timeLabel}>Fuseau horaire</Text>
              <TextInput
                style={styles.textInput}
                value={preferences.timezone}
                onChangeText={(value) => updatePreference('timezone', value)}
                placeholder="Europe/Paris"
                autoCapitalize="none"
                editable={preferences.isEnabled}
              />
            </View>
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
            <View style={styles.pushNotificationRow}>
              <View style={styles.pushNotificationInfo}>
                <Text style={styles.pushNotificationTitle}>Notifications push</Text>
                <Text style={styles.pushNotificationDescription}>
                  Recevoir des notifications sur l'appareil
                </Text>
                {permissionStatus && (
                  <View style={styles.permissionStatus}>
                    <Ionicons
                      name={
                        permissionStatus === 'granted'
                          ? 'checkmark-circle'
                          : permissionStatus === 'denied'
                          ? 'close-circle'
                          : 'alert-circle'
                      }
                      size={16}
                      color={
                        permissionStatus === 'granted'
                          ? '#00C27A'
                          : permissionStatus === 'denied'
                          ? '#FF3B30'
                          : '#FF9500'
                      }
                    />
                    <Text
                      style={[
                        styles.permissionStatusText,
                        {
                          color:
                            permissionStatus === 'granted'
                              ? '#00C27A'
                              : permissionStatus === 'denied'
                              ? '#FF3B30'
                              : '#FF9500',
                        },
                      ]}
                    >
                      {permissionStatus === 'granted'
                        ? 'Permissions accordées'
                        : permissionStatus === 'denied'
                        ? 'Permissions refusées'
                        : 'Permissions non demandées'}
                    </Text>
                    {expoPushToken && (
                      <Text style={styles.tokenInfo}>
                        Token: {expoPushToken.substring(0, 20)}...
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <View style={styles.pushNotificationActions}>
                <Switch
                  value={preferences.pushEnabled}
                  onValueChange={async (value) => {
                    if (value && permissionStatus !== 'granted') {
                      // Demander automatiquement les permissions sans alerte
                      console.log('📱 Activation des notifications push, demande des permissions...');
                      const granted = await handleRequestPermissions();
                      
                      if (granted) {
                        // Si les permissions sont accordées, activer le toggle
                        updatePreference('pushEnabled', true);
                      } else {
                        // Si les permissions sont refusées, ne pas activer le toggle
                        // L'alerte est déjà affichée dans handleRequestPermissions
                        console.log('⚠️ Permissions refusées, notifications push non activées');
                      }
                    } else {
                      updatePreference('pushEnabled', value);
                    }
                  }}
                  disabled={!preferences.isEnabled}
                />
                {permissionStatus !== 'granted' && (
                  <TouchableOpacity
                    style={[
                      styles.requestPermissionButton,
                      isRequestingPermissions && styles.requestPermissionButtonDisabled,
                    ]}
                    onPress={handleRequestPermissions}
                    disabled={isRequestingPermissions}
                  >
                    {isRequestingPermissions ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="notifications-outline" size={16} color="#fff" />
                        <Text style={styles.requestPermissionButtonText}>
                          {permissionStatus === 'denied' ? 'Ouvrir les réglages' : 'Demander les permissions'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
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
          {renderSectionHeader('Rappels fixes (horaires)', 'alarm')}
          <View style={styles.card}>
            {renderTimeToggleRow(
              'Rappel matin',
              preferences.morningReminder,
              (v) => updatePreference('morningReminder', v),
              preferences.morningTime,
              (value) => updatePreference('morningTime', value),
              !preferences.isEnabled
            )}
            {renderTimeToggleRow(
              'Rappel midi',
              preferences.noonReminder,
              (v) => updatePreference('noonReminder', v),
              preferences.noonTime,
              (value) => updatePreference('noonTime', value),
              !preferences.isEnabled
            )}
            {renderTimeToggleRow(
              'Rappel après-midi',
              preferences.afternoonReminder,
              (v) => updatePreference('afternoonReminder', v),
              preferences.afternoonTime,
              (value) => updatePreference('afternoonTime', value),
              !preferences.isEnabled
            )}
            {renderTimeToggleRow(
              'Rappel soir',
              preferences.eveningReminder,
              (v) => updatePreference('eveningReminder', v),
              preferences.eveningTime,
              (value) => updatePreference('eveningTime', value),
              !preferences.isEnabled
            )}
            {renderTimeToggleRow(
              'Rappel nuit',
              preferences.nightReminder,
              (v) => updatePreference('nightReminder', v),
              preferences.nightTime,
              (value) => updatePreference('nightTime', value),
              !preferences.isEnabled
            )}
            {renderTimeToggleRow(
              'Rappel amélioration',
              preferences.improvementReminder,
              (v) => updatePreference('improvementReminder', v),
              preferences.improvementTime,
              (value) => updatePreference('improvementTime', value),
              !preferences.isEnabled
            )}
            {renderTimeToggleRow(
              'Rappel récap analyse',
              preferences.recapReminder,
              (v) => updatePreference('recapReminder', v),
              preferences.recapTime,
              (value) => updatePreference('recapTime', value),
              !preferences.isEnabled
            )}
          </View>
        </View>

        {/* Questions aléatoires (humeur / stress / focus) */}
        <View style={styles.section}>
          {renderSectionHeader('Questions aléatoires', 'help-circle')}
          {renderWindowEditor(
            'Humeur',
            preferences.moodEnabled,
            (v) => updatePreference('moodEnabled', v),
            preferences.moodWindows,
            (w) => updatePreference('moodWindows', w),
            preferences.moodDailyCount,
            (n) => updatePreference('moodDailyCount', n),
            !preferences.isEnabled
          )}
          {renderWindowEditor(
            'Stress',
            preferences.stressEnabled,
            (v) => updatePreference('stressEnabled', v),
            preferences.stressWindows,
            (w) => updatePreference('stressWindows', w),
            preferences.stressDailyCount,
            (n) => updatePreference('stressDailyCount', n),
            !preferences.isEnabled
          )}
          {renderWindowEditor(
            'Focus',
            preferences.focusEnabled,
            (v) => updatePreference('focusEnabled', v),
            preferences.focusWindows,
            (w) => updatePreference('focusWindows', w),
            preferences.focusDailyCount,
            (n) => updatePreference('focusDailyCount', n),
            !preferences.isEnabled
          )}
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
    flexShrink: 1,
    marginRight: 8,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
    flexShrink: 1,
  },
  toggleTitleDisabled: {
    color: '#9CA3AF',
  },
  toggleSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    flexShrink: 1,
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
  timeInputInline: {
    flex: 0,
    width: 90,
  },
  timeInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  timeToggleRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeToggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  windowCard: {
    marginBottom: 12,
  },
  windowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  windowHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  countInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 60,
    fontSize: 14,
    textAlign: 'center',
    color: '#111827',
    backgroundColor: '#fff',
  },
  windowRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  windowInput: {
    flex: 1,
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
  pushNotificationRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pushNotificationInfo: {
    flex: 1,
    marginBottom: 8,
  },
  pushNotificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  pushNotificationDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  permissionStatusText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  tokenInfo: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  pushNotificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestPermissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00C27A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  requestPermissionButtonDisabled: {
    opacity: 0.6,
  },
  requestPermissionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
