/**
 * TreeCard Component - Thẻ hiển thị cây trên lưới 2 cột khu vườn
 * Project: Fractal Tree NFC Mobile Game
 *
 * Quy chuẩn:
 * - Đồng nhất màu nền card theo theme (sáng/tối) cho mọi đời cây P, F1, Fn
 * - Hình ảnh đại diện cây hình vuông tràn viền (aspectRatio: 1)
 * - Huy hiệu đời cây (P, F1, Fn) và icon hạt giống (🌱) đè lên góc trên bên trái của ảnh
 * - Màu tên loại lá phân định theo độ hiếm:
 *   + Common: Xanh lá
 *   + Rare: Xanh biển
 *   + Legendary: Vàng kim
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import Svg, { Path, G, Circle, Rect, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { TreeModel, LeafType, LeafPalette } from '../types';
import { getLeafConfig } from '../engine/fractal/LeafConfigs';
import { GITHUB_LEAF_PALETTES, getLeafPaletteShades } from '../engine/fractal/LeafPalettes';
import { AuthenticLeafContent } from './AuthenticLeafView';
import { FractalTreeBridge, AuthenticTreeSvgOutput } from '../engine/fractal/FractalTreeBridge';
import { useTheme } from '../theme/ThemeContext';
import { usePerformance } from '../context/PerformanceContext';
import { useLanguage } from '../i18n/LanguageContext';
import { getLeafTypeRarity, getTreeRarity, getTreeFullName, findTrunkTheme } from '../config/GeneticsConfig';

interface TreeCardProps {
  tree: TreeModel;
  isArchive?: boolean;
  onPress?: (tree: TreeModel) => void;
  onHarvestSeed?: (tree: TreeModel) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const getRarityColor = (rarity: 'common' | 'rare' | 'legendary', isDark: boolean): string => {
  switch (rarity) {
    case 'legendary':
      return isDark ? '#fbbf24' : '#d97706'; // Vàng kim
    case 'rare':
      return isDark ? '#38bdf8' : '#0284c7'; // Xanh biển
    case 'common':
    default:
      return isDark ? '#4ade80' : '#16a34a'; // Xanh lá bình thường
  }
};

const formatNfcCode = (nfcUid?: string, treeId?: string): string => {
  if (nfcUid && nfcUid !== 'ARCHIVED' && !nfcUid.startsWith('tree-') && !nfcUid.startsWith('archive-')) {
    return nfcUid.toUpperCase();
  }
  const clean = (treeId || nfcUid || '0000').replace(/[^a-zA-Z0-9]/g, '');
  return `#NFC-${clean.slice(-4).toUpperCase()}`;
};

export const TreeCard: React.FC<TreeCardProps> = ({
  tree,
  isArchive = false,
  onPress,
  onHarvestSeed
}) => {
  const { colors, isDark } = useTheme();
  const { effectsEnabled } = usePerformance();
  const { t } = useLanguage();
  const leafCfg = getLeafConfig(tree.genetics.leafType);
  const palette = getLeafPaletteShades(tree.genetics.paletteIndex, isDark);
  const mainColor = palette[0]?.hex || colors.primary;
  const isSeedling = tree.currentProgress < 0.10;
  const isParent = tree.generation === 0;

  // Độ hiếm chuẩn của cây (theo màu lá & ngoại lệ sinh học, khớp 100% với trang chi tiết)
  const treeRarity = getTreeRarity(tree.genetics);
  const leafRarityColor = getRarityColor(treeRarity, isDark);
  const fullTreeName = getTreeFullName(tree.genetics);
  const leafDisplayName = t(`leafNames.${leafCfg.key}`) || leafCfg.name.split('/')[0].trim();
  const rarityLabel = treeRarity === 'legendary'
    ? t('treeDetail.rarityLegendary')
    : (treeRarity === 'rare' ? t('treeDetail.rarityRare') : t('treeDetail.rarityCommon'));

  const paletteKeys: Record<number, string> = {
    [LeafPalette.SAKURA]: 'sakura',
    [LeafPalette.AUTUMN]: 'autumn',
    [LeafPalette.GINKGO]: 'ginkgo',
    [LeafPalette.WISTERIA]: 'wisteria',
    [LeafPalette.FROST]: 'frost',
    [LeafPalette.SUNSET]: 'sunset',
    [LeafPalette.MIDNIGHT]: 'midnight',
    [LeafPalette.EUCALYPTUS]: 'eucalyptus',
    [LeafPalette.GOLDEN]: 'golden',
    [LeafPalette.RUBY]: 'ruby',
    [LeafPalette.SHADOW]: 'shadow',
    [LeafPalette.EMERALD]: 'emerald'
  };
  const palKey = paletteKeys[tree.genetics.paletteIndex] || 'emerald';
  const rawPaletteName = t(`paletteNames.${palKey}`) || 'Ngọc Bích';
  const paletteDisplayName = rawPaletteName.split('/')[0].trim();
  const trunkTheme = findTrunkTheme(tree.genetics.trunkColor);
  const trunkColor = trunkTheme.color;

  /**
   * Render mầm non 3 lá xòe rẻ quạt (< 10%) với hình học lá chuẩn xác 100%
   */
  const renderSeedlingPreview = () => {
    return (
      <View style={styles.seedlingWrapper}>
        <Svg width="100%" height="100%" viewBox="-55 -55 110 110">
          <Defs>
            <RadialGradient id={`seedling-bg-${tree.id}`} cx="50%" cy="40%" rx="70%" ry="70%" fx="50%" fy="40%">
              <Stop offset="0%" stopColor={isDark ? '#101d24' : '#d8edd9'} />
              <Stop offset="100%" stopColor={isDark ? '#060a08' : '#edf5ef'} />
            </RadialGradient>
          </Defs>
          {/* Nền Radial Gradient tương thích 100% với màn hình chi tiết */}
          <Rect x="-55" y="-55" width="110" height="110" fill={`url(#seedling-bg-${tree.id})`} />

          {/* Bầu trời sao nếu ở chế độ tối */}
          {isDark && (
            <G>
              <Circle cx="-32" cy="-35" r="0.8" fill="#ffffff" opacity={0.6} />
              <Circle cx="28" cy="-42" r="1.1" fill="#bae6fd" opacity="0.8" />
              <Circle cx="28" cy="-42" r="2.2" fill="#bae6fd" opacity="0.25" />
              <Circle cx="-15" cy="-25" r="0.7" fill="#fef08a" opacity="0.5" />
              <Circle cx="38" cy="-20" r="0.8" fill="#ffffff" opacity="0.6" />
              <Circle cx="-40" cy="-12" r="0.9" fill="#fbcfe8" opacity="0.7" />
            </G>
          )}

          {/* Gò đất tự nhiên ôm mầm non */}
          <Ellipse cx="0" cy="14" rx="34" ry="8" fill={isDark ? '#121c16' : '#c2dec9'} opacity="0.95" />
          <Ellipse cx="0" cy="12" rx="24" ry="5.5" fill={isDark ? '#1c2a22' : '#d5ebd9'} opacity="0.9" />
          <Ellipse cx="0" cy="11" rx="14" ry="3" fill={isDark ? '#273a30' : '#e2f2e5'} opacity="0.85" />
          <Circle cx="0" cy="11" r="3.2" fill="#8d6e63" />

          {/* Lá trái (xoay -32°) */}
          <G transform="translate(-8, 8) rotate(-32)">
            <AuthenticLeafContent leafType={tree.genetics.leafType} color={mainColor} scale={0.45} />
          </G>

          {/* Lá giữa vươn cao (0°) */}
          <G transform="translate(0, 4) rotate(0)">
            <AuthenticLeafContent leafType={tree.genetics.leafType} color={palette[1]?.hex || mainColor} scale={0.55} />
          </G>

          {/* Lá phải (xoay +32°) */}
          <G transform="translate(8, 8) rotate(32)">
            <AuthenticLeafContent leafType={tree.genetics.leafType} color={palette[2]?.hex || mainColor} scale={0.45} />
          </G>
        </Svg>
      </View>
    );
  };

  /**
   * Render hình chiếu cây cành fractal thu nhỏ (>= 10%)
   * Tự động làm mới cache hình học nếu là các loài lá kim hoặc snapshot cũ
   */
  const renderFractalTreePreview = () => {
    let svgData: AuthenticTreeSvgOutput | null = null;
    const isNeedleOrTung =
      tree.genetics.leafType === LeafType.TUNG_LAHAN ||
      tree.genetics.leafType === LeafType.NEEDLE ||
      tree.genetics.leafType === LeafType.WILLOW;
    const isFrostTree = tree.genetics.paletteIndex === LeafPalette.FROST;
    const isGoldenTree = tree.genetics.paletteIndex === LeafPalette.GOLDEN;

    // Với cây Băng Tuyết hoặc các loại lá đặc thù, luôn sinh ảnh theo theme sáng/tối hiện tại
    const shouldRegenerate = isNeedleOrTung || isFrostTree;

    if (tree.thumbnailData && !shouldRegenerate) {
      try {
        svgData = JSON.parse(tree.thumbnailData);
      } catch {
        svgData = null;
      }
    }
    if (!svgData) {
      svgData = FractalTreeBridge.generateAuthenticSvg(
        tree.genetics,
        tree.currentProgress,
        0.42,
        0,
        1.0,
        0,
        undefined,
        false,
        isDark
      );
    }

    const bounds = svgData.bounds || { minX: -50, maxX: 50, minY: -120, maxY: 15 };
    const padding = 12;

    // Chuẩn hóa khung nhìn thành hình vuông 1:1 ôm trọn cây và gò đất gốc
    const effectiveMinY = Math.min(bounds.minY, -40);
    const effectiveMaxY = Math.max(bounds.maxY, 12);
    const effectiveMinX = Math.min(bounds.minX, -28);
    const effectiveMaxX = Math.max(bounds.maxX, 28);

    const rawW = effectiveMaxX - effectiveMinX + padding * 2;
    const rawH = effectiveMaxY - effectiveMinY + padding * 2;
    const size = Math.max(rawW, rawH);
    const cx = (effectiveMinX + effectiveMaxX) / 2;
    const cy = (effectiveMinY + effectiveMaxY) / 2;
    const vbX = +(cx - size / 2).toFixed(1);
    const vbY = +(cy - size / 2).toFixed(1);
    const width = +size.toFixed(1);
    const height = +size.toFixed(1);

    // Kích thước gò đất tự nhiên ôm gốc cây
    const moundRx = Math.max(16, Math.min(36, width * 0.18));
    const moundRy = +(moundRx * 0.22).toFixed(1);

    // Sinh vị trí các ngôi sao tinh tú cố định theo dnaSeed của cây
    const stars: Array<{ x: number; y: number; r: number; color: string; opacity: number; isLuminous: boolean }> = [];
    if (isDark) {
      let seed = (tree.genetics.dnaSeed || 123456) ^ 0x5bf03635;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      const STAR_COLORS = ['#ffffff', '#e0f2fe', '#bae6fd', '#fef08a', '#fbcfe8'];
      const starCount = 14;
      for (let i = 0; i < starCount; i++) {
        const sx = vbX + rand() * width;
        const sy = vbY + rand() * (height * 0.70); // Bầu trời phía trên
        const r = 0.5 + rand() * 0.8;
        const isLuminous = rand() > 0.70;
        stars.push({
          x: +sx.toFixed(1),
          y: +sy.toFixed(1),
          r: +r.toFixed(1),
          color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
          opacity: +(0.35 + rand() * 0.50).toFixed(2),
          isLuminous
        });
      }
    }

    // Sinh các hạt Băng Tinh hoặc Kim Sa lấp lánh (nếu bật hiệu ứng đồ họa đặc biệt)
    const showSparkles = (isGoldenTree || isFrostTree) && effectsEnabled;
    const cardSparkles: Array<{ x: number; y: number; size: number; color: string }> = [];

    if (showSparkles) {
      let seed = (tree.genetics.dnaSeed || 123456) ^ 0x3d7b8e11;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      const sparkleColors = isFrostTree
        ? (isDark ? ['#ffffff', '#e0f2fe', '#7dd3fc', '#38bdf8'] : ['#0284c7', '#0ea5e9', '#38bdf8', '#ffffff'])
        : ['#ffffff', '#fef08a', '#facc15', '#fde047'];

      const canopyW = bounds.maxX - bounds.minX;
      const canopyH = bounds.maxY - bounds.minY;
      const canopyMidX = (bounds.minX + bounds.maxX) / 2;
      const canopyMidY = bounds.minY + canopyH * 0.44;

      const sparkleCount = 14;
      for (let i = 0; i < sparkleCount; i++) {
        const ang = rand() * Math.PI * 2;
        const rad = (0.15 + 0.75 * Math.sqrt(rand()));
        const sx = +(canopyMidX + (canopyW * 0.45) * rad * Math.cos(ang)).toFixed(1);
        const sy = +(canopyMidY + (canopyH * 0.42) * rad * Math.sin(ang)).toFixed(1);
        const sSize = +(1.6 + rand() * 1.8).toFixed(1);
        cardSparkles.push({
          x: sx,
          y: sy,
          size: sSize,
          color: sparkleColors[Math.floor(rand() * sparkleColors.length)]
        });
      }
    }

    return (
      <View style={styles.treeCanvasWrapper}>
        <Svg width="100%" height="100%" viewBox={`${vbX} ${vbY} ${width} ${height}`}>
          <Defs>
            <RadialGradient id={`tree-card-bg-${tree.id}`} cx="50%" cy="40%" rx="70%" ry="70%" fx="50%" fy="40%">
              <Stop offset="0%" stopColor={isDark ? '#101d24' : '#d8edd9'} />
              <Stop offset="100%" stopColor={isDark ? '#060a08' : '#edf5ef'} />
            </RadialGradient>
          </Defs>

          {/* 1. Lớp nền Radial Gradient tương thích 100% với màn hình chi tiết */}
          <Rect x={vbX} y={vbY} width={width} height={height} fill={`url(#tree-card-bg-${tree.id})`} />

          {/* 2. Bầu trời đêm đầy sao lấp lánh (chỉ xuất hiện ở Dark mode) */}
          {isDark && stars.map((star, idx) => (
            <G key={`thumb-star-${idx}`}>
              {star.isLuminous && (
                <Circle cx={star.x} cy={star.y} r={star.r * 2.2} fill={star.color} opacity={0.25} />
              )}
              <Circle cx={star.x} cy={star.y} r={star.r} fill={star.color} opacity={star.opacity} />
            </G>
          ))}

          {/* 3. Vùng gò đất rêu phong tự nhiên ôm sát gốc cây (tương đồng 100% với AnimatedTreeCanvas) */}
          {/* Lớp đất tối nền dưới */}
          <Ellipse
            cx={0}
            cy={2}
            rx={moundRx * 1.3}
            ry={moundRy * 1.3}
            fill={isDark ? '#121c16' : '#c2dec9'}
            opacity={0.95}
          />
          {/* Gò đất màu mỡ ôm gốc rễ */}
          <Ellipse
            cx={0}
            cy={1}
            rx={moundRx}
            ry={moundRy}
            fill={isDark ? '#1c2a22' : '#d5ebd9'}
            opacity={0.90}
          />
          {/* Vạt rêu hữu cơ nhạt nhẹ sát gốc cây */}
          <Ellipse
            cx={0}
            cy={0}
            rx={moundRx * 0.55}
            ry={moundRy * 0.55}
            fill={isDark ? '#273a30' : '#e2f2e5'}
            opacity={0.85}
          />

          {/* 4. Cành thân, bạnh gốc và rễ trồi (Tô bằng trunkColor đã nâng sáng chuẩn) */}
          {svgData.branchesPath ? (
            <Path
              d={svgData.branchesPath}
              fill={trunkColor}
              stroke="none"
            />
          ) : null}

          {/* 5. Cuống lá */}
          {svgData.petiolesPath ? (
            <Path
              d={svgData.petiolesPath}
              fill="none"
              stroke={trunkColor}
              strokeWidth={0.8}
            />
          ) : null}

          {/* 6. Tán lá xum xuê chuẩn màu sắc */}
          {svgData.leafLayers?.map((layer, idx) => (
            <Path
              key={`thumb-leaf-${idx}`}
              d={layer.d}
              fill={layer.color || mainColor}
              stroke="none"
            />
          ))}

          {/* 7. Hạt Băng tinh / Kim sa lấp lánh (Hình thoi 4 cạnh lõm) */}
          {showSparkles && cardSparkles.map((sp, idx) => (
            <Path
              key={`thumb-sparkle-${idx}`}
              d="M 0 -1 Q 0 0 1 0 Q 0 0 0 1 Q 0 0 -1 0 Q 0 0 0 -1 Z"
              transform={`translate(${sp.x}, ${sp.y}) scale(${sp.size})`}
              fill={sp.color}
              opacity={0.88}
            />
          ))}
        </Svg>
      </View>
    );
  };

  const progressPercent = Math.min(100, Math.floor(tree.currentProgress * 100));

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[
        styles.card,
        {
          // Mọi đời cây (P, F1, Fn) đều dùng chung một màu nền card theo theme thống nhất
          backgroundColor: colors.card,
          borderColor: colors.border
        }
      ]}
      onPress={() => onPress && onPress(tree)}
    >
      {/* 1. HÌNH ẢNH CÂY HÌNH VUÔNG TRÀN VIỀN (aspectRatio: 1) */}
      <View style={[styles.previewContainer, { backgroundColor: isDark ? '#060a08' : '#edf5ef' }]}>
        {isSeedling ? renderSeedlingPreview() : renderFractalTreePreview()}

        {/* 2. HUY HIỆU ĐỘ HIẾM CỦA CÂY ĐÈ LÊN GÓC TRÊN BÊN TRÁI ẢNH */}
        <View style={styles.imageOverlayTopLeft}>
          <View style={[
            styles.rarityBadgeOverlay,
            treeRarity === 'legendary'
              ? (isDark ? styles.rarityLegendaryDark : styles.rarityLegendaryLight)
              : (treeRarity === 'rare'
                  ? (isDark ? styles.rarityRareDark : styles.rarityRareLight)
                  : (isDark ? styles.rarityCommonDark : styles.rarityCommonLight))
          ]}>
            <Text style={[
              styles.rarityBadgeOverlayText,
              treeRarity === 'legendary'
                ? (isDark ? styles.rarityLegendaryTextDark : styles.rarityLegendaryTextLight)
                : (treeRarity === 'rare'
                    ? (isDark ? styles.rarityRareTextDark : styles.rarityRareTextLight)
                    : (isDark ? styles.rarityCommonTextDark : styles.rarityCommonTextLight))
            ]}>
              {rarityLabel}
            </Text>
          </View>
        </View>

        {/* 3. HUY HIỆU ĐỜI CÂY (P/F1/Fn) VÀ HẠT GIỐNG Ở GÓC DƯỚI BÊN TRÁI ẢNH */}
        <View style={styles.imageOverlayBottomLeft}>
          <View style={[
            styles.genTag,
            isParent
              ? (isDark ? styles.genTagParentDark : styles.genTagParentLight)
              : (isDark ? styles.genTagFDark : styles.genTagFLight)
          ]}>
            <Text style={[
              styles.genTagText,
              isParent
                ? (isDark ? styles.genTagParentTextDark : styles.genTagParentTextLight)
                : (isDark ? styles.genTagFTextDark : styles.genTagFTextLight)
            ]}>
              {isParent ? 'P' : `F${tree.generation}`}
            </Text>
          </View>

          {/* Icon hạt giống nếu có */}
          {tree.hasSeedReady && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onHarvestSeed && onHarvestSeed(tree)}
              style={styles.seedIconTag}
            >
              <Text style={styles.seedIconText}>🌱</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Nếu là Archive: Huy hiệu Nhà Kính ở góc trên bên phải ảnh */}
        {isArchive && (
          <View style={styles.imageOverlayTopRight}>
            <View style={[
              styles.archiveTopPill,
              { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.85)' }
            ]}>
              <Text style={styles.archiveTopIcon}>🏛️</Text>
            </View>
          </View>
        )}
      </View>

      {/* 4. PHẦN THÔNG TIN BÊN DƯỚI */}
      <View style={styles.infoBody}>
        {/* Tên cây như trong trang chi tiết: Cho phép xuống dòng nếu dài */}
        <Text style={[styles.treeTitle, { color: colors.text }]} numberOfLines={2}>
          {fullTreeName}
        </Text>

        {isArchive ? (
          <View style={styles.archiveMetaBox}>
            {/* Loại lá */}
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t('archive.leafType')}</Text>
              <Text style={[styles.metaValue, { color: leafRarityColor }]} numberOfLines={1}>
                {leafDisplayName}
              </Text>
            </View>

            {/* Màu lá */}
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t('archive.leafColor')}</Text>
              <View style={styles.colorPill}>
                <View style={[styles.colorDot, { backgroundColor: mainColor }]} />
                <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
                  {paletteDisplayName}
                </Text>
              </View>
            </View>

            {/* Mã NFC */}
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t('archive.nfcCode')}</Text>
              <Text style={[styles.nfcCodeText, { color: colors.primary }]} numberOfLines={1}>
                {formatNfcCode(tree.nfcUid, tree.id)}
              </Text>
            </View>

            {/* Huy hiệu hoàn tất hoặc tiến độ lưu trữ */}
            <View style={[
              styles.cycleCompleteBadge,
              progressPercent >= 100
                ? {
                    backgroundColor: isDark ? 'rgba(74, 222, 128, 0.12)' : '#dcfce7',
                    borderColor: isDark ? 'rgba(74, 222, 128, 0.3)' : '#86efac'
                  }
                : {
                    backgroundColor: isDark ? 'rgba(251, 191, 36, 0.12)' : '#fef3c7',
                    borderColor: isDark ? 'rgba(251, 191, 36, 0.35)' : '#fde68a'
                  }
            ]}>
              <Text style={[
                styles.cycleCompleteText,
                { color: progressPercent >= 100 ? (isDark ? '#4ade80' : '#15803d') : (isDark ? '#fbbf24' : '#b45309') }
              ]}>
                {progressPercent >= 100 ? `✓ ${t('archive.completeBadge')}` : `📦 ${t('archive.progressBadge', { pct: progressPercent })}`}
              </Text>
            </View>

            {/* Mini Progress Track khi cây chưa hoàn thành 100% */}
            {progressPercent < 100 && (
              <View style={[styles.progressTrack, { height: 3, marginTop: 4, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%`, backgroundColor: isDark ? '#fbbf24' : '#d97706' }
                  ]}
                />
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Tên loại lá */}
            <Text style={[styles.leafTypeLabel, { color: leafRarityColor }]} numberOfLines={1}>
              {leafDisplayName}
            </Text>

            {/* Thanh tiến trình tăng trưởng */}
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                  {tree.currentProgress >= 1.0 ? t('common.matureTree') : t('common.seedling')}
                </Text>
                <Text style={[styles.progressVal, { color: colors.text }]}>{progressPercent}%</Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%`, backgroundColor: leafRarityColor }
                  ]}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden'
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative'
  },
  imageOverlayTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20
  },
  imageOverlayBottomLeft: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20
  },
  rarityBadgeOverlay: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 3
  },
  rarityBadgeOverlayText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  genTag: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  genTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  genTagParentDark: {
    backgroundColor: 'rgba(28, 25, 18, 0.85)',
    borderColor: 'rgba(251, 191, 36, 0.7)'
  },
  genTagParentLight: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b'
  },
  genTagParentTextDark: {
    color: '#fbbf24'
  },
  genTagParentTextLight: {
    color: '#b45309'
  },
  genTagFDark: {
    backgroundColor: 'rgba(15, 24, 19, 0.85)',
    borderColor: 'rgba(74, 222, 128, 0.6)'
  },
  genTagFLight: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e'
  },
  genTagFTextDark: {
    color: '#4ade80'
  },
  genTagFTextLight: {
    color: '#15803d'
  },
  imageOverlayTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 20
  },
  archiveTopPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  archiveTopIcon: {
    fontSize: 10
  },
  archiveMetaBox: {
    marginTop: 4,
    gap: 4
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  metaLabel: {
    fontSize: 10.5,
    fontWeight: '500'
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '700'
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  nfcCodeText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  cycleCompleteBadge: {
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cycleCompleteText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  seedIconTag: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 7,
    backgroundColor: 'rgba(251, 191, 36, 0.28)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center'
  },
  seedIconText: {
    fontSize: 12
  },
  seedlingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },
  treeCanvasWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoBody: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12
  },
  treeTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    marginBottom: 4
  },
  rarityCommonDark: {
    backgroundColor: '#0c2e20',
    borderColor: '#10b981'
  },
  rarityRareDark: {
    backgroundColor: '#082f49',
    borderColor: '#38bdf8'
  },
  rarityLegendaryDark: {
    backgroundColor: '#382405',
    borderColor: '#f59e0b'
  },
  rarityCommonLight: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac'
  },
  rarityRareLight: {
    backgroundColor: '#e0f2fe',
    borderColor: '#7dd3fc'
  },
  rarityLegendaryLight: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d'
  },
  rarityCommonTextDark: { color: '#34d399' },
  rarityRareTextDark: { color: '#38bdf8' },
  rarityLegendaryTextDark: { color: '#fbbf24' },
  rarityCommonTextLight: { color: '#15803d' },
  rarityRareTextLight: { color: '#0284c7' },
  rarityLegendaryTextLight: { color: '#b45309' },
  leafTypeLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 8
  },
  progressSection: {
    marginTop: 2
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '500'
  },
  progressVal: {
    fontSize: 10,
    fontWeight: '700'
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  }
});
