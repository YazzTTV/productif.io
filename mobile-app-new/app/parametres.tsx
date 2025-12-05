import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { authService, User, apiCall } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileSettingsPage() {
  const { colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // États pour le changement de mot de passe
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await authService.checkAuth();
      setUser(userData);
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
      Alert.alert('Erreur', 'Impossible de charger les données utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setSaving(true);
      await apiCall('/user/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      Alert.alert(
        'Succès',
        'Votre mot de passe a été modifié avec succès',
        [
          {
            text: 'OK',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setShowPasswordSection(false);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de changer le mot de passe');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#00C27A" />
        <Text style={[styles.loadingText, { color: colors.text }]}>Chargement...</Text>
      </View>
    );
  }

  const userName = user?.name || 'Utilisateur';
  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Paramètres du profil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.profileHeader}>
              <LinearGradient
                colors={['#00C27A', '#00D68F']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{userInitial}</Text>
              </LinearGradient>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>{userName}</Text>
                <Text style={styles.profileEmail}>{userEmail}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Security Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>SÉCURITÉ</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setShowPasswordSection(!showPasswordSection)}
            >
              <View style={styles.settingButtonLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="lock-closed" size={24} color="#00C27A" />
                </View>
                <View style={styles.settingButtonContent}>
                  <Text style={[styles.settingButtonText, { color: colors.text }]}>
                    Changer le mot de passe
                  </Text>
                  <Text style={styles.settingButtonSubtext}>
                    Modifiez votre mot de passe actuel
                  </Text>
                </View>
              </View>
              <Ionicons 
                name={showPasswordSection ? 'chevron-up' : 'chevron-down'} 
                size={24} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>

            {showPasswordSection && (
              <Animated.View 
                entering={FadeInDown.duration(300)}
                style={[styles.passwordSection, { borderTopColor: colors.border }]}
              >
                {/* Current Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Mot de passe actuel
                  </Text>
                  <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Entrez votre mot de passe actuel"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showCurrentPassword}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                      <Ionicons 
                        name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'} 
                        size={20} 
                        color="#6B7280" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Nouveau mot de passe
                  </Text>
                  <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Minimum 8 caractères"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showNewPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                      <Ionicons 
                        name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} 
                        size={20} 
                        color="#6B7280" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Confirmer le mot de passe
                  </Text>
                  <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Confirmez votre nouveau mot de passe"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons 
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                        size={20} 
                        color="#6B7280" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Password Requirements */}
                <View style={styles.requirementsBox}>
                  <Text style={styles.requirementsTitle}>Le mot de passe doit contenir :</Text>
                  <View style={styles.requirement}>
                    <Ionicons 
                      name={newPassword.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'} 
                      size={16} 
                      color={newPassword.length >= 8 ? '#00C27A' : '#9CA3AF'} 
                    />
                    <Text style={[
                      styles.requirementText,
                      newPassword.length >= 8 && styles.requirementTextValid
                    ]}>
                      Au moins 8 caractères
                    </Text>
                  </View>
                  <View style={styles.requirement}>
                    <Ionicons 
                      name={newPassword === confirmPassword && newPassword.length > 0 ? 'checkmark-circle' : 'ellipse-outline'} 
                      size={16} 
                      color={newPassword === confirmPassword && newPassword.length > 0 ? '#00C27A' : '#9CA3AF'} 
                    />
                    <Text style={[
                      styles.requirementText,
                      newPassword === confirmPassword && newPassword.length > 0 && styles.requirementTextValid
                    ]}>
                      Les mots de passe correspondent
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowPasswordSection(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      saving && styles.saveButtonDisabled
                    ]}
                    onPress={handleChangePassword}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.saveButtonText}>Enregistrer</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* Account Info */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.sectionTitle}>INFORMATIONS DU COMPTE</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Membre depuis</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}
              </Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowBorder, { borderTopColor: colors.border }]}>
              <Text style={styles.infoLabel}>Rôle</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Padding */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  settingButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 194, 122, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingButtonContent: {
    flex: 1,
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingButtonSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  passwordSection: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  requirementsBox: {
    backgroundColor: 'rgba(0, 194, 122, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  requirementText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  requirementTextValid: {
    color: '#00C27A',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00C27A',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  infoRowBorder: {
    borderTopWidth: 1,
  },
  infoLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
