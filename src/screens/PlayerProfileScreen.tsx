import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../components/common/Header';
import PlayerStatCard from '../components/player/PlayerStatCard';
import Colors from '../constants/colors';
import { validateAuthToken } from '../services/api';
import { logout } from '../store/authSlice';
import { fetchPlayerProfile } from '../store/matchSlice';
import { useAppDispatch, useAppSelector } from '../store/store';
import { Player } from '../types/cricket';

export const PlayerProfileScreen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = useLocalSearchParams<{ id: string }>();
  const externalPlayerId = Array.isArray(id) ? id[0] : id;

  const { currentUser, token, isAuthenticated } = useAppSelector((state) => state.auth);
  const { selectedPlayer, loading } = useAppSelector((state) => state.matches);

  const [copiedToast, setCopiedToast] = useState(false);

  // If no external ID is passed, or if external ID matches current user, show current user profile
  const isMyProfile = !externalPlayerId || externalPlayerId === currentUser?.id;

  useEffect(() => {
    if (externalPlayerId && !isMyProfile) {
      dispatch(fetchPlayerProfile(externalPlayerId));
    }
  }, [dispatch, externalPlayerId, isMyProfile]);

  // Token validation status
  const tokenValidation = useMemo(() => {
    return validateAuthToken(token);
  }, [token]);

  // Handle Log Out Action
  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of CricLiveX? Your active session token will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            // Empties token, resets auth state, and clears HTTP client headers
            dispatch(logout());
            router.replace('/auth/login' as any);
          },
        },
      ]
    );
  };

  const handleCopyPlayerId = () => {
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
    Alert.alert(
      'Player ID Copied!',
      `Your Player ID (${currentUser?.userCode || 'yuv123'}) can now be shared with captains to add you to teams.`
    );
  };

  // Fallback player object if viewing external player
  const player: Player = selectedPlayer || {
    id: externalPlayerId || 'p_kohli',
    name: 'Virat Kohli',
    shortName: 'V Kohli',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
    teamId: 'team_blr',
    role: 'batsman' as const,
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    country: 'India',
    jerseyNumber: 18,
    careerStats: {
      matches: 252,
      runs: 8004,
      average: 38.6,
      strikeRate: 131.9,
      highestScore: 113,
      fifties: 55,
      hundreds: 8,
      wickets: 4,
      economy: 8.8,
      bestBowling: '2/25',
    },
    recentInnings: [
      { match: 'vs MUM', runs: 68, balls: 42, isOut: false, date: '2025-05-24' },
      { match: 'vs CHE', runs: 47, balls: 29, isOut: true, date: '2025-05-18' },
      { match: 'vs DEL', runs: 92, balls: 54, isOut: false, date: '2025-05-12' },
    ],
  };

  // ==========================================
  // VIEW 1: EXTERNAL PLAYER PROFILE
  // ==========================================
  if (!isMyProfile) {
    return (
      <View style={styles.container}>
        <Header showBack title="Player Profile" />
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => externalPlayerId && dispatch(fetchPlayerProfile(externalPlayerId))}
              tintColor={Colors.primary}
            />
          }
        >
          <PlayerStatCard player={player} />
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // VIEW 2: LOGGED-OUT STATE
  // ==========================================
  if (!isAuthenticated || !currentUser) {
    return (
      <View style={styles.container}>
        <Header title="My Account" />
        <View style={styles.loggedOutBox}>
          <View style={styles.loggedOutIconBox}>
            <Ionicons name="person-outline" size={48} color="#94A3B8" />
          </View>
          <Text style={styles.loggedOutTitle}>Not Signed In</Text>
          <Text style={styles.loggedOutSubtitle}>
            Sign in to view your unique Player ID, track career statistics, and manage your club squads.
          </Text>
          <TouchableOpacity
            style={styles.loginRedirectBtn}
            onPress={() => router.push('/auth/login' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.loginRedirectBtnText}>SIGN IN / REGISTER</Text>
            <Ionicons name="arrow-forward" size={18} color="#0F1117" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ==========================================
  // VIEW 3: LOGGED-IN USER ACCOUNT & PROFILE
  // ==========================================
  return (
    <View style={styles.container}>
      <Header
        title="My Profile & Account"
        rightAction={
          <TouchableOpacity
            style={styles.headerLogoutIconBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF5252" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Hero Profile Card */}
        <View style={styles.userHeroCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={{
                uri:
                  currentUser.profileImage ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
              }}
              style={styles.avatarImg}
            />
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.userHeroInfo}>
            <Text style={styles.userNameText}>{currentUser.name}</Text>
            {currentUser.username ? (
              <Text style={styles.userHandleText}>@{currentUser.username}</Text>
            ) : null}
            <Text style={styles.userEmailText}>
              {currentUser.email || currentUser.mobile || 'Registered Player'}
            </Text>
          </View>
        </View>

        {/* Player ID Card with Copy Feature */}
        <View style={styles.playerIdCard}>
          <View style={styles.playerIdHeaderRow}>
            <View style={styles.idLabelGroup}>
              <Ionicons name="id-card-outline" size={16} color="#D4AF37" />
              <Text style={styles.playerIdTitle}>OFFICIAL PLAYER ID</Text>
            </View>
            <TouchableOpacity
              style={styles.copyIdButton}
              onPress={handleCopyPlayerId}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copiedToast ? 'checkmark-circle' : 'copy-outline'}
                size={14}
                color={copiedToast ? Colors.primary : '#FFFFFF'}
              />
              <Text style={[styles.copyIdButtonText, copiedToast && { color: Colors.primary }]}>
                {copiedToast ? 'Copied' : 'Copy ID'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.codeDisplayRow}>
            <Text style={styles.codeText}>{currentUser.userCode || 'yuv123'}</Text>
          </View>

          <Text style={styles.codeHintText}>
            💡 Share this ID ({currentUser.userCode || 'yuv123'}) with captains and tournament organizers to add you to their starting XI.
          </Text>
        </View>

        {/* Token Status & Security Card */}
        <View style={styles.tokenStatusCard}>
          <View style={styles.tokenStatusRow}>
            <View style={styles.tokenBadgeLeft}>
              <View
                style={[
                  styles.tokenStatusDot,
                  { backgroundColor: tokenValidation.valid ? Colors.primary : '#FF5252' },
                ]}
              />
              <Text style={styles.tokenStatusTitle}>
                {tokenValidation.valid ? 'Active Session Token' : 'Session Expired'}
              </Text>
            </View>
            <Text style={styles.tokenBadgeText}>
              {tokenValidation.valid ? 'VALIDATED' : 'INVALID'}
            </Text>
          </View>

          <Text style={styles.tokenHintText}>
            Token:{' '}
            <Text style={{ color: '#94A3B8', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
              {token ? `${token.slice(0, 16)}...` : 'None'}
            </Text>
          </Text>
        </View>

        {/* Quick Career Stats Overview */}
        <View style={styles.statsCard}>
          <Text style={styles.cardSectionTitle}>Career Aggregates</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: Colors.primary }]}>384</Text>
              <Text style={styles.statLabel}>Runs</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>38.4</Text>
              <Text style={styles.statLabel}>Batting Avg</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#D4AF37' }]}>148.2</Text>
              <Text style={styles.statLabel}>Strike Rate</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>7</Text>
              <Text style={styles.statLabel}>Wickets</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>6.8</Text>
              <Text style={styles.statLabel}>Economy</Text>
            </View>
          </View>
        </View>

        {/* Quick Navigation / Management Options */}
        <View style={styles.quickLinksCard}>
          <Text style={styles.cardSectionTitle}>Quick Management</Text>

          <TouchableOpacity
            style={styles.quickLinkItem}
            onPress={() => router.push('/teams' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.quickLinkIconBox}>
              <Ionicons name="people-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.quickLinkText}>My Teams & Squads</Text>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLinkItem}
            onPress={() => router.push('/tournament/create' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.quickLinkIconBox}>
              <Ionicons name="trophy-outline" size={18} color="#D4AF37" />
            </View>
            <Text style={styles.quickLinkText}>Host a New Tournament</Text>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLinkItem}
            onPress={() => router.push('/team/create' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.quickLinkIconBox}>
              <Ionicons name="shield-outline" size={18} color="#38BDF8" />
            </View>
            <Text style={styles.quickLinkText}>Create a New Cricket Team</Text>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* LOG OUT BUTTON */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF5252" />
          <Text style={styles.logoutButtonText}>LOG OUT ACCOUNT</Text>
        </TouchableOpacity>

        <Text style={styles.footerVersion}>CricLiveX Scoring Engine v1.0.0 • Secure Token Auth</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1117',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 40,
    gap: 14,
  },
  headerLogoutIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // User Hero Card
  userHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161922',
    borderRadius: 20,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: '#202431',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#161922',
  },
  userHeroInfo: {
    flex: 1,
    gap: 3,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userHandleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  userEmailText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  // Player ID Card
  playerIdCard: {
    backgroundColor: '#161922',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    gap: 10,
  },
  playerIdHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  idLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerIdTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  copyIdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
  },
  copyIdButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  codeDisplayRow: {
    backgroundColor: '#0F1117',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.25)',
  },
  codeText: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 3,
  },
  codeHintText: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  // Token Status Card
  tokenStatusCard: {
    backgroundColor: '#161922',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  tokenStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tokenStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tokenStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tokenBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  tokenHintText: {
    fontSize: 11,
    color: '#64748B',
  },
  // Career Stats
  statsCard: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    width: '31%',
    backgroundColor: '#202431',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  // Quick Links
  quickLinksCard: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  quickLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202431',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  quickLinkIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderWidth: 1.5,
    borderColor: '#FF5252',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
  },
  logoutButtonText: {
    color: '#FF5252',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  footerVersion: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  // Logged-out State
  loggedOutBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  loggedOutIconBox: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  loggedOutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loggedOutSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  loginRedirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  loginRedirectBtnText: {
    color: '#0F1117',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default PlayerProfileScreen;
