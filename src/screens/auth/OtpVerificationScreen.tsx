import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import { sendWhatsAppOtp, verifyOtp } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/store';

export const OtpVerificationScreen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { pendingMobile, devOtp, loading, error } = useAppSelector((state) => state.auth);

  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);

  const input1Ref = useRef<TextInput>(null);
  const input2Ref = useRef<TextInput>(null);
  const input3Ref = useRef<TextInput>(null);
  const input4Ref = useRef<TextInput>(null);

  const inputs = [input1Ref, input2Ref, input3Ref, input4Ref];

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanText;
    setOtp(newOtp);

    // Auto-advance
    if (cleanText && index < 3) {
      inputs[index + 1].current?.focus();
    }

    // If all 4 filled, trigger verification automatically
    if (cleanText && index === 3 && newOtp.every((digit) => digit !== '')) {
      const fullOtp = newOtp.join('');
      executeVerify(fullOtp);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs[index - 1].current?.focus();
    }
  };

  const executeVerify = async (codeToVerify?: string) => {
    const finalOtp = codeToVerify || otp.join('');
    if (finalOtp.length !== 4) {
      Alert.alert('Incomplete Code', 'Please enter the complete 4-digit OTP.');
      return;
    }

    const mobile = pendingMobile || '+919876543210';
    try {
      const result = await dispatch(verifyOtp({ mobile, otp: finalOtp })).unwrap();
      if (result.isNewUser) {
        router.push('/auth/set-profile-pin' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err || 'Invalid OTP code. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    const mobile = pendingMobile || '+919876543210';
    setCanResend(false);
    setTimer(45);
    try {
      const res = await dispatch(sendWhatsAppOtp(mobile)).unwrap();
      Alert.alert('OTP Resent', `A new 4-digit code was sent to your WhatsApp.\n\n(Dev Code: ${res.devOtp || '1234'})`);
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to resend code');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.content, { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Top Navigation */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>

        {/* WhatsApp Badge Section */}
        <View style={styles.headerSection}>
          <View style={styles.whatsappIconCircle}>
            <Ionicons name="logo-whatsapp" size={36} color="#25D366" />
          </View>
          <Text style={styles.title}>Verify WhatsApp OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 4-digit code sent to your WhatsApp number
          </Text>
          <Text style={styles.mobileHighlight}>{pendingMobile || '+91 98765 43210'}</Text>

          {devOtp && (
            <View style={styles.devHintBadge}>
              <Ionicons name="code-slash" size={14} color={Colors.primary} />
              <Text style={styles.devHintText}>Development Test Code: {devOtp}</Text>
            </View>
          )}
        </View>

        {/* 4 Digit Boxes */}
        <View style={styles.otpBoxesContainer}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={inputs[idx]}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Verify Button */}
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={() => executeVerify()}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.surface} size="small" />
          ) : (
            <>
              <Text style={styles.verifyButtonText}>VERIFY & CONTINUE</Text>
              <Ionicons name="checkmark-circle" size={20} color={Colors.surface} />
            </>
          )}
        </TouchableOpacity>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
              <Text style={styles.resendActiveText}>Resend OTP via WhatsApp</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimerText}>
              Resend code in <Text style={styles.timerBold}>{timer}s</Text>
            </Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  whatsappIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    borderWidth: 1.5,
    borderColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  mobileHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#25D366',
    marginTop: 4,
  },
  devHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 222, 163, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.3)',
  },
  devHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 24,
  },
  otpBox: {
    width: 60,
    height: 64,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(78, 222, 163, 0.08)',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  verifyButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  resendSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendTimerText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  timerBold: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  resendActiveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#25D366',
  },
});

export default OtpVerificationScreen;
