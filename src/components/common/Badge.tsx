import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';

interface LiveBadgeProps {
  label?: string;
  size?: 'sm' | 'md';
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({ label = 'LIVE', size = 'md' }) => {
  const isSm = size === 'sm';
  return (
    <View style={[styles.liveBadgeContainer, isSm && styles.liveBadgeSm]}>
      <View style={[styles.pulsingDot, isSm && styles.pulsingDotSm]} />
      <Text style={[styles.liveBadgeText, isSm && styles.liveBadgeTextSm]}>{label}</Text>
    </View>
  );
};

interface StatusPillProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'error' | 'surface';
}

export const StatusPill: React.FC<StatusPillProps> = ({ label, variant = 'surface' }) => {
  let bg = Colors.surfaceContainerHighest;
  let text = Colors.onSurfaceVariant;

  if (variant === 'primary') {
    bg = 'rgba(78, 222, 163, 0.15)';
    text = Colors.primary;
  } else if (variant === 'secondary') {
    bg = 'rgba(255, 185, 95, 0.15)';
    text = Colors.secondary;
  } else if (variant === 'error') {
    bg = 'rgba(255, 122, 115, 0.2)';
    text = Colors.error;
  }

  return (
    <View style={[styles.pillContainer, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  liveBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 5,
  },
  liveBadgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 3,
  },
  pulsingDotSm: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  liveBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  liveBadgeTextSm: {
    fontSize: 9,
  },
  pillContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
