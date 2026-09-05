import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import { PlayerBowling } from '../../types/cricket';

interface BowlerTableProps {
  teamName: string;
  bowling: PlayerBowling[];
}

export const BowlerTable: React.FC<BowlerTableProps> = ({ teamName, bowling }) => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.tableHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.bowlerPill} />
          <Text style={styles.teamTitle}>{teamName}</Text>
          <Text style={styles.subTitle}>Bowling</Text>
        </View>
      </View>

      {/* Column Headers */}
      <View style={styles.columnHeaderRow}>
        <Text style={[styles.colHeader, styles.colBowler]}>BOWLER</Text>
        <Text style={[styles.colHeader, styles.colNum]}>O</Text>
        <Text style={[styles.colHeader, styles.colNum]}>M</Text>
        <Text style={[styles.colHeader, styles.colNum]}>R</Text>
        <Text style={[styles.colHeader, styles.colNum, styles.colWkts]}>W</Text>
        <Text style={[styles.colHeader, styles.colEcon]}>ECON</Text>
      </View>

      {/* Bowler Rows */}
      {bowling.map((bowler, index) => {
        const isCurrent = bowler.isCurrentBowler;

        return (
          <View
            key={bowler.playerId || `bowler_${index}`}
            style={[styles.bowlerRow, isCurrent && styles.activeBowlerRow]}
          >
            <View style={styles.colBowler}>
              <View style={styles.nameRow}>
                {isCurrent && <View style={styles.activeDot} />}
                <Text
                  style={[styles.bowlerNameText, isCurrent && styles.activeBowlerName]}
                  numberOfLines={1}
                >
                  {bowler.name}
                </Text>
              </View>
              {isCurrent && <Text style={styles.bowlingTag}>Current Bowler</Text>}
            </View>

            <Text style={[styles.colNum, styles.oversText]}>{bowler.overs.toFixed(1)}</Text>
            <Text style={[styles.colNum, styles.statText]}>{bowler.maidens}</Text>
            <Text style={[styles.colNum, styles.statText]}>{bowler.runs}</Text>
            <Text
              style={[
                styles.colNum,
                styles.colWkts,
                styles.wicketsText,
                bowler.wickets > 0 && styles.wicketsHighlight,
              ]}
            >
              {bowler.wickets}
            </Text>
            <Text style={[styles.colEcon, styles.econText]}>{bowler.economy.toFixed(1)}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bowlerPill: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  teamTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  subTitle: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  columnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  colBowler: {
    flex: 4.5,
  },
  colNum: {
    flex: 1.1,
    textAlign: 'right',
  },
  colWkts: {
    flex: 1.2,
  },
  colEcon: {
    flex: 1.8,
    textAlign: 'right',
  },
  bowlerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  activeBowlerRow: {
    backgroundColor: 'rgba(255, 185, 95, 0.05)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  bowlerNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
    flexShrink: 1,
  },
  activeBowlerName: {
    color: Colors.onSurface,
    fontWeight: '700',
  },
  bowlingTag: {
    fontSize: 10,
    color: Colors.secondary,
    marginTop: 1,
  },
  oversText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  statText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  wicketsText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  wicketsHighlight: {
    color: Colors.primary,
  },
  econText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
});

export default BowlerTable;
