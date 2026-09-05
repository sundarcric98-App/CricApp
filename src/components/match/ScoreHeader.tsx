import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { Match } from '../../types/cricket';

export type MatchDetailTab = 'scorecard' | 'commentary' | 'stats' | 'lineups';

interface ScoreHeaderProps {
  match: Match;
  activeTab: MatchDetailTab;
  onSelectTab: (tab: MatchDetailTab) => void;
}

export const ScoreHeader: React.FC<ScoreHeaderProps> = ({
  match,
  activeTab,
  onSelectTab,
}) => {
  const isTeam1Batting = match.battingTeamId === match.team1.id;
  const currentBatting = isTeam1Batting ? match.team1 : match.team2;
  const currentBowling = isTeam1Batting ? match.team2 : match.team1;

  const tabs: { key: MatchDetailTab; label: string }[] = [
    { key: 'scorecard', label: 'Scorecard' },
    { key: 'commentary', label: 'Commentary' },
    { key: 'stats', label: 'Live Stats' },
    { key: 'lineups', label: 'Lineups' },
  ];

  return (
    <View style={styles.container}>
      {/* Top Telemetry Strip */}
      <View style={styles.telemetryStrip}>
        <View style={styles.telemetryLeft}>
          <View style={styles.inningsBadge}>
            <View style={styles.pulsingDot} />
            <Text style={styles.inningsBadgeText}>
              {match.status === 'live' ? `LIVE • Innings ${match.currentInnings}` : match.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.stageText} numberOfLines={1}>
            {match.matchNumber}
          </Text>
        </View>
        <Text style={styles.venueText} numberOfLines={1}>
          {match.venue.toUpperCase()}
        </Text>
      </View>

      {/* Matchup Scores Matrix */}
      <View style={styles.matrixCard}>
        {/* Batting Team (Chasing / Active) */}
        <View style={styles.teamScoreColumn}>
          <View style={styles.teamHeaderRow}>
            <View style={styles.activeDot} />
            <Text style={styles.teamCode}>{currentBatting.shortName}</Text>
            <Text style={styles.teamInningsTag}>
              {match.currentInnings === 2 ? '(chasing)' : '(batting)'}
            </Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.primaryScore}>
              {currentBatting.score}/{currentBatting.wickets}
            </Text>
            <Text style={styles.oversSmall}>{currentBatting.overs.toFixed(1)} ov</Text>
          </View>
        </View>

        {/* Bowling Team / Previous Innings */}
        <View style={[styles.teamScoreColumn, styles.teamScoreColumnRight]}>
          <View style={styles.teamHeaderRowRight}>
            <Text style={styles.teamCodeSecondary}>{currentBowling.shortName}</Text>
            <Text style={styles.teamInningsTag}>
              {match.currentInnings === 2 ? '1st Inn' : 'Yet to bat'}
            </Text>
          </View>
          <View style={styles.scoreRowRight}>
            {match.currentInnings === 2 ? (
              <>
                <Text style={styles.secondaryScore}>
                  {currentBowling.score}/{currentBowling.wickets}
                </Text>
                <Text style={styles.oversSmallSecondary}>{currentBowling.overs.toFixed(1)} ov</Text>
              </>
            ) : (
              <Text style={styles.oversSmallSecondary}>0/0</Text>
            )}
          </View>
        </View>
      </View>

      {/* Live Equation Banner Strip */}
      {match.equation && (
        <View style={styles.equationStrip}>
          <View style={styles.equationLeft}>
            <Ionicons name="flash" size={14} color={Colors.secondary} />
            <Text style={styles.equationText} numberOfLines={1}>
              {match.equation}
            </Text>
          </View>
          <View style={styles.ratesRow}>
            <Text style={styles.rateItem}>
              CRR <Text style={styles.rateBold}>{match.crr.toFixed(2)}</Text>
            </Text>
            {match.rrr !== undefined && match.rrr > 0 && (
              <>
                <Text style={styles.rateBullet}>•</Text>
                <Text style={styles.rateItem}>
                  RRR <Text style={styles.rateAmber}>{match.rrr.toFixed(2)}</Text>
                </Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Segmented Navigation Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => onSelectTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(24, 32, 43, 0.98)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  telemetryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  inningsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    gap: 4,
  },
  pulsingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  inningsBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  stageText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
    flexShrink: 1,
  },
  venueText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryFixedDim,
    letterSpacing: 0.6,
  },
  matrixCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(7, 15, 25, 0.8)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  teamScoreColumn: {
    flex: 1,
    gap: 2,
  },
  teamScoreColumnRight: {
    alignItems: 'flex-end',
    opacity: 0.85,
  },
  teamHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  teamHeaderRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  teamCode: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  teamCodeSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  teamInningsTag: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  scoreRowRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  primaryScore: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.5,
  },
  oversSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  secondaryScore: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  oversSmallSecondary: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  equationStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  equationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  equationText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
    flexShrink: 1,
  },
  ratesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rateItem: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  rateBold: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  rateAmber: {
    fontWeight: '700',
    color: Colors.secondary,
  },
  rateBullet: {
    fontSize: 10,
    color: Colors.outline,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  tabButtonTextActive: {
    color: Colors.onPrimary,
  },
});

export default ScoreHeader;
