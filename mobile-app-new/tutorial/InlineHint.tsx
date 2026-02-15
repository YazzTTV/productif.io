import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type InlineHintProps = {
  text: string;
};

export function InlineHint({ text }: InlineHintProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  text: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
});
