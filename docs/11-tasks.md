# 11. Lộ Trình Triển Khai & Danh Sách Công Việc (Implementation Tasks)

Danh sách công việc được chia nhỏ thành 7 giai đoạn kế tiếp nhau, mỗi Task được thiết kế vừa vặn với Context Window của AI Agent (< 100k tokens) và có tiêu chí kiểm thử độc lập.

---

### Giai đoạn 1: Khởi Tạo Nền Tảng & Cấu Hình Native
- [ ] **Task 1.1: Khởi tạo React Native Bare Project & TypeScript**
  - Khởi tạo project React Native Bare Workflow với TypeScript template.
  - Cấu hình `.editorconfig`, `tsconfig.json` (`strict: true`), Prettier.
- [ ] **Task 1.2: Cấu hình Thư viện Native cho Android Studio & Xcode**
  - Cài đặt `@shopify/react-native-skia`, `react-native-reanimated`, `react-native-nfc-manager`.
  - Cấu hình quyền NFC trong `AndroidManifest.xml` (`android.permission.NFC`).
  - Cấu hình quyền NFC trong `Info.plist` của iOS (`NFCReaderUsageDescription`) và file `.entitlements`.
  - Build thử nghiệm kiểm tra pass trên cả Android Studio và Xcode.

---

### Giai đoạn 2: Lớp Nhị Phân 64-Bytes & Giao Tiếp NFC Phần Cứng
- [ ] **Task 2.1: Xây dựng Module BinaryCodec & Thuật toán CRC-16**
  - Viết module `Crc16.ts` (chuẩn CRC-16-CCITT).
  - Viết `BinaryCodec.ts` dùng `DataView` để pack/unpack chính xác 64 Bytes dữ liệu theo bảng phân bổ `docs/05-architecture.md`.
  - Viết Unit Test bao phủ 100% các trường hợp: mã hóa, giải mã, byte tràn, sai CRC.
- [ ] **Task 2.2: Tích hợp Dịch Vụ NFC Phần Cứng (`NfcService`)**
  - Viết `NfcService.ts` quản lý phiên kết nối: kiểm tra phần cứng, bắt sự kiện chạm thẻ.
  - Hiện thực luồng đọc thẻ (Decode 64 Bytes).
  - Hiện thực luồng ghi mầm cây (`plantSeedOnTag`) và ghi hạt giống mới (`writeNewSeedToTag`).
  - Bọc `try...finally` đảm bảo luôn giải phóng phiên quét an toàn.

---

### Giai đoạn 3: Lõi Toán Học Fractal & Bộ Dựng Hình Skia (GPU 60-120 FPS)
- [ ] **Task 3.1: Bộ Sinh Số Giả Ngẫu Nhiên PRNG & Phép Tính Đệ Quy**
  - Cài đặt thuật toán `Mulberry32 PRNG` dựa theo `dna_seed`.
  - Xây dựng thuật toán đệ quy nhánh cây: phân rã từ thân chính thành các cành con theo góc `branchAngle` và tỉ lệ `lengthFactor`.
- [ ] **Task 3.2: Bộ Dựng Cành & Bung Nở Lá theo Tiến Trình (Growth Interpolation)**
  - Lập trình cơ chế lớn từ 0% đến 100% theo hàm mượt Bezier.
  - Thiết kế 6 hình dạng lá vector (Oak, Sakura, Pine, Willow, Maple, Ginkgo) hiển thị khi tiến trình $t > 0.4$.
- [x] **Task 3.3: Dựng Canvas Skia & Hiệu Ứng Gió Đung Đưa (GPU 60 - 120 FPS)**
  - Tích hợp Skia `<Canvas>`, vẽ đường thân và cành bằng `SkPath` (`@shopify/react-native-skia`).
  - Áp dụng Reanimated Shared Value trên UI thread tạo hiệu ứng gió đung đưa tự nhiên (Harmonic Sway) quanh gốc cố định `(0, 0)`.
  - Giải phóng 100% luồng JS, loại bỏ hoàn toàn bươm bướm và tap gust giúp tối ưu hóa bộ nhớ và hiệu năng (xem `docs/features/skia-wind-rendering-and-ambient-cleanup.md`).
- [x] **Task 3.4: Bạnh Gốc & Hệ Thống Rễ Trồi Hữu Cơ (Root Flare & Surface Roots)**
  - Sinh rễ trồi gân guốc xác định từ `dna_seed` bằng đường cong Bezier, vị trí 1/2 thân cây.
  - Tạo bạnh gốc loe mềm mại ở chân thân chính, đồng bộ tiến trình mọc 0% – 100% (xem `docs/features/organic-root-flare-system.md`).

