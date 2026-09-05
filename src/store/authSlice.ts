import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import cricketApi from '../services/api';
import { User } from '../types/cricket';

interface AuthState {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  pendingMobile: string | null;
  devOtp: string | null;
  isNewUser: boolean;
}

const initialState: AuthState = {
  // Default demo user based on reference screens: Sundar
  currentUser: {
    id: 'user_sundar_01',
    name: 'Sundar',
    mobile: '+919876543210',
    userCode: 'SUND4821',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
  },
  token: 'mock_jwt_token_criclivex',
  isAuthenticated: true,
  loading: false,
  error: null,
  otpSent: false,
  pendingMobile: null,
  devOtp: null,
  isNewUser: false,
};

export const sendWhatsAppOtp = createAsyncThunk(
  'auth/sendWhatsAppOtp',
  async (mobile: string, { rejectWithValue }) => {
    try {
      const response = await cricketApi.sendWhatsAppOtp(mobile);
      return { mobile, ...response };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to send WhatsApp OTP');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ mobile, otp }: { mobile: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await cricketApi.verifyOtp(mobile, otp);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Failed to verify OTP');
    }
  }
);

export const completeSignup = createAsyncThunk(
  'auth/completeSignup',
  async (
    payload: { mobile: string; name: string; pin: string; profileImage?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await cricketApi.completeSignup(payload);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Registration failed');
    }
  }
);

export const loginWithPin = createAsyncThunk(
  'auth/loginWithPin',
  async (
    payload: { mobile: string; pin: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await cricketApi.loginWithPin(payload.mobile, payload.pin);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Login failed');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPendingMobile: (state, action: PayloadAction<string>) => {
      state.pendingMobile = action.payload;
    },
    logout: (state) => {
      state.currentUser = null;
      state.token = null;
      state.isAuthenticated = false;
      state.otpSent = false;
      state.pendingMobile = null;
      state.devOtp = null;
      state.isNewUser = false;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Send OTP
    builder
      .addCase(sendWhatsAppOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendWhatsAppOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.pendingMobile = action.payload.mobile;
        state.devOtp = action.payload.devOtp || '1234';
        state.isNewUser = action.payload.isNewUser;
      })
      .addCase(sendWhatsAppOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Verify OTP
    builder
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.user && action.payload.token) {
          state.currentUser = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        } else {
          state.isNewUser = true;
        }
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Complete Signup
    builder
      .addCase(completeSignup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeSignup.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(completeSignup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Login with PIN
    builder
      .addCase(loginWithPin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithPin.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginWithPin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setPendingMobile, logout, clearAuthError, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
