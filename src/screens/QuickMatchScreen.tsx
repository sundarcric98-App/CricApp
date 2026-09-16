import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/colors';
import cricketApi from '../services/api';
import { fetchMatches } from '../store/matchSlice';
import { useAppDispatch, useAppSelector } from '../store/store';
import { PlayerRole, PlayingXIPlayer } from '../types/cricket';

const QUICK_OVERS = [2, 5, 10, 15, 20];
const BALL_TYPES = ['Tennis', 'Leather', 'Tape Ball', 'Rubber'];

interface QuickPlayerItem {
  id: string;
  name: string;
  role: PlayerRole;
}

export const QuickMatchScreen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  // Teams & Players State
  const [teamAName, setTeamAName] = useState('Team A');
  const [teamBName, setTeamBName] = useState('Team B');

  const [teamAPlayers, setTeamAPlayers] = useState<QuickPlayerItem[]>([
    { id: 'pa_1', name: currentUser?.name || 'Player 1', role: 'batsman' },
    { id: 'pa_2', name: 'Player 2', role: 'allrounder' },
  ]);

  const [teamBPlayers, setTeamBPlayers] = useState<QuickPlayerItem[]>([
    { id: 'pb_1', name: 'Player A', role: 'batsman' },
    { id: 'pb_2', name: 'Player B', role: 'bowler' },
  ]);

  // Input states for adding players
  const [newPlayerAName, setNewPlayerAName] = useState('');
  const [newPlayerARole, setNewPlayerARole] = useState<PlayerRole>('batsman');

  const [newPlayerBName, setNewPlayerBName] = useState('');
  const [newPlayerBRole, setNewPlayerBRole] = useState<PlayerRole>('batsman');

  // Match Settings
  const [overs, setOvers] = useState<number>(2);
  const [customOvers, setCustomOvers] = useState<string>('');
  const [ballType, setBallType] = useState<string>('Tennis');
  const [venue, setVenue] = useState('Local Ground');
  const [allowSingleWicket, setAllowSingleWicket] = useState<boolean>(false);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(2);

  // Toss & Openers
  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB'>('teamA');
  const [decision, setDecision] = useState<'bat' | 'bowl'>('bat');

  const [strikerName, setStrikerName] = useState('');
  const [nonStrikerName, setNonStrikerName] = useState('');
  const [bowlerName, setBowlerName] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Keep squad count synchronized with playersPerTeam
  useEffect(() => {
    const maxSquad = Math.max(teamAPlayers.length, teamBPlayers.length, 2);
    setPlayersPerTeam(maxSquad);
  }, [teamAPlayers.length, teamBPlayers.length]);

  // Determine batting and bowling squads based on toss
  const isTeamABattingFirst =
    (tossWinner === 'teamA' && decision === 'bat') ||
    (tossWinner === 'teamB' && decision === 'bowl');

  const battingTeamName = isTeamABattingFirst ? teamAName : teamBName;
  const bowlingTeamName = isTeamABattingFirst ? teamBName : teamAName;
  const battingSquad = isTeamABattingFirst ? teamAPlayers : teamBPlayers;
  const bowlingSquad = isTeamABattingFirst ? teamBPlayers : teamAPlayers;

  // Auto-fill openers when squads change
  useEffect(() => {
    if (battingSquad.length >= 1) {
      if (!strikerName || !battingSquad.some((p) => p.name === strikerName)) {
        setStrikerName(battingSquad[0].name);
      }
    }
    if (battingSquad.length >= 2) {
      if (!nonStrikerName || !battingSquad.some((p) => p.name === nonStrikerName) || nonStrikerName === strikerName) {
        const nextBatter = battingSquad.find((p) => p.name !== (strikerName || battingSquad[0].name)) || battingSquad[1];
        setNonStrikerName(nextBatter.name);
      }
    } else {
      setNonStrikerName('');
    }
    if (bowlingSquad.length >= 1) {
      if (!bowlerName || !bowlingSquad.some((p) => p.name === bowlerName)) {
        const bestBowler = bowlingSquad.find((p) => p.role === 'bowler') || bowlingSquad[0];
        setBowlerName(bestBowler.name);
      }
    }
  }, [tossWinner, decision, battingSquad, bowlingSquad]);

  // Handler: Add Player to Team A
  const handleAddPlayerA = () => {
    const name = newPlayerAName.trim();
    if (!name) return;
    if (teamAPlayers.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Duplicate Player', `${name} is already in ${teamAName}.`);
      return;
    }
    const newPlayer: QuickPlayerItem = {
      id: `pa_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      role: newPlayerARole,
    };
    setTeamAPlayers((prev) => [...prev, newPlayer]);
    setNewPlayerAName('');
  };

  // Handler: Remove Player from Team A
  const handleRemovePlayerA = (id: string) => {
    if (teamAPlayers.length <= 1) {
      Alert.alert('Minimum Players', 'A team must have at least 1 player.');
      return;
    }
    setTeamAPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  // Handler: Add Player to Team B
  const handleAddPlayerB = () => {
    const name = newPlayerBName.trim();
    if (!name) return;
    if (teamBPlayers.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Duplicate Player', `${name} is already in ${teamBName}.`);
      return;
    }
    const newPlayer: QuickPlayerItem = {
      id: `pb_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      role: newPlayerBRole,
    };
    setTeamBPlayers((prev) => [...prev, newPlayer]);
    setNewPlayerBName('');
  };

  // Handler: Remove Player from Team B
  const handleRemovePlayerB = (id: string) => {
    if (teamBPlayers.length <= 1) {
      Alert.alert('Minimum Players', 'A team must have at least 1 player.');
      return;
    }
    setTeamBPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  // Handler: Launch Quick Match
  const handleStartQuickMatch = async () => {
    const tAName = teamAName.trim() || 'Team A';
    const tBName = teamBName.trim() || 'Team B';

    if (tAName.toLowerCase() === tBName.toLowerCase()) {
      Alert.alert('Invalid Team Names', 'Team 1 and Team 2 must have distinct names.');
      return;
    }

    if (teamAPlayers.length === 0) {
      Alert.alert('Squad Required', `Please add at least 1 player to ${tAName}.`);
      return;
    }

    if (teamBPlayers.length === 0) {
      Alert.alert('Squad Required', `Please add at least 1 player to ${tBName}.`);
      return;
    }

    const effectiveOvers =
      customOvers && parseInt(customOvers, 10) > 0 ? parseInt(customOvers, 10) : overs;

    const actualSquadSize = Math.max(teamAPlayers.length, teamBPlayers.length, playersPerTeam);
    const maxWickets = allowSingleWicket
      ? actualSquadSize
      : Math.max(1, actualSquadSize - 1);

    const team1PlayingXI: PlayingXIPlayer[] = teamAPlayers.map((p, idx) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      battingOrder: idx + 1,
    }));

    const team2PlayingXI: PlayingXIPlayer[] = teamBPlayers.map((p, idx) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      battingOrder: idx + 1,
    }));

    const finalStriker = strikerName.trim() || team1PlayingXI[0]?.name || `${battingTeamName} Opener 1`;
    const finalNonStriker = nonStrikerName.trim() || team1PlayingXI[1]?.name || (team1PlayingXI.length > 1 ? `${battingTeamName} Opener 2` : '');
    const finalBowler = bowlerName.trim() || team2PlayingXI[0]?.name || `${bowlingTeamName} Bowler 1`;

    setSubmitting(true);
    try {
      const createdMatch = await cricketApi.createMatch({
        teamAName: tAName,
        teamBName: tBName,
        teamAShortName: tAName.substring(0, 3).toUpperCase(),
        teamBShortName: tBName.substring(0, 3).toUpperCase(),
        tournamentName: 'Quick Match',
        matchType: `${effectiveOvers} Ov Quick Match (${actualSquadSize}v${actualSquadSize})`,
        overs: effectiveOvers,
        venue: venue.trim() || 'Local Ground',
        city: 'City',
        tossWinner,
        decision,
        strikerName: finalStriker,
        nonStrikerName: finalNonStriker,
        bowlerName: finalBowler,
        team1PlayingXI,
        team2PlayingXI,
        playersPerTeam: actualSquadSize,
        allowSingleWicket,
        maxWickets,
        createdBy: currentUser?.id,
      });

      dispatch(fetchMatches('live'));
      router.replace(`/scoring/${createdMatch.id}` as any);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start quick match');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.topBarTitleBox}>
          <View style={styles.quickBadge}>
            <Ionicons name="flash" size={14} color="#F59E0B" />
            <Text style={styles.quickBadgeText}>FAST SETUP</Text>
          </View>
          <Text style={styles.topBarTitle}>Quick Match</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Match Preview VS Header */}
        <View style={styles.vsPreviewCard}>
          <View style={styles.vsTeamCol}>
            <View style={[styles.teamAvatarCircle, { backgroundColor: '#0284C7' }]}>
              <Text style={styles.teamAvatarText}>{teamAName.slice(0, 3).toUpperCase()}</Text>
            </View>
            <Text style={styles.vsTeamName} numberOfLines={1}>{teamAName}</Text>
            <Text style={styles.vsSquadCount}>{teamAPlayers.length} Players</Text>
          </View>

          <View style={styles.vsCenterBox}>
            <View style={styles.vsBadgeCircle}>
              <Text style={styles.vsBadgeText}>VS</Text>
            </View>
            <Text style={styles.vsOversSubtext}>
              {customOvers ? `${customOvers} Ov` : `${overs} Overs`}
            </Text>
          </View>

          <View style={[styles.vsTeamCol, { alignItems: 'flex-end' }]}>
            <View style={[styles.teamAvatarCircle, { backgroundColor: '#D97706' }]}>
              <Text style={styles.teamAvatarText}>{teamBName.slice(0, 3).toUpperCase()}</Text>
            </View>
            <Text style={styles.vsTeamName} numberOfLines={1}>{teamBName}</Text>
            <Text style={styles.vsSquadCount}>{teamBPlayers.length} Players</Text>
          </View>
        </View>

        {/* 1. TEAM A & SQUAD SETUP */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.teamIconDotA} />
            <Text style={styles.cardSectionTitle}>Team 1 (e.g. Team A)</Text>
            <View style={styles.playerCountPill}>
              <Text style={styles.playerCountPillText}>{teamAPlayers.length} added</Text>
            </View>
          </View>

          {/* Team A Name Input */}
          <Text style={styles.fieldLabel}>Team 1 Name</Text>
          <TextInput
            style={styles.textInput}
            value={teamAName}
            onChangeText={setTeamAName}
            placeholder="Enter Team 1 Name"
            placeholderTextColor={Colors.onSurfaceVariant}
          />

          {/* Add Player Input Row for Team A */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Add Team 1 Players</Text>
          <View style={styles.addPlayerRow}>
            <TextInput
              style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
              value={newPlayerAName}
              onChangeText={setNewPlayerAName}
              placeholder="Enter player name..."
              placeholderTextColor={Colors.onSurfaceVariant}
              onSubmitEditing={handleAddPlayerA}
            />
            <TouchableOpacity
              style={styles.addPlayerBtn}
              onPress={handleAddPlayerA}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addPlayerBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Role selector for next added player */}
          <View style={styles.roleChipRow}>
            {(['batsman', 'bowler', 'allrounder', 'wicketkeeper'] as PlayerRole[]).map((r) => (
              <TouchableOpacity
                key={`role_a_${r}`}
                style={[styles.roleChip, newPlayerARole === r && styles.roleChipActive]}
                onPress={() => setNewPlayerARole(r)}
                activeOpacity={0.7}
              >
                <Text style={[styles.roleChipText, newPlayerARole === r && styles.roleChipTextActive]}>
                  {r === 'allrounder' ? 'All-Rnd' : r === 'wicketkeeper' ? 'WK' : r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Team A Players List Chips */}
          <View style={styles.playerChipsContainer}>
            {teamAPlayers.map((p, idx) => (
              <View key={p.id} style={styles.playerChip}>
                <Text style={styles.playerChipIndex}>#{idx + 1}</Text>
                <Text style={styles.playerChipName} numberOfLines={1}>{p.name}</Text>
                <View style={styles.playerChipRoleBadge}>
                  <Text style={styles.playerChipRoleText}>
                    {p.role === 'allrounder' ? 'AR' : p.role === 'wicketkeeper' ? 'WK' : p.role.slice(0, 3).toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemovePlayerA(p.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* 2. TEAM B & SQUAD SETUP */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.teamIconDotB} />
            <Text style={styles.cardSectionTitle}>Team 2 (e.g. Team B)</Text>
            <View style={styles.playerCountPill}>
              <Text style={styles.playerCountPillText}>{teamBPlayers.length} added</Text>
            </View>
          </View>

          {/* Team B Name Input */}
          <Text style={styles.fieldLabel}>Team 2 Name</Text>
          <TextInput
            style={styles.textInput}
            value={teamBName}
            onChangeText={setTeamBName}
            placeholder="Enter Team 2 Name"
            placeholderTextColor={Colors.onSurfaceVariant}
          />

          {/* Add Player Input Row for Team B */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Add Team 2 Players</Text>
          <View style={styles.addPlayerRow}>
            <TextInput
              style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
              value={newPlayerBName}
              onChangeText={setNewPlayerBName}
              placeholder="Enter player name..."
              placeholderTextColor={Colors.onSurfaceVariant}
              onSubmitEditing={handleAddPlayerB}
            />
            <TouchableOpacity
              style={[styles.addPlayerBtn, { backgroundColor: '#D97706' }]}
              onPress={handleAddPlayerB}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addPlayerBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Role selector for next added player */}
          <View style={styles.roleChipRow}>
            {(['batsman', 'bowler', 'allrounder', 'wicketkeeper'] as PlayerRole[]).map((r) => (
              <TouchableOpacity
                key={`role_b_${r}`}
                style={[styles.roleChip, newPlayerBRole === r && styles.roleChipActive]}
                onPress={() => setNewPlayerBRole(r)}
                activeOpacity={0.7}
              >
                <Text style={[styles.roleChipText, newPlayerBRole === r && styles.roleChipTextActive]}>
                  {r === 'allrounder' ? 'All-Rnd' : r === 'wicketkeeper' ? 'WK' : r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Team B Players List Chips */}
          <View style={styles.playerChipsContainer}>
            {teamBPlayers.map((p, idx) => (
              <View key={p.id} style={styles.playerChip}>
                <Text style={styles.playerChipIndex}>#{idx + 1}</Text>
                <Text style={styles.playerChipName} numberOfLines={1}>{p.name}</Text>
                <View style={styles.playerChipRoleBadge}>
                  <Text style={styles.playerChipRoleText}>
                    {p.role === 'allrounder' ? 'AR' : p.role === 'wicketkeeper' ? 'WK' : p.role.slice(0, 3).toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemovePlayerB(p.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* 3. MATCH SETTINGS & RULES */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardSectionTitle}>Match Settings</Text>

          {/* Overs Selector */}
          <Text style={styles.fieldLabel}>Overs Per Innings</Text>
          <View style={styles.optionsRow}>
            {QUICK_OVERS.map((ov) => (
              <TouchableOpacity
                key={`ov_${ov}`}
                style={[
                  styles.optionPill,
                  overs === ov && !customOvers && styles.optionPillActive,
                ]}
                onPress={() => {
                  setOvers(ov);
                  setCustomOvers('');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.optionPillText,
                    overs === ov && !customOvers && styles.optionPillTextActive,
                  ]}
                >
                  {ov} Ov
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Overs Input */}
          <TextInput
            style={[styles.textInput, { marginTop: 8 }]}
            value={customOvers}
            onChangeText={setCustomOvers}
            placeholder="Custom overs (e.g. 3, 6, 8, 25)"
            placeholderTextColor={Colors.onSurfaceVariant}
            keyboardType="number-pad"
          />

          {/* Ball Type */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Ball Type</Text>
          <View style={styles.optionsRow}>
            {BALL_TYPES.map((bt) => (
              <TouchableOpacity
                key={bt}
                style={[styles.optionPill, ballType === bt && styles.optionPillActive]}
                onPress={() => setBallType(bt)}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionPillText, ballType === bt && styles.optionPillTextActive]}>
                  {bt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Single Wicket Mode Switch */}
          <View style={styles.switchRowContainer}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchTitle}>Single Wicket Mode (LMS)</Text>
              <Text style={styles.switchSubtext}>
                Allow lone batsman to continue batting alone if 1 wicket falls.
              </Text>
            </View>
            <Switch
              value={allowSingleWicket}
              onValueChange={setAllowSingleWicket}
              trackColor={{ false: '#334155', true: Colors.primary }}
              thumbColor={allowSingleWicket ? '#FFFFFF' : '#94A3B8'}
            />
          </View>
        </View>

        {/* 4. TOSS & OPENERS */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardSectionTitle}>Toss & Opening Lineup</Text>

          {/* Toss Winner */}
          <Text style={styles.fieldLabel}>Who won the toss?</Text>
          <View style={styles.tossWinnerRow}>
            <TouchableOpacity
              style={[styles.tossTeamCard, tossWinner === 'teamA' && styles.tossTeamCardActive]}
              onPress={() => setTossWinner('teamA')}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tossWinner === 'teamA' ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={tossWinner === 'teamA' ? Colors.primary : Colors.onSurfaceVariant}
              />
              <Text style={[styles.tossTeamText, tossWinner === 'teamA' && styles.tossTeamTextActive]} numberOfLines={1}>
                {teamAName}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tossTeamCard, tossWinner === 'teamB' && styles.tossTeamCardActive]}
              onPress={() => setTossWinner('teamB')}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tossWinner === 'teamB' ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={tossWinner === 'teamB' ? Colors.primary : Colors.onSurfaceVariant}
              />
              <Text style={[styles.tossTeamText, tossWinner === 'teamB' && styles.tossTeamTextActive]} numberOfLines={1}>
                {teamBName}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toss Decision */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Elected to</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionPill, decision === 'bat' && styles.optionPillActive]}
              onPress={() => setDecision('bat')}
              activeOpacity={0.8}
            >
              <Text style={[styles.optionPillText, decision === 'bat' && styles.optionPillTextActive]}>
                🏏 Bat First
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionPill, decision === 'bowl' && styles.optionPillActive]}
              onPress={() => setDecision('bowl')}
              activeOpacity={0.8}
            >
              <Text style={[styles.optionPillText, decision === 'bowl' && styles.optionPillTextActive]}>
                🎳 Bowl First
              </Text>
            </TouchableOpacity>
          </View>

          {/* Batting Team Summary */}
          <View style={styles.inningsPreviewBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#38BDF8" />
            <Text style={styles.inningsPreviewText}>
              <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>{battingTeamName}</Text> will bat first •{' '}
              <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>{bowlingTeamName}</Text> will bowl
            </Text>
          </View>

          {/* Striker Selection */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Striker ({battingTeamName})</Text>
          <View style={styles.openerChipsRow}>
            {battingSquad.map((p) => (
              <TouchableOpacity
                key={`striker_${p.id}`}
                style={[styles.openerChip, strikerName === p.name && styles.openerChipActive]}
                onPress={() => setStrikerName(p.name)}
                activeOpacity={0.7}
              >
                <Text style={[styles.openerChipText, strikerName === p.name && styles.openerChipTextActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.textInput}
            value={strikerName}
            onChangeText={setStrikerName}
            placeholder="Striker batsman name"
            placeholderTextColor={Colors.onSurfaceVariant}
          />

          {/* Non-Striker Selection */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Non-Striker ({battingTeamName})</Text>
          <View style={styles.openerChipsRow}>
            {battingSquad
              .filter((p) => p.name !== strikerName)
              .map((p) => (
                <TouchableOpacity
                  key={`nonstriker_${p.id}`}
                  style={[styles.openerChip, nonStrikerName === p.name && styles.openerChipActive]}
                  onPress={() => setNonStrikerName(p.name)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.openerChipText, nonStrikerName === p.name && styles.openerChipTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
          <TextInput
            style={styles.textInput}
            value={nonStrikerName}
            onChangeText={setNonStrikerName}
            placeholder="Non-Striker batsman name (optional if 1 player)"
            placeholderTextColor={Colors.onSurfaceVariant}
          />

          {/* Opening Bowler Selection */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Opening Bowler ({bowlingTeamName})</Text>
          <View style={styles.openerChipsRow}>
            {bowlingSquad.map((p) => (
              <TouchableOpacity
                key={`bowler_${p.id}`}
                style={[styles.openerChip, bowlerName === p.name && styles.openerChipActive]}
                onPress={() => setBowlerName(p.name)}
                activeOpacity={0.7}
              >
                <Text style={[styles.openerChipText, bowlerName === p.name && styles.openerChipTextActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.textInput}
            value={bowlerName}
            onChangeText={setBowlerName}
            placeholder="Opening bowler name"
            placeholderTextColor={Colors.onSurfaceVariant}
          />
        </View>

        {/* Start Match CTA */}
        <TouchableOpacity
          style={[styles.startMatchBtn, submitting && styles.startMatchBtnDisabled]}
          onPress={handleStartQuickMatch}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#FFFFFF" />
              <Text style={styles.startMatchBtnText}>Start Live Scoring 🚀</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D13',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#12151D',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleBox: {
    alignItems: 'center',
  },
  quickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 2,
  },
  quickBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  vsPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  vsTeamCol: {
    flex: 1,
    gap: 4,
  },
  teamAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  teamAvatarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  vsTeamName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vsSquadCount: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  vsCenterBox: {
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 4,
  },
  vsBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E2330',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  vsBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38BDF8',
  },
  vsOversSubtext: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  sectionCard: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  teamIconDotA: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284C7',
  },
  teamIconDotB: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D97706',
  },
  cardSectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  playerCountPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  playerCountPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  textInput: {
    backgroundColor: '#1E2330',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 6,
  },
  addPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
  },
  addPlayerBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  roleChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  roleChip: {
    backgroundColor: '#1E2330',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  roleChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  playerChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E2330',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  playerChipIndex: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  playerChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    maxWidth: 110,
  },
  playerChipRoleBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  playerChipRoleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38BDF8',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  optionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E2330',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionPillActive: {
    backgroundColor: Colors.primary,
    borderColor: '#4EDEAF',
  },
  optionPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  optionPillTextActive: {
    color: '#0B0D13',
    fontWeight: '800',
  },
  switchRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E2330',
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  switchTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  switchSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },
  tossWinnerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tossTeamCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E2330',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tossTeamCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(78, 222, 175, 0.1)',
  },
  tossTeamText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
    flex: 1,
  },
  tossTeamTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  inningsPreviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 4,
  },
  inningsPreviewText: {
    fontSize: 12,
    color: '#BAE6FD',
    fontWeight: '600',
  },
  openerChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  openerChip: {
    backgroundColor: '#1E2330',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  openerChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  openerChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  openerChipTextActive: {
    color: '#FFFFFF',
  },
  startMatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startMatchBtnDisabled: {
    opacity: 0.6,
  },
  startMatchBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B0D13',
    letterSpacing: 0.4,
  },
});

export default QuickMatchScreen;
