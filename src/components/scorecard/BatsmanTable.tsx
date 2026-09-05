import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import { PlayerBatting } from '../../types/cricket';

interface BatsmanTableProps {
  teamName: string;
  totalScore: string;
  batting: PlayerBatting[];
  extras?: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    total: number;
  };
}

export const BatsmanTable: React.FC<BatsmanTableProps> = ({
  teamName,
  totalScore,
  batting,
  extras,
}) => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.tableHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.teamColorPill} />
          <Text style={styles.teamTitle}>{teamName}</Text>
          <Text style={styles.subTitle}>Batting</Text>
        </View>
        <Text style={styles.totalScoreText}>{totalScore}</Text>
      </View>

      {/* Column Titles */}
      <View style={styles.columnHeaderRow}>
        <Text style={[styles.colHeader, styles.colBatsman]}>BATSMAN</Text>
        <Text style={[styles.colHeader, styles.colNum]}>R</Text>
        <Text style={[styles.colHeader, styles.colNum]}>B</Text>
        <Text style={[styles.colHeader, styles.colNum]}>4s</Text>
        <Text style={[styles.colHeader, styles.colNum]}>6s</Text>
        <Text style={[styles.colHeader, styles.colSR]}>SR</Text>
      </View>

      {/* Batsman Rows */}
      {batting.map((batter, index) => {
        const isCurrentStriker = batter.isStriker;
        const isNotOut = !batter.isOut;

        return (
          <View
            key={batter.playerId || `batter_${index}`}
            style={[styles.batterRow, isCurrentStriker && styles.strikerRow]}
          >
            <View style={styles.colBatsman}>
              <View style={styles.nameRow}>
                {isCurrentStriker && <View style={styles.strikerDot} />}
                <Text
                  style={[
                    styles.batterNameText,
                    isCurrentStriker && styles.strikerNameText,
                  ]}
                  numberOfLines={1}
                >
                  {batter.name}
                </Text>
              </View>
              <Text style={styles.dismissalText} numberOfLines={1}>
                {isCurrentStriker
                  ? 'batting on strike'
                  : isNotOut
                  ? 'not out'
                  : batter.dismissalInfo || 'out'}
              </Text>
            </View>

            <Text
              style={[
                styles.colNum,
                styles.runsText,
                isCurrentStriker && styles.strikerRunsText,
              ]}
            >
              {batter.runs}
            </Text>
            <Text style={[styles.colNum, styles.ballsText]}>{batter.balls}</Text>
            <Text style={[styles.colNum, styles.foursText]}>{batter.fours}</Text>
            <Text style={[styles.colNum, styles.sixesText]}>{batter.sixes}</Text>
            <Text
              style={[
                styles.colSR,
                styles.srText,
                isCurrentStriker && styles.strikerSrText,
              ]}
            >
              {batter.strikeRate.toFixed(1)}
            </Text>
          </View>
        );
      })}

      {/* Extras Row */}
      {extras && (
        <View style={styles.extrasRow}>
          <Text style={styles.extrasLabel}>
            Extras <Text style={styles.extrasBreakdown}>(w {extras.wides}, nb {extras.noBalls}, b {extras.byes}, lb {extras.legByes})</Text>
          </Text>
          <Text style={styles.extrasTotal}>{extras.total}</Text>
        </View>
      )}
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
  teamColorPill: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: Colors.primary,
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
  totalScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
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
  colBatsman: {
    flex: 4.5,
  },
  colNum: {
    flex: 1.1,
    textAlign: 'right',
  },
  colSR: {
    flex: 1.8,
    textAlign: 'right',
  },
  batterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  strikerRow: {
    backgroundColor: 'rgba(78, 222, 163, 0.05)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  strikerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  batterNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
    flexShrink: 1,
  },
  strikerNameText: {
    color: Colors.onSurface,
    fontWeight: '700',
  },
  dismissalText: {
    fontSize: 10,
    color: Colors.outline,
    marginTop: 1,
  },
  runsText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  strikerRunsText: {
    color: Colors.primary,
  },
  ballsText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  foursText: {
    fontSize: 12,
    color: Colors.onSurface,
  },
  sixesText: {
    fontSize: 12,
    color: Colors.onSurface,
  },
  srText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  strikerSrText: {
    color: Colors.primary,
  },
  extrasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(7, 15, 25, 0.5)',
  },
  extrasLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  extrasBreakdown: {
    fontSize: 10,
    color: Colors.outline,
    fontWeight: '400',
  },
  extrasTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
});

export default BatsmanTable;
