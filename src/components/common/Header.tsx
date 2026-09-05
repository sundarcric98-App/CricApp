import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import { useAppSelector } from '../../store/store';
import SideDrawer from './SideDrawer';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'CRICLIVEX',
  showBack = false,
  onBackPress,
  rightAction,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <>
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerContent}>
          {/* Left section: Hamburger or Back */}
          <View style={styles.leftSection}>
            {showBack ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.hamburgerButton}
                onPress={() => setDrawerOpen(true)}
                activeOpacity={0.7}
              >
                <View style={styles.hamburgerLine} />
                <View style={[styles.hamburgerLine, { width: 14 }]} />
              </TouchableOpacity>
            )}

            <View style={styles.titleWrapper}>
              <Text style={styles.titleText} numberOfLines={1}>
                {title}
              </Text>
              {!showBack && (
                <View style={styles.pulseContainer}>
                  <View style={styles.pulseDot} />
                </View>
              )}
            </View>
          </View>

          {/* Right Section: Search / Notification & Profile */}
          <View style={styles.rightSection}>
            {rightAction ? (
              rightAction
            ) : (
              <>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => router.push('/notifications')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="search-outline" size={22} color={Colors.onSurface} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => router.push('/notifications')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="newspaper-outline" size={22} color={Colors.onSurface} />
                  {unreadCount > 0 && <View style={styles.notificationDot} />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.avatarButton}
                  onPress={() => router.push('/(tabs)/profile' as any)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{
                      uri:
                        currentUser?.profileImage ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&q=80',
                    }}
                    style={styles.avatarImage}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Slide Navigation Drawer */}
      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 50,
  },
  headerContent: {
    height: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  hamburgerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    gap: 5,
  },
  hamburgerLine: {
    width: 20,
    height: 2.5,
    backgroundColor: Colors.onSurface,
    borderRadius: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  titleText: {
    color: Colors.onSurface,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pulseContainer: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF5252',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  avatarButton: {
    borderRadius: 16,
  },
});

export default Header;
