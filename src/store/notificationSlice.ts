import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import cricketApi from '../services/api';
import { NotificationItem } from '../types/cricket';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  filter: 'all' | 'wicket' | 'milestone' | 'match_status';
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  filter: 'all',
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const data = await cricketApi.getNotifications();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch notifications');
    }
  }
);

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const item = state.notifications.find((n) => n.id === action.payload);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    setNotificationFilter: (
      state,
      action: PayloadAction<'all' | 'wicket' | 'milestone' | 'match_status'>
    ) => {
      state.filter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { addNotification, markAllAsRead, markAsRead, setNotificationFilter } =
  notificationSlice.actions;

export default notificationSlice.reducer;
