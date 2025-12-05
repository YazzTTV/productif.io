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
      {/* Overlay semi-transparent */}
      <TouchableOpacity
        style={[
          StyleSheet.absoluteFill,
          styles.overlay,
          { backgroundColor: colors.background + 'CC' }, // 80% opacity
        ]}
        activeOpacity={0.9}
        onPress={onLockedClick}
      />
      {/* Cadenas */}
      <View style={styles.lockContainer}>
        <View style={[styles.lockCircle, { backgroundColor: colors.background }]}>
          <Ionicons name="lock-closed" size={32} color={colors.text} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  overlay: {
    borderRadius: 12,
    zIndex: 10,
  },
  lockContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
    zIndex: 20,
    pointerEvents: 'none',
  },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
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

