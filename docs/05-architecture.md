# 05. Kiến Trúc Kỹ Thuật Tổng Thể (System Architecture)

## 1. Sơ Đồ Kiến Trúc Phân Tầng (Layered Architecture)

Ứng dụng được thiết kế theo mô hình **Offline-First & Hardware-Bound Architecture**:

```
+-------------------------------------------------------------------------+
|                              MOBILE APP                                 |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                           UI LAYER                                |  |
|  |   Garden Dashboard  |  Tree Detail (Skia Canvas) |  NFC Scanner   |  |
|  +-------------------------------------------------------------------+  |
|                                  |                                      |
|  +-------------------------------------------------------------------+  |
|  |                       GAME ENGINE & DOMAIN                        |  |
|  |  - Fractal Math Engine (Branching, Wind, Growth Interpolation)     |  |
|  |  - Seed Breeding System (Genetics inheritance, leaf locking)      |  |
|  |  - Anti-Cheat & Time Keeper (Monotonic Uptime + Heartbeat)        |  |
|  +-------------------------------------------------------------------+  |
|               |                                       |                 |
|  +---------------------------+       +-------------------------------+  |
|  |     LOCAL STORAGE LAYER   |       |       HARDWARE I/O LAYER      |  |
|  |  - MMKV (Fast State/Config)       |  - react-native-nfc-manager   |  |
|  |  - SQLite (Trees & Gallery)       |  - Binary Packer / Unpacker   |  |
|  +---------------------------+       +-------------------------------+  |
+-------------------------------------------------------|-----------------+
                                                        | NFC RF Field
                                                        v
                                       +----------------------------------+
                                       |       NFC PHYSICAL TAG           |
                                       | (NTAG213 / NTAG215 / NTAG216)    |
                                       |   * 64-Byte Standard Payload     |
                                       |   * Single Source of Truth       |
                                       +----------------------------------+
```

---

## 2. Chuẩn Đặc Tả Nhị Phân Thẻ NFC (Binary Protocol V1 - 64 Bytes)

Toàn bộ thông tin cây/hạt giống được đóng gói cố định trong một khối **64 Bytes**, đảm bảo tương thích 100% với chip nhớ nhỏ nhất **NTAG213 (144 Bytes)** và sẵn sàng mở rộng trong tương lai.

### Bảng Phân Bổ Byte (64-Byte Memory Layout):

| Offset (Bytes) | Field Name | Kiểu dữ liệu | Dung lượng | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- |
| **0 - 1** | `magic` | `uint16_be` | 2B | Mã nhận diện chuẩn: `0x5452` (ký tự ASCII `'TR'` - Tree) |
| **2** | `version` | `uint8` | 1B | Phiên bản schema (Hiện tại: `0x01`) |
| **3** | `flags` | `uint8` | 1B | Bitmask trạng thái: <br>• Bit 0: `0`=Hạt chưa gieo, `1`=Đã gieo mầm<br>• Bit 1: `1`=Đã kết hạt mới<br>• Bit 2-7: Dự phòng |
| **4 - 7** | `tree_id` | `uint32_be` | 4B | ID định danh duy nhất của Cây / Hạt giống |
| **8 - 15** | `planted_at` | `uint64_be` | 8B | Timestamp Unix Epoch (ms) lúc chạm thẻ trồng cây (`0` nếu là hạt) |
| **16 - 19** | `growth_duration` | `uint32_be` | 4B | Tổng thời gian để cây đạt 100% (đơn vị: Giây) |
| **20** | `leaf_type` | `uint8` | 1B | Loại lá (0: Pointed, 1: Maple, 2: Maple5, 3: Ginkgo, 4: Heart, 5: Single Needle, 6: Tung Lahan, 7: Sakura, 8: Eucalyptus Long, 9: Oval, 10: Bodhi, 11: Round, 12: Needle, 13: Willow) - **Cố định di truyền** |
| **21** | `branch_angle` | `uint8` | 1B | Góc rẽ nhánh cơ bản (tỉ lệ: `value / 2` = $0^\circ \to 127.5^\circ$) |
| **22** | `length_factor` | `uint8` | 1B | Tỉ lệ suy giảm độ dài cành sau mỗi tầng (`value / 255.0` = $0.0 \to 1.0$) |
| **23** | `max_depth` | `uint8` | 1B | Độ sâu đệ quy tối đa (ví dụ: 6 đến 11 tầng) |
| **24 - 25** | `trunk_color_rgb565` | `uint16_be` | 2B | Mã màu thân cây chuẩn RGB565 |
| **26 - 27** | `leaf_color_rgb565` | `uint16_be` | 2B | Mã màu lá cây chuẩn RGB565 |
| **28 - 31** | `dna_seed` | `uint32_be` | 4B | Hạt số ngẫu nhiên (RNG Seed) tái tạo chính xác hình dạng cành lá |
| **32** | `generation` | `uint8` | 1B | **Thế hệ cây:** `0` = Cây gốc P (Parents), `1` = F1, `2` = F2,... |
| **33 - 36** | `parent_tree_id` | `uint32_be` | 4B | **Mã ID cây mẹ:** `0x00000000` (Cây gốc P); ID cây mẹ đối với F1, F2... |
| **37 - 47** | `reserved` | `bytes` | 11B | **11 bytes dự phòng** cho các tính năng mở rộng (phân bón, đột biến) |
| **48 - 61** | `reserved_extra` | `bytes` | 14B | **14 bytes dự phòng bổ sung** |
| **62 - 63** | `crc16` | `uint16_be` | 2B | Checksum kiểm tra tính toàn vẹn (CRC-16-CCITT) chống lỗi ghi thẻ dở dang |

---

## 3. Kiến Trúc Đồ Họa Fractal Với Skia Engine (GPU 60 - 120 FPS)

Thuật toán dựng cây dựa trên mô hình **Recursive Fractal Branching with Harmonic Wind Physics**:

1. **Deterministic PRNG:** Sử dụng thuật toán `Mulberry32 PRNG` dựa vào `dna_seed`, đảm bảo cây luôn vẽ ra cấu trúc cành lá bất biến ở mọi máy.
2. **Growth Interpolation ($t \in [0.0, 1.0]$):**
   - $t < 0.2$: Thân chính vươn lên từ mặt đất theo hàm mượt Bezier.
   - $0.2 \le t < 0.8$: Các cành đệ quy phân nhánh từ thân chính.
   - $0.8 \le t \le 1.0$: Chùm lá bung nở to dần (scale từ 0 đến 1).
3. **Hiệu ứng Gió (Wind Sway):**
   - Dùng góc dao động điều hòa:
     $$\Delta \theta = A \cdot \sin(\omega t + \text{depth} \cdot \phi)$$
   - Chạy trực tiếp trên GPU thông qua Skia Shared Values mà không làm nghẽn React Native Bridge.
