import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../components/common/EmptyState';
import Header from '../components/common/Header';
import MatchCard from '../components/match/MatchCard';
import StandingsTable from '../components/tournament/StandingsTable';
import Colors from '../constants/colors';
import cricketApi from '../services/api';
import { Match, Team, Tournament, TournamentLeaderStats, TournamentStanding } from '../types/cricket';

type TabType = 'Teams' | 'Matches' | 'Points Table' | 'Leaders' | 'Info';

export const TournamentDetailScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournamentId = Array.isArray(id) ? id[0] : id;

  const [activeTab, setActiveTab] = useState<TabType>('Teams');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [tournamentMatches, setTournamentMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<TournamentStanding[]>([]);
  const [stats, setStats] = useState<TournamentLeaderStats | null>(null);
  const [leaderSubTab, setLeaderSubTab] = useState<'runs' | 'wickets' | 'mvp'>('runs');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);

  const loadTournamentData = useCallback(async () => {
    if (!tournamentId) return;
    try {
      const [tourData, allTeamsList, statsData] = await Promise.all([
        cricketApi.getTournamentById(tournamentId),
        cricketApi.getTeams(),
        cricketApi.getTournamentStats(tournamentId),
      ]);
      setTournament(tourData.tournament);
      setTournamentTeams(tourData.teams);
      setTournamentMatches(tourData.matches);
      setStandings(tourData.standings);
      setAllTeams(allTeamsList);
      setStats(statsData);
    } catch (err) {
      console.log('Error loading tournament detail', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tournamentId]);

  useFocusEffect(
    useCallback(() => {
      loadTournamentData();
    }, [loadTournamentData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadTournamentData();
  };

  const handleAddTeam = async (teamId: string) => {
    if (!tournamentId) return;
    const selectedTeam = allTeams.find((t) => t.id === teamId);
    if (selectedTeam) {
      setTournamentTeams((prev) => [...prev, selectedTeam]);
    }
    setShowAddTeamModal(false);
    try {
      await cricketApi.addTeamToTournament(tournamentId, teamId);
      await loadTournamentData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add team to tournament');
      loadTournamentData();
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
    if (!tournamentId) return;
    Alert.alert('Remove Team', 'Are you sure you want to remove this team from the tournament?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setTournamentTeams((prev) => prev.filter((t) => t.id !== teamId));
          await cricketApi.removeTeamFromTournament(tournamentId, teamId);
          loadTournamentData();
        },
      },
    ]);
  };

  if (loading && !tournament) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <Header showBack title="Tournament Details" />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.container}>
        <Header showBack title="Tournament Details" />
        <EmptyState
          title="Tournament Not Found"
          description="This tournament could not be found or has been removed."
          actionLabel="View Tournaments"
          onAction={() => router.replace('/(tabs)/tournament' as any)}
        />
      </View>
    );
  }

  const availableTeamsToAdd = allTeams.filter(
    (team) => !tournamentTeams.some((tt) => tt.id === team.id)
  );

  const maxTeams = tournament.maxTeams || 8;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <Header
        showBack
        title={tournament.name}
        rightAction={
          <TouchableOpacity
            style={styles.headerPlusBtn}
            onPress={() => router.push('/match/create' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
        }
      />

      {/* TOP SELECTION HEADERS (Sticky Segmented Bar) */}
      <View style={styles.topSelectionHeaderBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topTabsScroll}
        >
          {(
            [
              { id: 'Teams', label: `Teams (${tournamentTeams.length}/${maxTeams})`, icon: 'shield-outline' },
              { id: 'Matches', label: `Matches (${tournamentMatches.length})`, icon: 'baseball-outline' },
              { id: 'Points Table', label: 'Points Table', icon: 'podium-outline' },
              { id: 'Leaders', label: 'Stats & MVP', icon: 'trophy-outline' },
              { id: 'Info', label: 'Rules & Info', icon: 'information-circle-outline' },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.selectionHeaderPill, isActive && styles.selectionHeaderPillActive]}
                onPress={() => setActiveTab(tab.id as TabType)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={15}
                  color={isActive ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.selectionHeaderPillText,
                    isActive && styles.selectionHeaderPillTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
        {/* Tournament Hero Card */}
        <View style={styles.heroCard}>
          <Image
            source={{
              uri:
                tournament.bannerUrl ||
                'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
            }}
            style={styles.heroBanner}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.badgeRow}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{tournament.code}</Text>
              </View>
              <View style={styles.ballBadge}>
                <Text style={styles.ballBadgeText}>{tournament.ballType || 'Leather Ball'}</Text>
              </View>
              <View style={styles.oversBadge}>
                <Text style={styles.oversBadgeText}>
                  {tournament.overs ? `${tournament.overs} Overs` : 'T20'}
                </Text>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeText}>
                  W:{tournament.winPoints ?? 2} T:{tournament.tiePoints ?? 1} L:{tournament.lossPoints ?? 0}
                </Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>{tournament.name}</Text>
            <Text style={styles.heroSubtitle}>
              {tournament.clubName || 'Club'} • {tournament.city || 'City'} • {tournament.season || '2026'}
            </Text>
          </View>
        </View>

        {/* Tab 1: Teams */}
        {activeTab === 'Teams' && (
          <View style={styles.tabContentSection}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={styles.sectionTitle}>Participating Squads</Text>
                <Text style={styles.sectionSubtitle}>
                  {tournamentTeams.length} of {maxTeams} teams registered
                </Text>
              </View>
              {tournamentTeams.length < maxTeams && (
                <TouchableOpacity
                  style={styles.addTeamButton}
                  onPress={() => setShowAddTeamModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addTeamButtonText}>Add Team</Text>
                </TouchableOpacity>
              )}
            </View>

            {tournamentTeams.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="shield-outline" size={40} color="#00695C" />
                <Text style={styles.emptyCardTitle}>No Teams Added Yet</Text>
                <Text style={styles.emptyCardText}>
                  Add up to {maxTeams} participating teams to schedule matches and auto-generate the points table.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => setShowAddTeamModal(true)}
                >
                  <Text style={styles.emptyActionBtnText}>+ Add Participating Team</Text>
                </TouchableOpacity>
              </View>
            ) : (
              tournamentTeams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={styles.teamCard}
                  onPress={() => router.push(`/team/${team.id}` as any)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{
                      uri:
                        team.logoUrl ||
                        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=128&q=80',
                    }}
                    style={styles.teamLogo}
                  />
                  <View style={styles.teamInfo}>
                    <View style={styles.teamNameRow}>
                      <Text style={styles.teamName} numberOfLines={1}>
                        {team.name}
                      </Text>
                      <View style={styles.teamCodeBadge}>
                        <Text style={styles.teamCodeText}>{team.code}</Text>
                      </View>
                    </View>
                    <Text style={styles.teamMeta}>
                      {team.shortName} • {team.city || 'City'} • {team.playersCount || 0} Players
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeIconBtn}
                    onPress={() => handleRemoveTeam(team.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Tab 2: Matches */}
        {activeTab === 'Matches' && (
          <View style={styles.tabContentSection}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={styles.sectionTitle}>Tournament Fixtures</Text>
                <Text style={styles.sectionSubtitle}>
                  {tournamentMatches.length} matches scheduled
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addTeamButton}
                onPress={() => router.push('/match/create' as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addTeamButtonText}>Schedule Match</Text>
              </TouchableOpacity>
            </View>

            {tournamentMatches.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="baseball-outline" size={40} color="#00695C" />
                <Text style={styles.emptyCardTitle}>No Matches Scheduled</Text>
                <Text style={styles.emptyCardText}>
                  Create matches between tournament squads to start live scoring and track stats.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => router.push('/match/create' as any)}
                >
                  <Text style={styles.emptyActionBtnText}>+ Schedule Match</Text>
                </TouchableOpacity>
              </View>
            ) : (
              tournamentMatches.map((m) => <MatchCard key={m.id} match={m} />)
            )}
          </View>
        )}

        {/* Tab 3: Points Table */}
        {activeTab === 'Points Table' && (
          <View style={styles.tabContentSection}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={styles.sectionTitle}>Standings & Net Run Rate</Text>
                <Text style={styles.sectionSubtitle}>
                  Win = {tournament.winPoints ?? 2} pts | Tie = {tournament.tiePoints ?? 1} pt | Loss = {tournament.lossPoints ?? 0} pts
                </Text>
              </View>
            </View>

            {standings.length > 0 ? (
              <StandingsTable
                standings={standings}
                selectedGroup="all"
                onSelectGroup={() => {}}
              />
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="podium-outline" size={40} color="#00695C" />
                <Text style={styles.emptyCardTitle}>Points Table Empty</Text>
                <Text style={styles.emptyCardText}>
                  Add teams and complete matches to automatically generate points and Net Run Rate (NRR).
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Tab 4: Leaders & Stats */}
        {activeTab === 'Leaders' && (
          <View style={styles.tabContentSection}>
            {/* Sub Tabs: Most Runs | Most Wickets | MVP */}
            <View style={styles.leaderSubTabsBar}>
              <TouchableOpacity
                style={[styles.leaderSubTabBtn, leaderSubTab === 'runs' && styles.leaderSubTabBtnActive]}
                onPress={() => setLeaderSubTab('runs')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="flame"
                  size={15}
                  color={leaderSubTab === 'runs' ? '#FFFFFF' : '#E65100'}
                />
                <Text
                  style={[
                    styles.leaderSubTabText,
                    leaderSubTab === 'runs' && styles.leaderSubTabTextActive,
                  ]}
                >
                  Most Runs
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.leaderSubTabBtn, leaderSubTab === 'wickets' && styles.leaderSubTabBtnActive]}
                onPress={() => setLeaderSubTab('wickets')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="flash"
                  size={15}
                  color={leaderSubTab === 'wickets' ? '#FFFFFF' : '#00897B'}
                />
                <Text
                  style={[
                    styles.leaderSubTabText,
                    leaderSubTab === 'wickets' && styles.leaderSubTabTextActive,
                  ]}
                >
                  Most Wickets
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.leaderSubTabBtn, leaderSubTab === 'mvp' && styles.leaderSubTabBtnActive]}
                onPress={() => setLeaderSubTab('mvp')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="trophy"
                  size={15}
                  color={leaderSubTab === 'mvp' ? '#FFFFFF' : '#F59E0B'}
                />
                <Text
                  style={[
                    styles.leaderSubTabText,
                    leaderSubTab === 'mvp' && styles.leaderSubTabTextActive,
                  ]}
                >
                  MVP Impact
                </Text>
              </TouchableOpacity>
            </View>

            {/* Most Runs View */}
            {leaderSubTab === 'runs' && (
              <View style={styles.leadersListContainer}>
                {stats && stats.mostRuns.length > 0 ? (
                  stats.mostRuns.map((p, idx) => {
                    const isPodium = idx < 3;
                    const rankBadgeColor =
                      idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : idx === 2 ? '#B45309' : '#64748B';
                    return (
                      <View
                        key={`runs_${p.playerId}_${idx}`}
                        style={[styles.leaderboardRowCard, isPodium && styles.podiumCard]}
                      >
                        <View style={[styles.rankBadge, { backgroundColor: rankBadgeColor }]}>
                          <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
                        </View>

                        <Image
                          source={{
                            uri:
                              p.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
                          }}
                          style={styles.playerAvatarSmall}
                        />

                        <View style={{ flex: 1, gap: 2 }}>
                          <View style={styles.leaderNameRow}>
                            <Text style={styles.leaderPlayerName} numberOfLines={1}>
                              {p.name}
                            </Text>
                            <View style={styles.teamPillSmall}>
                              <Text style={styles.teamPillSmallText}>{p.teamShort}</Text>
                            </View>
                          </View>
                          <Text style={styles.leaderSubMeta}>
                            {p.innings} Inn • {p.balls} Balls • {p.fours} 4s • {p.sixes} 6s • SR {p.strikeRate}
                          </Text>
                        </View>

                        <View style={styles.scoreHighlightBox}>
                          <Text style={styles.scoreHighlightNum}>{p.runs}</Text>
                          <Text style={styles.scoreHighlightLabel}>RUNS</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons name="flame-outline" size={36} color="#E65100" />
                    <Text style={styles.emptyCardTitle}>No Batting Records Yet</Text>
                    <Text style={styles.emptyCardText}>
                      Top run-scorers and boundary leaders will appear automatically as tournament matches are scored.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Most Wickets View */}
            {leaderSubTab === 'wickets' && (
              <View style={styles.leadersListContainer}>
                {stats && stats.mostWickets.length > 0 ? (
                  stats.mostWickets.map((p, idx) => {
                    const isPodium = idx < 3;
                    const rankBadgeColor =
                      idx === 0 ? '#00897B' : idx === 1 ? '#94A3B8' : idx === 2 ? '#B45309' : '#64748B';
                    return (
                      <View
                        key={`wkts_${p.playerId}_${idx}`}
                        style={[styles.leaderboardRowCard, isPodium && styles.podiumCard]}
                      >
                        <View style={[styles.rankBadge, { backgroundColor: rankBadgeColor }]}>
                          <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
                        </View>

                        <Image
                          source={{
                            uri:
                              p.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
                          }}
                          style={styles.playerAvatarSmall}
                        />

                        <View style={{ flex: 1, gap: 2 }}>
                          <View style={styles.leaderNameRow}>
                            <Text style={styles.leaderPlayerName} numberOfLines={1}>
                              {p.name}
                            </Text>
                            <View style={styles.teamPillSmall}>
                              <Text style={styles.teamPillSmallText}>{p.teamShort}</Text>
                            </View>
                          </View>
                          <Text style={styles.leaderSubMeta}>
                            {p.overs} Ov • {p.maidens} M • {p.runs} R • Econ {p.economy} • Best {p.bestBowling}
                          </Text>
                        </View>

                        <View style={[styles.scoreHighlightBox, { backgroundColor: '#E0F2FE' }]}>
                          <Text style={[styles.scoreHighlightNum, { color: '#0284C7' }]}>{p.wickets}</Text>
                          <Text style={styles.scoreHighlightLabel}>WKTS</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons name="flash-outline" size={36} color="#00897B" />
                    <Text style={styles.emptyCardTitle}>No Bowling Records Yet</Text>
                    <Text style={styles.emptyCardText}>
                      Top wicket-takers and economy leaders will appear automatically as tournament matches are scored.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* MVP View */}
            {leaderSubTab === 'mvp' && (
              <View style={styles.leadersListContainer}>
                {stats && stats.mvp.length > 0 ? (
                  stats.mvp.map((p, idx) => {
                    const isPodium = idx < 3;
                    const rankBadgeColor =
                      idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : idx === 2 ? '#B45309' : '#64748B';
                    return (
                      <View
                        key={`mvp_${p.playerId}_${idx}`}
                        style={[styles.leaderboardRowCard, isPodium && styles.podiumCard]}
                      >
                        <View style={[styles.rankBadge, { backgroundColor: rankBadgeColor }]}>
                          <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
                        </View>

                        <Image
                          source={{
                            uri:
                              p.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
                          }}
                          style={styles.playerAvatarSmall}
                        />

                        <View style={{ flex: 1, gap: 2 }}>
                          <View style={styles.leaderNameRow}>
                            <Text style={styles.leaderPlayerName} numberOfLines={1}>
                              {p.name}
                            </Text>
                            <View style={styles.teamPillSmall}>
                              <Text style={styles.teamPillSmallText}>{p.teamShort}</Text>
                            </View>
                          </View>
                          <Text style={styles.leaderSubMeta}>
                            {p.matches} Mat • {p.runs} Runs • {p.wickets} Wkts • {p.catches} Catches
                          </Text>
                        </View>

                        <View style={[styles.scoreHighlightBox, { backgroundColor: '#FEF3C7' }]}>
                          <Text style={[styles.scoreHighlightNum, { color: '#B45309' }]}>{p.points}</Text>
                          <Text style={styles.scoreHighlightLabel}>PTS</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons name="trophy-outline" size={36} color="#F59E0B" />
                    <Text style={styles.emptyCardTitle}>No MVP Data Yet</Text>
                    <Text style={styles.emptyCardText}>
                      Tournament MVP rankings are computed dynamically from player batting, bowling and fielding impact points.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Tab 5: Info & Rules */}
        {activeTab === 'Info' && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Tournament Configuration</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tournament Code</Text>
              <Text style={styles.infoValue}>{tournament.code}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Organising Club</Text>
              <Text style={styles.infoValue}>{tournament.clubName || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>City / Location</Text>
              <Text style={styles.infoValue}>{tournament.city || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Season</Text>
              <Text style={styles.infoValue}>{tournament.season || '2026'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Format / Overs</Text>
              <Text style={styles.infoValue}>
                {tournament.overs ? `${tournament.overs} Overs` : 'T20'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Max Teams</Text>
              <Text style={styles.infoValue}>{maxTeams} Teams</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ball Type</Text>
              <Text style={styles.infoValue}>{tournament.ballType || 'Leather Ball'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Points System</Text>
              <Text style={styles.infoValue}>
                Win: {tournament.winPoints ?? 2} | Tie: {tournament.tiePoints ?? 1} | Loss: {tournament.lossPoints ?? 0}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Schedule Duration</Text>
              <Text style={styles.infoValue}>
                {tournament.startDate || '-'} to {tournament.endDate || '-'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal: Add Team to Tournament */}
      <Modal
        visible={showAddTeamModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddTeamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Team to Tournament</Text>
              <TouchableOpacity onPress={() => setShowAddTeamModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {availableTeamsToAdd.length > 0 ? (
                availableTeamsToAdd.map((team) => (
                  <View key={team.id} style={styles.availableTeamItem}>
                    <Image
                      source={{
                        uri:
                          team.logoUrl ||
                          'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=128&q=80',
                      }}
                      style={styles.availableTeamLogo}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.availableTeamName}>{team.name}</Text>
                      <Text style={styles.availableTeamMeta}>
                        {team.code} • {team.city || 'Club'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => handleAddTeam(team.id)}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.noMoreTeamsText}>
                  {allTeams.length === 0
                    ? 'No registered teams found. Create a team first to add it here.'
                    : 'All registered teams have already been added to this tournament.'}
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.createNewTeamBtn}
              onPress={() => {
                setShowAddTeamModal(false);
                router.push('/team/create' as any);
              }}
            >
              <Ionicons name="shield-outline" size={18} color="#00695C" />
              <Text style={styles.createNewTeamBtnText}>Create New Team</Text>
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
  topSelectionHeaderBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  topTabsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  selectionHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  selectionHeaderPillActive: {
    backgroundColor: '#00695C',
  },
  selectionHeaderPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  selectionHeaderPillTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  heroBanner: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    padding: 16,
    justifyContent: 'flex-end',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  codeBadge: {
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  codeBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  ballBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ballBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  oversBadge: {
    backgroundColor: '#00695C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  oversBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  pointsBadge: {
    backgroundColor: 'rgba(255, 185, 95, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pointsBadgeText: {
    color: '#FFB95F',
    fontSize: 10,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
    marginTop: 2,
  },
  tabContentSection: {
    gap: 12,
  },
  sectionTitleRow: {
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
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  addTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00695C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  addTeamButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  teamLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teamInfo: {
    flex: 1,
    gap: 2,
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  teamCodeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  teamCodeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  teamMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  removeIconBtn: {
    padding: 8,
  },
  emptyCard: {
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
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyCardText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActionBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#00695C',
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  leaderSubTabsBar: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#E2E8F0',
    padding: 4,
    borderRadius: 14,
  },
  leaderSubTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  leaderSubTabBtnActive: {
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  leaderSubTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  leaderSubTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  leadersListContainer: {
    gap: 10,
    marginTop: 4,
  },
  leaderboardRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  podiumCard: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  playerAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  leaderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leaderPlayerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  teamPillSmall: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  teamPillSmallText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  leaderSubMeta: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  scoreHighlightBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreHighlightNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#B45309',
  },
  scoreHighlightLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
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
  availableTeamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  availableTeamLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  availableTeamName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  availableTeamMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00695C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  noMoreTeamsText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
  createNewTeamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#00695C',
    gap: 8,
  },
  createNewTeamBtnText: {
    color: '#00695C',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default TournamentDetailScreen;
