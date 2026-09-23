/**
 * Fractal Tree Geometry Generator (Branching, Roots, Flare, Growth Interpolation)
 * Project: Fractal Tree NFC Mobile Game
 * Source: source-reference/lib/fractal-branch-tree.js
 */

import { PRNG } from './PRNG';
import { TreeGenetics, LeafType } from '../../types';
import { getLeafConfig } from './LeafConfigs';

export interface SideLeafPoint {
  id: number;
  ratio: number;         // Vị trí dọc theo cành (0.12 -> 0.90)
  x: number;             // Tọa độ gốc cuống lá x
  y: number;             // Tọa độ gốc cuống lá y
  side: number;          // Hướng mọc (-1: trái, 1: phải)
  angle: number;         // Góc nghiêng tuyệt đối của cuống lá (radians)
  lenMultiplier: number; // Tỉ lệ độ dài cuống lá (petiole)
  isEarlyLeaf: boolean;  // Cờ lá non mọc sớm
  rotationRad: number;   // 0..2*PI góc xoay ngẫu nhiên của phiến lá
}

export interface BranchSegment {
  id: number;
  depth: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  thickness: number;
  angle: number;
  isTerminal: boolean;
  leafAngleRad: number; // 0..2*PI random rotation cho lá ngọn
  sideLeaves: SideLeafPoint[]; // Danh sách lá phụ mọc dọc thân cành
}

export interface RootBranch {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ctrlX: number;
  ctrlY: number;
  thickness: number;
}

export interface RootFlareData {
  baseWidth: number;
  topWidth: number;
  height: number;
  leftCtrlX: number;
  rightCtrlX: number;
}

