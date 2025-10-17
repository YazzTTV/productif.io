import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface ProgressProps {
  value: number; // 0-100
  style?: ViewStyle;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  borderRadius?: number;
}

export function Progress({ 
  value, 
  style,
  height = 8,
  backgroundColor = '#e5e7eb',
  progressColor = '#10b981',
  borderRadius = 4,
}: ProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  
  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor,
          borderRadius,
        },
        style
      ]}
    >
      <View
        style={[
          styles.progress,
          {
            width: `${clampedValue}%`,
            backgroundColor: progressColor,
            borderRadius,
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
});