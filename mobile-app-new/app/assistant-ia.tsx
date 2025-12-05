import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiCall } from '@/lib/api';
import { LockedCard } from '@/components/LockedCard';
import { UpgradeModal } from '@/components/UpgradeModal';
import { useTrialStatus } from '@/hooks/useTrialStatus';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  isCompleted: boolean;
  action?: 'generate' | 'link' | 'internal';
  link?: string;
}

interface ApiToken {
  id: string;
  name: string;
  description?: string;
  scopes: string[];
  lastUsed?: Date;
  expiresAt?: Date;
  createdAt: Date;
  token?: string;
}

export default function AssistantIAPage() {
  const router = useRouter();
  const { isLocked } = useTrialStatus();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [apiToken, setApiToken] = useState<string>('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      title: 'Générer un token API',
      description: 'Créez un token API pour connecter l\'agent IA à votre compte',
      icon: 'key',
      isCompleted: false,
      action: 'generate'
    },
    {
      id: 2,
      title: 'Configurer l\'agent IA',
      description: 'Connectez-vous à l\'agent IA WhatsApp',
      icon: 'chatbubbles',
      isCompleted: false,
      action: 'link',
      link: 'https://lynkk.it/productif.io'
    },
    {
      id: 3,
      title: 'Configurer les notifications',
      description: 'Personnalisez vos préférences de notification',
      icon: 'notifications',
      isCompleted: false,
      action: 'internal',
      link: '/dashboard/settings/notifications'
    }
  ]);

  useEffect(() => {
    checkExistingToken();
  }, []);

  const checkExistingToken = async () => {
    try {
      setIsLoading(true);
      const tokens = await apiCall<ApiToken[]>('/tokens');
      
      if (tokens && tokens.length > 0) {
        // On marque comme complété mais on n'affiche pas le token (pour sécurité)
        // L'utilisateur devra en générer un nouveau s'il veut le voir
        setSteps(prev => prev.map(step => 
          step.id === 1 ? { ...step, isCompleted: true } : step
        ));
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateToken = async () => {
    setIsGeneratingToken(true);
    try {
      const response = await apiCall<ApiToken>('/tokens', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Token WhatsApp Mobile'
        })
      });

      console.log('✅ Réponse complète:', JSON.stringify(response, null, 2));
      console.log('✅ Type de response:', typeof response);
      console.log('✅ response.token:', response?.token);

      // Vérifier si c'est un tableau (erreur de l'API)
      if (Array.isArray(response)) {
        console.log('❌ API a retourné un tableau au lieu d\'un objet');
        throw new Error('Réponse inattendue de l\'API (tableau au lieu d\'objet)');
      }

      if (response && response.token) {
        console.log('✅ Token récupéré avec succès:', response.token.substring(0, 20) + '...');
        setApiToken(response.token);
        setSteps(prev => prev.map(step => 
          step.id === 1 ? { ...step, isCompleted: true } : step
        ));
        
        Alert.alert(
          'Token généré avec succès',
          'Votre token API est maintenant visible ci-dessous. Copiez-le pour configurer l\'agent WhatsApp.',
          [{ text: 'OK' }]
        );
      } else {
        console.log('❌ Propriété token manquante:', response);
        throw new Error('Token non reçu dans la réponse');
      }
    } catch (error) {
      console.error('❌ Erreur génération token:', error);
      Alert.alert(
        'Erreur',
        'Impossible de générer le token. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copié', 'Token copié dans le presse-papiers');
  };

  const handleStepPress = (step: Step) => {
    if (step.action === 'generate') {
      // Si un token existe déjà, demander confirmation
      if (step.isCompleted && !apiToken) {
        Alert.alert(
          'Générer un nouveau token',
          'Un token existe déjà. Voulez-vous en générer un nouveau ? L\'ancien sera toujours valide.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Générer', onPress: generateToken }
          ]
        );
      } else {
        generateToken();
      }
    } else if (step.action === 'link' && step.link) {
      // Pour WhatsApp, on ouvre directement le lien
      const openWhatsAppLink = async () => {
        try {
          const supported = await Linking.canOpenURL(step.link!);
          if (supported) {
            await Linking.openURL(step.link!);
            // Marquer comme complété après l'ouverture
            setSteps(prev => prev.map(s => 
              s.id === step.id ? { ...s, isCompleted: true } : s
            ));
          } else {
            // Si le lien ne peut pas être ouvert, le copier dans le presse-papiers
            copyToClipboard(step.link!);
            Alert.alert(
              'Lien copié',
              'Le lien a été copié dans le presse-papiers. Ouvrez votre navigateur et collez le lien.',
              [{ text: 'OK' }]
            );
          }
        } catch (error) {
          console.error('Erreur lors de l\'ouverture du lien:', error);
          // En cas d'erreur, copier le lien
          copyToClipboard(step.link!);
          Alert.alert(
            'Lien copié',
            'Impossible d\'ouvrir automatiquement le lien. Il a été copié dans le presse-papiers.',
            [{ text: 'OK' }]
          );
        }
      };

      Alert.alert(
        'Configurer l\'agent WhatsApp',
        'Voulez-vous ouvrir le lien pour configurer l\'agent IA WhatsApp ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ouvrir', onPress: openWhatsAppLink }
        ]
      );
    } else if (step.action === 'internal') {
      // Navigation vers les paramètres de notification
      router.push('/notifications');
    }
  };

  const renderStepCard = (step: Step, index: number) => (
    <LockedCard key={step.id} onLockedClick={() => setShowUpgradeModal(true)}>
      <TouchableOpacity
        style={[
          styles.stepCard,
          step.isCompleted && styles.stepCardCompleted
        ]}
        onPress={() => handleStepPress(step)}
        disabled={step.action === 'generate' && isGeneratingToken}
      >
      <View style={styles.stepHeader}>
        <View style={[
          styles.iconContainer,
          step.isCompleted && styles.iconContainerCompleted
        ]}>
          {step.isCompleted ? (
            <Ionicons name="checkmark" size={24} color="#fff" />
          ) : (
            <Ionicons 
              name={step.icon} 
              size={24} 
              color={step.isCompleted ? '#fff' : '#6B7280'} 
            />
          )}
        </View>
        
        <View style={styles.stepContent}>
          <Text style={[
            styles.stepTitle,
            step.isCompleted && styles.stepTitleCompleted
          ]}>
            {step.title}
          </Text>
          <Text style={styles.stepDescription}>
            {step.description}
          </Text>
        </View>

        {step.action === 'generate' && isGeneratingToken ? (
          <ActivityIndicator size="small" color="#10B981" />
        ) : (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color="#6B7280" 
          />
        )}
      </View>

      {step.id === 1 && apiToken && (
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>🔑 Votre token API :</Text>
          <View style={styles.tokenBox}>
            <Text style={styles.tokenText} numberOfLines={2} ellipsizeMode="middle">
              {apiToken}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(apiToken)}
            >
              <Ionicons name="copy" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
          <Text style={styles.tokenHint}>
            💡 Appuyez sur l'icône pour copier le token
          </Text>
        </View>
      )}
      </TouchableOpacity>
    </LockedCard>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Chargement...</Text>
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
        <Text style={styles.headerTitle}>Assistant IA</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Configuration de l'assistant IA</Text>
          <Text style={styles.subtitle}>
            Suivez ces étapes pour configurer votre assistant IA personnel
          </Text>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => renderStepCard(step, index))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>À propos de l'assistant IA</Text>
              <Text style={styles.infoDescription}>
                L'assistant IA vous permet de gérer vos tâches, habitudes et projets 
                directement via WhatsApp. Configurez votre token pour commencer.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepsContainer: {
    marginBottom: 24,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  stepCardCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerCompleted: {
    backgroundColor: '#10B981',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepTitleCompleted: {
    color: '#059669',
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  tokenContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#10B981',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
  },
  tokenLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 12,
  },
  tokenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#1F2937',
    lineHeight: 16,
  },
  copyButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  tokenHint: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  infoSection: {
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});