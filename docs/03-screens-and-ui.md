# 03. Giao Diện & Thiết Kế UI/UX (Screens & UI Specification)

Tài liệu này đặc tả toàn diện hệ thống thiết kế (Design System), bố cục chi tiết 4 màn hình chính, 3 thành phần nổi (Modals) và **Prompts tiếng Anh chuẩn mực cho công cụ Google Stitch**.

---

## 1. Hệ Thống Thiết Kế (Design System: Zen Dark Botanical)

* **Triết lý thị giác:** Zen tĩnh tại, tối giản, lấy cảm hứng từ thiên nhiên và nghệ thuật Bonsai/Cây cảnh.
* **Bảng màu (Color Palette):**
  * `Background Dark`: `#0F1412` (Xanh đen rêu rừng thẳm)
  * `Card / Surface`: `#18221E` (Xanh rêu xám)
  * `Elevated Surface`: `#21302B` (Khối nổi tạo chiều sâu)
  * `Accent Green`: `#4ADE80` (Mầm non phát sáng, trạng thái hoạt động)
  * `Accent Gold`: `#FBBF24` (Hạt giống chín rực rỡ, ánh nắng vàng)
  * `Accent Sakura`: `#F472B6` (Hoa anh đào hồng phấn dịu nhẹ)
  * `Trunk Wood`: `#854D0E` (Màu gỗ nâu tự nhiên)
  * `Text Main`: `#F0FDF4` (Trắng ngà xanh dịu mắt)
  * `Text Muted`: `#86A397` (Xám rêu phụ đề)
* **Typography (Thống nhất 100% Font Không Chân - Modern Sans-serif):**
  * Toàn bộ hệ thống giao diện (từ tiêu đề, phụ đề, nút bấm đến số liệu) sử dụng duy nhất một họ phông chữ không chân hiện đại: **Plus Jakarta Sans** (hoặc fallback `Inter / system-ui`).
  * Phong cách hình học sạch sẽ, thanh thoát, khoảng cách chữ cân đối, giúp các chi tiết đồ họa tự nhiên trở nên nổi bật mà không gây rối mắt.

---

## 2. Đặc Tả Chi Tiết Các Màn Hình

### 2.0. Screen 0: Màn Hình Chờ Khởi Động (Splash Screen)
* **Bố cục & Hiệu ứng:**
  * Nền xanh rêu rừng thẳm (`#0F1412`).
  * Trung tâm: Biểu tượng mầm hạt giống nảy mầm tỏa ra vòng sóng cảm ứng NFC xanh phát sáng mượt mà.
  * Tên ứng dụng: **"Fractal Tree"** (Font Plus Jakarta Sans, Bold, màu trắng tinh khôi).
  * Khẩu hiệu phụ (Tagline): *"Chạm thẻ NFC để nảy mầm"* (Font Plus Jakarta Sans, màu rêu dịu).
  * Thanh tải tinh tế hoặc tự động chuyển tiếp vào Garden Dashboard sau 2 giây khi kiểm tra xong phần cứng và đồng hồ máy.

### 2.1. Screen 1: Khu Vườn Của Tôi (Garden Dashboard)
* **Bố cục & Quy tắc Trực quan Độc Đáo:**
  * **Top Bar:** Tiêu đề "Khu Vườn Của Tôi", Huy hiệu trạng thái "Offline-First" góc phải.
  * **Filter Pills:** 2 tab chuyển đổi: `Đang Lớn (Active)` và `Đã Trưởng Thành (Mature)`.
  * **Quy tắc hiển thị cây theo giai đoạn:**
    * **Khi tiến trình $< 50\%$:** Cây chưa lộ cấu trúc cành. Thumbnail chỉ hiển thị **3 chiếc lá theo hình dáng giống cây đó xếp xòe thành hình rẻ quạt (Fan Spread)** với 3 sắc độ màu sắc di truyền của giống cây (tạo cảm giác bí ẩn, chờ đợi).
    * **Khi tiến trình $\ge 50\%$:** Cây bắt đầu hé lộ cấu trúc cành fractal đệ quy và bung nở lá thật sự.
    * **Khi tiến trình $= 100\%$:** Cây nở hoa kết hạt, xuất hiện huy hiệu phát sáng `✨ Có Hạt F1`.
  * **Trạng thái Khu Vườn Trống (Empty State - Khi chưa trồng cây nào):**
    * Hiển thị một không gian thiền định tối giản.
    * Ở trung tâm: Một chiếc lá tỏa sáng lơ lửng, **cứ mỗi 2-3 giây lại tự động chuyển đổi (Morphing) sang một hình dạng lá khác** (Sồi, Anh Đào, Thông, Liễu, Phong, Bạch Quả) với màu sắc ngẫu nhiên trong bảng màu hệ thống.
    * Phía dưới là nút bấm lớn nổi bật: **"Trồng Cây Mới"** (Chạm thẻ NFC để gieo hạt đầu tiên).
  * **Nút bấm nổi (FAB NFC):** Nút tròn xanh lá ở góc phải dưới đáy có icon NFC.
  * **Bottom Navigation Bar:** 3 tab cố định: *Vườn Cây*, *Nhà Kính*, *Cài Đặt*.

