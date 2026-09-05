import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import Colors from '../../constants/colors';

interface ScoreButtonProps {
  label: string;
  subLabel?: string;
  variant?: 'run' | 'boundary' | 'wicket' | 'extra' | 'action';
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const ScoreButton: React.FC<ScoreButtonProps> = ({
  label,
  subLabel,
  variant = 'run',
  onPress,
  disabled = false,
  style,
}) => {
  const getStyleForVariant = () => {
    switch (variant) {
      case 'boundary':
        return {
          bg: Colors.primary,
          textColor: Colors.onPrimary,
          border: 'transparent',
          glow: true,
        };
      case 'wicket':
        return {
          bg: Colors.errorContainer,
          textColor: Colors.error,
          border: 'rgba(255, 122, 115, 0.4)',
          glow: true,
        };
      case 'extra':
        return {
          bg: 'rgba(255, 185, 95, 0.15)',
          textColor: Colors.secondary,
          border: 'rgba(255, 185, 95, 0.3)',
          glow: false,
        };
      case 'action':
        return {
          bg: Colors.surfaceContainerHighest,
          textColor: Colors.onSurface,
          border: 'rgba(255, 255, 255, 0.08)',
          glow: false,
        };
      case 'run':
      default:
        return {
          bg: Colors.surfaceContainerHigh,
          textColor: Colors.onSurface,
          border: 'rgba(255, 255, 255, 0.06)',
          glow: false,
        };
    }
  };

  const vStyle = getStyleForVariant();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: vStyle.bg,
          borderColor: vStyle.border,
        },
        vStyle.glow && styles.glowStyle,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          { color: vStyle.textColor },
          variant === 'boundary' && styles.boundaryLabel,
        ]}
      >
        {label}
      </Text>
      {subLabel && (
        <Text style={[styles.subLabel, { color: vStyle.textColor }]}>{subLabel}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  boundaryLabel: {
    fontSize: 20,
    fontWeight: '900',
  },
  subLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 1,
    opacity: 0.8,
  },
  glowStyle: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.4,
  },
});

export default ScoreButton;
