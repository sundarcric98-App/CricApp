import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import { Match, Scorecard } from '../../types/cricket';

interface MatchStatsTabProps {
  match: Match;
  scorecard: Scorecard | null;
}

export const MatchStatsTab: React.FC<MatchStatsTabProps> = ({ match, scorecard }) => {
  const t1 = match.team1;
  const t2 = match.team2;

  return (
    <View style={styles.container}>
      {/* Run Rate Comparison Card */}
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Run Rate & Totals</Text>
        <View style={styles.comparisonRow}>
          <View style={styles.teamCol}>
            <Text style={styles.teamNameText}>{t1.shortName}</Text>
            <Text style={styles.bigScoreText}>
              {t1.score}/{t1.wickets}
            </Text>
            <Text style={styles.statSubText}>{t1.overs.toFixed(1)} ov</Text>
            <Text style={styles.rrText}>
              CRR: {(t1.score / (Math.max(t1.overs, 0.1))).toFixed(2)}
            </Text>
          </View>

          <View style={styles.vsBox}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={[styles.teamCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.teamNameText}>{t2.shortName}</Text>
            <Text style={[styles.bigScoreText, { color: Colors.primary }]}>
              {t2.score}/{t2.wickets}
            </Text>
            <Text style={styles.statSubText}>{t2.overs.toFixed(1)} ov</Text>
            <Text style={[styles.rrText, { color: Colors.primary }]}>
              CRR: {match.crr.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Boundaries & Extras Summary */}
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Match Comparison</Text>

        <View style={styles.metricRow}>
          <Text style={styles.metricValue}>{t1.shortName}</Text>
          <Text style={styles.metricLabel}>METRIC</Text>
          <Text style={styles.metricValue}>{t2.shortName}</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricValue}>14</Text>
          <Text style={styles.metricLabel}>Fours (4s)</Text>
          <Text style={styles.metricValue}>12</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricValue}>7</Text>
          <Text style={styles.metricLabel}>Sixes (6s)</Text>
          <Text style={styles.metricValue}>5</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricValue}>10</Text>
          <Text style={styles.metricLabel}>Extras</Text>
          <Text style={styles.metricValue}>8</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricValue}>54 (36)</Text>
          <Text style={styles.metricLabel}>Powerplay (1-6)</Text>
          <Text style={styles.metricValue}>58 (36)</Text>
        </View>
      </View>

      {/* Fall of Wickets */}
      {scorecard?.innings2?.fallOfWickets && scorecard.innings2.fallOfWickets.length > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Fall of Wickets ({t2.shortName})</Text>
          <View style={styles.fowList}>
            {scorecard.innings2.fallOfWickets.map((fow) => (
              <View key={`fow_${fow.wicketNumber}`} style={styles.fowItem}>
                <View style={styles.fowBadge}>
                  <Text style={styles.fowWicketNum}>{fow.wicketNumber}</Text>
                </View>
                <View style={styles.fowInfo}>
                  <Text style={styles.fowPlayerName}>{fow.playerName}</Text>
                  <Text style={styles.fowScoreOver}>
                    {fow.score} runs • {fow.over} ov
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 8,
  },
  statsCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCol: {
    flex: 1,
    gap: 2,
  },
  teamNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  bigScoreText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  statSubText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  rrText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
    marginTop: 2,
  },
  vsBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.outline,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
    width: 50,
    textAlign: 'center',
  },
  fowList: {
    gap: 8,
  },
  fowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainer,
    padding: 10,
    borderRadius: 10,
  },
  fowBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fowWicketNum: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.error,
  },
  fowInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fowPlayerName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  fowScoreOver: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
});

export default MatchStatsTab;
