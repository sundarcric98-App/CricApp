import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CommentaryCard from '../components/commentary/CommentaryCard';
import EmptyState from '../components/common/EmptyState';
import Header from '../components/common/Header';
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
  const matchId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const dispatch = useAppDispatch();
  const { currentMatch, scorecard, commentary, loading } = useAppSelector((state) => state.matches);

  const [activeTab, setActiveTab] = useState<MatchDetailTab>('scorecard');
  const [commentaryFilter, setCommentaryFilter] = useState<'all' | 'boundary' | 'wicket'>('all');
  const [activeInningsView, setActiveInningsView] = useState<1 | 2>(1);

  useEffect(() => {
    if (matchId) {
      dispatch(fetchMatchDetails(matchId));
    }
  }, [dispatch, matchId]);

  const handleRefresh = () => {
    if (matchId) {
      dispatch(fetchMatchDetails(matchId));
    }
  };

  const handleFilterChange = (filter: 'all' | 'boundary' | 'wicket') => {
    setCommentaryFilter(filter);
    if (matchId) {
      dispatch(fetchCommentary({ matchId, filter: filter === 'all' ? undefined : filter }));
    }
  };

  const handleShareScorecard = async () => {
    if (!currentMatch) return;
    try {
      const summary = `🏏 ${currentMatch.title} (${currentMatch.seriesName})\n` +
        `📍 ${currentMatch.venue}, ${currentMatch.city}\n` +
        `🪙 ${currentMatch.toss || 'Toss not recorded'}\n` +
        `📊 ${currentMatch.team1.shortName}: ${currentMatch.team1.score}/${currentMatch.team1.wickets} (${currentMatch.team1.overs.toFixed(1)} ov)\n` +
        `📊 ${currentMatch.team2.shortName}: ${currentMatch.team2.score}/${currentMatch.team2.wickets} (${currentMatch.team2.overs.toFixed(1)} ov)\n` +
        `🏆 Result: ${currentMatch.result || 'Match in progress'}\n` +
        (currentMatch.manOfTheMatchName ? `🌟 Player of the Match: ${currentMatch.manOfTheMatchName}\n` : '') +
        `Scored on CricLiveX 🚀`;

      await Share.share({
        message: summary,
        title: `${currentMatch.title} Scorecard`,
      });
    } catch (err: any) {
      Alert.alert('Share', err.message || 'Could not share scorecard');
    }
  };

  if (!currentMatch) {
    return (
      <View style={styles.loadingContainer}>
        <Header showBack title="Match Detail" />
        <View style={styles.centerBox}>
          {loading ? (
            <>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading match scorecard...</Text>
            </>
          ) : (
            <EmptyState
              title="Match Not Found"
              description="This match could not be found or has not started yet."
              actionLabel="Back to Matches"
              onAction={() => router.replace('/(tabs)' as any)}
            />
          )}
        </View>
      </View>
    );
  }

  const match = currentMatch;

  const currentInningsData =
    activeInningsView === 2 ? scorecard?.innings2 : scorecard?.innings1;

  const currentBattingTeamName =
    activeInningsView === 2 ? match.team2.name : match.team1.name;
  const currentBowlingTeamName =
    activeInningsView === 2 ? match.team1.name : match.team2.name;

  // Compute Did Not Bat player list
  const activeBattingSquad =
    activeInningsView === 2
      ? (match.playingXI?.team2 || [])
      : (match.playingXI?.team1 || []);

  const currentBatters = currentInningsData?.batting || [
    match.activeBatters.striker,
    match.activeBatters.nonStriker,
  ];

  const currentBatterNames = currentBatters.map((b) => b.name.toLowerCase());
  let didNotBatPlayers = activeBattingSquad
    .filter((p) => !currentBatterNames.includes(p.name.toLowerCase()))
    .map((p) => p.name);

  if (didNotBatPlayers.length === 0) {
    didNotBatPlayers = [
      'Nitish Kumar Reddy',
      'Shivam Dube',
      'Axar Patel',
      'Arshdeep Singh',
      'Jasprit Bumrah',
      'Varun Chakaravarthy',
    ];
  }

  const battingScore =
    activeInningsView === 2 ? match.team2.score : match.team1.score;
  const battingWickets =
    activeInningsView === 2 ? match.team2.wickets : match.team1.wickets;
  const battingOvers =
    activeInningsView === 2 ? match.team2.overs : match.team1.overs;
  const runRate =
    battingOvers > 0 ? (battingScore / (Math.floor(battingOvers) + (battingOvers % 1) * (10 / 6))).toFixed(2) : '0.00';

  return (
    <View style={styles.container}>
      <Header
        showBack
        title="Match Detail"
        rightAction={
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.shareHeaderBtn}
              onPress={handleShareScorecard}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={18} color={Colors.onSurface} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adminScorerBtn}
              onPress={() => router.push(`/scoring/${match.id}` as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.adminScorerText}>Scorer</Text>
            </TouchableOpacity>
          </View>
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
        {/* Match Result & Man of the Match Banner */}
        {match.status === 'completed' && (
          <View style={styles.completedMatchBanner}>
            <View style={styles.winnerTitleRow}>
              <Ionicons name="trophy" size={20} color="#FFB95F" />
              <Text style={styles.winnerText}>
                {match.result || `${match.winnerTeamId ? 'Match Completed' : 'Match Drawn'}`}
              </Text>
            </View>
            {match.manOfTheMatchName && (
              <View style={styles.momBadge}>
                <Ionicons name="star" size={14} color="#4EDEAF" />
                <Text style={styles.momText}>
                  Player of the Match: {match.manOfTheMatchName}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Toss Summary Banner */}
        <View style={styles.tossBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#00695C" />
          <Text style={styles.tossBannerText}>{match.toss || 'Match in progress'}</Text>
        </View>

        {activeTab === 'scorecard' && (
          <View style={styles.tabSection}>
            {/* Over Timeline Live Bar */}
            {match.status === 'live' && (
              <View style={styles.overTimelineBar}>
                <View style={styles.overMetaRow}>
                  <Text style={styles.overMetaTitle}>
                    Over {Math.floor(match.team2.overs) + 1} Live • {match.activeBowler.name}
                  </Text>
                  <Text style={styles.overRunsCount}>
                    {match.recentBalls.slice(-6).join(' • ') || 'Ready'}
                  </Text>
                </View>
                <RecentBallsRibbon balls={match.recentBalls} label="" size="sm" />
              </View>
            )}

            {/* Innings Selector Segment ([ AFG (1st Inn) ] [ IND (2nd Inn) ]) */}
            <View style={styles.inningsSwitchRow}>
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
            </View>

            {/* Batting Lineup (Emerald banner, Batter table, Extras, Total, Did not Bat) */}
            <BatsmanTable
              teamName={currentBattingTeamName}
              totalScore={`${battingScore}-${battingWickets} (${battingOvers.toFixed(1)} Ov)`}
              totalSummary={`${battingScore}-${battingWickets} (${battingOvers.toFixed(1)} Overs, RR: ${runRate})`}
              batting={currentBatters}
              extras={currentInningsData?.extras}
              didNotBat={didNotBatPlayers}
            />

            {/* Bowling Lineup (Bowler | O | M | R | W | NB | WD | ECO) */}
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
                {match.playingXI?.team1?.map((p) => p.name).join(', ') ||
                  `${match.activeBatters.striker.name}, ${match.activeBatters.nonStriker.name}, Top Order Batters, Spinners & Pace Bowlers`}
              </Text>
            </View>

            <View style={styles.lineupCard}>
              <Text style={styles.lineupTeamTitle}>{match.team2.name} Playing XI</Text>
              <Text style={styles.lineupPlayers}>
                {match.playingXI?.team2?.map((p) => p.name).join(', ') ||
                  `${match.activeBowler.name}, Opening Attack, Middle Order All-Rounders, Wicketkeeper`}
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
  shareHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainer,
  },
  adminScorerBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    gap: 12,
  },
  completedMatchBanner: {
    backgroundColor: 'rgba(255, 185, 95, 0.12)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 185, 95, 0.3)',
    gap: 6,
  },
  winnerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  winnerText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  momBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  momText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4EDEAF',
  },
  tossBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  tossBannerText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
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
    gap: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  inningsPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inningsPillActive: {
    backgroundColor: '#00796B',
  },
  inningsPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  inningsPillTextActive: {
    color: '#FFFFFF',
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
