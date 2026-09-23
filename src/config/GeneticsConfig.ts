/**
 * Genetics & Breeding Mutation Configuration
 * Project: Fractal Tree NFC Mobile Game
 * Source: ui-ux/03-admin-tree-generator.html lines 946-1030 & src/config/treeConfig.ts
 */

import { LeafType, LeafPalette, TreeGenetics } from '../types';
import { TREE_CONFIG } from './treeConfig';

/**
 * Tỷ lệ độ hiếm khi quay màu lá ngẫu nhiên theo cấp độ của cây mẹ (Tổng = 100%):
 * - Cây Phổ Thông (Common): 5% Huyền Thoại, 25% Hiếm, 70% Phổ Thông
 * - Cây Hiếm (Rare): 10% Huyền Thoại, 35% Hiếm, 55% Phổ Thông
 * - Cây Huyền Thoại (Legendary): 15% Huyền Thoại, 45% Hiếm, 40% Phổ Thông
 */
export const RARITY_CHANCES_BY_PARENT: Record<
  TreeRarity,
  { legendary: number; rare: number; common: number }
> = {
  common: {
    legendary: 5,
    rare: 25,
    common: 70
  },
  rare: {
    legendary: 10,
    rare: 35,
    common: 55
  },
  legendary: {
    legendary: 15,
    rare: 45,
    common: 40
  }
};

export const RARITY_CHANCES = RARITY_CHANCES_BY_PARENT.common;

/**
 * Danh sách toàn bộ 12 bảng màu lá chuẩn
 */
export const ALL_LEAF_PALETTES: LeafPalette[] = [
  LeafPalette.SAKURA,
  LeafPalette.AUTUMN,
  LeafPalette.GINKGO,
  LeafPalette.WISTERIA,
  LeafPalette.FROST,
  LeafPalette.SUNSET,
  LeafPalette.MIDNIGHT,
  LeafPalette.EUCALYPTUS,
  LeafPalette.GOLDEN,
  LeafPalette.RUBY,
  LeafPalette.SHADOW,
  LeafPalette.EMERALD
];

/**
 * Phân định cấp độ hiếm (Common, Rare, Legendary)
 */
export type TreeRarity = 'common' | 'rare' | 'legendary';

/**
 * Thời gian sinh trưởng chuẩn theo độ hiếm:
 * - Common (Phổ Biến): 1 ngày (86.400s)
 * - Rare (Hiếm): 3 ngày (259.200s = 3 * 86.400s)
 * - Legendary (Huyền Thoại): 7 ngày (604.800s = 7 * 86.400s)
 */
export const RARITY_DURATIONS: Record<TreeRarity, number> = {
  common: 86400,    // 1 ngày
  rare: 259200,     // 3 ngày
  legendary: 604800 // 7 ngày
};

/**
 * Phân loại độ hiếm cho từng loại lá (Leaf Shape):
 * - Legendary: Lá phong Tròn (MAPLE), Lá Liễu (WILLOW), Tùng La Hán (TUNG_LAHAN)
 * - Rare: Cánh Anh Đào (SAKURA_LEAF), Lá Ngân Hạnh rẻ quạt (GINKGO_FAN), Lá phong nhọn (MAPLE5), Lá me (SINGLE_NEEDLE), Lá trái tim (HEART)
 * - Common: Các lá còn lại (POINTED, EUCALYPTUS_LONG, OVAL, BODHI, ROUND, NEEDLE)
 */
export const LEAF_TYPE_RARITY: Record<LeafType, TreeRarity> = {
  // Legendary: Lá phong Tròn, Lá Liễu, Tùng La Hán
  [LeafType.MAPLE]: 'legendary',
  [LeafType.WILLOW]: 'legendary',
  [LeafType.TUNG_LAHAN]: 'legendary',

  // Rare: Cánh Anh Đào, Lá Ngân Hạnh rẻ quạt, Lá phong nhọn, Lá me, lá trái tim
  [LeafType.SAKURA_LEAF]: 'rare',
  [LeafType.GINKGO_FAN]: 'rare',
  [LeafType.MAPLE5]: 'rare',
  [LeafType.SINGLE_NEEDLE]: 'rare',
  [LeafType.HEART]: 'rare',

  // Common: các lá còn lại
  [LeafType.POINTED]: 'common',
  [LeafType.EUCALYPTUS_LONG]: 'common',
  [LeafType.OVAL]: 'common',
  [LeafType.BODHI]: 'common',
  [LeafType.ROUND]: 'common',
  [LeafType.NEEDLE]: 'common'
};

