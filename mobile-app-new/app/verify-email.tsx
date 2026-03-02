import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authService } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyEmailScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleResend = async () => {
    try {
      setIsResending(true);
      const response = await authService.resendVerificationEmail();
      if (response.alreadyVerified) {
        Alert.alert(t('info', undefined, 'Info'), t('emailAlreadyVerified', undefined, 'Ton email est déjà vérifié.'));
        router.replace('/(tabs)');
        return;
      }
      Alert.alert(
        t('success', undefined, 'Succès'),
        t('emailVerificationSent', undefined, 'Email de vérification envoyé.')
      );
    } catch (error: any) {
      Alert.alert(
        t('error', undefined, 'Erreur'),
        error?.message || t('emailVerificationSendError', undefined, 'Impossible d\'envoyer l\'email.')
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleCheck = async () => {
    try {
      setIsChecking(true);
      const user = await authService.checkAuth();
      const isVerified = user?.emailVerified ?? !!user?.emailVerifiedAt;
      const needsVerification = user?.emailVerificationRequired ?? !isVerified;
      if (!needsVerification) {
        Alert.alert(
          t('success', undefined, 'Succès'),
          t('emailVerifiedSuccess', undefined, 'Merci, ton email est vérifié.')
        );
        router.replace('/(tabs)');
        return;
      }
      Alert.alert(
        t('info', undefined, 'Info'),
        t('emailNotVerifiedYet', undefined, 'Ton email n\'est pas encore vérifié.')
      );
    } catch (error: any) {
      Alert.alert(
        t('error', undefined, 'Erreur'),
        error?.message || t('emailVerificationCheckError', undefined, 'Impossible de vérifier le statut.')
      );
    } finally {
      setIsChecking(false);
    }
  };

  const autoCheck = async () => {
    const user = await authService.checkAuth();
    const isVerified = user?.emailVerified ?? !!user?.emailVerifiedAt;
    const needsVerification = user?.emailVerificationRequired ?? !isVerified;
    if (!needsVerification) {
      router.replace('/(tabs)');
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await authService.logout();
              await AsyncStorage.removeItem('onboarding_completed');
              router.replace('/(onboarding-new)/connection');
            } catch (error) {
              await AsyncStorage.removeItem('onboarding_completed');
              router.replace('/(onboarding-new)/connection');
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  React.useEffect(() => {
    intervalRef.current = setInterval(() => {
      autoCheck().catch(() => {});
    }, 8000);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        autoCheck().catch(() => {});
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      sub.remove();
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('verifyYourEmail', undefined, 'Vérifie ton email')}</Text>
        <Text style={styles.body}>
          {t(
            'verifyYourEmailBody',
            undefined,
            'On t\'a envoyé un email de vérification. Clique sur le lien pour confirmer.'
          )}
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleResend} disabled={isResending}>
          {isResending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{t('resendEmail', undefined, 'Renvoyer')}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleCheck} disabled={isChecking}>
          {isChecking ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.secondaryButtonText}>{t('iVerified', undefined, 'J\'ai vérifié')}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => Linking.openURL('mailto:')}
        >
          <Text style={styles.linkText}>
            {t('openMailbox', undefined, 'Ouvrir ma boîte mail')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <Text style={styles.logoutText}>
              {t('disconnectButton', undefined, 'Se déconnecter')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  linkText: {
    color: '#10B981',
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    color: '#B91C1C',
    fontWeight: '600',
  },
});
