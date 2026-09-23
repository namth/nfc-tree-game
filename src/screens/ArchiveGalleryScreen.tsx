/**
 * ArchiveGalleryScreen - Nhà Kính Danh Dự (Bảo tàng Cổ thụ)
 * Project: Fractal Tree NFC Mobile Game
 * Specification: docs/03-screens-and-ui.md & ui-ux/03-archive-gallery.html
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image
} from 'react-native';
import { TreeModel } from '../types';
import { gardenRepository } from '../storage/repositories/GardenRepository';
import { TreeCard } from '../components/TreeCard';
import { BottomNavBar, NavTabId } from '../components/BottomNavBar';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

interface ArchiveGalleryScreenProps {
  onSelectTree?: (tree: TreeModel) => void;
  onNavigateTab: (tab: NavTabId) => void;
}

export const ArchiveGalleryScreen: React.FC<ArchiveGalleryScreenProps> = ({
  onSelectTree,
  onNavigateTab
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [archivedTrees, setArchivedTrees] = useState<TreeModel[]>([]);

  useEffect(() => {
    loadArchivedTrees();
  }, []);

  const loadArchivedTrees = async () => {
    try {
      const list = await gardenRepository.getArchivedTrees();
      setArchivedTrees(list);
    } catch (err) {
      console.error('[ArchiveGallery] Lỗi khi tải danh sách cây lưu trữ:', err);
      setArchivedTrees([]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar as any} backgroundColor={colors.background} />

      {/* Top Header đồng nhất với GardenDashboardScreen */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/app_icon.png')}
            style={[styles.appIconThumb, { borderColor: colors.border }]}
          />
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t('archive.title')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {archivedTrees.length > 0
                ? t('archive.statsCount', { count: archivedTrees.length })
                : t('archive.subtitle')}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {archivedTrees.length > 0 ? (
          <View style={styles.treeGrid}>
            {archivedTrees.map((tree) => (
              <TreeCard
                key={tree.id}
                tree={tree}
                isArchive={true}
                onPress={onSelectTree}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.border
                }
              ]}
            >
              <Text style={styles.emptyIcon}>🏛️</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('archive.emptyTitle')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {t('archive.emptySubtitle')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Nav Bar */}
      <BottomNavBar activeTab="archive" onSelectTab={onNavigateTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  appIconThumb: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: '500'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90
  },
  treeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyIcon: {
    fontSize: 30
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19
  }
});
