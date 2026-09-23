# 04. Luồng Trải Nghiệm Người Dùng (User Flows & State Transitions)

Tài liệu này mô hình hóa toàn bộ hành trình người dùng (User Journeys) và các máy trạng thái (State Machines) trong ứng dụng.

---

## 1. Bản Đồ Trạng Thái Điều Hướng Toàn Cục

```mermaid
stateDiagram-v2
    [*] --> GardenDashboard: Khởi động app (Auto Uptime Check)

    GardenDashboard --> TreeDetail: Nhấp vào 1 thẻ cây
    TreeDetail --> GardenDashboard: Bấm nút Quay lại (Back)

    GardenDashboard --> ArchiveGallery: Nhấp tab 'Nhà kính'
    ArchiveGallery --> GardenDashboard: Nhấp tab 'Vườn cây'

    GardenDashboard --> SettingsScreen: Nhấp tab 'Cài đặt'
    SettingsScreen --> GardenDashboard: Nhấp tab 'Vườn cây'

    GardenDashboard --> NFCScanModal: Bấm nút FAB quét NFC
    TreeDetail --> NFCScanModal: Bấm 'Thu hoạch hạt giống'

    state NFCScanModal {
        [*] --> WaitingForTag: Kích hoạt sóng cảm biến NFC
        WaitingForTag --> TagDetected: Áp thẻ vào lưng máy
        TagDetected --> ProcessPayload: Đọc / Ghi gói 64 Bytes nhị phân
        ProcessPayload --> SuccessFeedback: Thành công (Rung Haptic + Chuông)
        ProcessPayload --> WaitingForTag: Lỗi đọc thẻ / Rút ra quá nhanh
    }

    SuccessFeedback --> GardenDashboard: Hoàn tất gieo mầm cây mới
    SuccessFeedback --> TreeDetail: Hoàn tất thu hoạch (Hạt biến mất)
```

---

## 2. Các Luồng Chi Tiết Từng Bước

### Luồng 1: Khởi Động & Kiểm Soát Toàn Vẹn Thời Gian (Launch & Anti-Tamper)
1. Người chơi mở ứng dụng.
2. Hệ thống gọi `TimeKeeperService.validateSystemTime()`:
   - Lấy `wallClockTime` hiện tại và `deviceUptime` từ phần cứng.
   - So sánh với `last_active_at` và `last_uptime` lưu trong MMKV.
3. **Phân nhánh kiểm tra:**
   - **Hợp lệ:** Tự động tính toán lại tiến trình % của tất cả các cây theo thời gian trôi qua $\to$ Mở màn hình Garden Dashboard.
   - **Bị vặn lùi giờ (Rewind):** Hiển thị Modal cảnh báo lệch giờ, tạm khóa mọc cây cho đến khi giờ máy được chỉnh đúng.
   - **Bị vặn tiến giờ bất thường (Forward Skip mà uptime không đổi):** Chỉ tính tiến trình theo mức tăng của phần cứng `deviceUptime`.

### Luồng 2: Quẹt Thẻ Gieo Mầm Cây Mới (First NFC Planting Flow)
1. Người chơi chạm thẻ NFC chứa mầm cây vào lưng điện thoại (hoặc bấm nút FAB NFC trên màn hình rồi chạm thẻ).
2. Hệ thống đọc gói nhị phân 64 Bytes:
   - Kiểm tra `magic == 0x5452` và `CRC16`.
   - Kiểm tra bit trạng thái `flags.isPlanted`:
     - Nếu `isPlanted == 0` (Hạt chưa trồng):
       - Ghi timestamp `planted_at = Date.now()` và set `isPlanted = 1` ngược vào thẻ NFC.
       - Lưu bản ghi mới vào bảng `GARDEN_TREE` trên máy.
       - Điện thoại rung nhẹ (`Haptic Success`) và hiển thị hiệu ứng mầm non đội đất nảy nở.
     - Nếu `isPlanted == 1` (Cây đã trồng):
       - Đồng bộ tiến trình giữa thẻ và máy, mở ngay màn hình Chi Tiết Cây.

### Luồng 3: Cây 100% Trưởng Thành, Kết Hạt & Thu Hoạch Thẻ
```mermaid
sequenceDiagram
    autonumber
    actor Player as Người Chơi
    participant App as Ứng Dụng Mobile
    participant Tree as Cây Fractal (100%)
    participant NFC as Thẻ NFC Vật Lý

    Note over Tree: Cây đạt 100% sinh trưởng
    Tree->>Tree: Roll xác suất ra hạt giống mới
    Tree-->>App: Kích hoạt Hạt Giống F1 (Quả cầu vàng phát sáng)
    Player->>App: Bấm "Thu hoạch Hạt giống F1"
    App->>Player: Hiển thị NFC Radar Bottom Sheet
    Player->>NFC: Chạm Thẻ NFC vào lưng máy
    App->>NFC: Đọc 64-Byte Payload của thẻ mục tiêu

    alt Thẻ Mục Tiêu là THẺ MỚI (Trắng/Chưa dùng)
        App->>NFC: Ghi Payload Hạt Giống F1 mới
        App->>Tree: Xóa hạt trên cây mẹ
        App->>Player: Thông báo: Đã tạo hạt mầm F1 thành công!
    else Thẻ Mục Tiêu là CHÍNH THẺ CŨ (Tái sinh thẻ)
        App->>App: Sao lưu Cây Mẹ cũ sang bảng ARCHIVE_TREE
        App->>App: Xóa Cây Mẹ cũ khỏi GARDEN_TREE
        App->>NFC: Ghi đè Payload Hạt Giống F1 mới vào thẻ cũ
        App->>Player: Thông báo: Cây cũ đã vào Nhà kính, mầm mới đã sẵn sàng!
    end
```
