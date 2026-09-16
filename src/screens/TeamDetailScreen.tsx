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
import { Match, Player, PlayerRole, Team } from '../types/cricket';

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

  const handleAddPlayer = async () => {
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
            onPress={() => setShowAddPlayerModal(true)}
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

        {/* Tab 1: Squad / Players */}
        {activeTab === 'Squad' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Registered Players</Text>
              <TouchableOpacity
                style={styles.addPlayerBtn}
                onPress={() => setShowAddPlayerModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addPlayerBtnText}>Add Player</Text>
              </TouchableOpacity>
            </View>

            {players.length === 0 ? (
              <View style={styles.emptySquadCard}>
                <Ionicons name="people-outline" size={42} color="#00695C" />
                <Text style={styles.emptySquadTitle}>No Players in Squad</Text>
                <Text style={styles.emptySquadText}>
                  Add batsmen, bowlers, and all-rounders to form the starting XI and bench.
                </Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => setShowAddPlayerModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyAddBtnText}>+ Add First Player</Text>
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

        {/* Tab 2: Matches */}
        {activeTab === 'Matches' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Team Fixtures & History</Text>
              <TouchableOpacity
                style={styles.addPlayerBtn}
                onPress={() => router.push('/match/create' as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addPlayerBtnText}>Create Match</Text>
              </TouchableOpacity>
            </View>

            {matches.length === 0 ? (
              <View style={styles.emptySquadCard}>
                <Ionicons name="baseball-outline" size={42} color="#00695C" />
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

        {/* Tab 3: Stats */}
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

      {/* Modal: Add Player to Team */}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Player to Squad</Text>
              <TouchableOpacity onPress={() => setShowAddPlayerModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <View style={styles.modalForm}>
                {/* Player Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Player Full Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Virat Kohli"
                    placeholderTextColor="#94A3B8"
                    value={playerName}
                    onChangeText={setPlayerName}
                  />
                </View>

                {/* Jersey Number */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Jersey Number (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 18"
                    placeholderTextColor="#94A3B8"
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
                          color={playerRole === r.value ? '#FFFFFF' : '#0F172A'}
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
              </View>
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.savePlayerBtn}
              onPress={handleAddPlayer}
              disabled={submittingPlayer}
              activeOpacity={0.85}
            >
              {submittingPlayer ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.savePlayerBtnText}>ADD TO SQUAD</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  headerPlusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  teamHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  teamHeroLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#00695C',
  },
  teamHeroInfo: {
    flex: 1,
    gap: 3,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamHeroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  heroCodeBadge: {
    backgroundColor: 'rgba(78, 222, 163, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  heroCodeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  teamHeroMeta: {
    fontSize: 12,
    color: '#94A3B8',
  },
  teamHeroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statPillNum: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  statPillLabel: {
    color: '#94A3B8',
    fontSize: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  tabPillActive: {
    backgroundColor: '#0F172A',
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
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
    color: '#0F172A',
  },
  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00695C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  addPlayerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptySquadCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptySquadTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySquadText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyAddBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#00695C',
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  playerAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#00695C',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playerAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  jerseyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
  },
  jerseyBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  playerInfo: {
    flex: 1,
    gap: 2,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  playerDetailsText: {
    fontSize: 11,
    color: '#64748B',
  },
  deletePlayerBtn: {
    padding: 8,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  statVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalForm: {
    gap: 14,
    paddingVertical: 8,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  roleButtonActive: {
    backgroundColor: '#00695C',
    borderColor: '#00695C',
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  choiceBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  choiceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  choiceBtnTextActive: {
    color: '#FFFFFF',
  },
  savePlayerBtn: {
    backgroundColor: '#00695C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePlayerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default TeamDetailScreen;
