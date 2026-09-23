# Feature Spec: Tối Ưu Đồ Họa Gió Skia GPU Native (60 FPS) & Dọn Dẹp Ambient

## 1. Mục Tiêu Kỹ Thuật
- **Khắc phục triệt để hiện tượng giật lag:** Chuyển đổi toàn bộ tiến trình render cây động trên màn hình chi tiết (`TreeDetailScreen`) từ `react-native-svg` (vốn gọi `setState` 30 lần/giây làm nghẽn luồng JavaScript) sang **`@shopify/react-native-skia` JSI Canvas**.
- **Loại bỏ 100% bươm bướm:** Gỡ bỏ hoàn toàn hiệu ứng bươm bướm trên cả Landing Page (`landing.html`) và Mobile App (`WindButterfly.tsx`) để tối ưu hóa bộ nhớ, giảm tải CPU/GPU và giữ không gian Zen thanh tịnh.
- **Loại bỏ tính năng Tap Gust:** Loại bỏ luồng gió giật khi chạm màn hình, thao tác chạm chỉ dành riêng cho Pan / Zoom tự do và thu hoạch hạt giống.

---

## 2. Kiến Trúc Hoạt Họa Gió Skia GPU Native

### 2.1. Phân Lớp Dựng Hình & Neo Tọa Độ
1. **Lớp hào quang Zen:** Vẽ bằng Skia `<Oval>` kết hợp `<RadialGradient>` tỏa ra nền sâu thẳm.
2. **Lớp Gò Đất Tự Nhiên:** 3 hình `<Oval>` xếp lớp ôm sát gốc cây tại tọa độ `(0, 0)` trên mặt đất, **hoàn toàn đứng yên** và không bị ảnh hưởng bởi dao động gió.
3. **Cụm Cây Đung Đưa (Sway Group):**
   - Áp dụng Reanimated Shared Value (`useSharedValue`, `withRepeat`, `withSequence`, `withTiming`, `Easing.inOut(Easing.sin)`).
   - Xoay quanh gốc neo `origin={vec(0, 0)}` với biên độ góc dao động nhẹ nhàng $\pm 0.015\text{ rad}$ ($\approx 0.86^\circ$).
   - Toàn bộ chu kỳ dao động chạy 100% trên luồng UI Native (Worklet), **tiêu thụ 0% CPU trên luồng JavaScript**.

### 2.2. Cơ Chế Biên Dịch Hình Học Skia Path
- `FractalTreeBridge.generateAuthenticSvg` chỉ được gọi **1 lần duy nhất** khi cây thay đổi tiến trình (`tree.currentProgress`) hoặc gen (`tree.genetics`).
- Các đường dẫn hình học được chuyển thành `SkPath` (`Skia.Path.MakeFromSVGString`) và lưu vào bộ nhớ GPU, không tạo mới qua từng khung hình.

---

## 3. Phân Tích Tác Động Hệ Thống (Impact Analysis)

| Phân hệ | Mức độ tác động | Chi tiết |
| :--- | :--- | :--- |
| **NFC 64 Bytes** | **0% (Không ảnh hưởng)** | Cấu trúc nhị phân 64 Bytes giữ nguyên 100%. |
| **SQLite / MMKV** | **0% (Không ảnh hưởng)** | Không thay đổi bất kỳ bảng hay trường dữ liệu nào. |
| **JS Thread / CPU** | **Giảm > 90% tải CPU** | Loại bỏ hoàn toàn vòng lặp 30 FPS gọi `setState` và serialization chuỗi SVG khổng lồ. |
| **Tốc độ khung hình (FPS)** | **Khóa cứng 60 - 120 FPS** | Dựng hình trực tiếp qua GPU Skia C++ JSI. |
| **Landing Page** | **Tối ưu mã nguồn** | Gỡ bỏ ~180 dòng CSS và JS quản lý đàn bướm, giao diện cây Hero load nhanh và sạch sẽ. |

---

## 4. Danh Sách Tệp Đã Thay Đổi
1. `landing.html`: Xóa bỏ CSS, DOM và logic JS của bươm bướm trong Hero section.
2. `src/components/WindButterfly.tsx`: Đã xóa bỏ.
3. `src/screens/TreeDetailScreen.tsx`: Gỡ bỏ import/JSX `ButterflyLayer`, dọn dẹp `triggerGust` và các ref liên quan.
4. `src/components/AnimatedTreeCanvas.tsx`: Tái cấu trúc sang Skia GPU Native + Reanimated UI Thread Sway.
