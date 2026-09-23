/**
 * Leaf Type Configurations (Bảng cấu hình thuộc tính 11 loài lá)
 * Project: Fractal Tree NFC Mobile Game
 */

import { LeafType } from '../../types';

export interface FruitConfig {
  enabled: boolean;
  type?: 'single_glow' | 'berry_cluster';
  chance?: number;
  size?: number;
  color?: [number, number, number];
  glow?: boolean;
}

export interface LeafTypeConfig {
  id: LeafType;
  key: string;
  name: string;
  tipLeafRange: [number, number];       // [min, max] lá ở đầu ngọn cành
  sideLeafRange: [number, number];      // [min, max] lá phụ mọc dọc cành chuẩn tại Lref = 36px
  sideLeafStartLevel: number;           // Cấp cành bắt đầu xuất hiện lá phụ
  petioleRange: [number, number];       // Tỉ lệ độ dài cuống lá phụ
  sideLeafAngle?: number;               // Góc nghiêng cơ bản (độ)
  fruit: FruitConfig;
}

export const LEAF_TYPE_CONFIGS: Record<LeafType, LeafTypeConfig> = {
  // 1. Lá Cổ Thụ Đỉnh Nhọn / Ngọc Lục Bảo
  [LeafType.POINTED]: {
    id: LeafType.POINTED,
    key: 'pointed',
    name: 'Lá đỉnh nhọn / Ngọc lục bảo',
    tipLeafRange: [2, 3],
    sideLeafRange: [3, 8],
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.40],
    sideLeafAngle: 20,
    fruit: {
      enabled: true,
      type: 'berry_cluster',
      chance: 0.15,
      size: 5.5,
      color: [220, 38, 38],
      glow: true
    }
  },

  // 2. Lá Phong 7 Thùy Đỉnh Nhọn
  [LeafType.MAPLE]: {
    id: LeafType.MAPLE,
    key: 'maple',
    name: 'Lá phong 7 thùy',
    tipLeafRange: [2, 3],
    sideLeafRange: [1, 5],
    sideLeafStartLevel: 5,
    petioleRange: [0.20, 0.40],
    sideLeafAngle: 20,
    fruit: {
      enabled: false
    }
  },

  // 3. Lá Phong 7 Thùy Hình Thoi
  [LeafType.MAPLE5]: {
    id: LeafType.MAPLE5,
    key: 'maple5',
    name: 'Lá phong hình thoi',
    tipLeafRange: [2, 3],
    sideLeafRange: [2, 6],
    sideLeafStartLevel: 5,
    petioleRange: [0.20, 0.40],
    sideLeafAngle: 20,
    fruit: {
      enabled: false
    }
  },

  // 4. Lá Ngân Hạnh / Bạch Quả Rẻ Quạt
  [LeafType.GINKGO_FAN]: {
    id: LeafType.GINKGO_FAN,
    key: 'ginkgo_fan',
    name: 'Lá ngân hạnh / Bạch quả',
    tipLeafRange: [1, 3],
    sideLeafRange: [2, 6],
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.40],
    sideLeafAngle: 20,
    fruit: {
      enabled: true,
      type: 'single_glow',
      chance: 0.14,
      size: 8.5,
      color: [245, 158, 11],
      glow: true
    }
  },

  // 5. Lá Hình Trái Tim
  [LeafType.HEART]: {
    id: LeafType.HEART,
    key: 'heart',
    name: 'Lá hình trái tim',
    tipLeafRange: [2, 4],
    sideLeafRange: [5, 8],
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.40],
    sideLeafAngle: 20,
    fruit: {
      enabled: true,
      type: 'single_glow',
      chance: 0.12,
      size: 8.0,
      color: [244, 63, 94],
      glow: true
    }
  },

  // 6. Lá Me Kép Lông Chim Chẵn
  [LeafType.SINGLE_NEEDLE]: {
    id: LeafType.SINGLE_NEEDLE,
    key: 'single_needle',
    name: 'Lá me / Lá kép lông chim',
    tipLeafRange: [2, 2],
    sideLeafRange: [9, 18],
    sideLeafStartLevel: 4,
    petioleRange: [0.35, 0.65],
    sideLeafAngle: 20,
    fruit: {
      enabled: true,
      type: 'berry_cluster',
      chance: 0.12,
      size: 5.0,
      color: [234, 88, 12],
      glow: false
    }
  },

  // 7. Lá Tùng La Hán
  [LeafType.TUNG_LAHAN]: {
    id: LeafType.TUNG_LAHAN,
    key: 'tung_lahan',
    name: 'Lá tùng la hán',
    tipLeafRange: [2, 3],
    sideLeafRange: [3, 8],
    sideLeafStartLevel: 5,
    petioleRange: [0.20, 0.45],
    sideLeafAngle: 20,
    fruit: {
      enabled: true,
      type: 'single_glow',
      chance: 0.10,
      size: 8.5,
      color: [99, 102, 241],
      glow: true
    }
  },

  // 8. Cánh / Lá Hoa Anh Đào
  [LeafType.SAKURA_LEAF]: {
    id: LeafType.SAKURA_LEAF,
    key: 'sakura_leaf',
    name: 'Lá hoa anh đào',
    tipLeafRange: [1, 3],
    sideLeafRange: [2, 5],
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.40],
    sideLeafAngle: 20,
    fruit: {
      enabled: true,
      type: 'berry_cluster',
      chance: 0.15,
      size: 5.0,
      color: [219, 39, 119],
      glow: false
    }
  },

  // 9. Lá Bạch Đàn Dài
  [LeafType.EUCALYPTUS_LONG]: {
    id: LeafType.EUCALYPTUS_LONG,
    key: 'eucalyptus_long',
    name: 'Lá bạch đàn dài',
    tipLeafRange: [2, 3],
    sideLeafRange: [2, 5],
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.35],
    sideLeafAngle: 20,
    fruit: {
      enabled: true,
      type: 'berry_cluster',
      chance: 0.14,
      size: 5.0,
      color: [20, 184, 166],
      glow: false
    }
  },

  // 10. Lá Bầu Dục Oval Chuẩn
  [LeafType.OVAL]: {
    id: LeafType.OVAL,
    key: 'oval',
    name: 'Lá hình Oval / Bầu dục',
    tipLeafRange: [2, 3],
    sideLeafRange: [3, 8],
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.40],
    sideLeafAngle: 20,
    fruit: {
      enabled: true,
      type: 'berry_cluster',
      chance: 0.15,
      size: 5.5,
      color: [14, 165, 233],
      glow: false
    }
  },

  // 11. Lá Bồ Đề Linh Thiêng
  [LeafType.BODHI]: {
    id: LeafType.BODHI,
    key: 'bodhi',
    name: 'Lá bồ đề',
    tipLeafRange: [2, 3],
    sideLeafRange: [4, 7],
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.40],
    sideLeafAngle: 20,
    fruit: {
      enabled: true,
      type: 'single_glow',
      chance: 0.18,
      size: 10.0,
      color: [255, 215, 0],
      glow: true
    }
  },

  // 12. Lá Tròn Đồng Xu / Khuynh Diệp
  [LeafType.ROUND]: {
    id: LeafType.ROUND,
    key: 'round',
    name: 'Lá tròn bạch đàn / Khuynh diệp',
    tipLeafRange: [2, 5],
    sideLeafRange: [6, 9],
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.35],
    sideLeafAngle: 20,
    fruit: {
      enabled: true,
      type: 'berry_cluster',
      chance: 0.15,
      size: 5.5,
      color: [16, 185, 129],
      glow: false
    }
  },

  // 13. Lá Thông 7 Nhánh
  [LeafType.NEEDLE]: {
    id: LeafType.NEEDLE,
    key: 'needle',
    name: 'Lá thông 7 nhánh',
    tipLeafRange: [1, 3],
    sideLeafRange: [7, 15],
    sideLeafStartLevel: 5,
    petioleRange: [0.40, 0.80],
    sideLeafAngle: 20,
    fruit: {
      enabled: true,
      type: 'single_glow',
      chance: 0.10,
      size: 9.0,
      color: [56, 189, 248],
      glow: true
    }
  },

  // 14. Cây Liễu Rủ
  [LeafType.WILLOW]: {
    id: LeafType.WILLOW,
    key: 'willow',
    name: 'Cây liễu rủ',
    tipLeafRange: [1, 1],
    sideLeafRange: [0, 0],
    sideLeafStartLevel: 99,
    petioleRange: [0.20, 0.40],
    sideLeafAngle: 20,
    fruit: {
      enabled: false
    }
  }
};

/**
 * Lấy cấu hình đặc tính chi tiết theo LeafType
 */
export function getLeafConfig(leafType: LeafType): LeafTypeConfig {
  return LEAF_TYPE_CONFIGS[leafType] || LEAF_TYPE_CONFIGS[LeafType.POINTED];
}

/**
 * Lấy cấu hình đặc tính theo key chuỗi (ví dụ 'pointed', 'ginkgo_fan')
 */
export function getLeafConfigByKey(key: string): LeafTypeConfig {
  const found = Object.values(LEAF_TYPE_CONFIGS).find((cfg) => cfg.key === key);
  return found || LEAF_TYPE_CONFIGS[LeafType.POINTED];
}
