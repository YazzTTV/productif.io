import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Share, Alert, Clipboard } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

type InviteStep = 'type' | 'message' | 'share';
type InviteType = 'friend' | 'class' | 'link' | null;

export default function InviteScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<InviteStep>('type');
  const [inviteType, setInviteType] = useState<InviteType>(null);
  const [personalMessage, setPersonalMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [userName, setUserName] = useState('You');
  const [userStats, setUserStats] = useState({ streak: 0, xp: 0, focusSessions: 0 });
  const [inviteLink, setInviteLink] = useState('');

  // Charger les données utilisateur
  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await authService.checkAuth();
        if (currentUser) {
          setUserName(currentUser.name || 'You');
          // Générer le lien d'invitation
          const link = `https://productif.io/invite/${currentUser.id}`;
          setInviteLink(link);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
      }
    };
    loadUserData();
  }, []);

  const handleSelectType = (type: InviteType) => {
    setInviteType(type);
    setStep('message');
  };

  const handleContinue = () => {
    setStep('share');
  };

  const handleCopyLink = async () => {
    try {
      Clipboard.setString(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert(t('error'), t('copyLinkError') || 'Impossible de copier le lien');
    }
  };

  const handleShare = async (platform?: string) => {
    const message = personalMessage || (t('defaultInviteMessage') || 'Join me on Productif.io — a discipline system for serious students.');
    const fullMessage = `${message}\n\n${inviteLink}`;

    try {
      if (platform === 'native') {
        // Utiliser le share natif
        const result = await Share.share({
          message: fullMessage,
          title: t('inviteTitle') || 'Invitation Productif.io',
        });
      } else {
        // Pour les autres plateformes, on copie juste le lien
        await handleCopyLink();
      }
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === 'message') {
                setStep('type');
              } else if (step === 'share') {
                setStep('message');
              } else {
                router.back();
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('invite')}</Text>
          </View>
        </Animated.View>

        {/* Step 1: Choose Invite Type */}
        {step === 'type' && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.stepContainer}
          >
            <Text style={styles.stepDescription}>
              {t('inviteDescription') || 'Inviting someone to Productif.io is inviting them into a system.'}
            </Text>

            {/* Friend Invite */}
            <TouchableOpacity
              style={styles.inviteOptionCard}
              onPress={() => handleSelectType('friend')}
              activeOpacity={0.7}
            >
              <View style={styles.inviteOptionContent}>
                <View style={[styles.inviteOptionIcon, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
                  <Ionicons name="person-add" size={24} color="#16A34A" />
                </View>
                <View style={styles.inviteOptionText}>
                  <Text style={styles.inviteOptionTitle}>{t('friendInvite') || 'Friend Invite'}</Text>
                  <Text style={styles.inviteOptionDescription}>
                    {t('friendInviteDescription') || 'One-to-one accountability. Shared progress view.'}
                  </Text>
                  <Text style={styles.inviteOptionQuote}>
                    {t('friendInviteQuote') || '"Study with someone who takes discipline seriously."'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Class / Study Group */}
            <TouchableOpacity
              style={styles.inviteOptionCard}
              onPress={() => handleSelectType('class')}
              activeOpacity={0.7}
            >
              <View style={styles.inviteOptionContent}>
                <View style={[styles.inviteOptionIcon, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
                  <Ionicons name="school" size={24} color="#16A34A" />
                </View>
                <View style={styles.inviteOptionText}>
                  <Text style={styles.inviteOptionTitle}>{t('classInvite') || 'Class / Study Group'}</Text>
                  <Text style={styles.inviteOptionDescription}>
                    {t('classInviteDescription') || 'Small groups (5–30 max). Private by invite code.'}
                  </Text>
                  <Text style={styles.inviteOptionQuote}>
                    {t('classInviteQuote') || '"Turn your class into a focused group."'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Open Link */}
            <TouchableOpacity
              style={styles.inviteOptionCard}
              onPress={() => handleSelectType('link')}
              activeOpacity={0.7}
            >
              <View style={styles.inviteOptionContent}>
                <View style={[styles.inviteOptionIcon, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                  <Ionicons name="people" size={24} color="rgba(0, 0, 0, 0.6)" />
                </View>
                <View style={styles.inviteOptionText}>
                  <Text style={styles.inviteOptionTitle}>{t('openLink') || 'Open Link'}</Text>
                  <Text style={styles.inviteOptionDescription}>
                    {t('openLinkDescription') || 'Shareable invite link. Requires acceptance.'}
                  </Text>
                  <Text style={styles.inviteOptionQuote}>
                    {t('openLinkQuote') || 'Limited to prevent spam.'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Step 2: Personal Message */}
        {step === 'message' && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.stepContainer}
          >
            <View style={styles.messageCard}>
              <Text style={styles.messagePrompt}>
                {inviteType === 'friend' && (t('whyInviteFriend') || 'Why are you inviting them?')}
                {inviteType === 'class' && (t('whatBringsGroup') || 'What brings this group together?')}
                {inviteType === 'link' && (t('addPersonalNote') || 'Add a personal note (optional)')}
              </Text>

              <TextInput
                style={styles.messageInput}
                value={personalMessage}
                onChangeText={setPersonalMessage}
                placeholder={
                  inviteType === 'friend'
                    ? (t('friendPlaceholder') || 'We both need structure.')
                    : inviteType === 'class'
                    ? (t('classPlaceholder') || 'Same exams, same pressure.')
                    : (t('linkPlaceholder') || "Let's stay consistent together.")
                }
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.messageHint}>
                {t('inviteHint') || 'This makes the invitation feel intentional, not automated.'}
              </Text>
            </View>

            {/* Preview */}
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Preview</Text>
              <View style={styles.previewContent}>
                <View style={styles.previewAvatar}>
                  <Text style={styles.previewAvatarText}>{userName.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.previewName}>{userName}</Text>
                  <Text style={styles.previewStats}>{userStats.streak}d streak</Text>
                </View>
              </View>
              {personalMessage ? (
                <Text style={styles.previewMessage}>"{personalMessage}"</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>{t('continue')}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Step 3: Share Options */}
        {step === 'share' && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.stepContainer}
          >
            <Text style={styles.sharePrompt}>{t('chooseHowToShare') || 'Choose how to share'}</Text>

            {/* Link Display */}
            <View style={styles.linkCard}>
              <Text style={styles.linkLabel}>{t('yourInviteLink') || 'Your invite link'}</Text>
              <TextInput
                style={styles.linkInput}
                value={inviteLink}
                editable={false}
                selectTextOnFocus
              />
            </View>

            {/* Copy Link */}
            <TouchableOpacity
              style={[
                styles.shareOptionCard,
                copied && styles.shareOptionCardCopied
              ]}
              onPress={handleCopyLink}
              activeOpacity={0.7}
            >
              <View style={styles.shareOptionContent}>
                <View style={[
                  styles.shareOptionIcon,
                  copied && { backgroundColor: 'rgba(22, 163, 74, 0.1)' }
                ]}>
                  {copied ? (
                    <Ionicons name="checkmark" size={24} color="#16A34A" />
                  ) : (
                    <Ionicons name="copy" size={24} color="rgba(0, 0, 0, 0.6)" />
                  )}
                </View>
                <View style={styles.shareOptionText}>
                  <Text style={styles.shareOptionTitle}>
                    {copied ? t('linkCopied') : t('copyLink')}
                  </Text>
                  <Text style={styles.shareOptionDescription}>
                    {copied ? (t('shareAnywhere') || 'Share anywhere you want') : (t('shareViaApp') || 'Share via any app')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Native Share */}
            <TouchableOpacity
              style={styles.shareOptionCard}
              onPress={() => handleShare('native')}
              activeOpacity={0.7}
            >
              <View style={styles.shareOptionContent}>
                <View style={styles.shareOptionIcon}>
                  <Ionicons name="share-social" size={24} color="rgba(0, 0, 0, 0.6)" />
                </View>
                <View style={styles.shareOptionText}>
                  <Text style={styles.shareOptionTitle}>Share</Text>
                  <Text style={styles.shareOptionDescription}>Use your device's share menu</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Note */}
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>
                No public sharing. Invitations are private and intentional.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
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
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    marginBottom: 32,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
    marginBottom: 4,
  },
  stepContainer: {
    gap: 16,
  },
  stepDescription: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 24,
  },
  inviteOptionCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  inviteOptionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  inviteOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteOptionText: {
    flex: 1,
  },
  inviteOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  inviteOptionDescription: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 8,
  },
  inviteOptionQuote: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    fontStyle: 'italic',
  },
  messageCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  messagePrompt: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 16,
  },
  messageInput: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#000000',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  messageHint: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginTop: 12,
  },
  previewCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 12,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAvatarText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#16A34A',
  },
  previewName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  previewStats: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  previewMessage: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.8)',
    fontStyle: 'italic',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sharePrompt: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 16,
  },
  linkCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 8,
  },
  linkInput: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.8)',
  },
  shareOptionCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  shareOptionCardCopied: {
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  shareOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shareOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareOptionText: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  shareOptionDescription: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  noteCard: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    marginTop: 8,
  },
  noteText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
});

