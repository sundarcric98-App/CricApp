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
import Colors from '../../constants/colors';
import { completeSignup } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { generateCustomId } from '../../utils/idGenerator';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&q=80',
];

export const SetProfilePinScreen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { pendingMobile, loading, error } = useAppSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);

  // Live auto-generated ID based on first 4 letters of name + 4 digit random number (e.g. SUND4821)
  const previewId = useMemo(() => {
    if (!name.trim()) return 'SUND4821';
    return generateCustomId(name.trim());
  }, [name]);

  const handleCompleteRegistration = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your Full Name.');
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      Alert.alert('PIN Error', 'PIN must be exactly 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PIN and Confirm PIN do not match.');
      return;
    }

    const mobile = pendingMobile || '+919876543210';
    try {
      await dispatch(
        completeSignup({
          mobile,
          name: name.trim(),
          pin,
          profileImage: selectedAvatar,
        })
      ).unwrap();

      Alert.alert(
        'Profile Created!',
        `Welcome ${name}!\nYour CricLive ID is: ${previewId}`,
        [
          {
            text: 'Go to Home',
            onPress: () => router.replace('/(tabs)' as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err || 'Could not complete registration.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Set Profile & 4-Digit PIN</Text>
          <Text style={styles.headerSubtitle}>
            Complete your profile to generate your unique CricLive Player ID
          </Text>
        </View>

        {/* Avatar Selection */}
        <View style={styles.avatarSection}>
          <View style={styles.mainAvatarContainer}>
            <Image source={{ uri: selectedAvatar }} style={styles.mainAvatar} />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color={Colors.surface} />
            </View>
          </View>
          <Text style={styles.avatarLabel}>Choose an Avatar</Text>
          <View style={styles.presetRow}>
            {AVATAR_PRESETS.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedAvatar(uri)}
                style={[
                  styles.presetAvatarBox,
                  selectedAvatar === uri && styles.presetAvatarBoxSelected,
                ]}
                activeOpacity={0.8}
              >
                <Image source={{ uri }} style={styles.presetImage} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dynamic Generated ID Banner */}
        <View style={styles.idCardBanner}>
          <View style={styles.idCardLeft}>
            <Text style={styles.idCardLabel}>YOUR CRICLIVE ID</Text>
            <Text style={styles.idCardCode}>{previewId}</Text>
            <Text style={styles.idCardHint}>
              (First 4 letters + 4-digit unique code)
            </Text>
          </View>
          <View style={styles.idCardRight}>
            <Ionicons name="id-card" size={36} color={Colors.primary} />
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Sundar"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={name}
              onChangeText={setName}
              maxLength={40}
              editable={!loading}
            />
          </View>

          {/* 4-Digit PIN */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Set 4-Digit Security PIN *</Text>
            <View style={styles.pinWrapper}>
              <TextInput
                style={styles.pinInput}
                placeholder="• • • •"
                placeholderTextColor={Colors.onSurfaceVariant}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={!showPin}
                value={pin}
                onChangeText={setPin}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPin(!showPin)}
              >
                <Ionicons
                  name={showPin ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm 4-Digit PIN */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm 4-Digit PIN *</Text>
            <View style={styles.pinWrapper}>
              <TextInput
                style={styles.pinInput}
                placeholder="• • • •"
                placeholderTextColor={Colors.onSurfaceVariant}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={!showPin}
                value={confirmPin}
                onChangeText={setConfirmPin}
                editable={!loading}
              />
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCompleteRegistration}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.surface} size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>COMPLETE SETUP & CONTINUE</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.surface} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainAvatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  mainAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  avatarLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  presetAvatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  presetAvatarBoxSelected: {
    borderColor: Colors.primary,
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  idCardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(78, 222, 163, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.25)',
    marginBottom: 22,
  },
  idCardLeft: {
    flex: 1,
  },
  idCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
  },
  idCardCode: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.onSurface,
    marginTop: 2,
    letterSpacing: 2,
  },
  idCardHint: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  idCardRight: {
    paddingLeft: 12,
  },
  formSection: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37', // Gold accent
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pinWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingRight: 12,
  },
  pinInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 6,
  },
  eyeButton: {
    padding: 6,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    gap: 10,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});

export default SetProfilePinScreen;
