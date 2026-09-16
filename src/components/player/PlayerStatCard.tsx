import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import { Player } from '../../types/cricket';

interface PlayerStatCardProps {
  player: Player;
}

export const PlayerStatCard: React.FC<PlayerStatCardProps> = ({ player }) => {
  const battingForm = player.battingForm || [];
  const bowlingForm = player.bowlingForm || [];

  return (
    <View style={styles.container}>
      {/* 1. HERO BIO CARD */}
      <View style={styles.card}>
        <View style={styles.heroRow}>
          <View style={styles.avatarWrap}>
            <Image
              source={{
                uri:
                  player.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
              }}
              style={styles.avatarImg}
            />
            <View style={styles.flagBadge}>
              <Text style={styles.flagText}>{player.flag || '🇮🇳'}</Text>
            </View>
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.nameHeaderRow}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.playerCountry}>{player.country || 'India'}</Text>
            {player.userCode ? (
              <View style={styles.playerIdTag}>
                <Ionicons name="id-card-outline" size={12} color="#D4AF37" />
                <Text style={styles.playerIdText}>ID: {player.userCode}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Bio Attributes Table */}
        <View style={styles.bioTable}>
          <View style={styles.bioRow}>
            <Text style={styles.bioLabel}>Role</Text>
            <Text style={styles.bioValue}>
              {player.role === 'allrounder'
                ? 'Allrounder'
                : player.role === 'bowler'
                ? 'Bowler'
                : player.role === 'wicketkeeper'
                ? 'Wicketkeeper Batter'
                : 'Top-order Batter'}
            </Text>
          </View>
          <View style={styles.bioDivider} />
          <View style={styles.bioRow}>
            <Text style={styles.bioLabel}>Batting Style</Text>
            <Text style={styles.bioValue}>{player.battingStyle || 'Right-hand Bat'}</Text>
          </View>
          <View style={styles.bioDivider} />
          <View style={styles.bioRow}>
            <Text style={styles.bioLabel}>Bowling Style</Text>
            <Text style={styles.bioValue}>{player.bowlingStyle || 'Right-arm Medium'}</Text>
          </View>
        </View>
      </View>

      {/* 2. BATTING FORM CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Batting Form</Text>
        {battingForm.length > 0 ? (
          <View style={styles.tableWrap}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeadCell, { flex: 1.4 }]}>Score</Text>
              <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>OPPN.</Text>
              <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>Format</Text>
              <Text style={[styles.tableHeadCell, { flex: 1.3, textAlign: 'right' }]}>Date</Text>
            </View>
            {battingForm.map((row, idx) => (
              <View key={`b_form_${idx}`} style={[styles.tableDataRow, idx % 2 === 1 && styles.rowAlt]}>
                <Text style={[styles.tableCellBold, { flex: 1.4, color: Colors.onSurface }]}>
                  {row.score}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{row.oppn}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: Colors.primary }]}>
                  {row.format}
                </Text>
                <Text style={[styles.tableCellMuted, { flex: 1.3, textAlign: 'right' }]}>{row.date}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyFormBox}>
            <Ionicons name="stats-chart-outline" size={24} color="#64748B" />
            <Text style={styles.emptyFormText}>No batting innings played yet in matches.</Text>
          </View>
        )}
      </View>

      {/* 3. BOWLING FORM CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bowling Form</Text>
        {bowlingForm.length > 0 ? (
          <View style={styles.tableWrap}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeadCell, { flex: 1.4 }]}>Wickets</Text>
              <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>OPPN.</Text>
              <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>Format</Text>
              <Text style={[styles.tableHeadCell, { flex: 1.3, textAlign: 'right' }]}>Date</Text>
            </View>
            {bowlingForm.map((row, idx) => (
              <View key={`bw_form_${idx}`} style={[styles.tableDataRow, idx % 2 === 1 && styles.rowAlt]}>
                <Text style={[styles.tableCellBold, { flex: 1.4, color: Colors.secondary }]}>
                  {row.wickets}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{row.oppn}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: Colors.primary }]}>
                  {row.format}
                </Text>
                <Text style={[styles.tableCellMuted, { flex: 1.3, textAlign: 'right' }]}>{row.date}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyFormBox}>
            <Ionicons name="baseball-outline" size={24} color="#64748B" />
            <Text style={styles.emptyFormText}>No bowling spells bowled yet in matches.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  // Hero Bio Section
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#232838',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  flagBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1E2330',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  flagText: {
    fontSize: 14,
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  playerCountry: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  playerIdTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.6,
    borderColor: '#D4AF37',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 2,
  },
  playerIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  // Bio Attributes Table
  bioTable: {
    backgroundColor: '#1B1F2A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  bioDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bioLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  bioValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    flex: 1.5,
    textAlign: 'right',
  },
  // Standard Form Table
  tableWrap: {
    backgroundColor: '#1B1F2A',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#222838',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tableHeadCell: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  rowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tableCellBold: {
    fontSize: 13,
    fontWeight: '800',
  },
  tableCell: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  tableCellMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyFormBox: {
    backgroundColor: '#1B1F2A',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyFormText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default PlayerStatCard;
