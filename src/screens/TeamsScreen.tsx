import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import Colors from '../constants/colors';
import cricketApi from '../services/api';
import { useAppSelector } from '../store/store';
import { Team } from '../types/cricket';

export const TeamsScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [activeTab, setActiveTab] = useState<'Statistics' | 'Matches' | 'Teams' | 'Tournaments'>('Teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await cricketApi.getTeams(currentUser?.id);
      setTeams(data);
    } catch (err) {
      console.log('Error loading teams', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [currentUser?.id]);

  const handleTabChange = (tab: 'Statistics' | 'Matches' | 'Teams' | 'Tournaments') => {
    setActiveTab(tab);
    if (tab === 'Matches') {
      router.push('/(tabs)' as any);
    } else if (tab === 'Tournaments') {
      router.push('/(tabs)/tournament' as any);
    } else if (tab === 'Statistics') {
      router.push('/(tabs)/profile' as any);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="MY TEAMS" showBack onBackPress={() => router.back()} />

      {/* Segment Category Pills matching screenshot 3 */}
      <View style={styles.tabsWrapper}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'Statistics' && styles.tabPillActive]}
          onPress={() => handleTabChange('Statistics')}
        >
          <Text style={[styles.tabPillText, activeTab === 'Statistics' && styles.tabPillTextActive]}>
            Statistics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'Matches' && styles.tabPillActive]}
          onPress={() => handleTabChange('Matches')}
        >
          <Text style={[styles.tabPillText, activeTab === 'Matches' && styles.tabPillTextActive]}>
            Matches
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'Teams' && styles.tabPillActive]}
          onPress={() => handleTabChange('Teams')}
        >
          <Text style={[styles.tabPillText, activeTab === 'Teams' && styles.tabPillTextActive]}>
            Teams
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'Tournaments' && styles.tabPillActive]}
          onPress={() => handleTabChange('Tournaments')}
        >
          <Text style={[styles.tabPillText, activeTab === 'Tournaments' && styles.tabPillTextActive]}>
            Tournaments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : teams.length === 0 ? (
        /* Empty State matching Screenshot 3 */
        <View style={styles.emptyContainer}>
          {/* Umpire Icon Illustration */}
          <View style={styles.umpireIllustration}>
            {/* Hat */}
            <View style={styles.umpireHat} />
            <View style={styles.umpireHatBrim} />
            {/* Head */}
            <View style={styles.umpireHead} />
            {/* Body & Tie */}
            <View style={styles.umpireBodyContainer}>
              <View style={styles.umpireArmLeft} />
              <View style={styles.umpireTorso}>
                <View style={styles.umpireTie} />
              </View>
              <View style={styles.umpireArmRight} />
            </View>
            {/* Legs */}
            <View style={styles.umpireLegsContainer}>
              <View style={styles.umpireLeg} />
              <View style={styles.umpireLeg} />
            </View>
          </View>

          <Text style={styles.emptyTitle}>No Teams</Text>
          <Text style={styles.emptySubtitle}>The player is not part of any team.</Text>

          <TouchableOpacity
            style={styles.createTeamButton}
            onPress={() => router.push('/team/create' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.createTeamButtonText}>Create a team</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* List of Teams */
        <View style={styles.listWrapper}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listCountText}>{teams.length} Registered Teams</Text>
            <TouchableOpacity
              style={styles.createSmallBtn}
              onPress={() => router.push('/team/create' as any)}
            >
              <Ionicons name="add" size={16} color={Colors.surface} />
              <Text style={styles.createSmallBtnText}>Create Team</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={teams}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={loadTeams}
                tintColor={Colors.primary}
              />
            }
            renderItem={({ item }) => (
              <View style={styles.teamCard}>
                <Image
                  source={{
                    uri:
                      item.logoUrl ||
                      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=128&q=80',
                  }}
                  style={styles.teamLogo}
                />
                <View style={styles.teamInfo}>
                  <View style={styles.teamTitleRow}>
                    <Text style={styles.teamName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeText}>{item.code}</Text>
                    </View>
                  </View>
                  <Text style={styles.teamMeta}>
                    {item.shortName} • {item.city || 'Club'} • {item.playersCount || 11} Squad Members
                  </Text>
                </View>
                <TouchableOpacity style={styles.teamActionBtn}>
                  <Ionicons name="chevron-forward" size={20} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean white background matching reference screenshot 3
  },
  tabsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#E2E8F0', // Soft grey
  },
  tabPillActive: {
    backgroundColor: '#2D3748', // Dark active pill matching screenshot
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  // Umpire Silhouette Illustration CSS
  umpireIllustration: {
    width: 100,
    height: 140,
    alignItems: 'center',
    marginBottom: 24,
  },
  umpireHat: {
    width: 26,
    height: 12,
    backgroundColor: '#2D3748',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  umpireHatBrim: {
    width: 44,
    height: 4,
    backgroundColor: '#2D3748',
    borderRadius: 2,
    marginBottom: 4,
  },
  umpireHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2D3748',
    marginBottom: 2,
  },
  umpireBodyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  umpireArmLeft: {
    width: 26,
    height: 8,
    backgroundColor: '#2D3748',
    borderRadius: 4,
    marginTop: 6,
    transform: [{ rotate: '-10deg' }],
  },
  umpireTorso: {
    width: 32,
    height: 44,
    backgroundColor: '#2D3748',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignItems: 'center',
  },
  umpireTie: {
    width: 6,
    height: 14,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
    borderRadius: 2,
  },
  umpireArmRight: {
    width: 8,
    height: 30,
    backgroundColor: '#2D3748',
    borderRadius: 4,
    marginTop: 2,
  },
  umpireLegsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  umpireLeg: {
    width: 10,
    height: 38,
    backgroundColor: '#2D3748',
    borderRadius: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  createTeamButton: {
    backgroundColor: '#0D9488', // Teal button matching screenshot 3
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  createTeamButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A5568',
  },
  createSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  createSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  teamInfo: {
    flex: 1,
    marginLeft: 14,
  },
  teamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    flexShrink: 1,
  },
  codeBadge: {
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
  },
  teamMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  teamActionBtn: {
    padding: 6,
  },
});

export default TeamsScreen;
