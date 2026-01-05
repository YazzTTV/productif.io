import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { signInWithGoogle } from '@/lib/googleAuth';
import { signInWithApple, isAppleSignInAvailable } from '@/lib/appleAuth';
import { authService } from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConnectionScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingApple, setIsLoadingApple] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    isAppleSignInAvailable().then(setAppleAvailable);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleGoogleSignup = async () => {
    if (!isMountedRef.current) return;
    setIsLoadingGoogle(true);
    
    try {
      const googleResult = await signInWithGoogle();
      
      if (!isMountedRef.current) return;
      
      const response = await authService.loginWithGoogle(googleResult.idToken);
      
      if (!isMountedRef.current) return;
      
      if (response.success) {
        router.replace('/(onboarding-new)/question');
      } else {
        Alert.alert('Erreur', 'Échec de la connexion avec Google');
      }
      
    } catch (error) {
      console.error('Erreur Google signup:', error);
      if (error instanceof Error && error.message.includes('annulée')) {
        return;
      }
      if (isMountedRef.current) {
        Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingGoogle(false);
      }
    }
  };

  const handleAppleSignup = async () => {
    if (!isMountedRef.current) return;
    setIsLoadingApple(true);
    
    try {
      const appleResult = await signInWithApple();
      
      if (!isMountedRef.current) return;
      
      const response = await authService.loginWithApple(
        appleResult.identityToken,
        appleResult.user.email,
        appleResult.user.name
      );
      
      if (!isMountedRef.current) return;
      
      if (response.success) {
        router.replace('/(onboarding-new)/question');
      } else {
        Alert.alert('Erreur', 'Échec de la connexion avec Apple');
      }
      
    } catch (error) {
      console.error('Erreur Apple signup:', error);
      if (error instanceof Error && error.message.includes('annulée')) {
        return;
      }
      if (isMountedRef.current) {
        Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingApple(false);
      }
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    setIsLoadingEmail(true);
    
    try {
      if (isLogin) {
        const response = await authService.login({ email, password });
        if (response.success) {
          router.replace('/(tabs)');
        } else {
          Alert.alert('Erreur', response.message || 'Email ou mot de passe incorrect');
        }
      } else {
        // Pour l'inscription, on utilise l'email comme nom par défaut
        const name = email.split('@')[0] || 'User';
        const response = await authService.signup({ name, email, password });
        if (response.success) {
          router.replace('/(onboarding-new)/question');
        } else {
          Alert.alert('Erreur', response.message || 'Échec de la création du compte');
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoadingEmail(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.header}>
            <Text style={styles.title}>
              {isLogin 
                ? (t('welcomeBack') || 'Welcome back')
                : (t('createAccount') || 'Create your account')
              }
            </Text>
            <Text style={styles.subtitle}>
              {t('chooseFastest') || 'Choose the fastest way to continue.'}
            </Text>
          </Animated.View>

          {/* Social Auth Buttons */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.socialButtons}>
            {/* Google Button */}
            <TouchableOpacity
              onPress={handleGoogleSignup}
              style={styles.socialButton}
              activeOpacity={0.7}
              disabled={isLoadingGoogle}
            >
              {isLoadingGoogle ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#000" />
                  <Text style={styles.socialButtonText}>
                    {t('continueWithGoogle') || 'Continue with Google'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Apple Button */}
            {appleAvailable && (
              <TouchableOpacity
                onPress={handleAppleSignup}
                style={styles.socialButton}
                activeOpacity={0.7}
                disabled={isLoadingApple}
              >
                {isLoadingApple ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={20} color="#000" />
                    <Text style={styles.socialButtonText}>
                      {t('continueWithApple') || 'Continue with Apple'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Divider */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('or') || 'or'}</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Email & Password */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder={t('emailPlaceholder') || 'Your email'}
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              style={styles.input}
              placeholder={t('passwordPlaceholder') || 'Password'}
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            <TouchableOpacity
              onPress={handleEmailAuth}
              style={[
                styles.primaryButton,
                (!email || !password) && styles.primaryButtonDisabled
              ]}
              activeOpacity={0.8}
              disabled={!email || !password || isLoadingEmail}
            >
              {isLoadingEmail ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isLogin 
                    ? (t('loginButton') || 'Log in')
                    : (t('signUpButton') || 'Sign up')
                  }
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Toggle Login/Signup */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <TouchableOpacity
              onPress={() => setIsLogin(!isLogin)}
              style={styles.toggleButton}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleButtonText}>
                {isLogin 
                  ? (t('createAccountLink') || 'Create an account')
                  : (t('alreadyHaveAccount') || 'I already have an account')
                }
              </Text>
            </TouchableOpacity>

            <Text style={styles.noSpamText}>
              {t('noSpam') || "We don't spam. Ever."}
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.03 * 24,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  socialButtons: {
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  form: {
    gap: 12,
    marginBottom: 24,
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
  primaryButton: {
    backgroundColor: '#16A34A',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleButtonText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  noSpamText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
    marginTop: 16,
  },
});
