import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
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
import cricketSocket from '../services/socket';
import {
  fetchMatches,
  handleRealtimeScoreUpdate,
  setSelectedStatus,
} from '../store/matchSlice';
import { useAppDispatch, useAppSelector } from '../store/store';
import { Match, MatchStatus } from '../types/cricket';

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { matches, selectedStatus, loading } = useAppSelector((state) => state.matches);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const loadData = useCallback(() => {
    dispatch(fetchMatches(selectedStatus));
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
        {/* Matches Section Header matching Screenshot 1 */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Matches</Text>
          <TouchableOpacity
            style={styles.chevronButton}
            onPress={() => router.push('/(tabs)/tournament' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={18} color="#0F172A" />
            <Ionicons name="chevron-forward" size={18} color="#0F172A" style={{ marginLeft: -12 }} />
          </TouchableOpacity>
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
                Live ({liveMatches.length || 2})
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
                Upcoming ({upcomingMatches.length || 4})
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
                Completed ({completedMatches.length || 6})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Live Matches Carousel / Card */}
        {loading && matches.length === 0 ? (
          <MatchCardSkeleton />
        ) : featuredMatch ? (
          <FeaturedMatchCard match={featuredMatch} />
        ) : displayedMatches.length > 0 ? (
          <MatchCard match={displayedMatches[0]} />
        ) : (
          <EmptyState
            title={`No ${selectedStatus} matches`}
            description="There are currently no matches scheduled in this category."
          />
        )}

        {/* Profile Card Section matching Screenshot 1 */}
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
                uri: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=256&q=80',
              }}
              style={styles.profileShieldImage}
            />
          </View>

          {/* Right: Stats Section */}
          <View style={styles.profileStatsBox}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileNameText}>{currentUser?.name || 'Sundar'}</Text>
              <View style={styles.profileCodeBadge}>
                <Text style={styles.profileCodeBadgeText}>{currentUser?.userCode || 'SUND4821'}</Text>
              </View>
            </View>
            <View style={styles.profileDivider} />

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Matches</Text>
                <Text style={styles.statValue}>4</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Runs</Text>
                <Text style={styles.statValue}>13</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Tournaments Section matching Screenshot 1 */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Tournaments</Text>
          <TouchableOpacity
            style={styles.chevronButton}
            onPress={() => router.push('/(tabs)/tournament' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={18} color="#0F172A" />
            <Ionicons name="chevron-forward" size={18} color="#0F172A" style={{ marginLeft: -12 }} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.tournamentBannerCard}
          onPress={() => router.push('/(tabs)/tournament' as any)}
          activeOpacity={0.9}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
            }}
            style={styles.tournamentBannerImg}
          />
          <View style={styles.bannerOverlay}>
            <View style={styles.bannerTagRow}>
              <View style={styles.seasonTag}>
                <Text style={styles.seasonTagText}>SEASON - 10</Text>
              </View>
              <View style={styles.teamsLimitTag}>
                <Text style={styles.teamsLimitTagText}>08 TEAMS ONLY</Text>
              </View>
            </View>

            <Text style={styles.bannerTournamentTitle}>MADATUGAMA FRIENDSHIP TROPHY</Text>
            <Text style={styles.bannerDateText}>05TH SEP 2026 (SATURDAY)</Text>
          </View>
        </TouchableOpacity>

        {/* Secondary matches if any */}
        {secondaryMatches.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitleSmall}>Other Matches</Text>
            {secondaryMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </View>
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
  // Profile Card Widget styles matching Screenshot 1
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
    backgroundColor: '#00695C', // Teal tone matching Screenshot 1
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
  // Tournaments Banner matching Screenshot 1
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
});

export default HomeScreen;
