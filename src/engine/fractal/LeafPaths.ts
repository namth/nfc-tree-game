/**
 * 11 Authentic Leaf Shapes Path Generator with Organic Petiole Stems
 * Project: Fractal Tree NFC Mobile Game
 * Source: source-reference/lib/fractal-branch-tree.js
 */

import { LeafType } from '../../types';

export interface LeafGeometry {
  id: LeafType;
  name: string;
  renderToCanvas?: (ctx: any, color: string) => void;
  generateSvgPath: (color: string) => { bladePath: string; stemPath: string };
}

const deg2rad = (d: number) => (d * Math.PI) / 180;

/**
 * Tạo đường dẫn SVG cho cuống lá hữu cơ
 */
export function buildPetioleStemPath(stemLen: number = 24, curveX: number = 3): string {
  const startX = curveX * 0.4;
  const ctrlX = curveX;
  const ctrlY = stemLen * 0.45;
  return `M ${startX.toFixed(2)} ${stemLen.toFixed(2)} Q ${ctrlX.toFixed(2)} ${ctrlY.toFixed(2)} 0 0`;
}

/**
 * 1. Pointed Lobe Path (Lá Cổ Thụ Đỉnh Nhọn)
 */
export function buildPointedLobePath(w: number = 32, h: number = 64): string {
  const cp1L = `-${(w * 0.7).toFixed(1)} -${(h * 0.3).toFixed(1)}`;
  const cp2L = `-${(w * 0.6).toFixed(1)} -${(h * 0.8).toFixed(1)}`;
  const tip = `0 -${(h * 1.1).toFixed(1)}`;
  const cp1R = `${(w * 0.6).toFixed(1)} -${(h * 0.8).toFixed(1)}`;
  const cp2R = `${(w * 0.7).toFixed(1)} -${(h * 0.3).toFixed(1)}`;
  return `M 0 0 C ${cp1L}, ${cp2L}, ${tip} C ${cp1R}, ${cp2R}, 0 0 Z`;
}

/**
 * 2. Rhombus Lobe Path (Lá Hình Thoi)
 */
export function buildRhombusLobePath(w: number = 32, h: number = 64): string {
  const left = `-${(w * 0.5).toFixed(1)} -${(h * 0.55).toFixed(1)}`;
  const tip = `0 -${(h * 1.15).toFixed(1)}`;
  const right = `${(w * 0.5).toFixed(1)} -${(h * 0.55).toFixed(1)}`;
  return `M 0 0 L ${left} L ${tip} L ${right} Z`;
}

/**
 * 3. Heart Leaf Path (Lá Trái Tim)
 */
export function buildHeartPath(w: number = 32, h: number = 56): string {
  return (
    `M 0 0 ` +
    `C -${(w * 1.1).toFixed(1)} -${(h * 0.35).toFixed(1)}, -${(w * 1.1).toFixed(1)} -${(h * 1.1).toFixed(1)}, -${(w * 0.5).toFixed(1)} -${(h * 1.15).toFixed(1)} ` +
    `C -${(w * 0.25).toFixed(1)} -${(h * 1.18).toFixed(1)}, -${(w * 0.08).toFixed(1)} -${(h * 0.92).toFixed(1)}, 0 -${(h * 0.82).toFixed(1)} ` +
    `C ${(w * 0.08).toFixed(1)} -${(h * 0.92).toFixed(1)}, ${(w * 0.25).toFixed(1)} -${(h * 1.18).toFixed(1)}, ${(w * 0.5).toFixed(1)} -${(h * 1.15).toFixed(1)} ` +
    `C ${(w * 1.1).toFixed(1)} -${(h * 1.1).toFixed(1)}, ${(w * 1.1).toFixed(1)} -${(h * 0.35).toFixed(1)}, 0 0 Z`
  );
}

/**
 * 4. Sakura Leaf Path (Cánh / Lá Hoa Anh Đào Khía Chữ V)
 */
