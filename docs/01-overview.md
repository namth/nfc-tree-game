# 01. Tổng Quan Dự Án: Fractal Tree NFC Mobile Game

## 1. Tầm nhìn & Mục tiêu Cốt lõi (Project Vision)
**Fractal Tree NFC Game** là một tựa game di động (iOS & Android) phong cách Zen thiền định, kết hợp độc đáo giữa công nghệ phần cứng chạm thẻ NFC (Near Field Communication) và đồ họa toán học hình học Fractal (Fractal Geometry).

Mỗi người chơi sở hữu những thẻ NFC vật lý đóng vai trò là "Hạt giống cây" (Seed Tag). Bằng cách chạm thẻ vào lưng điện thoại, mầm cây ảo sẽ được nảy mầm vào "Khu vườn số" (Digital Garden). Cây sẽ lớn dần theo thời gian thực (từ 0% đến 100%) hoàn toàn offline, cành lá vươn lên và đung đưa mượt mà theo từng làn gió. Khi cây đạt 100% trưởng thành, nó sẽ có xác suất kết quả/hạt giống mới mang bộ gen di truyền từ cây cha mẹ, cho phép người chơi thu hoạch bằng cách ghi vào một thẻ NFC mới hoặc tái sinh chiếc thẻ cũ.

---

## 2. Các Trụ Cột Giá Trị (Core Value Pillars)

1. **Sở Hữu Vật Lý (Physical Ownership):**
   - Thẻ NFC vật lý (dòng NTAG213 / NTAG215 / NTAG216) đóng vai trò là **"Single Source of Truth"**.
   - Cây gắn liền với chiếc thẻ vật lý; đổi sang điện thoại khác chỉ cần chạm lại thẻ là khôi phục toàn bộ cây và tuổi thọ.
2. **Thuần Offline (100% Offline-First):**
   - Hoạt động trọn vẹn mà không cần kết nối Internet, không phụ thuộc máy chủ backend, bảo đảm quyền riêng tư và trải nghiệm mượt mà mọi lúc mọi nơi.
3. **Hiệu Năng Đồ Họa Đỉnh Cao (60 - 120 FPS Native):**
   - Tận dụng sức mạnh GPU thông qua `@shopify/react-native-skia` chạy trực tiếp trên luồng UI Thread (C++ JSI), dựng hàng ngàn cành cây và chùm lá mượt mà như game console.
4. **Trải Nghiệm Thư Giãn (Zen & Mindful Gaming):**
   - Tiết tấu game chậm rãi, âm thanh tự nhiên (chuông gió, suối chảy), giúp người chơi giải tỏa căng thẳng khi ngắm cây lớn mỗi ngày.

---

## 3. Đối Tượng Người Dùng & Bối Cảnh Sử Dụng (Target Users)

- **Game thủ yêu thích nuôi thú/trồng cây ảo (Virtual Pet / Zen Garden):** Thích ngắm nhìn sự phát triển tĩnh tại, không áp lực cày cuốc.
- **Cộng đồng sưu tầm thẻ vật lý & công nghệ NFC:** Thích sở hữu thẻ bài, móc khóa NFC thực tế, cá nhân hóa thẻ bằng hình vẽ bên ngoài và gieo mầm cây ảo bên trong.
- **Quà tặng công nghệ ý nghĩa:** Tặng bạn bè thẻ hạt giống NFC để họ tự tay nuôi lớn món quà trên điện thoại của mình.
