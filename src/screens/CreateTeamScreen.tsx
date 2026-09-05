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

const LOGO_PRESETS = [
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=256&q=80',
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=256&q=80',
  'https://images.unsplash.com/photo-1531415074868-036b1c5f53ec?w=256&q=80',
  'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=256&q=80',
];

export const CreateTeamScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAppSelector((state: RootState) => state.auth.currentUser);

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [city, setCity] = useState('');
  const [selectedLogo, setSelectedLogo] = useState(LOGO_PRESETS[0]);
  const [loading, setLoading] = useState(false);

  // Live auto-generated team ID (e.g. ALPH9204)
  const previewCode = useMemo(() => {
    if (!name.trim()) return 'TEAM1024';
    return generateCustomId(name.trim());
  }, [name]);

  const handleNameChange = (text: string) => {
    setName(text);
    if (!shortName || shortName.length <= 3) {
      const clean = text.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
      setShortName(clean);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter Team Name.');
      return;
    }

    setLoading(true);
    try {
      const newTeam = await cricketApi.createTeam({
        name: name.trim(),
        shortName: shortName.trim() || name.slice(0, 3).toUpperCase(),
        city: city.trim(),
        logoUrl: selectedLogo,
        createdBy: currentUser?.id,
      });

      Alert.alert(
        'Team Created!',
        `Team "${newTeam.name}" has been created with ID: ${newTeam.code}`,
        [
          {
            text: 'View Teams',
            onPress: () => router.replace('/teams' as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create team');
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
        <Text style={styles.topBarTitle}>Create Team</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Selection & Preview */}
        <View style={styles.logoSection}>
          <View style={styles.logoPreviewBox}>
            <Image source={{ uri: selectedLogo }} style={styles.logoImage} />
            <View style={styles.badgeCode}>
              <Text style={styles.badgeCodeText}>ID: {previewCode}</Text>
            </View>
          </View>
          <Text style={styles.logoLabel}>Choose Team Crest / Logo</Text>
          <View style={styles.logoPresetsRow}>
            {LOGO_PRESETS.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedLogo(uri)}
                style={[
                  styles.presetLogoItem,
                  selectedLogo === uri && styles.presetLogoItemSelected,
                ]}
                activeOpacity={0.8}
              >
                <Image source={{ uri }} style={styles.presetLogoThumb} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Inputs */}
        <View style={styles.formContainer}>
          {/* Team Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Team Name *</Text>
            <TextInput
              style={styles.underlinedInput}
              placeholder="e.g. Alpha Warriors"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={name}
              onChangeText={handleNameChange}
            />
          </View>

          {/* Short Name & City */}
          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Short Code *</Text>
              <TextInput
                style={styles.underlinedInput}
                placeholder="e.g. ALW"
                placeholderTextColor={Colors.onSurfaceVariant}
                maxLength={4}
                autoCapitalize="characters"
                value={shortName}
                onChangeText={setShortName}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1.5 }]}>
              <Text style={styles.fieldLabel}>City / Region</Text>
              <TextInput
                style={styles.underlinedInput}
                placeholder="e.g. Chennai"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>

          {/* Captain / Creator Info */}
          <View style={styles.creatorBadge}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.creatorTitle}>Club Captain / Admin</Text>
              <Text style={styles.creatorSubtitle}>
                {currentUser?.name || 'Sundar'} ({currentUser?.userCode || 'SUND4821'})
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.surface} size="small" />
          ) : (
            <Text style={styles.createButtonText}>CREATE TEAM</Text>
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
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  logoPreviewBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  badgeCode: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  badgeCodeText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  logoLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginBottom: 12,
  },
  logoPresetsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  presetLogoItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetLogoItemSelected: {
    borderColor: Colors.primary,
  },
  presetLogoThumb: {
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
  rowFields: {
    flexDirection: 'row',
    gap: 16,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 222, 163, 0.08)',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.2)',
    marginTop: 8,
  },
  creatorTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creatorSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
    marginTop: 2,
  },
  createButton: {
    marginTop: 24,
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

export default CreateTeamScreen;
