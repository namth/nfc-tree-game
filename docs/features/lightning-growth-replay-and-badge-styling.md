# Đặc Tả Tính Năng: Nút Tia Sét Tăng Tốc Sinh Trưởng & Chuẩn Hóa Tag Giao Diện
**Mã tính năng:** `FEAT-FAST-GROWTH-REPLAY-TAGS`  
**Màn hình ảnh hưởng:** `TreeDetailScreen.tsx`  
**Thành phần liên quan:** `FractalTreeBridge.ts`, `AnimatedTreeCanvas.tsx`, `ThemeContext.tsx`, `TreeCard.tsx`

---

## 1. Bối Cảnh & Mục Tiêu (Objective)
1. **Nút Tia Sét (⚡ Fast-Forward & Replay Growth):**
   - Bổ sung 1 nút tròn có icon tia sét nổi ngay phía trên nút Cái Rìu ở màn hình Chi tiết Cây (`TreeDetailScreen`).
   - Nếu cây **chưa đạt 100%**: Nhấn nút sẽ kích hoạt hoạt họa cây vươn lớn từ tiến trình hiện tại lên thẳng 100% theo đúng vận tốc chuẩn của thư viện gốc (`totalGrowthTime` ~15.4s cho 0 -> 100%), bao gồm cả chu kỳ cành non rụng lá tự nhiên. Khi hoàn tất, lưu tiến trình `1.0` vào SQLite và mở khóa quả cầu hạt giống (🌰).
   - Nếu cây **đã đạt 100%**: Nhấn nút sẽ phát lại (Replay) toàn bộ hành trình sinh trưởng tuyệt đẹp từ 0% lên 100% trong ~15.4 giây để người dùng thưởng thức và chiêm ngưỡng.
   - Trong quá trình hoạt họa diễn ra: Khóa toàn bộ các nút thao tác tương tác cây (nút Rìu, nút Hạt giống, nút Sét), chỉ cho phép các nút điều hướng chuyển trang (nút Back, Bottom Navigation).

2. **Chuẩn hóa Tốc độ Sinh trưởng Toàn App:**
   - Sử dụng mốc thời gian chuẩn $15.4\text{s}$ của thư viện gốc GitHub (`lib/fractal-branch-tree.js`) làm vận tốc tiêu chuẩn cho mọi hiệu ứng sinh trưởng khi mở lại app hoặc khi tua nhanh.

3. **Chuẩn hóa Giao Diện Sáng / Tối cho Tag Độ Hiếm & Tag Đời Cây:**
   - Khắc phục triệt để lỗi hiển thị nền mờ/lóa ở chế độ Sáng (Light Theme).
   - **Tag Độ Hiếm (Rarity Badge):** Hiển thị background và màu viền/chữ tương ứng với nhóm màu độ hiếm đã quy định:
     - **Phổ Biến (Common):** Hệ màu Xanh Lục (Emerald). Dark: `#34d399` trên nền kính lục tối; Light: `#15803d` trên nền xanh dịu có viền rõ ràng.
     - **Hiếm (Rare):** Hệ màu Xanh Lam (Cyan/Ice). Dark: `#38bdf8` trên nền lam tối; Light: `#0369a1` trên nền xanh da trời thanh thoát.
     - **Huyền Thoại (Legendary):** Hệ màu Vàng Kim / Hổ Phách (Amber/Gold). Dark: `#fbbf24` trên nền hổ phách; Light: `#b45309` trên nền vàng quý phái.
   - **Tag Đời Cây (Generation Badge):** Tách biệt tương phản giữa Dark (`rgba(56, 189, 248, 0.15)`, chữ `#38bdf8`) và Light (`rgba(2, 132, 199, 0.12)`, chữ `#0284c7`).

---

## 2. Luồng Trải Nghiệm Người Dùng (User Flow)
- Bấm nút Sét -> Khóa các nút hành động trên cây.
- Tính toán thời gian anim: `durationMs = (targetProgress - startProgress) * 15400`.
- Chạy khung hình qua `requestAnimationFrame`, cập nhật `tree.currentProgress` liên tục lên Skia Canvas.
- Sau khi xong: set `currentProgress = 1.0`, `hasSeedReady = true`, lưu snapshot vào DB và mở khóa các nút.

---

## 3. Chi Tiết Layout Tọa Độ
- Nút Cái Rìu (`axeBtn`): `top: -54, left: 18`
- Nút Tia Sét (`lightningBtn`): `top: -100, left: 18` (cách nút rìu 8px)
