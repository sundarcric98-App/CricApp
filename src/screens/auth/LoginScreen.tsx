import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { loginWithPin, sendWhatsAppOtp, setPendingMobile } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/store';

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [mobile, setMobile] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [isPinMode, setIsPinMode] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleSendOtp = async () => {
    if (!mobile || mobile.trim().length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullMobile = `${countryCode}${mobile.trim().replace(/^0+/, '')}`;
    dispatch(setPendingMobile(fullMobile));

    try {
      const result = await dispatch(sendWhatsAppOtp(fullMobile)).unwrap();
      Alert.alert(
        'WhatsApp OTP Sent',
        `A 4-digit verification code has been sent to your WhatsApp (${fullMobile}).\n\n(Dev Code: ${result.devOtp || '1234'})`,
        [
          {
            text: 'Enter OTP',
            onPress: () => router.push('/auth/verify-otp' as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to send WhatsApp OTP. Please try again.');
    }
  };

  const handlePinLogin = async () => {
    if (!mobile || mobile.trim().length < 10) {
      Alert.alert('Invalid Number', 'Please enter your registered mobile number.');
      return;
    }
    if (!pin || pin.length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter your 4-digit security PIN.');
      return;
    }

    const fullMobile = `${countryCode}${mobile.trim().replace(/^0+/, '')}`;
    try {
      await dispatch(loginWithPin({ mobile: fullMobile, pin })).unwrap();
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      Alert.alert('Login Failed', err || 'Invalid mobile number or PIN.');
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
          { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandSection}>
          <View style={styles.logoBadge}>
            <Ionicons name="baseball" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>CRICLIVEX</Text>
          <Text style={styles.tagline}>Live Scores, Tournaments & Club Management</Text>
        </View>

        {/* Card Form */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{isPinMode ? 'Login with PIN' : 'WhatsApp Sign In'}</Text>
            <Text style={styles.cardSubtitle}>
              {isPinMode
                ? 'Enter your registered mobile number and 4-digit PIN'
                : 'We will send a 4-digit OTP to your WhatsApp number'}
            </Text>
          </View>

          {/* Mobile Number Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number *</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="98765 43210"
                placeholderTextColor={Colors.onSurfaceVariant}
                keyboardType="phone-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setMobile}
                editable={!loading}
              />
            </View>
          </View>

          {/* PIN Input if in PIN mode */}
          {isPinMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>4-Digit PIN *</Text>
              <View style={styles.pinInputContainer}>
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
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isPinMode && styles.pinPrimaryButton]}
            onPress={isPinMode ? handlePinLogin : handleSendOtp}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.surface} size="small" />
            ) : isPinMode ? (
              <>
                <Text style={styles.primaryButtonText}>LOGIN TO ACCOUNT</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.surface} />
              </>
            ) : (
              <>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                <Text style={styles.whatsappButtonText}>GET OTP ON WHATSAPP</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Toggle Login Mode */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.toggleModeButton}
            onPress={() => setIsPinMode(!isPinMode)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPinMode ? 'logo-whatsapp' : 'key-outline'}
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.toggleModeText}>
              {isPinMode ? 'Sign in with WhatsApp OTP' : 'Login with 4-Digit PIN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            By continuing, you agree to CricLiveX Terms of Service & Privacy Policy.
          </Text>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(78, 222, 163, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.onSurface,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37', // Gold accent from screenshots
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  countryCodeBox: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  pinInputContainer: {
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
    letterSpacing: 4,
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
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F2C24',
    borderWidth: 1.5,
    borderColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
    marginTop: 6,
  },
  pinPrimaryButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  whatsappButtonText: {
    color: '#25D366',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    paddingHorizontal: 12,
  },
  toggleModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  toggleModeText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  footerNote: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default LoginScreen;
