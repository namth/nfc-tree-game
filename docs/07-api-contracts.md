# 07. Hợp Đồng Dữ Liệu & Service Interfaces (API Contracts)

Vì game hoạt động theo mô hình **100% Offline-First**, hợp đồng giao tiếp (API Contracts) ở đây chính là các **TypeScript Service Interfaces** phân định ranh giới giữa các tầng nghiệp vụ trong ứng dụng.

---

## 1. Domain Entities & TypeScript Models

```typescript
export enum LeafType {
  OAK = 0,      // Sồi cổ thụ
  SAKURA = 1,   // Anh đào Nhật Bản
  PINE = 2,     // Thông tuyết
  WILLOW = 3,   // Liễu rủ
  MAPLE = 4,    // Phong đỏ
  GINKGO = 5    // Bạch quả hoàng gia
}

export interface TreeGenetics {
  leafType: LeafType;         // Loại lá (khóa cố định di truyền theo cây mẹ)
  branchAngle: number;        // Góc rẽ nhánh (độ: 15° đến 60°)
  lengthFactor: number;       // Tỉ lệ thu hẹp cành (0.60 -> 0.85)
  maxDepth: number;           // Số tầng đệ quy cành (6 -> 11)
  trunkColor: string;         // Mã hex màu thân cây (#5D4037)
  leafColor: string;          // Mã hex màu lá (#4CAF50)
  dnaSeed: number;            // Hạt số ngẫu nhiên PRNG
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
  hasSeedReady: boolean;      // 1: Cây đã kết hạt mới chờ thu hoạch
  isArchived: boolean;        // 1: Đã chuyển vào Nhà kính danh dự
  lastSyncedAt: number;       // Timestamp đồng bộ thẻ gần nhất
}

export interface SeedModel {
  id: string;
  generation: number;         // Thế hệ: 0 = P, 1 = F1...
  parentTreeId?: string;      // ID cây mẹ (nếu là con F1)
  genetics: TreeGenetics;     // Bộ gen (leafType kế thừa, góc/độ dài ngẫu nhiên)
  growthDuration: number;     // Thời gian mọc (theo độ hiếm hoặc custom)
  spawnedAt: number;          // Thời điểm hạt xuất hiện
}
```

---

## 2. Core Service Contracts

### 2.1. NFC Hardware Service (`INfcService`)
```typescript
export interface INfcService {
  /** Kiểm tra máy có chip NFC và đã bật chưa */
  isNfcAvailable(): Promise<{ supported: boolean; enabled: boolean }>;

  /** Khởi động phiên quét thẻ để ĐỌC thông tin 64 Bytes */
  scanAndReadTag(): Promise<TreeModel | SeedModel | null>;

  /** Gieo mầm: Ghi timestamp plantedAt vào thẻ NFC khi quẹt lần đầu */
  plantSeedOnTag(tree: TreeModel): Promise<boolean>;

  /** Thu hoạch: Ghi đè hạt giống F1 mới vào thẻ mục tiêu */
  writeNewSeedToTag(seed: SeedModel, targetTagUid?: string): Promise<boolean>;

  /** Encode đối tượng sang mảng 64 Bytes nhị phân chuẩn V1 */
  encodeToBytes(data: TreeModel | SeedModel): Uint8Array;

  /** Decode mảng bytes đọc được từ chip NFC */
  decodeFromBytes(bytes: Uint8Array): { data: TreeModel | SeedModel; isValidCrc: boolean };

  /** Hủy phiên quét NFC đang chờ */
  cancelScan(): Promise<void>;
}
```

### 2.2. Game Engine & Genetics Service (`IGameEngineService`)
```typescript
export interface IGameEngineService {
  /** Tính toán tiến trình % mọc của cây tại thời điểm hiện tại */
  calculateGrowthProgress(plantedAt: number, durationSeconds: number, currentTimestamp: number): number;

  /** Kiểm tra xác suất cây 100% sinh hạt giống mới */
  rollSeedDrop(tree: TreeModel, hoursSinceCompleted: number): boolean;

  /** Tạo hạt giống con F1: Khóa cố định leafType, random góc cành và thời gian lớn */
  breedOffspringSeed(parent: TreeModel): SeedModel;
}
```

### 2.3. Anti-Tampering TimeKeeper Service (`ITimeKeeperService`)
```typescript
export interface TimeValidationResult {
  isValid: boolean;
  tamperReason?: 'CLOCK_REWOUND' | 'FORWARD_TIME_SKIPPED' | 'INVALID_TICK';
  adjustedTimestamp: number;
}

export interface ITimeKeeperService {
  /** Ghi nhận nhịp tim thời gian định kỳ vào MMKV */
  recordHeartbeat(): void;

  /** Thẩm định tính toàn vẹn thời gian máy khi khởi động */
  validateSystemTime(): Promise<TimeValidationResult>;

  /** Lấy timestamp tin cậy đã hiệu chỉnh chống vặn giờ */
  getTrustedTimestamp(): number;
}
```

### 2.4. Fractal Geometry Generator (`IFractalTreeRenderer`)
```typescript
export interface BranchSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  depth: number;
}

export interface LeafPoint {
  x: number;
  y: number;
  angle: number;
  scale: number;
  leafType: LeafType;
  color: string;
}

export interface FractalTreeGeometry {
  branches: BranchSegment[];
  leaves: LeafPoint[];
}

export interface IFractalTreeRenderer {
  /** Tính toán tọa độ toàn bộ cành và lá theo tiến trình mọc và góc gió */
  generateGeometry(
    genetics: TreeGenetics,
    progress: number,
    windOffset: number,
    canvasSize: { width: number; height: number }
  ): FractalTreeGeometry;
}

// -------------------------------------------------------------------------
// 6. Visual Effects & Device Performance Settings
// -------------------------------------------------------------------------
export enum VisualEffectType {
  GOLDEN_SPARKLE = 'golden_sparkle', // Lấp lánh lá Kim Sa 3 tầng (Sparkles, Dust, Shimmer)
}

export type TargetFps = 24 | 30 | 45 | 60;

export interface PerformanceSettings {
  effectsEnabled: boolean;           // Bật/tắt hiệu ứng đồ họa đặc biệt (mặc định: true)
  targetFps: TargetFps;              // 24 | 30 | 45 | 60 FPS (mặc định: 60)
}
```
