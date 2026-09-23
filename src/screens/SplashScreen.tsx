/**
 * Splash Screen Component
 * Project: Fractal Tree NFC Mobile Game
 * Features:
 * - 11 authentic leaf shapes with organic petiole stems (no willow, round, needle)
 * - 12 authentic color palettes from GitHub (37 shades)
 * - Random 360-degree rotation & morphing every 500ms
 * - Elegant loading progress bar directly below NFC MOBILE GAME
 * - Tap anywhere to skip directly to Garden
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { LeafType } from '../types';
import { GITHUB_LEAF_PALETTES } from '../engine/fractal/LeafPalettes';
import { AuthenticLeafView } from '../components/AuthenticLeafView';
import { useTheme } from '../theme/ThemeContext';

interface SplashScreenProps {
  onFinish?: () => void;
}

const { width } = Dimensions.get('window');

// 14 valid authentic leaf types
const ACTIVE_LEAF_TYPES = [
  LeafType.POINTED,
  LeafType.MAPLE,
  LeafType.MAPLE5,
  LeafType.GINKGO_FAN,
  LeafType.HEART,
  LeafType.SINGLE_NEEDLE,
  LeafType.TUNG_LAHAN,
  LeafType.SAKURA_LEAF,
  LeafType.EUCALYPTUS_LONG,
  LeafType.OVAL,
  LeafType.BODHI,
  LeafType.ROUND,
  LeafType.NEEDLE,
  LeafType.WILLOW
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { colors, isDark } = useTheme();
  const [leafType, setLeafType] = useState<LeafType>(LeafType.MAPLE);
  const [shadeIndex, setShadeIndex] = useState<number>(0);
  const [rotationDeg, setRotationDeg] = useState<number>(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const loadProgress = useRef(new Animated.Value(0)).current;

  // Flattened authentic shades (37 distinct colors)
  const allShades = Object.values(GITHUB_LEAF_PALETTES).flat();
  const currentShade = allShades[shadeIndex] || allShades[0];

  useEffect(() => {
    // 1. Loading bar animation (2.6 seconds)
    Animated.timing(loadProgress, {
      toValue: 1,
      duration: 2600,
      useNativeDriver: false
    }).start(() => {
      if (onFinish) onFinish();
    });

    // 2. Morph random leaf, color & 360-deg rotation every 500ms
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.84,
          duration: 110,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.0,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();

      setTimeout(() => {
        const nextLeaf = ACTIVE_LEAF_TYPES[Math.floor(Math.random() * ACTIVE_LEAF_TYPES.length)];
        const nextShade = Math.floor(Math.random() * allShades.length);
        const nextRot = Math.floor(Math.random() * 360);

        setLeafType(nextLeaf);
        setShadeIndex(nextShade);
        setRotationDeg(nextRot);
      }, 100);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const barWidth = loadProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => onFinish && onFinish()}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={colors.statusBar as any} backgroundColor={colors.background} />

      {/* Background Radial Glow */}
      <View style={[styles.glowBackdrop, { backgroundColor: currentShade.hex, opacity: isDark ? 0.14 : 0.22 }]} />

      {/* Central Content */}
      <View style={styles.centerBox}>
        {/* Animated Hero Leaf with 360 Rotation & Authentic Geometry */}
        <Animated.View
          style={[
            styles.leafWrapper,
            {
              transform: [{ scale: scaleAnim }, { rotate: `${rotationDeg}deg` }]
            }
          ]}
        >
          <AuthenticLeafView
            leafType={leafType}
            color={currentShade.hex}
            size={150}
          />
        </Animated.View>

        {/* Title */}
        <Text style={[styles.appTitle, { color: colors.text }]}>Fractal Tree</Text>

        {/* Subtitle */}
        <Text style={[styles.appSubtitle, { color: currentShade.hex }]}>
          NFC MOBILE GAME
        </Text>

        {/* Loading Progress Bar directly below NFC MOBILE GAME */}
        <View style={[styles.loadingTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
          <Animated.View
            style={[
              styles.loadingFill,
              { width: barWidth, backgroundColor: currentShade.hex }
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080b0a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  glowBackdrop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.14
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  leafWrapper: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.6,
    marginBottom: 6
  },
  appSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 20
  },
  loadingTrack: {
    width: 160,
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  loadingFill: {
    height: '100%',
    borderRadius: 4
  }
});
