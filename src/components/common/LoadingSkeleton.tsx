import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import Colors from '../../constants/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const MatchCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.rowBetween}>
        <Skeleton width={180} height={14} />
        <Skeleton width={60} height={20} borderRadius={999} />
      </View>
      <View style={{ gap: 10, marginVertical: 12 }}>
        <Skeleton width="100%" height={32} borderRadius={8} />
        <Skeleton width="100%" height={40} borderRadius={10} />
      </View>
      <Skeleton width="100%" height={36} borderRadius={10} />
      <View style={[styles.rowBetween, { marginTop: 12 }]}>
        <Skeleton width="48%" height={60} borderRadius={10} />
        <Skeleton width="48%" height={60} borderRadius={10} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  cardSkeleton: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default Skeleton;
