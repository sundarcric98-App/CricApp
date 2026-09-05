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
import { generateCustomId } from '../utils/idGenerator';

const BANNER_PRESETS = [
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531415074868-036b1c5f53ec?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512719994953-eabf50895df7?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop&q=80',
];

export const CreateTournamentScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAppSelector((state: RootState) => state.auth.currentUser);

  const [name, setName] = useState('');
  const [clubName, setClubName] = useState(currentUser ? `${currentUser.name}'s Club` : "Sundar's Club");
  const [city, setCity] = useState('');
  const [season, setSeason] = useState('2026');
  const [startDate, setStartDate] = useState('05-09-2026');
  const [endDate, setEndDate] = useState('15-09-2026');
  const [ballType, setBallType] = useState<'Leather Ball' | 'Tennis Ball'>('Leather Ball');
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

    setLoading(true);
    try {
      const newTournament = await cricketApi.createTournament({
        name: name.trim(),
        clubName: clubName.trim(),
        city: city.trim(),
        season: season.trim(),
        startDate,
        endDate,
        ballType,
        bannerUrl: selectedBanner,
        createdBy: currentUser?.id,
      });

      Alert.alert(
        'Tournament Created!',
        `"${newTournament.name}" has been created with ID: ${newTournament.code}`,
        [
          {
            text: 'View Tournaments',
            onPress: () => router.replace('/(tabs)/tournament' as any),
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

        {/* Form Fields matching screenshot reference */}
        <View style={styles.formContainer}>
          {/* Tournament Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tournament Name *</Text>
            <TextInput
              style={styles.underlinedInput}
              placeholder="e.g. Madatugama Friendship Trophy"
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
              placeholder="e.g. Sundar's Club"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={clubName}
              onChangeText={setClubName}
            />
          </View>

          {/* City */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>City *</Text>
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

          {/* Ball Type Buttons */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Ball Type *</Text>
            <View style={styles.ballTypeRow}>
              <TouchableOpacity
                style={[
                  styles.ballTypeButton,
                  ballType === 'Leather Ball' && styles.ballTypeButtonActive,
                ]}
                onPress={() => setBallType('Leather Ball')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.ballTypeText,
                    ballType === 'Leather Ball' && styles.ballTypeTextActive,
                  ]}
                >
                  Leather Ball
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ballTypeButton,
                  ballType === 'Tennis Ball' && styles.ballTypeButtonActive,
                ]}
                onPress={() => setBallType('Tennis Ball')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.ballTypeText,
                    ballType === 'Tennis Ball' && styles.ballTypeTextActive,
                  ]}
                >
                  Tennis Ball
                </Text>
              </TouchableOpacity>
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
    fontWeight: '700',
    color: Colors.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bannerSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  bannerPreviewContainer: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  bannerCodeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bannerPresetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  presetBannerBox: {
    width: 70,
    height: 44,
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
    marginTop: 8,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 6,
  },
  underlinedInput: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 0,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  ballTypeRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  ballTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
  },
  ballTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
  },
  ballTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  ballTypeTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  createButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default CreateTournamentScreen;
