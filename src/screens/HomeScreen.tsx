import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import EmptyState from '../components/common/EmptyState';
import Header from '../components/common/Header';
import { MatchCardSkeleton } from '../components/common/LoadingSkeleton';
import FeaturedMatchCard from '../components/match/FeaturedMatchCard';
import MatchCard from '../components/match/MatchCard';
import Colors from '../constants/colors';
import cricketApi from '../services/api';
import cricketSocket from '../services/socket';
import {
  fetchMatches,
  handleRealtimeScoreUpdate,
  setSelectedStatus,
} from '../store/matchSlice';
import { useAppDispatch, useAppSelector } from '../store/store';
import { Match, MatchStatus, Tournament } from '../types/cricket';

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { matches, selectedStatus, loading } = useAppSelector((state) => state.matches);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  const loadData = useCallback(async () => {
    dispatch(fetchMatches(selectedStatus));
    try {
      const tourList = await cricketApi.getTournaments();
      setTournaments(tourList);
    } catch (e) {
      console.log('Error loading tournaments', e);
    }
  }, [dispatch, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Connect socket listener for live real-time score updates
  useEffect(() => {
    cricketSocket.connect();
    const unsubscribe = cricketSocket.onScoreUpdate((data) => {
      dispatch(handleRealtimeScoreUpdate(data));
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  const liveMatches = matches.filter((m) => m.status === 'live');
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming');
  const completedMatches = matches.filter((m) => m.status === 'completed');

  const displayedMatches =
    selectedStatus === 'live'
      ? liveMatches
      : selectedStatus === 'upcoming'
      ? upcomingMatches
      : completedMatches;

  const featuredMatch = selectedStatus === 'live' && liveMatches.length > 0 ? liveMatches[0] : null;
  const secondaryMatches =
    selectedStatus === 'live' && featuredMatch
      ? liveMatches.slice(1)
      : displayedMatches;

  const handleSelectStatus = (status: MatchStatus) => {
    dispatch(setSelectedStatus(status));
    dispatch(fetchMatches(status));
  };

  const latestTournament = tournaments.length > 0 ? tournaments[0] : null;

  return (
    <View style={styles.container}>
      <Header />

      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.feedContainer}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Quick Match Hero Banner */}
        <TouchableOpacity
          style={styles.quickMatchBanner}
          onPress={() => router.push('/match/quick' as any)}
          activeOpacity={0.88}
        >
          <View style={styles.quickMatchBannerLeft}>
            <View style={styles.quickMatchIconBox}>
              <Ionicons name="flash" size={22} color="#F59E0B" />
            </View>
            <View style={styles.quickMatchBannerTextBox}>
              <View style={styles.quickMatchTagRow}>
                <Text style={styles.quickMatchTag}>⚡ QUICK MATCH</Text>
                <Text style={styles.quickMatchTagSub}>• Instant Squads</Text>
              </View>
              <Text style={styles.quickMatchTitle}>Team A vs Team B</Text>
              <Text style={styles.quickMatchSubtitle}>
                Add teams, player names on the fly & start live scoring
              </Text>
            </View>
          </View>
          <View style={styles.quickMatchArrowBtn}>
            <Ionicons name="chevron-forward" size={18} color="#0B0D13" />
          </View>
        </TouchableOpacity>

        {/* Matches Section Header with Quick Match & Create Match Action */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithCount}>
            <Text style={styles.sectionTitle}>Matches</Text>
          </View>
          <View style={styles.headerActionsRow}>
            <TouchableOpacity
              style={styles.quickMatchActionBtn}
              onPress={() => router.push('/match/quick' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="flash" size={13} color="#F59E0B" />
              <Text style={styles.quickMatchActionText}>Quick Match</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createActionBtn}
              onPress={() => router.push('/match/create' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.createActionText}>Create Match</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chevronButton}
              onPress={() => router.push('/(tabs)/tournament' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color="#0F172A" />
              <Ionicons name="chevron-forward" size={18} color="#0F172A" style={{ marginLeft: -12 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented Status Tabs */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            <TouchableOpacity
              style={[styles.statusTab, selectedStatus === 'live' && styles.statusTabLive]}
              onPress={() => handleSelectStatus('live')}
              activeOpacity={0.8}
            >
              {selectedStatus === 'live' && <View style={styles.tabLiveDot} />}
              <Text
                style={[
                  styles.statusTabText,
                  selectedStatus === 'live' && styles.statusTabTextActive,
                ]}
              >
                Live ({liveMatches.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusTab, selectedStatus === 'upcoming' && styles.statusTabActive]}
              onPress={() => handleSelectStatus('upcoming')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.statusTabText,
                  selectedStatus === 'upcoming' && styles.statusTabTextActive,
                ]}
              >
                Upcoming ({upcomingMatches.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusTab, selectedStatus === 'completed' && styles.statusTabActive]}
              onPress={() => handleSelectStatus('completed')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.statusTabText,
                  selectedStatus === 'completed' && styles.statusTabTextActive,
                ]}
              >
                Completed ({completedMatches.length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Matches Carousels / Cards based on status */}
        {loading && matches.length === 0 ? (
          <MatchCardSkeleton />
        ) : selectedStatus === 'live' ? (
          liveMatches.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalSliderContainer}
            >
              {liveMatches.map((m) => (
                <View key={`live_slider_${m.id}`} style={styles.horizontalMatchItem}>
                  <FeaturedMatchCard match={m} />
                </View>
              ))}
            </ScrollView>
          ) : liveMatches.length === 1 ? (
            <FeaturedMatchCard match={liveMatches[0]} />
          ) : (
            <EmptyState
              title="No live matches in progress"
              description="Start live scoring on a scheduled match or create a new fixture."
              actionLabel="Create Match"
              onAction={() => router.push('/match/create' as any)}
            />
          )
        ) : selectedStatus === 'upcoming' ? (
          upcomingMatches.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalSliderContainer}
            >
              {upcomingMatches.map((m) => (
                <View key={`up_slider_${m.id}`} style={styles.horizontalMatchItem}>
                  <MatchCard match={m} />
                </View>
              ))}
            </ScrollView>
          ) : upcomingMatches.length === 1 ? (
            <MatchCard match={upcomingMatches[0]} />
          ) : (
            <EmptyState
              title="No upcoming matches"
              description="Schedule a new fixture for your tournament or club."
              actionLabel="Schedule Match"
              onAction={() => router.push('/match/create' as any)}
            />
          )
        ) : (
          completedMatches.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalSliderContainer}
            >
              {completedMatches.map((m) => (
                <View key={`comp_slider_${m.id}`} style={styles.horizontalMatchItem}>
                  <MatchCard match={m} />
                </View>
              ))}
            </ScrollView>
          ) : completedMatches.length === 1 ? (
            <MatchCard match={completedMatches[0]} />
          ) : (
            <EmptyState
              title="No completed matches"
              description="Finished fixtures with scorecards and results will appear here."
              actionLabel="Create Match"
              onAction={() => router.push('/match/create' as any)}
            />
          )
        )}

        {/* Profile Card Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Profile</Text>
        </View>

        <TouchableOpacity
          style={styles.profileWidgetCard}
          onPress={() => router.push('/(tabs)/profile' as any)}
          activeOpacity={0.85}
        >
          {/* Left: Avatar Shield Badge */}
          <View style={styles.profileAvatarBox}>
            <Image
              source={{
                uri:
                  currentUser?.profileImage ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
              }}
              style={styles.profileShieldImage}
            />
          </View>

          {/* Right: Stats Section */}
          <View style={styles.profileStatsBox}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileNameText}>{currentUser?.name || 'Player'}</Text>
              {currentUser?.userCode ? (
                <View style={styles.profileCodeBadge}>
                  <Text style={styles.profileCodeBadgeText}>{currentUser.userCode}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.profileDivider} />

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Matches</Text>
                <Text style={styles.statValue}>{matches.length}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Tournaments</Text>
                <Text style={styles.statValue}>{tournaments.length}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Tournaments Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Tournaments</Text>
          <View style={styles.headerActionsRow}>
            <TouchableOpacity
              style={styles.createActionBtn}
              onPress={() => router.push('/tournament/create' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.createActionText}>Create Tournament</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chevronButton}
              onPress={() => router.push('/(tabs)/tournament' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color="#0F172A" />
              <Ionicons name="chevron-forward" size={18} color="#0F172A" style={{ marginLeft: -12 }} />
            </TouchableOpacity>
          </View>
        </View>

        {tournaments.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalSliderContainer}
          >
            {tournaments.map((t) => (
              <TouchableOpacity
                key={`tour_slider_${t.id}`}
                style={styles.tournamentCarouselCard}
                onPress={() => router.push(`/tournament/${t.id}` as any)}
                activeOpacity={0.9}
              >
                <Image
                  source={{
                    uri:
                      t.bannerUrl ||
                      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
                  }}
                  style={styles.tournamentBannerImg}
                />
                <View style={styles.bannerOverlay}>
                  <View style={styles.bannerTagRow}>
                    <View style={styles.seasonTag}>
                      <Text style={styles.seasonTagText}>{t.season || '2026'}</Text>
                    </View>
                    <View style={styles.teamsLimitTag}>
                      <Text style={styles.teamsLimitTagText}>{t.ballType || 'LEATHER BALL'}</Text>
                    </View>
                    <View style={[styles.teamsLimitTag, { backgroundColor: 'rgba(0, 105, 92, 0.7)' }]}>
                      <Text style={styles.teamsLimitTagText}>{t.overs ? `${t.overs} Ov` : 'T20'}</Text>
                    </View>
                  </View>

                  <Text style={styles.bannerTournamentTitle} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Text style={styles.bannerDateText} numberOfLines={1}>
                    {t.startDate ? `${t.startDate} • ` : ''}
                    {t.clubName || t.city || 'Championship'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : latestTournament ? (
          <TouchableOpacity
            style={styles.tournamentBannerCard}
            onPress={() => router.push(`/tournament/${latestTournament.id}` as any)}
            activeOpacity={0.9}
          >
            <Image
              source={{
                uri:
                  latestTournament.bannerUrl ||
                  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
              }}
              style={styles.tournamentBannerImg}
            />
            <View style={styles.bannerOverlay}>
              <View style={styles.bannerTagRow}>
                <View style={styles.seasonTag}>
                  <Text style={styles.seasonTagText}>{latestTournament.season || '2026'}</Text>
                </View>
                <View style={styles.teamsLimitTag}>
                  <Text style={styles.teamsLimitTagText}>{latestTournament.ballType || 'LEATHER BALL'}</Text>
                </View>
                <View style={[styles.teamsLimitTag, { backgroundColor: 'rgba(0, 105, 92, 0.7)' }]}>
                  <Text style={styles.teamsLimitTagText}>
                    {latestTournament.overs ? `${latestTournament.overs} Overs` : 'T20'}
                  </Text>
                </View>
              </View>

              <Text style={styles.bannerTournamentTitle}>{latestTournament.name}</Text>
              <Text style={styles.bannerDateText}>
                {latestTournament.startDate ? `${latestTournament.startDate} • ` : ''}
                {latestTournament.clubName || latestTournament.city || 'Championship'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.emptyTournamentCard}
            onPress={() => router.push('/tournament/create' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="trophy-outline" size={32} color="#00695C" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.emptyTournamentTitle}>Create Your First Tournament</Text>
              <Text style={styles.emptyTournamentSubtitle}>
                Add teams, schedule matches and manage points table
              </Text>
            </View>
            <View style={styles.smallPlusBtn}>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  feedContainer: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionTitleSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  quickMatchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  quickMatchBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickMatchIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  quickMatchBannerTextBox: {
    flex: 1,
    gap: 2,
  },
  quickMatchTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickMatchTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  quickMatchTagSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  quickMatchTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  quickMatchSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 14,
  },
  quickMatchArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickMatchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  quickMatchActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  createActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00695C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  createActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chevronButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  tabsWrapper: {
    marginBottom: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    gap: 6,
  },
  statusTabLive: {
    backgroundColor: '#0F172A',
  },
  statusTabActive: {
    backgroundColor: '#0F172A',
  },
  tabLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  statusTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statusTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  // Profile Card Widget styles
  profileWidgetCard: {
    flexDirection: 'row',
    height: 110,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileAvatarBox: {
    width: 100,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  profileShieldImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
  },
  profileStatsBox: {
    flex: 1,
    backgroundColor: '#00695C',
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  profileCodeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  profileCodeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  profileDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  // Horizontal Sliders
  horizontalSliderContainer: {
    paddingRight: 16,
    gap: 12,
  },
  horizontalMatchItem: {
    width: 320,
  },
  tournamentCarouselCard: {
    width: 300,
    height: 190,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  // Tournaments Banner
  tournamentBannerCard: {
    width: '100%',
    height: 190,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  tournamentBannerImg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
    justifyContent: 'flex-end',
  },
  bannerTagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  seasonTag: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  seasonTagText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  teamsLimitTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  teamsLimitTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  bannerTournamentTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bannerDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
    marginTop: 3,
  },
  emptyTournamentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: 14,
  },
  emptyTournamentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyTournamentSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  smallPlusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00695C',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
