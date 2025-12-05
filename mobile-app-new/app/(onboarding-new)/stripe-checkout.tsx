import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Stripe Price IDs
const STRIPE_PRICE_IDS = {
  monthly: 'price_1XXXXXXXXXXXXXX', // À remplacer par votre vrai Price ID mensuel
  annual: 'price_1XXXXXXXXXXXXXX',  // À remplacer par votre vrai Price ID annuel
};

export default function StripeCheckoutScreen() {
  const params = useLocalSearchParams();
  const plan = params.plan as 'monthly' | 'annual';
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      const priceId = STRIPE_PRICE_IDS[plan];
      
      // TODO: Remplacer par votre vraie URL de checkout Stripe
      // Option 1: Utiliser Stripe Checkout (redirection web)
      const checkoutUrl = `https://checkout.stripe.com/pay/${priceId}`;
      
      // Option 2: Appeler votre backend pour créer une session Stripe
      // const response = await fetch('https://votre-api.com/create-checkout-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ priceId, plan })
      // });
      // const { url } = await response.json();
      
      const supported = await Linking.canOpenURL(checkoutUrl);
      if (supported) {
        await Linking.openURL(checkoutUrl);
        // Marquer l'onboarding comme terminé après le paiement
        await AsyncStorage.setItem('onboarding_completed', 'true');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1000);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le lien de paiement');
      }
    } catch (error) {
      console.error('Erreur lors de la redirection Stripe:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la redirection vers le paiement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="card" size={60} color="#00C27A" />
          <Text style={styles.title}>Finaliser votre abonnement</Text>
          <Text style={styles.subtitle}>
            Vous allez être redirigé vers Stripe pour finaliser votre paiement sécurisé
          </Text>
        </View>

        {/* Plan Info */}
        <View style={styles.planBox}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>
              {plan === 'annual' ? 'Plan Annuel' : 'Plan Mensuel'}
            </Text>
            {plan === 'annual' && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>Économisez $60</Text>
              </View>
            )}
          </View>
          <Text style={styles.planPrice}>
            {plan === 'annual' ? '$9.99/mois' : '$14.99/mois'}
          </Text>
          {plan === 'annual' && (
            <Text style={styles.planBilled}>Facturé $119.88 annuellement</Text>
          )}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsBox}>
          <Text style={styles.benefitsTitle}>Ce qui est inclus :</Text>
          {[
            'Essai gratuit de 7 jours',
            'Annulation à tout moment',
            'Accès complet à toutes les fonctionnalités',
            'Assistant IA illimité',
            'Analyses avancées',
            'Support prioritaire',
          ].map((benefit, i) => (
            <View key={i} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color="#00C27A" />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleCheckout}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkoutButton}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.checkoutButtonText}>Continuer vers le paiement</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Passer pour le moment</Text>
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color="#6B7280" />
          <Text style={styles.securityText}>
            Paiement sécurisé par Stripe • SSL Crypté
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  planBox: {
    backgroundColor: 'rgba(0, 194, 122, 0.05)',
    borderWidth: 2,
    borderColor: '#00C27A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  saveBadge: {
    backgroundColor: '#00C27A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  saveText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00C27A',
    marginBottom: 4,
  },
  planBilled: {
    fontSize: 12,
    color: '#6B7280',
  },
  benefitsBox: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#4B5563',
  },
  actions: {
    gap: 12,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  securityText: {
    fontSize: 11,
    color: '#6B7280',
  },
});


