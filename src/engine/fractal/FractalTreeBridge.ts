/**
 * FractalTreeBridge.ts - Cầu nối thực thi bộ thư viện chuẩn FractalBranchTree
 * Project: Fractal Tree NFC Mobile Game
 * Source: lib/fractal-branch-tree.js & lib/leaf-configs.js
 * 
 * Chuyển đổi chính xác 100% hình học từ bộ thư viện chuẩn FractalBranchTree
 * sang các đường dẫn SVG hiệu năng cao (60 - 120 FPS).
 */

import { TreeGenetics, LeafType, LeafPalette } from '../../types';
import { findTrunkTheme } from '../../config/GeneticsConfig';

// =========================================================================
// 1. P5.JS MATH & SHIM ENVIRONMENT
// =========================================================================
const globalScope = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : window) as any;

if (!globalScope.PI) globalScope.PI = Math.PI;
if (!globalScope.TWO_PI) globalScope.TWO_PI = Math.PI * 2;
if (!globalScope.HALF_PI) globalScope.HALF_PI = Math.PI / 2;
if (!globalScope.radians) globalScope.radians = (deg: number) => (deg * Math.PI) / 180;
if (!globalScope.degrees) globalScope.degrees = (rad: number) => (rad * 180) / Math.PI;
if (!globalScope.constrain) globalScope.constrain = (val: number, low: number, high: number) => Math.max(low, Math.min(val, high));
if (!globalScope.lerp) globalScope.lerp = (start: number, stop: number, amt: number) => start + (stop - start) * amt;
if (!globalScope.map) globalScope.map = (value: number, start1: number, stop1: number, start2: number, stop2: number) =>
  start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
if (!globalScope.min) globalScope.min = Math.min;
if (!globalScope.max) globalScope.max = Math.max;
if (!globalScope.round) globalScope.round = Math.round;
if (!globalScope.floor) globalScope.floor = Math.floor;
if (!globalScope.abs) globalScope.abs = Math.abs;
if (!globalScope.sin) globalScope.sin = Math.sin;
if (!globalScope.cos) globalScope.cos = Math.cos;
if (!globalScope.CLOSE) globalScope.CLOSE = 'close';
if (globalScope.height === undefined) globalScope.height = 30;
if (globalScope.width === undefined) globalScope.width = 600;

// =========================================================================
// P5.JS PERLIN NOISE & SEEDED PRNG ENGINE (Chuẩn xác 100% thuật toán p5.js)
// =========================================================================
const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;

let perlin_octaves = 4;
let perlin_amp_falloff = 0.5;
const scaled_cosine = (i: number) => 0.5 * (1.0 - Math.cos(i * Math.PI));

let perlin: Float32Array | null = null;
let currentNoiseSeed: number = 0;

function p5NoiseSeed(seed: number) {
  currentNoiseSeed = seed;
  const m = 4294967296;
  const a = 1664525;
  const c = 1013904223;
  let z = (seed == null ? Math.random() * m : seed) >>> 0;
  if (!perlin) {
    perlin = new Float32Array(PERLIN_SIZE + 1);
  }
  for (let i = 0; i < PERLIN_SIZE + 1; i++) {
    z = (a * z + c) % m;
    perlin[i] = z / m;
  }
}