/**
 * Phân loại độ hiếm màu sắc chung cho 12 bảng màu lá (Palette):
 * - Legendary: hồng phấn (SAKURA), băng tuyết (FROST), kim sa (GOLDEN)
 * - Rare: Hoàng kim (GINKGO), Tử đằng (WISTERIA), Dạ Lam (MIDNIGHT), Hồng ngọc (RUBY), Hắc diệp (SHADOW), Hoàng Hôn (SUNSET)
 * - Common: các màu còn lại (Ngọc Bích EMERALD, Khói Bạc EUCALYPTUS, Phong Đỏ AUTUMN)
 */
export const DEFAULT_PALETTE_RARITY: Record<LeafPalette, TreeRarity> = {
  [LeafPalette.SAKURA]: 'legendary',
  [LeafPalette.FROST]: 'legendary',
  [LeafPalette.GOLDEN]: 'legendary',

  [LeafPalette.GINKGO]: 'rare',
  [LeafPalette.WISTERIA]: 'rare',
  [LeafPalette.MIDNIGHT]: 'rare',
  [LeafPalette.RUBY]: 'rare',
  [LeafPalette.SHADOW]: 'rare',
  [LeafPalette.SUNSET]: 'rare',

  [LeafPalette.EMERALD]: 'common',
  [LeafPalette.EUCALYPTUS]: 'common',
  [LeafPalette.AUTUMN]: 'common'
};

/**
 * Phân loại độ hiếm màu sắc cho từng loại lá (Leaf Color with Exceptions):
 * Ngoại lệ:
 * - Cánh Anh Đào (SAKURA_LEAF): màu Hồng Phấn (SAKURA) là common
 * - Lá phong 2 loại (MAPLE & MAPLE5): màu Hoàng Hôn (SUNSET) là common
 * - Lá ngân hạnh (GINKGO_FAN): màu Hoàng Kim (GINKGO) là common
 * - Lá khuynh diệp tròn (ROUND) và lá bạch đàn (EUCALYPTUS_LONG): màu Khói Bạc (EUCALYPTUS) là common
 */
export function getLeafColorRarity(leafType: LeafType, palette: LeafPalette): TreeRarity {
  // Ngoại lệ 1: Cánh Anh Đào: màu Hồng Phấn là common
  if (leafType === LeafType.SAKURA_LEAF && palette === LeafPalette.SAKURA) {
    return 'common';
  }

  // Ngoại lệ 2: Lá phong (2 loại): màu hoàng hôn là common
  if ((leafType === LeafType.MAPLE || leafType === LeafType.MAPLE5) && palette === LeafPalette.SUNSET) {
    return 'common';
  }

  // Ngoại lệ 3: Lá ngân hạnh: màu Hoàng Kim là common
  if (leafType === LeafType.GINKGO_FAN && palette === LeafPalette.GINKGO) {
    return 'common';
  }

  // Ngoại lệ 4: Lá khuynh diệp tròn và lá bạch đàn: màu khói bạc là common
  if ((leafType === LeafType.ROUND || leafType === LeafType.EUCALYPTUS_LONG) && palette === LeafPalette.EUCALYPTUS) {
    return 'common';
  }

  return DEFAULT_PALETTE_RARITY[palette] || 'common';
}

/**
 * Tra cứu độ hiếm của loài lá
 */
export function getLeafTypeRarity(leafType: LeafType): TreeRarity {
  return LEAF_TYPE_RARITY[leafType] || 'common';
}

/**
 * Ma trận phân bổ bảng màu lá theo từng loài lá, tự động phân nhóm theo ngoại lệ chuẩn
 */
export const LEAF_TYPE_COLOR_POOLS: Record<
  LeafType,
  {
    common: LeafPalette[];
    rare: LeafPalette[];
    legendary: LeafPalette[];
  }