---

### Giai đoạn 4: Lưu Trữ Cục Bộ & Động Cơ Chống Gian Lận Giờ Máy
- [ ] **Task 4.1: Cấu trúc Cơ Sở Dữ Liệu Cục Bộ (SQLite & MMKV)**
  - Cài đặt `@op-engineering/op-sqlite` và tạo bảng `garden_trees`, `archive_trees`.
  - Viết `GardenRepository` và `ArchiveRepository` thực hiện các thao tác CRUD.
- [ ] **Task 4.2: Hệ Thống Đo Đạc Thời Gian & Anti-Tampering (TimeKeeper)**
  - Tích hợp `react-native-device-info` lấy hardware uptime.
  - Lưu nhịp tim `heartbeat` định kỳ qua `react-native-mmkv`.
  - Phát hiện vặn ngược/xuôi giờ máy và tự động điều chỉnh tiến trình cây chính xác.

---

### Giai đoạn 5: Cơ Chế Sinh Hạt Giống & Di Truyền (Genetics & Breeding)
- [ ] **Task 5.1: Logic Sinh Hạt Giống & Kế Thừa Bộ Gen**
  - Viết thuật toán roll xác suất ra hạt khi cây đạt 100%.
  - Logic khóa cố định `leafType` từ cây mẹ, tạo biến dị ngẫu nhiên cho góc cành, độ dài và thời gian mọc mới.
- [ ] **Task 5.2: Cơ Chế Lưu Trữ Cây Cũ (Archive Gallery) Khi Ghi Đè Thẻ**
  - Khi người chơi chọn ghi đè hạt mới vào thẻ cũ: tự động sao lưu toàn bộ thông số cây cũ vào `archive_trees` và xóa khỏi `garden_trees`.
  - Chụp ảnh snapshot thumbnail của cây cũ để trưng bày trong Nhà kính.

---

### Giai đoạn 6: Giao Diện Người Dùng & Trải Nghiệm Tương Tác (UI / UX)
- [ ] **Task 6.1: Màn hình Khu Vườn (Garden Dashboard Screen)**
  - Danh sách thẻ cây đang mọc và đã trưởng thành, thanh progress bar mượt mà.
- [ ] **Task 6.2: Màn hình Chi Tiết Cây (Tree Detail & Zen View)**
  - Hiển thị cây toàn màn hình với Canvas Skia 60 FPS.
  - Hiển thị quả cầu hạt giống vàng phát sáng trên cành và nút "Thu hoạch hạt giống".
  - Tích hợp **Nút Tia Sét (⚡)** tua lớn 100% hoặc Replay toàn bộ quá trình đâm chồi, nở lá, rụng lá theo chuẩn 15.4s của thư viện gốc, khóa các nút tương tác trong khi diễn hoạt.
  - Chuẩn hóa màu sắc background và viền cho Tag Độ Hiếm và Tag Đời Cây trên cả Light và Dark theme (xem `docs/features/lightning-growth-replay-and-badge-styling.md`).
- [ ] **Task 6.3: Modal Tương Tác Quét Thẻ NFC & Phản Hồi Rung**
  - Sóng radar quét thẻ trực quan kèm rung haptic phản hồi.
- [ ] **Task 6.4: Màn hình Nhà Kính Danh Dự (Archive Gallery Screen)**
  - Trưng bày bộ sưu tập các cây cổ thụ đã hoàn thành vòng đời.

---

### Giai đoạn 7: Kiểm Thử Phần Cứng & Đóng Gói Ứng Dụng
- [ ] **Task 7.1: Kiểm thử phần cứng với thẻ NFC thực tế (NTAG213, NTAG215)**.
- [ ] **Task 7.2: Đo đạc FPS bằng Xcode Instruments & Android Profiler đảm bảo 60 - 120 FPS**.
- [ ] **Task 7.3: Hướng dẫn Build Release trên Android Studio (APK/AAB) và Xcode (Archive iOS)**.

---

