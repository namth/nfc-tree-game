/**
 * CompendiumScreen - Bách Thảo Thư Viện (Botanical Compendium / Pokédex Thực Vật)
 * Project: Fractal Tree NFC Mobile Game
 * Specification: docs/features/botanical-compendium-library.md
 * 
 * - 14 Leaf Types * 12 Palettes = 168 Leaf Varieties.
 * - Horizontal leaf tabs sorted descending by discovered count.
 * - Within each leaf: sorted discovered first, then common -> rare -> legendary.
 * - Leaf preview box bleeds to top, left, right edges.
 * - Leaf preview box background: pastel color of rarity if discovered, light gentle grey if undiscovered.
 * - 3 leaves centered, spaced slightly further apart, center leaf elevated higher.
 * - Rarity tag: clean text, no icons, 1 colored dot matching text color.
 * - "Chưa khám phá" and lock icon 🔒: upright/straight normal font (no italics).
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  Pressable
} from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { BottomNavBar, NavTabId } from '../components/BottomNavBar';
import {
  CompendiumRepository,
  CompendiumEntry,
  CompendiumStats
} from '../storage/repositories/CompendiumRepository';
import { LeafType } from '../types';
import { LEAF_TYPE_CONFIGS } from '../engine/fractal/LeafConfigs';
import {
  GITHUB_LEAF_PALETTES,
  ALL_LEAF_PALETTES_CONFIG,
  PaletteConfigItem,
  PaletteShade
} from '../engine/fractal/LeafPalettes';
import { getLeafColorRarity, TreeRarity } from '../config/GeneticsConfig';
import {
  AuthenticLeafContent,
  AuthenticLeafView,
  COMPENDIUM_LEAF_ROTATIONS
} from '../components/AuthenticLeafView';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

interface CompendiumScreenProps {
  onNavigateTab: (tab: NavTabId) => void;
}

type RarityFilter = 'all' | 'common' | 'rare' | 'legendary';

interface SelectedVarietyInfo {
  leafType: LeafType;
  palette: PaletteConfigItem;
  shades: PaletteShade[];
  rarity: TreeRarity;
  isUnlocked: boolean;
  entry?: CompendiumEntry;
  localizedPaletteName: string;
}

// Thứ tự cấp bậc độ hiếm: Common -> Rare -> Legendary
const RARITY_RANK: Record<TreeRarity, number> = {
  common: 1,
  rare: 2,
  legendary: 3
};

export const CompendiumScreen: React.FC<CompendiumScreenProps> = ({
  onNavigateTab
}) => {
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();

  const [selectedLeafType, setSelectedLeafType] = useState<LeafType>(LeafType.POINTED);
  const [hasUserSelectedLeaf, setHasUserSelectedLeaf] = useState<boolean>(false);
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');
  const [entriesMap, setEntriesMap] = useState<Record<string, CompendiumEntry>>({});
  const [stats, setStats] = useState<CompendiumStats>({
    totalDiscovered: 0,
    totalTraits: 168,
    percent: 0,
    hasUnviewedNew: false
  });
  const [selectedVariety, setSelectedVariety] = useState<SelectedVarietyInfo | null>(null);

  useEffect(() => {
    loadCompendium();
  }, []);

  const loadCompendium = async () => {
    await CompendiumRepository.syncFromExistingTrees();
    const map = await CompendiumRepository.getEntriesMap();
    const st = await CompendiumRepository.getStats();
    setEntriesMap(map);
    setStats(st);

    // Khi người dùng vào xem Thư Viện: Tự động đánh dấu đã xem để tắt chấm đỏ notification dot
    if (st.hasUnviewedNew) {
      await CompendiumRepository.markAllAsViewed();
    }
  };

  // Danh mục 14 loài lá, sắp xếp theo số lượng màu được khám phá nhiều nhất lên trước
  const leafTypesList = useMemo(() => {
    const list = Object.values(LEAF_TYPE_CONFIGS).map(cfg => {
      const localizedName = t(`leafNames.${cfg.key}` as any) || cfg.name;
      // Đếm số biến thể đã mở khóa cho loài lá này (trong 12 màu)
      const unlockedCount = ALL_LEAF_PALETTES_CONFIG.filter(p => {
        const key = `variety_${cfg.id}_${p.id}`;
        return !!(entriesMap[key] || entriesMap[`${cfg.id}_${p.id}`]);
      }).length;

      return {
        id: cfg.id as LeafType,
        key: cfg.key,
        name: localizedName,
        unlockedCount
      };
    });

    // Sắp xếp: Loài lá nào có số màu đã khám phá nhiều nhất đứng trước
    return list.sort((a, b) => {
      if (b.unlockedCount !== a.unlockedCount) {
        return b.unlockedCount - a.unlockedCount;
      }
      return a.id - b.id;
    });
  }, [entriesMap, language]);

  // Tự động chọn loài lá có nhiều khám phá nhất lúc ban đầu
  useEffect(() => {
    if (!hasUserSelectedLeaf && leafTypesList.length > 0) {
      setSelectedLeafType(leafTypesList[0].id);
    }
  }, [leafTypesList, hasUserSelectedLeaf]);

  // Danh sách 12 biến thể màu sắc của loài lá đang được chọn
  // Sắp xếp: Ưu tiên màu đã khám phá lên trước, tiếp theo là common -> rare -> legendary
  const varietiesForSelectedLeaf = useMemo(() => {
    const list = ALL_LEAF_PALETTES_CONFIG.map(p => {
      const shades = GITHUB_LEAF_PALETTES[p.id] || [];
      const rarity = getLeafColorRarity(selectedLeafType, p.id);
      const entryKey = `variety_${selectedLeafType}_${p.id}`;
      const entry = entriesMap[entryKey] || entriesMap[`${selectedLeafType}_${p.id}`];
      const isUnlocked = !!entry;
      const localizedPaletteName = t(`paletteNames.${p.key}` as any) || shades[0]?.name || p.name_vi;

      return {
        leafType: selectedLeafType,
        palette: p,
        shades,
        rarity,
        isUnlocked,
        entry,
        localizedPaletteName
      };
    });

    return list.sort((a, b) => {
      // 1. Ưu tiên màu đã khám phá lên trước
      if (a.isUnlocked !== b.isUnlocked) {
        return a.isUnlocked ? -1 : 1;
      }
      // 2. Sắp xếp theo độ hiếm: common -> rare -> legendary
      const rankA = RARITY_RANK[a.rarity];
      const rankB = RARITY_RANK[b.rarity];
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      // 3. Thứ tự id palette cố định
      return a.palette.id - b.palette.id;
    });
  }, [selectedLeafType, entriesMap, language]);

  // Lọc theo độ hiếm
  const filteredVarieties = useMemo(() => {
    if (rarityFilter === 'all') return varietiesForSelectedLeaf;
    return varietiesForSelectedLeaf.filter(v => v.rarity === rarityFilter);
  }, [varietiesForSelectedLeaf, rarityFilter]);

  // Cấp bậc Nhà Thực Vật Học
  const botanistRank = useMemo(() => {
    if (stats.percent >= 90) return t('compendium.rankMaster');
    if (stats.percent >= 60) return t('compendium.rankExpert');
    if (stats.percent >= 30) return t('compendium.rankAdept');
    return t('compendium.rankNovice');
  }, [stats.percent, language]);

  // Tag độ hiếm: Không dùng icon, chỉ có 1 chấm tròn màu tiệp với màu chữ
  const getRarityBadge = (rarity: TreeRarity) => {
    if (rarity === 'legendary') {
      return {
        label: language === 'vi' ? 'Huyền Thoại' : 'Legendary',
        bg: isDark ? 'rgba(234, 179, 8, 0.22)' : '#fef9c3',
        border: '#eab308',
        text: '#ca8a04',
        pastelBg: isDark ? 'rgba(234, 179, 8, 0.18)' : '#fef9c3'
      };
    }
    if (rarity === 'rare') {
      return {
        label: language === 'vi' ? 'Hiếm' : 'Rare',
        bg: isDark ? 'rgba(59, 130, 246, 0.22)' : '#eff6ff',
        border: '#3b82f6',
        text: '#2563eb',
        pastelBg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff'
      };
    }
    return {
      label: language === 'vi' ? 'Phổ Biến' : 'Common',
      bg: isDark ? 'rgba(52, 211, 153, 0.20)' : '#ecfdf5',
      border: '#10b981',
      text: '#059669',
      pastelBg: isDark ? 'rgba(52, 211, 153, 0.14)' : '#ecfdf5'
    };
  };

  const formatDate = (epochMs?: number) => {
    if (!epochMs) return '--/--/----';
    const d = new Date(epochMs);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const selectedLeafConfig = LEAF_TYPE_CONFIGS[selectedLeafType];
  const selectedLeafName = selectedLeafConfig
    ? (t(`leafNames.${selectedLeafConfig.key}` as any) || selectedLeafConfig.name)
    : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar as any} backgroundColor={colors.background} />

      {/* HEADER & TIẾN ĐỘ THU THẬP */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>
            {t('compendium.title')}
          </Text>
          <View style={[styles.rankBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Text style={[styles.rankBadgeText, { color: colors.primary }]}>
              {botanistRank}
            </Text>
          </View>
        </View>
        <Text style={[styles.screenSubtitle, { color: colors.textMuted }]}>
          {t('compendium.subtitle')}
        </Text>

        {/* PROGRESS CARD (168 BIẾN THỂ) */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressTextRow}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              {t('compendium.progressTitle')}
            </Text>
            <Text style={[styles.progressCount, { color: colors.primary }]}>
              {stats.totalDiscovered} / {stats.totalTraits} ({stats.percent}%)
            </Text>
          </View>
          <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceSecondary }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.max(2, stats.percent)}%`,
                  backgroundColor: colors.primary
                }
              ]}
            />
          </View>
        </View>
      </View>

      {/* THANH CHỌN 14 LOÀI LÁ (Sắp xếp theo số màu đã khám phá nhiều nhất lên trước) */}
      <View style={[styles.leafSelectorContainer, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leafSelectorScroll}
        >
          {leafTypesList.map(leaf => {
            const isSelected = leaf.id === selectedLeafType;
            const rot = COMPENDIUM_LEAF_ROTATIONS[leaf.id] || 0;
            const leafColor = isSelected
              ? colors.primary
              : (leaf.unlockedCount > 0 ? (isDark ? '#e2e8f0' : '#334155') : (isDark ? '#475569' : '#94a3b8'));

            return (
              <TouchableOpacity
                key={leaf.id}
                activeOpacity={0.75}
                style={[
                  styles.leafTabPill,
                  {
                    backgroundColor: isSelected
                      ? colors.primaryLight
                      : (isDark ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc'),
                    borderColor: isSelected ? colors.primary : colors.border
                  }
                ]}
                onPress={() => {
                  setHasUserSelectedLeaf(true);
                  setSelectedLeafType(leaf.id);
                }}
              >
                <View style={styles.leafTabIconBox}>
                  <AuthenticLeafView
                    leafType={leaf.id}
                    size={22}
                    rotation={rot}
                    color={leafColor}
                  />
                </View>
                <Text
                  style={[
                    styles.leafTabName,
                    {
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? '700' : '500'
                    }
                  ]}
                  numberOfLines={1}
                >
                  {leaf.name}
                </Text>
                <View
                  style={[
                    styles.leafTabCountBadge,
                    {
                      backgroundColor: leaf.unlockedCount > 0
                        ? (isSelected ? colors.primary : (isDark ? '#334155' : '#e2e8f0'))
                        : (isDark ? '#1e293b' : '#f1f5f9')
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.leafTabCountText,
                      {
                        color: leaf.unlockedCount > 0
                          ? (isSelected ? '#ffffff' : colors.textSecondary)
                          : colors.textMuted
                      }
                    ]}
                  >
                    {leaf.unlockedCount}/12
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* THANH LỌC ĐỘ HIẾM (Rarity Filter Pills) */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'common', 'rare', 'legendary'] as RarityFilter[]).map(filter => {
            const isFilterActive = rarityFilter === filter;
            const filterLabel = filter === 'all'
              ? (t('compendium.filterAll') || 'Tất cả')
              : filter === 'common'
                ? (t('compendium.filterCommon') || 'Phổ biến')
                : filter === 'rare'
                  ? (t('compendium.filterRare') || 'Hiếm')
                  : (t('compendium.filterLegendary') || 'Huyền thoại');

            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.7}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isFilterActive ? colors.primary : (isDark ? '#1e293b' : '#f1f5f9'),
                    borderColor: isFilterActive ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setRarityFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isFilterActive ? '#ffffff' : colors.textSecondary,
                      fontWeight: isFilterActive ? '700' : '500'
                    }
                  ]}
                >
                  {filterLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* GRID 12 BIẾN THỂ MÀU SẮC */}
      <ScrollView
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.varietyHeader}>
          <Text style={[styles.varietyHeaderTitle, { color: colors.text }]}>
            {selectedLeafName}
          </Text>
          <Text style={[styles.varietyHeaderSub, { color: colors.textMuted }]}>
            {t('compendium.discoveredProgress', {
              count: varietiesForSelectedLeaf.filter(v => v.isUnlocked).length,
              total: varietiesForSelectedLeaf.length
            })}
          </Text>
        </View>

        <View style={styles.gridContainer}>
          {filteredVarieties.map(item => {
            const badge = getRarityBadge(item.rarity);
            const title = item.isUnlocked
              ? item.localizedPaletteName
              : (t('compendium.undiscovered') || 'Chưa khám phá');

            // 3 màu sắc chuẩn của bộ màu
            const shade0 = item.shades[0]?.hex || '#10b981';
            const shade1 = item.shades[1]?.hex || shade0;
            const shade2 = item.shades[2]?.hex || shade0;

            const isWillow = item.leafType === LeafType.WILLOW;
            // Với các loài lá xòe rộng (Phong 2 loại, Ngân hạnh, Tùng la hán, Lá thông), dịch 2 lá trái phải ra xa thêm 4px
            const isWide =
              item.leafType === LeafType.MAPLE ||
              item.leafType === LeafType.MAPLE5 ||
              item.leafType === LeafType.GINKGO_FAN ||
              item.leafType === LeafType.TUNG_LAHAN ||
              item.leafType === LeafType.NEEDLE;
            const sideX = isWide ? 22 : 13;

            // Màu nền ô lá: Nếu đã khám phá -> màu pastel của độ hiếm; Chưa khám phá -> màu xám sáng nhẹ
            const leafBoxBg = item.isUnlocked
              ? badge.pastelBg
              : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6');

            return (
              <TouchableOpacity
                key={item.palette.id}
                activeOpacity={0.8}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderWidth: item.isUnlocked ? 2 : 1,
                    borderColor: item.isUnlocked
                      ? badge.border
                      : (isDark ? '#27272a' : '#e5e7eb')
                  }
                ]}
                onPress={() => setSelectedVariety(item)}
              >
                {/* KHUNG HIỂN THỊ LÁ TRÀN VIỀN SANG 2 BÊN VÀ LÊN TRÊN */}
                <View
                  style={[
                    styles.leafBleedContainer,
                    {
                      backgroundColor: leafBoxBg
                    }
                  ]}
                >
                  {/* TAG ĐỘ HIẾM - GÓC TRÊN BÊN TRÁI, KHÔNG ICON, CÓ 1 CHẤM MÀU TIỆP MÀU CHỮ */}
                  <View
                    style={[
                      styles.cardRarityTag,
                      {
                        backgroundColor: badge.bg,
                        borderColor: badge.border
                      }
                    ]}
                  >
                    <View style={[styles.rarityDot, { backgroundColor: badge.text }]} />
                    <Text style={[styles.cardRarityTagText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>

                  {/* 3 LÁ CĂN CHÍNH GIỮA (LỆCH SANG TRÁI 12PX THEO YÊU CẦU) */}
                  <Svg width="100%" height="100%" viewBox="-55 -62 110 88">
                    {isWillow ? (
                      /* Riêng lá liễu rủ: Tụm lại ở ngọn trên cao, buông rủ xòe ra ở gốc dưới */
                      <G transform="translate(-12, 0)">
                        {/* Đất nền bên dưới nơi cành liễu buông rủ */}
                        <Path
                          d="M -40 22 Q 0 18 40 22"
                          stroke={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          fill="none"
                        />
                        {/* Điểm chốt ngọn trên cao nơi 3 nhánh liễu tụm lại */}
                        <Circle cx="0" cy="-37" r="2.8" fill="#8d6e63" />

                        {/* Nhánh giữa: Buông rủ thẳng xuống */}
                        <G transform="translate(0, -6)">
                          <AuthenticLeafContent leafType={LeafType.WILLOW} color={shade1} scale={0.52} />
                        </G>

                        {/* Nhánh trái: Tụm ở ngọn, xòe rủ sang trái ở gốc */}
                        <G transform="rotate(-18, 0, -37) translate(0, -6)">
                          <AuthenticLeafContent leafType={LeafType.WILLOW} color={shade0} scale={0.46} />
                        </G>

                        {/* Nhánh phải: Tụm ở ngọn, xòe rủ sang phải ở gốc */}
                        <G transform="rotate(18, 0, -37) translate(0, -6)">
                          <AuthenticLeafContent leafType={LeafType.WILLOW} color={shade2} scale={0.46} />
                        </G>
                      </G>
                    ) : (
                      /* Các loài lá khác: Tụm lại ở gốc dưới đất, xòe ra ở ngọn */
                      <G transform="translate(-12, 0)">
                        {/* Đất mầm non */}
                        <Path
                          d="M -40 14 Q 0 10 40 14"
                          stroke={isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)'}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          fill="none"
                        />
                        <Circle cx="0" cy="13" r="3" fill="#8d6e63" />

                        {/* Lá trái (với loài lá rộng thì x = -17 thay vì -13) */}
                        <G transform={`translate(-${sideX}, 10) rotate(-34)`}>
                          <AuthenticLeafContent leafType={item.leafType} color={shade0} scale={0.46} />
                        </G>

                        {/* Lá giữa vươn cao nhô lên trên (y = -5) */}
                        <G transform="translate(0, -5) rotate(0)">
                          <AuthenticLeafContent leafType={item.leafType} color={shade1} scale={0.56} />
                        </G>

                        {/* Lá phải (với loài lá rộng thì x = +17 thay vì +13) */}
                        <G transform={`translate(${sideX}, 10) rotate(34)`}>
                          <AuthenticLeafContent leafType={item.leafType} color={shade2} scale={0.46} />
                        </G>
                      </G>
                    )}
                  </Svg>
                </View>

                {/* PHẦN THÂN THẺ (3 CHẤM MÀU VÀ TIÊU ĐỀ) */}
                <View style={styles.cardBody}>
                  {/* 3 CHẤM MÀU CỦA BỘ MÀU */}
                  <View style={styles.dotsRow}>
                    <View style={[styles.shadeDot, { backgroundColor: shade0 }]} />
                    <View style={[styles.shadeDot, { backgroundColor: shade1 }]} />
                    <View style={[styles.shadeDot, { backgroundColor: shade2 }]} />
                  </View>

                  {/* TÊN BỘ MÀU HOẶC 'CHƯA KHÁM PHÁ' (FONT THƯỜNG, THẲNG, KHÔNG NGHIÊNG) */}
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color: item.isUnlocked ? colors.text : colors.textMuted
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {!item.isUnlocked ? '🔒 ' : ''}{title}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* DETAIL MODAL (Xem chi tiết biến thể khi chạm vào) */}
      <Modal
        visible={!!selectedVariety}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedVariety(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedVariety(null)}
        >
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderWidth: selectedVariety?.isUnlocked ? 2 : 1,
                borderColor: selectedVariety?.isUnlocked
                  ? getRarityBadge(selectedVariety.rarity).border
                  : colors.border
              }
            ]}
            onPress={e => e.stopPropagation()}
          >
            {selectedVariety && (() => {
              const badge = getRarityBadge(selectedVariety.rarity);
              const title = selectedVariety.isUnlocked
                ? selectedVariety.localizedPaletteName
                : (t('compendium.undiscovered') || 'Chưa khám phá');

              const shade0 = selectedVariety.shades[0]?.hex || '#10b981';
              const shade1 = selectedVariety.shades[1]?.hex || shade0;
              const shade2 = selectedVariety.shades[2]?.hex || shade0;

              const isModalWillow = selectedVariety.leafType === LeafType.WILLOW;
              const isModalWide =
                selectedVariety.leafType === LeafType.MAPLE ||
                selectedVariety.leafType === LeafType.MAPLE5 ||
                selectedVariety.leafType === LeafType.GINKGO_FAN ||
                selectedVariety.leafType === LeafType.TUNG_LAHAN ||
                selectedVariety.leafType === LeafType.NEEDLE;
              const modalSideX = isModalWide ? 24 : 15;

              const modalBoxBg = selectedVariety.isUnlocked
                ? badge.pastelBg
                : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6');

              return (
                <View>
                  {/* MODAL HEADER WITH BADGE */}
                  <View style={styles.modalHeaderRow}>
                    <View style={[styles.cardRarityTagModal, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <View style={[styles.rarityDot, { backgroundColor: badge.text }]} />
                      <Text style={[styles.cardRarityTagText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.modalCloseBtn}
                      onPress={() => setSelectedVariety(null)}
                    >
                      <Text style={[styles.modalCloseBtnText, { color: colors.textMuted }]}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* LARGE 3-LEAF SPROUT DISPLAY */}
                  <View style={[styles.modalTriLeafBox, { backgroundColor: modalBoxBg }]}>
                    <Svg width="100%" height="100%" viewBox="-80 -65 160 92">
                      {isModalWillow ? (
                        <G transform="translate(-42, 0)">
                          <Path
                            d="M -44 24 Q 0 20 44 24"
                            stroke={isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)'}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            fill="none"
                          />
                          <Circle cx="0" cy="-40" r="3.2" fill="#8d6e63" />

                          <G transform="translate(0, -7)">
                            <AuthenticLeafContent leafType={selectedVariety.leafType} color={shade1} scale={0.62} />
                          </G>
                          <G transform="rotate(-18, 0, -40) translate(0, -7)">
                            <AuthenticLeafContent leafType={selectedVariety.leafType} color={shade0} scale={0.54} />
                          </G>
                          <G transform="rotate(18, 0, -40) translate(0, -7)">
                            <AuthenticLeafContent leafType={selectedVariety.leafType} color={shade2} scale={0.54} />
                          </G>
                        </G>
                      ) : (
                        <G transform="translate(-42, 0)">
                          {/* Đất mầm non */}
                          <Path
                            d="M -44 15 Q 0 11 44 15"
                            stroke={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)'}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            fill="none"
                          />
                          <Circle cx="0" cy="14" r="3.2" fill="#8d6e63" />

                          {/* Lá trái (với loài lá rộng x = -19 thay vì -15) */}
                          <G transform={`translate(-${modalSideX}, 11) rotate(-34)`}>
                            <AuthenticLeafContent leafType={selectedVariety.leafType} color={shade0} scale={0.54} />
                          </G>

                          {/* Lá giữa vươn cao nhô lên */}
                          <G transform="translate(0, -6) rotate(0)">
                            <AuthenticLeafContent leafType={selectedVariety.leafType} color={shade1} scale={0.66} />
                          </G>

                          {/* Lá phải (với loài lá rộng x = +19 thay vì +15) */}
                          <G transform={`translate(${modalSideX}, 11) rotate(34)`}>
                            <AuthenticLeafContent leafType={selectedVariety.leafType} color={shade2} scale={0.54} />
                          </G>
                        </G>
                      )}
                    </Svg>
                  </View>

                  {/* TITLES (Font thẳng, không nghiêng) */}
                  <Text style={[styles.modalVarietyTitle, { color: colors.text }]}>
                    {!selectedVariety.isUnlocked ? '🔒 ' : ''}{title}
                  </Text>
                  <Text style={[styles.modalLeafSubTitle, { color: colors.primary }]}>
                    🌿 {selectedLeafName}
                  </Text>

                  {/* 3 SHADE COLOR BADGES */}
                  <View style={styles.modalShadesRow}>
                    {selectedVariety.shades.map((sh, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.modalShadeChip,
                          {
                            backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                            borderColor: colors.border
                          }
                        ]}
                      >
                        <View
                          style={[
                            styles.modalShadeDot,
                            {
                              backgroundColor: sh.hex
                            }
                          ]}
                        />
                        <Text style={[styles.modalShadeHex, { color: colors.textSecondary }]}>
                          {sh.hex.toUpperCase()}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* STATUS / ENCOUNTER INFO */}
                  {selectedVariety.isUnlocked ? (
                    <View style={[styles.modalInfoBox, { backgroundColor: colors.surfaceSecondary }]}>
                      <View style={styles.modalInfoRow}>
                        <Text style={[styles.modalInfoKey, { color: colors.textSecondary }]}>
                          {t('compendium.dateUnlocked')}:
                        </Text>
                        <Text style={[styles.modalInfoVal, { color: colors.text }]}>
                          {formatDate(selectedVariety.entry?.firstDiscoveredAt)}
                        </Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={[styles.modalInfoKey, { color: colors.textSecondary }]}>
                          {t('compendium.encounterCount')}:
                        </Text>
                        <Text style={[styles.modalInfoVal, { color: colors.primary, fontWeight: '700' }]}>
                          {selectedVariety.entry?.timesEncountered || 1}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.modalInfoBox, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc' }]}>
                      <Text style={[styles.lockedHintText, { color: colors.textMuted }]}>
                        💡 {t('compendium.lockedHint') || 'Biến thể này chưa được khám phá. Hãy thu hoạch hạt mầm hoặc quét chip NFC từ bạn bè để sưu tầm trọn bộ!'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      {/* BOTTOM NAVIGATION */}
      <BottomNavBar activeTab="compendium" onSelectTab={onNavigateTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3
  },
  rankBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  screenSubtitle: {
    fontSize: 13,
    marginBottom: 12
  },
  progressCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600'
  },
  progressCount: {
    fontSize: 13,
    fontWeight: '700'
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4
  },
  leafSelectorContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8
  },
  leafSelectorScroll: {
    paddingHorizontal: 14,
    gap: 8
  },
  leafTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6
  },
  leafTabIconBox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  leafTabName: {
    fontSize: 12
  },
  leafTabCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  leafTabCountText: {
    fontSize: 10,
    fontWeight: '700'
  },
  filterBar: {
    paddingVertical: 8
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1
  },
  filterPillText: {
    fontSize: 12
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 90
  },
  varietyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12
  },
  varietyHeaderTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  varietyHeaderSub: {
    fontSize: 12
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between'
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden', // Bo góc và tràn viền khung lá
    marginBottom: 2
  },
  leafBleedContainer: {
    width: '100%',
    height: 114,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardRarityTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4.5
  },
  cardRarityTagModal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  cardRarityTagText: {
    fontSize: 10,
    fontWeight: '700'
  },
  countBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  cardBody: {
    width: '100%',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    alignItems: 'center'
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 6,
    alignItems: 'center'
  },
  shadeDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '500', // Font thường, không in đậm, không nghiêng
    fontStyle: 'normal', // Đảm bảo chữ thẳng đứng
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalCloseBtn: {
    padding: 6
  },
  modalCloseBtnText: {
    fontSize: 18,
    fontWeight: '700'
  },
  modalTriLeafBox: {
    width: '100%',
    height: 125,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  modalVarietyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    fontStyle: 'normal'
  },
  modalLeafSubTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14
  },
  modalShadesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16
  },
  modalShadeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5
  },
  modalShadeDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  modalShadeHex: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600'
  },
  modalInfoBox: {
    padding: 12,
    borderRadius: 12,
    gap: 8
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalInfoKey: {
    fontSize: 12
  },
  modalInfoVal: {
    fontSize: 12,
    fontWeight: '600'
  },
  lockedHintText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center'
  }
});
