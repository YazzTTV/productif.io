import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/lib/api';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  badge?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  color = '#6b7280',
  badge 
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }] }>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
        )}
      </View>
    </View>
    
    <View style={styles.menuItemRight}>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
    </View>
  </TouchableOpacity>
);

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

export default function MoreScreen() {
  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              router.replace('/login');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
            }
          },
        },
      ]
    );
  };

  const handleFeaturePress = (feature: string) => {
    Alert.alert('Fonctionnalité', `${feature} - À implémenter`);
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboarding_completed');
      router.replace('/onboarding/welcome');
    } catch (e) {
      console.error('Erreur reset onboarding', e);
      Alert.alert('Erreur', "Impossible de réinitialiser l'onboarding");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Plus</Text>
        <Text style={styles.subtitle}>Fonctionnalités et paramètres</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Productivité */}
        <Section title="Productivité">
          <MenuItem
            icon="time"
            title="Suivi du temps"
            subtitle="Timer et historique"
            color="#3b82f6"
            onPress={() => router.push('/time-history')}
          />
          <MenuItem
            icon="flag"
            title="Objectifs"
            subtitle="Définir et suivre vos objectifs"
            color="#10b981"
            onPress={() => router.push('/objectifs')}
          />
          <MenuItem
            icon="bar-chart"
            title="Analytics"
            subtitle="Statistiques détaillées"
            color="#8b5cf6"
            onPress={() => router.push('/analytics')}
          />
        </Section>

        {/* Gamification */}
        <Section title="Gamification">
          <MenuItem
            icon="trophy"
            title="Succès"
            subtitle="Vos accomplissements"
            color="#f59e0b"
            onPress={() => router.push('/achievements')}
          />
          <MenuItem
            icon="people"
            title="Classement"
            subtitle="Comparez vos performances"
            color="#ef4444"
            onPress={() => router.push('/leaderboard')}
          />
        </Section>

        {/* Personnel */}
        <Section title="Personnel">
          <MenuItem
            icon="book"
            title="Mon Espace"
            subtitle="Journal et réflexions"
            color="#6366f1"
            onPress={() => router.push('/mon-espace')}
          />
          <MenuItem
            icon="chatbubble-ellipses"
            title="Assistant IA"
            subtitle="Configuration et aide"
            color="#06b6d4"
            onPress={() => router.push('/assistant-ia')}
          />
        </Section>

        {/* Entreprise */}
        <Section title="Entreprise">
          <MenuItem
            icon="business"
            title="Mon Entreprise"
            subtitle="Tableau de bord équipe"
            color="#059669"
            onPress={() => router.push('/mon-entreprise')}
          />
        </Section>

        {/* Paramètres */}
        <Section title="Paramètres">
          <MenuItem
            icon="settings"
            title="Paramètres"
            subtitle="Configuration de l'application"
            color="#6b7280"
            onPress={() => router.push('/parametres')}
          />
          <MenuItem
            icon="notifications"
            title="Notifications"
            subtitle="Gérer les alertes"
            color="#f59e0b"
            onPress={() => router.push('/notifications')}
          />
        </Section>

        {/* Onboarding */}
        <Section title="Onboarding">
          <MenuItem
            icon="refresh"
            title="Réinitialiser l'onboarding"
            subtitle="Revoir le parcours d'introduction"
            color="#10b981"
            onPress={resetOnboarding}
          />
        </Section>

        {/* Support */}
        <Section title="Support">
          <MenuItem
            icon="help-circle"
            title="Aide & Support"
            subtitle="FAQ et contact"
            color="#6366f1"
            onPress={() => router.push('/support')}
          />
          <MenuItem
            icon="information-circle"
            title="À propos"
            subtitle="Version et informations"
            color="#8b5cf6"
            onPress={() => router.push('/about')}
          />
        </Section>

        {/* Déconnexion */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  logoutSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
  },
  bottomPadding: {
    height: 100,
  },
});