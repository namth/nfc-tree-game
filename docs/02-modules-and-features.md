# 02. Phân Hệ Hệ Thống & Tính Năng (Modules & Features)

## 1. Danh Mục Phân Hệ Cốt Lõi (Core System Modules)

Hệ thống game được cấu thành từ 6 phân hệ độc lập, giao tiếp với nhau qua Service Contracts:

```
+-------------------------------------------------------------------------+
|                        FRACTAL TREE MOBILE APP                          |
+-------------------------------------------------------------------------+
  [Module 1]  GARDEN DASHBOARD       - Quản lý danh sách cây, tiến trình mọc
  [Module 2]  FRACTAL CANVAS ENGINE  - Dựng hình cành lá GPU 60-120 FPS
  [Module 3]  NFC HARDWARE I/O       - Đọc/ghi thẻ nhị phân 64 Bytes
  [Module 4]  GENETICS & BREEDING    - Thuật toán di truyền hạt giống F1
  [Module 5]  TIMEKEEPER & INTEGRITY - Chống gian lận vặn giờ máy
  [Module 6]  ARCHIVE GALLERY        - Nhà kính vinh danh cây đã tái sinh thẻ
+-------------------------------------------------------------------------+
```

---

## 2. Ma Trận Tính Năng Chi Tiết Theo Phân Hệ

### Module 1: Garden Dashboard (Khu Vườn Số)
- **F1.1 - Tổng quan khu vườn:** Xem danh sách toàn bộ các cây đang sở hữu dưới dạng thẻ trượt (Card Grid).
- **F1.2 - Lọc phân loại:** Chuyển đổi giữa tab "Cây đang lớn (0% - 99%)" và "Cây đã trưởng thành (100%)".
- **F1.3 - Thanh tiến trình thời gian thực:** Hiển thị phần trăm (%) cây lớn và thời gian dự kiến hoàn thành.
- **F1.4 - Huy hiệu thông báo trạng thái:** Báo hiệu khi cây có hạt giống mới sẵn sàng thu hoạch (`✨ Có Hạt F1`).
- **F1.5 - Nút Tia Sét & Tua Tốc Độ Chuẩn (Fast-Forward & Replay Growth):** Tua cây lớn 100% (hoặc Replay toàn bộ quá trình đâm chồi, nở lá, rụng lá) theo đúng tốc độ chuẩn 15.4s của thư viện gốc Fractal Tree, chuẩn hóa hiển thị Tag Độ Hiếm/Đời Cây theo Light/Dark theme (xem `docs/features/lightning-growth-replay-and-badge-styling.md`).

### Module 2: Fractal Canvas Engine (Dựng Hình Đồ Họa)
- **F2.1 - Dựng cành fractal đệ quy:** Phân nhánh toán học theo độ sâu (`max_depth`), góc rẽ (`branch_angle`) và tỉ lệ độ dài (`length_factor`).
- **F2.2 - Bung nở hoa/lá:** Hiển thị 14 loại lá vector đặc trưng khi tiến trình sinh trưởng đạt mốc.
- **F2.3 - Hiệu ứng gió tự nhiên (Wind Sway via Skia GPU Native):** Cành lá lay động nhẹ nhàng nhịp nhàng quanh gốc neo cố định thông qua `@shopify/react-native-skia` và Reanimated UI Thread (60 - 120 FPS), loại bỏ hoàn toàn bươm bướm và tap gust để bảo toàn hiệu năng tối đa (xem `docs/features/skia-wind-rendering-and-ambient-cleanup.md`).
- **F2.4 - Hiệu ứng quả cầu hạt giống (Seed Orb):** Quả cầu ánh sáng vàng đung đưa trên cành khi cây đạt 100%.
- **F2.5 - Bạnh gốc & Rễ trồi hữu cơ (Root Flare & Surface Roots):** Bạnh gốc loe mềm mại kết hợp 3–5 rễ trồi gân guốc vươn bám đất tự nhiên, phát triển đồng bộ theo tiến trình sinh trưởng (xem `docs/features/organic-root-flare-system.md`).
- **F2.6 - Hiệu ứng lấp lánh Kim Sa 3 tầng & Hệ thống Hiệu ứng Đồ họa (Golden Sparkle & Visual Effects):** Hiệu ứng thị giác 3 tầng độc quyền cho bảng màu Kim Sa Legendary (Đốm sao 4 cánh `✦`, Bụi vàng bay, Nhịp thở mặt lá), tích hợp kiến trúc mở rộng hỗ trợ bật/tắt và điều tiết theo FPS cài đặt (xem `docs/features/golden-sparkle-and-performance-settings.md`).

### Module 3: NFC Hardware I/O (Giao Tiếp Phần Cứng)
- **F3.1 - Phát hiện cảm biến NFC:** Kiểm tra tình trạng bật/tắt NFC của máy và hiển thị hướng dẫn vị trí chip tiếp xúc.
- **F3.2 - Đọc dữ liệu nhị phân (Binary Decode):** Giải mã 64 Bytes nhị phân chuẩn V1 từ thẻ NFC.
- **F3.3 - Gieo mầm cây (Plant Seed):** Ghi timestamp `planted_at` ngược vào chip NFC khi chạm thẻ lần đầu.
- **F3.4 - Thu hoạch hạt giống (Harvest Seed):** Ghi đè hạt giống mới vào thẻ trắng hoặc tái sử dụng thẻ cũ.
- **F3.5 - Kiểm tra toàn vẹn CRC-16:** Xác thực checksum chống đọc/ghi dữ liệu dở dang.

