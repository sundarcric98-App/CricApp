import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../components/common/Header';
import StandingsTable from '../components/tournament/StandingsTable';
import Colors from '../constants/colors';
import cricketApi from '../services/api';
import { fetchTournamentStandings, setSelectedGroup } from '../store/matchSlice';
import { useAppDispatch, useAppSelector } from '../store/store';
import { Tournament } from '../types/cricket';

export const TournamentScreen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { tournamentStandings, selectedGroup, loading } = useAppSelector(
    (state) => state.matches
  );

  const [activeSegment, setActiveSegment] = useState<'Matches' | 'Teams' | 'Tournaments' | 'Clubs'>('Tournaments');
  const [viewMode, setViewMode] = useState<'banners' | 'standings'>('banners');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [tList] = await Promise.all([
        cricketApi.getTournaments(),
        dispatch(fetchTournamentStandings(undefined)),
      ]);
      setTournaments(tList);
    } catch (err) {
      console.log('Error fetching tournaments', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSegmentChange = (seg: 'Matches' | 'Teams' | 'Tournaments' | 'Clubs') => {
    setActiveSegment(seg);
    if (seg === 'Matches') {
      router.push('/(tabs)' as any);
    } else if (seg === 'Teams') {
      router.push('/teams' as any);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="TOURNAMENTS"
        rightAction={
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setViewMode(viewMode === 'banners' ? 'standings' : 'banners')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={viewMode === 'banners' ? 'podium-outline' : 'images-outline'}
              size={22}
              color={Colors.onSurface}
            />
          </TouchableOpacity>
        }
      />

      {/* Top Filter Pills matching screenshot 2 */}
      <View style={styles.tabsWrapper}>
        <TouchableOpacity
          style={[styles.tabPill, activeSegment === 'Matches' && styles.tabPillActive]}
          onPress={() => handleSegmentChange('Matches')}
        >
          <Text style={[styles.tabPillText, activeSegment === 'Matches' && styles.tabPillTextActive]}>
            Matches
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeSegment === 'Teams' && styles.tabPillActive]}
          onPress={() => handleSegmentChange('Teams')}
        >
          <Text style={[styles.tabPillText, activeSegment === 'Teams' && styles.tabPillTextActive]}>
            Teams
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeSegment === 'Tournaments' && styles.tabPillActive]}
          onPress={() => handleSegmentChange('Tournaments')}
        >
          <Text style={[styles.tabPillText, activeSegment === 'Tournaments' && styles.tabPillTextActive]}>
            Tournaments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeSegment === 'Clubs' && styles.tabPillActive]}
          onPress={() => handleSegmentChange('Clubs')}
        >
          <Text style={[styles.tabPillText, activeSegment === 'Clubs' && styles.tabPillTextActive]}>
            Clubs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Create Tournament Action Button matching screenshot 2 */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.createTournamentBtn}
          onPress={() => router.push('/tournament/create' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.createTournamentBtnText}>CREATE TOURNAMENT</Text>
        </TouchableOpacity>
      </View>

      {/* Content Feed */}
      {viewMode === 'standings' ? (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <StandingsTable
            standings={tournamentStandings}
            selectedGroup={selectedGroup}
            onSelectGroup={(group) => dispatch(setSelectedGroup(group))}
          />
        </View>
      ) : (
        <FlatList
          data={tournaments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadData}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tournamentCard}
              activeOpacity={0.9}
              onPress={() => setViewMode('standings')}
            >
              <Image
                source={{
                  uri:
                    item.bannerUrl ||
                    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
                }}
                style={styles.tournamentBannerImage}
              />
              <View style={styles.cardGradientOverlay} />

              {/* Card Bottom Meta */}
              <View style={styles.cardContent}>
                <View style={styles.badgeRow}>
                  <View style={styles.codeTag}>
                    <Text style={styles.codeTagText}>{item.code || 'MADA8391'}</Text>
                  </View>
                  <View style={styles.ballTypeTag}>
                    <Text style={styles.ballTypeTagText}>{item.ballType || 'Tennis Ball'}</Text>
                  </View>
                </View>

                <Text style={styles.tournamentTitle} numberOfLines={2}>
                  {item.name}
                </Text>

                <Text style={styles.tournamentWinner}>
                  {item.winnerTeam || `${item.clubName || 'Sundar Club'} • ${item.season || '2026'}`}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean aesthetic matching screenshot 2
  },
  filterIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#CBD5E1', // Soft pill
  },
  tabPillActive: {
    backgroundColor: '#1E293B', // Dark active pill
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createTournamentBtn: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  createTournamentBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  tournamentCard: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  tournamentBannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  codeTag: {
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  codeTagText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ballTypeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ballTypeTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  tournamentTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tournamentWinner: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginTop: 2,
  },
});

export default TournamentScreen;
