import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import EmptyState from '../components/common/EmptyState';
import Header from '../components/common/Header';
import ActiveBowlerCard from '../components/scoring/ActiveBowlerCard';
import CreasePairCard from '../components/scoring/CreasePairCard';
import ScoringKeypad from '../components/scoring/ScoringKeypad';
import Colors from '../constants/colors';
import cricketApi from '../services/api';
import { fetchMatchDetails, submitBallEvent } from '../store/matchSlice';
import {
  popUndoSnapshot,
  pushUndoSnapshot,
  setIsSubmitting,
  setShowBowlerModal,
  setShowWicketModal,
} from '../store/scoringSlice';
import { useAppDispatch, useAppSelector } from '../store/store';
import { BallType, Player, WicketType } from '../types/cricket';
import { oversToBalls } from '../utils/cricketRules';

export const ScoringScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Array.isArray(id) ? id[0] : id;

  const dispatch = useAppDispatch();
  const { currentMatch, scorecard, loading } = useAppSelector((state) => state.matches);
  const { undoStack, showWicketModal, showBowlerModal, isSubmitting } = useAppSelector(
    (state) => state.scoring
  );

  const [selectedWicketType, setSelectedWicketType] = useState<WicketType>('caught');
  const [showNewBatsmanModal, setShowNewBatsmanModal] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);
  const [customPlayerName, setCustomPlayerName] = useState('');
  const [customBowlerName, setCustomBowlerName] = useState('');
  const [bowlingSquad, setBowlingSquad] = useState<Player[]>([]);
  const [manOfTheMatchName, setManOfTheMatchName] = useState('');
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');

  useEffect(() => {
    if (matchId) {
      dispatch(fetchMatchDetails(matchId));
    }
  }, [dispatch, matchId]);

  if (!currentMatch) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Header showBack title="Live Scoring" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          {loading ? (
            <>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={{ color: Colors.onSurfaceVariant, marginTop: 12 }}>
                Loading scoring console...
              </Text>
            </>
          ) : (
            <EmptyState
              title="Match Not Found"
              description="Please select or create an active match to start live scoring."
              actionLabel="Back to Matches"
              onAction={() => router.replace('/(tabs)' as any)}
            />
          )}
        </View>
      </View>
    );
  }

  const match = currentMatch;

  const isTeam1Batting = match.battingTeamId === match.team1.id;
  const battingTeam = isTeam1Batting ? match.team1 : match.team2;
  const bowlingTeam = isTeam1Batting ? match.team2 : match.team1;
  const activeBowlingTeamId = bowlingTeam.id;
  const activeBowlingTeamName = bowlingTeam.name;

  // Fetch current bowling team players
  useEffect(() => {
    if (activeBowlingTeamId) {
      cricketApi
        .getTeamById(activeBowlingTeamId)
        .then((res) => {
          setBowlingSquad(res.players || []);
        })
        .catch(() => setBowlingSquad([]));
    }
  }, [activeBowlingTeamId]);

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
    )
      .unwrap()
      .then((result: any) => {
        if (result?.match) {
          const updated = result.match;
          const activeBatting =
            updated.battingTeamId === updated.team1.id ? updated.team1 : updated.team2;
          const legalBalls = oversToBalls(activeBatting.overs);
          const maxBalls = (activeBatting.maxOvers || 20) * 6;

          // Once 6 legal balls bowled in the over, automatically show remaining players for change bowler
          if (
            legalBalls > 0 &&
            legalBalls % 6 === 0 &&
            legalBalls < maxBalls &&
            updated.status === 'live'
          ) {
            setTimeout(() => {
              dispatch(setShowBowlerModal(true));
            }, 350);
          }
        }
      })
      .catch((err) => {
        console.warn('submitBallEvent error:', err);
      })
      .finally(() => {
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

  const handleEndOver = () => {
    Alert.alert(
      'End Over',
      'Do you want to switch bowler and rotate striker for the new over?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Change Bowler',
          onPress: () => {
            handleSwitchStrike();
            dispatch(setShowBowlerModal(true));
          },
        },
      ]
    );
  };

  const handleConfirmWicket = () => {
    dispatch(setShowWicketModal(false));
    handleScoreBall('wicket', 0, false, true, selectedWicketType);
    setShowNewBatsmanModal(true);
  };

  const handleAddNewBatsman = () => {
    if (!customPlayerName.trim()) {
      Alert.alert('Required', 'Please enter player name.');
      return;
    }
    cricketApi.selectNewBatsman(match.id, customPlayerName.trim()).then((updated) => {
      dispatch({
        type: 'matches/handleRealtimeScoreUpdate',
        payload: { match: updated },
      });
      setCustomPlayerName('');
      setShowNewBatsmanModal(false);
    });
  };

  const handleRetireConfirm = (isStriker: boolean) => {
    if (!customPlayerName.trim()) {
      Alert.alert('Required', 'Please enter new batsman name.');
      return;
    }
    cricketApi.retireBatsman(match.id, isStriker, customPlayerName.trim()).then((updated) => {
      dispatch({
        type: 'matches/handleRealtimeScoreUpdate',
        payload: { match: updated },
      });
      setCustomPlayerName('');
      setShowRetireModal(false);
    });
  };

  const handleCompleteMatch = async () => {
    const winnerId = selectedWinnerId || match.team1.id;
    try {
      const updated = await cricketApi.completeMatch(
        match.id,
        winnerId,
        manOfTheMatchName || undefined
      );
      dispatch({
        type: 'matches/handleRealtimeScoreUpdate',
        payload: { match: updated },
      });
      setShowEndMatchModal(false);
      Alert.alert('Match Completed!', 'Match result & points have been updated.', [
        {
          text: 'View Match Summary',
          onPress: () => router.replace(`/match/${match.id}` as any),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to complete match');
    }
  };

  // Dynamic bowlers list from current bowling team squad + current innings bowling stats
  const currentInningsBowling =
    match.currentInnings === 2
      ? (scorecard?.innings2?.bowling || [])
      : (scorecard?.innings1?.bowling || []);

  const bowlingPlayingXI =
    isTeam1Batting ? (match.playingXI?.team2 || []) : (match.playingXI?.team1 || []);

  const bowlersList = useMemo(() => {
    const list: {
      id: string;
      name: string;
      figures: string;
      econ: string;
      isCurrentBowler: boolean;
    }[] = [];

    // 1. Squad players of current bowling team
    for (const p of bowlingSquad) {
      const existing = currentInningsBowling.find(
        (b) => b.playerId === p.id || b.name.toLowerCase() === p.name.toLowerCase()
      );
      const figures = existing
        ? `${existing.overs.toFixed(1)}-${existing.maidens || 0}-${existing.runs}-${existing.wickets}`
        : 'Yet to bowl';
      const econ =
        existing && existing.oversInBalls > 0
          ? ((existing.runs / existing.oversInBalls) * 6).toFixed(2)
          : (existing?.economy ? existing.economy.toFixed(2) : '0.00');

      list.push({
        id: p.id,
        name: p.name,
        figures,
        econ,
        isCurrentBowler:
          match.activeBowler.playerId === p.id ||
          match.activeBowler.name.toLowerCase() === p.name.toLowerCase(),
      });
    }

    // 2. Playing XI players of bowling team
    for (const p of bowlingPlayingXI) {
      if (!list.some((item) => item.id === p.id || item.name.toLowerCase() === p.name.toLowerCase())) {
        const existing = currentInningsBowling.find(
          (b) => b.playerId === p.id || b.name.toLowerCase() === p.name.toLowerCase()
        );
        const figures = existing
          ? `${existing.overs.toFixed(1)}-${existing.maidens || 0}-${existing.runs}-${existing.wickets}`
          : 'Yet to bowl';
        const econ =
          existing && existing.oversInBalls > 0
            ? ((existing.runs / existing.oversInBalls) * 6).toFixed(2)
            : '0.00';

        list.push({
          id: p.id,
          name: p.name,
          figures,
          econ,
          isCurrentBowler: match.activeBowler.name.toLowerCase() === p.name.toLowerCase(),
        });
      }
    }

    // 3. Any bowler who has bowled in this innings
    for (const b of currentInningsBowling) {
      if (!list.some((item) => item.id === b.playerId || item.name.toLowerCase() === b.name.toLowerCase())) {
        list.push({
          id: b.playerId,
          name: b.name,
          figures: `${b.overs.toFixed(1)}-${b.maidens || 0}-${b.runs}-${b.wickets}`,
          econ: b.economy.toFixed(2),
          isCurrentBowler: match.activeBowler.name.toLowerCase() === b.name.toLowerCase(),
        });
      }
    }

    // Fallback if no squad players registered yet
    if (list.length === 0) {
      const defaultNames = ['Bowler 1', 'Bowler 2', 'Bowler 3', 'Bowler 4'];
      defaultNames.forEach((n, idx) => {
        list.push({
          id: `sample_bowler_${idx}`,
          name: n,
          figures: 'Yet to bowl',
          econ: '0.00',
          isCurrentBowler: idx === 0,
        });
      });
    }

    return list;
  }, [bowlingSquad, bowlingPlayingXI, currentInningsBowling, match.activeBowler]);

  const handleSelectBowler = (b: { id: string; name: string }) => {
    cricketApi.changeBowler(match.id, b.name, b.id).then((updated) => {
      dispatch({
        type: 'matches/handleRealtimeScoreUpdate',
        payload: { match: updated },
      });
      dispatch(setShowBowlerModal(false));
    });
  };

  const handleAddCustomBowler = () => {
    if (!customBowlerName.trim()) {
      Alert.alert('Required', 'Please enter bowler name.');
      return;
    }
    const newId = `bowler_${Date.now()}`;
    cricketApi.changeBowler(match.id, customBowlerName.trim(), newId).then((updated) => {
      dispatch({
        type: 'matches/handleRealtimeScoreUpdate',
        payload: { match: updated },
      });
      setCustomBowlerName('');
      dispatch(setShowBowlerModal(false));
    });
  };

  const maxOvers = battingTeam.maxOvers || 20;
  const progressPercent = Math.min(100, Math.round((battingTeam.overs / maxOvers) * 100));

  return (
    <View style={styles.container}>
      <Header
        showBack
        title="Live Scoring Console"
        rightAction={
          <TouchableOpacity
            style={styles.endMatchHeaderBtn}
            onPress={() => setShowEndMatchModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.endMatchHeaderBtnText}>END MATCH</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Top Match Telemetry Banner */}
        <View style={styles.telemetryBanner}>
          <View style={styles.bannerTopRow}>
            <View style={styles.bannerBadge}>
              <View style={styles.livePulse} />
              <Text style={styles.bannerBadgeText}>Innings {match.currentInnings} Live</Text>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.targetText}>
                {match.toss || 'Live Scorer Console'}
              </Text>
            </View>
            <View style={styles.adminPill}>
              <Text style={styles.adminPillText}>Live Scoring</Text>
            </View>
          </View>

          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.matchTitleText}>{match.title}</Text>
              <Text style={styles.matchScoreText}>
                {battingTeam.score}/{battingTeam.wickets}
              </Text>
              <Text style={styles.crrText}>
                CRR: {match.crr ? match.crr.toFixed(2) : '0.00'}
                {match.target ? ` • Target: ${match.target}` : ''}
              </Text>
            </View>
            <View style={styles.oversCol}>
              <Text style={styles.oversBigText}>{battingTeam.overs.toFixed(1)}</Text>
              <Text style={styles.maxOversText}>/ {maxOvers}.0 ov</Text>
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
              {match.recentBalls.length > 0 ? match.recentBalls.slice(-6).join(' • ') : 'Ready'}
            </Text>
          </View>
        </View>

        {/* Full Scoring Keypad */}
        <ScoringKeypad
          onScoreBall={handleScoreBall}
          onUndo={handleUndo}
          onOpenWicketModal={() => dispatch(setShowWicketModal(true))}
          onSwapStrike={handleSwitchStrike}
          onEndOver={handleEndOver}
          onRetireBatsman={() => setShowRetireModal(true)}
          onSelectNewBatsman={() => setShowNewBatsmanModal(true)}
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

            {(
              [
                'bowled',
                'caught',
                'run_out',
                'lbw',
                'stumped',
                'hit_wicket',
                'retired_hurt',
              ] as WicketType[]
            ).map((type) => (
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
                <Text style={styles.modalConfirmText}>Confirm Dismissal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New Batsman Modal */}
      <Modal
        visible={showNewBatsmanModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewBatsmanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select New Batsman</Text>
            <Text style={styles.modalSubtitle}>Enter incoming batsman name:</Text>

            <TextInput
              style={styles.modalTextInput}
              placeholder="e.g. Virat Kohli"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={customPlayerName}
              onChangeText={setCustomPlayerName}
              autoFocus
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowNewBatsmanModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalActionConfirmBtn} onPress={handleAddNewBatsman}>
                <Text style={styles.modalActionConfirmText}>Set Striker</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Retire Batsman Modal */}
      <Modal
        visible={showRetireModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRetireModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Retire Batsman</Text>
            <Text style={styles.modalSubtitle}>Who is retiring hurt/out?</Text>

            <View style={{ gap: 8 }}>
              <TouchableOpacity
                style={styles.retireSelectBtn}
                onPress={() => handleRetireConfirm(true)}
              >
                <Text style={styles.retireSelectText}>
                  Striker: {match.activeBatters.striker.name}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.retireSelectBtn}
                onPress={() => handleRetireConfirm(false)}
              >
                <Text style={styles.retireSelectText}>
                  Non-Striker: {match.activeBatters.nonStriker.name}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.modalTextInput, { marginTop: 8 }]}
              placeholder="Replacement Batsman Name"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={customPlayerName}
              onChangeText={setCustomPlayerName}
            />

            <TouchableOpacity
              style={[styles.modalCancelBtn, { marginTop: 10 }]}
              onPress={() => setShowRetireModal(false)}
            >
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Bowler Modal */}
      <Modal
        visible={showBowlerModal}
        transparent
        animationType="fade"
        onRequestClose={() => dispatch(setShowBowlerModal(false))}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '85%' }]}>
            <Text style={styles.modalTitle}>Change Active Bowler</Text>
            <Text style={styles.modalSubtitle}>
              {activeBowlingTeamName} Squad ({bowlersList.length} Available):
            </Text>

            <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={true}>
              {bowlersList.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.bowlerOptionItem,
                    b.isCurrentBowler && { opacity: 0.6, borderColor: 'rgba(255, 185, 95, 0.4)' },
                  ]}
                  onPress={() => handleSelectBowler(b)}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.bowlerOptionName}>{b.name}</Text>
                      {b.isCurrentBowler && (
                        <View style={{ backgroundColor: 'rgba(255, 185, 95, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFB95F' }}>Just Bowled</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.bowlerOptionFigures}>
                      {b.figures} • Econ {b.econ}
                    </Text>
                  </View>
                  <Text style={styles.selectText}>Select</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Custom Bowler Name Field */}
            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)', paddingTop: 10 }}>
              <Text style={[styles.modalSubtitle, { marginBottom: 6 }]}>Or Add New Bowler:</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.modalTextInput, { flex: 1 }]}
                  placeholder="Enter bowler name"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={customBowlerName}
                  onChangeText={setCustomBowlerName}
                />
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { paddingHorizontal: 16, backgroundColor: Colors.primary }]}
                  onPress={handleAddCustomBowler}
                >
                  <Text style={styles.modalConfirmText}>Set</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalCancelBtn, { marginTop: 12 }]}
              onPress={() => dispatch(setShowBowlerModal(false))}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* End Match Modal */}
      <Modal
        visible={showEndMatchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEndMatchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Conclude Match</Text>
            <Text style={styles.modalSubtitle}>Select winner team and Man of the Match:</Text>

            <View style={{ gap: 8, marginVertical: 6 }}>
              <TouchableOpacity
                style={[
                  styles.wicketOption,
                  (selectedWinnerId === match.team1.id || !selectedWinnerId) &&
                    styles.wicketOptionSelected,
                ]}
                onPress={() => setSelectedWinnerId(match.team1.id)}
              >
                <Text style={styles.wicketOptionText}>{match.team1.name} Won</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.wicketOption,
                  selectedWinnerId === match.team2.id && styles.wicketOptionSelected,
                ]}
                onPress={() => setSelectedWinnerId(match.team2.id)}
              >
                <Text style={styles.wicketOptionText}>{match.team2.name} Won</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalTextInput}
              placeholder="Man of the Match Player Name"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={manOfTheMatchName}
              onChangeText={setManOfTheMatchName}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEndMatchModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionConfirmBtn}
                onPress={handleCompleteMatch}
              >
                <Text style={styles.modalActionConfirmText}>Finish Match</Text>
              </TouchableOpacity>
            </View>
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
  endMatchHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  endMatchHeaderBtnText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
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
    flex: 1,
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
    flexShrink: 1,
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
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  matchScoreText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 2,
  },
  crrText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
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
    gap: 8,
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
  modalTextInput: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 10,
    padding: 12,
    color: Colors.onSurface,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  retireSelectBtn: {
    padding: 12,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 10,
  },
  retireSelectText: {
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 13,
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
  modalActionConfirmBtn: {
    flex: 1.5,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalActionConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.onPrimary,
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
