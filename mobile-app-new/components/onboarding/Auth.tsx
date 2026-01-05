import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { authService } from '@/lib/api';
import { signInWithGoogle } from '@/lib/googleAuth';
import { signInWithApple, isAppleSignInAvailable } from '@/lib/appleAuth';

interface AuthProps {
  onAuth: (isNewUser: boolean) => void;
  onError?: (error: string) => void;
}

export function Auth({ onAuth, onError }: AuthProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApple, setShowApple] = useState(false);

  // Vérifier si Apple Sign-In est disponible
  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      isAppleSignInAvailable().then(setShowApple);
    }
  }, []);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await authService.login({ email, password });
        onAuth(false); // Existing user
      } else {
        await authService.signup({ name: email.split('@')[0], email, password });
        onAuth(true); // New user
      }
    } catch (error: any) {
      const message = error?.message || t('somethingWentWrong');
      Alert.alert(t('error'), message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      const response = await authService.loginWithGoogle(result.idToken);
      // Détecter si c'est un nouvel utilisateur basé sur la réponse
      const isNew = response.message?.includes('créé') || !response.user?.name;
      onAuth(isNew);
    } catch (error: any) {
      if (!error.message?.includes('annulée')) {
        Alert.alert(t('error'), error.message || t('somethingWentWrong'));
        onError?.(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithApple();
      const response = await authService.loginWithApple(
        result.identityToken,
        result.user.email,
        result.user.name
      );
      const isNew = response.message?.includes('créé') || !response.user?.name;
      onAuth(isNew);
    } catch (error: any) {
      if (!error.message?.includes('annulée')) {
        Alert.alert(t('error'), error.message || t('somethingWentWrong'));
        onError?.(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isLogin ? t('welcomeBack') : t('createAccount')}
          </Text>
          <Text style={styles.subtitle}>{t('chooseFastest')}</Text>
        </View>

        <View style={styles.authOptions}>
          {/* Google */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleAuth}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <View style={styles.socialIcon}>
                <Ionicons name="logo-google" size={20} color="#000" />
              </View>
              <Text style={styles.socialButtonText}>{t('continueWithGoogle')}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Apple */}
          {showApple && (
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleAppleAuth}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <View style={styles.socialIcon}>
                  <Ionicons name="logo-apple" size={22} color="#000" />
                </View>
                <Text style={styles.socialButtonText}>{t('continueWithApple')}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Divider */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('or')}</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Email & Password */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.emailForm}>
            <TextInput
              style={styles.input}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder={t('passwordPlaceholder')}
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.emailButton, (!email || !password) && styles.emailButtonDisabled]}
              onPress={handleEmailAuth}
              activeOpacity={0.8}
              disabled={!email || !password || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.emailButtonText}>
                  {isLogin ? t('loginButton') : t('signUpButton')}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Toggle login/signup */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.toggleButtonText}>
              {isLogin ? t('createAccountLink') : t('alreadyHaveAccount')}
            </Text>
          </TouchableOpacity>

          <Text style={styles.noSpam}>{t('noSpam')}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -1,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  authOptions: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  socialIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dividerText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  emailForm: {
    gap: 12,
  },
  input: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#000000',
  },
  emailButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  emailButtonDisabled: {
    opacity: 0.4,
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 14,
  },
  noSpam: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
    marginTop: 16,
  },
});