export function buildSakuraLeafPath(w: number = 37, h: number = 68): string {
  return (
    `M 0 0 ` +
    `C -${(w * 0.95).toFixed(1)} -${(h * 0.35).toFixed(1)}, -${(w * 0.85).toFixed(1)} -${(h * 0.85).toFixed(1)}, -${(w * 0.42).toFixed(1)} -${(h * 1.15).toFixed(1)} ` +
    `L 0 -${(h * 0.82).toFixed(1)} ` +
    `L ${(w * 0.42).toFixed(1)} -${(h * 1.15).toFixed(1)} ` +
    `C ${(w * 0.85).toFixed(1)} -${(h * 0.85).toFixed(1)}, ${(w * 0.95).toFixed(1)} -${(h * 0.35).toFixed(1)}, 0 0 Z`
  );
}

/**
 * 5. Bodhi Leaf Path (Lá Bồ Đề Vai Tim & Đỉnh Nhỏ Giọt)
 */
export function buildBodhiPath(w: number = 34, h: number = 60): string {
  return (
    `M 0 0 ` +
    `C -${(w * 0.6).toFixed(1)} -${(h * 0.05).toFixed(1)}, -${(w * 1.15).toFixed(1)} -${(h * 0.35).toFixed(1)}, -${(w * 0.95).toFixed(1)} -${(h * 0.65).toFixed(1)} ` +
    `C -${(w * 0.75).toFixed(1)} -${(h * 0.85).toFixed(1)}, -${(w * 0.22).toFixed(1)} -${(h * 0.95).toFixed(1)}, 0 -${(h * 1.18).toFixed(1)} ` +
    `C ${(w * 0.22).toFixed(1)} -${(h * 1.18).toFixed(1)}, ${(w * 0.75).toFixed(1)} -${(h * 0.85).toFixed(1)}, ${(w * 0.95).toFixed(1)} -${(h * 0.65).toFixed(1)} ` +
    `C ${(w * 1.15).toFixed(1)} -${(h * 0.35).toFixed(1)}, ${(w * 0.6).toFixed(1)} -${(h * 0.05).toFixed(1)}, 0 0 Z`
  );
}

/**
 * 6. Eucalyptus Long Path (Lá Bạch Đàn Dài Falcate)
 */
export function buildEucalyptusLongPath(leafLen: number = 76): string {
  const theta = deg2rad(105);
  const Wmax = 0.085;
  const NUM_POINTS = 24;

  const leftPts: Array<{ x: number; y: number }> = [];
  const rightPts: Array<{ x: number; y: number }> = [];

  for (let j = 0; j <= NUM_POINTS; j++) {
    const s = j / NUM_POINTS;
    const angle = theta * s;
    const xSpine = ((1 - Math.cos(theta * s)) / theta) * leafLen;
    const ySpine = (-Math.sin(theta * s) / theta) * leafLen;

    const w = Wmax * Math.sin(Math.PI * Math.pow(s, 0.72)) * (1.0 - 0.22 * s) * leafLen;
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);

    leftPts.push({ x: xSpine - w * nx, y: ySpine - w * ny });
    rightPts.push({ x: xSpine + w * nx, y: ySpine + w * ny });
  }

  let d = `M 0 0`;
  for (const pt of leftPts) {
    d += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }
  for (let j = rightPts.length - 1; j >= 0; j--) {
    d += ` L ${rightPts[j].x.toFixed(1)} ${rightPts[j].y.toFixed(1)}`;
  }
  d += ` Z`;
  return d;
}

/**
 * 7. Oval Leaf Path (Lá Bầu Dục)
 */
export function buildOvalPath(w: number = 40, h: number = 66): string {
  const rx = (w * 0.5).toFixed(1);
  const ry = (h * 0.5).toFixed(1);
  const cy = (-h * 0.5).toFixed(1);
  return `M 0 ${(-h).toFixed(1)} A ${rx} ${ry} 0 1 0 0 0 A ${rx} ${ry} 0 1 0 0 ${(-h).toFixed(1)} Z`;
}

/**
 * 8. Round Leaf Path (Lá Tròn Đồng Xu / Khuynh Diệp)
 */
export function buildRoundPath(r: number = 24): string {
  const p1 = (-r * 1.35).toFixed(1);
  const p2 = (-r * 0.25).toFixed(1);
  const p3 = (-r * 1.75).toFixed(1);
  const tip = (-r * 2.0).toFixed(1);
  const p4 = (r * 1.35).toFixed(1);
  return `M 0 0 C ${p1} ${p2}, ${p1} ${p3}, 0 ${tip} C ${p4} ${p3}, ${p4} ${p2}, 0 0 Z`;
}

