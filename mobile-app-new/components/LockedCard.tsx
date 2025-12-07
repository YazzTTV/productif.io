import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useTheme } from '@/contexts/ThemeContext';

interface LockedCardProps {
  children: React.ReactNode;
  onLockedClick?: () => void;
}

export function LockedCard({ children, onLockedClick }: LockedCardProps) {
  const { isLocked } = useTrialStatus();
  const { colors } = useTheme();

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {children}
      <TouchableOpacity
        style={[
          StyleSheet.absoluteFillObject,
          styles.overlayContainer,
          { backgroundColor: colors.background + 'CC' },
        ]}
        activeOpacity={0.9}
        onPress={onLockedClick}
      >
        <View style={[styles.lockCircle, { backgroundColor: colors.background }]}>
          <Ionicons name="lock-closed" size={18} color={colors.text} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  overlayContainer: {
    borderRadius: 16,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
});

