import React, { useState } from 'react';
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
import { authService, onboardingService, getAuthToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SignupScreen() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert(
        t('error', undefined, 'Erreur'),
        t('signupFillAllFields', undefined, 'Veuillez remplir tous les champs')
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        t('error', undefined, 'Erreur'),
        t('signupPasswordsMismatch', undefined, 'Les mots de passe ne correspondent pas')
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        t('error', undefined, 'Erreur'),
        t('signupPasswordTooShort', undefined, 'Le mot de passe doit contenir au moins 6 caractères')
      );
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.signup({
        name,
        email,
        password,
      });
      
      if (response.success && response.token) {
        // Le token est déjà sauvegardé automatiquement dans authService.signup()
        // Mais on le sauvegarde explicitement pour être sûr qu'il est bien mis à jour
        await authService.setToken(response.token);
        
        console.log('✅ [SIGNUP] Compte créé avec succès');
        console.log('👤 [SIGNUP] User ID:', response.user?.id);
        console.log('📧 [SIGNUP] Email:', response.user?.email);
        console.log('🔑 [SIGNUP] Token présent:', response.token ? 'oui' : 'non');
        
        // Vérifier que le token est bien récupéré après sauvegarde
        const tokenAfterSave = await getAuthToken();
        console.log('🔍 [SIGNUP] Token après sauvegarde:', tokenAfterSave ? 'présent' : 'absent');
        
        // Attendre un peu pour que le token soit bien stocké
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Vérifier à nouveau le token avant de faire l'appel API
        const tokenBeforeAPI = await getAuthToken();
        console.log('🔍 [SIGNUP] Token avant appel API:', tokenBeforeAPI ? 'présent' : 'absent');
        
        // Synchroniser la langue si elle a été sélectionnée avant l'inscription
        try {
          const savedLanguage = await AsyncStorage.getItem('onboarding_language');
          console.log('🌐 [SIGNUP] Langue sauvegardée trouvée:', savedLanguage);
          
          if (savedLanguage) {
            console.log('💾 [SIGNUP] Tentative de sauvegarde de la langue dans l\'API...');
            await onboardingService.saveOnboardingData({
              language: savedLanguage,
              currentStep: 2, // Étape de sélection de langue (après intro)
            });
            console.log('✅ [SIGNUP] Langue synchronisée après inscription:', savedLanguage);
          } else {
            console.log('ℹ️ [SIGNUP] Aucune langue sauvegardée trouvée');
          }
        } catch (error: any) {
          console.error('❌ [SIGNUP] Erreur lors de la synchronisation de la langue:', error);
          console.error('❌ [SIGNUP] Détails:', error?.message);
          // Ne pas bloquer le flux - on continue quand même
        }
        
        // Rediriger vers le questionnaire d'onboarding
        router.replace({
          pathname: '/(onboarding-new)/question',
          params: { index: 0, answers: '[]' }
        });
      } else {
        console.error('❌ [SIGNUP] Réponse d\'inscription invalide:', response);
        Alert.alert(
          t('error', undefined, 'Erreur'),
          response.message || t('signupInvalidResponse', undefined, 'Impossible de créer le compte')
        );
      }
      
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      Alert.alert(
        t('error', undefined, 'Erreur'),
        error instanceof Error ? error.message : t('signupCreateAccountError', undefined, 'Impossible de créer le compte. Veuillez réessayer.')
      );
    } finally {
      setIsLoading(false);
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
          <Text style={styles.subtitle}>
            {t('signupHeroSubtitle', undefined, 'Rejoignez notre communauté')}
          </Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {t('signupFormTitle', undefined, 'Inscription')}
          </Text>
          <Text style={styles.formSubtitle}>
            {t('signupFormSubtitle', undefined, 'Créez votre compte pour commencer')}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {t('signupFullNameLabel', undefined, 'Nom complet')}
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('signupFullNamePlaceholder', undefined, 'Votre nom')}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {t('signupEmailLabel', undefined, 'Email')}
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('signupEmailPlaceholder', undefined, 'exemple@email.com')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {t('signupPasswordLabel', undefined, 'Mot de passe')}
            </Text>
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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {t('signupConfirmPasswordLabel', undefined, 'Confirmer le mot de passe')}
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signupButtonText}>
                {t('signupCreateAccountCta', undefined, 'Créer mon compte')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.loginText}>
              {t('signupAlreadyHaveAccount', undefined, 'Déjà un compte ?')}{' '}
              <Text style={styles.loginLinkText}>
                {t('signupLoginLink', undefined, 'Se connecter')}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('signupTermsNotice', undefined, 'En créant un compte, vous acceptez nos conditions d\'utilisation')}
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
  signupButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLinkText: {
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
}); 
