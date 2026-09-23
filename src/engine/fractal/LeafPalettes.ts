/**
 * 12 Authentic Leaf Palettes from GitHub Repository
 * Project: Fractal Tree NFC Mobile Game
 * Source: source-reference/lib/fractal-branch-tree.js lines 2480-2605
 */

import { LeafPalette } from '../../types';

export interface PaletteShade {
  name: string;
  hex: string;
  rgb: [number, number, number];
}

export const GITHUB_LEAF_PALETTES: Record<LeafPalette, PaletteShade[]> = {
  // 0. SAKURA (Hoa Anh Đào)
  [LeafPalette.SAKURA]: [
    { name: 'Sakura Pink', hex: '#fda4ba', rgb: [253, 164, 186] },
    { name: 'Soft Magenta', hex: '#f472b6', rgb: [244, 114, 182] },
    { name: 'Pearl White-Pink', hex: '#fce7f3', rgb: [252, 231, 243] }
  ],

  // 1. AUTUMN (Phong Đỏ)
  [LeafPalette.AUTUMN]: [
    { name: 'Crimson Red', hex: '#dc2626', rgb: [220, 38, 38] },
    { name: 'Fiery Scarlet', hex: '#ef4444', rgb: [239, 68, 68] },
    { name: 'Fiery Orange-Red', hex: '#f97316', rgb: [249, 115, 22] },
    { name: 'Deep Ruby Wine', hex: '#b91c1c', rgb: [185, 28, 28] }
  ],

  // 2. GINKGO (Ngân Hạnh)
  [LeafPalette.GINKGO]: [
    { name: 'Bright Canary', hex: '#facc15', rgb: [250, 204, 21] },
    { name: 'Sun Gold', hex: '#eab308', rgb: [234, 179, 8] },
    { name: 'Warm Honey', hex: '#f59e0b', rgb: [245, 158, 11] }
  ],

  // 3. WISTERIA (Tử Đằng)
  [LeafPalette.WISTERIA]: [
    { name: 'Pastel Lavender', hex: '#c084fc', rgb: [192, 132, 252] },
    { name: 'Royal Violet', hex: '#a855f7', rgb: [168, 85, 247] },
    { name: 'Soft Orchid', hex: '#e879f9', rgb: [232, 121, 249] }
  ],

  // 4. FROST (Băng Tuyết)
  [LeafPalette.FROST]: [
    { name: 'Ice Cyan', hex: '#38bdf8', rgb: [56, 189, 248] },
    { name: 'Diamond Sky', hex: '#7dd3fc', rgb: [125, 211, 252] },
    { name: 'Frozen Crystal', hex: '#e0f2fe', rgb: [224, 242, 254] }
  ],

  // 5. SUNSET (Hoàng Hôn)
  [LeafPalette.SUNSET]: [
    { name: 'Coral Red', hex: '#f43f5e', rgb: [244, 63, 94] },
    { name: 'Fiery Peach', hex: '#fb923c', rgb: [251, 146, 60] },
    { name: 'Golden Flame', hex: '#fbbf24', rgb: [251, 191, 36] }
  ],

  // 6. MIDNIGHT (Dạ Lam)
  [LeafPalette.MIDNIGHT]: [
    { name: 'Celestial Indigo', hex: '#6366f1', rgb: [99, 102, 241] },
    { name: 'Sapphire Blue', hex: '#3b82f6', rgb: [59, 130, 246] },
    { name: 'Neon Violet-Blue', hex: '#818cf8', rgb: [129, 140, 248] }
  ],

  // 7. EUCALYPTUS (Bạch Đàn Khói Bạc)
  [LeafPalette.EUCALYPTUS]: [
    { name: 'Glaucous Sage', hex: '#92b9a5', rgb: [146, 185, 165] },
    { name: 'Powdered Eucalyptus', hex: '#a8cab8', rgb: [168, 202, 184] },
    { name: 'Dusty Teal', hex: '#7aa08e', rgb: [122, 160, 142] }
  ],

  // 8. GOLDEN (Kim Sa)
  [LeafPalette.GOLDEN]: [
    { name: 'Kim Sa Hoàng Kim', hex: '#fef08a', rgb: [254, 240, 138] },
    { name: 'Vàng Hoàng Gia', hex: '#facc15', rgb: [250, 204, 21] },
    { name: 'Hổ Phách Vàng Đồng', hex: '#ca8a04', rgb: [202, 138, 4] }
  ],

  // 9. RUBY (Hồng Ngọc)
  [LeafPalette.RUBY]: [
    { name: 'Hồng Ngọc Sáng', hex: '#fb7185', rgb: [251, 113, 133] },
    { name: 'Huyết Ngọc', hex: '#f43f5e', rgb: [244, 63, 94] },
    { name: 'Hồng Ngọc Thẫm', hex: '#be123c', rgb: [190, 18, 60] }
  ],

  // 10. SHADOW (Hư Không / Hắc Thạch)
  [LeafPalette.SHADOW]: [
    { name: 'Xám Bạc Hư Không', hex: '#94a3b8', rgb: [148, 163, 184] },
    { name: 'Hắc Thạch', hex: '#475569', rgb: [71, 85, 105] },
    { name: 'Huyền Dạ', hex: '#1e293b', rgb: [30, 41, 59] }
  ],

  // 11. EMERALD (Ngọc Lục Bảo)
  [LeafPalette.EMERALD]: [
    { name: 'Emerald Green', hex: '#34d399', rgb: [52, 211, 153] },
    { name: 'Mint Green', hex: '#6ee7b7', rgb: [110, 231, 183] },
    { name: 'Deep Forest Green', hex: '#059669', rgb: [5, 150, 105] }
  ]
};