> = (() => {
  const pools = {} as Record<LeafType, { common: LeafPalette[]; rare: LeafPalette[]; legendary: LeafPalette[] }>;
  for (let lt = 0; lt <= 13; lt++) {
    pools[lt as LeafType] = {
      common: ALL_LEAF_PALETTES.filter(p => getLeafColorRarity(lt as LeafType, p) === 'common'),
      rare: ALL_LEAF_PALETTES.filter(p => getLeafColorRarity(lt as LeafType, p) === 'rare'),
      legendary: ALL_LEAF_PALETTES.filter(p => getLeafColorRarity(lt as LeafType, p) === 'legendary')
    };
  }
  return pools;
})();

export interface TrunkTheme {
  id: string;
  name: string;
  color: string;
  rarity: 'common';
}

/**
 * 9 Theme màu thân cây chuẩn tự nhiên từ code gốc - Tất cả đều thuộc độ hiếm Phổ Biến (Common)
 */
export const ALL_TRUNK_THEMES: TrunkTheme[] = [
  { id: 'emerald', name: 'Thân Rêu Cổ Thụ', color: '#4a3b2c', rarity: 'common' },
  { id: 'sakura', name: 'Mộc Trầm Anh Đào', color: '#5c4033', rarity: 'common' },
  { id: 'autumn', name: 'Gỗ Sồi Phong Ba', color: '#4a3d35', rarity: 'common' },
  { id: 'eucalyptus', name: 'Bạch Đàn Khói Bạc', color: '#3d5a4c', rarity: 'common' },
  { id: 'ebony', name: 'Hắc Mộc Cổ Điển', color: '#3d3e48', rarity: 'common' },
  { id: 'birch', name: 'Bạch Dương Tuyết Phủ', color: '#60626a', rarity: 'common' },
  { id: 'mahogany', name: 'Hồng Mộc Hoàng Gia', color: '#5c2a2a', rarity: 'common' },
  { id: 'amber', name: 'Hoàng Đàn Hổ Phách', color: '#583a22', rarity: 'common' },
  { id: 'cyberpunk', name: 'Huyền Dạ Dạ Quang', color: '#3f3274', rarity: 'common' }
];

/**
 * Bản đồ tương thích ngược cho mã màu cũ (Legacy Trunk Colors) đã lưu trong DB / Thẻ NFC
 */
const LEGACY_TRUNK_COLOR_MAP: Record<string, string> = {
  '#2d2219': 'emerald',
  '#36261e': 'sakura',
  '#181412': 'autumn',
  '#23372d': 'eucalyptus',
  '#141418': 'ebony',
  '#37373c': 'birch',
  '#2d1212': 'mahogany',
  '#28190f': 'amber',
  '#18123b': 'cyberpunk'
};

/**
 * Tìm theme thân cây chuẩn từ mã hex hoặc tên theme
 * Sử dụng khoảng cách màu Euclidean RGB để đối chiếu sai lệch nén nhị phân RGB565 hoặc màu cũ
 */
export function findTrunkTheme(trunkColor?: string): TrunkTheme {
  if (!trunkColor) return ALL_TRUNK_THEMES[0];
  const cleaned = trunkColor.trim().toLowerCase();

  // 1. Khớp theo theme ID (ví dụ: 'emerald', 'sakura')
  const byId = ALL_TRUNK_THEMES.find(t => t.id.toLowerCase() === cleaned);
  if (byId) return byId;

  // 2. Khớp trực tiếp theo mã màu Hex (ví dụ: '#4a3b2c')
  const byColor = ALL_TRUNK_THEMES.find(t => t.color.toLowerCase() === cleaned);
  if (byColor) return byColor;

  // 3. Khớp theo bản đồ màu cũ (Legacy Trunk Colors)
  if (LEGACY_TRUNK_COLOR_MAP[cleaned]) {
    const legacyTheme = ALL_TRUNK_THEMES.find(t => t.id === LEGACY_TRUNK_COLOR_MAP[cleaned]);
    if (legacyTheme) return legacyTheme;
  }

  // 3. Khớp gần nhất theo khoảng cách màu RGB Euclidean
  const hex = cleaned.startsWith('#') ? cleaned.slice(1) : cleaned;
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      let closestTheme = ALL_TRUNK_THEMES[0];
      let minDistance = Infinity;

      for (const theme of ALL_TRUNK_THEMES) {
        const tHex = theme.color.slice(1);
        const tr = parseInt(tHex.slice(0, 2), 16);
        const tg = parseInt(tHex.slice(2, 4), 16);
        const tb = parseInt(tHex.slice(4, 6), 16);

        const dist = (r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2;
        if (dist < minDistance) {
          minDistance = dist;
          closestTheme = theme;
        }
      }
      return closestTheme;
    }
  }

  return ALL_TRUNK_THEMES[0];
}

