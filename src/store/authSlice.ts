import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import cricketApi, { setAuthToken, validateAuthToken } from '../services/api';
import { User } from '../types/cricket';
import { clearSession, getStoredToken, getStoredUser, saveSession } from '../utils/storage';

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
  lastRegisteredPlayerCode: string | null;
}

// Read previously persisted user and token from storage
const savedUser = getStoredUser();
const savedToken = getStoredToken();

if (savedToken) {
  setAuthToken(savedToken);
}

const initialState: AuthState = {
  currentUser: savedUser,
  token: savedToken,
  isAuthenticated: !!(savedUser && savedToken),
  loading: false,
  error: null,
  otpSent: false,
  pendingMobile: null,
  devOtp: null,
  isNewUser: false,
  lastRegisteredPlayerCode: null,
};

// 1. Sign Up Thunk (Username, Email, Password -> Generates Player ID like yuv123)
export const signUp = createAsyncThunk(
  'auth/signUp',
  async (
    payload: { username: string; email: string; password: string; name?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await cricketApi.signUp(payload);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Signup failed');
    }
  }
);

// 2. Sign In Thunk (Email / Username / Player ID + Password)
export const signIn = createAsyncThunk(
  'auth/signIn',
  async (
    payload: { identifier: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await cricketApi.signIn(payload);
      if (response.token) {
        setAuthToken(response.token);
      }
      return response;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.message || 'Login failed');
    }
  }
);

// 3. Token Validation Thunk
export const validateSessionToken = createAsyncThunk(
  'auth/validateSessionToken',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;
      const validation = validateAuthToken(token);
      if (!validation.valid) {
        dispatch(authSlice.actions.logout());
        return rejectWithValue(validation.reason || 'Token is invalid');
      }
      return validation;
    } catch (err: any) {
      dispatch(authSlice.actions.logout());
      return rejectWithValue(err.message || 'Failed to validate token');
    }
  }
);

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
      if (response.token) {
        setAuthToken(response.token);
      }
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
      if (response.token) {
        setAuthToken(response.token);
      }
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
      if (response.token) {
        setAuthToken(response.token);
      }
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
      state.lastRegisteredPlayerCode = null;
      // Clear token from HTTP client headers and local storage
      setAuthToken(null);
      clearSession();
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
        if (state.token) {
          saveSession(state.currentUser, state.token);
        }
      }
    },
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      if (state.token) {
        saveSession(action.payload, state.token);
      }
    },
  },
  extraReducers: (builder) => {
    // 1. Sign Up
    builder
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        state.lastRegisteredPlayerCode = action.payload.userCode;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 2. Sign In
    builder
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        setAuthToken(action.payload.token);
        saveSession(action.payload.user, action.payload.token);
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 3. Validate Session Token
    builder
      .addCase(validateSessionToken.rejected, (state) => {
        state.currentUser = null;
        state.token = null;
        state.isAuthenticated = false;
        clearSession();
      });

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
          setAuthToken(action.payload.token);
          saveSession(action.payload.user, action.payload.token);
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
        setAuthToken(action.payload.token);
        saveSession(action.payload.user, action.payload.token);
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
        setAuthToken(action.payload.token);
        saveSession(action.payload.user, action.payload.token);
      })
      .addCase(loginWithPin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setPendingMobile, logout, clearAuthError, updateUserProfile, setCurrentUser } =
  authSlice.actions;
export default authSlice.reducer;
