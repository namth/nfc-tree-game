/**
 * LEAF_TYPE_CONFIGS - Bảng cấu hình thuộc tính cố định cho từng loại lá cây
 * 
 * Mỗi loại lá có thể tùy chỉnh:
 * - tipLeafRange: [min, max] - Số lượng lá mọc ở mỗi đầu ngọn cành / đốt cành (ví dụ [1, 3], [1, 1], [2, 4]...).
 * - sideLeafRange: [min, max] - Số lượng lá phụ mọc dọc theo thân mỗi cành (ví dụ [0, 4], [3, 8]...).
 * - sideLeafStartLevel: Cấp độ cành bắt đầu mọc lá phụ (mặc định 4 hoặc 5).
 * - petioleRange: [min, max] - Tỉ lệ độ dài cuống lá phụ so với chiều dài cành ngọn (mặc định [0.20, 0.40]).
 * - fruit:
 *     - enabled: true/false - Bật hoặc tắt mọc quả ở đầu ngọn cành.
 *     - type: 'single_glow' (Quả đơn phát sáng tỏa ánh hào quang) | 'berry_cluster' (Chùm quả mọng 2-3 hạt).
 *     - chance: Xác suất ngọn cành mọc quả (từ 0.0 đến 1.0, ví dụ 0.15 = 15%).
 *     - size: Kích thước bán kính quả (px).
 *     - color: [r, g, b] - Mã màu RGB của quả.
 *     - glow: true/false - Có hiệu ứng quầng sáng hào quang tỏa ra xung quanh hay không.
 */

