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
import { BallType, Player, PlayerBatting, PlayerBowling, WicketType } from '../types/cricket';
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
  const [showInningsBreakModal, setShowInningsBreakModal] = useState(false);
  const [showMatchFinishedModal, setShowMatchFinishedModal] = useState(false);
  const [customPlayerName, setCustomPlayerName] = useState('');
  const [customBowlerName, setCustomBowlerName] = useState('');
  const [chasingStrikerName, setChasingStrikerName] = useState('');
  const [chasingNonStrikerName, setChasingNonStrikerName] = useState('');
  const [chasingBowlerName, setChasingBowlerName] = useState('');
  const [selectedStrikerPlayer, setSelectedStrikerPlayer] = useState<{ id: string; name: string } | null>(null);
  const [selectedNonStrikerPlayer, setSelectedNonStrikerPlayer] = useState<{ id: string; name: string } | null>(null);
  const [selectedBowlerPlayer, setSelectedBowlerPlayer] = useState<{ id: string; name: string } | null>(null);
  const [team1Squad, setTeam1Squad] = useState<Player[]>([]);
  const [team2Squad, setTeam2Squad] = useState<Player[]>([]);
  const [manOfTheMatchName, setManOfTheMatchName] = useState('');
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');

  useEffect(() => {
    if (matchId) {
      dispatch(fetchMatchDetails(matchId));
    }
  }, [dispatch, matchId]);

  const match = currentMatch;

  const team1 = match?.team1 || {
    id: 'team_a',
    name: 'Team 1',
    shortName: 'TM1',
    score: 0,
    wickets: 0,
    overs: 0,
    maxOvers: 20,
  };
  const team2 = match?.team2 || {
    id: 'team_b',
    name: 'Team 2',
    shortName: 'TM2',
    score: 0,
    wickets: 0,
    overs: 0,
    maxOvers: 20,
  };

  const isTeam1Batting = match?.battingTeamId ? match.battingTeamId === team1.id : true;
  const battingTeam = isTeam1Batting ? team1 : team2;
  const bowlingTeam = isTeam1Batting ? team2 : team1;
  const activeBowlingTeamId = bowlingTeam?.id;
  const activeBowlingTeamName = bowlingTeam?.name || 'Bowling Team';

  const currentInn = match?.currentInnings === 2 ? scorecard?.innings2 : scorecard?.innings1;

  const striker: PlayerBatting =
    match?.activeBatters?.striker ||
    currentInn?.batting?.[0] || {
      playerId: `p_striker_${match?.id || 'default'}`,
      name: `${battingTeam.name} Opener 1`,
      shortName: 'Opener 1',
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isStriker: true,
      isNonStriker: false,
      isOut: false,
    };

  const nonStriker: PlayerBatting =
    match?.activeBatters?.nonStriker ||
    currentInn?.batting?.[1] || {
      playerId: `p_nonstriker_${match?.id || 'default'}`,
      name: `${battingTeam.name} Opener 2`,
      shortName: 'Opener 2',
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isStriker: false,
      isNonStriker: true,
      isOut: false,
    };

  const activeBowler: PlayerBowling =
    match?.activeBowler ||
    currentInn?.bowling?.find((b) => b && b.isCurrentBowler) ||
    currentInn?.bowling?.[0] || {
      playerId: `p_bowler_${match?.id || 'default'}`,
      name: `${bowlingTeam.name} Bowler 1`,
      shortName: 'Bowler 1',
      overs: 0,
      oversInBalls: 0,
      maidens: 0,
      runs: 0,
      wickets: 0,
      economy: 0,
      dots: 0,
      wides: 0,
      noBalls: 0,
      isCurrentBowler: true,
    };

  // Fetch squad players for both teams
  useEffect(() => {
    if (team1?.id && team1.id !== 'team_a') {
      cricketApi
        .getTeamById(team1.id)
        .then((res) => {
          setTeam1Squad(res.players || []);
        })
        .catch(() => setTeam1Squad([]));
    }
    if (team2?.id && team2.id !== 'team_b') {
      cricketApi
        .getTeamById(team2.id)
        .then((res) => {
          setTeam2Squad(res.players || []);
        })
        .catch(() => setTeam2Squad([]));
    }
  }, [team1?.id, team2?.id]);

  const bowlingSquad = isTeam1Batting ? team2Squad : team1Squad;

  // Dynamic bowlers list from current bowling team squad + current innings bowling stats
  const currentInningsBowling =
    match?.currentInnings === 2
      ? (scorecard?.innings2?.bowling || [])
      : (scorecard?.innings1?.bowling || []);

  const bowlingPlayingXI =
    isTeam1Batting ? (match?.playingXI?.team2 || []) : (match?.playingXI?.team1 || []);

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
        (b) => b && (b.playerId === p.id || b.name?.toLowerCase() === p.name?.toLowerCase())
      );
      const figures = existing
        ? `${(existing.overs || 0).toFixed(1)}-${existing.maidens || 0}-${existing.runs || 0}-${existing.wickets || 0}`
        : 'Yet to bowl';
      const econ =
        existing && existing.oversInBalls > 0
          ? (((existing.runs || 0) / existing.oversInBalls) * 6).toFixed(2)
          : (existing?.economy ? existing.economy.toFixed(2) : '0.00');

      list.push({
        id: p.id,
        name: p.name,
        figures,
        econ,
        isCurrentBowler:
          activeBowler.playerId === p.id ||
          activeBowler.name?.toLowerCase() === p.name?.toLowerCase(),
      });
    }

    // 2. Playing XI players of bowling team
    for (const p of bowlingPlayingXI) {
      if (p && !list.some((item) => item.id === p.id || item.name?.toLowerCase() === p.name?.toLowerCase())) {
        const existing = currentInningsBowling.find(
          (b) => b && (b.playerId === p.id || b.name?.toLowerCase() === p.name?.toLowerCase())
        );
        const figures = existing
          ? `${(existing.overs || 0).toFixed(1)}-${existing.maidens || 0}-${existing.runs || 0}-${existing.wickets || 0}`
          : 'Yet to bowl';
        const econ =
          existing && existing.oversInBalls > 0
            ? (((existing.runs || 0) / existing.oversInBalls) * 6).toFixed(2)
            : '0.00';

        list.push({
          id: p.id,
          name: p.name,
          figures,
          econ,
          isCurrentBowler: activeBowler.name?.toLowerCase() === p.name?.toLowerCase(),
        });
      }
    }

    // 3. Any bowler who has bowled in this innings
    for (const b of currentInningsBowling) {
      if (b && !list.some((item) => item.id === b.playerId || item.name?.toLowerCase() === b.name?.toLowerCase())) {
        list.push({
          id: b.playerId,
          name: b.name,
          figures: `${(b.overs || 0).toFixed(1)}-${b.maidens || 0}-${b.runs || 0}-${b.wickets || 0}`,
          econ: (b.economy || 0).toFixed(2),
          isCurrentBowler: activeBowler.name?.toLowerCase() === b.name?.toLowerCase(),
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
  }, [bowlingSquad, bowlingPlayingXI, currentInningsBowling, activeBowler]);

  // Squad and playing XI for 2nd innings lineup selection
  const chasingSquadRaw = isTeam1Batting ? team2Squad : team1Squad;
  const chasingPlayingXI = isTeam1Batting ? (match?.playingXI?.team2 || []) : (match?.playingXI?.team1 || []);

  const chasingTeamPlayers = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    for (const p of chasingSquadRaw) {
      if (p && p.name && !list.some((item) => item.id === p.id || item.name.toLowerCase() === p.name.toLowerCase())) {
        list.push({ id: p.id, name: p.name });
      }
    }
    for (const p of chasingPlayingXI) {
      if (p && p.name && !list.some((item) => item.id === p.id || item.name.toLowerCase() === p.name.toLowerCase())) {
        list.push({ id: p.id, name: p.name });
      }
    }
    if (list.length === 0) {
      list.push(
        { id: `c_p1_${Date.now()}`, name: `${bowlingTeam.name} Opener 1` },
        { id: `c_p2_${Date.now()}`, name: `${bowlingTeam.name} Opener 2` },
        { id: `c_p3_${Date.now()}`, name: `${bowlingTeam.name} Batter 3` },
        { id: `c_p4_${Date.now()}`, name: `${bowlingTeam.name} Batter 4` }
      );
    }
    return list;
  }, [chasingSquadRaw, chasingPlayingXI, bowlingTeam.name]);

  const defendingSquadRaw = isTeam1Batting ? team1Squad : team2Squad;
  const defendingPlayingXI = isTeam1Batting ? (match?.playingXI?.team1 || []) : (match?.playingXI?.team2 || []);

  const defendingTeamPlayers = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    for (const p of defendingSquadRaw) {
      if (p && p.name && !list.some((item) => item.id === p.id || item.name.toLowerCase() === p.name.toLowerCase())) {
        list.push({ id: p.id, name: p.name });
      }
    }
    for (const p of defendingPlayingXI) {
      if (p && p.name && !list.some((item) => item.id === p.id || item.name.toLowerCase() === p.name.toLowerCase())) {
        list.push({ id: p.id, name: p.name });
      }
    }
    if (list.length === 0) {
      list.push(
        { id: `d_p1_${Date.now()}`, name: `${battingTeam.name} Bowler 1` },
        { id: `d_p2_${Date.now()}`, name: `${battingTeam.name} Bowler 2` },
        { id: `d_p3_${Date.now()}`, name: `${battingTeam.name} Bowler 3` }
      );
    }
    return list;
  }, [defendingSquadRaw, defendingPlayingXI, battingTeam.name]);

  // Remaining squad players of current batting team who haven't batted in this innings
  const currentInningsBatting = match?.currentInnings === 2 ? (scorecard?.innings2?.batting || []) : (scorecard?.innings1?.batting || []);
  const activeBattingSquad = isTeam1Batting ? team1Squad : team2Squad;
  const activeBattingPlayingXI = isTeam1Batting ? (match?.playingXI?.team1 || []) : (match?.playingXI?.team2 || []);

  const availableNewBatsmen = useMemo(() => {
    const battedNames = currentInningsBatting.map((b) => b.name?.trim().toLowerCase());
    const battedIds = currentInningsBatting.map((b) => b.playerId);
    const list: { id: string; name: string }[] = [];

    for (const p of activeBattingSquad) {
      if (p && p.name && !battedNames.includes(p.name.trim().toLowerCase()) && !battedIds.includes(p.id)) {
        if (!list.some((item) => item.id === p.id || item.name.toLowerCase() === p.name.toLowerCase())) {
          list.push({ id: p.id, name: p.name });
        }
      }
    }

    for (const p of activeBattingPlayingXI) {
      if (p && p.name && !battedNames.includes(p.name.trim().toLowerCase()) && !battedIds.includes(p.id)) {
        if (!list.some((item) => item.id === p.id || item.name.toLowerCase() === p.name.toLowerCase())) {
          list.push({ id: p.id, name: p.name });
        }
      }
    }

    return list;
  }, [activeBattingSquad, activeBattingPlayingXI, currentInningsBatting]);

  // Pre-select opening batsmen and opening bowler when innings break modal opens
  useEffect(() => {
    if (showInningsBreakModal) {
      if (!selectedStrikerPlayer && chasingTeamPlayers.length > 0) {
        setSelectedStrikerPlayer(chasingTeamPlayers[0]);
      }
      if (!selectedNonStrikerPlayer && chasingTeamPlayers.length > 1) {
        setSelectedNonStrikerPlayer(chasingTeamPlayers[1]);
      } else if (!selectedNonStrikerPlayer && chasingTeamPlayers.length === 1) {
        setSelectedNonStrikerPlayer(chasingTeamPlayers[0]);
      }
      if (!selectedBowlerPlayer && defendingTeamPlayers.length > 0) {
        setSelectedBowlerPlayer(defendingTeamPlayers[0]);
      }
    }
  }, [showInningsBreakModal, chasingTeamPlayers, defendingTeamPlayers]);

  const handleScoreBall = (
    ballType: BallType,
    runs: number,
    isExtra: boolean = false,
    isWicket: boolean = false,
    wicketType?: WicketType
  ) => {
    if (!match) return;

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
          strikerId: striker.playerId,
          nonStrikerId: nonStriker.playerId,
          bowlerId: activeBowler.playerId,
        },
      })
    )
      .unwrap()
      .then((result: any) => {
        if (result?.match) {
          const updated = result.match;
          const activeBatting =
            updated.battingTeamId === updated.team1?.id ? updated.team1 : updated.team2;
          const legalBalls = oversToBalls(activeBatting?.overs || 0);
          const maxBalls = (activeBatting?.maxOvers || 20) * 6;

          const playersPerTeam = updated.playersPerTeam || 11;
          const allowSingleWicket = Boolean(updated.allowSingleWicket);
          const maxWickets = updated.maxWickets || (allowSingleWicket ? playersPerTeam : Math.max(1, playersPerTeam - 1));

          // 1. Check if match has concluded (target chased in 2nd inn or overs expired/all-out)
          if (updated.status === 'completed' || result?.isMatchFinished) {
            setTimeout(() => {
              setShowMatchFinishedModal(true);
            }, 400);
            return;
          }

          // 2. Check if 1st innings is finished (overs finished or all wickets down)
          if (
            updated.currentInnings === 1 &&
            (legalBalls >= maxBalls || (activeBatting?.wickets || 0) >= maxWickets || result?.isFirstInningsFinished)
          ) {
            setTimeout(() => {
              setShowInningsBreakModal(true);
            }, 400);
            return;
          }

          // 3. Once 6 legal balls bowled in the over, automatically show remaining players for change bowler
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
    if (!match) return;
    const s = striker;
    const ns = nonStriker;

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
    const activeBatting = isTeam1Batting ? team1 : team2;
    const playersPerTeam = match?.playersPerTeam || 11;
    const allowSingleWicket = Boolean(match?.allowSingleWicket);
    const maxWickets = match?.maxWickets || (allowSingleWicket ? playersPerTeam : Math.max(1, playersPerTeam - 1));
    const nextWickets = (activeBatting?.wickets || 0) + 1;

    handleScoreBall('wicket', 0, false, true, selectedWicketType);

    // Only prompt for new batsman if team is not all out after this wicket
    if (nextWickets < maxWickets) {
      setTimeout(() => {
        setShowNewBatsmanModal(true);
      }, 350);
    }
  };

  const handleAddNewBatsman = () => {
    if (!match) return;
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
    if (!match) return;
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

  const handleStartSecondInnings = () => {
    if (!match) return;
    const finalStrikerName =
      chasingStrikerName.trim() || selectedStrikerPlayer?.name || `${bowlingTeam.name} Opener 1`;
    const finalStrikerId = selectedStrikerPlayer?.id || `p_str2_${Date.now()}`;

    const finalNonStrikerName =
      chasingNonStrikerName.trim() || selectedNonStrikerPlayer?.name || `${bowlingTeam.name} Opener 2`;
    const finalNonStrikerId = selectedNonStrikerPlayer?.id || `p_nonstr2_${Date.now()}`;

    const finalBowlerName =
      chasingBowlerName.trim() || selectedBowlerPlayer?.name || `${battingTeam.name} Bowler 1`;
    const finalBowlerId = selectedBowlerPlayer?.id || `p_bowl2_${Date.now()}`;

    if (finalStrikerName.toLowerCase() === finalNonStrikerName.toLowerCase()) {
      Alert.alert('Invalid Selection', 'Striker and Non-Striker must be two different players.');
      return;
    }

    cricketApi
      .startSecondInnings(match.id, {
        strikerName: finalStrikerName,
        strikerId: finalStrikerId,
        nonStrikerName: finalNonStrikerName,
        nonStrikerId: finalNonStrikerId,
        bowlerName: finalBowlerName,
        bowlerId: finalBowlerId,
      })
      .then((res) => {
        dispatch({
          type: 'matches/handleRealtimeScoreUpdate',
          payload: { match: res.match },
        });
        dispatch(fetchMatchDetails(match.id));
        setShowInningsBreakModal(false);
        setChasingStrikerName('');
        setChasingNonStrikerName('');
        setChasingBowlerName('');
        setSelectedStrikerPlayer(null);
        setSelectedNonStrikerPlayer(null);
        setSelectedBowlerPlayer(null);
        Alert.alert(
          '2nd Innings Underway! 🏏',
          `${res.match.battingTeamId === res.match.team1.id ? res.match.team1.name : res.match.team2.name} need ${res.match.target} runs to win.`
        );
      })
      .catch((err) => {
        Alert.alert('Error', err.message || 'Failed to start 2nd innings');
      });
  };

  const handleCompleteMatch = async () => {
    if (!match) return;
    const winnerId = selectedWinnerId || team1.id;
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

  const handleSelectBowler = (b: { id: string; name: string }) => {
    if (!match) return;
    cricketApi.changeBowler(match.id, b.name, b.id).then((updated) => {
      dispatch({
        type: 'matches/handleRealtimeScoreUpdate',
        payload: { match: updated },
      });
      dispatch(setShowBowlerModal(false));
    });
  };

  const handleAddCustomBowler = () => {
    if (!match) return;
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

  if (!match) {
    return (
      <View style={styles.container}>
        <Header showBack title="Live Scoring Console" onBackPress={() => router.replace('/(tabs)' as any)} />
        <View style={styles.centerBox}>
          {loading ? (
            <>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>
                Loading scoring console...
              </Text>
            </>
          ) : (
            <EmptyState
              title="Match Ready"
              description="Initializing match scoring console..."
              actionLabel="Return to Matches"
              onAction={() => router.replace('/(tabs)' as any)}
            />
          )}
        </View>
      </View>
    );
  }

  const maxOvers = battingTeam?.maxOvers || 20;
  const currentOvers = typeof battingTeam?.overs === 'number' ? battingTeam.overs : 0;
  const progressPercent = Math.min(100, Math.round((currentOvers / maxOvers) * 100));

  return (
    <View style={styles.container}>
      <Header
        showBack
        title="Live Scoring Console"
        onBackPress={() => router.back()}
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
              <Text style={styles.bannerBadgeText}>Innings {match.currentInnings || 1} Live</Text>
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
                {battingTeam.score ?? 0}/{battingTeam.wickets ?? 0}
              </Text>
              <Text style={styles.crrText}>
                CRR: {typeof match.crr === 'number' ? match.crr.toFixed(2) : '0.00'}
                {match.target ? ` • Target: ${match.target}` : ''}
              </Text>
            </View>
            <View style={styles.oversCol}>
              <Text style={styles.oversBigText}>{currentOvers.toFixed(1)}</Text>
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
          striker={striker}
          nonStriker={nonStriker}
          onSwitchStrike={handleSwitchStrike}
        />

        {/* Active Bowler Card */}
        <ActiveBowlerCard
          bowler={activeBowler}
          onChangeBowler={() => dispatch(setShowBowlerModal(true))}
        />

        {/* Over Progression Ribbon */}
        <View style={styles.progressionCard}>
          <View style={styles.progressionHeader}>
            <Text style={styles.progressionTitle}>
              Over {Math.floor(currentOvers) + 1} Progression
            </Text>
            <Text style={styles.progressionRuns}>
              {Array.isArray(match.recentBalls) && match.recentBalls.length > 0
                ? match.recentBalls.slice(-6).join(' • ')
                : 'Ready'}
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
              Select dismissal for {striker.name}:
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
          <View style={[styles.modalBox, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Select New Batsman</Text>
            <Text style={styles.modalSubtitle}>
              {battingTeam.name} Squad ({availableNewBatsmen.length} Available):
            </Text>

            {availableNewBatsmen.length > 0 ? (
              <View style={[styles.playerChipsContainer, { marginVertical: 6 }]}>
                {availableNewBatsmen.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.playerChip}
                    onPress={() => {
                      cricketApi.selectNewBatsman(match.id, p.name).then((updated) => {
                        dispatch({
                          type: 'matches/handleRealtimeScoreUpdate',
                          payload: { match: updated },
                        });
                        setShowNewBatsmanModal(false);
                      });
                    }}
                  >
                    <Ionicons name="person-outline" size={13} color="#CBD5E1" />
                    <Text style={styles.playerChipText}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <Text style={[styles.modalSubtitle, { marginTop: 6 }]}>Or Enter Custom Name:</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="e.g. Next Batter Name"
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
                  Striker: {striker.name}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.retireSelectBtn}
                onPress={() => handleRetireConfirm(false)}
              >
                <Text style={styles.retireSelectText}>
                  Non-Striker: {nonStriker.name}
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
                  (selectedWinnerId === team1.id || !selectedWinnerId) &&
                    styles.wicketOptionSelected,
                ]}
                onPress={() => setSelectedWinnerId(team1.id)}
              >
                <Text style={styles.wicketOptionText}>{team1.name} Won</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.wicketOption,
                  selectedWinnerId === team2.id && styles.wicketOptionSelected,
                ]}
                onPress={() => setSelectedWinnerId(team2.id)}
              >
                <Text style={styles.wicketOptionText}>{team2.name} Won</Text>
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

      {/* Innings Break Modal */}
      <Modal
        visible={showInningsBreakModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              {
                maxHeight: '90%',
                maxWidth: 400,
                borderColor: 'rgba(212, 175, 55, 0.4)',
                borderWidth: 1.5,
                padding: 16,
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingBottom: 6 }}
            >
              <View style={styles.inningsBreakIconWrap}>
                <Ionicons name="flag" size={26} color="#D4AF37" />
              </View>
              <Text
                style={[
                  styles.modalTitle,
                  { textAlign: 'center', fontSize: 18, color: '#FFFFFF' },
                ]}
              >
                1st Innings Completed!
              </Text>
              <Text
                style={[styles.modalSubtitle, { textAlign: 'center', color: '#94A3B8' }]}
              >
                {battingTeam.name} posted {battingTeam.score}/{battingTeam.wickets} in {battingTeam.overs} overs
              </Text>

              <View style={styles.targetBannerBox}>
                <Text style={styles.targetBannerLabel}>TARGET FOR 2ND INNINGS</Text>
                <Text style={styles.targetBannerScore}>
                  {match?.target || battingTeam.score + 1} RUNS
                </Text>
                <Text style={styles.targetBannerEquation}>
                  {bowlingTeam.name} need {match?.target || battingTeam.score + 1} runs from{' '}
                  {bowlingTeam.maxOvers || battingTeam.maxOvers || 20} overs
                </Text>
              </View>

              {/* 1. Striker (Chasing Team) */}
              <View style={styles.lineupSectionCard}>
                <View style={styles.lineupSectionHeader}>
                  <View style={styles.roleTagBatting}>
                    <Ionicons name="flash" size={12} color="#4EDEAA" />
                    <Text style={styles.roleTagText}>STRIKER (OPENER 1)</Text>
                  </View>
                  <Text style={styles.teamTagText}>{bowlingTeam.name}</Text>
                </View>
                <Text style={styles.selectLabelHint}>
                  Select batting opener from {bowlingTeam.name}:
                </Text>

                <View style={styles.playerChipsContainer}>
                  {chasingTeamPlayers.map((p) => {
                    const isSelected =
                      (selectedStrikerPlayer?.id === p.id ||
                        selectedStrikerPlayer?.name === p.name) &&
                      !chasingStrikerName;
                    return (
                      <TouchableOpacity
                        key={`striker_${p.id}`}
                        style={[
                          styles.playerChip,
                          isSelected && styles.playerChipActive,
                        ]}
                        onPress={() => {
                          setSelectedStrikerPlayer({ id: p.id, name: p.name });
                          setChasingStrikerName('');
                        }}
                      >
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'person-outline'}
                          size={13}
                          color={isSelected ? '#0F1117' : '#CBD5E1'}
                        />
                        <Text
                          style={[
                            styles.playerChipText,
                            isSelected && styles.playerChipTextActive,
                          ]}
                        >
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  style={[
                    styles.modalTextInputCompact,
                    chasingStrikerName ? styles.modalTextInputActive : null,
                  ]}
                  placeholder="Or type custom striker name"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={chasingStrikerName}
                  onChangeText={(text) => {
                    setChasingStrikerName(text);
                    if (text) setSelectedStrikerPlayer(null);
                  }}
                />
              </View>

              {/* 2. Non-Striker (Chasing Team) */}
              <View style={styles.lineupSectionCard}>
                <View style={styles.lineupSectionHeader}>
                  <View style={styles.roleTagBatting}>
                    <Ionicons name="shield-checkmark" size={12} color="#4EDEAA" />
                    <Text style={styles.roleTagText}>NON-STRIKER (OPENER 2)</Text>
                  </View>
                  <Text style={styles.teamTagText}>{bowlingTeam.name}</Text>
                </View>
                <Text style={styles.selectLabelHint}>
                  Select partner batsman from {bowlingTeam.name}:
                </Text>

                <View style={styles.playerChipsContainer}>
                  {chasingTeamPlayers.map((p) => {
                    const isStrikerSelected =
                      (selectedStrikerPlayer?.id === p.id ||
                        selectedStrikerPlayer?.name === p.name) &&
                      !chasingStrikerName;
                    const isSelected =
                      (selectedNonStrikerPlayer?.id === p.id ||
                        selectedNonStrikerPlayer?.name === p.name) &&
                      !chasingNonStrikerName;
                    return (
                      <TouchableOpacity
                        key={`nonstriker_${p.id}`}
                        disabled={isStrikerSelected}
                        style={[
                          styles.playerChip,
                          isSelected && styles.playerChipActiveSecondary,
                          isStrikerSelected && {
                            opacity: 0.35,
                            backgroundColor: 'rgba(255,255,255,0.02)',
                          },
                        ]}
                        onPress={() => {
                          setSelectedNonStrikerPlayer({ id: p.id, name: p.name });
                          setChasingNonStrikerName('');
                        }}
                      >
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'person-outline'}
                          size={13}
                          color={isSelected ? '#0F1117' : '#CBD5E1'}
                        />
                        <Text
                          style={[
                            styles.playerChipText,
                            isSelected && styles.playerChipTextActive,
                          ]}
                        >
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  style={[
                    styles.modalTextInputCompact,
                    chasingNonStrikerName ? styles.modalTextInputActive : null,
                  ]}
                  placeholder="Or type custom non-striker name"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={chasingNonStrikerName}
                  onChangeText={(text) => {
                    setChasingNonStrikerName(text);
                    if (text) setSelectedNonStrikerPlayer(null);
                  }}
                />
              </View>

              {/* 3. Opening Bowler (Defending Team) */}
              <View style={styles.lineupSectionCard}>
                <View style={styles.lineupSectionHeader}>
                  <View style={styles.roleTagBowling}>
                    <Ionicons name="baseball" size={12} color="#FFB95F" />
                    <Text style={[styles.roleTagText, { color: '#FFB95F' }]}>
                      OPENING BOWLER
                    </Text>
                  </View>
                  <Text style={styles.teamTagText}>{battingTeam.name}</Text>
                </View>
                <Text style={styles.selectLabelHint}>
                  Select opening bowler from {battingTeam.name}:
                </Text>

                <View style={styles.playerChipsContainer}>
                  {defendingTeamPlayers.map((p) => {
                    const isSelected =
                      (selectedBowlerPlayer?.id === p.id ||
                        selectedBowlerPlayer?.name === p.name) &&
                      !chasingBowlerName;
                    return (
                      <TouchableOpacity
                        key={`bowler_${p.id}`}
                        style={[
                          styles.playerChip,
                          isSelected && styles.playerChipActiveBowler,
                        ]}
                        onPress={() => {
                          setSelectedBowlerPlayer({ id: p.id, name: p.name });
                          setChasingBowlerName('');
                        }}
                      >
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'baseball-outline'}
                          size={13}
                          color={isSelected ? '#0F1117' : '#CBD5E1'}
                        />
                        <Text
                          style={[
                            styles.playerChipText,
                            isSelected && styles.playerChipTextActive,
                          ]}
                        >
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  style={[
                    styles.modalTextInputCompact,
                    chasingBowlerName ? styles.modalTextInputActive : null,
                  ]}
                  placeholder="Or type custom bowler name"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={chasingBowlerName}
                  onChangeText={(text) => {
                    setChasingBowlerName(text);
                    if (text) setSelectedBowlerPlayer(null);
                  }}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.modalActionConfirmBtn,
                  {
                    marginTop: 4,
                    paddingVertical: 14,
                    backgroundColor: Colors.primary,
                  },
                ]}
                onPress={handleStartSecondInnings}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modalActionConfirmText,
                    { fontSize: 14, color: '#0F1117', fontWeight: '900' },
                  ]}
                >
                  START 2ND INNINGS 🏏
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Match Concluded Modal */}
      <Modal
        visible={showMatchFinishedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMatchFinishedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { borderColor: 'rgba(78, 222, 163, 0.4)', borderWidth: 1.5 }]}>
            <View style={[styles.inningsBreakIconWrap, { backgroundColor: 'rgba(78, 222, 163, 0.15)' }]}>
              <Ionicons name="trophy" size={32} color={Colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center', fontSize: 19, color: '#FFFFFF' }]}>
              Match Concluded!
            </Text>
            <Text style={[styles.resultBannerText, { textAlign: 'center' }]}>
              {match?.result || 'Match Completed'}
            </Text>

            <View style={styles.scoreSummaryBox}>
              <View style={styles.scoreSummaryRow}>
                <Text style={styles.summaryTeamName}>{team1.name}</Text>
                <Text style={styles.summaryScore}>
                  {team1.score}/{team1.wickets} ({team1.overs} ov)
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.scoreSummaryRow}>
                <Text style={styles.summaryTeamName}>{team2.name}</Text>
                <Text style={styles.summaryScore}>
                  {team2.score}/{team2.wickets} ({team2.overs} ov)
                </Text>
              </View>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowMatchFinishedModal(false);
                  router.replace('/(tabs)/matches' as any);
                }}
              >
                <Text style={styles.modalCancelText}>Matches</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionConfirmBtn}
                onPress={() => {
                  setShowMatchFinishedModal(false);
                  router.replace(`/match/${match?.id}` as any);
                }}
              >
                <Text style={styles.modalActionConfirmText}>View Scorecard</Text>
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
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
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
  // Innings Break Modal Extra Styles
  inningsBreakIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  targetBannerBox: {
    backgroundColor: '#0F1117',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginVertical: 4,
    gap: 3,
  },
  targetBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.8,
  },
  targetBannerScore: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  targetBannerEquation: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalSectionSubhead: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    textTransform: 'uppercase',
  },
  resultBannerText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 8,
  },
  scoreSummaryBox: {
    backgroundColor: '#0F1117',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  scoreSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTeamName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  summaryScore: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  lineupSectionCard: {
    backgroundColor: '#0F1117',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  lineupSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleTagBatting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagBowling: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 185, 95, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4EDEAA',
    letterSpacing: 0.5,
  },
  teamTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  selectLabelHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  playerChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 2,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  playerChipActive: {
    backgroundColor: '#4EDEAA',
    borderColor: '#4EDEAA',
  },
  playerChipActiveSecondary: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  playerChipActiveBowler: {
    backgroundColor: '#FFB95F',
    borderColor: '#FFB95F',
  },
  playerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  playerChipTextActive: {
    color: '#0F1117',
    fontWeight: '800',
  },
  modalTextInputCompact: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: Colors.onSurface,
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 2,
  },
  modalTextInputActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(78, 222, 163, 0.05)',
  },
});

export default ScoringScreen;
