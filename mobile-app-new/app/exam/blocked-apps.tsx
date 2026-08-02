import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { DeviceActivitySelectionViewPersisted } from 'react-native-device-activity';
import {
  BLOCKED_APPS_SELECTION_ID,
  getAuthorizationStatus,
  getBlockedSelectionCount,
  isAppBlockingSupported,
  requestAuthorization,
} from '@/utils/appBlocking';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Choix des applications bloquées pendant un bloc de révision.
 *
 * La sélection est rendue par une vue native d'Apple : le système ne laisse pas
 * l'app lire la liste des applications choisies, seulement la persister sous un
 * jeton opaque et en compter les éléments. Cet écran ne peut donc pas afficher
 * "TikTok, Instagram", uniquement "3 applications".
 */
export default function BlockedAppsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const supported = isAppBlockingSupported();
  const [status, setStatus] = useState(() => getAuthorizationStatus());
  const [count, setCount] = useState(0);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (status === 'approved') setCount(getBlockedSelectionCount());
  }, [status]);

  const handleRequestAuthorization = async () => {
    setRequesting(true);
    try {
      await requestAuthorization();
      setStatus(getAuthorizationStatus());
    } finally {
      setRequesting(false);
    }
  };

  const renderBody = () => {
    if (!supported) {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="phone-portrait-outline" size={32} color="rgba(0,0,0,0.3)" />
          <Text style={styles.stateText}>{t('blockAppsUnsupported')}</Text>
        </View>
      );
    }

    if (status === 'denied') {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="lock-closed-outline" size={32} color="rgba(0,0,0,0.3)" />
          <Text style={styles.stateText}>{t('blockAppsDenied')}</Text>
        </View>
      );
    }

    if (status !== 'approved') {
      return (
        <View style={styles.stateCard}>
          <Ionicons name="shield-outline" size={32} color="rgba(0,0,0,0.3)" />
          <Text style={styles.stateText}>{t('blockAppsPermissionExplainer')}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRequestAuthorization}
            disabled={requesting}
            activeOpacity={0.8}
          >
            {requesting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{t('blockAppsAllow')}</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.countLabel}>
          {count > 0
            ? `${count} ${t('blockAppsSelected')}`
            : t('blockAppsNoSelection')}
        </Text>
        <DeviceActivitySelectionViewPersisted
          style={styles.picker}
          familyActivitySelectionId={BLOCKED_APPS_SELECTION_ID}
          headerText={t('blockAppsPickerHeader')}
          footerText={t('blockAppsPickerFooter')}
          onSelectionChange={event => {
            const { applicationCount, categoryCount, webDomainCount } =
              event.nativeEvent;
            setCount(applicationCount + categoryCount + webDomainCount);
          }}
        />
      </>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('blockApps')}</Text>
        </View>
        <View style={styles.backButton} />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(200).duration(400)}
        style={[styles.body, { paddingBottom: insets.bottom + 16 }]}
      >
        {renderBody()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
  },
  countLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  picker: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  stateCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  stateText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