/**
 * Danh mục tên hiển thị loại lá & loài cây theo catalog chuẩn
 */
export const LEAF_SHAPE_INFO: Record<LeafType, { name: string; label: string; baseName: string }> = {
  [LeafType.POINTED]: { name: '🌿 Lá Đỉnh Nhọn', label: 'Lá Nhọn', baseName: 'Tiểu Diệp Dung' },
  [LeafType.MAPLE]: { name: '🍁 Lá Phong Tròn', label: 'Phong Tròn', baseName: 'Phong Đại Ngàn' },
  [LeafType.MAPLE5]: { name: '🍁 Lá Phong 5 Khía', label: 'Phong 5 Khía', baseName: 'Phong Tinh Thể' },
  [LeafType.GINKGO_FAN]: { name: '🍂 Ngân Hạnh Rẻ Quạt', label: 'Ngân Hạnh', baseName: 'Bạch Quả Hoàng Kim' },
  [LeafType.HEART]: { name: '💚 Lá Trái Tim', label: 'Trái Tim', baseName: 'Tâm Mộc Linh Chi' },
  [LeafType.SINGLE_NEEDLE]: { name: '🌾 Lá Me Lông Chim', label: 'Lá Me', baseName: 'Ngân Me Lông Vũ' },
  [LeafType.TUNG_LAHAN]: { name: '🎋 Tùng La Hán', label: 'Tùng La Hán', baseName: 'Cổ Tùng La Hán' },
  [LeafType.SAKURA_LEAF]: { name: '🌸 Cánh Anh Đào', label: 'Cánh Anh Đào', baseName: 'Anh Đào Tuyết Vũ' },
  [LeafType.EUCALYPTUS_LONG]: { name: '🍃 Bạch Đàn Lá Dài', label: 'Bạch Đàn Dài', baseName: 'Bạch Đàn Nguyệt Vũ' },
  [LeafType.OVAL]: { name: '🥚 Lá Oval Cổ Điển', label: 'Lá Oval', baseName: 'Linh Mộc Cổ Điển' },
  [LeafType.BODHI]: { name: '🍃 Lá Bồ Đề', label: 'Bồ Đề', baseName: 'Bồ Đề Đại Giác' },
  [LeafType.ROUND]: { name: '🪙 Khuynh Diệp Đồng Xu', label: 'Khuynh Diệp', baseName: 'Kim Ngân Khuynh Diệp' },
  [LeafType.NEEDLE]: { name: '🌲 Lá Thông 7 Kim', label: 'Lá Thông', baseName: 'Tuyết Tùng Băng Lam' },
  [LeafType.WILLOW]: { name: '🌾 Cây Liễu Rủ', label: 'Liễu Rủ', baseName: 'Thùy Dương Yến Liễu' }
};

/**
 * Danh mục bảng màu lá & độ hiếm chuẩn Catalog
 */
