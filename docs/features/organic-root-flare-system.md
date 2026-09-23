# Feature Spec: Hệ Thống Bạnh Gốc & Rễ Trồi Hữu Cơ (Organic Root Flare & Surface Roots System)

## 1. Mục Tiêu Tính Năng
- Khắc phục triệt để hiện tượng gốc cây kết thúc bằng một hình tròn cụt cắm xuống đất, đồng thời loại bỏ các dạng loe phình tròn không tự nhiên.
- Triển khai giải thuật tạo hình bạnh gốc theo cấu trúc hình học tam giác Bezier lõm:
  1. **Đáy phẳng ở gốc:** Đốt thân chính phẳng ngang tại mặt đất $y = 0$, loại bỏ hoàn toàn hình tròn tròn ở gốc.
  2. **Hai tam giác bạnh gốc 2 bên:** Hai tam giác nhọn vươn sang hai bên mép đất, cạnh ngoài uốn lượn theo đường cong Bezier cong lõm vào trong (concave curvature) tạo độ thắt eo chuyển tiếp mượt mà ôm sát thân cây.
  3. **Rễ trồi phụ tự nhiên (Ngẫu nhiên 1 hoặc 2 nhánh):** Xuất phát từ giữa thân cây (vị trí $1/2$ bán kính gốc), mở rộng đáy tam giác vào trong ($0.25 \times w_{base}$) và nâng chiều cao bám thân ($0.85 \times h_{flare}$) để mở rộng góc nhọn của tam giác rễ, giúp thân rễ to và dày dặn chắc khỏe; giữ góc nghiêng khoảng 35° chúc xuống đất, phẳng mép đất tại $y = 0$ (loại bỏ độ dịch xuống) tạo sự liền lạc tự nhiên với mặt đất.

## 2. Luồng Sinh Trưởng (Growth Lifecycle & Behavior)
Bộ rễ phát triển theo tiến trình sinh trưởng `currentProgress` (0.0 $\rightarrow$ 1.0):
1. **0% (Giai đoạn Hạt Mầm):** Xuất hiện 2 sợi rễ mầm mảnh khảnh đâm xuống đất cố định hạt giống.
2. **1% – 50% (Phân Cành & Vươn Thân):** Rễ dài dần ra theo chiều cao thân chính, bạnh gốc bắt đầu loe nhẹ theo đường cong Bezier.
3. **50% – 100% (Trưởng Thành & Cổ Thụ):** Bạnh gốc nở rộng vững chãi ($\times 1.6 - 1.8$ lần `d_base`), các rễ trồi gồ ghề, uốn lượn tự nhiên vươn xa 35–70px và vuốt thon chìm vào lớp đất.

## 3. Kiến Trúc Hình Học & Tác Động Hệ Thống (Architecture & Impact Analysis)
- **NFC 64 Bytes & SQLite:** **0% Impact**. Không cần thêm bất kỳ byte nào vào chip NFC hay trường dữ liệu nào trong database.
- **Chuyển dịch sang React Native Skia:** Dựng bằng một chuỗi `Path.quadTo` / `Path.cubicTo` liền mạch, 0 draw call dư thừa, đảm bảo 60 – 120 FPS trên UI thread.

## 4. Danh Sách Nhiệm Vụ Triển Khai
1. Mở rộng `BranchNode.prototype.draw` trong `ui-ux/lib/fractal-branch-tree.js`:
   - Khi vẽ gốc cây thân chính (`this.level === 0` / `this.parent === null`), thay thế hình tròn cụt bằng hình học bạnh gốc loe mềm mại.
   - Thêm phương thức `drawOrganicRoots(colStart, growthFactor)` vẽ 3 – 5 nhánh rễ trồi uốn lượn lan sang hai bên gò đất.
2. Tinh chỉnh gò đất ôm gốc trong `ui-ux/02-tree-detail.html` để hòa quyện tự nhiên với các đầu rễ cắm sâu vào đất.
3. Kiểm thử với nhiều hạt giống khác nhau (`seed`), góc nghiêng thân (`initTilt`), và kiểm tra độ mượt trên slider từ 0% đến 100%.
