import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import {
  clearAuthError,
  loginWithPin,
  sendWhatsAppOtp,
  setPendingMobile,
  signIn,
  signUp,
} from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { generatePlayerIdFromUsername } from '../../utils/idGenerator';

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { loading, error } = useAppSelector((state) => state.auth);

  // Active Auth Mode: 'signin' | 'signup' | 'otp' | 'pin'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'otp' | 'pin'>('signin');

  // Sign In Form State
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up Form State
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // WhatsApp & PIN Mode State
  const [mobile, setMobile] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Success Modal for Generated Player ID
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newlyCreatedCode, setNewlyCreatedCode] = useState('');
  const [newlyCreatedUsername, setNewlyCreatedUsername] = useState('');

  // Real-time Preview of Generated Player ID
  const previewPlayerId = useMemo(() => {
    if (!signUpUsername.trim()) return 'yuv123';
    return generatePlayerIdFromUsername(signUpUsername.trim());
  }, [signUpUsername]);

  const handleTabChange = (mode: 'signin' | 'signup') => {
    dispatch(clearAuthError());
    setAuthMode(mode);
  };

  // ==========================================
  // 1. SIGN UP HANDLER
  // ==========================================
  const handleSignUp = async () => {
    const cleanUsername = signUpUsername.trim().toLowerCase();
    const cleanEmail = signUpEmail.trim().toLowerCase();
    const cleanPassword = signUpPassword.trim();
    const cleanName = signUpName.trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters long.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!cleanPassword || cleanPassword.length < 4) {
      Alert.alert('Invalid Password', 'Password must be at least 4 characters long.');
      return;
    }

    try {
      const result = await dispatch(
        signUp({
          username: cleanUsername,
          email: cleanEmail,
          password: cleanPassword,
          name: cleanName || cleanUsername,
        })
      ).unwrap();

      // Generated Player ID (e.g. yuv123)
      const generatedCode = result.userCode;
      setNewlyCreatedCode(generatedCode);
      setNewlyCreatedUsername(cleanUsername);

      // Pre-fill Sign In identifier with generated Player ID or username
      setSignInIdentifier(generatedCode);
      setSignInPassword(cleanPassword);

      // Show congratulations modal with generated Player ID
      setShowSuccessModal(true);
    } catch (err: any) {
      Alert.alert('Registration Failed', err || 'Unable to register user.');
    }
  };

  // Close Success Modal and navigate to Sign In tab
  const handleSuccessModalDismiss = () => {
    setShowSuccessModal(false);
    setAuthMode('signin');
  };

  // ==========================================
  // 2. SIGN IN HANDLER
  // ==========================================
  const handleSignIn = async () => {
    const cleanIdentifier = signInIdentifier.trim();
    const cleanPassword = signInPassword.trim();

    if (!cleanIdentifier) {
      Alert.alert('Required', 'Please enter your Email, Username, or Player ID (e.g. yuv123).');
      return;
    }

    if (!cleanPassword) {
      Alert.alert('Required', 'Please enter your Password.');
      return;
    }

    try {
      await dispatch(
        signIn({
          identifier: cleanIdentifier,
          password: cleanPassword,
        })
      ).unwrap();

      // Navigate to main app
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      Alert.alert('Sign In Failed', err || 'Invalid credentials.');
    }
  };

  // ==========================================
  // 3. WHATSAPP & PIN LOGIN HANDLERS
  // ==========================================
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24) + 120,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={true}
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

        {/* Main Card Form */}
        <View style={styles.formCard}>
          {/* Segmented Tab Switcher (Sign In vs Sign Up) */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                (authMode === 'signin' || authMode === 'otp' || authMode === 'pin') &&
                  styles.segmentButtonActive,
              ]}
              onPress={() => handleTabChange('signin')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  (authMode === 'signin' || authMode === 'otp' || authMode === 'pin') &&
                    styles.segmentTextActive,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentButton, authMode === 'signup' && styles.segmentButtonActive]}
              onPress={() => handleTabChange('signup')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, authMode === 'signup' && styles.segmentTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* ============================================================== */}
          {/* TAB 1: SIGN UP VIEW */}
          {/* ============================================================== */}
          {authMode === 'signup' && (
            <View style={styles.tabContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Create Player Account</Text>
                <Text style={styles.cardSubtitle}>
                  Register your account and receive your unique Player ID
                </Text>
              </View>

              {/* Username Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Username *</Text>
                  {signUpUsername.trim().length >= 2 && (
                    <View style={styles.idPreviewBadge}>
                      <Text style={styles.idPreviewLabel}>PLAYER ID:</Text>
                      <Text style={styles.idPreviewVal}>{previewPlayerId}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="at-outline" size={18} color={Colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. yuvi"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={signUpUsername}
                    onChangeText={setSignUpUsername}
                    editable={!loading}
                  />
                </View>
                <Text style={styles.fieldHint}>
                  First 3 letters + 3 random digits generate your Player ID (e.g.{' '}
                  <Text style={{ color: Colors.primary, fontWeight: '700' }}>{previewPlayerId}</Text>
                  )
                </Text>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={18} color={Colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. yuvi@example.com"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={signUpEmail}
                    onChangeText={setSignUpEmail}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Full Name Input (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name (Optional)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={18} color={Colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Yuvraj Singh"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    value={signUpName}
                    onChangeText={setSignUpName}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Create a strong password"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    secureTextEntry={!showSignUpPassword}
                    value={signUpPassword}
                    onChangeText={setSignUpPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowSignUpPassword(!showSignUpPassword)}
                  >
                    <Ionicons
                      name={showSignUpPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={Colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* Sign Up Action Button */}
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryActionText}>SIGN UP & GET PLAYER ID</Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.surface} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.subModeLink}
                onPress={() => handleTabChange('signin')}
                activeOpacity={0.7}
              >
                <Text style={styles.subModeLinkText}>
                  Already have an account? <Text style={{ color: Colors.primary }}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ============================================================== */}
          {/* TAB 2: SIGN IN VIEW */}
          {/* ============================================================== */}
          {authMode === 'signin' && (
            <View style={styles.tabContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Welcome Back</Text>
                <Text style={styles.cardSubtitle}>
                  Sign in using your Email, Username, or Player ID
                </Text>
              </View>

              {/* Identifier Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email / Username / Player ID *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-circle-outline" size={18} color={Colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. yuv123, yuvi, or email"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={signInIdentifier}
                    onChangeText={setSignInIdentifier}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    secureTextEntry={!showSignInPassword}
                    value={signInPassword}
                    onChangeText={setSignInPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowSignInPassword(!showSignInPassword)}
                  >
                    <Ionicons
                      name={showSignInPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={Colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* Sign In Action Button */}
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={handleSignIn}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryActionText}>SIGN IN</Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.surface} />
                  </>
                )}
              </TouchableOpacity>

              {/* Alternative Sign In Modes */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR LOGIN WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.altButtonsRow}>
                <TouchableOpacity
                  style={styles.altModeButton}
                  onPress={() => setAuthMode('otp')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                  <Text style={styles.altModeButtonText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.altModeButton}
                  onPress={() => setAuthMode('pin')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="key-outline" size={16} color={Colors.primary} />
                  <Text style={styles.altModeButtonText}>4-Digit PIN</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* TAB 3: WHATSAPP OTP VIEW */}
          {/* ============================================================== */}
          {authMode === 'otp' && (
            <View style={styles.tabContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>WhatsApp Sign In</Text>
                <Text style={styles.cardSubtitle}>
                  We will send a 4-digit verification code to your WhatsApp number
                </Text>
              </View>

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

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={styles.whatsappPrimaryButton}
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                    <Text style={styles.whatsappButtonText}>GET OTP ON WHATSAPP</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.subModeLink}
                onPress={() => setAuthMode('signin')}
                activeOpacity={0.7}
              >
                <Text style={styles.subModeLinkText}>
                  Back to <Text style={{ color: Colors.primary }}>Standard Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ============================================================== */}
          {/* TAB 4: PIN LOGIN VIEW */}
          {/* ============================================================== */}
          {authMode === 'pin' && (
            <View style={styles.tabContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Login with PIN</Text>
                <Text style={styles.cardSubtitle}>
                  Enter your registered mobile number and 4-digit PIN
                </Text>
              </View>

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

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>4-Digit PIN *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="key-outline" size={18} color={Colors.onSurfaceVariant} />
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
                      size={18}
                      color={Colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={handlePinLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryActionText}>LOGIN TO ACCOUNT</Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.surface} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.subModeLink}
                onPress={() => setAuthMode('signin')}
                activeOpacity={0.7}
              >
                <Text style={styles.subModeLinkText}>
                  Back to <Text style={{ color: Colors.primary }}>Standard Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            By continuing, you agree to CricLiveX Terms of Service & Privacy Policy.
          </Text>
        </View>
      </ScrollView>

      {/* ============================================================== */}
      {/* SUCCESS MODAL (Displays Generated Player ID & Transits to Login) */}
      {/* ============================================================== */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessModalDismiss}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.primary} />
            </View>

            <Text style={styles.successTitle}>Account Created!</Text>
            <Text style={styles.successSubtitle}>
              Welcome, <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{newlyCreatedUsername}</Text>! Your official CricLiveX Player ID has been generated:
            </Text>

            {/* Prominent Player ID Highlight Box */}
            <View style={styles.playerCodeBox}>
              <Text style={styles.playerCodeLabel}>YOUR UNIQUE PLAYER ID</Text>
              <Text style={styles.playerCodeText}>{newlyCreatedCode}</Text>
              <Text style={styles.playerCodeHint}>
                Team captains and clubs can search this ID ({newlyCreatedCode}) to add you to their squad.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.successProceedBtn}
              onPress={handleSuccessModalDismiss}
              activeOpacity={0.85}
            >
              <Text style={styles.successProceedBtnText}>PROCEED TO SIGN IN</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.surface} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1117',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(78, 222, 163, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#161922',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F1117',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentButtonActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  segmentTextActive: {
    color: '#0F1117',
  },
  tabContent: {
    marginTop: 4,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
    lineHeight: 17,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4AF37', // Gold accent
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  idPreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  idPreviewLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  idPreviewVal: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202431',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pinInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  eyeButton: {
    padding: 6,
  },
  fieldHint: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202431',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#0F1117',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  whatsappPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F2C24',
    borderWidth: 1.5,
    borderColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
  },
  whatsappButtonText: {
    color: '#25D366',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subModeLink: {
    marginTop: 14,
    alignItems: 'center',
  },
  subModeLinkText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    paddingHorizontal: 10,
    letterSpacing: 0.5,
  },
  altButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  altModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  altModeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  footerNote: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#161922',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(78, 222, 163, 0.3)',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  playerCodeBox: {
    width: '100%',
    backgroundColor: '#0F1117',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.4)',
    marginBottom: 20,
  },
  playerCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
    marginBottom: 4,
  },
  playerCodeText: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 3,
    marginVertical: 4,
  },
  playerCodeHint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 15,
  },
  successProceedBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  successProceedBtnText: {
    color: '#0F1117',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});

export default LoginScreen;
