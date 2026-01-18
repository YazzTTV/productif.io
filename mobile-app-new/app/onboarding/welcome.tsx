import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect } from 'react';
import { authService } from '@/lib/api';
import { signInWithGoogle } from '@/lib/googleAuth';
import productifLogo from '../../assets/images/icon.png';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';

export default function WelcomeScreen() {
  const { t } = useLanguage();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  // Connexion
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  // Inscription
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleApple = async () => {
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        Alert.alert(t('legacyAppleUnavailableTitle', undefined, 'Non disponible'), t('legacyAppleUnavailableMessage', undefined, "Apple Sign-In n'est pas disponible dans Expo Go. Utilisez un build de développement."));
        return;
      }
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      const identityToken = credential.identityToken;
      const email = credential.email || undefined;
      const name = credential.fullName ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim() : undefined;
      if (!identityToken) throw new Error(t('legacyAppleTokenMissing', undefined, 'Token Apple manquant'));
      const res = await fetch('https://www.productif.io/api/auth/oauth/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityToken, email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t('legacyAppleOauthError', undefined, 'Erreur OAuth Apple'));
      if (data?.token) await authService.setToken(data.token);
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e?.code === 'ERR_CANCELED') return;
      Alert.alert(t('legacyAppleErrorTitle', undefined, 'Erreur Apple'), e?.message || t('somethingWentWrong'));
    }
  };

  const handleGoogle = async (isLogin: boolean = false) => {
    setLoadingGoogle(true);
    try {
      const googleResult = await signInWithGoogle();
      
      const response = await authService.loginWithGoogle(googleResult.idToken);
      
      if (response.success) {
        if (isLogin) {
          // Connexion: aller au dashboard
          await AsyncStorage.setItem('onboarding_completed', 'true');
          router.replace('/(tabs)');
        } else {
          // Inscription: continuer l'onboarding
          router.replace('/onboarding/value');
        }
      } else {
        Alert.alert(t('legacyGoogleErrorTitle', undefined, 'Erreur'), t('legacyGoogleLoginFailed', undefined, 'Échec de la connexion avec Google'));
      }
    } catch (e: any) {
      if (e?.message?.includes('annulée')) return;
      Alert.alert(t('legacyGoogleErrorTitle', undefined, 'Erreur Google'), e?.message || t('somethingWentWrong'));
    } finally {
      setLoadingGoogle(false);
    }
  };

  const onLogin = async () => {
    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword;
    if (!email || !password) {
      Alert.alert(t('legacyRequiredFieldsTitle', undefined, 'Champs requis'), t('legacyLoginFields', undefined, 'Veuillez renseigner email et mot de passe.'));
      return;
    }
    try {
      setLoadingLogin(true);
      const res = await authService.login({ email, password });
      if (res?.token) await authService.setToken(res.token);
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert(t('legacyLoginFailedTitle', undefined, 'Connexion échouée'), e?.message || t('legacyLoginFailedMessage', undefined, 'Vérifiez vos identifiants.'));
    } finally {
      setLoadingLogin(false);
    }
  };

  const onSignup = async () => {
    const name = signupName.trim();
    const email = signupEmail.trim().toLowerCase();
    const password = signupPassword;
    if (!name || !email || !password) {
      Alert.alert(t('legacyRequiredFieldsTitle', undefined, 'Champs requis'), t('legacySignupFields', undefined, 'Nom, email et mot de passe sont requis.'));
      return;
    }
    try {
      setLoadingSignup(true);
      await authService.signup({ name, email, password });
      // Après création de compte: continuer l'onboarding (slides de valeur), sans marquer terminé.
      router.replace('/onboarding/value');
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('déjà utilisé') || msg.includes('already')) {
        Alert.alert(t('legacyEmailUsedTitle', undefined, 'Email déjà utilisé'), t('legacyEmailUsedMessage', undefined, 'Cet email est déjà associé à un compte. Connectez-vous.'));
        setLoginEmail(email);
        setStep(2);
      } else {
        Alert.alert(t('legacySignupFailedTitle', undefined, 'Inscription échouée'), msg || t('legacySignupFailedMessage', undefined, 'Réessayez plus tard.'));
      }
    } finally {
      setLoadingSignup(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, step === 0 && styles.containerGreen]}>
      <StatusBar style={step === 0 ? 'light' : 'dark'} />

      {step === 0 && (
        <>
          {/* Décor de fond (nuages) */}
          <View style={styles.bgDecor} pointerEvents="none">
            <View style={[styles.blob, { top: -50, right: -40, width: 220, height: 220, transform: [{ rotate: '15deg' }] }]} />
            <View style={[styles.blob, { bottom: -70, left: -60, width: 260, height: 260, transform: [{ rotate: '-10deg' }] }]} />
            <View style={[styles.blob, { top: 140, left: -40, width: 180, height: 180, transform: [{ rotate: '25deg' }] }]} />
          </View>

          <View style={styles.inner}>
            <View style={styles.centerBlock}>
              <View style={styles.logoShadow}>
                <View style={styles.logoWrapper}>
                  <Image source={productifLogo} style={styles.logoImg} />
                </View>
              </View>
              <Text style={[styles.title, styles.titleOnGreen]}>{t('legacyCongratsTitle', undefined, 'Félicitations')}</Text>
              <Text style={[styles.subtitle, styles.subtitleOnGreen]}>{t('legacyCongratsSubtitle', undefined, 'Vous êtes sur la voie d\'une vie plus productive')}</Text>
            </View>
            <View style={styles.footerBlock}>
              <TouchableOpacity style={[styles.cta, styles.ctaWhiteOnGreen]} onPress={() => setStep(1)}>
                <Text style={[styles.ctaTextGreen]}>{t('start', undefined, 'Commencer')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {step !== 0 && (
        <>
          <View style={styles.inner}>
            {step === 1 && (
              <View style={styles.centerBlock}>
                <View style={[styles.logoShadow, { width: 160, height: 160, borderRadius: 80 }]}>
                  <View style={[styles.logoWrapper, { borderRadius: 80 }]}>
                    <Image source={productifLogo} style={[styles.logoImg, { width: 120, height: 120 }]} />
                  </View>
                </View>
                <Text style={styles.title}>{t('legacyWelcomeTitle', undefined, 'Bienvenue')}</Text>
                <Text style={styles.subtitle}>{t('legacyWelcomeSubtitle', undefined, 'Accédez à toutes les fonctionnalités de Productif.io')}</Text>
              </View>
            )}

            {step === 2 && (
              <ScrollView contentContainerStyle={styles.innerGrow} keyboardShouldPersistTaps="handled">
                <View>
                  {/* Logo tout en haut */}
                  <View style={styles.topLogo}>
                    <View style={styles.logoShadowSmall}>
                      <View style={[styles.logoWrapper, { width: 80, height: 80, borderRadius: 40 }]}>
                        <Image source={productifLogo} style={[styles.logoImg, { width: 56, height: 56 }]} />
                      </View>
                    </View>
                  </View>

                  <View style={styles.centerBlockAlt}>
                    <Text style={styles.formTitle}>{t('welcomeBack')}</Text>
                    <TextInput placeholder={t('emailPlaceholder')} keyboardType="email-address" style={styles.input} value={loginEmail} onChangeText={setLoginEmail} />
                    <TextInput placeholder={t('passwordPlaceholder')} secureTextEntry style={styles.input} value={loginPassword} onChangeText={setLoginPassword} />
                    <TouchableOpacity onPress={() => Alert.alert(t('forgotPassword'), t('legacyResetFlow', undefined, 'Flux de réinitialisation à implémenter'))}
                      style={{ alignSelf: 'center', marginBottom: 8 }}>
                      <Text style={styles.forgot}>{t('forgotPassword')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.footerBlock}>
                  <TouchableOpacity style={styles.cta} onPress={onLogin} disabled={loadingLogin}>
                    {loadingLogin ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{t('loginButton', undefined, 'Se connecter')}</Text>}
                  </TouchableOpacity>

                  <View style={styles.separatorRow}>
                    <View style={styles.sepLine} />
                    <Text style={styles.sepText}>{t('legacyOrContinueWith', undefined, 'ou continuer avec')}</Text>
                    <View style={styles.sepLine} />
                  </View>

                  <TouchableOpacity style={styles.oauthBtn} onPress={handleApple}>
                    <Ionicons name="logo-apple" size={18} color="#111827" />
                    <Text style={styles.oauthText}>{t('continueWithApple')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.oauthBtn} onPress={() => handleGoogle(true)} disabled={loadingGoogle}>
                    {loadingGoogle ? (
                      <ActivityIndicator color="#4285F4" />
                    ) : (
                      <>
                        <Ionicons name="logo-google" size={18} color="#4285F4" />
                        <Text style={styles.oauthText}>{t('continueWithGoogle')}</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setStep(3)}>
                    <Text style={styles.link}>{t('legacyNoAccount', undefined, 'Pas de compte ? Inscription')}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {step === 3 && (
              <ScrollView contentContainerStyle={styles.innerGrow} keyboardShouldPersistTaps="handled">
                {/* Logo tout en haut */}
                <View style={styles.topLogo}>
                  <View style={styles.logoShadowSmall}>
                    <View style={[styles.logoWrapper, { width: 80, height: 80, borderRadius: 40 }]}>
                      <Image source={productifLogo} style={[styles.logoImg, { width: 56, height: 56 }]} />
                    </View>
                  </View>
                </View>

                <View style={styles.centerBlockAlt}>
                  <Text style={styles.formTitle}>{t('createAccount')}</Text>
                  <TextInput placeholder={t('firstName', undefined, 'Nom')} style={styles.input} value={signupName} onChangeText={setSignupName} />
                  <TextInput placeholder={t('emailPlaceholder')} keyboardType="email-address" style={styles.input} value={signupEmail} onChangeText={setSignupEmail} />
                  <TextInput placeholder={t('passwordPlaceholder')} secureTextEntry style={styles.input} value={signupPassword} onChangeText={setSignupPassword} />
                </View>
                <View style={styles.footerBlock}>
                  <TouchableOpacity style={styles.cta} onPress={onSignup} disabled={loadingSignup}>
                    {loadingSignup ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{t('legacyCreateMyAccount', undefined, 'Créer mon compte')}</Text>}
                  </TouchableOpacity>

                  <View style={styles.separatorRow}>
                    <View style={styles.sepLine} />
                    <Text style={styles.sepText}>{t('legacyOrCreateWith', undefined, 'ou créer avec')}</Text>
                    <View style={styles.sepLine} />
                  </View>

                  <TouchableOpacity style={styles.oauthBtn} onPress={handleApple}>
                    <Ionicons name="logo-apple" size={18} color="#111827" />
                    <Text style={styles.oauthText}>{t('continueWithApple')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.oauthBtn} onPress={() => handleGoogle(false)} disabled={loadingGoogle}>
                    {loadingGoogle ? (
                      <ActivityIndicator color="#4285F4" />
                    ) : (
                      <>
                        <Ionicons name="logo-google" size={18} color="#4285F4" />
                        <Text style={styles.oauthText}>{t('continueWithGoogle')}</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setStep(2)}>
                    <Text style={styles.link}>{t('legacyAlreadyHaveAccount', undefined, 'Déjà un compte ? Connexion')}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {step === 1 && (
              <View style={styles.footerBlock}>
                <TouchableOpacity style={styles.cta} onPress={() => setStep(2)}>
                  <Text style={styles.ctaText}>{t('continueWithEmail')}</Text>
                </TouchableOpacity>

                <View style={styles.separatorRow}>
                  <View style={styles.sepLine} />
                  <Text style={styles.sepText}>{t('or')}</Text>
                  <View style={styles.sepLine} />
                </View>

                <TouchableOpacity style={styles.oauthBtn} onPress={handleApple}>
                  <Ionicons name="logo-apple" size={18} color="#111827" />
                  <Text style={styles.oauthText}>{t('continueWithApple')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.oauthBtn} onPress={() => handleGoogle(false)} disabled={loadingGoogle}>
                  {loadingGoogle ? (
                    <ActivityIndicator color="#4285F4" />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={18} color="#4285F4" />
                      <Text style={styles.oauthText}>{t('continueWithGoogle')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAFEF4' },
  containerGreen: { backgroundColor: '#10B981' },
  bgDecor: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  blob: { position: 'absolute', borderRadius: 9999, backgroundColor: '#FFFFFF22' },
  inner: { flex: 1, padding: 24, justifyContent: 'space-between' },
  innerGrow: { flexGrow: 1, padding: 24, justifyContent: 'space-between' },
  centerBlock: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerBlockAlt: { alignItems: 'center' },
  footerBlock: { gap: 12 },
  logoShadow: { width: 128, height: 128, borderRadius: 64, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  logoShadowSmall: { width: 88, height: 88, borderRadius: 44, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  topLogo: { alignItems: 'center', marginBottom: 16 },
  logoWrapper: { width: '100%', height: '100%', borderRadius: 64, backgroundColor: '#ffffff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  logoImg: { width: 96, height: 96, resizeMode: 'contain' },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginTop: 28, marginBottom: 10, textAlign: 'center' },
  titleOnGreen: { color: '#FFFFFF' },
  subtitle: { color: '#374151', textAlign: 'center', marginTop: 4, marginBottom: 24 },
  subtitleOnGreen: { color: '#FFFFFFCC' },
  cta: { backgroundColor: '#10B981', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  ctaOutline: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#10B981' },
  ctaWhiteOnGreen: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF' },
  ctaText: { color: 'white', fontWeight: '700' },
  ctaTextGreen: { color: '#10B981', fontWeight: '700' },
  separatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 2 },
  sepLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  sepText: { color: '#6B7280', fontWeight: '600' },
  oauthBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  oauthText: { color: '#111827', fontWeight: '700' },
  formTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 12, textAlign: 'center' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 10, width: '100%' },
  forgot: { color: '#10B981', fontWeight: '600', textAlign: 'center' },
  link: { color: '#10B981', textAlign: 'center', marginTop: 8 },
});
