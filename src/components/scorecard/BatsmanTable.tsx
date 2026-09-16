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
    penalty?: number;
    total: number;
  };
  totalSummary?: string;
  didNotBat?: string[];
}

export const BatsmanTable: React.FC<BatsmanTableProps> = ({
  teamName,
  totalScore,
  batting,
  extras = { wides: 10, noBalls: 0, byes: 0, legByes: 2, penalty: 0, total: 12 },
  totalSummary,
  didNotBat,
}) => {
  // Format total summary if not directly supplied
  const displayTotalSummary = totalSummary || totalScore;

  return (
    <View style={styles.cardContainer}>
      {/* 1. Emerald Team Header Banner (India | 157-3 (13.4 Ov)) */}
      <View style={styles.emeraldHeaderBanner}>
        <Text style={styles.teamBannerTitle}>{teamName}</Text>
        <Text style={styles.teamBannerScore}>{totalScore}</Text>
      </View>

      {/* 2. Column Headers Table (Batter | R | B | 4s | 6s | SR) */}
      <View style={styles.columnHeaderRow}>
        <Text style={[styles.colHeader, styles.colBatter]}>Batter</Text>
        <Text style={[styles.colHeader, styles.colNum, styles.colRHeader]}>R</Text>
        <Text style={[styles.colHeader, styles.colNum]}>B</Text>
        <Text style={[styles.colHeader, styles.colNum]}>4s</Text>
        <Text style={[styles.colHeader, styles.colNum]}>6s</Text>
        <Text style={[styles.colHeader, styles.colSR]}>SR</Text>
      </View>

      {/* 3. Batters List */}
      {batting.map((batter, index) => {
        const isNotOut = !batter.isOut;
        const dismissalText = isNotOut ? 'not out' : (batter.dismissalInfo || 'out');
        const strikeRateFormatted =
          batter.balls > 0
            ? ((batter.runs / batter.balls) * 100).toFixed(2)
            : '0.00';

        return (
          <View
            key={batter.playerId || `batter_${index}`}
            style={[styles.batterRow, index === batting.length - 1 && styles.lastBatterRow]}
          >
            {/* Batter Name & Dismissal */}
            <View style={styles.colBatter}>
              <Text style={styles.batterNameLink} numberOfLines={1}>
                {batter.name}
              </Text>
              <Text style={styles.dismissalSubtext} numberOfLines={2}>
                {dismissalText}
              </Text>
            </View>

            {/* Stats */}
            <Text style={[styles.colNum, styles.runsValue]}>{batter.runs}</Text>
            <Text style={[styles.colNum, styles.statValue]}>{batter.balls}</Text>
            <Text style={[styles.colNum, styles.statValue]}>{batter.fours || 0}</Text>
            <Text style={[styles.colNum, styles.statValue]}>{batter.sixes || 0}</Text>
            <Text style={[styles.colSR, styles.srValue]}>{strikeRateFormatted}</Text>
          </View>
        );
      })}

      {/* 4. Extras Row: Extras 12 (b 0, lb 2, w 10, nb 0, p 0) */}
      <View style={styles.metaRow}>
        <Text style={styles.metaRowLabel}>Extras</Text>
        <Text style={styles.metaRowContent}>
          <Text style={styles.boldMetaNumber}>{extras.total} </Text>
          <Text style={styles.extrasBreakdown}>
            (b {extras.byes || 0}, lb {extras.legByes || 0}, w {extras.wides || 0}, nb {extras.noBalls || 0}, p {extras.penalty || 0})
          </Text>
        </Text>
      </View>

      {/* 5. Total Row: Total 157-3 (13.4 Overs, RR: 11.49) */}
      <View style={styles.metaRow}>
        <Text style={styles.metaRowLabel}>Total</Text>
        <Text style={styles.boldMetaNumber}>{displayTotalSummary}</Text>
      </View>

      {/* 6. Did not Bat Row */}
      {didNotBat && didNotBat.length > 0 && (
        <View style={[styles.metaRow, styles.didNotBatRow]}>
          <Text style={styles.metaRowLabel}>Did not Bat</Text>
          <View style={styles.didNotBatNamesWrapper}>
            <Text style={styles.didNotBatNames}>
              {didNotBat.join(', ')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#161922',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  emeraldHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#00695C',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  teamBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  teamBannerScore: {
    fontSize: 14,
    fontWeight: '900',
    color: '#A7F3D0',
  },
  columnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2330',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  colBatter: {
    flex: 1,
    paddingRight: 8,
  },
  colNum: {
    width: 32,
    textAlign: 'right',
  },
  colRHeader: {
    fontWeight: '900',
    color: '#4EDEAF',
  },
  colSR: {
    width: 58,
    textAlign: 'right',
  },
  batterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: '#161922',
  },
  lastBatterRow: {
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  batterNameLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 2,
  },
  dismissalSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 14,
  },
  runsValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4EDEAF',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  srValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: '#1A1E29',
  },
  metaRowLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    width: 90,
  },
  metaRowContent: {
    flex: 1,
    textAlign: 'right',
  },
  boldMetaNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  extrasBreakdown: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  didNotBatRow: {
    alignItems: 'flex-start',
    borderBottomWidth: 0,
    paddingVertical: 10,
  },
  didNotBatNamesWrapper: {
    flex: 1,
    paddingLeft: 8,
  },
  didNotBatNames: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
    lineHeight: 17,
  },
});

export default BatsmanTable;
