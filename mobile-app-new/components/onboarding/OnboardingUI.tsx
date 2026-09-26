/**
 * Briques visuelles des ecrans de l'onboarding 1.5 (tried-before, exams,
 * subjects, chapters, courses). Elles reprennent exactement les styles des
 * ecrans du questionnaire (fond blanc, bouton vert #16A34A arrondi a 24,
 * options a bordure fine) pour que le passage du questionnaire au planning ne
 * se voie pas.
 *
 * Hors de app/ : un fichier place dans app/(onboarding-new)/ deviendrait une
 * route expo-router.
 *
 * Difference voulue avec les ecrans existants : le bouton principal est epingle
 * en bas, hors du defilement. Les ecrans matieres et chapitres ont un champ de
 * saisie, et un bouton au fond d'une liste disparait sous le clavier.
 */

import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ONBOARDING_GREEN = '#16A34A';

export function OnboardingScreen({
  children,
  footer,
  centered = false,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Contenu centre verticalement, comme les ecrans du questionnaire. */
  centered?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, centered && styles.scrollContentCentered]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>{children}</View>
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const inactive = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactive}
      style={[styles.primaryButton, inactive && styles.primaryButtonDisabled]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{label}</Text>}
    </TouchableOpacity>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={styles.secondaryButton}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <Text style={[styles.secondaryButtonText, disabled && { opacity: 0.4 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Option pleine largeur. `multi` dessine une case ronde comme daily-struggles. */
export function OptionRow({
  label,
  description,
  selected,
  onPress,
  multi = false,
  icon,
  disabled = false,
  loading = false,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.option, selected && styles.optionSelected, disabled && styles.optionDisabled]}
      activeOpacity={0.7}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected, disabled }}
    >
      <View style={styles.optionContent}>
        {icon ? (
          <View style={styles.optionIcon}>
            {loading ? <ActivityIndicator size="small" color={ONBOARDING_GREEN} /> : <Ionicons name={icon} size={22} color="#000000" />}
          </View>
        ) : (
          <View style={[styles.check, selected && styles.checkSelected]}>
            {selected ? <View style={styles.checkInner} /> : null}
          </View>
        )}
        <View style={styles.optionTexts}>
          <Text style={styles.optionLabel}>{label}</Text>
          {description ? <Text style={styles.optionDescription}>{description}</Text> : null}
        </View>
        {icon && selected ? <Ionicons name="checkmark-circle" size={22} color={ONBOARDING_GREEN} /> : null}
      </View>
    </TouchableOpacity>
  );
}

/** Pastille compacte, pour les filieres, les matieres proposees et les heures. */
export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected, style]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export const onboardingText = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.03 * 24,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 21,
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 10,
    paddingLeft: 4,
  },
  help: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.45)',
    lineHeight: 19,
  },
});

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
  },
  scrollContentCentered: {
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 4,
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: ONBOARDING_GREEN,
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  option: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  optionSelected: {
    borderColor: ONBOARDING_GREEN,
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTexts: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    color: '#000000',
  },
  optionDescription: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 3,
    lineHeight: 18,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    borderColor: ONBOARDING_GREEN,
    backgroundColor: ONBOARDING_GREEN,
  },
  checkInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  chipText: {
    fontSize: 15,
    color: '#000000',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