### 2.2. Screen 2: Chi Tiết Cây (Tree Detail & Zen View)
* **Bố cục:**
  * **Top Navigation:** Nút Back (←) và tên giống cây.
  * **Skia Canvas:** Khung tròn/bo góc chiếm 60% màn hình, hiển thị cây fractal chuyển động 60 - 120 FPS.
  * **Quả cầu hạt giống (Seed Orb):** Treo lơ lửng phát sáng trên cành khi cây đạt 100%.
  * **Thanh trượt thời gian sinh trưởng:** Hiển thị % mọc và đếm ngược thời gian.
  * **Bảng chỉ số Gen:** Góc cành, độ sâu đệ quy, ngày trồng, chip UID.
  * **Nút hành động chính:** Nút "🌟 Thu Hoạch Hạt Giống F1 Vào Thẻ NFC" (chỉ hiện khi có hạt).

### 2.3. Screen 3: Nhà Kính Danh Dự (Archive Gallery)
* **Bố cục:**
  * Lưới 2 cột (Grid 2 columns) trưng bày các khung tranh cây cổ thụ đã hoàn thành trước khi thẻ NFC bị ghi đè.
  * Thông tin dưới tranh: Tên cây, ngày hoàn thành, số lượng hạt giống F1 đã sinh ra.
  * Nhấp vào bất kỳ tranh nào để mở lại chế độ ngắm cây hoài niệm.

### 2.4. Screen 4: Cài Đặt & Hướng Dẫn NFC (Settings & Guide)
* **Bố cục:**
  * Thẻ minh họa vị trí chip NFC trên iPhone (đỉnh camera) và Android (lưng máy).
  * Cài đặt âm thanh thư giãn (tiếng chuông gió, suối reo) và độ rung phản hồi (Haptic).
  * Thông tin phiên bản chuẩn dữ liệu nhị phân (Binary Protocol V1 - 64 Bytes).

---

## 3. Các Modal Tương Tác Phần Cứng (Hardware Bottom Sheets)

* **Modal A - NFC Radar Scanner:** Sóng radar xanh xoay vòng tròn tỏa ra từ tâm icon NFC, dòng chữ: *"Hãy áp thẻ NFC hạt giống sát vào lưng điện thoại và giữ yên..."*.
* **Modal B - Zen Celebration Dialog:** Mầm cây đội đất nhú lên kèm hiệu ứng hạt bụi vàng phát sáng khi quẹt thẻ thành công.
* **Modal C - Anti-Tamper Warning Modal:** Thông báo khi giờ máy bị vặn lệch: *"Thời gian hệ thống không đồng nhất. Vui lòng bật lại 'Đặt giờ tự động' để tiếp tục nuôi cây."*

---

## 4. Prompts Tiếng Anh Chuẩn Cho Google Stitch

Dưới đây là các prompt chi tiết sẵn sàng dán vào Google Stitch MCP để sinh giao diện:

### Prompt 1: Garden Dashboard Screen
```text
Mobile app screen for a Zen botanical game called "Fractal Tree NFC Game". Modern minimalist dark theme with deep forest-moss background (#0F1412). 
Top status bar shows "12:45" and a pill badge with green dot "OFFLINE-FIRST". 
Header title in elegant serif font: "My Zen Garden" with subtitle "Tap NFC tag to plant or view growth".
A segmented tab selector with options: "Growing (2)" [active pill with dark green background] and "Mature (1)".
Vertical scrollable list of rounded cards (#18221E background, subtle green glowing border):
- Card 1: Thumbnail of a growing glowing fractal oak tree, label "NTAG213 • #OAK-082", bold title "Ancient Oak Tree", progress bar at 72% filled with vibrant emerald green gradient, text "72% - 2 days remaining".
- Card 2: Thumbnail of a pink blossom sakura fractal tree, label "NTAG215 • #SAK-104", bold title "Blossom Sakura", progress bar at 35% pink gradient, text "35% - 5 days remaining".
- Card 3: Mature tree card with subtle gold border and badge "✨ F1 SEED READY", vibrant autumn maple tree thumbnail, progress bar at 100% gold gradient, text "100% Mature - Ready to harvest".
Floating Action Button (FAB) at bottom-right: circular emerald green button with a white NFC waves icon and subtle shadow.
Bottom navigation bar with 3 tabs: "Garden" (active with leaf icon), "Archive" (museum temple icon), "Settings" (gear icon). Clean, premium, tranquil aesthetic.
```

