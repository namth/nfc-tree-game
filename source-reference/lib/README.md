# Procedural Tree Rendering Libraries for p5.js 🌿🌲

Bộ thư viện mã nguồn mở cho **p5.js** hỗ trợ khởi tạo, giả lập quá trình phát triển (growth simulation) và vẽ các loại cây Fractal độc đáo (Cây phân nhánh đệ quy & Cây Dương Xỉ hình học) thông qua việc truyền tham số linh hoạt.

---

## 📁 Thư mục & Bộ Thư Viện

| File | Tên Lớp (Class) | Loại Cây | Mô tả |
| :--- | :--- | :--- | :--- |
| `lib/fractal-branch-tree.js` | `FractalBranchTree` | Cây Thân Gỗ Phân Nhánh | Hỗ trợ kiểu **Đa Phân Tự Nhiên (Type 1)** và **Phân Nhánh Tuần Tự (Type 2)** |
| `lib/barnsley-fern-tree.js` | `BarnsleyFernTree` | Cây Dương Xỉ Hình Học | Hỗ trợ kiểu **Dương Xỉ Barnsley Lượng Giác (Type 3)** |

---

## 🚀 Hướng dẫn tích hợp nhanh (Quick Start)

### 1. Sử dụng trực tiếp trên Trình duyệt (HTML Script Tag)

Nhúng các tệp thư viện vào thẻ `<head>` hoặc trước thẻ đóng `</body>` của tệp HTML:

```html
<!-- Nhúng thư viện p5.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>

<!-- Nhúng các thư viện vẽ cây -->
<script src="lib/fractal-branch-tree.js"></script>
<script src="lib/barnsley-fern-tree.js"></script>

<!-- Script logic ứng dụng của bạn -->
<script src="sketch.js"></script>
```

### 2. Sử dụng trong dự án Node.js / Bundler (Webpack, Vite, ES Modules)

```javascript
const FractalBranchTree = require('./lib/fractal-branch-tree.js');
const BarnsleyFernTree = require('./lib/barnsley-fern-tree.js');
```

---

## 📖 1. Thư viện `FractalBranchTree`

Thư viện chuyên dụng để tạo các cây fractal phân nhánh (gồm cây tán gỗ tự nhiên và cây leo tử đằng sequential).

### ⚙️ Bảng tham số khởi tạo (Constructor Parameters)

```javascript
const tree = new FractalBranchTree(options);
```

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `treeType` | `String` | `'hybrid'` | Loại phân nhánh: `'hybrid'` (Đa phân tự nhiên) hoặc `'sequential'` (Tuần tự) |
| `initLength` | `Number` | `200` | Chiều dài cành thân chính (px) |
| `branchAngle` | `Number` | `20` | Góc rẽ nhánh cơ bản (Độ - Degrees) |
| `lengthDecay` | `Number` | `0.75` | Tỉ lệ thu nhỏ chiều dài cành qua từng cấp đệ quy (0.30 - 0.90) |
| `initThickness` | `Number` | `30` | Độ dày gốc thân chính (px) |
| `thicknessDecay` | `Number` | `0.75` | Tỉ lệ giảm độ dày cành qua các cấp (0.50 - 0.90) |
| `maxDepth` | `Number` | `9` | Độ sâu đệ quy (Số cấp phân nhánh, 8 - 12) |
| `treeVariation` | `Number` | `0.80` | Độ biến dị ngẫu nhiên của góc, chiều dài cành và lá (0.0 - 1.2) |
| `leafType` | `String` | `'emerald'` | Kiểu lá cây: `'emerald'`, `'sakura'`, `'autumn'`, `'ginkgo'`, `'wisteria'`, `'frost'`, `'sunset'`, `'midnight'` |
| `leafShape` | `String` | `'auto'` | Dạng hình học lá: `'auto'` (Tự động theo màu), `'pointed'`, `'needle'`, `'maple'`, `'ginkgo_fan'`, `'heart'`, `'oval'` |
| `windStrength` | `Number` | `1.0` | Sức gió ảnh hưởng lên cành lá |
| `colorTheme` | `String` | `'cyberpunk'` | Chủ đề màu sắc: `'cyberpunk'`, `'sakura'`, `'autumn'`, `'emerald'` |
| `seed` | `Number` | Ngẫu nhiên | Hạt giống ngẫu nhiên tạo hình dáng cố định cho cây |

### 🛠 Phương thức (Methods)

- **`tree.update(dt)`**: Cập nhật tiến trình phát triển của cây theo thời gian thực (tính bằng giây).
- **`tree.draw(p5Instance, options)`**: Vẽ cây lên canvas. `options.time` truyền thời gian để tạo hiệu ứng gió đung đưa.
- **`tree.isSubtreeFinished()`**: Trả về `true` nếu cây đã hoàn thành quá trình tăng trưởng.
- **`tree.getTreeGrowthProgress()`**: Trả về `{ current, target }` để tính % tiến độ phát triển.
- **`tree.rebuild()`**: Trồng lại/Khởi tạo lại cây từ đầu với `seed` hiện tại.
- **`tree.setParams(newParams)`**: Cập nhật danh sách thông số mới cho cây.

