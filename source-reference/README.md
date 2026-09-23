# Fractal Tree & Barnsley Fern Visualizer 🌲🌿

Ứng dụng tạo và khám phá cây Fractal tương tác được xây dựng trên thư viện **p5.js**. Dự án đã được refactor thành 2 bộ thư viện độc lập nằm trong thư mục `lib/` phục vụ tái sử dụng cho các dự án web và đồ họa khác.

---

## 📚 Danh mục Thư viện trong `lib/`

Chi tiết xem tại tài liệu [lib/README.md](lib/README.md).

1. **`FractalBranchTree` (`lib/fractal-branch-tree.js`)**:
   - Quản lý và vẽ các loại cây thân gỗ phân nhánh: **Đa Phân Tự Nhiên (Type 1)** và **Phân Nhánh Tuần Tự (Type 2)**.
   - Hỗ trợ mô phỏng quá trình tăng trưởng, chuyển động gió, các loại lá (Emerald, Sakura, Autumn), quả phát sáng và các chùm hoa tử đằng.

2. **`BarnsleyFernTree` (`lib/barnsley-fern-tree.js`)**:
   - Quản lý và vẽ các loại cây hình học lượng giác: **Dương Xỉ Barnsley (Type 3)**.
   - Hỗ trợ tùy biến số lá từ gốc, góc xòe tán, độ nhọn lá, số cặp lá con, tỉ lệ mọc so le và chuyển động lắc lư theo gió.

---

## 🚀 Cách chạy ứng dụng tại địa phương

Chỉ cần mở tệp `index.html` trực tiếp trên trình duyệt web hoặc chạy qua trình chủ web cục bộ (như Live Server, VS Code Live Preview, hoặc Python `http.server`):

```bash
npx serve .
# Hoặc
python3 -m http.server 8000
```

---

## 🛠 Cách gọi thư viện trong mã nguồn

### Tích hợp HTML
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<script src="lib/fractal-branch-tree.js"></script>
<script src="lib/barnsley-fern-tree.js"></script>
<script src="sketch.js"></script>
```

### Khởi tạo & Vẽ Cây Thân Gỗ
```javascript
const tree = new FractalBranchTree({
  initLength: 200,
  branchAngle: 20,
  maxDepth: 9,
  treeType: 'hybrid',
  colorTheme: 'cyberpunk',
  seed: 12345
});

tree.update(dt);
tree.draw();
```

### Khởi tạo & Vẽ Cây Dương Xỉ
```javascript
const fern = new BarnsleyFernTree({
  initLength: 640,
  maxDepth: 3,
  fernFrondCount: 5,
  fernSpreadAngle: 45,
  colorTheme: 'emerald',
  seed: 12345
});

fern.update(dt);
fern.draw();
```
