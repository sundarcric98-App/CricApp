import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { PlayerBowling } from '../../types/cricket';

interface ActiveBowlerCardProps {
  bowler: PlayerBowling;
  onChangeBowler?: () => void;
}

export const ActiveBowlerCard: React.FC<ActiveBowlerCardProps> = ({
  bowler,
  onChangeBowler,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <View style={styles.leftGroup}>
          <View style={styles.bowlerIconBox}>
            <Ionicons name="baseball" size={20} color={Colors.primary} />
          </View>
          <View style={styles.infoCol}>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.bowlerName} numberOfLines={1}>
                {bowler.name}
              </Text>
              <View style={styles.bowlerTypeBadge}>
                <Text style={styles.bowlerTypeText}>Pace</Text>
              </View>
            </View>
            <View style={styles.figuresRow}>
              <Text style={styles.figuresLabel}>Figures:</Text>
              <Text style={styles.figuresValue}>
                {bowler.overs.toFixed(1)} - {bowler.maidens} - {bowler.runs} - {bowler.wickets}
              </Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.econValue}>Econ: {bowler.economy.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {onChangeBowler && (
          <TouchableOpacity
            style={styles.changeButton}
            onPress={onChangeBowler}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={14} color={Colors.onSurfaceVariant} />
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bowlerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 3,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bowlerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
    flexShrink: 1,
  },
  bowlerTypeBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  bowlerTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  figuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  figuresLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  figuresValue: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  dotSeparator: {
    fontSize: 11,
    color: Colors.outline,
  },
  econValue: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
});

export default ActiveBowlerCard;
