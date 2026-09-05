import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import { Player } from '../../types/cricket';

interface PlayerStatCardProps {
  player: Player;
}

export const PlayerStatCard: React.FC<PlayerStatCardProps> = ({ player }) => {
  return (
    <View style={styles.container}>
      {/* Profile Header Hero */}
      <View style={styles.heroCard}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: player.avatar }} style={styles.avatar} />
          <View style={styles.jerseyBadge}>
            <Text style={styles.jerseyText}>#{player.jerseyNumber || 18}</Text>
          </View>
        </View>

        <View style={styles.heroDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
          </View>

          <View style={styles.roleTag}>
            <Text style={styles.roleText}>{player.role.toUpperCase()}</Text>
          </View>

          <Text style={styles.styleText}>{player.battingStyle}</Text>
          <Text style={styles.styleText}>{player.bowlingStyle}</Text>
        </View>
      </View>

      {/* Career Overview Numbers Grid */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Career Statistics</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{player.careerStats.matches}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: Colors.primary }]}>
              {player.careerStats.runs}
            </Text>
            <Text style={styles.statLabel}>Runs</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{player.careerStats.average}</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: Colors.secondary }]}>
              {player.careerStats.strikeRate}
            </Text>
            <Text style={styles.statLabel}>Strike Rate</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{player.careerStats.highestScore}</Text>
            <Text style={styles.statLabel}>Highest Score</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {player.careerStats.hundreds}/{player.careerStats.fifties}
            </Text>
            <Text style={styles.statLabel}>100s / 50s</Text>
          </View>

          {player.careerStats.wickets > 0 && (
            <>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{player.careerStats.wickets}</Text>
                <Text style={styles.statLabel}>Wickets</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{player.careerStats.economy}</Text>
                <Text style={styles.statLabel}>Economy</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Recent Innings Log */}
      {player.recentInnings && player.recentInnings.length > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Recent Match Innings</Text>

          <View style={styles.inningsList}>
            {player.recentInnings.map((inn, idx) => (
              <View key={`inn_${idx}`} style={styles.inningItem}>
                <View style={styles.inningLeft}>
                  <Text style={styles.matchOpponent}>{inn.match}</Text>
                  <Text style={styles.matchDate}>{inn.date}</Text>
                </View>

                <View style={styles.scorePill}>
                  <Text style={styles.inningRuns}>
                    {inn.runs}
                    {!inn.isOut ? '*' : ''}
                  </Text>
                  <Text style={styles.inningBalls}>({inn.balls}b)</Text>
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
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  jerseyBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  jerseyText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onSecondary,
  },
  heroDetails: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  roleTag: {
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginVertical: 2,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  styleText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  statsCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    width: '31%',
    backgroundColor: Colors.surfaceContainer,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  inningsList: {
    gap: 8,
  },
  inningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainer,
    padding: 12,
    borderRadius: 10,
  },
  inningLeft: {
    gap: 2,
  },
  matchOpponent: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  matchDate: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inningRuns: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  inningBalls: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
});

export default PlayerStatCard;