const LEAF_TYPE_CONFIGS = {
  // 1. Lá đỉnh nhọn / Ngọc lục bảo
  pointed: {
    name: 'Lá đỉnh nhọn / Ngọc lục bảo',
    tipLeafRange: [2, 3],           // 2 - 3 lá ở mỗi đầu cành
    sideLeafRange: [3, 8],          // 3 - 8 lá phụ mỗi cành
    sideLeafStartLevel: 4,          // Mọc từ cành cấp 4 trở lên
    petioleRange: [0.20, 0.40],
    fruit: {
      enabled: true,
      type: 'berry_cluster',        // Chùm quả mọng
      chance: 0.15,
      size: 5.5,
      color: [220, 38, 38],         // Đỏ tươi
      glow: true
    }
  },

  // 2. Lá Bạch Đàn Dài (Long Eucalyptus)
  eucalyptus_long: {
    name: 'Lá bạch đàn dài',
    tipLeafRange: [2, 3],           // 2 - 3 lá ở mỗi đầu cành
    sideLeafRange: [2, 5],          // 4 - 8 lá phụ mỗi cành
    sideLeafStartLevel: 4,          // Mọc từ cành cấp 4 trở lên
    petioleRange: [0.20, 0.35],
    fruit: {
      enabled: true,
      type: 'berry_cluster',        // Chùm quả mọng bạch đàn
      chance: 0.14,
      size: 5.0,
      color: [20, 184, 166],        // Xanh ngọc biển đậm
      glow: false
    }
  },

  // 3. Lá phong 7 thùy
  maple: {
    name: 'Lá phong 7 thùy',
    tipLeafRange: [2, 3],           // 2 - 3 lá ở mỗi đầu cành
    sideLeafRange: [1, 5],          // 1 - 5 lá phụ mỗi cành
    sideLeafStartLevel: 5,
    petioleRange: [0.20, 0.40],
    fruit: {
      enabled: false                // Lá phong không mọc quả
    }
  },

  // 4. Lá phong hình thoi
  maple5: {
    name: 'Lá phong hình thoi',
    tipLeafRange: [2, 3],           // 2 - 3 lá ở mỗi đầu cành
    sideLeafRange: [2, 6],          // 2 - 6 lá phụ mỗi cành
    sideLeafStartLevel: 5,
    petioleRange: [0.20, 0.40],
    fruit: {
      enabled: false
    }
  },

  // 5. Lá ngân hạnh / Bạch quả
  ginkgo_fan: {
    name: 'Lá ngân hạnh / Bạch quả',
    tipLeafRange: [1, 3],           // 1 - 3 lá ở mỗi đầu cành
    sideLeafRange: [2, 6],          // 2 - 6 lá phụ mỗi cành
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.40],
    fruit: {
      enabled: true,
      type: 'single_glow',          // Quả phát sáng ánh vàng
      chance: 0.14,
      size: 8.5,
      color: [245, 158, 11],        // Vàng cam ấm
      glow: true
    }
  },

  // 6. Lá hoa anh đào
  sakura_leaf: {
    name: 'Lá hoa anh đào',
    tipLeafRange: [1, 3],           // 1 - 3 lá ở mỗi đầu cành
    sideLeafRange: [2, 5],          // 2 - 5 lá phụ mỗi cành
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.40],
    fruit: {
      enabled: true,
      type: 'berry_cluster',        // Chùm quả anh đào mọng
      chance: 0.15,
      size: 5.0,
      color: [219, 39, 119],        // Hồng mọng cherry
      glow: false
    }
  },

  // 7. Lá tròn / Lá xu bạch đàn (Khuynh diệp)
  round: {
    name: 'Lá tròn bạch đàn / Khuynh diệp',
    tipLeafRange: [2, 5],           // 2 - 5 lá ở mỗi đầu cành
    sideLeafRange: [6, 9],          // 6 - 9 lá phụ mỗi cành
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.35],
    fruit: {
      enabled: true,
      type: 'berry_cluster',        // Chùm quả nhỏ
      chance: 0.15,
      size: 5.5,
      color: [16, 185, 129],        // Xanh ngọc
      glow: false
    }
  },

  // 8. Lá bồ đề (Linh thiêng)
  bodhi: {
    name: 'Lá bồ đề',
    tipLeafRange: [2, 3],           // 2 - 3 lá bồ đề ở mỗi đầu cành
    sideLeafRange: [4, 7],          // 4 - 7 lá phụ mỗi cành
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.40],
    fruit: {
      enabled: true,
      type: 'single_glow',          // Quả linh thiêng phát sáng
      chance: 0.18,
      size: 10.0,
      color: [255, 215, 0],         // Ánh kim vàng rực rỡ
      glow: true
    }
  },

  // 9. Lá hình trái tim
  heart: {
    name: 'Lá hình trái tim',
    tipLeafRange: [2, 4],           // 2 - 4 lá ở mỗi đầu cành
    sideLeafRange: [5, 8],          // 5 - 8 lá phụ mỗi cành
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.40],
    fruit: {
      enabled: true,
      type: 'single_glow',
      chance: 0.12,
      size: 8.0,
      color: [244, 63, 94],         // Hồng đào phát sáng
      glow: true
    }
  },

  // 10. Lá thông 7 nhánh
  needle: {
    name: 'Lá thông 7 nhánh',
    tipLeafRange: [1, 3],           // 1 - 3 cụm lá ở mỗi đầu cành
    sideLeafRange: [7, 15],         // 7 - 15 cụm lá phụ mỗi cành
    sideLeafStartLevel: 5,
    petioleRange: [0.40, 0.80],
    fruit: {
      enabled: true,
      type: 'single_glow',
      chance: 0.10,
      size: 9.0,
      color: [56, 189, 248],        // Băng thanh lam phát sáng
      glow: true
    }
  },

  // 11. Lá me / Lá kép lông chim chẵn
  single_needle: {
    name: 'Lá me / Lá kép lông chim',
    tipLeafRange: [2, 2],           // 2 - 2 chùm lá ở mỗi đầu cành
    sideLeafRange: [9, 18],          // 9 - 18 nhánh lá phụ mỗi cành
    sideLeafStartLevel: 4,
    petioleRange: [0.35, 0.65],
    fruit: {
      enabled: true,
      type: 'berry_cluster',
      chance: 0.12,
      size: 5.0,
      color: [234, 88, 12],         // Cam quả me chín
      glow: false
    }
  },

  // 12. Lá tùng la hán
  tung_lahan: {
    name: 'Lá tùng la hán',
    tipLeafRange: [2, 3],           // 2 - 3 cụm lá ở mỗi đầu cành
    sideLeafRange: [3, 8],          // 3 - 8 cụm lá phụ mỗi cành
    sideLeafStartLevel: 5,
    petioleRange: [0.20, 0.45],
    fruit: {
      enabled: true,
      type: 'single_glow',
      chance: 0.10,
      size: 8.5,
      color: [99, 102, 241],        // Tím chàm la hán
      glow: true
    }
  },

  // 13. Lá Oval / Bầu dục
  oval: {
    name: 'Lá hình Oval / Bầu dục',
    tipLeafRange: [2, 3],           // 2 - 3 lá ở mỗi đầu cành
    sideLeafRange: [3, 8],          // 3 - 8 lá phụ mỗi cành
    sideLeafStartLevel: 4,
    petioleRange: [0.20, 0.40],
    fruit: {
      enabled: true,
      type: 'berry_cluster',
      chance: 0.15,
      size: 5.5,
      color: [14, 165, 233],        // Lam ngọc
      glow: false
    }
  },

  // 14. Cây liễu rủ
  willow: {
    name: 'Cây liễu rủ',
    tipLeafRange: [1, 1],           // Liễu có 1 cành rủ chính ở mỗi nhánh
    sideLeafRange: [0, 0],          // Liễu có hệ cành rủ phân đoạn riêng
    sideLeafStartLevel: 99,
    petioleRange: [0.20, 0.40],
    fruit: {
      enabled: false
    }
  }
};

// Export to window / module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LEAF_TYPE_CONFIGS;
} else if (typeof window !== 'undefined') {
  window.LEAF_TYPE_CONFIGS = LEAF_TYPE_CONFIGS;
}