export const LEAF_PALETTE_INFO: Record<LeafPalette, { name: string; suffix: string; rarity: 'common' | 'rare' | 'legendary' }> = {
  [LeafPalette.EMERALD]: { name: 'Ngọc Bích', suffix: 'Ngọc Bích', rarity: 'common' },
  [LeafPalette.SAKURA]: { name: 'Hồng Phấn', suffix: 'Hồng Phấn', rarity: 'legendary' },
  [LeafPalette.AUTUMN]: { name: 'Phong Đỏ', suffix: 'Phong Đỏ', rarity: 'common' },
  [LeafPalette.GINKGO]: { name: 'Hoàng Kim', suffix: 'Hoàng Kim', rarity: 'rare' },
  [LeafPalette.WISTERIA]: { name: 'Tử Đằng', suffix: 'Tử Đằng', rarity: 'rare' },
  [LeafPalette.FROST]: { name: 'Băng Tuyết', suffix: 'Băng Tuyết', rarity: 'legendary' },
  [LeafPalette.SUNSET]: { name: 'Hoàng Hôn', suffix: 'Hoàng Hôn', rarity: 'rare' },
  [LeafPalette.MIDNIGHT]: { name: 'Dạ Lam', suffix: 'Dạ Lam', rarity: 'rare' },
  [LeafPalette.EUCALYPTUS]: { name: 'Khói Bạc', suffix: 'Khói Bạc', rarity: 'common' },
  [LeafPalette.GOLDEN]: { name: 'Kim Sa', suffix: 'Kim Sa', rarity: 'legendary' },
  [LeafPalette.RUBY]: { name: 'Hồng Ngọc', suffix: 'Hồng Ngọc', rarity: 'rare' },
  [LeafPalette.SHADOW]: { name: 'Hắc Diệp', suffix: 'Hắc Diệp', rarity: 'rare' }
};

/**
 * Phân định màu thân cây & nhãn hiển thị
 */
export const getTrunkDisplay = (trunkColor?: string) => {
  const theme = findTrunkTheme(trunkColor);
  return {
    name: theme.name,
    label: theme.name.split(' ')[0] || theme.name,
    color: theme.color
  };
};

/**
 * Lấy tên cây hoàn chỉnh chuẩn như màn hình chi tiết:
 * Ví dụ: "Tiểu Diệp Dung • Ngọc Bích" (Chỉ tên cây và màu sắc lá)
 */
export function getTreeFullName(genetics: TreeGenetics): string {
  const shapeInfo = LEAF_SHAPE_INFO[genetics.leafType] || LEAF_SHAPE_INFO[LeafType.POINTED];
  const paletteInfo = LEAF_PALETTE_INFO[genetics.paletteIndex] || LEAF_PALETTE_INFO[LeafPalette.EMERALD];
  return `${shapeInfo.baseName} • ${paletteInfo.suffix}`;
}

/**
 * Quay thưởng bảng màu lá ngẫu nhiên theo loài lá và phân bố độ hiếm dựa trên cấp bậc cây mẹ
 */
