import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onboardingService } from '@/lib/api';

export default function StripeWebViewScreen() {
  const params = useLocalSearchParams();
  const checkoutUrl = params.checkoutUrl as string;
  const [isLoading, setIsLoading] = useState(true);

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    // Détecter si l'utilisateur est redirigé vers la page de succès
    if (url.includes('success=true') || url.includes('/merci')) {
      // Paiement réussi
      handlePaymentSuccess();
    } else if (url.includes('canceled=true') || url.includes('/upgrade')) {
      // Paiement annulé
      handlePaymentCanceled();
    }
  };

  const handlePaymentSuccess = async () => {
    // Marquer l'onboarding comme terminé dans l'API
    try {
      await onboardingService.saveOnboardingData({
        completed: true,
        currentStep: 10, // Étape finale
      });
      console.log('✅ Onboarding marqué comme terminé dans l\'API (paiement réussi)');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      // Ne pas bloquer le flux
    }
    
    await AsyncStorage.setItem('onboarding_completed', 'true');
    Alert.alert(
      'Paiement réussi !',
      'Votre abonnement a été activé avec succès.',
      [
        {
          text: 'Continuer',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };

  const handlePaymentCanceled = () => {
    Alert.alert(
      'Paiement annulé',
      'Vous pouvez réessayer plus tard.',
      [
        {
          text: 'Retour',
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (!checkoutUrl) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00C27A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00C27A" />
        </View>
      )}
      <WebView
        source={{ uri: checkoutUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          Alert.alert('Erreur', 'Impossible de charger la page de paiement');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

