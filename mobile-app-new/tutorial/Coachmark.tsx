import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  findNodeHandle,
  UIManager,
} from 'react-native';

type CoachmarkProps = {
  targetRef: React.RefObject<any>;
  visible: boolean;
  text: string;
  nextLabel?: string;
  skipLabel?: string;
  onNext?: () => void;
  onSkip?: () => void;
};

type Rect = { x: number; y: number; width: number; height: number };

const MARGIN = 12;

export function Coachmark({
  targetRef,
  visible,
  text,
  nextLabel = 'Suivant',
  skipLabel = 'Passer',
  onNext,
  onSkip,
}: CoachmarkProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [mesureHauteur, setMesureHauteur] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let tries = 0;

    const measure = () => {
      const node = findNodeHandle(targetRef.current);
      if (!node) return;
      UIManager.measureInWindow(node, (x, y, width, height) => {
        if (cancelled) return;
        const valid =
          Number.isFinite(x) &&
          Number.isFinite(y) &&
          Number.isFinite(width) &&
          Number.isFinite(height) &&
          width > 0 &&
          height > 0;
        if (valid) {
          setRect({ x, y, width, height });
        } else if (tries < 10) {
          tries += 1;
          setTimeout(measure, 120);
        }
      });
    };

    setTimeout(measure, 120);
    const interval = setInterval(measure, 800);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [visible, targetRef]);

  const tooltipStyle = useMemo(() => {
    if (!rect) return null;
    const screen = Dimensions.get('window');
    const tooltipWidth = Math.min(300, screen.width - 2 * MARGIN);
    // Hauteur réelle de la bulle une fois rendue. Le code posait un décalage
    // fixe de 110 px, or la bulle dépasse cette hauteur dès que son texte tient
    // sur deux lignes : elle recouvrait alors le bouton qu'elle désigne.
    const tooltipHeight = mesureHauteur ?? 110;
    const placeBelow = rect.y + rect.height + tooltipHeight + MARGIN < screen.height;
    const top = placeBelow
      ? rect.y + rect.height + 10
      : Math.max(MARGIN, rect.y - tooltipHeight - 10);
    const left = Math.min(
      screen.width - tooltipWidth - MARGIN,
      Math.max(MARGIN, rect.x + rect.width / 2 - tooltipWidth / 2),
    );
    return { top, left, width: tooltipWidth };
  }, [rect, mesureHauteur]);

  if (!visible || !rect) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View
        style={[
          styles.highlight,
          { left: rect.x - 6, top: rect.y - 6, width: rect.width + 12, height: rect.height + 12 },
        ]}
        pointerEvents="none"
      />
      {tooltipStyle && (
        <View
          style={[styles.tooltip, tooltipStyle]}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            // On ne réécrit que sur un vrai changement, sinon onLayout et le
            // repositionnement se relancent mutuellement sans fin.
            setMesureHauteur((precedente) =>
              precedente !== null && Math.abs(precedente - h) < 1 ? precedente : h
            );
          }}
        >
          <Text style={styles.text}>{text}</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onSkip} style={styles.button}>
              <Text style={styles.buttonText}>{skipLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} style={[styles.button, styles.primaryButton]}>
              <Text style={[styles.buttonText, styles.primaryText]}>{nextLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  highlight: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#16A34A',
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    zIndex: 10000,
    elevation: 10000,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10001,
    zIndex: 10001,
  },
  text: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  actions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
  },
  primaryText: {
    color: '#FFFFFF',
  },
});
