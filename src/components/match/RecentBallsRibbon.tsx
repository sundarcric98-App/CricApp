import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';

interface RecentBallsRibbonProps {
  balls: string[];
  label?: string;
  size?: 'sm' | 'md';
}

export const RecentBallsRibbon: React.FC<RecentBallsRibbonProps> = ({
  balls,
  label = 'Recent Balls',
  size = 'md',
}) => {
  const isSm = size === 'sm';

  const getBallStyle = (ball: string) => {
    const b = ball.trim().toUpperCase();
    if (b === 'W') {
      return {
        bg: Colors.ballWicket,
        textColor: '#FFFFFF',
        glow: true,
      };
    }
    if (b === '6') {
      return {
        bg: Colors.primary,
        textColor: Colors.onPrimary,
        glow: true,
      };
    }
    if (b === '4') {
      return {
        bg: 'rgba(78, 222, 163, 0.2)',
        textColor: Colors.primary,
        glow: false,
      };
    }
    if (b === 'WD' || b === 'NB') {
      return {
        bg: Colors.secondary,
        textColor: Colors.onSecondary,
        glow: false,
      };
    }
    if (b === '0' || b === '•') {
      return {
        bg: Colors.surfaceContainerLowest,
        textColor: Colors.outline,
        glow: false,
      };
    }
    return {
      bg: Colors.surfaceVariant,
      textColor: Colors.onSurface,
      glow: false,
    };
  };

  return (
    <View style={[styles.container, isSm && styles.containerSm]}>
      {label && <Text style={styles.labelText}>{label}</Text>}
      <View style={styles.ballsRow}>
        {balls.slice(-8).map((ball, index) => {
          const styleInfo = getBallStyle(ball);
          const isLastBall = index === balls.length - 1;
          return (
            <View
              key={`ball_${index}_${ball}`}
              style={[
                styles.ballCircle,
                isSm && styles.ballCircleSm,
                { backgroundColor: styleInfo.bg },
                styleInfo.glow && styles.glowEffect,
                isLastBall && styles.activeLastBall,
              ]}
            >
              <Text
                style={[
                  styles.ballText,
                  isSm && styles.ballTextSm,
                  { color: styleInfo.textColor },
                ]}
              >
                {ball}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(24, 32, 43, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  containerSm: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ballsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ballCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballCircleSm: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  ballText: {
    fontSize: 11,
    fontWeight: '800',
  },
  ballTextSm: {
    fontSize: 10,
  },
  glowEffect: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
  activeLastBall: {
    transform: [{ scale: 1.05 }],
  },
});

export default RecentBallsRibbon;
