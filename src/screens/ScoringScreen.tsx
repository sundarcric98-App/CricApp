import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../components/common/Header';
import ActiveBowlerCard from '../components/scoring/ActiveBowlerCard';
import CreasePairCard from '../components/scoring/CreasePairCard';
import ScoringKeypad from '../components/scoring/ScoringKeypad';
import Colors from '../constants/colors';
import { fetchMatchDetails, submitBallEvent } from '../store/matchSlice';
import {
  popUndoSnapshot,
  pushUndoSnapshot,
  setIsSubmitting,
  setShowBowlerModal,
  setShowWicketModal,
} from '../store/scoringSlice';
import { useAppDispatch, useAppSelector } from '../store/store';
import { BallType, WicketType } from '../types/cricket';

export const ScoringScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = (Array.isArray(id) ? id[0] : id) || 'match_blr_mum_01';

  const dispatch = useAppDispatch();
  const { currentMatch, scorecard } = useAppSelector((state) => state.matches);
  const { undoStack, showWicketModal, showBowlerModal, isSubmitting } = useAppSelector(
    (state) => state.scoring
  );

  const [selectedWicketType, setSelectedWicketType] = useState<WicketType>('caught');

  useEffect(() => {
    if (!currentMatch) {
      dispatch(fetchMatchDetails(matchId));
    }
  }, [dispatch, matchId, currentMatch]);

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

  const handleScoreBall = (
    ballType: BallType,
    runs: number,
    isExtra: boolean = false,
    isWicket: boolean = false,
    wicketType?: WicketType
  ) => {
    // 1. Snapshot current state for Undo
    if (scorecard) {
      dispatch(pushUndoSnapshot({ match, scorecard }));
    }

    // 2. Dispatch optimistic async thunk
    dispatch(setIsSubmitting(true));
    dispatch(
      submitBallEvent({
        matchId: match.id,
        payload: {
          matchId: match.id,
          ballType,
          runs,
          isExtra,
          isWicket,
          wicketType,
          strikerId: match.activeBatters.striker.playerId,
          nonStrikerId: match.activeBatters.nonStriker.playerId,
          bowlerId: match.activeBowler.playerId,
        },
      })
    ).finally(() => {
      dispatch(setIsSubmitting(false));
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      Alert.alert('Undo', 'No previous ball snapshots in current session.');
      return;
    }
    const previousSnapshot = undoStack[undoStack.length - 1];
    dispatch(popUndoSnapshot());

    // Restore match & scorecard from snapshot
    if (previousSnapshot) {
      dispatch({
        type: 'matches/handleRealtimeScoreUpdate',
        payload: { match: previousSnapshot.match },
      });
    }
  };

  const handleSwitchStrike = () => {
    const s = match.activeBatters.striker;
    const ns = match.activeBatters.nonStriker;

    const updatedMatch = {
      ...match,
      activeBatters: {
        striker: { ...ns, isStriker: true, isNonStriker: false },
        nonStriker: { ...s, isStriker: false, isNonStriker: true },
      },
    };

    dispatch({
      type: 'matches/handleRealtimeScoreUpdate',
      payload: { match: updatedMatch },
    });
  };

  const handleConfirmWicket = () => {
    dispatch(setShowWicketModal(false));
    handleScoreBall('wicket', 0, false, true, selectedWicketType);
  };

  const bowlersList = [
    { id: 'p_bumrah', name: 'J. Bumrah', figures: '3.2-0-28-2', econ: '8.40' },
    { id: 'p_coetzee', name: 'G. Coetzee', figures: '4.0-0-42-0', econ: '10.50' },
    { id: 'p_hardik', name: 'H. Pandya', figures: '4.0-0-35-0', econ: '8.75' },
    { id: 'p_chawla', name: 'P. Chawla', figures: '4.0-0-26-1', econ: '6.50' },
  ];

  const handleSelectBowler = (b: typeof bowlersList[0]) => {
    const updatedBowler = {
      ...match.activeBowler,
      playerId: b.id,
      name: b.name,
      shortName: b.name,
    };
    const updatedMatch = {
      ...match,
      activeBowler: updatedBowler,
    };
    dispatch({
      type: 'matches/handleRealtimeScoreUpdate',
      payload: { match: updatedMatch },
    });
    dispatch(setShowBowlerModal(false));
  };

  const isTeam1Batting = match.battingTeamId === match.team1.id;
  const battingTeam = isTeam1Batting ? match.team1 : match.team2;
  const progressPercent = Math.min(100, Math.round((battingTeam.overs / 20) * 100));

  return (
    <View style={styles.container}>
      <Header showBack title="Live Scorer" />

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Top Match Telemetry Banner */}
        <View style={styles.telemetryBanner}>
          <View style={styles.bannerTopRow}>
            <View style={styles.bannerBadge}>
              <View style={styles.livePulse} />
              <Text style={styles.bannerBadgeText}>Innings {match.currentInnings} Live</Text>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.targetText}>Target: {match.target || 179}</Text>
            </View>
            <View style={styles.adminPill}>
              <Text style={styles.adminPillText}>Admin Console</Text>
            </View>
          </View>

          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.matchTitleText}>{match.title}</Text>
              <Text style={styles.matchScoreText}>
                {battingTeam.score}/{battingTeam.wickets}
              </Text>
            </View>
            <View style={styles.oversCol}>
              <Text style={styles.oversBigText}>{battingTeam.overs.toFixed(1)}</Text>
              <Text style={styles.maxOversText}>/ 20.0 ov</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Active Batsmen Card */}
        <CreasePairCard
          striker={match.activeBatters.striker}
          nonStriker={match.activeBatters.nonStriker}
          onSwitchStrike={handleSwitchStrike}
        />

        {/* Active Bowler Card */}
        <ActiveBowlerCard
          bowler={match.activeBowler}
          onChangeBowler={() => dispatch(setShowBowlerModal(true))}
        />

        {/* Over Progression Ribbon */}
        <View style={styles.progressionCard}>
          <View style={styles.progressionHeader}>
            <Text style={styles.progressionTitle}>
              Over {Math.floor(battingTeam.overs) + 1} Progression
            </Text>
            <Text style={styles.progressionRuns}>
              {match.recentBalls.slice(-6).join(' • ')}
            </Text>
          </View>
        </View>

        {/* Scoring Keypad */}
        <ScoringKeypad
          onScoreBall={handleScoreBall}
          onUndo={handleUndo}
          onOpenWicketModal={() => dispatch(setShowWicketModal(true))}
          canUndo={undoStack.length > 0}
          disabled={isSubmitting}
        />
      </ScrollView>

      {/* Wicket Modal */}
      <Modal
        visible={showWicketModal}
        transparent
        animationType="fade"
        onRequestClose={() => dispatch(setShowWicketModal(false))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Dismissal Method</Text>
            <Text style={styles.modalSubtitle}>
              Select dismissal for {match.activeBatters.striker.name}:
            </Text>

            {(['caught', 'bowled', 'lbw', 'run_out', 'stumped'] as WicketType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.wicketOption,
                  selectedWicketType === type && styles.wicketOptionSelected,
                ]}
                onPress={() => setSelectedWicketType(type)}
              >
                <Text
                  style={[
                    styles.wicketOptionText,
                    selectedWicketType === type && styles.wicketOptionTextSelected,
                  ]}
                >
                  {type.toUpperCase().replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => dispatch(setShowWicketModal(false))}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmWicket}>
                <Text style={styles.modalConfirmText}>Confirm Wicket</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bowler Selection Modal */}
      <Modal
        visible={showBowlerModal}
        transparent
        animationType="fade"
        onRequestClose={() => dispatch(setShowBowlerModal(false))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Change Bowler</Text>
            <Text style={styles.modalSubtitle}>Select bowler for the next delivery:</Text>

            {bowlersList.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.bowlerOptionItem}
                onPress={() => handleSelectBowler(b)}
              >
                <View>
                  <Text style={styles.bowlerOptionName}>{b.name}</Text>
                  <Text style={styles.bowlerOptionFigures}>
                    {b.figures} • Econ {b.econ}
                  </Text>
                </View>
                <Text style={styles.selectText}>Select</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalCancelBtn, { marginTop: 12 }]}
              onPress={() => dispatch(setShowBowlerModal(false))}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 12,
    paddingBottom: 32,
    gap: 10,
  },
  telemetryBanner: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  bannerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  bulletDot: {
    fontSize: 10,
    color: Colors.outline,
  },
  targetText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  adminPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  adminPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  matchTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  matchScoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
  oversCol: {
    alignItems: 'flex-end',
  },
  oversBigText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  maxOversText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceContainer,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressionCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 12,
  },
  progressionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  progressionRuns: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  wicketOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 10,
  },
  wicketOptionSelected: {
    backgroundColor: Colors.errorContainer,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  wicketOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  wicketOptionTextSelected: {
    color: Colors.error,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  modalConfirmBtn: {
    flex: 1.5,
    paddingVertical: 10,
    backgroundColor: Colors.error,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.onError,
  },
  bowlerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainer,
    padding: 12,
    borderRadius: 10,
    marginVertical: 3,
  },
  bowlerOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  bowlerOptionFigures: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  selectText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
});

export default ScoringScreen;
