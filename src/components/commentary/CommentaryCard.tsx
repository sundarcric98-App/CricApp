import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import { CommentaryItem } from '../../types/cricket';

interface CommentaryCardProps {
  item: CommentaryItem;
  isLast?: boolean;
}

export const CommentaryCard: React.FC<CommentaryCardProps> = ({ item, isLast = false }) => {
  const isFour = item.ballType === 'boundary4' || item.runs === 4;
  const isSix = item.ballType === 'boundary6' || item.runs === 6;
  const isWicket = item.isWicket;

  const getTagStyle = () => {
    if (isWicket) {
      return {
        bg: Colors.errorContainer,
        text: Colors.error,
        icon: 'skull-outline' as const,
        label: 'WICKET',
      };
    }
    if (isSix) {
      return {
        bg: 'rgba(78, 222, 163, 0.2)',
        text: Colors.primary,
        icon: 'flash' as const,
        label: '6 RUNS',
      };
    }
    if (isFour) {
      return {
        bg: 'rgba(78, 222, 163, 0.15)',
        text: Colors.primary,
        icon: 'rocket-outline' as const,
        label: 'FOUR',
      };
    }
    if (item.runs === 0) {
      return {
        bg: Colors.surfaceContainerHighest,
        text: Colors.outline,
        icon: 'ellipse' as const,
        label: 'DOT',
      };
    }
    return {
      bg: 'rgba(78, 222, 163, 0.1)',
      text: Colors.primary,
      icon: 'walk-outline' as const,
      label: `${item.runs} RUN${item.runs > 1 ? 'S' : ''}`,
    };
  };

  const tagStyle = getTagStyle();

  return (
    <View style={styles.cardContainer}>
      {/* Timeline track and marker */}
      <View style={styles.timelineLeft}>
        <View
          style={[
            styles.timelineMarker,
            isWicket && styles.markerWicket,
            (isFour || isSix) && styles.markerBoundary,
          ]}
        >
          <View
            style={[
              styles.markerDot,
              isWicket && { backgroundColor: Colors.error },
              (isFour || isSix) && { backgroundColor: Colors.primary },
            ]}
          />
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Main Commentary Content Box */}
      <View style={styles.contentBox}>
        <View style={styles.headerRow}>
          <View style={styles.overMetaRow}>
            <Text style={styles.overText}>{item.over}</Text>
            <Text style={styles.bowlerBatterText}>
              • {item.bowlerName} to {item.strikerName}
            </Text>
          </View>

          <View style={[styles.tagBadge, { backgroundColor: tagStyle.bg }]}>
            <Ionicons name={tagStyle.icon} size={11} color={tagStyle.text} />
            <Text style={[styles.tagText, { color: tagStyle.text }]}>{tagStyle.label}</Text>
          </View>
        </View>

        <Text style={styles.descriptionText}>
          {item.title && item.title !== `${item.runs} runs` ? (
            <Text style={styles.boldTitle}>{item.title} </Text>
          ) : null}
          {item.description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  timelineLeft: {
    width: 28,
    alignItems: 'center',
    position: 'relative',
  },
  timelineMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    zIndex: 2,
  },
  markerBoundary: {
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
  },
  markerWicket: {
    backgroundColor: Colors.errorContainer,
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    position: 'absolute',
    top: 24,
    bottom: -10,
    width: 2,
    backgroundColor: Colors.surfaceVariant,
    zIndex: 1,
  },
  contentBox: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginLeft: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  overText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  bowlerBatterText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    flexShrink: 1,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.onSurface,
    lineHeight: 19,
  },
  boldTitle: {
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default CommentaryCard;
