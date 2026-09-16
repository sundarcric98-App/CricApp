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
    <View style={styles.cardContainer}>
      {/* Column Headers (Bowler | O | M | R | W | NB | WD | ECO) */}
      <View style={styles.columnHeaderRow}>
        <Text style={[styles.colHeader, styles.colBowler]}>Bowler</Text>
        <Text style={[styles.colHeader, styles.colNum]}>O</Text>
        <Text style={[styles.colHeader, styles.colNum]}>M</Text>
        <Text style={[styles.colHeader, styles.colNum]}>R</Text>
        <Text style={[styles.colHeader, styles.colNum, styles.colWktsHeader]}>W</Text>
        <Text style={[styles.colHeader, styles.colNum]}>NB</Text>
        <Text style={[styles.colHeader, styles.colNum]}>WD</Text>
        <Text style={[styles.colHeader, styles.colEco]}>ECO</Text>
      </View>

      {/* Bowler Rows */}
      {bowling.map((bowler, index) => {
        const economyFormatted =
          bowler.oversInBalls > 0
            ? ((bowler.runs / bowler.oversInBalls) * 6).toFixed(2)
            : (bowler.economy ? bowler.economy.toFixed(2) : '0.00');

        return (
          <View
            key={bowler.playerId || `bowler_${index}`}
            style={[styles.bowlerRow, index === bowling.length - 1 && styles.lastBowlerRow]}
          >
            {/* Bowler Name */}
            <View style={styles.colBowler}>
              <Text style={styles.bowlerNameLink} numberOfLines={1}>
                {bowler.name}
              </Text>
            </View>

            {/* Figures */}
            <Text style={[styles.colNum, styles.statValue]}>{bowler.overs}</Text>
            <Text style={[styles.colNum, styles.statValue]}>{bowler.maidens || 0}</Text>
            <Text style={[styles.colNum, styles.statValue]}>{bowler.runs}</Text>
            <Text style={[styles.colNum, styles.wktsValue]}>{bowler.wickets}</Text>
            <Text style={[styles.colNum, styles.statValue]}>{bowler.noBalls || 0}</Text>
            <Text style={[styles.colNum, styles.statValue]}>{bowler.wides || 0}</Text>
            <Text style={[styles.colEco, styles.statValue]}>{economyFormatted}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  columnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  colHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  colBowler: {
    flex: 1,
    paddingRight: 6,
  },
  colNum: {
    width: 28,
    textAlign: 'right',
  },
  colWktsHeader: {
    fontWeight: '800',
    color: '#0F172A',
  },
  colEco: {
    width: 46,
    textAlign: 'right',
  },
  bowlerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  lastBowlerRow: {
    borderBottomWidth: 0,
  },
  bowlerNameLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  wktsValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
});

export default BowlerTable;
