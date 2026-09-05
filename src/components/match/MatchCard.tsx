import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { Match } from '../../types/cricket';
import { LiveBadge, StatusPill } from '../common/Badge';

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPress }) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/match/${match.id}` as any);
    }
  };

  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.88}>
      {/* Top Meta Bar */}
      <View style={styles.topRow}>
        <Text style={styles.seriesText} numberOfLines={1}>
          {match.seriesName} • {match.matchNumber}
        </Text>
        {isLive ? (
          <LiveBadge label="LIVE" size="sm" />
        ) : isCompleted ? (
          <StatusPill label="COMPLETED" variant="surface" />
        ) : (
          <StatusPill label="UPCOMING" variant="secondary" />
        )}
      </View>

      {/* Team 1 Row */}
      <View style={styles.teamRow}>
        <View style={styles.teamInfo}>
          <Image source={{ uri: match.team1.logo }} style={styles.teamLogo} />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.team1.name}
          </Text>
        </View>
        <View style={styles.scoreInfo}>
          {match.status !== 'upcoming' ? (
            <>
              <Text style={styles.scoreText}>
                {match.team1.score}/{match.team1.wickets}
              </Text>
              <Text style={styles.oversText}>({match.team1.overs.toFixed(1)} ov)</Text>
            </>
          ) : (
            <Text style={styles.yetToBatText}>Yet to bat</Text>
          )}
        </View>
      </View>

      {/* Team 2 Row */}
      <View style={styles.teamRow}>
        <View style={styles.teamInfo}>
          <Image source={{ uri: match.team2.logo }} style={styles.teamLogo} />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.team2.name}
          </Text>
        </View>
        <View style={styles.scoreInfo}>
          {match.status !== 'upcoming' ? (
            <>
              <Text style={styles.scoreText}>
                {match.team2.score}/{match.team2.wickets}
              </Text>
              <Text style={styles.oversText}>({match.team2.overs.toFixed(1)} ov)</Text>
            </>
          ) : (
            <Text style={styles.yetToBatText}>Yet to bat</Text>
          )}
        </View>
      </View>

      {/* Bottom Summary Bar */}
      <View style={styles.bottomRow}>
        <View style={styles.resultContainer}>
          {isLive && match.equation ? (
            <Text style={styles.liveStatusText} numberOfLines={1}>
              <Ionicons name="flash" size={12} color={Colors.secondary} /> {match.equation}
            </Text>
          ) : isCompleted ? (
            <Text style={styles.completedResultText} numberOfLines={1}>
              {match.result || `${match.team1.shortName} vs ${match.team2.shortName}`}
            </Text>
          ) : (
            <Text style={styles.upcomingTimeText} numberOfLines={1}>
              <Ionicons name="time-outline" size={12} color={Colors.secondary} /> {match.toss}
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color={Colors.outline} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    marginVertical: 5,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seriesText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
    flexShrink: 1,
  },
  scoreInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  oversText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  yetToBatText: {
    fontSize: 11,
    color: Colors.outline,
    fontStyle: 'italic',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  resultContainer: {
    flex: 1,
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  completedResultText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  upcomingTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryFixed,
  },
});

export default MatchCard;
