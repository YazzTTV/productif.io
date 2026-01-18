import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authService } from '@/lib/api';
import { signInWithGoogle } from '@/lib/googleAuth';
import { signInWithApple, isAppleSignInAvailable } from '@/lib/appleAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginScreen() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingApple, setIsLoadingApple] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    // Vérifier si Apple Sign-In est disponible
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const handleAppleLogin = async () => {
    setIsLoadingApple(true);
    
    try {
      // Lancer le flux OAuth Apple avec la lib native
      const appleResult = await signInWithApple();
      
      // Envoyer l'identityToken au backend dans le header Authorization
      const response = await authService.loginWithApple(
        appleResult.identityToken,
        appleResult.user.email,
        appleResult.user.name
      );
      
      if (response.success) {
        // Marquer la session comme persistante
        await AsyncStorage.setItem('onboarding_completed', 'true');
        // Connexion réussie, redirection vers le dashboard
        router.replace('/(tabs)');
      } else {
        Alert.alert(t('error'), t('appleLoginFailed', undefined, 'Échec de la connexion avec Apple'));
      }
      
    } catch (error) {
      console.error('Erreur de connexion Apple:', error);
      if (error instanceof Error && error.message.includes('annulée')) {
        // Ne pas afficher d'alerte si l'utilisateur a annulé
        return;
      }
      Alert.alert(t('error'), error instanceof Error ? error.message : t('appleLoginError', undefined, 'Une erreur est survenue lors de la connexion avec Apple'));
    } finally {
      setIsLoadingApple(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('loginFieldsRequired', undefined, 'Veuillez remplir tous les champs'));
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.login({ email, password });
      
      if (response.success) {
        // Marquer la session comme persistante pour éviter une déconnexion à la fermeture
        await AsyncStorage.setItem('onboarding_completed', 'true');
        // Connexion réussie, redirection vers le dashboard
        router.replace('/(tabs)');
      } else {
        Alert.alert(t('error'), t('loginIncorrect', undefined, 'Email ou mot de passe incorrect'));
      }
      
    } catch (error) {
      console.error('Erreur de connexion:', error);
      Alert.alert(t('error'), error instanceof Error ? error.message : t('somethingWentWrong'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    
    try {
      // Lancer le flux OAuth Google avec la lib native
      const googleResult = await signInWithGoogle();
      
      // Envoyer l'idToken au backend dans le header Authorization
      const response = await authService.loginWithGoogle(googleResult.idToken);
      
      if (response.success) {
        // Marquer la session comme persistante
        await AsyncStorage.setItem('onboarding_completed', 'true');
        // Connexion réussie, redirection vers le dashboard
        router.replace('/(tabs)');
      } else {
        Alert.alert(t('error'), t('googleLoginFailed', undefined, 'Échec de la connexion avec Google'));
      }
      
    } catch (error) {
      console.error('Erreur de connexion Google:', error);
      if (error instanceof Error && error.message.includes('annulée')) {
        // Ne pas afficher d'alerte si l'utilisateur a annulé
        return;
      }
      Alert.alert(t('error'), error instanceof Error ? error.message : t('somethingWentWrong'));
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#10B981" />
          </View>
          <Text style={styles.title}>Productif.io</Text>
          <Text style={styles.subtitle}>{t('loginSubtitle', undefined, 'Votre compagnon de productivité')}</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>{t('welcomeBack', undefined, 'Connexion')}</Text>
          <Text style={styles.formSubtitle}>
            {t('loginPrompt', undefined, 'Saisissez vos identifiants pour vous connecter')}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('emailPlaceholder', undefined, 'Email')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('emailPlaceholder', undefined, 'exemple@email.com')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('passwordPlaceholder', undefined, 'Mot de passe')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bouton Apple - seulement si disponible */}
          {appleAvailable && (
            <TouchableOpacity
              style={[styles.appleButton, isLoadingApple && styles.appleButtonDisabled]}
              onPress={handleAppleLogin}
              disabled={isLoadingApple}
              activeOpacity={0.9}
            >
              {isLoadingApple ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text style={styles.appleButtonText}>{t('continueWithApple')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Bouton Google - même design que l'onboarding */}
          <TouchableOpacity
            style={[styles.googleButton, isLoadingGoogle && styles.googleButtonDisabled, appleAvailable && styles.buttonSpacing]}
            onPress={handleGoogleLogin}
            disabled={isLoadingGoogle}
            activeOpacity={0.9}
          >
            {isLoadingGoogle ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text style={styles.googleButtonText}>{t('continueWithGoogle')}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Séparateur */}
          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>{t('or', undefined, 'OU')}</Text>
            <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>{t('loginButton', undefined, 'Se connecter')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.signupLink}
            onPress={() => router.push('/signup' as any)}
          >
            <Text style={styles.signupText}>
              {t('legacyNoAccount', undefined, 'Pas encore de compte ?')} <Text style={styles.signupLinkText}>{t('legacySignup', undefined, 'Inscrivez-vous')}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('loginTerms', undefined, "En vous connectant, vous acceptez nos conditions d'utilisation")}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#111827',
  },
  eyeIcon: {
    padding: 12,
  },
  loginButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signupLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signupLinkText: {
    color: '#10B981',
    fontWeight: '500',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  appleButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  appleButtonDisabled: {
    opacity: 0.6,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonSpacing: {
    marginTop: 0,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  separatorText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
}); 
