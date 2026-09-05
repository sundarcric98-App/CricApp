import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { TournamentStanding } from '../../types/cricket';

interface StandingsTableProps {
  standings: TournamentStanding[];
  selectedGroup: 'all' | 'group-a' | 'group-b';
  onSelectGroup: (group: 'all' | 'group-a' | 'group-b') => void;
  onTeamPress?: (teamId: string) => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  selectedGroup,
  onSelectGroup,
  onTeamPress,
}) => {
  const filtered = standings.filter((item) => {
    if (selectedGroup === 'group-a') return item.group === 'A';
    if (selectedGroup === 'group-b') return item.group === 'B';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Segmented Filter Control */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, selectedGroup === 'all' && styles.filterTabActive]}
          onPress={() => onSelectGroup('all')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedGroup === 'all' && styles.filterTabTextActive,
            ]}
          >
            All Groups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedGroup === 'group-a' && styles.filterTabActive]}
          onPress={() => onSelectGroup('group-a')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedGroup === 'group-a' && styles.filterTabTextActive,
            ]}
          >
            Group A
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedGroup === 'group-b' && styles.filterTabActive]}
          onPress={() => onSelectGroup('group-b')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedGroup === 'group-b' && styles.filterTabTextActive,
            ]}
          >
            Group B
          </Text>
        </TouchableOpacity>
      </View>

      {/* Micro Standings Info Pill */}
      <View style={styles.infoPillRow}>
        <View style={styles.legendItem}>
          <View style={styles.legendDotGreen} />
          <Text style={styles.legendText}>Qualified Zone (1-4)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendDotGray} />
          <Text style={styles.legendText}>Elimination Zone</Text>
        </View>
      </View>

      {/* Points Table Container */}
      <View style={styles.tableCard}>
        {/* Table Header */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.colHeader, styles.colRank]}>#</Text>
          <Text style={[styles.colHeader, styles.colTeam]}>TEAM</Text>
          <Text style={[styles.colHeader, styles.colStat]}>P</Text>
          <Text style={[styles.colHeader, styles.colStat]}>W</Text>
          <Text style={[styles.colHeader, styles.colStat]}>L</Text>
          <Text style={[styles.colHeader, styles.colStat]}>NR</Text>
          <Text style={[styles.colHeader, styles.colStat, styles.colPts]}>PTS</Text>
          <Text style={[styles.colHeader, styles.colNRR]}>NRR</Text>
        </View>

        {/* Team Rows */}
        {filtered.map((item, index) => {
          const isQualified = item.qualified || index < 4;

          return (
            <TouchableOpacity
              key={item.teamId}
              style={[
                styles.teamRow,
                isQualified && styles.qualifiedRow,
              ]}
              onPress={() => onTeamPress?.(item.teamId)}
              activeOpacity={0.8}
            >
              {isQualified && <View style={styles.qualificationBar} />}

              <Text style={[styles.colRank, styles.rankText, isQualified && styles.rankQualified]}>
                {item.rank}
              </Text>

              <View style={styles.colTeam}>
                <View style={styles.teamNameRow}>
                  <Text style={styles.teamNameText} numberOfLines={1}>
                    {item.teamName}
                  </Text>
                  {isQualified && (
                    <View style={styles.qBadge}>
                      <Text style={styles.qBadgeText}>Q</Text>
                    </View>
                  )}
                </View>

                {/* Form Bubbles */}
                <View style={styles.formRow}>
                  {item.recentForm.slice(-5).map((result, i) => (
                    <View
                      key={`form_${item.teamId}_${i}`}
                      style={[
                        styles.formBubble,
                        result === 'W' && styles.formWin,
                        result === 'L' && styles.formLoss,
                        result === 'N' && styles.formNoResult,
                      ]}
                    >
                      <Text
                        style={[
                          styles.formText,
                          result === 'W' && { color: Colors.onPrimary },
                          result === 'L' && { color: Colors.onError },
                          result === 'N' && { color: Colors.onSurfaceVariant },
                        ]}
                      >
                        {result}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <Text style={[styles.colStat, styles.statValue]}>{item.played}</Text>
              <Text style={[styles.colStat, styles.statValue]}>{item.won}</Text>
              <Text style={[styles.colStat, styles.statValueMuted]}>{item.lost}</Text>
              <Text style={[styles.colStat, styles.statValueMuted]}>{item.noResult}</Text>
              <Text style={[styles.colStat, styles.ptsValue]}>{item.points}</Text>
              <Text
                style={[
                  styles.colNRR,
                  styles.nrrValue,
                  item.nrr.startsWith('+') && styles.nrrPositive,
                ]}
              >
                {item.nrr}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterTabTextActive: {
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  infoPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  legendDotGray: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceVariant,
  },
  legendText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  tableCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  colRank: {
    width: 24,
    textAlign: 'center',
  },
  colTeam: {
    flex: 3.8,
    paddingLeft: 4,
  },
  colStat: {
    width: 24,
    textAlign: 'center',
  },
  colPts: {
    color: Colors.primary,
    fontWeight: '800',
  },
  colNRR: {
    flex: 1.6,
    textAlign: 'right',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
    position: 'relative',
  },
  qualifiedRow: {
    backgroundColor: 'rgba(35, 42, 54, 0.4)',
  },
  qualificationBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.primary,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  rankQualified: {
    color: Colors.primary,
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  teamNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
    flexShrink: 1,
  },
  qBadge: {
    backgroundColor: 'rgba(78, 222, 163, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  qBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  formBubble: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formWin: {
    backgroundColor: Colors.primary,
  },
  formLoss: {
    backgroundColor: Colors.ballWicket,
  },
  formNoResult: {
    backgroundColor: Colors.surfaceVariant,
  },
  formText: {
    fontSize: 8,
    fontWeight: '900',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  statValueMuted: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  ptsValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  nrrValue: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  nrrPositive: {
    color: Colors.primary,
  },
});

export default StandingsTable;
