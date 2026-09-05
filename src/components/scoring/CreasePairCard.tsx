import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { PlayerBatting } from '../../types/cricket';

interface CreasePairCardProps {
  striker: PlayerBatting;
  nonStriker: PlayerBatting;
  onSwitchStrike: () => void;
  onSelectBatter?: (isStriker: boolean) => void;
}

export const CreasePairCard: React.FC<CreasePairCardProps> = ({
  striker,
  nonStriker,
  onSwitchStrike,
  onSelectBatter,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Header Row with Switch Strike Button */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="baseball-outline" size={16} color={Colors.primary} />
          <Text style={styles.headerTitle}>Crease Pair</Text>
        </View>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={onSwitchStrike}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-horizontal" size={15} color={Colors.secondary} />
          <Text style={styles.switchButtonText}>Switch Strike</Text>
        </TouchableOpacity>
      </View>

      {/* Striker Row */}
      <TouchableOpacity
        style={[styles.batterRow, styles.strikerHighlight]}
        onPress={() => onSelectBatter?.(true)}
        activeOpacity={0.8}
      >
        <View style={styles.batterLeft}>
          <View style={styles.strikeBadge}>
            <Ionicons name="star" size={10} color={Colors.onSecondary} />
            <Text style={styles.strikeBadgeText}>STRIKE</Text>
          </View>
          <Text style={styles.strikerName} numberOfLines={1}>
            {striker.name}
          </Text>
        </View>
        <View style={styles.statsGroup}>
          <Text style={styles.strikerRuns}>{striker.runs}</Text>
          <Text style={styles.ballsMeta}>
            ({striker.balls}b • {striker.fours}x4 • {striker.sixes}x6)
          </Text>
        </View>
      </TouchableOpacity>

      {/* Non-Striker Row */}
      <TouchableOpacity
        style={styles.batterRow}
        onPress={() => onSelectBatter?.(false)}
        activeOpacity={0.8}
      >
        <View style={styles.batterLeft}>
          <Text style={styles.nonStrikerName} numberOfLines={1}>
            {nonStriker.name}
          </Text>
        </View>
        <View style={styles.statsGroup}>
          <Text style={styles.nonStrikerRuns}>{nonStriker.runs}</Text>
          <Text style={styles.ballsMeta}>
            ({nonStriker.balls}b • {nonStriker.fours}x4 • {nonStriker.sixes}x6)
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  switchButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  batterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  strikerHighlight: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.3)',
  },
  batterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  strikeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  strikeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.onSecondary,
    letterSpacing: 0.5,
  },
  strikerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
    flexShrink: 1,
  },
  nonStrikerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    flexShrink: 1,
  },
  statsGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  strikerRuns: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  nonStrikerRuns: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ballsMeta: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
});

export default CreasePairCard;
