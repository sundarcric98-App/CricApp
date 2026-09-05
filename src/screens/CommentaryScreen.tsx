import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../components/common/Header';
import CommentaryCard from '../components/commentary/CommentaryCard';
import Colors from '../constants/colors';
import { fetchCommentary } from '../store/matchSlice';
import { useAppDispatch, useAppSelector } from '../store/store';
import { CommentaryItem } from '../types/cricket';

export const CommentaryScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = (Array.isArray(id) ? id[0] : id) || 'match_blr_mum_01';

  const dispatch = useAppDispatch();
  const { currentMatch, commentary, loading } = useAppSelector((state) => state.matches);
  const [filter, setFilter] = useState<'all' | 'boundary' | 'wicket' | 'key'>('all');

  useEffect(() => {
    dispatch(fetchCommentary({ matchId, filter: filter === 'all' ? undefined : filter }));
  }, [dispatch, matchId, filter]);

  const handleRefresh = () => {
    dispatch(fetchCommentary({ matchId, filter: filter === 'all' ? undefined : filter }));
  };

  const filteredCommentary = commentary.filter((c) => {
    if (filter === 'boundary') return c.isBoundary;
    if (filter === 'wicket') return c.isWicket;
    return true;
  });

  return (
    <View style={styles.container}>
      <Header showBack title="Live Commentary" />

      {/* Mini Match Score Telemetry Strip */}
      {currentMatch && (
        <View style={styles.telemetryStrip}>
          <View style={styles.scoreRow}>
            <View style={styles.leftScore}>
              <View style={styles.liveDot} />
              <Text style={styles.teamCode}>{currentMatch.team2.shortName}</Text>
              <Text style={styles.scoreText}>
                {currentMatch.team2.score}/{currentMatch.team2.wickets}
              </Text>
              <Text style={styles.oversText}>({currentMatch.team2.overs.toFixed(1)} ov)</Text>
            </View>

            <View style={styles.ratesBadge}>
              <Text style={styles.ratesText}>
                CRR {currentMatch.crr.toFixed(2)} • RRR {currentMatch.rrr?.toFixed(2) || '12.50'}
              </Text>
            </View>
          </View>

          {currentMatch.equation && (
            <View style={styles.equationRow}>
              <Text style={styles.equationText}>{currentMatch.equation}</Text>
            </View>
          )}
        </View>
      )}

      {/* Filter Category Pills */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All Balls
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'boundary' && styles.filterBtnActive]}
          onPress={() => setFilter('boundary')}
        >
          <View style={styles.greenDot} />
          <Text style={[styles.filterText, filter === 'boundary' && styles.filterTextActive]}>
            Boundaries (4s & 6s)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'wicket' && styles.filterBtnActive]}
          onPress={() => setFilter('wicket')}
        >
          <View style={styles.redDot} />
          <Text style={[styles.filterText, filter === 'wicket' && styles.filterTextActive]}>
            Wickets
          </Text>
        </TouchableOpacity>
      </View>

      {/* Commentary Stream */}
      <FlatList
        data={filteredCommentary}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item, index }: { item: CommentaryItem; index: number }) => (
          <CommentaryCard item={item} isLast={index === filteredCommentary.length - 1} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  telemetryStrip: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  teamCode: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  oversText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  ratesBadge: {
    backgroundColor: 'rgba(255, 185, 95, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  ratesText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
  },
  equationRow: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  equationText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 5,
  },
  filterBtnActive: {
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
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  redDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.error,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 24,
  },
});

export default CommentaryScreen;
