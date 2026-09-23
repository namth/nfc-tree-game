/**
 * SettingsScreen - Cài Đặt, Tùy Chọn & Hướng Dẫn NFC (Themed & Bilingual)
 * Project: Fractal Tree NFC Mobile Game
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Switch
} from 'react-native';
import { BottomNavBar, NavTabId } from '../components/BottomNavBar';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

import { usePerformance } from '../context/PerformanceContext';
import { TargetFps } from '../types';
import { zenAudioService } from '../services/ZenAudioService';

interface SettingsScreenProps {
  onNavigateTab: (tab: NavTabId) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateTab
}) => {
  const { colors, isDark, theme, setTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { effectsEnabled, setEffectsEnabled, targetFps, setTargetFps } = usePerformance();

  const [zenMusicEnabled, setZenMusicEnabled] = useState<boolean>(zenAudioService.getIsEnabled());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(zenAudioService.getIsChimeEnabled());
  const [windSoundEnabled, setWindSoundEnabled] = useState<boolean>(true);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true);

  const handleToggleZenMusic = (val: boolean) => {
    setZenMusicEnabled(val);
    zenAudioService.setEnabled(val).catch(() => {});
  };

  const handleToggleChime = (val: boolean) => {
    setSoundEnabled(val);
    zenAudioService.setChimeEnabled(val);
    if (val) {
      zenAudioService.playChime().catch(() => {});
    }
  };

  const fpsOptions: TargetFps[] = [24, 30, 45, 60];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('settings.title')}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {language === 'vi' ? 'Ngôn ngữ, giao diện, đồ họa và âm thanh Zen' : 'Language, theme, graphics performance, and Zen audio'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 0: TÙY CHỌN NGÔN NGỮ & GIAO DIỆN */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            {t('settings.langTitle')}
          </Text>

          {/* Language Selector */}
          <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.segmentBtn,
                language === 'vi' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setLanguage('vi')}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: language === 'vi' ? '#ffffff' : colors.textSecondary },
                  language === 'vi' && styles.segmentTextActive
                ]}
              >
                🇻🇳 {t('settings.langVi')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.segmentBtn,
                language === 'en' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setLanguage('en')}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: language === 'en' ? '#ffffff' : colors.textSecondary },
                  language === 'en' && styles.segmentTextActive
                ]}
              >
                🇬🇧 {t('settings.langEn')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Theme Selector */}
          <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 4 }]}>
            {t('settings.themeTitle')}
          </Text>

          <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.segmentBtn,
                theme === 'dark' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setTheme('dark')}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: theme === 'dark' ? '#ffffff' : colors.textSecondary },
                  theme === 'dark' && styles.segmentTextActive
                ]}
              >
                🌙 {t('settings.themeDark')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.segmentBtn,
                theme === 'light' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setTheme('light')}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: theme === 'light' ? '#ffffff' : colors.textSecondary },
                  theme === 'light' && styles.segmentTextActive
                ]}
              >
                ☀️ {t('settings.themeLight')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 1: ĐỒ HỌA & HIỆU NĂNG (MỚI) */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            {t('settings.graphicsTitle')}
          </Text>

          {/* Toggle: Hiệu ứng đồ họa đặc biệt */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('settings.effectsToggle')}
              </Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                {t('settings.effectsDesc')}
              </Text>
            </View>
            <Switch
              value={effectsEnabled}
              onValueChange={setEffectsEnabled}
              trackColor={{ false: isDark ? '#26342e' : '#cbd5e1', true: colors.primaryLight }}
              thumbColor={effectsEnabled ? colors.primary : '#86a397'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Target Frame Rate (FPS) */}
          <View style={{ marginTop: 2, marginBottom: 8 }}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('settings.fpsTitle')}
            </Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary, marginBottom: 10 }]}>
              {t('settings.fpsDesc')}
            </Text>
            <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              {fpsOptions.map((fps) => {
                const isActive = targetFps === fps;
                return (
                  <TouchableOpacity
                    key={`fps-${fps}`}
                    activeOpacity={0.85}
                    style={[
                      styles.segmentBtn,
                      isActive && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setTargetFps(fps)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: isActive ? '#ffffff' : colors.textSecondary },
                        isActive && styles.segmentTextActive
                      ]}
                    >
                      {fps} FPS
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* SECTION 2: ÂM THANH & RUNG PHẢN HỒI */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            {t('settings.soundTitle')}
          </Text>

          {/* Toggle 0: Nhạc nền Zen */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('settings.zenMusic')}
              </Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                {t('settings.zenMusicDesc')}
              </Text>
            </View>
            <Switch
              value={zenMusicEnabled}
              onValueChange={handleToggleZenMusic}
              trackColor={{ false: isDark ? '#26342e' : '#cbd5e1', true: colors.primaryLight }}
              thumbColor={zenMusicEnabled ? colors.primary : '#86a397'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Toggle 1: Chuông gió Zen */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('settings.zenChime')}
              </Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                {t('settings.zenChimeDesc')}
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={handleToggleChime}
              trackColor={{ false: isDark ? '#26342e' : '#cbd5e1', true: colors.primaryLight }}
              thumbColor={soundEnabled ? colors.primary : '#86a397'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Toggle 2: Gió thổi qua lá cây */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('settings.windSound')}
              </Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                {t('settings.windSoundDesc')}
              </Text>
            </View>
            <Switch
              value={windSoundEnabled}
              onValueChange={setWindSoundEnabled}
              trackColor={{ false: isDark ? '#26342e' : '#cbd5e1', true: colors.primaryLight }}
              thumbColor={windSoundEnabled ? colors.primary : '#86a397'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Toggle 3: Rung phản hồi Haptic */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('settings.haptic')}
              </Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                {t('settings.hapticDesc')}
              </Text>
            </View>
            <Switch
              value={hapticEnabled}
              onValueChange={setHapticEnabled}
              trackColor={{ false: isDark ? '#26342e' : '#cbd5e1', true: colors.primaryLight }}
              thumbColor={hapticEnabled ? colors.primary : '#86a397'}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <BottomNavBar activeTab="settings" onSelectTab={onNavigateTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.2
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 10
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '600'
  },
  segmentTextActive: {
    fontWeight: '800'
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  settingInfo: {
    flex: 1,
    paddingRight: 12
  },
  settingLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 2
  },
  settingSub: {
    fontSize: 11.5,
    lineHeight: 15
  },
  divider: {
    height: 1,
    marginVertical: 10
  }
});