/**
 * 9. Pine Needle Fan Path (Lá Thông 7 Kim Xòe Quạt)
 */
export function buildNeedlePath(w: number = 24, h: number = 50): string {
  const k1x = (-w * 0.89).toFixed(1), k1y = (-h * 0.16).toFixed(1);
  const k2x = (-w * 1.18).toFixed(1), k2y = (-h * 0.55).toFixed(1);
  const k3x = (-w * 0.81).toFixed(1), k3y = (-h * 1.00).toFixed(1);
  const k4x = '0', k4y = (-h * 1.35).toFixed(1);
  const k5x = (w * 0.81).toFixed(1), k5y = (-h * 1.00).toFixed(1);
  const k6x = (w * 1.18).toFixed(1), k6y = (-h * 0.55).toFixed(1);
  const k7x = (w * 0.89).toFixed(1), k7y = (-h * 0.16).toFixed(1);
  return (
    `M 0 0 L ${k1x} ${k1y} ` +
    `M 0 0 L ${k2x} ${k2y} ` +
    `M 0 0 L ${k3x} ${k3y} ` +
    `M 0 0 L ${k4x} ${k4y} ` +
    `M 0 0 L ${k5x} ${k5y} ` +
    `M 0 0 L ${k6x} ${k6y} ` +
    `M 0 0 L ${k7x} ${k7y}`
  );
}

/**
 * 10. Willow Weeping Leaf Path (Lá Liễu Rủ Uốn Lượn)
 */
export function buildWillowPath(w: number = 16, h: number = 68): string {
  const cp1L = `-${(w * 0.8).toFixed(1)} -${(h * 0.25).toFixed(1)}`;
  const cp2L = `-${(w * 0.5).toFixed(1)} -${(h * 0.75).toFixed(1)}`;
  const tip = `0 -${(h * 1.1).toFixed(1)}`;
  const cp1R = `${(w * 0.3).toFixed(1)} -${(h * 0.75).toFixed(1)}`;
  const cp2R = `${(w * 0.6).toFixed(1)} -${(h * 0.25).toFixed(1)}`;
  return `M 0 0 C ${cp1L}, ${cp2L}, ${tip} C ${cp1R}, ${cp2R}, 0 0 Z`;
}

/**
 * Danh mục 14 dạng lá chuẩn xác kèm cuống lá hữu cơ
 */
export const LEAF_SHAPES_CONFIG: Record<LeafType, { name: string; petioleLen: number }> = {
  [LeafType.POINTED]: { name: 'Lá Đỉnh Nhọn', petioleLen: 22 },
  [LeafType.MAPLE]: { name: 'Lá Phong 7 Thùy', petioleLen: 32 },
  [LeafType.MAPLE5]: { name: 'Lá Phong Thoi', petioleLen: 32 },
  [LeafType.GINKGO_FAN]: { name: 'Lá Ngân Hạnh', petioleLen: 36 },
  [LeafType.HEART]: { name: 'Lá Trái Tim', petioleLen: 24 },
  [LeafType.SINGLE_NEEDLE]: { name: 'Lá Me Kép', petioleLen: 22 },
  [LeafType.TUNG_LAHAN]: { name: 'Lá Tùng La Hán', petioleLen: 22 },
  [LeafType.SAKURA_LEAF]: { name: 'Lá Hoa Anh Đào', petioleLen: 22 },
  [LeafType.EUCALYPTUS_LONG]: { name: 'Lá Bạch Đàn Dài', petioleLen: 22 },
  [LeafType.OVAL]: { name: 'Lá Oval Bầu Dục', petioleLen: 22 },
  [LeafType.BODHI]: { name: 'Lá Bồ Đề', petioleLen: 28 },
  [LeafType.ROUND]: { name: 'Khuynh Diệp Tròn', petioleLen: 22 },
  [LeafType.NEEDLE]: { name: 'Lá Thông 7 Kim', petioleLen: 20 },
  [LeafType.WILLOW]: { name: 'Lá Liễu Rủ', petioleLen: 26 }
};
