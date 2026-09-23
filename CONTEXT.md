# Project Context: Fractal Tree NFC Mobile Game

## 1. Tóm Tắt Bức Tranh Tổng Thể (Project Snapshot)
**Fractal Tree NFC Game** là một tựa game di động (iOS & Android) phong cách Zen, kết hợp giữa công nghệ phần cứng thẻ NFC vật lý và đồ họa hình học Fractal.
- **Nền tảng:** React Native Bare Workflow (Android Studio & Xcode).
- **Mô hình hoạt động:** **100% Offline-First**, không cần Internet, không phụ thuộc Backend Server.
- **Sở hữu vật lý (Physical Ownership):** Thẻ NFC vật lý (NTAG213 / 215 / 216) là "Single Source of Truth". Chạm thẻ để gieo mầm cây, thời gian trồng được ghi vào thẻ; đổi điện thoại vẫn quẹt thẻ phục hồi lại cây.
- **Tiến trình:** Cây lớn từ 0% đến 100% theo thời gian đã định. Tắt app bật lại vẫn mọc tiếp liên tục.
- **Khu vườn số (Garden Dashboard):** Người chơi xem danh sách các cây đang trồng mọi lúc mà không bắt buộc phải cầm thẻ liên tục.
- **Sinh hạt & Lai tạo:** Khi đạt 100%, cây có xác suất ra 1 hạt giống (thừa hưởng loài lá của cây mẹ, ngẫu nhiên góc cành/thời gian). Chạm thẻ NFC để thu hoạch hạt. Nếu ghi đè lên thẻ cây cũ, cây cũ được chuyển sang "Nhà kính danh dự" (Archive Gallery).

---

## 2. Các Quyết Định Kỹ Thuật Then Chốt (Key Architectural Decisions)

1. **Chuẩn Dữ Liệu Thẻ NFC:**
   - Sử dụng định dạng nhị phân đóng gói cố định **64 Bytes** (`docs/05-architecture.md`).
   - Có Header định danh (`0x5452`), Version byte, Flags, Checksum CRC-16-CCITT và 30 Bytes dự phòng.
   - Vừa vặn hoàn hảo trên chip NFC dung lượng thấp nhất (NTAG213: 144 Bytes).
2. **Công Nghệ Đồ Họa 60 - 120 FPS:**
   - Lõi dựng hình: `@shopify/react-native-skia` chạy trực tiếp trên GPU luồng UI thread.
   - Hiệu ứng gió: Tính toán bằng `react-native-reanimated` shared values.
   - Tính toán hình học: Bộ sinh số giả ngẫu nhiên xác định `Mulberry32 PRNG` dựa theo `dna_seed`.
3. **Lưu Trữ Cục Bộ:**
   - `@op-engineering/op-sqlite` lưu thông tin cây trong vườn và nhà kính lưu trữ.
   - `react-native-mmkv` lưu heartbeat, uptime và cấu hình máy.
4. **Chống Gian Lận Giờ Máy (Anti-Tampering):**
   - Đo đạc phần cứng qua `System Uptime` và `Boot Time` (`react-native-device-info`) kết hợp `Heartbeat` định kỳ để phát hiện và vô hiệu hóa việc người chơi chỉnh ngày giờ trong Cài đặt máy.

---

## 3. Bản Đồ Chỉ Dẫn Bộ Tài Liệu Chuẩn 11 File (`/docs`)

Trước khi thực hiện bất kỳ Task mã nguồn nào, Agent cần đọc kỹ các tài liệu trong thư mục `/docs`:
- [`docs/01-overview.md`](file:///Users/namtran/Local%20Apps/TreeNFCGame/docs/01-overview.md): Mục tiêu dự án, đối tượng người dùng, bài toán cốt lõi.
- [`docs/02-modules-and-features.md`](file:///Users/namtran/Local%20Apps/TreeNFCGame/docs/02-modules-and-features.md): 6 phân hệ cốt lõi & ma trận tính năng chi tiết.
- [`docs/03-screens-and-ui.md`](file:///Users/namtran/Local%20Apps/TreeNFCGame/docs/03-screens-and-ui.md): Đặc tả 4 màn hình, Design System Zen Botanical & Prompts Google Stitch.
- [`docs/04-user-flows.md`](file:///Users/namtran/Local%20Apps/TreeNFCGame/docs/04-user-flows.md): Sơ đồ trạng thái và sequence diagram các luồng tương tác.
- [`docs/05-architecture.md`](file:///Users/namtran/Local%20Apps/TreeNFCGame/docs/05-architecture.md): Sơ đồ kiến trúc kỹ thuật, chuẩn nhị phân 64 Bytes NFC, Skia GPU engine.
- [`docs/06-database-schema.md`](file:///Users/namtran/Local%20Apps/TreeNFCGame/docs/06-database-schema.md): SQLite Schema DDL, MMKV layout, quy tắc phân định vòng đời cây.
- [`docs/07-api-contracts.md`](file:///Users/namtran/Local%20Apps/TreeNFCGame/docs/07-api-contracts.md): TypeScript Domain Models, Service Contracts (NFC, Engine, TimeKeeper).
- [`docs/08-integrations.md`](file:///Users/namtran/Local%20Apps/TreeNFCGame/docs/08-integrations.md): Hướng dẫn cấu hình native Android Studio & Xcode (NFC, Skia, Sound, Haptic).
- [`docs/09-conventions.md`](file:///Users/namtran/Local%20Apps/TreeNFCGame/docs/09-conventions.md): Cấu trúc thư mục `src/`, quy tắc code sạch và tối ưu 60 - 120 FPS.
- [`docs/10-env-and-security.md`](file:///Users/namtran/Local%20Apps/TreeNFCGame/docs/10-env-and-security.md): Biến môi trường `.env.example`, chính sách chống vặn giờ máy và an toàn NFC.
- [`docs/11-tasks.md`](file:///Users/namtran/Local%20Apps/TreeNFCGame/docs/11-tasks.md): Lộ trình 7 giai đoạn triển khai chia nhỏ (< 100k tokens/task).
- [`prototype.html`](file:///Users/namtran/Local%20Apps/TreeNFCGame/prototype.html): Bản mẫu giao diện HTML tương tác trực tiếp 100%.

---

## 4. Chỉ Dẫn Dành Cho Agent Tiếp Theo
- Đọc file [`docs/11-tasks.md`](file:///Users/namtran/Local%20Apps/TreeNFCGame/docs/11-tasks.md) để bắt đầu thực hiện Task theo thứ tự phụ thuộc.
- Sử dụng skill [`wayfinder`](file:///Users/namtran/Local%20Apps/TreeNFCGame/.agents/skills/wayfinder/SKILL.md) trước khi code để định vị file và xuất Location Report.
- Tuân thủ cấu trúc thư mục và chuẩn 64 Bytes NFC khi tạo code mới.
