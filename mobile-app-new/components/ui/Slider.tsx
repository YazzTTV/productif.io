import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  trackWidth?: number;
}

export function Slider({ 
  value, 
  onValueChange, 
  min = 1, 
  max = 5,
  trackWidth: customTrackWidth,
}: SliderProps) {
  const containerWidth = SCREEN_WIDTH - 48;
  const trackWidth = customTrackWidth || (containerWidth - 32);
  const thumbSize = 24;
  const thumbPosition = ((value - min) / (max - min)) * trackWidth;
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<View>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (evt) => {
        if (trackRef.current) {
          trackRef.current.measure((x, y, w, h, pageX, pageY) => {
            const touchX = evt.nativeEvent.pageX - pageX;
            const newX = Math.max(0, Math.min(trackWidth, touchX));
            const newValue = Math.round(
              min + (newX / trackWidth) * (max - min)
            );
            onValueChange(newValue);
          });
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View
        ref={trackRef}
        style={[styles.trackContainer, { width: trackWidth }]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.trackBackground, { width: trackWidth }]} />
        <View style={[styles.trackFill, { width: thumbPosition }]} />
        <View
          style={[
            styles.thumb,
            { left: thumbPosition - thumbSize / 2 },
            isDragging && styles.thumbActive,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    position: 'absolute',
  },
  trackFill: {
    height: 8,
    backgroundColor: '#16A34A',
    borderRadius: 4,
    position: 'absolute',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    position: 'absolute',
    top: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbActive: {
    transform: [{ scale: 1.2 }],
  },
});

