import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import { useAppSelector } from '../../store/store';

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const navigateTo = (route: string) => {
    onClose();
    router.push(route as any);
  };

  const menuItems = [
    { label: 'My Matches', icon: 'newspaper-outline', route: '/(tabs)' },
    { label: 'My Tournaments', icon: 'trophy-outline', route: '/(tabs)/tournament' },
    { label: 'Profile', icon: 'person-circle-outline', route: '/(tabs)/profile' },
    { label: 'My Teams', icon: 'people-outline', route: '/teams' },
    { label: 'My Clubs', icon: 'shield-outline', route: '/teams' },
    { label: 'Start Match', icon: 'play-circle-outline', route: '/scoring/match_blr_mum_01' },
    { label: 'Create Tournament', icon: 'flag-outline', route: '/tournament/create' },
    { label: 'Register As Club', icon: 'ribbon-outline', route: '/team/create' },
    { label: 'Following', icon: 'heart-outline', route: '/(tabs)' },
    { label: 'Settings', icon: 'settings-outline', route: '/(tabs)/profile' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Drawer Content */}
        <View style={[styles.drawerContainer, { paddingTop: Math.max(insets.top, 24) }]}>
          {/* User Profile Header */}
          <View style={styles.profileHeader}>
            <Image
              source={{
                uri:
                  currentUser?.profileImage ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
              }}
              style={styles.profileAvatar}
            />
            <Text style={styles.userName}>{currentUser?.name || 'Sundar'}</Text>
            <View style={styles.userIdBadge}>
              <Text style={styles.userIdText}>ID: {currentUser?.userCode || 'SUND4821'}</Text>
            </View>
          </View>

          {/* Menu Items List */}
          <ScrollView
            style={styles.menuScrollView}
            contentContainerStyle={styles.menuListContent}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItemRow}
                onPress={() => navigateTo(item.route)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color="#1E293B"
                  style={styles.menuItemIcon}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer with Socials & Version */}
          <View style={[styles.drawerFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={styles.footerHeading}>Follow Us On</Text>
            <View style={styles.socialIconsRow}>
              <TouchableOpacity style={styles.socialCircle}>
                <Ionicons name="logo-facebook" size={18} color="#1E293B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialCircle}>
                <Ionicons name="logo-instagram" size={18} color="#1E293B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialCircle}>
                <Ionicons name="logo-twitter" size={18} color="#1E293B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialCircle}>
                <Ionicons name="logo-youtube" size={18} color="#1E293B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
  },
  drawerContainer: {
    width: '75%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    display: 'flex',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  userIdBadge: {
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  userIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D9488',
  },
  menuScrollView: {
    flex: 1,
  },
  menuListContent: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuItemIcon: {
    marginLeft: 12,
  },
  drawerFooter: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 10,
  },
  socialIconsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  socialCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});

export default SideDrawer;
