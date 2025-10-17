import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  style?: ViewStyle;
  size?: number;
  color?: string;
  disabled?: boolean;
}

export function Checkbox({ 
  checked, 
  onCheckedChange, 
  style,
  size = 20,
  color = '#10b981',
  disabled = false
}: CheckboxProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          width: size, 
          height: size,
          backgroundColor: checked ? color : 'transparent',
          borderColor: checked ? color : '#d1d5db',
          opacity: disabled ? 0.5 : 1,
        },
        style
      ]}
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {checked && (
        <Ionicons
          name="checkmark"
          size={size * 0.7}
          color="#fff"
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});