export function pickLeafPaletteForType(leafType: LeafType, parentRarity: TreeRarity = 'common'): LeafPalette {
  const pool = LEAF_TYPE_COLOR_POOLS[leafType] || {
    common: [LeafPalette.EMERALD, LeafPalette.EUCALYPTUS],
    rare: [LeafPalette.AUTUMN, LeafPalette.SUNSET, LeafPalette.GINKGO],
    legendary: [LeafPalette.FROST, LeafPalette.WISTERIA, LeafPalette.GOLDEN]
  };

  const chances = RARITY_CHANCES_BY_PARENT[parentRarity] || RARITY_CHANCES_BY_PARENT.common;
  const roll = Math.random() * 100;
  let candidates: LeafPalette[];

  if (roll < chances.legendary && pool.legendary.length > 0) {
    candidates = pool.legendary;
  } else if (roll < (chances.legendary + chances.rare) && pool.rare.length > 0) {
    candidates = pool.rare;
  } else {
    candidates = pool.common.length > 0 ? pool.common : [LeafPalette.EMERALD];
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

/**
 * Sinh bộ gen mới ngẫu nhiên 100% cho cây con khi thu hoạch:
 * - leafType: Kế thừa cố định theo mẹ.
 * - paletteIndex: Ngẫu nhiên theo tỷ lệ thừa hưởng từ phẩm chất cây mẹ (Phổ Thông, Hiếm hoặc Huyền Thoại).
 * - Tất cả các chỉ số khác: Random 100% theo các khoảng giá trị của code gốc dự án.
 */
export function generateChildGenetics(parentGenetics: TreeGenetics): TreeGenetics {
  const leafType = parentGenetics.leafType;
  const parentRarity = getTreeRarity(parentGenetics);
  const paletteIndex = pickLeafPaletteForType(leafType, parentRarity);

  // 1. Góc phân nhánh (14° - 34°)
  const minAngle = TREE_CONFIG.branchAngleRange?.min ?? 14;
  const maxAngle = TREE_CONFIG.branchAngleRange?.max ?? 34;
  const branchAngle = Math.round(minAngle + Math.random() * (maxAngle - minAngle));

  // 2. Tỉ lệ suy giảm độ dài cành (0.68 - 0.86)
  const minLen = TREE_CONFIG.lengthDecayRange?.min ?? 0.68;
  const maxLen = TREE_CONFIG.lengthDecayRange?.max ?? 0.86;
  const lengthDecay = +(minLen + Math.random() * (maxLen - minLen)).toFixed(2);

  // 3. Tỉ lệ tiêu giảm độ dày cành (0.48 - 0.66)
  const minThickDecay = TREE_CONFIG.thicknessDecayRange?.min ?? 0.48;
  const maxThickDecay = TREE_CONFIG.thicknessDecayRange?.max ?? 0.66;
  const thicknessDecay = +(minThickDecay + Math.random() * (maxThickDecay - minThickDecay)).toFixed(2);

  // 4. Độ dày gốc thân cây (24px - 60px)
  const minInitThick = TREE_CONFIG.initThicknessRange?.min ?? 24;
  const maxInitThick = TREE_CONFIG.initThicknessRange?.max ?? 60;
  const initThickness = Math.round(minInitThick + Math.random() * (maxInitThick - minInitThick));

  // 5. Số tầng đệ quy phân nhánh (8 - 12 tầng)
  const minDepth = TREE_CONFIG.maxDepthRange?.min ?? 8;
  const maxDepth = TREE_CONFIG.maxDepthRange?.max ?? 12;
  const depthVal = Math.round(minDepth + Math.random() * (maxDepth - minDepth));

  // 6. Độ biến thiên hữu cơ cành nhánh (0.50 - 1.20)
  const minVar = TREE_CONFIG.treeVariationRange?.min ?? 0.65;
  const maxVar = TREE_CONFIG.treeVariationRange?.max ?? 1.20;
  const treeVariation = +(minVar + Math.random() * (maxVar - minVar)).toFixed(2);

  // 7. Màu thân cây: Ngẫu nhiên 1 trong 9 theme màu tự nhiên
  const randomTrunk = ALL_TRUNK_THEMES[Math.floor(Math.random() * ALL_TRUNK_THEMES.length)];
  const trunkColor = randomTrunk.color;

  // 8. DNA Seed: Sinh số UInt32 ngẫu nhiên mới hoàn toàn
  const dnaSeed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;

  return {
    leafType,
    paletteIndex,
    branchAngle,
    lengthDecay,
    thicknessDecay,
    initThickness,
    maxDepth: depthVal,
    treeVariation,
    trunkColor,
    dnaSeed
  };
}

/**
 * Xác định độ hiếm của cây dựa thuần túy trên màu sắc của lá cây (paletteIndex)
 * có xét đến các luật ngoại lệ theo loài lá (Leaf Color Exceptions).
 * Không tính theo độ hiếm cao nhất của 3 chỉ số nữa.
 * Phân cấp: Legendary > Rare > Common
 */
export function getTreeRarity(genetics?: Partial<TreeGenetics> | null): TreeRarity {
  if (!genetics || genetics.paletteIndex === undefined) return 'common';
  const leafType = genetics.leafType;
  const palette = genetics.paletteIndex;

  if (leafType !== undefined) {
    return getLeafColorRarity(leafType as LeafType, palette as LeafPalette);
  }
  return DEFAULT_PALETTE_RARITY[palette as LeafPalette] || 'common';
}

/**
 * Trả về thời gian lớn của cây (giây) theo cấp độ hiếm
 */
export function getGrowthDurationForRarity(rarity: TreeRarity): number {
  return RARITY_DURATIONS[rarity] || RARITY_DURATIONS.common;
}

/**
 * Trả về thời gian lớn của cây (giây) theo bộ gen di truyền
 * Common: 1 ngày (86.400s) | Rare: 3 ngày (259.200s) | Legendary: 7 ngày (604.800s)
 */
export function getGrowthDurationForGenetics(genetics?: Partial<TreeGenetics> | null): number {
  const rarity = getTreeRarity(genetics);
  return getGrowthDurationForRarity(rarity);
}