### Module 4: Genetics & Breeding (Di Truyền & Lai Tạo)
- **F4.1 - Cố định loài lá di truyền:** Cây con F1 luôn thừa hưởng 100% loài lá (`leaf_type`) của cây mẹ.
- **F4.2 - Đột biến chỉ số ngẫu nhiên:** Sinh ngẫu nhiên góc rẽ nhánh ($\pm 15\%$), độ sâu đệ quy và thời gian lớn mới.
- **F4.3 - Cơ chế Roll hạt định kỳ:** Khi cây đạt 100%, tự động roll xác suất nở hạt (mỗi cây chứa tối đa 1 hạt chờ thu hoạch).

### Module 5: TimeKeeper & Anti-Tampering (Bảo Vệ Thời Gian)
- **F5.1 - Đo đạc thời gian phần cứng (Monotonic Clock):** So sánh `System Uptime` với `Wall Clock Time`.
- **F5.2 - Phát hiện lùi giờ (Rewind Detection):** Ngăn chặn người chơi chỉnh đồng hồ về quá khứ.
- **F5.3 - Phát hiện nhảy cóc giờ (Forward Time Skipping):** Nhận diện việc vặn giờ máy nhảy cóc để mọc cây nhanh.
- **F5.4 - Heartbeat ghi nhớ:** Lưu vết nhịp tim thời gian định kỳ vào MMKV siêu tốc.

### Module 6: Archive Gallery (Nhà Kính Danh Dự)
- **F6.1 - Lưu trữ tượng đài:** Tự động chuyển cây cũ vào bảo tàng khi thẻ vật lý bị ghi đè thành mầm mới.
- **F6.2 - Chiêm ngưỡng lịch sử:** Xem lại hình dáng, ngày trồng, ngày thu hoạch và số thế hệ con cháu đã sinh ra.

### Module 7: Admin Parent Tree Generator & NFC Master Writer (Trình Tạo Cây Gốc P)
- **F7.1 - Thử nghiệm phối giống tự do:** Cho phép chọn độc lập Dạng Lá (14 loại), Màu Lá (12 màu), Màu Thân (9 theme) và sinh ngẫu nhiên cành nhánh cây trưởng thành 100%.
- **F7.2 - Thiết lập thời gian lớn theo độ hiếm:** Tự động gán thời gian sinh trưởng theo bảng độ hiếm (Common: 1 ngày, Rare: 3 ngày, Legendary: 7 ngày) hoặc tùy chỉnh thời gian riêng.
- **F7.3 - Ghi hạt giống gốc P (Master Seed Minting):** Ghi trực tiếp khối nhị phân 64 Bytes qua Web NFC API với `generation = 0` và `parent_tree_id = 0x00000000`.
- **F7.4 - Sổ cái lưu vết hạt giống (Seed Registry):** Quản lý danh sách các thẻ NFC đã phát hành, tìm kiếm, lọc theo độ hiếm và xuất dữ liệu JSON/CSV (xem `docs/features/admin-parent-tree-generator.md`).

### Module 8: Botanical Compendium (Bách Thảo Thư Viện)
- **F8.1 - Sổ tay bách khoa sưu tầm (Pokédex Style):** Theo dõi tiến độ mở khóa toàn bộ 14 loài lá, 12 bảng màu tán lá, 9 theme thân cây (tổng cộng 35 đặc tính) với thanh tiến độ % trực quan.
- **F8.2 - Trạng thái Khóa / Mở khóa vĩnh viễn:** Các đặc tính đã từng sở hữu sẽ sáng đèn vĩnh viễn trong SQLite (`compendium_entries`), các đặc tính chưa gặp hiển thị bóng xám silhouette kèm dấu `?`.
- **F8.3 - Segmented Tra cứu & Thẻ Lưới:** Dễ dàng chuyển đổi giữa 3 danh mục: `[Loài Lá (14)]`, `[Màu Tán Lá (12)]`, `[Thân Cây (9)]`.
- **F8.4 - BottomSheet Chi tiết sinh học:** Chạm vào thẻ đã mở khóa để xem hình ảnh sắc nét, tên tiếng Việt/Anh, ngày đầu tiên phát hiện và số lần từng gặp.
- **F8.5 - Thông báo Khám phá mới:** Zen Toast thông báo tức thời khi quét thẻ NFC/thu hoạch hạt nở ra đặc tính mới, đi kèm chấm đỏ Notification Dot trên thanh điều hướng đáy (xem `docs/features/botanical-compendium-library.md`).

---

## 3. Ma Trận Vai Trò Người Dùng (Role Matrix)

Vì ứng dụng hoạt động **100% Offline-First (Local Profile)** trên thiết bị người dùng:

| Quyền hạn / Thao tác | Local Player (Chủ Vườn) | Guest / Thẻ Khách (Quét Thẻ Ngoại Vi) |
| :--- | :---: | :---: |
| Xem danh sách khu vườn trên máy | ✅ Toàn quyền | ❌ Không lưu |
| Quẹt thẻ xem thông số cây tức thời | ✅ | ✅ |
| Gieo mầm cây mới vào máy | ✅ | ❌ |
| Thu hoạch hạt giống vào thẻ | ✅ | ❌ |
| Tùy chỉnh âm thanh & haptics | ✅ | ❌ |
