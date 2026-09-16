import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import cricketApi from '../services/api';
import { logout } from '../store/authSlice';
import { fetchPlayerProfile } from '../store/matchSlice';
import { useAppDispatch, useAppSelector } from '../store/store';
import { Player, PlayerRole } from '../types/cricket';

export const PlayerProfileScreen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = useLocalSearchParams<{ id: string }>();
  const externalPlayerId = Array.isArray(id) ? id[0] : id;

  const { currentUser, isAuthenticated } = useAppSelector((state) => state.auth);
  const { selectedPlayer, loading } = useAppSelector((state) => state.matches);

  const [copiedToast, setCopiedToast] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit Bio Form State
  const [editRole, setEditRole] = useState<PlayerRole>('allrounder');
  const [editBattingStyle, setEditBattingStyle] = useState<string>('Right-hand Bat');
  const [editBowlingStyle, setEditBowlingStyle] = useState<string>('Right-arm Medium');

  // If no external ID is passed, or if external ID matches current user, show current user profile
  const isMyProfile = !externalPlayerId || externalPlayerId === currentUser?.id;

  useEffect(() => {
    if (externalPlayerId && !isMyProfile) {
      dispatch(fetchPlayerProfile(externalPlayerId));
    } else if (currentUser?.id) {
      dispatch(fetchPlayerProfile(currentUser.id));
    }
  }, [dispatch, externalPlayerId, isMyProfile, currentUser?.id]);

  useEffect(() => {
    if (selectedPlayer) {
      setEditRole((selectedPlayer.role as any) || 'allrounder');
      setEditBattingStyle(selectedPlayer.battingStyle || 'Right-hand Bat');
      setEditBowlingStyle(selectedPlayer.bowlingStyle || 'Right-arm Medium');
    }
  }, [selectedPlayer]);

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

  // Construct active profile player
  const currentUserName = currentUser?.name || 'Player';
  const currentUserCode = currentUser?.userCode || 'PL1001';
  const currentUserAvatar =
    currentUser?.profileImage ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80';

  const emptyFormatBatting = {
    matches: 0,
    innings: 0,
    runs: 0,
    balls: 0,
    highest: '-',
    average: 0,
    strikeRate: 0,
    fours: 0,
    sixes: 0,
    fifties: 0,
    hundreds: 0,
  };

  const emptyFormatBowling = {
    matches: 0,
    innings: 0,
    balls: 0,
    runs: 0,
    maidens: 0,
    wickets: 0,
    average: 0,
    economy: 0,
    strikeRate: 0,
    fourWickets: 0,
    fiveWickets: 0,
  };

  const profilePlayer: Player = selectedPlayer || {
    id: currentUser?.id || externalPlayerId || 'p_local',
    name: currentUserName,
    shortName: currentUserName
      .split(' ')
      .map((w, i) => (i === 0 ? w[0] + '.' : w))
      .join(' '),
    avatar: currentUserAvatar,
    teamId: 'team_01',
    userCode: currentUserCode,
    role: 'allrounder',
    battingStyle: 'Right-hand Bat',
    bowlingStyle: 'Right-arm Medium',
    country: 'India',
    flag: '🇮🇳',
    born: 'Registered Player',
    birthPlace: 'Local Club',
    jerseyNumber: 18,
    careerStats: {
      matches: 0,
      innings: 0,
      runs: 0,
      average: 0,
      strikeRate: 0,
      highestScore: 0,
      fifties: 0,
      hundreds: 0,
      wickets: 0,
      overs: 0,
      economy: 0,
      bestBowling: '0/0',
      catches: 0,
      stumpings: 0,
      battingByFormat: {
        test: emptyFormatBatting,
        odi: emptyFormatBatting,
        t20: emptyFormatBatting,
        ipl: emptyFormatBatting,
      },
      bowlingByFormat: {
        test: emptyFormatBowling,
        odi: emptyFormatBowling,
        t20: emptyFormatBowling,
        ipl: emptyFormatBowling,
      },
    },
    battingForm: [],
    bowlingForm: [],
    rankings: {
      batting: [
        { format: 'Test', currentRank: '--', bestRank: '--' },
        { format: 'ODI', currentRank: '--', bestRank: '--' },
        { format: 'T20I', currentRank: '--', bestRank: '--' },
      ],
      bowling: [
        { format: 'Test', currentRank: '--', bestRank: '--' },
        { format: 'ODI', currentRank: '--', bestRank: '--' },
        { format: 'T20I', currentRank: '--', bestRank: '--' },
      ],
      allRounder: [
        { format: 'Test', currentRank: '--', bestRank: '--' },
        { format: 'ODI', currentRank: '--', bestRank: '--' },
        { format: 'T20I', currentRank: '--', bestRank: '--' },
      ],
    },
    recentInnings: [],
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.id) return;
    setIsSaving(true);
    try {
      await cricketApi.updatePlayerProfile(currentUser.id, {
        role: editRole,
        battingStyle: editBattingStyle,
        bowlingStyle: editBowlingStyle,
      });
      dispatch(fetchPlayerProfile(currentUser.id));
      setShowEditModal(false);
      Alert.alert('Profile Updated', 'Your playing role and styles have been saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const roleOptions: { key: PlayerRole; label: string; icon: string }[] = [
    { key: 'batsman', label: 'Top-order Batter', icon: 'baseball-outline' },
    { key: 'bowler', label: 'Bowler', icon: 'flash-outline' },
    { key: 'allrounder', label: 'Allrounder', icon: 'flame-outline' },
    { key: 'wicketkeeper', label: 'Wicketkeeper Batter', icon: 'shield-checkmark-outline' },
  ];

  const battingStyleOptions = [
    'Right-hand Bat',
    'Left-hand Bat',
  ];

  const bowlingStyleOptions = [
    'Right-arm Fast',
    'Right-arm Medium',
    'Right-arm Off Break',
    'Right-arm Leg Break',
    'Left-arm Fast',
    'Left-arm Orthodox',
    'Left-arm Chinaman',
  ];

  // 1. LOGGED-OUT STATE
  if (!isAuthenticated && isMyProfile) {
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

  // 2. PROFILE VIEW (MY PROFILE OR EXTERNAL PLAYER)
  return (
    <View style={styles.container}>
      <Header
        showBack={!isMyProfile}
        title={isMyProfile ? 'Player Details' : 'Player Details'}
        rightAction={
          isMyProfile ? (
            <TouchableOpacity
              style={styles.headerLogoutIconBtn}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color="#FF5252" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              const targetId = isMyProfile ? currentUser?.id : externalPlayerId;
              if (targetId) dispatch(fetchPlayerProfile(targetId));
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Full Rich Player Stat Card */}
        <PlayerStatCard player={profilePlayer} />

        {/* If My Profile, show Edit Playing Skills Button */}
        {isMyProfile && (
          <TouchableOpacity
            style={styles.editSkillsBtn}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={styles.editSkillsBtnText}>Edit Role, Batting & Bowling Style</Text>
          </TouchableOpacity>
        )}

        {/* If My Profile, show Player ID Copy card & Quick Management Links */}
        {isMyProfile && currentUser ? (
          <>
            {/* Player ID Card with Copy Feature */}
            <View style={styles.playerIdCard}>
              <View style={styles.playerIdHeaderRow}>
                <View style={styles.idLabelGroup}>
                  <Ionicons name="id-card-outline" size={16} color="#D4AF37" />
                  <Text style={styles.playerIdTitle}>YOUR PLAYER ID</Text>
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

            <Text style={styles.footerVersion}>CricLiveX Scoring Engine • Official Profile View</Text>
          </>
        ) : null}
      </ScrollView>

      {/* Edit Bio & Skills Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Player Bio & Skills</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* 1. Playing Role */}
              <Text style={styles.modalSectionLabel}>PLAYING ROLE</Text>
              <View style={styles.chipGrid}>
                {roleOptions.map((opt) => {
                  const isSelected = editRole === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.chipItem, isSelected && styles.chipItemActive]}
                      onPress={() => setEditRole(opt.key)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={14}
                        color={isSelected ? '#0F1117' : '#94A3B8'}
                      />
                      <Text
                        style={[styles.chipItemText, isSelected && styles.chipItemTextActive]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. Batting Style */}
              <Text style={styles.modalSectionLabel}>BATTING STYLE</Text>
              <View style={styles.chipGrid}>
                {battingStyleOptions.map((style) => {
                  const isSelected = editBattingStyle === style;
                  return (
                    <TouchableOpacity
                      key={style}
                      style={[styles.chipItem, isSelected && styles.chipItemActive]}
                      onPress={() => setEditBattingStyle(style)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.chipItemText, isSelected && styles.chipItemTextActive]}
                      >
                        {style}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 3. Bowling Style */}
              <Text style={styles.modalSectionLabel}>BOWLING STYLE</Text>
              <View style={styles.chipGrid}>
                {bowlingStyleOptions.map((style) => {
                  const isSelected = editBowlingStyle === style;
                  return (
                    <TouchableOpacity
                      key={style}
                      style={[styles.chipItem, isSelected && styles.chipItemActive]}
                      onPress={() => setEditBowlingStyle(style)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.chipItemText, isSelected && styles.chipItemTextActive]}
                      >
                        {style}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.saveProfileBtn}
              onPress={handleSaveProfile}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator color="#0F1117" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#0F1117" />
                  <Text style={styles.saveProfileBtnText}>Save Bio & Skills</Text>
                </>
              )}
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
  // Player ID Card
  playerIdCard: {
    backgroundColor: '#161922',
    borderRadius: 16,
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
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 3,
  },
  codeHintText: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
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
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  quickLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2432',
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
  editSkillsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00695C',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editSkillsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // Edit Profile Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#161922',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2330',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  chipItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  chipItemTextActive: {
    color: '#0F1117',
    fontWeight: '800',
  },
  saveProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveProfileBtnText: {
    color: '#0F1117',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
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
