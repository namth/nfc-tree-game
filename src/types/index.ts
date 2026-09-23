/**
 * Domain Entities & TypeScript Models
 * Project: Fractal Tree NFC Mobile Game
 */

export enum LeafType {
  POINTED = 0,        // Lá Cổ Thụ Đỉnh Nhọn / Ngọc Lục Bảo
  MAPLE = 1,          // Lá Phong 7 Thùy Đỉnh Nhọn
  MAPLE5 = 2,         // Lá Phong 7 Thùy Hình Thoi
  GINKGO_FAN = 3,     // Lá Ngân Hạnh / Bạch Quả Rẻ Quạt
  HEART = 4,          // Lá Hình Trái Tim
  SINGLE_NEEDLE = 5,  // Lá Me Kép Lông Chim Chẵn (7 cặp lá chét)
  TUNG_LAHAN = 6,     // Lá Tùng La Hán (9 cánh kim xòe quạt)
  SAKURA_LEAF = 7,    // Cánh / Lá Hoa Anh Đào (khía chữ V)
  EUCALYPTUS_LONG = 8,// Lá Bạch Đàn Dài (hình trăng khuyết Falcate)
  OVAL = 9,           // Lá Bầu Dục Oval Chuẩn
  BODHI = 10,         // Lá Bồ Đề Linh Thiêng (đỉnh nhỏ giọt)
  ROUND = 11,         // Lá Tròn Đồng Xu / Khuynh Diệp (Orbicular Round)
  NEEDLE = 12,        // Lá Thông 7 Kim Xòe (Pine Needle Cluster)
  WILLOW = 13         // Lá Liễu Rủ (Weeping Willow Verlet)
}

export enum LeafPalette {
  SAKURA = 0,     // Anh Đào
  AUTUMN = 1,     // Phong Đỏ
  GINKGO = 2,     // Ngân Hạnh
  WISTERIA = 3,   // Tử Đằng
  FROST = 4,      // Băng Tuyết
  SUNSET = 5,     // Hoàng Hôn
  MIDNIGHT = 6,   // Dạ Lam
  EUCALYPTUS = 7, // Bạch Đàn Khói Bạc
  GOLDEN = 8,     // Kim Sa
  RUBY = 9,       // Hồng Ngọc
  SHADOW = 10,    // Hư Không / Hắc Thạch
  EMERALD = 11    // Ngọc Lục Bảo
}

export interface TreeGenetics {
  leafType: LeafType;         // Loại lá (khóa cố định di truyền theo cây mẹ)
  paletteIndex: LeafPalette;  // Mã bảng màu lá (12 bảng màu chuẩn GitHub)
  branchAngle: number;        // Góc rẽ nhánh (độ: 12° đến 36°)
  lengthDecay: number;        // Tỉ lệ thu hẹp cành (0.68 -> 0.86)
  thicknessDecay: number;     // Tỉ lệ tiêu giảm độ dày (0.48 -> 0.66)
  maxDepth: number;           // Số tầng đệ quy cành (8 -> 12)
  trunkColor: string;         // Mã hex màu thân cây
  dnaSeed: number;            // Hạt số ngẫu nhiên PRNG (UInt32)
  treeVariation?: number;     // Độ biến thiên hữu cơ (0.50 -> 1.50, mặc định 0.80)
  initThickness?: number;     // Độ dày thân chính khởi đầu (24 -> 60px, mặc định 36px)
}