### Giai đoạn 8: Phân Hệ Quản Trị & Ghi Thẻ NFC Master (Admin Parent Tree Generator)
- [x] **Task 8.1: Trang Web Admin Trồng Thử & Ghi Thẻ Nội Bộ (`ui-ux/03-admin-tree-generator.html`)**
  - Giao diện Dark Zen Botanical cho phép chọn Dạng lá, Màu lá, Màu thân, Thời gian lớn.
  - Tích hợp Web NFC API ghi 64 Bytes nhị phân hạt giống gốc P (`generation = 0`).
  - Sổ cái lưu vết hạt giống LocalStorage & tính năng xuất file JSON/CSV.
- [ ] **Task 8.2: Tích hợp Google Identity Services (GIS) & Phân Quyền Creator / Admin**.
- [ ] **Task 8.3: Kết nối Cloud BaaS (Firebase / Supabase) đồng bộ dữ liệu quản trị tập trung**.

---

### Giai đoạn 9: Bách Thảo Thư Viện (Botanical Compendium - Pokédex Thực Vật)
- [ ] **Task 9.1: Database Migration & CompendiumRepository**
  - Tạo bảng `compendium_entries` trong SQLite.
  - Viết `CompendiumRepository.ts` xử lý ghi nhận đặc tính, tra cứu thống kê và auto-migration từ cây cũ.
- [ ] **Task 9.2: Mở rộng BottomNavBar & Định tuyến App Navigation**
  - Mở rộng 4 tab: `[Vườn, Nhà Kính, Thư Viện, Cài Đặt]` kèm Notification Dot.
  - Thêm state chuyển đổi sang `CompendiumScreen` trong `App.tsx`.
- [ ] **Task 9.3: Giao diện CompendiumScreen Zen Botanical**
  - Thanh tiến độ thu thập % & Cấp bậc nhà thực vật học.
  - Segmented Control 3 tab con: Loài lá (14), Màu lá (12), Thân cây (9).
  - Lưới thẻ Grid Cards: Card mở khóa vs Silhouette bóng mờ xám kèm dấu `?`.
  - BottomSheet modal xem thông số chi tiết khi nhấn vào item đã mở khóa.
- [ ] **Task 9.4: Tích hợp Quét NFC & Zen Toast Discovery**
  - Kiểm tra và kích hoạt thông báo Zen Toast khi quét/thu hoạch cây mới mang đặc tính chưa có.
- [ ] **Task 9.5: Đa ngôn ngữ & Kiểm thử hoàn chỉnh (Việt / Anh, 100% tests pass)**.

---

### Giai đoạn 10: Hiệu Ứng Kim Sa 3 Tầng & Điều Khiển Hiệu Năng Đồ Họa (Visual Effects & Target FPS)
- [x] **Task 10.1: Lưu trữ Cấu hình Hiệu năng (MMKV Preferences & PerformanceContext)**
  - Bổ sung `app_effects_enabled` (mặc định: `true`) và `app_target_fps` (mặc định: `60`) vào `Preferences.ts`.
  - Tạo `PerformanceContext` cung cấp state tức thời cho toàn bộ app.
- [x] **Task 10.2: Giao diện Cài Đặt Đồ Họa & Hiệu Năng (`SettingsScreen.tsx`)**
  - Thêm Card "ĐỒ HỌA & HIỆU NĂNG": Switch bật/tắt hiệu ứng và Segmented 4 nút (`24 FPS`, `30 FPS`, `45 FPS`, `60 FPS`).
  - Cập nhật từ điển song ngữ `translations.ts` (Việt / Anh).
  - Loại bỏ các box kỹ thuật không cần thiết (Ăng-ten NFC, Chuẩn giao thức).
- [x] **Task 10.3: Lõi Hiệu Ứng Kim Sa 3 Tầng trên Skia GPU (`AnimatedTreeCanvas.tsx`)**
  - Tầng 1: Đốm sao 4 cánh `✦` lóe sáng luân phiên trên cành lá Kim Sa.
  - Tầng 2: Bụi vàng kim sa bay lượn nhẹ nhàng theo luồng gió quanh tán lá.
  - Tầng 3: Nhịp thở phản quang đổi màu mặt lá theo chu kỳ gió.
  - Điều tiết vòng lặp `requestAnimationFrame` theo `targetFps` (24/30/45/60 FPS).
- [x] **Task 10.4: Đồng Bộ Hiệu Ứng trên Web Canvas (`lib/fractal-branch-tree.js`)**
  - Hỗ trợ vẽ hiệu ứng kim sa lấp lánh trên web preview khi `leafType === 'golden'`.
- [x] **Task 10.5: Kiểm thử & Đo đạc hiệu năng GPU/CPU trên các mức FPS**.

