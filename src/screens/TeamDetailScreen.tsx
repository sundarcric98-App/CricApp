import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../components/common/EmptyState';
import Header from '../components/common/Header';
import MatchCard from '../components/match/MatchCard';
import Colors from '../constants/colors';
import cricketApi from '../services/api';
import { Match, Player, PlayerRole, Team, User } from '../types/cricket';

const PLAYER_ROLES: { label: string; value: PlayerRole; icon: string }[] = [
  { label: 'Batsman', value: 'batsman', icon: 'baseball-outline' },
  { label: 'Bowler', value: 'bowler', icon: 'football-outline' },
  { label: 'All-Rounder', value: 'allrounder', icon: 'flash-outline' },
  { label: 'Wicket Keeper', value: 'wicketkeeper', icon: 'hand-left-outline' },
];

const BATTING_STYLES = ['Right-hand bat', 'Left-hand bat'];
const BOWLING_STYLES = [
  'Right-arm fast',
  'Right-arm medium',
  'Right-arm off-break',
  'Right-arm leg-spin',
  'Left-arm fast',
  'Left-arm spin',
  'None / Non-bowler',
];

export const TeamDetailScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Array.isArray(id) ? id[0] : id;

  const [activeTab, setActiveTab] = useState<'Squad' | 'Matches' | 'Stats'>('Squad');
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Player Modal State
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [modalMode, setModalMode] = useState<'search' | 'manual'>('search');

  // Search by Player ID / Code State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  // Manual Form State
  const [playerName, setPlayerName] = useState('');
  const [playerRole, setPlayerRole] = useState<PlayerRole>('batsman');
  const [battingStyle, setBattingStyle] = useState('Right-hand bat');
  const [bowlingStyle, setBowlingStyle] = useState('Right-arm medium');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [submittingPlayer, setSubmittingPlayer] = useState(false);

  const loadTeamData = useCallback(async () => {
    if (!teamId) return;
    try {
      const data = await cricketApi.getTeamById(teamId);
      setTeam(data.team);
      setPlayers(data.players);
      setMatches(data.matches);
    } catch (err) {
      console.log('Error loading team detail', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  useFocusEffect(
    useCallback(() => {
      loadTeamData();
    }, [loadTeamData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadTeamData();
  };

  // Search players by Player ID (e.g. yuv123) or Username
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text || text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await cricketApi.searchPlayerByCode(text.trim());
      setSearchResults(results);
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Add searched player directly to squad
  const handleAddSearchedPlayer = async (user: User) => {
    if (!teamId) return;

    // Check if player already in squad
    const alreadyExists = players.some(
      (p) =>
        (p.userId && p.userId === user.id) ||
        (p.userCode && p.userCode.toLowerCase() === user.userCode.toLowerCase())
    );
    if (alreadyExists) {
      Alert.alert('Already in Squad', `${user.name} (${user.userCode}) is already in this team.`);
      return;
    }

    setAddingUserId(user.id);
    try {
      await cricketApi.addPlayerToTeam(teamId, {
        name: user.name,
        role: 'allrounder',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm medium',
        userId: user.id,
        userCode: user.userCode,
      });

      Alert.alert(
        'Player Added!',
        `${user.name} (${user.userCode}) has been successfully added to the squad.`
      );
      loadTeamData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add player');
    } finally {
      setAddingUserId(null);
    }
  };

  // Manual player add handler
  const handleManualAddPlayer = async () => {
    if (!playerName.trim()) {
      Alert.alert('Required', 'Please enter player name.');
      return;
    }
    if (!teamId) return;

    setSubmittingPlayer(true);
    try {
      await cricketApi.addPlayerToTeam(teamId, {
        name: playerName.trim(),
        role: playerRole,
        battingStyle,
        bowlingStyle,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
      });

      // Reset form
      setPlayerName('');
      setJerseyNumber('');
      setPlayerRole('batsman');
      setShowAddPlayerModal(false);

      loadTeamData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add player');
    } finally {
      setSubmittingPlayer(false);
    }
  };

  const handleDeletePlayer = async (playerId: string, name: string) => {
    if (!teamId) return;
    Alert.alert('Remove Player', `Are you sure you want to remove ${name} from squad?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await cricketApi.deletePlayerFromTeam(teamId, playerId);
          loadTeamData();
        },
      },
    ]);
  };

  if (loading && !team) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <Header showBack title="Team Details" />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.container}>
        <Header showBack title="Team Details" />
        <EmptyState
          title="Team Not Found"
          description="This team could not be found or has been removed."
          actionLabel="View All Teams"
          onAction={() => router.replace('/teams' as any)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        showBack
        title={team.name}
        rightAction={
          <TouchableOpacity
            style={styles.headerPlusBtn}
            onPress={() => {
              setModalMode('search');
              setShowAddPlayerModal(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add-outline" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Team Hero Card */}
        <View style={styles.teamHeroCard}>
          <Image
            source={{
              uri:
                team.logoUrl ||
                'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=256&q=80',
            }}
            style={styles.teamHeroLogo}
          />
          <View style={styles.teamHeroInfo}>
            <View style={styles.heroNameRow}>
              <Text style={styles.teamHeroTitle} numberOfLines={1}>
                {team.name}
              </Text>
              <View style={styles.heroCodeBadge}>
                <Text style={styles.heroCodeText}>{team.code}</Text>
              </View>
            </View>
            <Text style={styles.teamHeroMeta}>
              {team.shortName} • {team.city || 'Club'}
            </Text>

            <View style={styles.teamHeroStatsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statPillNum}>{players.length}</Text>
                <Text style={styles.statPillLabel}>Players</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statPillNum}>{matches.length}</Text>
                <Text style={styles.statPillLabel}>Matches</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tab Pills */}
        <View style={styles.tabsRow}>
          {(['Squad', 'Matches', 'Stats'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabPillText, activeTab === tab && styles.tabPillTextActive]}>
                {tab === 'Squad'
                  ? `Squad (${players.length})`
                  : tab === 'Matches'
                  ? `Matches (${matches.length})`
                  : tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ============================================================== */}
        {/* TAB 1: SQUAD / PLAYERS */}
        {/* ============================================================== */}
        {activeTab === 'Squad' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Registered Squad</Text>
              <TouchableOpacity
                style={styles.addPlayerBtn}
                onPress={() => {
                  setModalMode('search');
                  setShowAddPlayerModal(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="search" size={14} color="#0F1117" />
                <Text style={styles.addPlayerBtnText}>Find by Player ID</Text>
              </TouchableOpacity>
            </View>

            {players.length === 0 ? (
              <View style={styles.emptySquadCard}>
                <Ionicons name="people-outline" size={42} color={Colors.primary} />
                <Text style={styles.emptySquadTitle}>No Players in Squad</Text>
                <Text style={styles.emptySquadText}>
                  Search players by their generated Player ID (e.g. yuv123) or add manually.
                </Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => {
                    setModalMode('search');
                    setShowAddPlayerModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyAddBtnText}>+ Search Player by ID</Text>
                </TouchableOpacity>
              </View>
            ) : (
              players.map((player) => (
                <View key={player.id} style={styles.playerCard}>
                  <View style={styles.playerAvatarBox}>
                    <Text style={styles.playerAvatarInitial}>
                      {player.name.charAt(0).toUpperCase()}
                    </Text>
                    {player.jerseyNumber ? (
                      <View style={styles.jerseyBadge}>
                        <Text style={styles.jerseyBadgeText}>#{player.jerseyNumber}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.playerInfo}>
                    <View style={styles.playerNameRow}>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {player.name}
                      </Text>
                      {player.userCode ? (
                        <View style={styles.playerCodeBadge}>
                          <Text style={styles.playerCodeBadgeText}>{player.userCode}</Text>
                        </View>
                      ) : null}
                      <View style={styles.roleTag}>
                        <Text style={styles.roleTagText}>{player.role}</Text>
                      </View>
                    </View>

                    <Text style={styles.playerDetailsText}>
                      {player.battingStyle || 'Right-hand bat'} • {player.bowlingStyle || 'Medium'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deletePlayerBtn}
                    onPress={() => handleDeletePlayer(player.id, player.name)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MATCHES */}
        {/* ============================================================== */}
        {activeTab === 'Matches' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Team Fixtures & History</Text>
              <TouchableOpacity
                style={styles.addPlayerBtn}
                onPress={() => router.push('/match/create' as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#0F1117" />
                <Text style={styles.addPlayerBtnText}>Create Match</Text>
              </TouchableOpacity>
            </View>

            {matches.length === 0 ? (
              <View style={styles.emptySquadCard}>
                <Ionicons name="baseball-outline" size={42} color={Colors.primary} />
                <Text style={styles.emptySquadTitle}>No Matches Scheduled</Text>
                <Text style={styles.emptySquadText}>
                  Create a match with this team to start tracking live scores.
                </Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => router.push('/match/create' as any)}
                >
                  <Text style={styles.emptyAddBtnText}>+ Create Match</Text>
                </TouchableOpacity>
              </View>
            ) : (
              matches.map((m) => <MatchCard key={m.id} match={m} />)
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 3: STATS */}
        {/* ============================================================== */}
        {activeTab === 'Stats' && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Team Information</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Team Code / ID</Text>
              <Text style={styles.statVal}>{team.code}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Short Name</Text>
              <Text style={styles.statVal}>{team.shortName}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Home City</Text>
              <Text style={styles.statVal}>{team.city || 'City'}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Squad Size</Text>
              <Text style={styles.statVal}>{players.length} Players</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Matches Played</Text>
              <Text style={styles.statVal}>{matches.length}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ============================================================== */}
      {/* MODAL: ADD PLAYER VIA PLAYER ID SEARCH OR MANUAL ENTRY */}
      {/* ============================================================== */}
      <Modal
        visible={showAddPlayerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddPlayerModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Player to Squad</Text>
              <TouchableOpacity onPress={() => setShowAddPlayerModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Modal Segment Switcher (Search Player ID vs Manual) */}
            <View style={styles.modalSegment}>
              <TouchableOpacity
                style={[styles.modalSegmentBtn, modalMode === 'search' && styles.modalSegmentBtnActive]}
                onPress={() => setModalMode('search')}
              >
                <Ionicons
                  name="search"
                  size={14}
                  color={modalMode === 'search' ? '#0F1117' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.modalSegmentText,
                    modalMode === 'search' && styles.modalSegmentTextActive,
                  ]}
                >
                  Search by Player ID
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSegmentBtn, modalMode === 'manual' && styles.modalSegmentBtnActive]}
                onPress={() => setModalMode('manual')}
              >
                <Ionicons
                  name="create-outline"
                  size={14}
                  color={modalMode === 'manual' ? '#0F1117' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.modalSegmentText,
                    modalMode === 'manual' && styles.modalSegmentTextActive,
                  ]}
                >
                  Manual Entry
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {/* SUBTAB 1: SEARCH BY PLAYER ID */}
              {modalMode === 'search' && (
                <View style={styles.searchSection}>
                  <Text style={styles.searchLabel}>
                    Search by Player ID (e.g.{' '}
                    <Text style={{ color: Colors.primary, fontWeight: '700' }}>yuv123</Text>) or Name
                  </Text>

                  <View style={styles.searchInputBox}>
                    <Ionicons name="search" size={18} color="#94A3B8" />
                    <TextInput
                      style={styles.modalSearchInput}
                      placeholder="e.g. yuv123 or yuvi..."
                      placeholderTextColor="#64748B"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={searchQuery}
                      onChangeText={handleSearch}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => handleSearch('')}>
                        <Ionicons name="close-circle" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {searching && (
                    <View style={styles.searchLoaderRow}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.searchLoaderText}>Searching player database...</Text>
                    </View>
                  )}

                  {/* Search Results List */}
                  {!searching && searchResults.length > 0 && (
                    <View style={styles.resultsList}>
                      <Text style={styles.resultsCountText}>
                        Found {searchResults.length} player(s):
                      </Text>
                      {searchResults.map((user) => {
                        const isAdded = players.some(
                          (p) =>
                            p.userId === user.id ||
                            (p.userCode && p.userCode.toLowerCase() === user.userCode.toLowerCase())
                        );
                        return (
                          <View key={user.id} style={styles.resultItemCard}>
                            <View style={styles.resultAvatarBox}>
                              <Text style={styles.resultAvatarInitial}>
                                {user.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>

                            <View style={styles.resultInfo}>
                              <Text style={styles.resultName}>{user.name}</Text>
                              <View style={styles.resultCodeBadge}>
                                <Ionicons name="id-card-outline" size={12} color={Colors.primary} />
                                <Text style={styles.resultCodeText}>ID: {user.userCode}</Text>
                              </View>
                            </View>

                            <TouchableOpacity
                              style={[
                                styles.addToSquadBtn,
                                isAdded && styles.alreadyAddedBtn,
                              ]}
                              onPress={() => handleAddSearchedPlayer(user)}
                              disabled={isAdded || addingUserId === user.id}
                              activeOpacity={0.8}
                            >
                              {addingUserId === user.id ? (
                                <ActivityIndicator size="small" color="#0F1117" />
                              ) : isAdded ? (
                                <>
                                  <Ionicons name="checkmark" size={14} color="#94A3B8" />
                                  <Text style={styles.alreadyAddedBtnText}>Added</Text>
                                </>
                              ) : (
                                <>
                                  <Ionicons name="person-add" size={14} color="#0F1117" />
                                  <Text style={styles.addToSquadBtnText}>+ Add</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                    <View style={styles.noResultsBox}>
                      <Ionicons name="alert-circle-outline" size={32} color="#64748B" />
                      <Text style={styles.noResultsTitle}>No Player Found</Text>
                      <Text style={styles.noResultsSubtitle}>
                        No user registered with Player ID or Name &quot;{searchQuery}&quot;.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* SUBTAB 2: MANUAL PLAYER ENTRY */}
              {modalMode === 'manual' && (
                <View style={styles.modalForm}>
                  {/* Player Name */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Player Full Name *</Text>
                    <TextInput
                      style={styles.modalTextInput}
                      placeholder="e.g. Virat Kohli"
                      placeholderTextColor="#64748B"
                      value={playerName}
                      onChangeText={setPlayerName}
                    />
                  </View>

                  {/* Jersey Number */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Jersey Number (Optional)</Text>
                    <TextInput
                      style={styles.modalTextInput}
                      placeholder="e.g. 18"
                      placeholderTextColor="#64748B"
                      keyboardType="number-pad"
                      value={jerseyNumber}
                      onChangeText={setJerseyNumber}
                    />
                  </View>

                  {/* Role Selector */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Player Role *</Text>
                    <View style={styles.roleGrid}>
                      {PLAYER_ROLES.map((r) => (
                        <TouchableOpacity
                          key={r.value}
                          style={[
                            styles.roleButton,
                            playerRole === r.value && styles.roleButtonActive,
                          ]}
                          onPress={() => setPlayerRole(r.value)}
                        >
                          <Ionicons
                            name={r.icon as any}
                            size={16}
                            color={playerRole === r.value ? '#0F1117' : '#FFFFFF'}
                          />
                          <Text
                            style={[
                              styles.roleButtonText,
                              playerRole === r.value && styles.roleButtonTextActive,
                            ]}
                          >
                            {r.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Batting Style */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Batting Style</Text>
                    <View style={styles.choiceRow}>
                      {BATTING_STYLES.map((bs) => (
                        <TouchableOpacity
                          key={bs}
                          style={[
                            styles.choiceBtn,
                            battingStyle === bs && styles.choiceBtnActive,
                          ]}
                          onPress={() => setBattingStyle(bs)}
                        >
                          <Text
                            style={[
                              styles.choiceBtnText,
                              battingStyle === bs && styles.choiceBtnTextActive,
                            ]}
                          >
                            {bs}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Bowling Style */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Bowling Style</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
                      {BOWLING_STYLES.map((bw) => (
                        <TouchableOpacity
                          key={bw}
                          style={[
                            styles.choiceBtn,
                            bowlingStyle === bw && styles.choiceBtnActive,
                          ]}
                          onPress={() => setBowlingStyle(bw)}
                        >
                          <Text
                            style={[
                              styles.choiceBtnText,
                              bowlingStyle === bw && styles.choiceBtnTextActive,
                            ]}
                          >
                            {bw}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={styles.savePlayerBtn}
                    onPress={handleManualAddPlayer}
                    disabled={submittingPlayer}
                    activeOpacity={0.85}
                  >
                    {submittingPlayer ? (
                      <ActivityIndicator color="#0F1117" size="small" />
                    ) : (
                      <Text style={styles.savePlayerBtnText}>ADD TO SQUAD</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1117',
  },
  centerBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPlusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  teamHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161922',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 16,
  },
  teamHeroLogo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  teamHeroInfo: {
    flex: 1,
    gap: 4,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  teamHeroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    flex: 1,
  },
  heroCodeBadge: {
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.3)',
  },
  heroCodeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  teamHeroMeta: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  teamHeroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202431',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  statPillNum: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#161922',
    borderRadius: 12,
    padding: 4,
    marginTop: 14,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabPillTextActive: {
    color: '#0F1117',
  },
  tabContent: {
    marginTop: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  addPlayerBtnText: {
    color: '#0F1117',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptySquadCard: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  emptySquadTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptySquadText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyAddBtn: {
    marginTop: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    color: '#0F1117',
    fontSize: 12,
    fontWeight: '800',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161922',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  playerAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playerAvatarInitial: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  jerseyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: '#0F1117',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#64748B',
  },
  jerseyBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  playerInfo: {
    flex: 1,
    gap: 3,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  playerCodeBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#D4AF37',
  },
  playerCodeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#D4AF37',
  },
  roleTag: {
    backgroundColor: '#202431',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  playerDetailsText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  deletePlayerBtn: {
    padding: 8,
  },
  statsCard: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  statLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  statVal: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#161922',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSegment: {
    flexDirection: 'row',
    backgroundColor: '#0F1117',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  modalSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  modalSegmentBtnActive: {
    backgroundColor: Colors.primary,
  },
  modalSegmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  modalSegmentTextActive: {
    color: '#0F1117',
  },
  // Search section
  searchSection: {
    gap: 12,
    paddingVertical: 6,
  },
  searchLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202431',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchLoaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  searchLoaderText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  resultsList: {
    gap: 8,
    marginTop: 4,
  },
  resultsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202431',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  resultAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultAvatarInitial: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resultCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultCodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  addToSquadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  addToSquadBtnText: {
    color: '#0F1117',
    fontSize: 11,
    fontWeight: '800',
  },
  alreadyAddedBtn: {
    backgroundColor: '#334155',
  },
  alreadyAddedBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  noResultsBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  noResultsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  noResultsSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  // Manual form
  modalForm: {
    gap: 12,
    paddingVertical: 6,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTextInput: {
    backgroundColor: '#202431',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#202431',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  roleButtonTextActive: {
    color: '#0F1117',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#202431',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  choiceBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  choiceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  choiceBtnTextActive: {
    color: '#0F1117',
  },
  savePlayerBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  savePlayerBtnText: {
    color: '#0F1117',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default TeamDetailScreen;