### Prompt 2: Tree Detail & Zen View Screen
```text
Mobile app detail screen for "Fractal Tree NFC Game". Dark peaceful botanical background (#0F1412).
Top app bar with a sleek rounded back arrow button on the left, centered serif title "Ancient Oak Tree", and species tag "OAK LEAF" on the right.
Center 60% of the screen features a large rounded container (#17241E) with an intricate mathematical fractal tree in soft green and earthy wood tones, branches swaying gently. Near the upper branches, a golden glowing spherical seed orb is hovering with a soft ethereal aura.
Below the canvas:
- Progress section showing "Growth Progression: 72%" with an interactive slider track glowing green.
- Hardware UID row: "Hardware Tag: 04:B2:71:A2:89 (NTAG213)".
- 3-column stats grid: Card 1: "28°" (Branch Angle), Card 2: "9 Layers" (Recursion Depth), Card 3: "7 Days" (Total Life Cycle).
- Prominent bottom action button in rich amber/gold gradient: "✨ Harvest F1 Seed to NFC Tag" with an NFC spark icon. Minimalist, serene, immersive UI.
```

### Prompt 3: NFC Radar Scanner Bottom Sheet
```text
Mobile UI bottom sheet overlay for NFC scanning in a Zen garden game. 
Semi-transparent dark backdrop blur. The bottom sheet slides up with rounded top corners (radius 32px), dark moss texture (#141C18).
A subtle top drag handle.
Center features an animated glowing radar circle with 3 concentric green ripple waves expanding outward from a central circular badge with an illuminated white NFC radio-wave icon.
Title below radar: "Ready to Scan NFC Tag" in white bold typography.
Subtitle: "Hold your physical seed card firmly against the back of your phone near the camera lens...".
Two simulation action buttons with soft borders:
- Button 1: "✨ Simulate New Seed Tag (Planting)" with green leaf icon.
- Button 2: "♻️ Simulate Overwrite Old Tag (Archive Tree)" with golden recycling icon.
Cancel text button at bottom: "Cancel". Minimalist, calming, highly polished hardware interaction design.
```

---

## 5. Danh Mục Bản Mẫu HTML Tương Tác (Interactive HTML Prototypes)

Toàn bộ các màn hình trên đã được hiện thực hóa thành các file HTML tương tác độc lập trong thư mục [`ui-ux/`](file:///Users/namtran/Local%20Apps/TreeNFCGame/ui-ux/):

- 📱 [**`ui-ux/index.html`**](file:///Users/namtran/Local%20Apps/TreeNFCGame/ui-ux/index.html): **Master Showcase Hub** (Khung mô phỏng điện thoại và bảng điều khiển chuyển nhanh giữa tất cả các màn hình).
- ✨ [**`ui-ux/00-splash-screen.html`**](file:///Users/namtran/Local%20Apps/TreeNFCGame/ui-ux/00-splash-screen.html): Màn hình Khởi Động (Logo mầm cây và sóng NFC chuyển tiếp mượt mà).
- 🌿 [**`ui-ux/01-garden-dashboard.html`**](file:///Users/namtran/Local%20Apps/TreeNFCGame/ui-ux/01-garden-dashboard.html): Màn hình Khu Vườn Của Tôi (Quy tắc rẻ quạt 3 lá cho cây <50%, Empty State chuyển lá liên tục, FAB NFC).
- 🌳 [**`ui-ux/02-tree-detail.html`**](file:///Users/namtran/Local%20Apps/TreeNFCGame/ui-ux/02-tree-detail.html): Màn hình Chi Tiết Cây (Skia Fractal Canvas 60 FPS lay động theo gió, thanh kéo sinh trưởng 0% - 100%, quả cầu hạt giống vàng).
- 🏛️ [**`ui-ux/03-archive-gallery.html`**](file:///Users/namtran/Local%20Apps/TreeNFCGame/ui-ux/03-archive-gallery.html): Màn hình Nhà Kính Danh Dự (Lưới khung tranh bảo tàng cổ thụ).
- ⚙️ [**`ui-ux/04-settings-guide.html`**](file:///Users/namtran/Local%20Apps/TreeNFCGame/ui-ux/04-settings-guide.html): Màn hình Cài Đặt & Hướng Dẫn Vị Trí Ăng-ten NFC (iPhone & Android).
- 📡 [**`ui-ux/05-nfc-radar-modal.html`**](file:///Users/namtran/Local%20Apps/TreeNFCGame/ui-ux/05-nfc-radar-modal.html): Hệ thống Modal (Sóng radar quét thẻ, hộp thoại gieo mầm thành công và cảnh báo lệch giờ).