### 💡 Ví dụ mã nguồn (`sketch.js`)

```javascript
let myTree;

function setup() {
  createCanvas(800, 600);

  // Khởi tạo cây đa phân với các tham số mong muốn
  myTree = new FractalBranchTree({
    initLength: 220,
    branchAngle: 22,
    lengthDecay: 0.75,
    initThickness: 32,
    maxDepth: 9,
    treeVariation: 0.8,
    leafType: 'sakura',
    treeType: 'hybrid',
    colorTheme: 'sakura',
    seed: 42
  });
}

function draw() {
  background(15, 12, 15);

  // 1. Cập nhật giả lập tăng trưởng (delta time tính bằng giây)
  let dt = min(deltaTime / 1000, 0.1);
  myTree.update(dt);

  // 2. Định vị gốc cây ở giữa phía dưới màn hình
  translate(width / 2, height);

  // 3. Gọi hàm vẽ cây
  myTree.draw();
}
```

---

## 🌿 2. Thư viện `BarnsleyFernTree`

Thư viện chuyên dụng để tạo hình cây Dương Xỉ dạng lá bụi theo công thức hình học lượng giác Barnsley.

### ⚙️ Bảng tham số khởi tạo (Constructor Parameters)

```javascript
const fern = new BarnsleyFernTree(options);
```

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `initLength` | `Number` | `640` | Chiều dài lá chính từ gốc (px) |
| `initThickness` | `Number` | `4` | Độ dày gốc lá chính (px) |
| `maxDepth` | `Number` | `3` | Cấp đệ quy lá (0 - 4) |
| `fernFrondCount` | `Number` | `5` | Số lượng lá chính mọc từ gốc |
| `fernSpreadAngle` | `Number` | `45` | Góc xòe rộng của bụi lá (Độ) |
| `fernLeafletLength` | `Number` | `75` | Chiều dài tương đối của lá con (% so với lá chính) |
| `fernLeafletWidth` | `Number` | `100` | Chiều rộng tương đối của lá con (%) |
| `fernTaperProfile` | `Number` | `1.2` | Chỉ số độ nhọn tán lá (0.5 - 3.0) |
| `fernBranchPoints` | `Number` | `8` | Số cặp lá con mọc từ thân chính |
| `fernAlternateRate` | `Number` | `0` | Tỉ lệ mọc so le giữa hai hàng lá con (0% - 100%) |
| `treeVariation` | `Number` | `0.15` | Độ biến dị góc lệch và độ dài lá con |
| `windStrength` | `Number` | `1.0` | Sức gió lắc lư bụi lá |
| `colorTheme` | `String` | `'emerald'` | Chủ đề màu sắc (`'emerald'`, `'cyberpunk'`, `'sakura'`, `'autumn'`) |
| `seed` | `Number` | Ngẫu nhiên | Hạt giống tạo dáng ngẫu nhiên |

### 🛠 Phương thức (Methods)

- **`fern.update(dt)`**: Cập nhật tiến trình mọc các nhánh lá theo thời gian.
- **`fern.draw(p5Instance, options)`**: Vẽ bụi dương xỉ lên canvas.
- **`fern.isSubtreeFinished()`**: Trả về `true` khi tất cả các tán lá đã hoàn tất mọc.
- **`fern.getTreeGrowthProgress()`**: Trả về `{ current, target }` tính % tiến độ mọc lá.
- **`fern.rebuild()`**: Tái tạo lại bụi dương xỉ.
- **`fern.setParams(newParams)`**: Cập nhật thông số mới.

### 💡 Ví dụ mã nguồn (`sketch.js`)

```javascript
let myFern;

function setup() {
  createCanvas(800, 600);

  // Khởi tạo cây dương xỉ với tham số mong muốn
  myFern = new BarnsleyFernTree({
    initLength: 600,
    maxDepth: 3,
    fernFrondCount: 6,
    fernSpreadAngle: 50,
    fernLeafletLength: 80,
    fernLeafletWidth: 110,
    fernBranchPoints: 9,
    colorTheme: 'emerald',
    seed: 100
  });
}

function draw() {
  background(5, 12, 8);

  let dt = min(deltaTime / 1000, 0.1);
  myFern.update(dt);

  translate(width / 2, height);
  myFern.draw();
}
```

---

## 🎨 Chủ đề Màu sắc (Color Themes)

Cả hai bộ thư viện đều hỗ trợ 4 tông màu chính:
- **`'cyberpunk'`**: Thân tím sẫm, tán lá/nhánh hồng neon và xanh cyan.
- **`'sakura'`**: Tông màu hoa anh đào với thân nâu trầm và hoa/lá hồng phấn.
- **`'autumn'`**: Tông màu mùa thu với tán lá màu phong đỏ, vàng hổ phách và cam thẫm.
- **`'emerald'`**: Tông màu rừng nguyên sinh với xanh ngọc lục bảo và lục thẫm.

---

## 📜 Giấy phép (License)

Dự án phát triển theo thư viện nguồn mở **MIT License**. Bạn có thể tùy biến và tích hợp vào bất kỳ dự án đồ họa / game / visualizer p5.js nào!
