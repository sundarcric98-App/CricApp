import { useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Header from '../components/common/Header';
import PlayerStatCard from '../components/player/PlayerStatCard';
import Colors from '../constants/colors';
import { fetchPlayerProfile } from '../store/matchSlice';
import { useAppDispatch, useAppSelector } from '../store/store';

export const PlayerProfileScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playerId = (Array.isArray(id) ? id[0] : id) || 'p_kohli';

  const dispatch = useAppDispatch();
  const { selectedPlayer, loading } = useAppSelector((state) => state.matches);

  useEffect(() => {
    dispatch(fetchPlayerProfile(playerId));
  }, [dispatch, playerId]);

  const player = selectedPlayer || {
    id: 'p_kohli',
    name: 'Virat Kohli',
    shortName: 'V Kohli',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
    teamId: 'team_blr',
    role: 'batsman' as const,
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    country: 'India',
    jerseyNumber: 18,
    careerStats: {
      matches: 252,
      runs: 8004,
      average: 38.6,
      strikeRate: 131.9,
      highestScore: 113,
      fifties: 55,
      hundreds: 8,
      wickets: 4,
      economy: 8.8,
      bestBowling: '2/25',
    },
    recentInnings: [
      { match: 'vs MUM', runs: 68, balls: 42, isOut: false, date: '2025-05-24' },
      { match: 'vs CHE', runs: 47, balls: 29, isOut: true, date: '2025-05-18' },
      { match: 'vs DEL', runs: 92, balls: 54, isOut: false, date: '2025-05-12' },
      { match: 'vs KOL', runs: 18, balls: 14, isOut: true, date: '2025-05-06' },
      { match: 'vs HYD', runs: 51, balls: 36, isOut: true, date: '2025-04-30' },
    ],
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Player Profile" />
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchPlayerProfile(playerId))}
            tintColor={Colors.primary}
          />
        }
      >
        <PlayerStatCard player={player} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 32,
  },
});

export default PlayerProfileScreen;
