# Feature Spec: Hiệu Ứng Lá Kim Sa 3 Tầng & Hệ Thống Quản Lý Hiệu Năng Đồ Họa (Visual Effects & Target FPS)

## 1. Mục Tiêu Kỹ Thuật
1. **Tôn vinh phẩm cấp Huyền thoại (Legendary):** Tạo hiệu ứng thị giác đặc biệt 3 tầng cho lá Kim Sa (`LeafPalette.GOLDEN`):
   - **Tầng 1 (Đốm sao 4 cánh `✦`):** Tia sáng hoa khế lóe sáng luân phiên trên các ngọn cành mang lá Kim Sa.
   - **Tầng 2 (Bụi kim sa lơ lửng):** 24–30 hạt bụi vàng siêu mịn bay lượn nhẹ nhàng theo luồng gió quanh tán lá.
   - **Tầng 3 (Nhịp thở mặt lá):** Ánh sáng phản quang chuyển màu mềm mại theo chu kỳ gió giữa vàng hổ phách, vàng tươi và ánh kim trắng.
2. **Hệ thống Quản lý Hiệu ứng Mở Rộng (Extensible Visual Effects Architecture):**
   - Tạo hệ thống danh mục hiệu ứng `VisualEffectType` có khả năng mở rộng trong tương lai (cho cánh hoa đào rơi, bông tuyết, v.v.).
   - Thêm công tắc bật/tắt hiệu ứng trong màn hình Cài đặt (Settings), mặc định là BẬT (`true`).
3. **Bộ điều tiết FPS mục tiêu (Target Frame Rate Selector):**
   - Cho phép người chơi giảm tốc độ khung hình (24 FPS, 30 FPS, 45 FPS, 60 FPS) trên các thiết bị yếu hoặc khi muốn tiết kiệm pin tối đa.
   - Điều tiết trực tiếp vòng lặp `requestAnimationFrame` trên GPU Skia để phần cứng được nghỉ ngơi thực sự.

---

## 2. Kiến Trúc & Thiết Kế Kỹ Thuật

### 2.1. Quản lý Hiệu ứng Đồ họa (Visual Effect Registry)
- Định nghĩa enum các loại hiệu ứng đồ họa đặc biệt:
  ```typescript
  export enum VisualEffectType {
    GOLDEN_SPARKLE = 'golden_sparkle', // Hiệu ứng lá Kim Sa
    // Các hiệu ứng sẵn sàng mở rộng sau này:
    // SAKURA_PETAL_FALL = 'sakura_petal_fall',
    // FROST_CRYSTALS = 'frost_crystals',
  }
  ```
- Khi `app_effects_enabled === false`, toàn bộ các hiệu ứng trong registry đều tự động tắt, cây hiển thị màu tĩnh nguyên bản.

### 2.2. Lõi Dựng Hình Kim Sa trên GPU Skia Native (`AnimatedTreeCanvas.tsx`)
- **Tọa độ bụi & sao:** Sinh xác định theo seed của cây (`Mulberry32`), neo theo biên của tán cây (`treeSvg.bounds`).
- **Chuyển động giải tích (Analytical Motion):**
  - Tọa độ Y: $y(t) = y_0 - (v \cdot t) \pmod H$
  - Tọa độ X: $x(t) = x_0 + \sin(\omega \cdot t + \phi) \cdot A$
  - Opacity: $o(t) = \max(0, \sin(\omega_{sparkle} \cdot t + \phi_{sparkle}))$
- **Đốm sao 4 cánh (`✦`):** Vẽ bằng hình học 4 cánh lượn nhọn hoặc 2 đường chéo bo đỉnh, xoay theo góc ngẫu nhiên.
- **Tiêu tốn tài nguyên:** < 0.4ms render time trên GPU, 0% CPU rác (Zero GC allocations).

### 2.3. Bộ Điều Tiết Tần Số Khung Hình (Frame Rate Throttling)
- Lưu trữ trong `MMKV Preferences`:
  - `app_target_fps`: 24 | 30 | 45 | 60 (Mặc định: 60)
- Thuật toán tiết lưu trong vòng lặp hoạt họa:
  ```typescript
  const minFrameInterval = 1000 / targetFps;
  const elapsed = now - lastRenderTime;
  if (elapsed >= minFrameInterval) {
    lastRenderTime = now - (elapsed % minFrameInterval);
    // Render frame mới
  }
  ```

---

## 3. Giao Diện Người Dùng (UI Layout)
Thêm card **"ĐỒ HỌA & HIỆU NĂNG"** trong `SettingsScreen.tsx`:
1. **Switch "Hiệu ứng đồ họa đặc biệt" (Special Visual Effects):**
   - Mô tả: "Bật hiệu ứng lấp lánh kim sa, bụi sáng và các hạt huyền ảo trên cây."
   - Công tắc Switch: Bật / Tắt (Mặc định: BẬT).
2. **Bộ chọn Tốc độ khung hình (Target Frame Rate):**
   - Mô tả: "Hạ FPS để giảm nhiệt độ máy và tiết kiệm pin trên thiết bị yếu."
   - Segmented Control 4 nút:
     - `24 FPS` (Siêu tiết kiệm pin)
     - `30 FPS` (Tiết kiệm pin)
     - `45 FPS` (Cân bằng)
     - `60 FPS` (Mượt mà - Mặc định)

---

## 4. Phân Tích Tác Động Hệ Thống (Impact Analysis)

| Phân hệ | Mức độ tác động | Chi tiết |
| :--- | :--- | :--- |
| **NFC 64 Bytes** | **0% (Không ảnh hưởng)** | Cấu trúc nhị phân 64 Bytes giữ nguyên 100%. |
| **SQLite Schema** | **0% (Không ảnh hưởng)** | Không thay đổi bảng cơ sở dữ liệu. |
| **MMKV Storage** | **Thêm 2 key cấu hình** | `app_effects_enabled` (bool), `app_target_fps` (number). |
| **UI Settings** | **Thêm 1 Card cài đặt** | Thêm khối Đồ họa & Hiệu năng với Switch và 4 mốc FPS. |
| **Skia GPU Engine** | **Nâng cấp** | Bổ sung lớp hiệu ứng hạt Kim Sa và throttle theo FPS cài đặt. |
| **Web Canvas** | **Đồng bộ** | `lib/fractal-branch-tree.js` bổ sung hàm vẽ sparkle kim sa khi chạy web demo. |