export interface TreeGeometryOutput {
  branches: BranchSegment[];
  roots: RootBranch[];
  flare: RootFlareData;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

export class FractalGenerator {
  /**
   * Sinh cấu trúc cây hoàn chỉnh xác định từ bộ gen (DNA Seed)
   * @param genetics Bộ gen cây (góc cành, độ dài, độ dày, seed...)
   * @param initLength Chiều dài thân cây ban đầu (mặc định 180px)
   * @param progress Tiến trình lớn từ 0.0 đến 1.0
   */
  static generate(
    genetics: TreeGenetics,
    initLength: number = 180,
    progress: number = 1.0
  ): TreeGeometryOutput {
    const prng = new PRNG(genetics.dnaSeed);
    const branches: BranchSegment[] = [];
    const roots: RootBranch[] = [];

    const effectiveProgress = Math.max(0.01, Math.min(1.0, progress));
    const trunkLen = initLength * Math.min(1.0, effectiveProgress * 1.5);
    const maxDepth = Math.max(6, Math.min(11, genetics.maxDepth || 9));

    // Thân chính (Trunk)
    const baseThickness = Math.max(18, trunkLen * 0.16);
    let branchCounter = 0;

    const bounds = {
      minX: -baseThickness,
      maxX: baseThickness,
      minY: -trunkLen,
      maxY: 20
    };

    function updateBounds(x: number, y: number) {
      if (x < bounds.minX) bounds.minX = x;
      if (x > bounds.maxX) bounds.maxX = x;
      if (y < bounds.minY) bounds.minY = y;
      if (y > bounds.maxY) bounds.maxY = y;
    }

    // 1. Sinh nhánh cây đệ quy
    function branch(
      x: number,
      y: number,
      len: number,
      angleRad: number,
      thickness: number,
      depth: number
    ) {
      const isTerminal = depth >= maxDepth || len < 12;
      const x2 = x + Math.sin(angleRad) * len;
      const y2 = y - Math.cos(angleRad) * len;

      updateBounds(x, y);
      updateBounds(x2, y2);

      // Random 360-degree rotation cho lá tại đầu cành
      const leafAngleRad = prng.range(0, Math.PI * 2);
      const branchId = ++branchCounter;

      // 2. Tính toán lá phụ dọc theo thân cành theo tiêu chuẩn Lref = 36px và cấu hình riêng của từng loài
      const sideLeaves: SideLeafPoint[] = [];
      const leafCfg = getLeafConfig(genetics.leafType);

      if (depth >= leafCfg.sideLeafStartLevel && !isTerminal && leafCfg.sideLeafRange[1] > 0) {
        const minCount = leafCfg.sideLeafRange[0];
        const maxCount = leafCfg.sideLeafRange[1];
        const Lref = 36.0; // Tiêu chuẩn độ dài trung bình cành cấp 7 (sum suê & dầy lá)

        const sideLeafHash = prng.range(0, 1);
        const baseCount = minCount + sideLeafHash * (maxCount - minCount);
        const scaledCount = baseCount * (len / Lref);
        const intCount = Math.floor(scaledCount);
        const frac = scaledCount - intCount;
        const roundHash = prng.range(0, 1);
        let count = roundHash < frac ? intCount + 1 : intCount;

        const maxDense = Math.max(1, Math.floor(len / 3.8));
        count = Math.max(1, Math.min(count, maxDense));

        const baseAngle = leafCfg.sideLeafAngle ?? 20;
        const petioleMin = leafCfg.petioleRange[0];
        const petioleMax = leafCfg.petioleRange[1];

        for (let k = 0; k < count; k++) {
          const ratio = 0.12 + prng.range(0, 1) * 0.78;
          const side = prng.range(0, 1) < 0.5 ? -1 : 1;
          const angleOffset = (prng.range(0, 1) - 0.5) * 2 * 20; // ±20°
          const localAngle = side * ((Math.max(15, baseAngle + 18 + angleOffset) * Math.PI) / 180);
          const leafWorldAngle = angleRad + localAngle;
          const lenMultiplier = petioleMin + prng.range(0, 1) * (petioleMax - petioleMin);
          const isEarlyLeaf = prng.range(0, 1) < 0.35;
          const rotationRad = prng.range(0, Math.PI * 2);

          const px = x + Math.sin(angleRad) * (len * ratio);
          const py = y - Math.cos(angleRad) * (len * ratio);

          sideLeaves.push({
            id: branchId * 100 + k,
            ratio,
            x: px,
            y: py,
            side,
            angle: leafWorldAngle,
            lenMultiplier,
            isEarlyLeaf,
            rotationRad
          });
        }
      }

      branches.push({
        id: branchId,
        depth,
        x1: x,
        y1: y,
        x2,
        y2,
        length: len,
        thickness,
        angle: angleRad,
        isTerminal,
        leafAngleRad,
        sideLeaves
      });

      if (isTerminal) return;

      // Độ sâu đệ quy phụ thuộc vào tiến trình lớn
      const depthProgressThreshold = depth / maxDepth;
      if (effectiveProgress < depthProgressThreshold * 0.8) return;

      const subLength = len * genetics.lengthDecay * prng.range(0.88, 1.08);
      const subThickness = thickness * genetics.thicknessDecay;
      const baseSpreadRad = (genetics.branchAngle * Math.PI) / 180;

      // Phân nhánh 2-3 cành con
      const branchCount = prng.range(0, 1) < 0.25 ? 3 : 2;

      if (branchCount === 2) {
        const angleL = angleRad - baseSpreadRad * prng.range(0.85, 1.15);
        const angleR = angleRad + baseSpreadRad * prng.range(0.85, 1.15);
        branch(x2, y2, subLength, angleL, subThickness, depth + 1);
        branch(x2, y2, subLength, angleR, subThickness, depth + 1);
      } else {
        const angleL = angleRad - baseSpreadRad * prng.range(0.9, 1.2);
        const angleM = angleRad + prng.range(-0.1, 0.1);
        const angleR = angleRad + baseSpreadRad * prng.range(0.9, 1.2);
        branch(x2, y2, subLength, angleL, subThickness, depth + 1);
        branch(x2, y2, subLength * 0.95, angleM, subThickness * 0.9, depth + 1);
        branch(x2, y2, subLength, angleR, subThickness, depth + 1);
      }
    }

    // Bắt đầu từ gốc thân chính (0, 0)
    branch(0, 0, trunkLen, 0, baseThickness, 0);

    // 2. Bạnh gốc (Root Flare) mềm mại
    const flareHeight = Math.min(36, trunkLen * 0.22);
    const flareBaseWidth = baseThickness * 1.8;
    const flare: RootFlareData = {
      baseWidth: flareBaseWidth,
      topWidth: baseThickness,
      height: flareHeight,
      leftCtrlX: -flareBaseWidth * 0.7,
      rightCtrlX: flareBaseWidth * 0.7
    };

    // 3. Hệ thống rễ trồi hữu cơ (Surface Roots: 3-5 rễ gân guốc)
    const rootCount = Math.floor(prng.range(3, 5.9));
    for (let i = 0; i < rootCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const rootLen = prng.range(28, 56);
      const startX = side * baseThickness * prng.range(0.3, 0.6);
      const startY = prng.range(-4, 4);
      const endX = startX + side * rootLen;
      const endY = startY + prng.range(12, 26);
      const ctrlX = (startX + endX) * 0.5 + side * prng.range(6, 14);
      const ctrlY = (startY + endY) * 0.5 + prng.range(4, 10);
      const rootThick = Math.max(1.8, baseThickness * prng.range(0.12, 0.22));

      updateBounds(endX, endY);

      roots.push({
        id: i + 1,
        x1: startX,
        y1: startY,
        x2: endX,
        y2: endY,
        ctrlX,
        ctrlY,
        thickness: rootThick
      });
    }

    return {
      branches,
      roots,
      flare,
      bounds: {
        minX: bounds.minX,
        maxX: bounds.maxX,
        minY: bounds.minY,
        maxY: bounds.maxY,
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY
      }
    };
  }
}