export interface TreeModel {
  id: string;                 // Mã định danh duy nhất (UUID)
  nfcUid: string;             // Hardware NFC UID của chip
  generation: number;         // Thế hệ: 0 = Cây gốc P (Parents), 1 = F1, 2 = F2...
  parentTreeId?: string;      // Mã ID của cây mẹ (NULL nếu là P)
  genetics: TreeGenetics;     // Bộ gen cây
  plantedAt: number;          // Timestamp epoch ms lúc gieo mầm
  growthDuration: number;     // Tổng thời gian lớn (tính bằng giây)
  currentProgress: number;    // Tiến trình lớn hiện tại (0.00 -> 1.00)
  hasSeedReady: boolean;      // true: Cây đã kết hạt mới chờ thu hoạch
  isArchived: boolean;        // true: Đã chuyển vào Nhà kính danh dự
  lastSyncedAt: number;       // Timestamp đồng bộ thẻ gần nhất
  lastViewedAt?: number;      // Timestamp epoch ms xem chi tiết gần nhất
  thumbnailData?: string;     // Chuỗi JSON snapshot SVG cành lá để hiển thị nhanh ngoài vườn
  lastHarvestedAt?: number;   // Timestamp epoch ms khi thu hoạch hạt gần nhất
  seedSpawnedAt?: number;     // Timestamp epoch ms khi hạt giống hiện tại xuất hiện (24h re-roll)
  currentSeedGenetics?: TreeGenetics; // Bộ gen cố định của hạt giống hiện tại chờ thu hoạch
}

export interface SeedModel {
  id: string;
  generation: number;         // Thế hệ: 0 = P, 1 = F1, 2 = F2...
  parentTreeId?: string;      // ID cây mẹ (nếu là con F1)
  genetics: TreeGenetics;     // Bộ gen (leafType kế thừa, góc/độ dài ngẫu nhiên)
  growthDuration: number;     // Thời gian mọc (tính bằng giây)
  spawnedAt: number;          // Thời điểm hạt xuất hiện (epoch ms)
}

/**
 * 64-Bytes NFC Tag Binary Structure (Specification in docs/05-architecture.md)
 */
export interface NfcTagPayload {
  magic: number;              // 2 bytes: 0x5452 ('TR')
  version: number;            // 1 byte: 0x01
  flags: {
    generation: number;       // bit 0-1: 0=P, 1=F1, 2=F2, 3=F3+
    isMature: boolean;        // bit 2: 1 = Đã lớn 100%
    seedAvailable: boolean;   // bit 3: 1 = Đang có hạt giống sẵn sàng
    isTampered: boolean;      // bit 4: 1 = Phát hiện gian lận giờ
  };
  dnaSeed: number;            // 4 bytes: UInt32
  leafType: LeafType;         // 1 byte: 0..13
  leafPalette: LeafPalette;   // 1 byte: 0..11
  trunkColorIndex: number;    // 1 byte: 0..7
  trunkColorHex?: string;     // Mã màu hex giải mã từ RGB565 (Byte 24-25)
  flowerType: number;         // 1 byte: 0 (reserved)
  growthDurationSec: number;  // 4 bytes: UInt32
  plantTimestamp: bigint;     // 8 bytes: Int64 Epoch ms
  lastWateredOffset: number;  // 4 bytes: UInt32
  healthScore: number;        // 1 byte: 0..100
  branchAngle: number;        // 1 byte: 12..36 deg
  lengthDecayPct: number;     // 1 byte: 68..86
  thicknessDecayPct: number;  // 1 byte: 48..66 (Byte 38)
  maxDepth?: number;          // 1 byte: 8..12 (Byte 23)
  generation?: number;        // 1 byte: (Byte 32)
  parentTreeId?: number;      // 4 bytes: UInt32 (Byte 33-36)
  treeVariation?: number;     // value / 100.0 (Byte 37)
  treeVariationVal?: number;  // 1 byte: value / 100.0 (Byte 37)
  thicknessDecay?: number;    // raw float 0..1
  initThickness?: number;     // 10..120px (Byte 39)
  initThicknessVal?: number;  // 1 byte: 10..120px (Byte 39)
  reserved: Uint8Array;       // 22 bytes: 0x00 (Bytes 40-61)
  checksum: number;           // 2 bytes: CRC-16-CCITT
}

/**
 * Visual Effects & Performance Management
 */
export enum VisualEffectType {
  GOLDEN_SPARKLE = 'golden_sparkle', // Lấp lánh lá Kim Sa 3 tầng (Sparkles, Dust, Shimmer)
}

export type TargetFps = 24 | 30 | 45 | 60;

export interface PerformanceSettings {
  effectsEnabled: boolean;           // Bật/tắt hiệu ứng đồ họa đặc biệt (mặc định: true)
  targetFps: TargetFps;              // 24 | 30 | 45 | 60 FPS (mặc định: 60)
}

