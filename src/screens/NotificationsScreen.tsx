import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../components/common/Header';
import Colors from '../constants/colors';
import {
  fetchNotifications,
  markAllAsRead,
  markAsRead,
  setNotificationFilter,
} from '../store/notificationSlice';
import { useAppDispatch, useAppSelector } from '../store/store';
import { NotificationItem } from '../types/cricket';

export const NotificationsScreen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { notifications, filter, loading } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'wicket') return n.type === 'wicket';
    if (filter === 'milestone') return n.type === 'milestone';
    if (filter === 'match_status') return n.type === 'match_status';
    return true;
  });

  const getIconForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'wicket':
        return { name: 'skull-outline' as const, color: Colors.error, bg: Colors.errorContainer };
      case 'milestone':
        return { name: 'trophy' as const, color: Colors.primary, bg: 'rgba(78, 222, 163, 0.15)' };
      case 'boundary':
        return { name: 'flash' as const, color: Colors.secondary, bg: 'rgba(255, 185, 95, 0.15)' };
      case 'match_status':
      default:
        return {
          name: 'information-circle-outline' as const,
          color: Colors.secondary,
          bg: 'rgba(255, 185, 95, 0.15)',
        };
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    dispatch(markAsRead(item.id));
    if (item.matchId) {
      router.push(`/match/${item.matchId}` as any);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        showBack
        title="Live Alerts"
        rightAction={
          <TouchableOpacity
            style={styles.markReadBtn}
            onPress={() => dispatch(markAllAsRead())}
            activeOpacity={0.7}
          >
            <Text style={styles.markReadText}>Mark Read</Text>
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
          onPress={() => dispatch(setNotificationFilter('all'))}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All Alerts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, filter === 'wicket' && styles.filterPillActive]}
          onPress={() => dispatch(setNotificationFilter('wicket'))}
        >
          <Text style={[styles.filterText, filter === 'wicket' && styles.filterTextActive]}>
            Wickets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, filter === 'milestone' && styles.filterPillActive]}
          onPress={() => dispatch(setNotificationFilter('milestone'))}
        >
          <Text style={[styles.filterText, filter === 'milestone' && styles.filterTextActive]}>
            Milestones
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchNotifications())}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => {
          const iconInfo = getIconForType(item.type);
          return (
            <TouchableOpacity
              style={[styles.alertCard, !item.isRead && styles.unreadCard]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: iconInfo.bg }]}>
                <Ionicons name={iconInfo.name} size={20} color={iconInfo.color} />
              </View>

              <View style={styles.alertContent}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.alertBody}>{item.body}</Text>
                <Text style={styles.alertTimestamp}>
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  markReadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  filterPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  filterTextActive: {
    color: Colors.onPrimary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 24,
    gap: 8,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceContainer,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  unreadCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderColor: 'rgba(78, 222, 163, 0.2)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
    gap: 4,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
    flexShrink: 1,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  alertBody: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  alertTimestamp: {
    fontSize: 10,
    color: Colors.outline,
    marginTop: 2,
  },
});

export default NotificationsScreen;
