/**
 * NfcScanModal Component - Hộp thoại tương tác quét thẻ NFC với hiệu ứng radar sóng lan tỏa (Themed & Localized)
 * Project: Fractal Tree NFC Mobile Game
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

interface NfcScanModalProps {
  visible: boolean;
  statusText?: string;
  isScanning?: boolean;
  onClose: () => void;
}

export const NfcScanModal: React.FC<NfcScanModalProps> = ({
  visible,
  statusText,
  isScanning = true,
  onClose
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  const currentStatusText = statusText || t('nfcModal.readyPrompt');

  useEffect(() => {
    if (!visible) return;

    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.bezier(0.2, 0.6, 0.35, 1),
            useNativeDriver: true
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true
          })
        ])
      );
    };

    const anim1 = createPulse(pulse1, 0);
    const anim2 = createPulse(pulse2, 700);
    const anim3 = createPulse(pulse3, 1400);

    if (isScanning) {
      anim1.start();
      anim2.start();
      anim3.start();
    } else {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    }

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [visible, isScanning]);

  const renderRadarRing = (anim: Animated.Value) => {
    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1.8]
    });

    const opacity = anim.interpolate({
      inputRange: [0, 0.2, 0.8, 1],
      outputRange: [0, 0.7, 0.25, 0]
    });

    return (
      <Animated.View
        style={[
          styles.radarRing,
          {
            borderColor: colors.primary,
            transform: [{ scale }],
            opacity
          }
        ]}
      />
    );
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border
            }
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>

          {/* Modal Header */}
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t('garden.scanFloating')}
          </Text>

          {/* Animated Radar Scanning Area */}
          <View style={styles.radarContainer}>
            {renderRadarRing(pulse1)}
            {renderRadarRing(pulse2)}
            {renderRadarRing(pulse3)}

            {/* Central NFC Icon Circle */}
            <View
              style={[
                styles.nfcCenterCircle,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.primary
                }
              ]}
            >
              <Svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 8C4 5.79086 5.79086 4 8 4H16C18.2091 4 20 5.79086 20 8V16C20 18.2091 18.2091 20 16 20H8C5.79086 20 4 18.2091 4 16V8Z"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Path
                  d="M8.5 15.5V8.5L12 13.5V8.5"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M15.5 8.5V15.5"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </View>

          {/* Status Text */}
          <Text style={[styles.statusText, { color: colors.text }]}>
            {currentStatusText}
          </Text>

          {/* Footer Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border
                }
              ]}
              onPress={onClose}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                {t('nfcModal.cancelBtn')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 4,
    marginBottom: 16
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 20
  },
  radarContainer: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12
  },
  radarRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.8
  },
  nfcCenterCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10
  },
  statusText: {
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 16,
    paddingHorizontal: 12,
    lineHeight: 20
  },
  actionRow: {
    width: '100%',
    gap: 10,
    marginTop: 8
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600'
  }
});
