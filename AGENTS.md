# Workspace Agent Instructions (AGENTS.md)

Chào mừng bạn đến với dự án **TreeNFCGame (Fractal Tree NFC Mobile Game)**.
Mọi Agent khi làm việc trong workspace này phải tuân thủ nghiêm ngặt các quy chuẩn sau:

---

## 1. Bản Đồ Bối Cảnh (Context Map)
- Luôn đọc file [`CONTEXT.md`](./CONTEXT.md) và thư mục [`/docs`](./docs) trước khi bắt đầu công việc.
- Không tự ý phán đoán kiến trúc hoặc thay đổi tech stack đã thống nhất:
  - Framework: **React Native (Bare Workflow, Android Studio & Xcode)**
  - Đồ họa: **@shopify/react-native-skia JSI (GPU 60 - 120 FPS)**
  - Giao tiếp NFC: **react-native-nfc-manager** (chuẩn nhị phân 64 Bytes)
  - Lưu trữ: **100% Offline-First (SQLite + MMKV)**

---

## 2. Các Skills & Protocols Bắt Buộc

Workspace được trang bị các kỹ năng chuyên biệt trong `.agents/skills/`:

1. **`grill-master`** ([`.agents/skills/grill-master/SKILL.md`](./.agents/skills/grill-master/SKILL.md)):
   - Kích hoạt khi khởi tạo dự án mới, phỏng vấn kiến trúc, tạo bộ tài liệu `/docs` ban đầu.
2. **`grill-feature`** ([`.agents/skills/grill-feature/SKILL.md`](./.agents/skills/grill-feature/SKILL.md)):
   - Kích hoạt khi người dùng yêu cầu **thêm một tính năng mới**. Phỏng vấn từng câu một, phân tích tác động (Impact Analysis) tới DB/API/UI và cập nhật tài liệu trước khi code.
3. **`wayfinder`** ([`.agents/skills/wayfinder/SKILL.md`](./.agents/skills/wayfinder/SKILL.md)):
   - Kích hoạt **ngay trước khi sửa bug, refactor hoặc implement task** để khoanh vùng Target Files và Context Files, xuất `WAYFINDER LOCATION REPORT` nhằm tiết kiệm context window.
4. **`ui-ux-pro-max`** ([`.agents/skills/ui-ux-pro-max/SKILL.md`](./.agents/skills/ui-ux-pro-max/SKILL.md)):
   - Kích hoạt khi thiết kế UI/UX, bảng màu, typography và animation.
