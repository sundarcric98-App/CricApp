import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { RootState, useAppSelector } from '../store/store';
import { formatDateForPostgres } from '../utils/dateUtils';
import { generateCustomId } from '../utils/idGenerator';

const BANNER_PRESETS = [
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531415074868-036b1c5f53ec?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512719994953-eabf50895df7?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=80',
];

const OVERS_OPTIONS = [5, 10, 15, 20, 50];
const TEAMS_OPTIONS = [4, 6, 8, 10, 12, 16];

export const CreateTournamentScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAppSelector((state: RootState) => state.auth.currentUser);

  const [name, setName] = useState('');
  const [clubName, setClubName] = useState(currentUser ? `${currentUser.name}'s Club` : "Premier Cricket Club");
  const [city, setCity] = useState('');
  const [season, setSeason] = useState('2026');
  const [overs, setOvers] = useState<number>(20);
  const [customOvers, setCustomOvers] = useState<string>('');
  const [maxTeams, setMaxTeams] = useState<number>(8);
  const [winPoints, setWinPoints] = useState<number>(2);
  const [tiePoints, setTiePoints] = useState<number>(1);
  const [lossPoints, setLossPoints] = useState<number>(0);
  const [startDate, setStartDate] = useState('18-09-2026');
  const [endDate, setEndDate] = useState('28-09-2026');
  const [ballType, setBallType] = useState<'Leather Ball' | 'Tennis Ball' | 'Tape Ball'>('Leather Ball');
  const [selectedBanner, setSelectedBanner] = useState(BANNER_PRESETS[0]);
  const [loading, setLoading] = useState(false);

  // Live auto-generated tournament ID (first 4 letters + 4-digit random number)
  const previewCode = useMemo(() => {
    if (!name.trim()) return 'TOUR2026';
    return generateCustomId(name.trim());
  }, [name]);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter Tournament Name.');
      return;
    }
    if (!clubName.trim()) {
      Alert.alert('Required', 'Please enter Club/Organisation Name.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Required', 'Please enter City.');
      return;
    }

    const effectiveOvers = (customOvers && parseInt(customOvers, 10) > 0)
      ? parseInt(customOvers, 10)
      : overs;

    const formattedStart = formatDateForPostgres(startDate) || '2026-09-18';
    const formattedEnd = formatDateForPostgres(endDate) || '2026-09-28';

    setLoading(true);
    try {
      const newTournament = await cricketApi.createTournament({
        name: name.trim(),
        clubName: clubName.trim(),
        city: city.trim(),
        season: season.trim(),
        overs: effectiveOvers,
        matchType: `${effectiveOvers} Overs (${effectiveOvers >= 50 ? 'ODI' : 'T20'})`,
        maxTeams,
        winPoints,
        tiePoints,
        lossPoints,
        startDate: formattedStart,
        endDate: formattedEnd,
        ballType,
        bannerUrl: selectedBanner,
        createdBy: currentUser?.id,
      });

      Alert.alert(
        'Tournament Created!',
        `"${newTournament.name}" has been created with Code: ${newTournament.code}.\n\nManage participating teams, fixtures, and track real-time points table.`,
        [
          {
            text: 'Open Tournament Dashboard',
            onPress: () => router.replace(`/tournament/${newTournament.id}` as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Top App Header */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Create Tournament</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Banner Preview & Selector */}
        <View style={styles.bannerSection}>
          <Text style={styles.sectionLabel}>Tournament Banner Graphic *</Text>
          <View style={styles.bannerPreviewContainer}>
            <Image source={{ uri: selectedBanner }} style={styles.bannerPreviewImage} />
            <View style={styles.bannerOverlayBadge}>
              <Text style={styles.bannerCodeText}>ID: {previewCode}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bannerPresetsRow}>
            {BANNER_PRESETS.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedBanner(uri)}
                style={[
                  styles.presetBannerBox,
                  selectedBanner === uri && styles.presetBannerBoxSelected,
                ]}
                activeOpacity={0.8}
              >
                <Image source={{ uri }} style={styles.presetBannerThumb} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Tournament Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tournament Name *</Text>
            <TextInput
              style={styles.underlinedInput}
              placeholder="e.g. Champions Premier Trophy"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Club/Organisation Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Club/Organisation Name *</Text>
            <TextInput
              style={styles.underlinedInput}
              placeholder="e.g. Premier Sports Club"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={clubName}
              onChangeText={setClubName}
            />
          </View>

          {/* City */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>City / Location *</Text>
            <TextInput
              style={styles.underlinedInput}
              placeholder="e.g. Chennai"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={city}
              onChangeText={setCity}
            />
          </View>

          {/* Season / Year */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Season / Year *</Text>
            <TextInput
              style={styles.underlinedInput}
              placeholder="e.g. 2026"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={season}
              onChangeText={setSeason}
            />
          </View>

          {/* Tournament Overs Per Match */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Format & Overs Per Match *</Text>
            <View style={styles.oversGrid}>
              {OVERS_OPTIONS.map((num) => {
                const isSelected = !customOvers && overs === num;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[styles.overButton, isSelected && styles.overButtonActive]}
                    onPress={() => {
                      setOvers(num);
                      setCustomOvers('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.overButtonText,
                        isSelected && styles.overButtonTextActive,
                      ]}
                    >
                      {num} Ov {num === 20 ? '(T20)' : num === 50 ? '(ODI)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Overs Input (e.g. 7 overs, 8 overs, etc.) */}
            <View style={styles.customOversContainer}>
              <Text style={styles.customOversLabel}>Or Type Custom Overs:</Text>
              <TextInput
                style={styles.customOversInput}
                placeholder="e.g. 7, 8, 12 overs"
                placeholderTextColor={Colors.onSurfaceVariant}
                keyboardType="numeric"
                value={customOvers}
                onChangeText={(val) => {
                  setCustomOvers(val);
                  const parsed = parseInt(val, 10);
                  if (!isNaN(parsed) && parsed > 0) {
                    setOvers(parsed);
                  }
                }}
              />
            </View>
          </View>

          {/* Define Number of Teams */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Number of Participating Teams *</Text>
            <View style={styles.oversGrid}>
              {TEAMS_OPTIONS.map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.overButton, maxTeams === num && styles.overButtonActive]}
                  onPress={() => setMaxTeams(num)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.overButtonText,
                      maxTeams === num && styles.overButtonTextActive,
                    ]}
                  >
                    {num} Teams
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dates Row */}
          <View style={styles.datesRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Start Date</Text>
              <TextInput
                style={styles.underlinedInput}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>End Date</Text>
              <TextInput
                style={styles.underlinedInput}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          {/* Ball Type */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Ball Type *</Text>
            <View style={styles.ballTypeRow}>
              {(['Leather Ball', 'Tennis Ball', 'Tape Ball'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.ballTypeButton,
                    ballType === type && styles.ballTypeButtonActive,
                  ]}
                  onPress={() => setBallType(type)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.ballTypeText,
                      ballType === type && styles.ballTypeTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.surface} size="small" />
          ) : (
            <Text style={styles.createButtonText}>CREATE TOURNAMENT</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161922',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
  },
  bannerSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  bannerPreviewContainer: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bannerPreviewImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlayBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  bannerCodeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  bannerPresetsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetBannerBox: {
    width: 70,
    height: 45,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetBannerBoxSelected: {
    borderColor: Colors.primary,
  },
  presetBannerThumb: {
    width: '100%',
    height: '100%',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  underlinedInput: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    color: Colors.onSurface,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  oversGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  overButton: {
    flex: 1,
    minWidth: '28%',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  overButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  overButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  overButtonTextActive: {
    color: Colors.onPrimary,
  },
  customOversContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  customOversLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  customOversInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.onSurface,
    fontSize: 14,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pointChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  pointChipValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  ballTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  ballTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ballTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ballTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  ballTypeTextActive: {
    color: Colors.onPrimary,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: Colors.onPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default CreateTournamentScreen;
