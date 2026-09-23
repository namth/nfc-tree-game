# 09. Quy Chuẩn Kỹ Thuật & Cấu Trúc Mã Nguồn (Engineering Conventions)

## 1. Cấu Trúc Thư Mục Dự Án (Folder Structure)

```
TreeNFCGame/
├── docs/                             # 11 tệp tài liệu kiến trúc chuẩn hóa
├── android/                          # Native Android Project (Android Studio)
├── ios/                              # Native iOS Project (Xcode)
├── src/
│   ├── assets/                       # Âm thanh thiền, fonts Cinzel/PlusJakarta
│   ├── components/                   # UI components tái sử dụng
│   │   ├── common/                   # Button, ProgressBar, Badge
│   │   ├── garden/                   # TreeCard, GardenGrid, FilterTabs
│   │   └── nfc/                      # NfcRadarModal, NfcSuccessDialog
│   ├── engine/                       # Lõi Toán học & Đồ họa
│   │   ├── fractal/                  # Thuật toán đệ quy nhánh cây
│   │   │   ├── FractalGenerator.ts   # Sinh tọa độ cành lá theo progress
│   │   │   ├── PRNG.ts               # Mulberry32 sinh số ngẫu nhiên theo seed
│   │   │   └── WindPhysics.ts        # Dao động sóng sin của gió
│   │   └── genetics/                 # Hệ thống di truyền và lai tạo
│   │       ├── SeedBreeder.ts        # Kế thừa loài lá & đột biến góc/cành
│   │       └── LeafShapes.ts         # 6 dạng hình học của lá cây
│   ├── nfc/                          # Lớp giao tiếp phần cứng NFC
│   │   ├── protocol/                 # Xử lý Binary Protocol 64 Bytes
│   │   │   ├── BinaryCodec.ts        # DataView pack/unpack
│   │   │   └── Crc16.ts              # Checksum CRC-16-CCITT
│   │   └── NfcService.ts             # Vòng đời kết nối, đọc/ghi thẻ
│   ├── storage/                      # Cơ sở dữ liệu cục bộ
│   │   ├── database/                 # SQLite setup, migrations, queries
│   │   ├── repositories/             # GardenRepository, ArchiveRepository
│   │   └── kv/                       # MMKV keys & storage helpers
│   ├── services/                     # Dịch vụ nền tảng
│   │   ├── TimeKeeperService.ts      # Chống gian lận giờ máy
│   │   └── AudioHapticService.ts     # Rung phản hồi và âm thanh Zen
│   ├── screens/                      # 4 Màn hình chính
│   │   ├── GardenDashboardScreen.tsx # Màn hình Khu vườn
│   │   ├── TreeDetailScreen.tsx      # Màn hình Chi tiết cây Skia Canvas
│   │   ├── ArchiveGalleryScreen.tsx  # Nhà kính danh dự
│   │   └── SettingsScreen.tsx        # Cài đặt & Hướng dẫn NFC
│   ├── hooks/                        # Custom React Hooks
│   │   ├── useGarden.ts              # Quản lý danh sách cây
│   │   ├── useTreeGrowth.ts          # Tính toán % mọc theo thời gian
│   │   └── useNfcScanner.ts          # Điều khiển quét NFC
│   ├── theme/                        # Bảng màu Zen Dark, Spacing, Typography
│   └── App.tsx                       # Root Component & Providers
├── prototype.html                    # Bản mẫu giao diện HTML tương tác trực tiếp
├── CONTEXT.md                        # Bản tóm tắt cho AI Agent
├── package.json
└── tsconfig.json
```

---

## 2. Quy Tắc Viết Code (Coding Standards)

1. **TypeScript Strict:** Bật `strict: true`. Cấm sử dụng `any`; nếu kiểu chưa rõ ràng, dùng `unknown` kèm type guards.
2. **Quy ước đặt tên:**
   - **Component:** PascalCase (`TreeCard.tsx`, `GardenDashboardScreen.tsx`).
   - **Service / Module:** camelCase (`nfcService.ts`, `binaryCodec.ts`).
   - **Hằng số:** UPPER_SNAKE_CASE (`NFC_MAGIC_BYTES = 0x5452`).
3. **Quy tắc Tối ưu Hiệu năng Đồ họa:**
   - Tuyệt đối không thực hiện tính toán đệ quy cành cây trong thân hàm render của React Component. Toàn bộ hình học phải được memoize (`useMemo`) hoặc chạy trực tiếp bằng Skia UI Thread values.
   - Thao tác quét NFC bắt buộc phải bọc trong khối `try...finally` để luôn đảm bảo `NfcManager.cancelTechnologyRequest()` được gọi nếu có lỗi hoặc người dùng rút thẻ sớm.