/**
 * Bảng màu lá đặc biệt dành riêng cho giao diện sáng (Light Theme)
 * Tăng cường độ tương phản và chiều sâu sắc tố trên nền sáng
 */
export const GITHUB_LEAF_PALETTES_LIGHT: Partial<Record<LeafPalette, PaletteShade[]>> = {
  // 4. FROST (Băng Tuyết trên nền sáng - Cobalt Glacial, không bị lóa trắng)
  [LeafPalette.FROST]: [
    { name: 'Cobalt Glacial Azure', hex: '#0284c7', rgb: [2, 132, 199] },
    { name: 'Vibrant Glacial Sky', hex: '#0ea5e9', rgb: [14, 165, 233] },
    { name: 'Crisp Ice Cyan', hex: '#38bdf8', rgb: [56, 189, 248] }
  ]
};

/**
 * Lấy danh sách sắc độ màu lá theo bảng màu và theme giao diện
 */
export function getLeafPaletteShades(palette: LeafPalette, isDark: boolean = true): PaletteShade[] {
  if (!isDark && GITHUB_LEAF_PALETTES_LIGHT[palette]) {
    return GITHUB_LEAF_PALETTES_LIGHT[palette]!;
  }
  return GITHUB_LEAF_PALETTES[palette] || GITHUB_LEAF_PALETTES[LeafPalette.EMERALD];
}

export function getLeafColorByHash(palette: LeafPalette, hashVal: number, isDark: boolean = true): string {
  const shades = getLeafPaletteShades(palette, isDark);
  const idx = Math.floor(Math.abs(hashVal) * shades.length) % shades.length;
  return shades[idx].hex;
}

/**
 * Tìm bảng màu LeafPalette gần nhất dựa vào khoảng cách màu RGB
 */
export function findClosestLeafPalette(r: number, g: number, b: number): LeafPalette {
  let bestPalette = LeafPalette.EMERALD;
  let minDistance = Infinity;

  const entries = Object.entries(GITHUB_LEAF_PALETTES) as [string, PaletteShade[]][];
  for (const [palKey, shades] of entries) {
    const palId = Number(palKey) as LeafPalette;
    const baseRgb = shades[0].rgb;
    const dist = (r - baseRgb[0]) ** 2 + (g - baseRgb[1]) ** 2 + (b - baseRgb[2]) ** 2;
    if (dist < minDistance) {
      minDistance = dist;
      bestPalette = palId;
    }
  }

  return bestPalette;
}

export interface PaletteConfigItem {
  id: LeafPalette;
  key: string;
  name_vi: string;
  name_en: string;
  color: string;
  dot: string;
  rarity: 'common' | 'rare' | 'legendary';
}

/**
 * Danh Mục 12 Bảng Màu Lá Cây đồng bộ 100% với landing.html & Catalog
 */
export const ALL_LEAF_PALETTES_CONFIG: PaletteConfigItem[] = [
  { id: LeafPalette.EMERALD, key: 'emerald', name_vi: 'Ngọc Bích', name_en: 'Emerald Jade', color: '#059669', dot: '#34d399', rarity: 'common' },
  { id: LeafPalette.SAKURA, key: 'sakura', name_vi: 'Hồng Phấn', name_en: 'Sakura Blossom', color: '#f472b6', dot: '#fda4ba', rarity: 'legendary' },
  { id: LeafPalette.AUTUMN, key: 'autumn', name_vi: 'Phong Đỏ', name_en: 'Autumn Crimson', color: '#dc2626', dot: '#ef4444', rarity: 'common' },
  { id: LeafPalette.GINKGO, key: 'ginkgo', name_vi: 'Hoàng Kim', name_en: 'Ginkgo Gold', color: '#eab308', dot: '#facc15', rarity: 'rare' },
  { id: LeafPalette.WISTERIA, key: 'wisteria', name_vi: 'Tử Đằng', name_en: 'Wisteria Violet', color: '#a855f7', dot: '#c084fc', rarity: 'rare' },
  { id: LeafPalette.FROST, key: 'frost', name_vi: 'Băng Tuyết', name_en: 'Glacial Frost', color: '#0284c7', dot: '#38bdf8', rarity: 'legendary' },
  { id: LeafPalette.SUNSET, key: 'sunset', name_vi: 'Hoàng Hôn', name_en: 'Sunset Amber', color: '#ea580c', dot: '#f43f5e', rarity: 'rare' },
  { id: LeafPalette.MIDNIGHT, key: 'midnight', name_vi: 'Dạ Lam', name_en: 'Midnight Indigo', color: '#4338ca', dot: '#6366f1', rarity: 'rare' },
  { id: LeafPalette.EUCALYPTUS, key: 'eucalyptus', name_vi: 'Khói Bạc', name_en: 'Silver Eucalyptus', color: '#475569', dot: '#92b9a5', rarity: 'common' },
  { id: LeafPalette.GOLDEN, key: 'golden', name_vi: 'Kim Sa', name_en: 'Radiant Gold', color: '#ca8a04', dot: '#facc15', rarity: 'legendary' },
  { id: LeafPalette.RUBY, key: 'ruby', name_vi: 'Hồng Ngọc', name_en: 'Ruby Flame', color: '#be123c', dot: '#fb7185', rarity: 'rare' },
  { id: LeafPalette.SHADOW, key: 'shadow', name_vi: 'Hắc Diệp', name_en: 'Shadow Obsidian', color: '#1e293b', dot: '#475569', rarity: 'rare' }
];
