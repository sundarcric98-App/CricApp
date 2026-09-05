import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../components/common/Header';
import CommentaryCard from '../components/commentary/CommentaryCard';
import RecentBallsRibbon from '../components/match/RecentBallsRibbon';
import ScoreHeader, { MatchDetailTab } from '../components/match/ScoreHeader';
import BatsmanTable from '../components/scorecard/BatsmanTable';
import BowlerTable from '../components/scorecard/BowlerTable';
import MatchStatsTab from '../components/scorecard/MatchStatsTab';
import Colors from '../constants/colors';
import { fetchCommentary, fetchMatchDetails } from '../store/matchSlice';
import { useAppDispatch, useAppSelector } from '../store/store';

export const MatchDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = (Array.isArray(id) ? id[0] : id) || 'match_blr_mum_01';
  const router = useRouter();

  const dispatch = useAppDispatch();
  const { currentMatch, scorecard, commentary, loading } = useAppSelector((state) => state.matches);

  const [activeTab, setActiveTab] = useState<MatchDetailTab>('scorecard');
  const [commentaryFilter, setCommentaryFilter] = useState<'all' | 'boundary' | 'wicket'>('all');
  const [activeInningsView, setActiveInningsView] = useState<1 | 2>(2);

  useEffect(() => {
    dispatch(fetchMatchDetails(matchId));
  }, [dispatch, matchId]);

  const handleRefresh = () => {
    dispatch(fetchMatchDetails(matchId));
  };

  const handleFilterChange = (filter: 'all' | 'boundary' | 'wicket') => {
    setCommentaryFilter(filter);
    dispatch(fetchCommentary({ matchId, filter: filter === 'all' ? undefined : filter }));
  };

  if (!currentMatch && loading) {
    return (
      <View style={styles.loadingContainer}>
        <Header showBack title="Match Detail" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading match scorecard...</Text>
        </View>
      </View>
    );
  }

  const match = currentMatch || {
    id: matchId,
    title: 'BLR vs MUM',
    seriesName: 'T20 Premier League 2025',
    matchNumber: '2nd Semi Final',
    venue: 'Wankhede Stadium',
    city: 'Mumbai',
    status: 'live' as const,
    format: 'T20' as const,
    currentInnings: 2 as const,
    toss: 'Bengaluru Royals won toss & elected to field',
    tossWinner: 'Bengaluru Royals',
    decision: 'bowl' as const,
    team1: {
      id: 'team_mum',
      name: 'Mumbai Warriors',
      shortName: 'MUM',
      logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=128&q=80',
      score: 178,
      wickets: 4,
      overs: 20.0,
      maxOvers: 20,
    },
    team2: {
      id: 'team_blr',
      name: 'Bengaluru Royals',
      shortName: 'BLR',
      logo: 'https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?w=128&q=80',
      score: 145,
      wickets: 3,
      overs: 18.2,
      maxOvers: 20,
    },
    battingTeamId: 'team_blr',
    bowlingTeamId: 'team_mum',
    target: 179,
    equation: 'Need 34 runs in 10 balls',
    crr: 7.91,
    rrr: 20.4,
    recentBalls: ['1', '2', '0', '4', 'W', '6', '1', '1'],
    activeBatters: {
      striker: {
        playerId: 'p_kohli',
        name: 'V. Kohli (c)*',
        shortName: 'V Kohli',
        runs: 68,
        balls: 42,
        fours: 6,
        sixes: 2,
        strikeRate: 161.9,
        isStriker: true,
        isNonStriker: false,
        isOut: false,
      },
      nonStriker: {
        playerId: 'p_maxwell',
        name: 'G. Maxwell',
        shortName: 'G Maxwell',
        runs: 24,
        balls: 11,
        fours: 2,
        sixes: 2,
        strikeRate: 218.2,
        isStriker: false,
        isNonStriker: true,
        isOut: false,
      },
    },
    activeBowler: {
      playerId: 'p_bumrah',
      name: 'J. Bumrah',
      shortName: 'J Bumrah',
      overs: 3.2,
      oversInBalls: 20,
      maidens: 0,
      runs: 28,
      wickets: 2,
      economy: 8.4,
      dots: 10,
      wides: 1,
      noBalls: 0,
      isCurrentBowler: true,
    },
    startTime: '2025-05-24T19:30:00Z',
  };

  const currentInningsData =
    activeInningsView === 2 ? scorecard?.innings2 : scorecard?.innings1;

  const currentBattingTeamName =
    activeInningsView === 2 ? match.team2.name : match.team1.name;
  const currentBowlingTeamName =
    activeInningsView === 2 ? match.team1.name : match.team2.name;

  return (
    <View style={styles.container}>
      <Header
        showBack
        title="Match Detail"
        rightAction={
          <TouchableOpacity
            style={styles.adminScorerBtn}
            onPress={() => router.push(`/scoring/${match.id}` as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.adminScorerText}>Scorer</Text>
          </TouchableOpacity>
        }
      />

      {/* Sticky Telemetry Header */}
      <ScoreHeader
        match={match}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Main Tab Content */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {activeTab === 'scorecard' && (
          <View style={styles.tabSection}>
            {/* Over Timeline Live Bar */}
            {match.status === 'live' && (
              <View style={styles.overTimelineBar}>
                <View style={styles.overMetaRow}>
                  <Text style={styles.overMetaTitle}>
                    Over {Math.floor(match.team2.overs) + 1} Live • {match.activeBowler.name} to {match.team2.shortName}
                  </Text>
                  <Text style={styles.overRunsCount}>5 Runs this over</Text>
                </View>
                <RecentBallsRibbon balls={match.recentBalls} label="" size="sm" />
              </View>
            )}

            {/* Innings Selector Segment */}
            <View style={styles.inningsSwitchRow}>
              <TouchableOpacity
                style={[
                  styles.inningsPill,
                  activeInningsView === 2 && styles.inningsPillActive,
                ]}
                onPress={() => setActiveInningsView(2)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.inningsPillText,
                    activeInningsView === 2 && styles.inningsPillTextActive,
                  ]}
                >
                  {match.team2.shortName} (2nd Inn)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.inningsPill,
                  activeInningsView === 1 && styles.inningsPillActive,
                ]}
                onPress={() => setActiveInningsView(1)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.inningsPillText,
                    activeInningsView === 1 && styles.inningsPillTextActive,
                  ]}
                >
                  {match.team1.shortName} (1st Inn)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Batting Lineup */}
            <BatsmanTable
              teamName={currentBattingTeamName}
              totalScore={
                activeInningsView === 2
                  ? `${match.team2.score}/${match.team2.wickets} (${match.team2.overs.toFixed(1)})`
                  : `${match.team1.score}/${match.team1.wickets} (${match.team1.overs.toFixed(1)})`
              }
              batting={
                currentInningsData?.batting || [
                  match.activeBatters.striker,
                  match.activeBatters.nonStriker,
                ]
              }
              extras={currentInningsData?.extras}
            />

            {/* Bowling Lineup */}
            <BowlerTable
              teamName={currentBowlingTeamName}
              bowling={currentInningsData?.bowling || [match.activeBowler]}
            />
          </View>
        )}

        {activeTab === 'commentary' && (
          <View style={styles.tabSection}>
            {/* Filter Pills */}
            <View style={styles.commentaryFilterRow}>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  commentaryFilter === 'all' && styles.filterPillActive,
                ]}
                onPress={() => handleFilterChange('all')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    commentaryFilter === 'all' && styles.filterPillTextActive,
                  ]}
                >
                  All Balls
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  commentaryFilter === 'boundary' && styles.filterPillActive,
                ]}
                onPress={() => handleFilterChange('boundary')}
              >
                <View style={styles.filterDotGreen} />
                <Text
                  style={[
                    styles.filterPillText,
                    commentaryFilter === 'boundary' && styles.filterPillTextActive,
                  ]}
                >
                  Boundaries (4s & 6s)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  commentaryFilter === 'wicket' && styles.filterPillActive,
                ]}
                onPress={() => handleFilterChange('wicket')}
              >
                <View style={styles.filterDotRed} />
                <Text
                  style={[
                    styles.filterPillText,
                    commentaryFilter === 'wicket' && styles.filterPillTextActive,
                  ]}
                >
                  Wickets
                </Text>
              </TouchableOpacity>
            </View>

            {/* Commentary Cards Stream */}
            <View style={styles.commentaryList}>
              {commentary.map((item, index) => (
                <CommentaryCard
                  key={item.id}
                  item={item}
                  isLast={index === commentary.length - 1}
                />
              ))}
            </View>
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.tabSection}>
            <MatchStatsTab match={match} scorecard={scorecard} />
          </View>
        )}

        {activeTab === 'lineups' && (
          <View style={styles.tabSection}>
            <View style={styles.lineupCard}>
              <Text style={styles.lineupTeamTitle}>{match.team1.name} Playing XI</Text>
              <Text style={styles.lineupPlayers}>
                Rohit Sharma (c), Ishan Kishan (wk), Suryakumar Yadav, Tilak Varma, Hardik Pandya, Tim David, Romario Shepherd, Piyush Chawla, Gerald Coetzee, Jasprit Bumrah, Akash Madhwal
              </Text>
            </View>

            <View style={styles.lineupCard}>
              <Text style={styles.lineupTeamTitle}>{match.team2.name} Playing XI</Text>
              <Text style={styles.lineupPlayers}>
                Faf du Plessis, Virat Kohli (c), Rajat Patidar, Glenn Maxwell, Cameron Green, Dinesh Karthik (wk), Mahipal Lomror, Karn Sharma, Lockie Ferguson, Mohammed Siraj, Yash Dayal
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.onSurfaceVariant,
    fontSize: 14,
  },
  adminScorerBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  adminScorerText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.onPrimary,
    textTransform: 'uppercase',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
  },
  tabSection: {
    gap: 12,
  },
  overTimelineBar: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  overMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overMetaTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overRunsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  inningsSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 4,
    borderRadius: 10,
  },
  inningsPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inningsPillActive: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  inningsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  inningsPillTextActive: {
    color: Colors.primary,
  },
  commentaryFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: Colors.onPrimary,
  },
  filterDotGreen: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  filterDotRed: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.error,
  },
  commentaryList: {
    gap: 4,
  },
  lineupCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  lineupTeamTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lineupPlayers: {
    fontSize: 13,
    color: Colors.onSurface,
    lineHeight: 20,
  },
});

export default MatchDetailScreen;
