import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { Match } from '../../types/cricket';
import { LiveBadge } from '../common/Badge';
import RecentBallsRibbon from './RecentBallsRibbon';

interface FeaturedMatchCardProps {
  match: Match;
  onPress?: () => void;
}

export const FeaturedMatchCard: React.FC<FeaturedMatchCardProps> = ({ match, onPress }) => {
  const router = useRouter();

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/match/${match.id}` as any);
    }
  };

  const handleScorerPress = () => {
    router.push(`/scoring/${match.id}` as any);
  };

  const isTeam1Batting = match.battingTeamId === match.team1.id;
  const battingTeam = isTeam1Batting ? match.team1 : match.team2;
  const bowlingTeam = isTeam1Batting ? match.team2 : match.team1;

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={handleCardPress}
      activeOpacity={0.92}
    >
      {/* Ambient background glow */}
      <View style={styles.ambientGlow} />

      {/* Top Meta Bar */}
      <View style={styles.metaHeader}>
        <View style={styles.metaLeft}>
          <Ionicons name="trophy" size={15} color={Colors.secondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {match.seriesName} • {match.matchNumber} • {match.city}
          </Text>
        </View>
        <LiveBadge label="LIVE" size="sm" />
      </View>

      {/* Head-to-Head Score Board */}
      <View style={styles.teamsSection}>
        {/* Bowling Team / 1st Innings */}
        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            <View style={styles.teamLogoBox}>
              <Image source={{ uri: bowlingTeam.logo }} style={styles.teamLogo} />
            </View>
            <Text style={styles.teamName} numberOfLines={1}>
              {bowlingTeam.name}
            </Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreText}>
              {bowlingTeam.score}/{bowlingTeam.wickets}
            </Text>
            <Text style={styles.oversText}>({bowlingTeam.overs.toFixed(1)} ov)</Text>
          </View>
        </View>

        {/* Batting Team (Highlighted Container) */}
        <View style={styles.activeBattingRow}>
          <View style={styles.teamInfo}>
            <View style={styles.teamLogoBoxActive}>
              <Image source={{ uri: battingTeam.logo }} style={styles.teamLogo} />
            </View>
            <View style={styles.battingNameBox}>
              <Text style={styles.teamNameActive} numberOfLines={1}>
                {battingTeam.name}
              </Text>
              <View style={styles.battingDot} />
            </View>
          </View>
          <View style={styles.scoreBoxActive}>
            <Text style={styles.scoreTextActive}>
              {battingTeam.score}/{battingTeam.wickets}
            </Text>
            <Text style={styles.oversTextActive}>{battingTeam.overs.toFixed(1)} ov</Text>
          </View>
        </View>
      </View>

      {/* Over Ribbon Bubble Strip */}
      {match.recentBalls && match.recentBalls.length > 0 && (
        <RecentBallsRibbon balls={match.recentBalls} label="Recent Balls" size="sm" />
      )}

      {/* Run Equation Pill */}
      {match.equation && (
        <View style={styles.equationPill}>
          <View style={styles.equationLeft}>
            <Ionicons name="flash" size={15} color={Colors.secondary} />
            <Text style={styles.equationText} numberOfLines={1}>
              {match.equation}
            </Text>
          </View>
          <View style={styles.rateStats}>
            {match.rrr !== undefined && match.rrr > 0 && (
              <Text style={styles.rateText}>RRR {match.rrr.toFixed(2)}</Text>
            )}
            <Text style={styles.rateDivider}>•</Text>
            <Text style={styles.rateText}>CRR {match.crr.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* Batters & Bowler Telemetry Row */}
      <View style={styles.telemetryGrid}>
        {/* Batters Box */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <Text style={styles.telemetryLabel}>BATTING</Text>
            <Text style={styles.strikeTag}>STRIKE</Text>
          </View>
          <View style={styles.batterStatRow}>
            <Text style={styles.batterName} numberOfLines={1}>
              {match.activeBatters.striker.name} *
            </Text>
            <Text style={styles.batterScore}>
              {match.activeBatters.striker.runs}{' '}
              <Text style={styles.ballsCount}>({match.activeBatters.striker.balls})</Text>
            </Text>
          </View>
          <View style={styles.batterStatRow}>
            <Text style={styles.nonStrikerName} numberOfLines={1}>
              {match.activeBatters.nonStriker.name}
            </Text>
            <Text style={styles.nonStrikerScore}>
              {match.activeBatters.nonStriker.runs}{' '}
              <Text style={styles.ballsCount}>({match.activeBatters.nonStriker.balls})</Text>
            </Text>
          </View>
        </View>

        {/* Bowler Box */}
        <View style={styles.telemetryCard}>
          <Text style={styles.telemetryLabel}>CURRENT BOWLER</Text>
          <Text style={styles.bowlerName} numberOfLines={1}>
            {match.activeBowler.name}
          </Text>
          <View style={styles.bowlerFiguresRow}>
            <Text style={styles.bowlerFigures}>
              {match.activeBowler.overs.toFixed(1)}-{match.activeBowler.maidens}-
              {match.activeBowler.runs}-{match.activeBowler.wickets}
            </Text>
            <Text style={styles.econTag}>ECON {match.activeBowler.economy.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      {/* Action Footer & Admin Scorer Shortcut */}
      <View style={styles.footerRow}>
        <View style={styles.footerTextGroup}>
          <Text style={styles.footerText}>Tap to view full scorecard & commentary</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
        </View>

        <TouchableOpacity
          style={styles.scorerButton}
          onPress={handleScorerPress}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={14} color={Colors.onPrimary} />
          <Text style={styles.scorerButtonText}>Scorer</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 16,
    marginVertical: 6,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.2)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(78, 222, 163, 0.1)',
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  teamsSection: {
    gap: 8,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  activeBattingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(45, 53, 65, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.3)',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  teamLogoBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  teamLogoBoxActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainer,
    overflow: 'hidden',
  },
  teamLogo: {
    width: '100%',
    height: '100%',
  },
  teamName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.onSurface,
    flexShrink: 1,
  },
  battingNameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  teamNameActive: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    flexShrink: 1,
  },
  battingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  oversText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  scoreBoxActive: {
    alignItems: 'flex-end',
  },
  scoreTextActive: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.5,
  },
  oversTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  equationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(238, 152, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  equationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  equationText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
    flexShrink: 1,
  },
  rateStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rateText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryFixed,
  },
  rateDivider: {
    fontSize: 11,
    color: Colors.secondaryFixed,
    opacity: 0.5,
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  telemetryCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    padding: 10,
    borderRadius: 12,
    gap: 4,
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  strikeTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  batterStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batterName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  batterScore: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  nonStrikerName: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  nonStrikerScore: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  ballsCount: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.onSurfaceVariant,
  },
  bowlerName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  bowlerFiguresRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  bowlerFigures: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  econTag: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  footerTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  scorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scorerButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
});

export default FeaturedMatchCard;
