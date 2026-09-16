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
import { Player, Team, Tournament } from '../types/cricket';

const OVERS_OPTIONS = [5, 10, 15, 20, 50];

export const CreateMatchScreen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Squad Players State
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);

  // Form states
  const [selectedTeamAId, setSelectedTeamAId] = useState<string>('');
  const [customTeamAName, setCustomTeamAName] = useState('');
  const [selectedTeamBId, setSelectedTeamBId] = useState<string>('');
  const [customTeamBName, setCustomTeamBName] = useState('');

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [customSeriesName, setCustomSeriesName] = useState('Friendly Series 2026');

  const [overs, setOvers] = useState<number>(20);
  const [venue, setVenue] = useState('Cricket Stadium');
  const [city, setCity] = useState('Chennai');

  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB'>('teamA');
  const [decision, setDecision] = useState<'bat' | 'bowl'>('bat');

  const [strikerName, setStrikerName] = useState('');
  const [nonStrikerName, setNonStrikerName] = useState('');
  const [bowlerName, setBowlerName] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [teamList, tourList] = await Promise.all([
          cricketApi.getTeams(),
          cricketApi.getTournaments(),
        ]);
        setTeams(teamList);
        setTournaments(tourList);

        if (teamList.length >= 2) {
          setSelectedTeamAId(teamList[0].id);
          setSelectedTeamBId(teamList[1].id);
        } else if (teamList.length === 1) {
          setSelectedTeamAId(teamList[0].id);
        }
      } catch (err) {
        console.log('Error loading teams/tournaments', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, []);

  // Fetch squad players when team selection changes
  useEffect(() => {
    if (selectedTeamAId) {
      cricketApi.getTeamById(selectedTeamAId).then((res) => {
        setTeamAPlayers(res.players || []);
      }).catch(() => setTeamAPlayers([]));
    } else {
      setTeamAPlayers([]);
    }
  }, [selectedTeamAId]);

  useEffect(() => {
    if (selectedTeamBId) {
      cricketApi.getTeamById(selectedTeamBId).then((res) => {
        setTeamBPlayers(res.players || []);
      }).catch(() => setTeamBPlayers([]));
    } else {
      setTeamBPlayers([]);
    }
  }, [selectedTeamBId]);

  const getTeamAName = () => {
    if (selectedTeamAId) {
      const found = teams.find((t) => t.id === selectedTeamAId);
      if (found) return found.name;
    }
    return customTeamAName || 'Team A';
  };

  const getTeamBName = () => {
    if (selectedTeamBId) {
      const found = teams.find((t) => t.id === selectedTeamBId);
      if (found) return found.name;
    }
    return customTeamBName || 'Team B';
  };

  const getSelectedTournament = () => {
    if (selectedTournamentId) {
      return tournaments.find((t) => t.id === selectedTournamentId);
    }
    return null;
  };

  // Determine which team is batting first vs bowling first based on Toss
  const isTeamABattingFirst =
    (tossWinner === 'teamA' && decision === 'bat') ||
    (tossWinner === 'teamB' && decision === 'bowl');

  const battingTeamName = isTeamABattingFirst ? getTeamAName() : getTeamBName();
  const bowlingTeamName = isTeamABattingFirst ? getTeamBName() : getTeamAName();

  const battingSquad = isTeamABattingFirst ? teamAPlayers : teamBPlayers;
  const bowlingSquad = isTeamABattingFirst ? teamBPlayers : teamAPlayers;

  // Auto-set openers if players are available and fields are empty
  useEffect(() => {
    if (battingSquad.length >= 2) {
      if (!strikerName || !battingSquad.some((p) => p.name === strikerName)) {
        setStrikerName(battingSquad[0].name);
      }
      if (!nonStrikerName || !battingSquad.some((p) => p.name === nonStrikerName)) {
        setNonStrikerName(battingSquad[1].name);
      }
    }
    if (bowlingSquad.length >= 1) {
      if (!bowlerName || !bowlingSquad.some((p) => p.name === bowlerName)) {
        // Pick first bowler or first player
        const b = bowlingSquad.find((p) => p.role === 'bowler') || bowlingSquad[0];
        setBowlerName(b.name);
      }
    }
  }, [tossWinner, decision, battingSquad, bowlingSquad]);

  const handleCreateMatch = async (startScoringImmediately = true) => {
    const teamAName = getTeamAName().trim();
    const teamBName = getTeamBName().trim();

    if (!teamAName) {
      Alert.alert('Required', 'Please select or enter Team 1 name.');
      return;
    }
    if (!teamBName) {
      Alert.alert('Required', 'Please select or enter Team 2 name.');
      return;
    }
    if (teamAName.toLowerCase() === teamBName.toLowerCase()) {
      Alert.alert('Invalid Teams', 'Team 1 and Team 2 must be different teams.');
      return;
    }

    setSubmitting(true);
    try {
      const teamAObj = teams.find((t) => t.id === selectedTeamAId);
      const teamBObj = teams.find((t) => t.id === selectedTeamBId);
      const tournamentObj = getSelectedTournament();

      const createdMatch = await cricketApi.createMatch({
        teamAId: teamAObj?.id,
        teamBId: teamBObj?.id,
        teamAName,
        teamBName,
        teamAShortName: teamAObj?.shortName || teamAName.substring(0, 3).toUpperCase(),
        teamBShortName: teamBObj?.shortName || teamBName.substring(0, 3).toUpperCase(),
        teamALogo: teamAObj?.logoUrl,
        teamBLogo: teamBObj?.logoUrl,
        tournamentId: tournamentObj?.id,
        tournamentName: tournamentObj?.name || customSeriesName || 'Friendly Series 2026',
        matchType: `${overs} Overs Match`,
        overs,
        venue: venue.trim() || 'Cricket Stadium',
        city: city.trim() || 'City',
        tossWinner,
        decision,
        strikerName: strikerName.trim() || `${battingTeamName} Opener 1`,
        nonStrikerName: nonStrikerName.trim() || `${battingTeamName} Opener 2`,
        bowlerName: bowlerName.trim() || `${bowlingTeamName} Bowler 1`,
        createdBy: currentUser?.id,
      });

      dispatch(fetchMatches('live'));

      if (startScoringImmediately) {
        router.replace(`/scoring/${createdMatch.id}` as any);
      } else {
        Alert.alert(
          'Match Created!',
          `${teamAName} vs ${teamBName} has been created successfully.`,
          [
            {
              text: 'View Matches',
              onPress: () => router.replace('/(tabs)' as any),
            },
            {
              text: 'Start Scoring',
              onPress: () => router.replace(`/scoring/${createdMatch.id}` as any),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create match');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Create Match</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 220 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Match Header Preview Banner */}
        <View style={styles.previewCard}>
          <View style={styles.previewTeamCol}>
            <View style={styles.teamShield}>
              <Text style={styles.teamShieldText}>
                {getTeamAName().slice(0, 3).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.previewTeamName} numberOfLines={1}>
              {getTeamAName()}
            </Text>
            {isTeamABattingFirst ? (
              <View style={styles.battingBadge}>
                <Text style={styles.battingBadgeText}>Batting 1st</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.vsBadgeBox}>
            <Text style={styles.vsText}>VS</Text>
            <Text style={styles.oversBadgeText}>{overs} Overs</Text>
          </View>

          <View style={styles.previewTeamCol}>
            <View style={[styles.teamShield, { backgroundColor: '#1E293B' }]}>
              <Text style={styles.teamShieldText}>
                {getTeamBName().slice(0, 3).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.previewTeamName} numberOfLines={1}>
              {getTeamBName()}
            </Text>
            {!isTeamABattingFirst ? (
              <View style={styles.battingBadge}>
                <Text style={styles.battingBadgeText}>Batting 1st</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Section 1: Teams Selection */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>Select Participating Teams</Text>

          {/* Team A */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Team 1 (Calling Toss)</Text>
            {teams.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {teams.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.teamChip,
                      selectedTeamAId === t.id && styles.teamChipActive,
                    ]}
                    onPress={() => {
                      setSelectedTeamAId(t.id);
                      setCustomTeamAName('');
                    }}
                  >
                    <Text
                      style={[
                        styles.teamChipText,
                        selectedTeamAId === t.id && styles.teamChipTextActive,
                      ]}
                    >
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.teamChip,
                    selectedTeamAId === '' && styles.teamChipActive,
                  ]}
                  onPress={() => setSelectedTeamAId('')}
                >
                  <Text
                    style={[
                      styles.teamChipText,
                      selectedTeamAId === '' && styles.teamChipTextActive,
                    ]}
                  >
                    + Custom Name
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}

            {selectedTeamAId === '' && (
              <TextInput
                style={styles.textInput}
                placeholder="Enter Team 1 Name"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={customTeamAName}
                onChangeText={setCustomTeamAName}
              />
            )}
          </View>

          {/* Team B */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Team 2 (Opponent)</Text>
            {teams.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {teams.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.teamChip,
                      selectedTeamBId === t.id && styles.teamChipActive,
                    ]}
                    onPress={() => {
                      setSelectedTeamBId(t.id);
                      setCustomTeamBName('');
                    }}
                  >
                    <Text
                      style={[
                        styles.teamChipText,
                        selectedTeamBId === t.id && styles.teamChipTextActive,
                      ]}
                    >
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.teamChip,
                    selectedTeamBId === '' && styles.teamChipActive,
                  ]}
                  onPress={() => setSelectedTeamBId('')}
                >
                  <Text
                    style={[
                      styles.teamChipText,
                      selectedTeamBId === '' && styles.teamChipTextActive,
                    ]}
                  >
                    + Custom Name
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}

            {selectedTeamBId === '' && (
              <TextInput
                style={styles.textInput}
                placeholder="Enter Team 2 Name"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={customTeamBName}
                onChangeText={setCustomTeamBName}
              />
            )}
          </View>
        </View>

        {/* Section 2: Tournament / Series Selection */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>Tournament / Series (Optional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <TouchableOpacity
              style={[
                styles.teamChip,
                selectedTournamentId === '' && styles.teamChipActive,
              ]}
              onPress={() => setSelectedTournamentId('')}
            >
              <Text
                style={[
                  styles.teamChipText,
                  selectedTournamentId === '' && styles.teamChipTextActive,
                ]}
              >
                Standalone / Friendly
              </Text>
            </TouchableOpacity>

            {tournaments.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.teamChip,
                  selectedTournamentId === t.id && styles.teamChipActive,
                ]}
                onPress={() => setSelectedTournamentId(t.id)}
              >
                <Text
                  style={[
                    styles.teamChipText,
                    selectedTournamentId === t.id && styles.teamChipTextActive,
                  ]}
                >
                  {t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedTournamentId === '' && (
            <TextInput
              style={[styles.textInput, { marginTop: 10 }]}
              placeholder="Series / Trophy Name (e.g. Club Friendly Cup)"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={customSeriesName}
              onChangeText={setCustomSeriesName}
            />
          )}
        </View>

        {/* Section 3: Overs & Venue */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>Match Format & Venue</Text>

          <Text style={styles.fieldLabel}>Total Overs Per Innings</Text>
          <View style={styles.oversGrid}>
            {OVERS_OPTIONS.map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.overButton, overs === num && styles.overButtonActive]}
                onPress={() => setOvers(num)}
              >
                <Text
                  style={[
                    styles.overButtonText,
                    overs === num && styles.overButtonTextActive,
                  ]}
                >
                  {num} Overs
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.twoColumnRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Venue / Stadium</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ground Name"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={venue}
                onChangeText={setVenue}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>City</Text>
              <TextInput
                style={styles.textInput}
                placeholder="City"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>
        </View>

        {/* Section 4: Toss Details */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>Toss Module</Text>

          <Text style={styles.fieldLabel}>Who Won The Toss?</Text>
          <View style={styles.choiceRow}>
            <TouchableOpacity
              style={[
                styles.choiceButton,
                tossWinner === 'teamA' && styles.choiceButtonActive,
              ]}
              onPress={() => setTossWinner('teamA')}
            >
              <Text
                style={[
                  styles.choiceButtonText,
                  tossWinner === 'teamA' && styles.choiceButtonTextActive,
                ]}
                numberOfLines={1}
              >
                {getTeamAName()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.choiceButton,
                tossWinner === 'teamB' && styles.choiceButtonActive,
              ]}
              onPress={() => setTossWinner('teamB')}
            >
              <Text
                style={[
                  styles.choiceButtonText,
                  tossWinner === 'teamB' && styles.choiceButtonTextActive,
                ]}
                numberOfLines={1}
              >
                {getTeamBName()}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Elected To?</Text>
          <View style={styles.choiceRow}>
            <TouchableOpacity
              style={[
                styles.choiceButton,
                decision === 'bat' && styles.choiceButtonActive,
              ]}
              onPress={() => setDecision('bat')}
            >
              <Ionicons
                name="baseball-outline"
                size={16}
                color={decision === 'bat' ? '#FFFFFF' : '#0F172A'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.choiceButtonText,
                  decision === 'bat' && styles.choiceButtonTextActive,
                ]}
              >
                BAT FIRST
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.choiceButton,
                decision === 'bowl' && styles.choiceButtonActive,
              ]}
              onPress={() => setDecision('bowl')}
            >
              <Ionicons
                name="shield-outline"
                size={16}
                color={decision === 'bowl' ? '#FFFFFF' : '#0F172A'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.choiceButtonText,
                  decision === 'bowl' && styles.choiceButtonTextActive,
                ]}
              >
                BOWL FIRST
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toss Result Banner */}
          <View style={styles.tossLiveBanner}>
            <Ionicons name="trophy-outline" size={16} color="#00695C" />
            <Text style={styles.tossLiveBannerText}>
              {tossWinner === 'teamA' ? getTeamAName() : getTeamBName()} won the toss and chose to{' '}
              {decision.toUpperCase()} first.
            </Text>
          </View>
        </View>

        {/* Section 5: Opening Batters & Bowler (from Toss Winning / Batting Squads) */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeader}>Opening Players Lineup</Text>
              <Text style={styles.sectionSubHeader}>
                {battingTeamName} (Batting) vs {bowlingTeamName} (Bowling)
              </Text>
            </View>
          </View>

          {/* 1. Striker Batter (from Batting Squad) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Striker (Opening Batter 1) - from {battingTeamName}
            </Text>
            {battingSquad.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.playerChipsRow}
              >
                {battingSquad.map((player) => {
                  const isSelected = strikerName === player.name;
                  return (
                    <TouchableOpacity
                      key={player.id}
                      style={[styles.playerChip, isSelected && styles.playerChipActive]}
                      onPress={() => setStrikerName(player.name)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.playerChipText,
                          isSelected && styles.playerChipTextActive,
                        ]}
                      >
                        {player.name}
                      </Text>
                      <View
                        style={[
                          styles.playerRoleBadge,
                          isSelected && styles.playerRoleBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.playerRoleText,
                            isSelected && styles.playerRoleTextActive,
                          ]}
                        >
                          {player.role ? player.role.substring(0, 3).toUpperCase() : 'BAT'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            <TextInput
              style={styles.textInput}
              placeholder={`Enter or customize Striker name for ${battingTeamName}`}
              placeholderTextColor={Colors.onSurfaceVariant}
              value={strikerName}
              onChangeText={setStrikerName}
            />
          </View>

          {/* 2. Non-Striker Batter (from Batting Squad) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Non-Striker (Opening Batter 2) - from {battingTeamName}
            </Text>
            {battingSquad.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.playerChipsRow}
              >
                {battingSquad
                  .filter((p) => p.name !== strikerName)
                  .map((player) => {
                    const isSelected = nonStrikerName === player.name;
                    return (
                      <TouchableOpacity
                        key={player.id}
                        style={[styles.playerChip, isSelected && styles.playerChipActive]}
                        onPress={() => setNonStrikerName(player.name)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.playerChipText,
                            isSelected && styles.playerChipTextActive,
                          ]}
                        >
                          {player.name}
                        </Text>
                        <View
                          style={[
                            styles.playerRoleBadge,
                            isSelected && styles.playerRoleBadgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.playerRoleText,
                              isSelected && styles.playerRoleTextActive,
                            ]}
                          >
                            {player.role ? player.role.substring(0, 3).toUpperCase() : 'BAT'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            ) : null}

            <TextInput
              style={styles.textInput}
              placeholder={`Enter or customize Non-Striker name for ${battingTeamName}`}
              placeholderTextColor={Colors.onSurfaceVariant}
              value={nonStrikerName}
              onChangeText={setNonStrikerName}
            />
          </View>

          {/* 3. Opening Bowler (from Bowling Squad) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Opening Bowler - from {bowlingTeamName}
            </Text>
            {bowlingSquad.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.playerChipsRow}
              >
                {bowlingSquad.map((player) => {
                  const isSelected = bowlerName === player.name;
                  return (
                    <TouchableOpacity
                      key={player.id}
                      style={[styles.playerChip, isSelected && styles.playerChipActive]}
                      onPress={() => setBowlerName(player.name)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.playerChipText,
                          isSelected && styles.playerChipTextActive,
                        ]}
                      >
                        {player.name}
                      </Text>
                      <View
                        style={[
                          styles.playerRoleBadge,
                          isSelected && styles.playerRoleBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.playerRoleText,
                            isSelected && styles.playerRoleTextActive,
                          ]}
                        >
                          {player.role ? player.role.substring(0, 3).toUpperCase() : 'BWL'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            <TextInput
              style={styles.textInput}
              placeholder={`Enter or customize Opening Bowler name for ${bowlingTeamName}`}
              placeholderTextColor={Colors.onSurfaceVariant}
              value={bowlerName}
              onChangeText={setBowlerName}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleCreateMatch(true)}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="play" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>CREATE & START LIVE SCORING</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => handleCreateMatch(false)}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Create Without Scoring Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  previewTeamCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  teamShield: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#00695C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamShieldText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  previewTeamName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  battingBadge: {
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4EDEAF',
  },
  battingBadgeText: {
    color: '#4EDEAF',
    fontSize: 9,
    fontWeight: '800',
  },
  vsBadgeBox: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  vsText: {
    color: '#4EDEAF',
    fontSize: 18,
    fontWeight: '900',
  },
  oversBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionHeaderRow: {
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubHeader: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  teamChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teamChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  teamChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  teamChipTextActive: {
    color: '#FFFFFF',
  },
  playerChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  playerChipActive: {
    backgroundColor: '#00695C',
    borderColor: '#00695C',
  },
  playerChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  playerChipTextActive: {
    color: '#FFFFFF',
  },
  playerRoleBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  playerRoleBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  playerRoleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  playerRoleTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  oversGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  overButton: {
    flex: 1,
    minWidth: '28%',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  overButtonActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  overButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  overButtonTextActive: {
    color: '#FFFFFF',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  choiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  choiceButtonActive: {
    backgroundColor: '#00695C',
    borderColor: '#00695C',
  },
  choiceButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  choiceButtonTextActive: {
    color: '#FFFFFF',
  },
  tossLiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 105, 92, 0.1)',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 105, 92, 0.2)',
    marginTop: 4,
  },
  tossLiveBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00695C',
    flex: 1,
  },
  submitContainer: {
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00695C',
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: '#00695C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});

export default CreateMatchScreen;