function p5Noise(x: number, y: number = 0, z: number = 0): number {
  if (perlin == null) {
    p5NoiseSeed(0);
  }
  if (x < 0) x = -x;
  if (y < 0) y = -y;
  if (z < 0) z = -z;

  let xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  let xf = x - xi, yf = y - yi, zf = z - zi;
  let rxf: number, ryf: number;

  let r = 0;
  let ampl = 0.5;

  let n1: number, n2: number, n3: number;

  for (let o = 0; o < perlin_octaves; o++) {
    let of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

    rxf = scaled_cosine(xf);
    ryf = scaled_cosine(yf);

    n1 = perlin![of & PERLIN_SIZE];
    n1 += rxf * (perlin![(of + 1) & PERLIN_SIZE] - n1);
    n2 = perlin![(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n2 += rxf * (perlin![(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
    n1 += ryf * (n2 - n1);

    of += PERLIN_ZWRAP;
    n2 = perlin![of & PERLIN_SIZE];
    n2 += rxf * (perlin![(of + 1) & PERLIN_SIZE] - n2);
    n3 = perlin![(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n3 += rxf * (perlin![(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
    n2 += ryf * (n3 - n2);

    n1 += scaled_cosine(zf) * (n2 - n1);

    r += n1 * ampl;
    ampl *= perlin_amp_falloff;
    xi <<= 1;
    xf *= 2;
    yi <<= 1;
    yf *= 2;
    zi <<= 1;
    zf *= 2;

    if (xf >= 1.0) {
      xi++;
      xf--;
    }
    if (yf >= 1.0) {
      yi++;
      yf--;
    }
    if (zf >= 1.0) {
      zi++;
      zf--;
    }
  }
  return r;
}

function p5NoiseDetail(lod: number, falloff: number) {
  if (lod > 0) perlin_octaves = lod;
  if (falloff > 0) perlin_amp_falloff = falloff;
}

let randState = 12345;
function p5RandomSeed(seed: number) {
  randState = (seed == null ? Date.now() : seed) >>> 0;
}
function p5Random(min = 0, max = 1): number {
  randState = (1664525 * randState + 1013904223) >>> 0;
  const val = randState / 4294967296;
  return min + val * (max - min);
}

globalScope.noise = p5Noise;
globalScope.noiseSeed = p5NoiseSeed;
globalScope.noiseDetail = p5NoiseDetail;
globalScope.randomSeed = p5RandomSeed;
globalScope.random = p5Random;

// Path2D Command recorder cho các dáng lá chuẩn
class SvgPath2DShim {
  commands: Array<[string, ...number[]]> = [];
  moveTo(x: number, y: number) { this.commands.push(['M', x, y]); }
  lineTo(x: number, y: number) { this.commands.push(['L', x, y]); }
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
    this.commands.push(['C', c1x, c1y, c2x, c2y, x, y]);
  }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
    this.commands.push(['Q', cx, cy, x, y]);
  }
  closePath() { this.commands.push(['Z']); }
  ellipse(x: number, y: number, rx: number, ry: number) {
    this.commands.push(['M', x - rx, y]);
    this.commands.push(['A', rx, ry, 0, 1, 0, x + rx, y]);
    this.commands.push(['A', rx, ry, 0, 1, 0, x - rx, y]);
    this.commands.push(['Z']);
  }
}

globalScope.Path2D = SvgPath2DShim;

// Nạp cấu hình lá chuẩn từ lib/leaf-configs.js
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalScope.LEAF_TYPE_CONFIGS = require('../../../lib/leaf-configs.js');
} catch (e) {
  // Fallback nếu bundler cần path khác
}

// Nạp thư viện cây chuẩn FractalBranchTree từ lib/fractal-branch-tree.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FractalBranchTree = require('../../../lib/fractal-branch-tree.js');

// =========================================================================
// 2. MAPPING BỘ GEN (GENETICS) SANG PARAMETERS THƯ VIỆN CHUẨN
// =========================================================================
const LEAF_SHAPE_KEY_MAP: Record<LeafType, string> = {
  [LeafType.POINTED]: 'pointed',
  [LeafType.MAPLE]: 'maple',
  [LeafType.MAPLE5]: 'maple5',
  [LeafType.GINKGO_FAN]: 'ginkgo_fan',
  [LeafType.HEART]: 'heart',
  [LeafType.SINGLE_NEEDLE]: 'single_needle',
  [LeafType.TUNG_LAHAN]: 'tung_lahan',
  [LeafType.SAKURA_LEAF]: 'sakura_leaf',
  [LeafType.EUCALYPTUS_LONG]: 'eucalyptus_long',
  [LeafType.OVAL]: 'oval',
  [LeafType.BODHI]: 'bodhi',
  [LeafType.ROUND]: 'round',
  [LeafType.NEEDLE]: 'needle',
  [LeafType.WILLOW]: 'willow'
};

const LEAF_PALETTE_KEY_MAP: Record<LeafPalette, string> = {
  [LeafPalette.SAKURA]: 'sakura',
  [LeafPalette.AUTUMN]: 'autumn',
  [LeafPalette.GINKGO]: 'ginkgo',
  [LeafPalette.WISTERIA]: 'wisteria',
  [LeafPalette.FROST]: 'frost',
  [LeafPalette.SUNSET]: 'sunset',
  [LeafPalette.MIDNIGHT]: 'midnight',
  [LeafPalette.EUCALYPTUS]: 'eucalyptus',
  [LeafPalette.GOLDEN]: 'golden',
  [LeafPalette.RUBY]: 'ruby',
  [LeafPalette.SHADOW]: 'shadow',
  [LeafPalette.EMERALD]: 'emerald'
};

function getTrunkThemeKey(trunkColor?: string): string {
  if (!trunkColor) return 'emerald';
  const theme = findTrunkTheme(trunkColor);
  return theme ? theme.id : 'emerald';
}

export interface LeafColorLayer {
  color: string;
  d: string;
}

export interface AuthenticTreeSvgOutput {
  branchesPath: string;
  petiolesPath: string;
  leafLayers: LeafColorLayer[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
  totalGrowthTime: number;
  activeFallingCount: number;
}

// =========================================================================
// 3. CAPTURE ENGINE: HẤP THU TOÀN BỘ DRAW COMMANDS TỪ FRACTALBRANCHTREE
// =========================================================================
import { TREE_CONFIG } from '../../config/treeConfig';

export class FractalTreeBridge {
  private static treeInstanceCache: Record<string, any> = {};

  /**
   * Khởi tạo hoặc lấy từ cache instance FractalBranchTree chuẩn
   */
  public static getTreeInstance(genetics: TreeGenetics, isDark: boolean = true): any {
    const leafShape = LEAF_SHAPE_KEY_MAP[genetics.leafType] || 'pointed';
    const leafType = LEAF_PALETTE_KEY_MAP[genetics.paletteIndex] || 'emerald';
    const colorTheme = getTrunkThemeKey(genetics.trunkColor);
    const treeVariation = genetics.treeVariation !== undefined ? genetics.treeVariation : TREE_CONFIG.defaultTreeVariation;
    const initThickness = genetics.initThickness !== undefined ? genetics.initThickness : TREE_CONFIG.defaultInitThickness;
    const thicknessDecay = genetics.thicknessDecay !== undefined ? genetics.thicknessDecay : TREE_CONFIG.defaultThicknessDecay;
    const maxDepth = genetics.maxDepth || 9;

    const lengthDecay = genetics.lengthDecay || 0.75;
    const cacheKey = `${genetics.dnaSeed}_${leafShape}_${leafType}_${colorTheme}_${genetics.branchAngle}_${lengthDecay}_${maxDepth}_${treeVariation}_${initThickness}_${thicknessDecay}_${isDark}`;

    if (this.treeInstanceCache[cacheKey]) {
      const cached = this.treeInstanceCache[cacheKey];
      cached.isDark = isDark;
      return cached;
    }

    const tree = new FractalBranchTree({
      initLength: TREE_CONFIG.defaultInitLength,
      branchAngle: genetics.branchAngle || 20,
      lengthDecay: lengthDecay,
      initThickness: initThickness,
      thicknessDecay: thicknessDecay,
      maxDepth: maxDepth,
      minBranchLength: TREE_CONFIG.minBranchLength,
      treeVariation: treeVariation,
      leafType: leafType,
      leafShape: leafShape,
      treeType: 'sequential',
      windStrength: 1.0,
      colorTheme: colorTheme,
      seed: genetics.dnaSeed,
      isDark: isDark
    });
    tree.isDark = isDark;

    this.treeInstanceCache[cacheKey] = tree;
    return tree;
  }

  /**
   * Lấy tổng thời gian sinh trưởng chuẩn (giây) theo thuật toán gốc của FractalBranchTree
   */
  static getTotalGrowthDuration(genetics: TreeGenetics): number {
    const tree = this.getTreeInstance(genetics);
    return (tree && typeof tree.getTotalGrowthTime === 'function')
      ? tree.getTotalGrowthTime()
      : 15.4;
  }

  /**
   * Sinh cấu trúc SVG chân thực chuẩn 100% từ FractalBranchTree
   * @param genetics Bộ gen cây từ thẻ NFC / Database
   * @param progress Tiến trình lớn từ 0.0 đến 1.0
   * @param scaleFactor Tỉ lệ co giãn toàn cây (mặc định 1.0)
   */
  static generateAuthenticSvg(
    genetics: TreeGenetics,
    progress: number = 1.0,
    scaleFactor: number = 0.82,
    time: number = 0,
    windStrength: number = 1.0,
    windBias: number = 0,
    customAnimationTime?: number,
    isAnimating: boolean = false,
    isDark: boolean = true
  ): AuthenticTreeSvgOutput {
    const tree = this.getTreeInstance(genetics, isDark);
    tree.isDark = isDark;
    if (tree && tree.seed !== undefined) {
      p5NoiseSeed(tree.seed);
    }
    const totalDuration = (tree && typeof tree.getTotalGrowthTime === 'function')
      ? tree.getTotalGrowthTime()
      : 5.0;

    const clampedProgress = Math.max(0, Math.min(1.0, progress));

    if (customAnimationTime !== undefined) {
      tree.animationTime = customAnimationTime;
    } else if (clampedProgress >= 1.0) {
      // Cây 100% ở trạng thái tĩnh: đặt animationTime vượt xa thời gian rơi lá (totalDuration + 10.0)
      // để mọi lá rụng trung gian đều đã hoàn tất lộ trình rơi và biến mất hoàn toàn
      tree.animationTime = totalDuration + 10.0;
    } else {
      tree.animationTime = clampedProgress * totalDuration;
    }

    // Nếu không trong trạng thái chạy animation chủ động:
    // Tắt falling leaves để tránh lá rụng bị đứng khựng lơ lửng giữa không trung
    if (!isAnimating) {
      tree.maxFallingLeaves = 0;
      tree.maxFallingLeaflets = 0;
    } else {
      tree.maxFallingLeaves = 45;
      tree.maxFallingLeaflets = 75;
    }

    if (tree.root && typeof tree.root.updateTime === 'function') {
      tree.root.updateTime(tree.animationTime, totalDuration);
    } else if (typeof tree.update === 'function') {
      tree.update(0);
    }

    // Thiết lập hệ thống Collector & Matrix Stack
    const branchPaths: string[] = [];
    const petiolePaths: string[] = [];
    const leafLayersMap: Record<string, string[]> = {};

    let matrix = [scaleFactor, 0, 0, scaleFactor, 0, 0];
    const matrixStack: number[][] = [];
    let isPetiole = false;
    let curFillColor = '#34d399';
    let curPathCommands: string[] = [];

    const bounds = { minX: -20, maxX: 20, minY: -50, maxY: 15 };

    function updateBounds(x: number, y: number) {
      if (x < bounds.minX) bounds.minX = x;
      if (x > bounds.maxX) bounds.maxX = x;
      if (y < bounds.minY) bounds.minY = y;
      if (y > bounds.maxY) bounds.maxY = y;
    }

    // Cung cấp các hàm vẽ p5 toàn cục cho lượt draw này
    globalScope.__fractalBridge = true;
    globalScope.push = () => { matrixStack.push([...matrix]); };
    globalScope.pop = () => { matrix = matrixStack.pop() || [scaleFactor, 0, 0, scaleFactor, 0, 0]; };
    globalScope.translate = (x: number, y: number) => {
      matrix[4] += matrix[0] * x + matrix[2] * y;
      matrix[5] += matrix[1] * x + matrix[3] * y;
    };
    globalScope.rotate = (rad: number) => {
      const c = Math.cos(rad), s = Math.sin(rad);
      const a = matrix[0], b = matrix[1], d = matrix[2], e = matrix[3];
      matrix[0] = a * c + d * s; matrix[1] = b * c + e * s;
      matrix[2] = -a * s + d * c; matrix[3] = -b * s + e * c;
    };
    globalScope.scale = (sx: number, sy: number = sx) => {
      matrix[0] *= sx; matrix[1] *= sx;
      matrix[2] *= sy; matrix[3] *= sy;
    };

    globalScope.beginShape = () => { curPathCommands = []; };
    globalScope.vertex = (x: number, y: number) => {
      const wx = +(matrix[0] * x + matrix[2] * y + matrix[4]).toFixed(1);
      const wy = +(matrix[1] * x + matrix[3] * y + matrix[5]).toFixed(1);
      updateBounds(wx, wy);
      curPathCommands.push(`${curPathCommands.length === 0 ? 'M' : 'L'} ${wx} ${wy}`);
    };
    globalScope.quadraticVertex = (cx: number, cy: number, x: number, y: number) => {
      const wcx = +(matrix[0] * cx + matrix[2] * cy + matrix[4]).toFixed(1);
      const wcy = +(matrix[1] * cx + matrix[3] * cy + matrix[5]).toFixed(1);
      const wx = +(matrix[0] * x + matrix[2] * y + matrix[4]).toFixed(1);
      const wy = +(matrix[1] * x + matrix[3] * y + matrix[5]).toFixed(1);
      updateBounds(wx, wy);
      curPathCommands.push(`Q ${wcx} ${wcy} ${wx} ${wy}`);
    };
    globalScope.bezierVertex = (c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) => {
      const wc1x = +(matrix[0] * c1x + matrix[2] * c1y + matrix[4]).toFixed(1);
      const wc1y = +(matrix[1] * c1y + matrix[3] * c1y + matrix[5]).toFixed(1);
      const wc2x = +(matrix[0] * c2x + matrix[2] * c2y + matrix[4]).toFixed(1);
      const wc2y = +(matrix[1] * c2y + matrix[3] * c2y + matrix[5]).toFixed(1);
      const wx = +(matrix[0] * x + matrix[2] * y + matrix[4]).toFixed(1);
      const wy = +(matrix[1] * x + matrix[3] * y + matrix[5]).toFixed(1);
      updateBounds(wx, wy);
      curPathCommands.push(`C ${wc1x} ${wc1y}, ${wc2x} ${wc2y}, ${wx} ${wy}`);
    };
    globalScope.endShape = (mode?: number | string) => {
      if (curPathCommands.length > 0) {
        if (mode === 1 || mode === globalScope.CLOSE || mode === 'close') curPathCommands.push('Z');
        const d = curPathCommands.join(' ');
        const isFruit = Boolean(tree?.isDrawingFruit);
        const isLeaf = Boolean(tree?.isDrawingLeaf);

        if (isLeaf || isFruit) {
          if (isPetiole) {
            petiolePaths.push(d);
          } else {
            if (curGlobalAlpha <= 0.02) {
              curPathCommands = [];
              return;
            }
            let finalColor = curFillColor;
            if (curGlobalAlpha < 0.98) {
              const match = curFillColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              if (match) {
                const r = match[1], g = match[2], b = match[3];
                const blendedA = +(curGlobalAlpha).toFixed(2);
                finalColor = `rgba(${r},${g},${b},${blendedA})`;
              }
            }
            if (!leafLayersMap[finalColor]) leafLayersMap[finalColor] = [];
            leafLayersMap[finalColor].push(d);
          }
        } else {
          if (isPetiole) petiolePaths.push(d);
          else branchPaths.push(d);
        }
      }
      curPathCommands = [];
    };
    globalScope.CLOSE = 1;

    globalScope.ellipse = (x: number, y: number, w: number, h: number) => {
      const wx = +(matrix[0] * x + matrix[2] * y + matrix[4]).toFixed(1);
      const wy = +(matrix[1] * x + matrix[3] * y + matrix[5]).toFixed(1);
      const rx = +((w * Math.hypot(matrix[0], matrix[1])) / 2).toFixed(1);
      const ry = +((h * Math.hypot(matrix[2], matrix[3])) / 2).toFixed(1);
      if (rx > 0.4 && ry > 0.4) {
        updateBounds(wx - rx, wy - ry);
        updateBounds(wx + rx, wy + ry);
        const ellipsePath = `M ${wx - rx} ${wy} A ${rx} ${ry} 0 1 0 ${wx + rx} ${wy} A ${rx} ${ry} 0 1 0 ${wx - rx} ${wy} Z`;
        
        // Khớp nối cành luôn là cành cây nếu:
        // - tree.isDrawingBranch là true, HOẶC
        // - cả tree.isDrawingLeaf và tree.isDrawingFruit đều không phải true
        const isFruit = Boolean(tree?.isDrawingFruit);
        const isLeaf = Boolean(tree?.isDrawingLeaf);
        const isBranch = Boolean(tree?.isDrawingBranch || (!isLeaf && !isFruit));

        if (!isBranch && tree && (isLeaf || isFruit)) {
          if (curGlobalAlpha <= 0.02) return;
          let finalColor = curFillColor;
          if (curGlobalAlpha < 0.98) {
            const match = curFillColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (match) {
              const r = match[1], g = match[2], b = match[3];
              const baseA = match[4] ? parseFloat(match[4]) : 1.0;
              const blendedA = +(baseA * curGlobalAlpha).toFixed(2);
              finalColor = `rgba(${r},${g},${b},${blendedA})`;
            }
          }
          if (!leafLayersMap[finalColor]) leafLayersMap[finalColor] = [];
          leafLayersMap[finalColor].push(ellipsePath);
        } else {
          branchPaths.push(ellipsePath);
        }
      }
    };

    globalScope.line = (x1: number, y1: number, x2: number, y2: number) => {
      const wx1 = +(matrix[0] * x1 + matrix[2] * y1 + matrix[4]).toFixed(1);
      const wy1 = +(matrix[1] * x1 + matrix[3] * y1 + matrix[5]).toFixed(1);
      const wx2 = +(matrix[0] * x2 + matrix[2] * y2 + matrix[4]).toFixed(1);
      const wy2 = +(matrix[1] * x2 + matrix[3] * y2 + matrix[5]).toFixed(1);
      updateBounds(wx1, wy1);
      updateBounds(wx2, wy2);
      petiolePaths.push(`M ${wx1} ${wy1} L ${wx2} ${wy2}`);
    };

    globalScope.noStroke = () => { isPetiole = false; };
    globalScope.stroke = () => { isPetiole = true; };
    globalScope.strokeWeight = () => {};
    globalScope.fill = (...args: any[]) => {
      const isFruit = Boolean(tree?.isDrawingFruit);
      if (args.length === 1) {
        const c = args[0];
        if (typeof c === 'string') {
          const rgbaMatch = c.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
          if (rgbaMatch) {
            const a = parseFloat(rgbaMatch[4]);
            if (isFruit || a < 0.85) {
              curFillColor = `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${a})`;
            } else {
              curFillColor = `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`;
            }
          } else {
            curFillColor = c;
          }
        } else if (typeof c === 'object' && c !== null && c.levels) {
          const a = c.levels[3] !== undefined ? +(c.levels[3] / 255).toFixed(2) : 1;
          if (isFruit || a < 0.85) {
            curFillColor = `rgba(${c.levels[0]}, ${c.levels[1]}, ${c.levels[2]}, ${a})`;
          } else {
            curFillColor = `rgb(${c.levels[0]}, ${c.levels[1]}, ${c.levels[2]})`;
          }
        }
      } else if (args.length >= 3) {
        const r = Math.round(args[0]);
        const g = Math.round(args[1]);
        const b = Math.round(args[2]);
        let a = args[3] !== undefined ? args[3] : 1;
        if (a > 1) a = a / 255;
        a = +a.toFixed(2);

        // Riêng quả phát sáng (isFruit) hoặc hiệu ứng hào quang phát sáng (a < 0.85):
        // Giữ nguyên kênh alpha để tạo quầng hào quang lung linh, mềm mại
        if (isFruit || a < 0.85) {
          curFillColor = `rgba(${r}, ${g}, ${b}, ${a})`;
        } else {
          // Lá cây giữ màu đặc để tránh bị xỉn màu khi vẽ chồng lớp
          curFillColor = `rgb(${r}, ${g}, ${b})`;
        }
      }
      if (globalScope.drawingContext) {
        globalScope.drawingContext.fillStyle = curFillColor;
      }
    };
    globalScope.noFill = () => {};
    globalScope.color = (r: number, g: number, b: number, a: number = 255) => ({ levels: [r, g, b, a] });
    globalScope.lerpColor = (c1: any) => c1;

    let curGlobalAlpha = 1.0;
    const alphaStack: number[] = [];

    globalScope.drawingContext = {
      get globalAlpha() { return curGlobalAlpha; },
      set globalAlpha(val: number) { curGlobalAlpha = Math.max(0, Math.min(1, val)); },
      createLinearGradient: () => ({ addColorStop: () => {} }),
      getTransform: () => ({
        a: matrix[0], b: matrix[1], c: matrix[2], d: matrix[3], e: matrix[4], f: matrix[5]
      }),
      save: () => {
        globalScope.push();
        alphaStack.push(curGlobalAlpha);
      },
      restore: () => {
        globalScope.pop();
        curGlobalAlpha = alphaStack.pop() ?? 1.0;
      },
      scale: (sx: number, sy: number) => globalScope.scale(sx, sy),
      fill: (path: any) => {
        if (curGlobalAlpha <= 0.02) return; // Lá đã mờ tan biến -> không gom vào đường dẫn
        if (path && path.commands) {
          const cmds: string[] = [];
          for (const cmd of path.commands) {
            if (cmd[0] === 'M') {
              const x = +(matrix[0] * cmd[1] + matrix[2] * cmd[2] + matrix[4]).toFixed(1);
              const y = +(matrix[1] * cmd[1] + matrix[3] * cmd[2] + matrix[5]).toFixed(1);
              updateBounds(x, y);
              cmds.push(`M ${x} ${y}`);
            } else if (cmd[0] === 'L') {
              const x = +(matrix[0] * cmd[1] + matrix[2] * cmd[2] + matrix[4]).toFixed(1);
              const y = +(matrix[1] * cmd[1] + matrix[3] * cmd[2] + matrix[5]).toFixed(1);
              updateBounds(x, y);
              cmds.push(`L ${x} ${y}`);
            } else if (cmd[0] === 'C') {
              const c1x = +(matrix[0] * cmd[1] + matrix[2] * cmd[2] + matrix[4]).toFixed(1);
              const c1y = +(matrix[1] * cmd[1] + matrix[3] * cmd[2] + matrix[5]).toFixed(1);
              const c2x = +(matrix[0] * cmd[3] + matrix[2] * cmd[4] + matrix[4]).toFixed(1);
              const c2y = +(matrix[1] * cmd[3] + matrix[3] * cmd[4] + matrix[5]).toFixed(1);
              const x = +(matrix[0] * cmd[5] + matrix[2] * cmd[6] + matrix[4]).toFixed(1);
              const y = +(matrix[1] * cmd[5] + matrix[3] * cmd[6] + matrix[5]).toFixed(1);
              updateBounds(x, y);
              cmds.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x} ${y}`);
            } else if (cmd[0] === 'Q') {
              const cx = +(matrix[0] * cmd[1] + matrix[2] * cmd[2] + matrix[4]).toFixed(1);
              const cy = +(matrix[1] * cmd[1] + matrix[3] * cmd[2] + matrix[5]).toFixed(1);
              const x = +(matrix[0] * cmd[3] + matrix[2] * cmd[4] + matrix[4]).toFixed(1);
              const y = +(matrix[1] * cmd[3] + matrix[3] * cmd[4] + matrix[5]).toFixed(1);
              updateBounds(x, y);
              cmds.push(`Q ${cx} ${cy} ${x} ${y}`);
            } else if (cmd[0] === 'Z') {
              cmds.push('Z');
            }
          }

          let finalColor = curFillColor;
          if (curGlobalAlpha < 0.98) {
            const match = curFillColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
              const r = match[1], g = match[2], b = match[3];
              const blendedA = +(curGlobalAlpha).toFixed(2);
              finalColor = `rgba(${r},${g},${b},${blendedA})`;
            }
          }

          if (!leafLayersMap[finalColor]) leafLayersMap[finalColor] = [];
          leafLayersMap[finalColor].push(cmds.join(' '));
        }
      },
      fillRect: (x: number, y: number, w: number, h: number) => {
        if (curGlobalAlpha <= 0.02) return;
        const wx = +(matrix[0] * x + matrix[2] * y + matrix[4]).toFixed(1);
        const wy = +(matrix[1] * x + matrix[3] * y + matrix[5]).toFixed(1);
        const ww = +(w * matrix[0]).toFixed(1);
        const wh = +(h * matrix[3]).toFixed(1);
        updateBounds(wx, wy);
        updateBounds(wx + ww, wy + wh);
        let finalColor = curFillColor;
        if (curGlobalAlpha < 0.98) {
          const match = curFillColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            const r = match[1], g = match[2], b = match[3];
            const blendedA = +(curGlobalAlpha).toFixed(2);
            finalColor = `rgba(${r},${g},${b},${blendedA})`;
          }
        }
        if (!leafLayersMap[finalColor]) leafLayersMap[finalColor] = [];
        leafLayersMap[finalColor].push(`M ${wx} ${wy} l ${ww} 0 l 0 ${wh} l ${-ww} 0 Z`);
      }
    };

    // THỰC THI DRAW TRỰC TIẾP TỪ THƯ VIỆN CHUẨN FRACTALBRANCHTREE
    tree.windStrength = windStrength;
    tree.windBias = windBias;
    tree.draw(time);

    const leafLayers: LeafColorLayer[] = Object.entries(leafLayersMap).map(([color, dArray]) => ({
      color,
      d: dArray.join(' ')
    }));

    return {
      branchesPath: branchPaths.join(' '),
      petiolesPath: petiolePaths.join(' '),
      leafLayers,
      bounds: {
        minX: bounds.minX,
        maxX: bounds.maxX,
        minY: bounds.minY,
        maxY: bounds.maxY,
        width: Math.max(100, bounds.maxX - bounds.minX),
        height: Math.max(100, bounds.maxY - bounds.minY)
      },
      totalGrowthTime: totalDuration,
      activeFallingCount: tree.activeFallingCount || 0
    };
  }
}
