/**
 * FractalBranchTree - Standalone p5.js Library for Fractal Branching Trees
 * Supports Natural Multi-branching (Type 1: 'hybrid') and Sequential Branching (Type 2: 'sequential').
 * 
 * Usage:
 *   const tree = new FractalBranchTree({
 *     initLength: 200,
 *     branchAngle: 20,
 *     lengthDecay: 0.75,
 *     initThickness: 30,
 *     thicknessDecay: 0.75,
 *     maxDepth: 9,
 *     treeVariation: 0.8,
 *     leafType: 'emerald', // 'emerald', 'sakura', 'autumn'
 *     treeType: 'hybrid',   // 'hybrid' or 'sequential'
 *     windStrength: 1.0,
 *     colorTheme: 'cyberpunk', // 'cyberpunk', 'sakura', 'autumn', 'emerald'
 *     seed: 12345
 *   });
 * 
 *   tree.update(dt);
 *   tree.draw(); // or tree.draw(p5Instance)
 */
(function (global) {
  // Built-in MurmurHash3 fallback for robust deterministic randomness
  const hashRand = (typeof global.hashRand === 'function') ? global.hashRand : function(key, salt = 0) {
    let k = (key || 0) >>> 0;
    let s = (salt || 0) >>> 0;
    let h = Math.imul(k ^ 0x9E3779B9, 0x85EBCA6B) ^ Math.imul(s, 0xC2B2AE35);
    h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B);
    h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  if (typeof global.hashRand !== 'function') global.hashRand = hashRand;

  // Static Path2D Geometry Cache for 10-20x faster GPU leaf rendering
  class LeafPath2DCache {
    static getPointedPath() {
      if (!this._pointed) {
        let p = new Path2D();
        p.moveTo(0, 0);
        p.bezierCurveTo(-0.7, -0.3, -0.6, -0.8, 0, -1.1);
        p.bezierCurveTo(0.6, -0.8, 0.7, -0.3, 0, 0);
        p.closePath();
        this._pointed = p;
      }
      return this._pointed;
    }

    static getRhombusPath() {
      if (!this._rhombus) {
        let p = new Path2D();
        p.moveTo(0, 0);
        p.lineTo(-0.5, -0.55);
        p.lineTo(0, -1.15);
        p.lineTo(0.5, -0.55);
        p.closePath();
        this._rhombus = p;
      }
      return this._rhombus;
    }

    static getHeartPath() {
      if (!this._heart) {
        let p = new Path2D();
        p.moveTo(0, 0);
        p.bezierCurveTo(-1.1, -0.35, -1.1, -1.1, -0.5, -1.15);
        p.bezierCurveTo(-0.25, -1.18, -0.08, -0.92, 0, -0.82);
        p.bezierCurveTo(0.08, -0.92, 0.25, -1.18, 0.5, -1.15);
        p.bezierCurveTo(1.1, -1.1, 1.1, -0.35, 0, 0);
        p.closePath();
        this._heart = p;
      }
      return this._heart;
    }

    static getSakuraLeafPath() {
      if (!this._sakuraLeaf) {
        let p = new Path2D();
        p.moveTo(0, 0);
        p.bezierCurveTo(-0.95, -0.35, -0.85, -0.85, -0.42, -1.15);
        p.lineTo(0, -0.82);
        p.lineTo(0.42, -1.15);
        p.bezierCurveTo(0.85, -0.85, 0.95, -0.35, 0, 0);
        p.closePath();
        this._sakuraLeaf = p;
      }
      return this._sakuraLeaf;
    }

    static getRoundPath() {
      if (!this._round) {
        let p = new Path2D();
        p.moveTo(0, 0);
        p.bezierCurveTo(-1.35, -0.25, -1.35, -1.75, 0, -2.0);
        p.bezierCurveTo(1.35, -1.75, 1.35, -0.25, 0, 0);
        p.closePath();
        this._round = p;
      }
      return this._round;
    }

    static getEucalyptusLongPath(variantIndex = 0) {
      if (!this._eucalyptusLongVariants) {
        this._initEucalyptusVariants();
      }
      let idx = Math.abs(variantIndex) % this._eucalyptusLongVariants.length;
      return this._eucalyptusLongVariants[idx];
    }

    static getEucalyptusPoints(variantIndex = 0) {
      if (!this._eucalyptusRawPoints) {
        this._initEucalyptusVariants();
      }
      let idx = Math.abs(variantIndex) % this._eucalyptusRawPoints.length;
      return this._eucalyptusRawPoints[idx];
    }

    static _initEucalyptusVariants() {
      this._eucalyptusLongVariants = [];
      this._eucalyptusRawPoints = [];
      const NUM_VARIANTS = 32;
      const NUM_POINTS = 24;
      const minAngle = 70;  // 70°: Gần như hình trăng lưỡi liềm (Crescent Moon)
      const maxAngle = 150; // 150°: Uốn cong sâu gần như chữ C (Deep C-curve)
      const halfV = NUM_VARIANTS / 2;

      for (let i = 0; i < NUM_VARIANTS; i++) {
        const isLeft = (i < halfV);
        const dir = isLeft ? -1 : 1;
        const step = isLeft ? (i / (halfV - 1)) : ((i - halfV) / (halfV - 1));
        const thetaDeg = minAngle + step * (maxAngle - minAngle);
        const theta = thetaDeg * Math.PI / 180;
        const Wmax = 0.080; // Bề rộng thanh mảnh tự nhiên (~16% chiều dài)

        const leftPts = [];
        const rightPts = [];
        let p = new Path2D();

        p.moveTo(0, 0);

        for (let j = 0; j <= NUM_POINTS; j++) {
          const s = j / NUM_POINTS;
          const angle = dir * theta * s;
          const xSpine = dir * (1 - Math.cos(theta * s)) / theta;
          const ySpine = -Math.sin(theta * s) / theta;

          // Gốc lá thuôn nhọn ôm sát cuống (cuneate base), phình nhẹ ở thân giữa, vuốt nhọn ở đỉnh
          const w = Wmax * Math.sin(Math.PI * Math.pow(s, 0.72)) * (1.0 - 0.22 * s);

          const nx = Math.cos(angle);
          const ny = Math.sin(angle);

          const lx = xSpine - w * nx;
          const ly = ySpine - w * ny;
          const rx = xSpine + w * nx;
          const ry = ySpine + w * ny;

          leftPts.push({ x: lx, y: ly });
          rightPts.push({ x: rx, y: ry });
          p.lineTo(lx, ly);
        }

        for (let j = NUM_POINTS; j >= 0; j--) {
          p.lineTo(rightPts[j].x, rightPts[j].y);
        }

        p.closePath();
        this._eucalyptusLongVariants.push(p);
        this._eucalyptusRawPoints.push({ leftPts, rightPts });
      }
    }

    static getOvalPath() {
      if (!this._oval) {
        let p = new Path2D();
        p.ellipse(0, -0.5, 0.5, 0.5, 0, 0, Math.PI * 2);
        this._oval = p;
      }
      return this._oval;
    }

    static getBodhiPath() {
      if (!this._bodhi) {
        let p = new Path2D();
        p.moveTo(0, 0);
        p.bezierCurveTo(-1.1, -0.4, -1.3, -0.9, -0.25, -1.05);
        p.lineTo(0, -0.85);
        p.bezierCurveTo(0.25, -1.05, 1.3, -0.9, 1.1, -0.4);
        p.closePath();
        this._bodhi = p;
      }
      return this._bodhi;
    }

    static getGinkgoPath() {
      if (!this._ginkgo) {
        let p = new Path2D();
        let triangles = [
          { center: -57.5, left: -75.0, right: -40.0 },
          { center: -20.5, left: -38.0, right: -3.0 },
          { center: 20.5,  left: 3.0,   right: 38.0 },
          { center: 57.5,  left: 40.0,  right: 75.0 }
        ];

        for (let k = 0; k < 4; k++) {
          let tInfo = triangles[k];
          let aCenter = radians(tInfo.center);
          let aLeft = radians(tInfo.left);
          let aRight = radians(tInfo.right);

          let envelopeFactor = Math.cos(radians(tInfo.center) * 0.45);
          let triLen = (0.78 + 0.22 * envelopeFactor);

          let aSideL = aLeft - radians(2.0);
          let x_sideL = Math.sin(aSideL) * triLen * 0.48;
          let y_sideL = -Math.cos(aSideL) * triLen * 0.48;

          let cp1L_x = Math.sin(aLeft) * triLen * 0.22;
          let cp1L_y = -Math.cos(aLeft) * triLen * 0.22;
          let cp2L_x = Math.sin(aSideL) * triLen * 0.38;
          let cp2L_y = -Math.cos(aSideL) * triLen * 0.38;

          let x_cornerL_c1 = Math.sin(aLeft - radians(6.0)) * triLen * 0.85;
          let y_cornerL_c1 = -Math.cos(aLeft - radians(6.0)) * triLen * 0.85;
          let aBaseL = aLeft + radians(11.5);
          let x_baseL = Math.sin(aBaseL) * triLen * 0.95;
          let y_baseL = -Math.cos(aBaseL) * triLen * 0.95;
          let x_cornerL_c2 = Math.sin(aLeft + radians(3.0)) * triLen * 1.14;
          let y_cornerL_c2 = -Math.cos(aLeft + radians(3.0)) * triLen * 1.14;

          let aSideR = aRight + radians(2.0);
          let x_sideR = Math.sin(aSideR) * triLen * 0.48;
          let y_sideR = -Math.cos(aSideR) * triLen * 0.48;
          let aBaseR = aRight - radians(11.5);
          let x_baseR = Math.sin(aBaseR) * triLen * 0.95;
          let y_baseR = -Math.cos(aBaseR) * triLen * 0.95;
          let x_cornerR_c1 = Math.sin(aRight - radians(3.0)) * triLen * 1.14;
          let y_cornerR_c1 = -Math.cos(aRight - radians(3.0)) * triLen * 1.14;
          let x_cornerR_c2 = Math.sin(aRight + radians(6.0)) * triLen * 0.85;
          let y_cornerR_c2 = -Math.cos(aRight + radians(6.0)) * triLen * 0.85;

          let cp2R_x = Math.sin(aSideR) * triLen * 0.38;
          let cp2R_y = -Math.cos(aSideR) * triLen * 0.38;
          let cp1R_x = Math.sin(aRight) * triLen * 0.22;
          let cp1R_y = -Math.cos(aRight) * triLen * 0.22;

          let cp1Base_x = Math.sin(aCenter - radians(4.0)) * triLen * 0.90;
          let cp1Base_y = -Math.cos(aCenter - radians(4.0)) * triLen * 0.90;
          let cp2Base_x = Math.sin(aCenter + radians(4.0)) * triLen * 1.02;
          let cp2Base_y = -Math.cos(aCenter + radians(4.0)) * triLen * 1.02;

          p.moveTo(0, 0);
          p.bezierCurveTo(cp1L_x, cp1L_y, cp2L_x, cp2L_y, x_sideL, y_sideL);
          p.bezierCurveTo(x_cornerL_c1, y_cornerL_c1, x_cornerL_c2, y_cornerL_c2, x_baseL, y_baseL);
          p.bezierCurveTo(cp1Base_x, cp1Base_y, cp2Base_x, cp2Base_y, x_baseR, y_baseR);
          p.bezierCurveTo(x_cornerR_c1, y_cornerR_c1, x_cornerR_c2, y_cornerR_c2, x_sideR, y_sideR);
          p.bezierCurveTo(cp2R_x, cp2R_y, cp1R_x, cp1R_y, 0, 0);
          p.closePath();
        }
        this._ginkgo = p;
      }
      return this._ginkgo;
    }
  }

  class BranchNode {
    constructor(treeRef, len, thickness, angle, branchId, depth, level, parent = null, nodeType = 'rachis') {
      this.tree = treeRef;
      this.maxLen = len;
      this.maxThickness = thickness;
      this.angle = angle;
      this.baseAngle = angle;
      this.tipLeanAngle = 0;
      this.branchId = branchId;
      this.depth = depth;
      this.level = level;
      this.parent = parent;
      this.nodeType = nodeType;
      this.worldAngle = parent ? (parent.worldAngle + this.angle) : (this.angle - Math.PI / 2);
      this.gravityLocalAngle = Math.PI / 2 - this.worldAngle;

      this.currentLen = 0;
      this.currentThickness = 0.5;
      this.maxDrawnThickness = 0.5;
      this.children = [];
      this.hasSprouted = false;
      this.hasSproutedContinuation = false;
      this.hasSproutedSide = false;

      let noiseBranch = noise(branchId * 11.2 + 67.4);
      if (noiseBranch < 0.20) {
        this.maxSequentialBranches = 1;
      } else if (noiseBranch < 0.75) {
        this.maxSequentialBranches = 2;
      } else {
        this.maxSequentialBranches = 3;
      }
      
      let angleRad = radians(this.tree.branchAngle);
      let sideHash = noise(branchId * 3.7 + 1.2);
      if (this.maxSequentialBranches === 1) {
        this.slotAngles = [sideHash > 0.5 ? -angleRad : angleRad];
      } else if (this.maxSequentialBranches === 2) {
        this.slotAngles = sideHash > 0.5 ? [-angleRad, angleRad] : [angleRad, -angleRad];
      } else {
        this.slotAngles = [-angleRad, 0, angleRad];
      }

      this.firstSproutedTime = 0;

      let leafTimeNoise = noise(this.branchId * 41.2 + 88.9);
      this.slotLeafPhase = ['growing', 'growing', 'growing'];
      this.slotLeafProgress = [0, 0, 0];
      this.slotLeafFallTime = [0, 0, 0];
      this.slotLeafMatureElapsed = [0, 0, 0];
      this.slotLeafMatureWait = [
        0.1 + leafTimeNoise * 0.8 * this.tree.treeVariation,
        0.1 + noise(branchId * 42.4 + 89.2) * 0.8 * this.tree.treeVariation,
        0.1 + noise(branchId * 43.6 + 89.5) * 0.8 * this.tree.treeVariation
      ];
      this.slotDelays = [
        0,
        0.4 + noise(branchId * 9.8 + 14.5) * 1.0,
        0.8 + noise(branchId * 10.2 + 15.1) * 1.0
      ];
      this.slotSprouted = [false, false, false];
      this.sideLeafTimer = 0;
      
      if (parent === null) {
        this.terminalLevel = Math.round(this.tree.maxDepth * 0.8);
      } else {
        let noiseTerminal = noise(branchId * 51.3 + 24.7);
        let dev = round((noiseTerminal - 0.5) * 2 * 2.2 * this.tree.treeVariation);
        this.terminalLevel = constrain(parent.terminalLevel + dev, 6, 10);
      }
      
      this.leavesPhase = 'growing';
      this.leavesProgress = 0;
      this.leavesFallTime = 0;
      this.matureWaitTime = 0;
      this.matureTimeElapsed = 0;
      
      let noiseSpeed = noise(branchId * 14.7 + 3.2);
      this.speedFactor = 0.4 + noiseSpeed * 1.2 * this.tree.treeVariation;

      let leafSizeNoise = noise(branchId * 31.4 + 12.9);
      let randomScale = 0.85 + leafSizeNoise * 0.30;
      this.leafScaleFactor = randomScale;

      // Pre-compute fixed petiole attachment angles & leaf configs once at creation
      this.initLeafConfig();

      // Pre-build child branches hierarchy recursively
      let isLastLevel = (this.level >= this.terminalLevel);
      if (!isLastLevel) {
        for (let slot = 0; slot < this.maxSequentialBranches; slot++) {
          this.sproutSequentialChild(slot);
        }
      }
    }

    initLeafConfig() {
      let seed = (this.tree && typeof this.tree.seed === 'number') ? this.tree.seed : 0;
      let angleRad = radians(this.tree.branchAngle);
      let extraLeafAngle = radians(10);
      let sBranchId = this.branchId + seed * 100;

      // 1. Static petiole growth angles at node junction
      let noiseCommon = noise(sBranchId * 17.5 + 44.8);
      let commonTilt = (noiseCommon - 0.5) * 2 * radians(20) * this.tree.treeVariation;
      let noiseRelative = noise(sBranchId * 14.2 + 93.1);
      let relativeAngleVar = (noiseRelative - 0.5) * 2 * radians(15) * this.tree.treeVariation;

      this.sproutLeftAngle = -angleRad + (commonTilt - relativeAngleVar / 2) - extraLeafAngle;
      this.sproutRightAngle = angleRad + (commonTilt + relativeAngleVar / 2) + extraLeafAngle;
      let noiseM_angle = noise(sBranchId * 7.1 + 59.2);
      this.sproutMidAngle = (noiseM_angle - 0.5) * 2 * radians(15) * this.tree.treeVariation;

      let currentShape = this.tree.getEffectiveLeafShape();
      let leafCfg = (typeof LEAF_TYPE_CONFIGS !== 'undefined' && LEAF_TYPE_CONFIGS[currentShape]) ? LEAF_TYPE_CONFIGS[currentShape] : null;

      let minTipCount = (leafCfg && Array.isArray(leafCfg.tipLeafRange)) ? leafCfg.tipLeafRange[0] : 1;
      let maxTipCount = (leafCfg && Array.isArray(leafCfg.tipLeafRange)) ? leafCfg.tipLeafRange[1] : 3;
      if (currentShape === 'willow') {
        minTipCount = 1;
        maxTipCount = 1;
      }

      this.sproutLeafCount = constrain(floor(minTipCount + hashRand(sBranchId, 88) * (maxTipCount - minTipCount + 1)), 0, 10);

      let isWillow = (currentShape === 'willow');
      let isTamarind = (currentShape === 'single_needle');
      let delayBase = (isWillow || isTamarind) ? 12.0 : 0.3;
      let delayRange = isWillow ? 10.0 : (isTamarind ? 4.0 : 1.7);

      this.sproutLeafItems = [];
      if (this.sproutLeafCount === 1) {
        let delayM = delayBase + hashRand((this.branchId * 3 + 1) + seed * 100, 81) * delayRange;
        this.sproutLeafItems.push({ key: 'M', id: this.branchId * 3 + 1, angle: this.sproutMidAngle, delay: delayM });
      } else if (this.sproutLeafCount === 2) {
        let delayL = delayBase + hashRand((this.branchId * 3 + 2) + seed * 100, 81) * delayRange;
        let delayR = delayBase + hashRand((this.branchId * 3 + 0) + seed * 100, 82) * delayRange;
        this.sproutLeafItems.push({ key: 'L', id: this.branchId * 3 + 2, angle: this.sproutLeftAngle, delay: delayL });
        this.sproutLeafItems.push({ key: 'R', id: this.branchId * 3 + 0, angle: this.sproutRightAngle, delay: delayR });
      } else if (this.sproutLeafCount === 3) {
        let delayL = delayBase + hashRand((this.branchId * 3 + 2) + seed * 100, 81) * delayRange;
        let delayM = delayBase + hashRand((this.branchId * 3 + 1) + seed * 100, 82) * delayRange;
        let delayR = delayBase + hashRand((this.branchId * 3 + 0) + seed * 100, 83) * delayRange;
        this.sproutLeafItems.push({ key: 'L', id: this.branchId * 3 + 2, angle: this.sproutLeftAngle, delay: delayL });
        this.sproutLeafItems.push({ key: 'M', id: this.branchId * 3 + 1, angle: this.sproutMidAngle, delay: delayM });
        this.sproutLeafItems.push({ key: 'R', id: this.branchId * 3 + 0, angle: this.sproutRightAngle, delay: delayR });
      } else if (this.sproutLeafCount > 3) {
        let count = this.sproutLeafCount;
        let fanSpread = (this.tree.branchAngle ? radians(this.tree.branchAngle * 2 + 20) : radians(60));
        for (let i = 0; i < count; i++) {
          let t = (i / (count - 1)) - 0.5; // -0.5 to +0.5
          let ang = t * fanSpread + this.sproutMidAngle;
          let delay = delayBase + hashRand((this.branchId * 10 + i) + seed * 100, 80 + i) * delayRange;
          this.sproutLeafItems.push({ key: `F_${i}`, id: this.branchId * 10 + i, angle: ang, delay: delay });
        }
      }

      // Khởi tạo lịch trình rụng từng lá chét ngẫu nhiên cho chùm lá me (7 cặp lá = 14 lá chét)
      if (isTamarind) {
        for (let item of this.sproutLeafItems) {
          let leaflets = [];
          for (let i = 0; i < 7; i++) {
            leaflets.push({ pairIdx: i, side: 'L', id: item.id * 100 + i * 2 + 0, fallDelay: Infinity });
            leaflets.push({ pairIdx: i, side: 'R', id: item.id * 100 + i * 2 + 1, fallDelay: Infinity });
          }
          // Số lượng lá chét rụng ngẫu nhiên từ 5 đến 11 lá
          let numFall = 5 + floor(hashRand(item.id, 401) * 7);
          let indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
          for (let k = indices.length - 1; k > 0; k--) {
            let swapIdx = floor(hashRand(item.id * 10 + k, 402) * (k + 1));
            let temp = indices[k];
            indices[k] = indices[swapIdx];
            indices[swapIdx] = temp;
          }
          let maxFallTime = Math.max(7.0, item.delay - 2.5);
          for (let f = 0; f < numFall; f++) {
            let idx = indices[f];
            // Rụng rải rác đều từ giây 3.5s đến trước lúc tan biến (item.delay - 2.5s)
            let progressRatio = f / Math.max(1, numFall - 1);
            let tSlot = 3.5 + progressRatio * (maxFallTime - 3.5) + (hashRand(item.id * 20 + f, 403) - 0.5) * 0.6;
            leaflets[idx].fallDelay = constrain(tSlot, 3.0, maxFallTime);
          }
          item.tamarindLeaflets = leaflets;
        }
      }

      // 2. Static side leaf petiole positions & angles along branch body (Chuẩn Lref = 36px & cấu hình riêng từng loài)
      let minCount = (leafCfg && Array.isArray(leafCfg.sideLeafRange)) ? leafCfg.sideLeafRange[0] : 0;
      let maxCount = (leafCfg && Array.isArray(leafCfg.sideLeafRange)) ? leafCfg.sideLeafRange[1] : 4;

      let count = 0;
      if (maxCount > 0) {
        let Lref = 36.0; // Tiêu chuẩn độ dài trung bình cành cấp 7
        let sideLeafHash = hashRand(sBranchId, 74);
        let baseCount = minCount + sideLeafHash * (maxCount - minCount);
        let scaledCount = baseCount * (this.maxLen / Lref);
        let intCount = floor(scaledCount);
        let frac = scaledCount - intCount;
        let roundHash = hashRand(sBranchId, 88);
        count = (roundHash < frac) ? intCount + 1 : intCount;
        let maxDense = Math.max(1, floor(this.maxLen / 3.8));
        count = constrain(count, 1, maxDense);
      }
      this.sideLeafConfigs = [];
      for (let k = 0; k < count; k++) {
        let posHash = hashRand(this.branchId * 37 + k * 19 + seed * 100, 55);
        let ratio = 0.12 + posHash * 0.78; // Vị trí ngẫu nhiên tự do 100% dọc theo cành (12% -> 90%)
        let sideHash = hashRand(this.branchId * 41 + k * 23 + seed * 100, 77);
        let side = (sideHash < 0.5) ? -1 : 1; // Mọc ngẫu nhiên bên trái hoặc bên phải
        let angleHash = hashRand(this.branchId * 29 + k * 13 + seed * 100, 66);
        let baseAngle = (leafCfg && typeof leafCfg.sideLeafAngle === 'number') ? leafCfg.sideLeafAngle : 20;
        let angleOffset = (angleHash - 0.5) * 2 * 20; // Biến thiên góc ngẫu nhiên ±20°
        let leafAngle = side * radians(Math.max(15, baseAngle + 18 + angleOffset));
        let petioleMin = (leafCfg && Array.isArray(leafCfg.petioleRange)) ? leafCfg.petioleRange[0] : 0.20;
        let petioleMax = (leafCfg && Array.isArray(leafCfg.petioleRange)) ? leafCfg.petioleRange[1] : 0.40;
        let lenHash = hashRand(this.branchId * 47 + k * 31 + seed * 100, 91);
        let lenMultiplier = petioleMin + lenHash * (petioleMax - petioleMin);
        let isEarlyLeaf = (lenHash < 0.35);

        this.sideLeafConfigs.push({
          id: this.branchId * 10 + k,
          ratio: ratio,
          angle: leafAngle,
          lenMultiplier: lenMultiplier,
          isEarlyLeaf: isEarlyLeaf
        });
      }
    }

    measureGeometry(x = 0, y = 0, currentAngle = 0) {
      let tipX = x + sin(currentAngle) * this.maxLen;
      let tipY = y - cos(currentAngle) * this.maxLen;

      let minX = min(x, tipX);
      let maxX = max(x, tipX);
      let minY = min(y, tipY);
      let maxY = max(y, tipY);

      for (let child of this.children) {
        let childAngle = currentAngle + child.angle;
        let childBounds = child.measureGeometry(tipX, tipY, childAngle);
        minX = min(minX, childBounds.minX);
        maxX = max(maxX, childBounds.maxX);
        minY = min(minY, childBounds.minY);
        maxY = max(maxY, childBounds.maxY);
      }

      return { minX, maxX, minY, maxY };
    }

    applyAutoThickness(parentThickness = null) {
      if (parentThickness !== null) {
        this.maxThickness = parentThickness * this.tree.thicknessDecay;
      }
      for (let child of this.children) {
        child.applyAutoThickness(this.maxThickness);
      }
    }
    
    calculateTimeline(startTime) {
      this.startTime = startTime;
      // Growth duration fluctuates organically per branch between 2.4s and 4.8s
      let durationHash = noise(this.branchId * 14.7 + 3.2);
      let rawDuration = 2.4 + durationHash * 2.4; // 2.4s to 4.8s
      let lenDuration = rawDuration / Math.max(this.tree.growthSpeed || 1.0, 0.1);
      this.lenFullTime = this.startTime + lenDuration;

      let branchSproutDelay = 0.3 + hashRand(this.branchId, 89) * 1.7; // Independent delay 0.3s to 2.0s
      let sproutBaseTime = this.lenFullTime + branchSproutDelay;

      if (this.children.length === 0) {
        this.finishTime = this.lenFullTime + 6.0; // Đảm bảo lá ngọn có đủ 6.0s để rơi xuống tận mặt đất
      } else {
        let maxChildFinish = sproutBaseTime + 1.0;
        for (let i = 0; i < this.children.length; i++) {
          let child = this.children[i];
          let delay = this.slotDelays[i] || 0;
          let childStart = sproutBaseTime + delay;
          child.calculateTimeline(childStart);
          maxChildFinish = Math.max(maxChildFinish, child.finishTime);
        }
        this.finishTime = maxChildFinish;
      }
      return this.finishTime;
    }

    updateTime(currentTime, totalDuration) {
      if (currentTime < this.startTime) {
        this.currentLen = 0;
        this.currentThickness = 0;
        this.maxDrawnThickness = 0.5;
        this.leavesProgress = 0;
        this.sideLeafTimer = 0;
        this.leavesPhase = 'growing';
        this.leavesFallTime = 0;
        for (let child of this.children) {
          child.updateTime(currentTime, totalDuration);
        }
        return;
      }

      if (currentTime < this.lenFullTime) {
        let progress = (currentTime - this.startTime) / Math.max(this.lenFullTime - this.startTime, 0.001);
        progress = constrain(progress, 0, 1);
        // Primary growth: length reaches 75% of maxLen
        this.currentLen = lerp(0, this.maxLen * 0.75, progress);
        this.leavesProgress = progress;
        this.leavesPhase = 'growing';
        this.leavesFallTime = 0;
        // Primary growth: slender shoot reaching 25% of maxThickness with ease-in curve
        let easedProgress = Math.pow(progress, 1.6);
        this.currentThickness = lerp(0.5, this.maxThickness * 0.25, easedProgress);
        this.sideLeafTimer = 0;
      } else {
        let leafTimeNoise = noise(this.branchId * 41.2 + 88.9);
        let matureWaitTime = 0.05 + leafTimeNoise * 0.20 * this.tree.treeVariation;
        let elapsedSinceFull = currentTime - this.lenFullTime;
        let isLastLevel = (this.level >= this.terminalLevel) || (this.children.length === 0);

        if (isLastLevel) {
          this.leavesPhase = 'mature';
          this.leavesFallTime = 0;
        } else {
          if (elapsedSinceFull < matureWaitTime) {
            this.leavesPhase = 'mature';
            this.leavesFallTime = 0;
          } else if (elapsedSinceFull < matureWaitTime + 1.5) {
            this.leavesPhase = 'falling';
            this.leavesFallTime = elapsedSinceFull - matureWaitTime;
          } else {
            this.leavesPhase = 'gone';
            this.leavesFallTime = 1.5;
          }
        }

        let sideT = elapsedSinceFull / 0.8;
        this.sideLeafTimer = constrain(sideT, 0, 1);

        // Global Secondary Growth: đồng bộ vươn dài (75% -> 100%) và phình to (25% -> 100%) theo T_total
        let swellRatio = (currentTime - this.lenFullTime) / Math.max(totalDuration - this.lenFullTime, 0.001);
        swellRatio = constrain(swellRatio, 0, 1);
        let easedSwell = swellRatio * swellRatio * (3 - 2 * swellRatio);

        // Secondary Extension: Vươn dài nốt 25% chiều dài còn lại
        this.currentLen = lerp(this.maxLen * 0.75, this.maxLen, easedSwell);
        this.leavesProgress = 1.0;

        // Secondary Thickening: Phình to nốt 75% độ dày còn lại
        let primaryW = this.maxThickness * 0.25;
        let finalW = this.maxThickness;
        this.currentThickness = lerp(primaryW, finalW, easedSwell);
      }

      this.maxDrawnThickness = max(0.5, this.currentThickness);

      for (let child of this.children) {
        child.updateTime(currentTime, totalDuration);
      }
    }

    getDescendantSproutDepth() {
      if (this.children.length === 0) return 0;
      let maxChild = -1;
      for (let child of this.children) {
        if (child.currentLen > 0) {
          maxChild = max(maxChild, child.getDescendantSproutDepth());
        }
      }
      return maxChild >= 0 ? 1 + maxChild : 0;
    }
    
    update(dt) {
      let activeDescendants = this.getDescendantSproutDepth();
      let globalBaseSpeed = (this.tree.initLength / 2.8);
      let v_base = globalBaseSpeed * this.speedFactor;
      let speed = v_base * Math.pow(0.5, activeDescendants);
      let isLastLevel = (this.level >= this.terminalLevel) || (this.hasSprouted && this.children.length === 0);
      
      if (this.currentLen < this.maxLen) {
        this.currentLen += speed * dt;
        if (this.currentLen > this.maxLen) this.currentLen = this.maxLen;
      }
      
      let progress = this.currentLen / this.maxLen;
      this.currentThickness = lerp(0.5, this.maxThickness, progress);
      
      let sproutProgress = 0.50;
      let leafTimeNoise = noise(this.branchId * 41.2 + 88.9);
      let leafTimeFactor = 0.35 + leafTimeNoise * 1.65 * this.tree.treeVariation;
      
      if (isLastLevel) {
        this.leavesProgress = progress;
        this.leavesPhase = 'mature';
      } else {
        if (progress >= 1.0) {
          if (this.leavesPhase === 'growing') {
            this.leavesProgress = 1.0;
            this.leavesPhase = 'mature';
            this.matureWaitTime = 0.05 + leafTimeNoise * 0.20 * this.tree.treeVariation;
            this.matureTimeElapsed = 0;
          } else if (this.leavesPhase === 'mature') {
            this.matureTimeElapsed += dt;
            if (this.matureTimeElapsed >= this.matureWaitTime) {
              this.leavesPhase = 'falling';
              this.leavesFallTime = 0;
              if (this.tree.treeType !== 'sequential') {
                this.sproutChildren();
              }
            }
          } else if (this.leavesPhase === 'falling') {
            this.leavesFallTime += dt;
            if (this.leavesFallTime >= 1.5) {
              this.leavesPhase = 'gone';
            }
          }
        } else {
          this.leavesProgress = progress;
        }

        for (let i = 0; i < this.maxSequentialBranches; i++) {
          let canStart = false;
          if (i === 0) {
            canStart = (this.leavesPhase === 'falling' || this.leavesPhase === 'gone' || progress >= 1.0);
          } else {
            if (this.slotSprouted[i - 1]) {
              let timeSinceFirstSprout = this.tree.animationTime - this.firstSproutedTime;
              canStart = (timeSinceFirstSprout >= this.slotDelays[i]);
            }
          }

          if (canStart && !this.slotSprouted[i]) {
            this.sproutSequentialChild(i);
          }
        }
      }
      
      let currentShape = this.tree.getEffectiveLeafShape();
      let leafCfg = (typeof LEAF_TYPE_CONFIGS !== 'undefined' && LEAF_TYPE_CONFIGS[currentShape]) ? LEAF_TYPE_CONFIGS[currentShape] : null;
      let startLevel = (leafCfg && typeof leafCfg.sideLeafStartLevel === 'number') ? leafCfg.sideLeafStartLevel : 5;
      if (this.level >= startLevel && !isLastLevel && this.currentLen >= this.maxLen) {
        this.sideLeafTimer += dt;
        if (this.sideLeafTimer > 1.0) {
          this.sideLeafTimer = 1.0;
        }
      }
      
      for (let child of this.children) {
        child.update(dt);
      }

      let raw_base = max(this.currentThickness, 1.0);
      let d_base = raw_base;
      if (this.children.length > 0) {
        let maxChildThickness = 0;
        for (let child of this.children) {
          maxChildThickness = max(maxChildThickness, child.maxDrawnThickness);
        }
        let d_tip = max(maxChildThickness, 1.0);
        let maxThicknessAllowed = d_tip / this.tree.thicknessDecay;
        d_base = min(raw_base, maxThicknessAllowed);
      }
      this.maxDrawnThickness = max(this.maxDrawnThickness, d_base);
    }
    
    sproutChildren() {
      if (this.hasSprouted) return;
      this.hasSprouted = true;
      
      let branchMode = 2;
      if (this.tree.treeVariation > 0) {
        let noiseBranchCount = noise(this.branchId * 11.2 + 67.4);
        let p1 = 0.10 * this.tree.treeVariation;
        let p3 = 0.25 * this.tree.treeVariation;
        
        if (noiseBranchCount < p1) {
          branchMode = (noiseBranchCount < p1 / 2) ? 1 : -1;
        } else if (noiseBranchCount > 1 - p3) {
          branchMode = 3;
        } else {
          branchMode = 2;
        }
      }
      
      if (branchMode === 0) return;
      
      let angleRad = radians(this.tree.branchAngle);
      let leftAngleVar = 0, rightAngleVar = 0, midAngleVar = 0;
      let leftLengthDecayVar = this.tree.lengthDecay;
      let rightLengthDecayVar = this.tree.lengthDecay;
      let midLengthDecayVar = this.tree.lengthDecay;
      
      if (this.tree.treeVariation > 0) {
        let noiseCommon = noise(this.branchId * 17.5 + 44.8);
        let commonTilt = (noiseCommon - 0.5) * 2 * radians(20) * this.tree.treeVariation;

        let noiseRelative = noise(this.branchId * 14.2 + 93.1);
        let relativeAngleVar = (noiseRelative - 0.5) * 2 * radians(15) * this.tree.treeVariation;

        let noiseR_indiv = noise(this.branchId * 13.9 + 5.7);
        let noiseL_indiv = noise(this.branchId * 15.2 + 8.9);
        let rightIndivAngle = (noiseR_indiv - 0.5) * 2 * radians(10) * this.tree.treeVariation;
        let leftIndivAngle = (noiseL_indiv - 0.5) * 2 * radians(10) * this.tree.treeVariation;

        rightAngleVar = commonTilt + relativeAngleVar / 2 + rightIndivAngle;
        leftAngleVar = commonTilt - relativeAngleVar / 2 + leftIndivAngle;

        let noiseM_angle = noise(this.branchId * 7.1 + 59.2);
        midAngleVar = (noiseM_angle - 0.5) * 2 * radians(15) * this.tree.treeVariation;
        let noiseR_len = noise(this.branchId * 5.9 + 45.1);
        let noiseL_len = noise(this.branchId * 6.1 + 89.4);
        rightLengthDecayVar = this.tree.lengthDecay * (1.0 + (noiseR_len - 0.5) * 2 * 0.38 * this.tree.treeVariation);
        leftLengthDecayVar = this.tree.lengthDecay * (1.0 + (noiseL_len - 0.5) * 2 * 0.38 * this.tree.treeVariation);

        let hashSide = (Math.abs(Math.sin(this.branchId * 54.321 + 19.876)) * 12345.6789) % 1;
        let noiseAsym = noise(this.branchId * 29.3 + 72.8);
        let lengthBias = (noiseAsym - 0.5) * 2 * 0.85 * this.tree.lengthDecay * this.tree.treeVariation;
        
        if (hashSide > 0.5) {
          rightLengthDecayVar += lengthBias;
          leftLengthDecayVar -= lengthBias;
        } else {
          leftLengthDecayVar += lengthBias;
          rightLengthDecayVar -= lengthBias;
        }

        rightLengthDecayVar = constrain(rightLengthDecayVar, 0.30, 0.90);
        leftLengthDecayVar = constrain(leftLengthDecayVar, 0.30, 0.90);

        let noiseM_len = noise(this.branchId * 9.3 + 14.8);
        midLengthDecayVar = this.tree.lengthDecay * 0.85 * (1.0 + (noiseM_len - 0.5) * 2 * 0.38 * this.tree.treeVariation);
        midLengthDecayVar = constrain(midLengthDecayVar, 0.30, 0.90);
      }
      
      let nextThickness = this.maxThickness * this.tree.thicknessDecay;
      let minLen = this.tree.minBranchLength || 10;
      
      if (branchMode === -1 || branchMode === 2 || branchMode === 3) {
        let childAngle = angleRad + rightAngleVar;
        let childLen = this.maxLen * rightLengthDecayVar;
        if (childLen >= minLen) {
          this.children.push(new BranchNode(this.tree, childLen, nextThickness, childAngle, this.branchId * 3, this.depth - 1, this.level + 1, this));
        }
      }
      
      if (branchMode === 3) {
        let childAngle = midAngleVar;
        let childLen = this.maxLen * midLengthDecayVar;
        if (childLen >= minLen) {
          this.children.push(new BranchNode(this.tree, childLen, nextThickness, childAngle, this.branchId * 3 + 1, this.depth - 1, this.level + 1, this));
        }
      }
      
      if (branchMode === 1 || branchMode === 2 || branchMode === 3) {
        let childAngle = -angleRad + leftAngleVar;
        let childLen = this.maxLen * leftLengthDecayVar;
        if (childLen >= minLen) {
          this.children.push(new BranchNode(this.tree, childLen, nextThickness, childAngle, this.branchId * 3 + 2, this.depth - 1, this.level + 1, this));
        }
      }
    }

    sproutSequentialChild(slot) {
      this.slotSprouted[slot] = true;
      this.hasSprouted = true;
      
      let noiseCommon = noise(this.branchId * 17.5 + 44.8);
      let commonTilt = (noiseCommon - 0.5) * 2 * radians(15) * this.tree.treeVariation;
      
      let noiseRelative = noise(this.branchId * 14.2 + 93.1);
      let relativeAngleVar = (noiseRelative - 0.5) * 2 * radians(10) * this.tree.treeVariation;
      
      let noiseIndiv = noise(this.branchId * 15.3 + slot * 47.2);
      let indivAngle = (noiseIndiv - 0.5) * 2 * radians(10) * this.tree.treeVariation;
      
      let baseAngle = this.slotAngles[slot];
      let side = (baseAngle === 0) ? 0 : Math.sign(baseAngle);
      let finalAngle = baseAngle + commonTilt + side * relativeAngleVar / 2 + indivAngle;
      
      let noiseLen = noise(this.branchId * 8.9 + slot * 29.1);
      let childDecay = this.tree.lengthDecay * (1.0 + (noiseLen - 0.5) * 2 * 0.38 * this.tree.treeVariation);
      
      let noiseAsym = noise(this.branchId * 29.3 + 72.8);
      let lengthBias = (noiseAsym - 0.5) * 2 * 0.85 * this.tree.lengthDecay * this.tree.treeVariation;
      
      if (slot === 0) childDecay += lengthBias;
      if (slot === 1) childDecay -= lengthBias;
      if (slot === 2) childDecay *= 0.85;
      
      childDecay = constrain(childDecay, 0.30, 0.90);
      
      let childLen = this.maxLen * childDecay;
      let minLen = this.tree.minBranchLength || 10;
      if (childLen < minLen) return;

      let nextThickness = this.maxThickness * this.tree.thicknessDecay;
      let childId = this.branchId * 4 + slot;
      let childNode = new BranchNode(this.tree, childLen, nextThickness, finalAngle, childId, this.depth - 1, this.level + 1, this);
      
      this.children.push(childNode);
      
      if (slot === 0) {
        this.firstSproutedTime = this.tree.animationTime;
      }
    }
    
    isSubtreeFinished() {
      if (this.currentLen < this.maxLen) return false;
      
      let isLastLevel = (this.level >= this.terminalLevel);
      let currentShape = this.tree.getEffectiveLeafShape();
      let leafCfg = (typeof LEAF_TYPE_CONFIGS !== 'undefined' && LEAF_TYPE_CONFIGS[currentShape]) ? LEAF_TYPE_CONFIGS[currentShape] : null;
      let startLevel = (leafCfg && typeof leafCfg.sideLeafStartLevel === 'number') ? leafCfg.sideLeafStartLevel : 5;
      if (this.level >= startLevel && !isLastLevel) {
        if (this.sideLeafTimer < 1.0) return false;
      }
      
      if (this.level < this.terminalLevel) {
        for (let i = 0; i < this.maxSequentialBranches; i++) {
          if (!this.slotSprouted[i]) return false;
        }
      }
      
      for (let child of this.children) {
        if (!child.isSubtreeFinished()) return false;
      }
      return true;
    }
    
    getTreeGrowthProgress() {
      let currentLenTotal = this.currentLen;
      let maxLenTotal = this.maxLen;

      for (let child of this.children) {
        let childProgress = child.getTreeGrowthProgress();
        currentLenTotal += childProgress.current;
        maxLenTotal += childProgress.target;
      }

      return { current: currentLenTotal, target: maxLenTotal };
    }

    drawRootButtress(d_base, d_tip, w_base, w_tip) {
      let progress = constrain(this.currentLen / Math.max(1, this.maxLen), 0, 1);
      let growthFactor = Math.max(0.18, Math.pow(progress, 0.85));

      // 1. Thân chính với ĐÁY PHẲNG NGANG TẠI Y = 0 (loại bỏ hoàn toàn hình tròn cụt ở gốc)
      beginShape();
      vertex(-w_base, 0);
      vertex(-w_tip, -this.currentLen);
      vertex(w_tip, -this.currentLen);
      vertex(w_base, 0);
      endShape(CLOSE);

      // Đỉnh ngọn đốt thân chính nối khớp với các cành con
      ellipse(0, -this.currentLen, d_tip, d_tip);

      // 2. Hai tam giác nhọn sang 2 bên tạo bạnh gốc, các cạnh uốn theo đường cong Bezier lõm vào trong
      let h_flare = Math.min(this.currentLen * 0.32, d_base * 0.95) * growthFactor;
      let t_h = this.currentLen > 0 ? (h_flare / this.currentLen) : 0;
      let w_at_h = w_base + (w_tip - w_base) * t_h;
      let flare_reach = w_base * 0.45 * growthFactor;

      // Tam giác bạnh gốc bên trái: đỉnh bám trên thân, cạnh ngoài uốn cong Bezier lõm vào trong đến mũi nhọn tiếp đất, đáy phẳng ngang về gốc
      beginShape();
      vertex(-w_at_h, -h_flare);
      quadraticVertex(-w_base * 0.92, -h_flare * 0.22, -w_base - flare_reach, 0);
      vertex(-w_base, 0);
      endShape(CLOSE);

      // Tam giác bạnh gốc bên phải: đỉnh bám trên thân, cạnh ngoài uốn cong Bezier lõm vào trong đến mũi nhọn tiếp đất, đáy phẳng ngang về gốc
      beginShape();
      vertex(w_at_h, -h_flare);
      quadraticVertex(w_base * 0.92, -h_flare * 0.22, w_base + flare_reach, 0);
      vertex(w_base, 0);
      endShape(CLOSE);

      // 3. Rễ trồi phụ: Ngẫu nhiên 1 hoặc 2 rễ, nối vào từ vị trí 1/2 (giữa thân cây), góc thò ra khoảng 35 độ
      let seed = (this.tree && typeof this.tree.seed === 'number') ? this.tree.seed : 42;
      let numSubRoots = (hashRand(seed, 701) > 0.5) ? 2 : 1; // Ngẫu nhiên 1 hoặc 2 rễ trồi phụ
      let showRight = (numSubRoots === 2) || (hashRand(seed, 704) > 0.5);
      let showLeft = (numSubRoots === 2) || (!showRight);

      let sub_h = h_flare * 0.85; // Chiều cao bám thân cao hơn để rễ dày dặn
      let sub_reach = flare_reach * 1.05;

      // Rễ trồi phụ 1 (bên phải nếu được chọn): Xuất phát từ giữa thân cây (1/2 bán kính gốc), góc tam giác mở to và dày dặn
      if (showRight) {
        let tiltAngleDeg_R = 35 + (hashRand(seed, 702) - 0.5) * 4; // Góc nghiêng khoảng 35 độ
        let tiltRad_R = tiltAngleDeg_R * Math.PI / 180;
        let subStartX_R = w_base * 0.5; // Vị trí 1/2 giữa thân cây
        let subBaseInnerX_R = w_base * 0.25; // Mở rộng đáy tam giác vào trong để rễ cây to dày
        let subEndX_R = subStartX_R + sub_reach * Math.cos(tiltRad_R);
        let subEndY_R = sub_reach * Math.sin(tiltRad_R);

        beginShape();
        vertex(w_at_h * 0.52, -sub_h);
        quadraticVertex(subStartX_R + sub_reach * 0.20, -sub_h * 0.18, subEndX_R, subEndY_R);
        quadraticVertex(subStartX_R * 0.75, subEndY_R * 0.35, subBaseInnerX_R, 0);
        endShape(CLOSE);
      }

      // Rễ trồi phụ 2 (bên trái nếu được chọn): Xuất phát từ giữa thân cây (1/2 bán kính gốc), góc tam giác mở to và dày dặn
      if (showLeft) {
        let tiltAngleDeg_L = 35 + (hashRand(seed, 703) - 0.5) * 4; // Góc nghiêng khoảng 35 độ
        let tiltRad_L = tiltAngleDeg_L * Math.PI / 180;
        let subStartX_L = -w_base * 0.5; // Vị trí 1/2 giữa thân cây
        let subBaseInnerX_L = -w_base * 0.25; // Mở rộng đáy tam giác vào trong để rễ cây to dày
        let subEndX_L = subStartX_L - sub_reach * Math.cos(tiltRad_L);
        let subEndY_L = sub_reach * Math.sin(tiltRad_L);

        beginShape();
        vertex(subBaseInnerX_L, 0);
        quadraticVertex(subStartX_L * 0.75, subEndY_L * 0.35, subEndX_L, subEndY_L);
        quadraticVertex(subStartX_L - sub_reach * 0.20, -sub_h * 0.18, -w_at_h * 0.52, -sub_h);
        endShape(CLOSE);
      }
    }

    draw(time) {
      push();
      
      let swayAngle = 0;
      if (this.tree.windStrength > 0 && this.level > 0) {
        swayAngle = sin(time + this.depth * 0.4) * (this.tree.windStrength * 0.006) * (this.tree.maxDepth - this.depth + 1);
      }
      
      let renderAngle = this.angle;
      rotate(renderAngle + swayAngle);

      this.tree.setBranchGradient(this.depth, this.currentLen);
      noStroke();

      let d_base = this.maxDrawnThickness;
      let d_tip;
      if (this.children.length > 0) {
        let maxChildThickness = 0;
        for (let child of this.children) {
          maxChildThickness = max(maxChildThickness, child.maxDrawnThickness);
        }
        d_tip = max(maxChildThickness, 1.0);
      } else {
        // Taper tip to 1.2px when unbranched to fit slender leaf petiole
        d_tip = 1.2;
      }

      let w_base = d_base / 2;
      let w_tip = d_tip / 2;

      if (this.level === 0) {
        // Gốc thân chính: Vẽ bạnh gốc loe mềm mại & 3-5 rễ trồi gân guốc bám đất tự nhiên
        this.drawRootButtress(d_base, d_tip, w_base, w_tip);
      } else {
        ellipse(0, 0, d_base, d_base);
        ellipse(0, -this.currentLen, d_tip, d_tip);

        beginShape();
        vertex(-w_base, 0);
        vertex(-w_tip, -this.currentLen);
        vertex(w_tip, -this.currentLen);
        vertex(w_base, 0);
        endShape(CLOSE);
      }
      
      let currentShape = this.tree.getEffectiveLeafShape();
      let leafCfg = (typeof LEAF_TYPE_CONFIGS !== 'undefined' && LEAF_TYPE_CONFIGS[currentShape]) ? LEAF_TYPE_CONFIGS[currentShape] : null;
      let startLevel = (leafCfg && typeof leafCfg.sideLeafStartLevel === 'number') ? leafCfg.sideLeafStartLevel : 5;
      let isLastLevel = (this.level >= this.terminalLevel);
      if (this.level >= startLevel && !isLastLevel && currentShape !== 'willow' && this.sideLeafConfigs && this.sideLeafConfigs.length > 0) {
        let progress = this.currentLen / this.maxLen;
        if (progress > 0.3) {
          for (let config of this.sideLeafConfigs) {
            let t = config.isEarlyLeaf ? map(progress, 0.3, 0.9, 0, 1, true) : map(this.sideLeafTimer, 0, 1.0, 0, 1, true);
            
            if (t > 0) {
              let stemLength = this.tree.initLength * Math.pow(this.tree.lengthDecay, this.terminalLevel);
              let currentStemLen = stemLength * config.lenMultiplier * Math.max(0.3, t);
              let leafScale = lerp(0.45, 1.0, t);
              
              push();
              translate(0, -this.currentLen * config.ratio);
              rotate(config.angle);
              
              let stemColor = this.tree.getBranchColorAtDepth(this.depth);
              stroke(stemColor);
              strokeWeight(d_tip * 0.4);
              line(0, 0, 0, -currentStemLen);
              noStroke();
              
              translate(0, -currentStemLen);
              if (leafScale > 0) {
                push();
                scale(leafScale * this.leafScaleFactor * 1.35);
                this.tree.drawSingleLeaf(config.id, 1.0, this.depth, time, false, false, this.gravityLocalAngle, t);
                pop();
              }
              pop();
            }
          }
        }
      }

      translate(0, -this.currentLen);
      if (this.tree.treeType === 'sequential' && this.tipLeanAngle) {
        rotate(this.tipLeanAngle);
      }

        let progress = this.currentLen / this.maxLen;
        isLastLevel = (this.level >= this.terminalLevel) || (this.children.length === 0);
        if (isLastLevel) {
          if (this.leavesProgress > 0) {
            push();
            scale(this.leavesProgress * this.leafScaleFactor);
            this.tree.drawLeafAtTip(this.branchId, true, this.depth, time, this.gravityLocalAngle, progress);
            pop();
          }
        } else {
          if (this.leavesProgress > 0 && this.sproutLeafItems) {
              let leftAngle = this.sproutLeftAngle;
              let rightAngle = this.sproutRightAngle;
              let midAngle = this.sproutMidAngle;
              let leafItems = this.sproutLeafItems;

              // Use tree.animationTime for simulation age, while using time argument for wind sway
              let simTime = (this.tree && typeof this.tree.animationTime === 'number') ? this.tree.animationTime : time;
              let elapsedSinceFull = Math.max(0, simTime - this.lenFullTime);

              // Measure exact World/Screen coordinates of current branch tip (canvas origin is at tip)
              let m = drawingContext.getTransform();
              let worldAngle = Math.atan2(m.b, m.a);

              let maxD = Math.max(this.tree.maxDepth || 6, 1);
              let levelRatio = constrain(this.level / maxD, 0, 1);
              // Sprout leaves scale smoothly from 2.0x at root to 0.8x at top tips
              let sproutSizeMultiplier = lerp(2.0, 0.8, levelRatio);

              let drawL = false, drawM = false, drawR = false;

              if (simTime < this.lenFullTime) {
                // Stage 1: Primary Branch Elongation
                // First 30% of branch length -> leaf grows 0 to 50% size
                // Remaining 70% of branch length -> leaf grows 50% to 100% size
                let p = constrain(this.leavesProgress, 0, 1);
                let sproutScale;
                if (p <= 0.30) {
                  sproutScale = 0.50 * Math.pow(p / 0.30, 0.7);
                } else {
                  sproutScale = lerp(0.50, 1.00, (p - 0.30) / 0.70);
                }

                push();
                scale(sproutScale * sproutSizeMultiplier);
                for (let item of leafItems) {
                  push();
                  rotate(item.angle);
                  this.tree.drawSingleLeaf(item.id, 1.0, this.depth, time, false, true, this.gravityLocalAngle, p);
                  pop();
                }
                pop();
              } else if (this.tree.persistentLeaves === true) {
                // Persistent foliage mode (opt-in only): leaves remain firmly attached and vibrant on all branches
                for (let item of leafItems) {
                  push();
                  scale(1.00 * sproutSizeMultiplier);
                  rotate(item.angle);
                  this.tree.drawSingleLeaf(item.id, 1.0, this.depth, time, false, true, this.gravityLocalAngle, 1.0);
                  pop();
                }
              } else {
                // Stage 2: Maturing & Staggered Falling stage
                let maxBudget = (currentShape === 'single_needle')
                  ? (this.tree.maxFallingLeaflets !== undefined ? this.tree.maxFallingLeaflets : 75)
                  : (this.tree.maxFallingLeaves !== undefined ? this.tree.maxFallingLeaves : 45);

                // User Rule: DO NOT apply Stochastic Branch Sampling when active falling count is below 70% threshold!
                // Early growth stages allow all new sprout leaves to fall naturally; throttling only activates under heavy load.
                let throttleThreshold = maxBudget * 0.70;
                let isUnderHeavyLoad = ((this.tree.prevActiveFallingCount || 0) >= throttleThreshold) ||
                                       ((this.tree.activeFallingCount || 0) >= throttleThreshold);

                let passesSampling = !isUnderHeavyLoad ||
                  (hashRand(this.branchId, 88) < (this.tree.fallBranchProbability !== undefined ? this.tree.fallBranchProbability : 0.35));

                let branchCanDropLeaves = !isUnderHeavyLoad || (this.level <= 5 && passesSampling);

                // 1. Quá trình rơi của từng lá chét nhỏ đối với lá me (single_needle)
                if (currentShape === 'single_needle' && branchCanDropLeaves) {
                  for (let item of leafItems) {
                    if (item.tamarindLeaflets) {
                      for (let leaflet of item.tamarindLeaflets) {
                        if (elapsedSinceFull >= leaflet.fallDelay) {
                          let t_f = elapsedSinceFull - leaflet.fallDelay;
                          let canvasH = (typeof height !== 'undefined' && height > 0) ? height : (typeof window !== 'undefined' ? window.innerHeight : 800);
                          let distToBottom = Math.max(150, canvasH - m.f + 30); // Rơi qua mép màn hình 30px chạm đất
                          let tau_fall = Math.max(2.0, distToBottom / 100.0);   // Thời gian rơi thong thả đến tận đất

                          if (t_f < tau_fall && (this.tree.activeFallingCount < maxBudget)) {
                            this.tree.activeFallingCount++;
                            let fallProgress = t_f / tau_fall;
                            let fallY = distToBottom * fallProgress;

                            let spinAmp = 12.0 + hashRand(leaflet.id, 93) * 16.0;
                            let fallX = sin(t_f * 3.2 + leaflet.id * 5.1) * spinAmp * Math.sin(fallProgress * Math.PI);
                            let localX = fallX * Math.cos(worldAngle) + fallY * Math.sin(worldAngle);
                            let localY = -fallX * Math.sin(worldAngle) + fallY * Math.cos(worldAngle);

                            let spinDir = (hashRand(leaflet.id, 91) > 0.5 ? 1 : -1);
                            let spinSpeed = (0.8 + hashRand(leaflet.id, 92) * 1.5) * spinDir;
                            let currentAngle = item.angle + t_f * spinSpeed;

                            push();
                            drawingContext.save();
                            let alphaVal = (fallProgress > 0.92) ? map(fallProgress, 0.92, 1.0, 1.0, 0.0, true) : 1.0;
                            drawingContext.globalAlpha = Math.max(0, alphaVal);
                            translate(localX, localY);
                            rotate(currentAngle);
                            scale(1.00 * sproutSizeMultiplier);
                            this.tree.drawSingleTamarindLeaflet(item.id, leaflet.pairIdx, leaflet.side);
                            drawingContext.restore();
                            pop();
                          }
                        }
                      }
                    }
                  }
                }

                // 2. Quá trình rơi nguyên chiếc lá cho các loại lá thông thường khác
                if (currentShape !== 'willow' && currentShape !== 'single_needle' && branchCanDropLeaves) {
                  for (let item of leafItems) {
                    if (elapsedSinceFull >= item.delay) {
                      let t_f = elapsedSinceFull - item.delay;
                      let canvasH = (typeof height !== 'undefined' && height > 0) ? height : (typeof window !== 'undefined' ? window.innerHeight : 800);
                      let distToBottom = Math.max(150, canvasH - m.f + 30); // Rơi qua mép màn hình 30px chạm đất
                      let tau_fall = Math.max(2.0, distToBottom / 100.0);   // Thời gian rơi thong thả đến tận đất

                      if (t_f < tau_fall && (this.tree.activeFallingCount < maxBudget)) {
                        this.tree.activeFallingCount++;
                        let fallProgress = t_f / tau_fall;
                        let fallY = distToBottom * fallProgress;

                        let spinAmp = 12.0 + hashRand(item.id, 93) * 18.0;
                        let fallX = sin(t_f * 3.2 + item.id * 5.1) * spinAmp * Math.sin(fallProgress * Math.PI);
                        let localX = fallX * Math.cos(worldAngle) + fallY * Math.sin(worldAngle);
                        let localY = -fallX * Math.sin(worldAngle) + fallY * Math.cos(worldAngle);

                        let spinDir = (hashRand(item.id, 91) > 0.5 ? 1 : -1);
                        let spinSpeed = (0.6 + hashRand(item.id, 92) * 1.4) * spinDir;
                        let currentAngle = item.angle + t_f * spinSpeed;

                        push();
                        drawingContext.save();
                        let alphaVal = (fallProgress > 0.92) ? map(fallProgress, 0.92, 1.0, 1.0, 0.0, true) : 1.0;
                        drawingContext.globalAlpha = Math.max(0, alphaVal);
                        translate(localX, localY);
                        rotate(currentAngle);
                        scale(1.00 * sproutSizeMultiplier);
                        this.tree.drawSingleLeaf(item.id, 1.0, this.depth, time, false, false, this.gravityLocalAngle, 1.0);
                        drawingContext.restore();
                        pop();
                      }
                    }
                  }
                }

                // 3. Chuẩn bị mặt nạ lá chét còn đính trên cuống cho lá me
                let activeLeafletsMap = null;
                if (currentShape === 'single_needle') {
                  activeLeafletsMap = {};
                  for (let item of leafItems) {
                    let visibleSet = new Set();
                    if (item.tamarindLeaflets) {
                      for (let leaflet of item.tamarindLeaflets) {
                        if (elapsedSinceFull < leaflet.fallDelay) {
                          visibleSet.add(leaflet.side + '_' + leaflet.pairIdx);
                        }
                      }
                    } else {
                      for (let i = 0; i < 7; i++) {
                        visibleSet.add('L_' + i);
                        visibleSet.add('R_' + i);
                      }
                    }
                    activeLeafletsMap[item.id] = visibleSet;
                  }
                }

                // 4. Vẽ các chùm lá còn đính trên cành với hiệu ứng mờ dần (fade-out 2.5s) trước khi biến mất
                for (let item of leafItems) {
                  if (elapsedSinceFull < item.delay) {
                    let isWillow = (currentShape === 'willow');
                    let isTamarind = (currentShape === 'single_needle');
                    let remainingTime = item.delay - elapsedSinceFull;
                    let fadeTime = 2.5;
                    let alphaVal = ((isWillow || isTamarind) && remainingTime < fadeTime) ? map(remainingTime, 0, fadeTime, 0.0, 1.0, true) : 1.0;

                    let visibleLeaflets = (activeLeafletsMap && activeLeafletsMap[item.id]) ? activeLeafletsMap[item.id] : null;

                    push();
                    if (alphaVal < 0.99 && typeof drawingContext !== 'undefined' && drawingContext) {
                      drawingContext.save();
                      drawingContext.globalAlpha = Math.max(0, alphaVal);
                      scale(1.00 * sproutSizeMultiplier);
                      rotate(item.angle);
                      this.tree.drawSingleLeaf(item.id, 1.0, this.depth, time, false, true, this.gravityLocalAngle, 1.0, visibleLeaflets);
                      drawingContext.restore();
                    } else {
                      scale(1.00 * sproutSizeMultiplier);
                      rotate(item.angle);
                      this.tree.drawSingleLeaf(item.id, 1.0, this.depth, time, false, true, this.gravityLocalAngle, 1.0, visibleLeaflets);
                    }
                    pop();
                  }
                }
              }
            }
          }

      for (let child of this.children) {
        child.draw(time);
      }
      
      pop();
    }
  }

  class FractalBranchTree {
    constructor(params = {}) {
      this.initLength = 200;
      this.branchAngle = 20;
      this.lengthDecay = 0.75;
      this.initThickness = 30;
      this.thicknessDecay = 0.66;
      this.maxDepth = 9;
      this.treeVariation = 0.80;
      this.leafType = 'emerald';
      this.leafShape = 'auto';
      this.windStrength = 1.0;
      this.colorTheme = 'cyberpunk';
      this.seed = Math.floor(Math.random() * 1000000);
      this.physicsWorld = (typeof VerletJS !== 'undefined') ? new VerletJS({ gravity: { x: 0, y: 0.35 }, friction: 0.98 }) : null;

      // Particle / Falling Leaf Concurrency Budget
      this.maxFallingLeaves = 45;
      this.maxFallingLeaflets = 75;
      this.fallBranchProbability = 0.35;
      this.activeFallingCount = 0;
      this.prevActiveFallingCount = 0;
      this.isDark = true;

      this.setParams(params);
      this.rebuild();
    }

    setParams(params = {}) {
      if (params.initLength !== undefined && !isNaN(params.initLength)) this.initLength = params.initLength;
      if (params.branchAngle !== undefined && !isNaN(params.branchAngle)) this.branchAngle = params.branchAngle;
      if (params.lengthDecay !== undefined && !isNaN(params.lengthDecay)) this.lengthDecay = params.lengthDecay;
      if (params.initThickness !== undefined && !isNaN(params.initThickness)) this.initThickness = params.initThickness;
      if (params.thicknessDecay !== undefined && !isNaN(params.thicknessDecay)) this.thicknessDecay = params.thicknessDecay;
      if (params.maxDepth !== undefined && !isNaN(params.maxDepth)) this.maxDepth = params.maxDepth;
      if (params.minBranchLength !== undefined && !isNaN(params.minBranchLength)) this.minBranchLength = params.minBranchLength;
      if (params.treeVariation !== undefined && !isNaN(params.treeVariation)) this.treeVariation = params.treeVariation;
      if (params.leafType !== undefined && params.leafType) this.leafType = params.leafType;
      if (params.leafShape !== undefined && params.leafShape) this.leafShape = params.leafShape;
      if (params.treeType !== undefined && params.treeType) this.treeType = params.treeType;
      if (params.windStrength !== undefined && !isNaN(params.windStrength)) this.windStrength = params.windStrength;
      if (params.colorTheme !== undefined && params.colorTheme) this.colorTheme = params.colorTheme;
      if (params.seed !== undefined && !isNaN(params.seed)) this.seed = params.seed;
      if (params.maxFallingLeaves !== undefined && !isNaN(params.maxFallingLeaves)) this.maxFallingLeaves = params.maxFallingLeaves;
      if (params.maxFallingLeaflets !== undefined && !isNaN(params.maxFallingLeaflets)) this.maxFallingLeaflets = params.maxFallingLeaflets;
      if (params.fallBranchProbability !== undefined && !isNaN(params.fallBranchProbability)) this.fallBranchProbability = params.fallBranchProbability;
      if (params.isDark !== undefined) this.isDark = Boolean(params.isDark);
    }

    rebuild() {
      if (this.willowChains) this.willowChains.clear();
      let colorHash = (Math.abs(Math.sin(this.seed * 19.87 + 4.56)) * 1000) % 1;
      if (colorHash < 0.05) {
        this.treeFlowerColor = 'purple';
      } else if (colorHash < 0.525) {
        this.treeFlowerColor = 'red';
      } else {
        this.treeFlowerColor = 'yellow';
      }

      noiseSeed(this.seed);
      randomSeed(this.seed);

      // Create initial tree hierarchy
      this.root = new BranchNode(this, this.initLength, 30, 0, 1, this.maxDepth, 0);

      // Pre-measure geometry bounding box
      let bounds = this.root.measureGeometry(0, 0, 0);
      this.treeBounds = bounds;
      let treeH = Math.abs(bounds.minY);
      let treeW = bounds.maxX - bounds.minX;
      let treeScale = 0.65 * treeH + 0.35 * (treeW / 2);

      // Calculate golden ratio proportional root thickness (scaled down 20%) with direct +-20% random variation
      let autoThickness = treeScale * 0.092;
      let thicknessNoise = noise(this.seed * 0.317 + 88.4);
      let noiseFactor = 1.0 + (thicknessNoise - 0.5) * 2 * 0.20 * Math.max(0.5, this.treeVariation);
      autoThickness *= noiseFactor;

      autoThickness = constrain(autoThickness, treeH * 0.05, treeH * 0.14);
      autoThickness = max(8, autoThickness);

      this.initThickness = autoThickness;
      this.root.maxThickness = autoThickness;
      this.root.applyAutoThickness();

      let targetTreeScale = 320;
      this.autoScaleFactor = targetTreeScale / Math.max(100, treeScale);

      let rawBaseY = bounds.maxY;
      let offsetFromTrunkBase = -rawBaseY;

      this.rootYOffset = offsetFromTrunkBase * this.autoScaleFactor;

      this.animationTime = 0;
      this.totalGrowthTime = this.root ? this.root.calculateTimeline(0) : 5.0;
      if (this.root) {
        this.root.updateTime(0, this.totalGrowthTime);
      }
    }

    getTotalGrowthTime() {
      return this.totalGrowthTime || 5.0;
    }

    getOrCreateWillowChain(leafId, originWorldPos, targetSegments, segmentLength = 3.5, petioleWorldAngle = -Math.PI / 2) {
      if (!this.willowChains) this.willowChains = new Map();
      let chain = this.willowChains.get(leafId);

      if (!chain) {
        chain = {
          particles: [],
          constraints: [],
          targetSegments: targetSegments,
          segmentLength: segmentLength,
          lastPinPos: { x: originWorldPos.x, y: originWorldPos.y }
        };

        // Construct initial structural arching profile:
        // First 30% of strand emerges along petioleWorldAngle (cong vồng lên), then smoothly arches down to screen ground (+Y)
        let currPos = { x: originWorldPos.x, y: originWorldPos.y };
        let prev = null;

        for (let i = 0; i <= targetSegments; i++) {
          let t = i / targetSegments;
          let archBlend = Math.pow(t, 0.7);
          let groundAngle = Math.PI / 2; // Screen ground down (+Y)
          let segAngle = (t <= 0.3) ? petioleWorldAngle : (petioleWorldAngle * (1 - archBlend) + groundAngle * archBlend);

          let px = (i === 0) ? originWorldPos.x : (currPos.x + Math.cos(segAngle) * segmentLength);
          let py = (i === 0) ? originWorldPos.y : (currPos.y + Math.sin(segAngle) * segmentLength);
          currPos = { x: px, y: py };

          let p = (typeof VerletJS !== 'undefined') ? new VerletJS.Particle({ x: px, y: py }) : { pos: { x: px, y: py }, lastPos: { x: px, y: py }, pinned: i === 0 };

          if (i === 0 && p.pin) p.pin(originWorldPos);
          chain.particles.push(p);

          if (prev && typeof VerletJS !== 'undefined') {
            chain.constraints.push(new VerletJS.DistanceConstraint(prev, p, 0.98, segmentLength));
          }
          prev = p;
        }

        // Add High Structural Stiffness AngleConstraints (Cong vồng lên & Giữ phom dáng cứng cáp)
        if (typeof VerletJS !== 'undefined') {
          for (let i = 1; i < chain.particles.length - 1; i++) {
            let t = i / targetSegments;
            // Structural stiffness (0.82) at root arch, 0.35 towards tip
            let stiffness = 0.82 * Math.exp(-t * 1.7) + 0.35;
            chain.constraints.push(new VerletJS.AngleConstraint(
              chain.particles[i - 1],
              chain.particles[i],
              chain.particles[i + 1],
              stiffness
            ));
          }
        }

        this.willowChains.set(leafId, chain);
      }

      return chain;
    }

    update(dt) {
      if (!this.root) return;
      this.animationTime += dt;
      this.root.updateTime(this.animationTime, this.totalGrowthTime);

      if (this.physicsWorld) {
        let windX = Math.sin(this.animationTime * 1.5) * (this.windStrength * 0.05);
        this.physicsWorld.setWind(windX, 0);
        this.physicsWorld.step(dt || 1.0);
      }

      if (this.willowChains && typeof VerletJS !== 'undefined') {
        let timeVal = this.animationTime;
        let windMult = (this.windStrength !== undefined) ? this.windStrength : 1.0;
        let stepCoef = dt || 1.0;

        for (let [leafId, chain] of this.willowChains.entries()) {
          // 1. Verlet position integration with high structural stiffness & damped wind
          for (let i = 0; i < chain.particles.length; i++) {
            let p = chain.particles[i];
            if (p.pinned) {
              if (p.pinPos) p.pos.set(p.pinPos.x, p.pinPos.y);
              continue;
            }

            let t = i / chain.targetSegments;
            let velX = (p.pos.x - p.lastPos.x) * 0.92; // Velocity damping (0.92) for natural firmness
            let velY = (p.pos.y - p.lastPos.y) * 0.92;

            let gravityY = 0.22; // Natural downward gravity pull
            let windWaveX = Math.sin(timeVal * 1.8 - i * 0.10 + leafId) * (windMult * 0.035) * t;

            p.lastPos.set(p.pos.x, p.pos.y);
            p.pos.x += velX + windWaveX * stepCoef;
            p.pos.y += velY + gravityY * stepCoef;
          }

          // 2. Relax constraints (Iterative Relaxation Solver: 7 iterations for balanced elasticity)
          for (let iter = 0; iter < 7; iter++) {
            for (let c of chain.constraints) {
              c.relax(stepCoef);
            }
          }
        }
      }
    }

    draw(p, options = {}) {
      if (!this.root) return;
      this.prevActiveFallingCount = this.activeFallingCount;
      this.activeFallingCount = 0;
      if (typeof colorMode === 'function') {
        const mode = typeof RGB !== 'undefined' ? RGB : 'rgb';
        colorMode(mode, 255, 255, 255, 1);
      }
      let time;
      if (typeof p === 'number') {
        time = p;
      } else if (options && options.time !== undefined) {
        time = options.time;
      } else {
        time = frameCount * 0.015;
      }
      if (this.leafType === 'golden') {
        this.drawGoldenCanopyGlow(time);
      }
      this.root.draw(time);
    }

    drawGoldenCanopyGlow(time = 0) {
      if (typeof globalThis !== 'undefined' && globalThis.__fractalBridge) return;
      if (typeof global !== 'undefined' && global.__fractalBridge) return;

      let bounds = this.treeBounds || (this.root ? this.root.measureGeometry(0, 0, 0) : null);
      if (!bounds) return;

      let canopyW = Math.max(80, bounds.maxX - bounds.minX);
      let canopyH = Math.max(80, Math.abs(bounds.minY));
      let cx = (bounds.minX + bounds.maxX) / 2;
      let cy = bounds.minY + canopyH * 0.45;
      let baseR = Math.max(canopyW, canopyH) * 0.52;

      // Gentle rhythmic breathing pulse (tần số thở êm dịu ~3.7 giây một nhịp)
      let breathPulse = 0.5 + 0.5 * Math.sin(time * 1.7);
      let glowR = baseR * (0.92 + 0.16 * breathPulse);
      let alphaMax = 0.25 + 0.22 * breathPulse;

      push();
      noStroke();

      if (typeof drawingContext !== 'undefined' && drawingContext.createRadialGradient) {
        let grad = drawingContext.createRadialGradient(cx, cy, baseR * 0.15, cx, cy, glowR);
        grad.addColorStop(0, `rgba(254, 240, 138, ${alphaMax})`);
        grad.addColorStop(0.45, `rgba(250, 204, 21, ${alphaMax * 0.65})`);
        grad.addColorStop(0.8, `rgba(234, 179, 8, ${alphaMax * 0.22})`);
        grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        drawingContext.fillStyle = grad;
        ellipse(cx, cy, glowR * 2, glowR * 2);
      } else {
        for (let step = 3; step >= 1; step--) {
          let stepRatio = step / 3;
          let rStep = glowR * stepRatio;
          let aStep = alphaMax * (1.1 - stepRatio) * 0.4;
          fill(250, 204, 21, aStep);
          ellipse(cx, cy, rStep * 2, rStep * 2);
        }
      }
      pop();
    }

    isSubtreeFinished() {
      return this.animationTime >= this.getTotalGrowthTime();
    }

    getTreeGrowthProgress() {
      let total = this.getTotalGrowthTime();
      return { current: Math.min(this.animationTime, total), target: total };
    }

    setBranchGradient(depth, branchLen) {
      let progressStart = (this.maxDepth - depth) / this.maxDepth;
      let progressEnd = (this.maxDepth - max(depth - 1, 0)) / this.maxDepth;
      let colStart, colEnd;
      
      switch(this.colorTheme) {
        case 'sakura':
          colStart = lerpColor(color(92, 64, 51), color(244, 143, 177), progressStart);
          colEnd = lerpColor(color(92, 64, 51), color(244, 143, 177), progressEnd);
          break;
        case 'autumn':
          colStart = lerpColor(color(74, 61, 53), color(245, 158, 11), progressStart);
          colEnd = lerpColor(color(74, 61, 53), color(245, 158, 11), progressEnd);
          break;
        case 'emerald':
          colStart = lerpColor(color(74, 59, 44), color(85, 115, 70), progressStart);
          colEnd = lerpColor(color(74, 59, 44), color(85, 115, 70), progressEnd);
          break;
        case 'eucalyptus':
          colStart = lerpColor(color(61, 90, 76), color(168, 202, 184), progressStart);
          colEnd = lerpColor(color(61, 90, 76), color(168, 202, 184), progressEnd);
          break;
        case 'ebony':
          colStart = lerpColor(color(61, 62, 72), color(85, 90, 100), progressStart);
          colEnd = lerpColor(color(61, 62, 72), color(85, 90, 100), progressEnd);
          break;
        case 'birch':
          colStart = lerpColor(color(96, 98, 106), color(230, 235, 242), progressStart);
          colEnd = lerpColor(color(96, 98, 106), color(230, 235, 242), progressEnd);
          break;
        case 'mahogany':
          colStart = lerpColor(color(92, 42, 42), color(175, 70, 50), progressStart);
          colEnd = lerpColor(color(92, 42, 42), color(175, 70, 50), progressEnd);
          break;
        case 'amber':
          colStart = lerpColor(color(88, 58, 34), color(217, 119, 6), progressStart);
          colEnd = lerpColor(color(88, 58, 34), color(217, 119, 6), progressEnd);
          break;
        case 'cyberpunk':
        default:
          colStart = lerpColor(color(63, 50, 116), color(236, 72, 153), progressStart);
          colEnd = lerpColor(color(63, 50, 116), color(236, 72, 153), progressEnd);
          break;
      }

      let ctx = drawingContext;
      let grad = ctx.createLinearGradient(0, 0, 0, -branchLen);
      
      let r1 = (colStart && colStart.levels) ? colStart.levels[0] : (typeof red === 'function' ? red(colStart) : 24);
      let g1 = (colStart && colStart.levels) ? colStart.levels[1] : (typeof green === 'function' ? green(colStart) : 18);
      let b1 = (colStart && colStart.levels) ? colStart.levels[2] : (typeof blue === 'function' ? blue(colStart) : 59);
      let a1 = (colStart && colStart.levels) ? (colStart.levels[3] / 255) : 1;

      let r2 = (colEnd && colEnd.levels) ? colEnd.levels[0] : (typeof red === 'function' ? red(colEnd) : 236);
      let g2 = (colEnd && colEnd.levels) ? colEnd.levels[1] : (typeof green === 'function' ? green(colEnd) : 72);
      let b2 = (colEnd && colEnd.levels) ? colEnd.levels[2] : (typeof blue === 'function' ? blue(colEnd) : 153);
      let a2 = (colEnd && colEnd.levels) ? (colEnd.levels[3] / 255) : 1;

      let startRGBA = `rgba(${r1}, ${g1}, ${b1}, ${a1})`;
      let endRGBA = `rgba(${r2}, ${g2}, ${b2}, ${a2})`;
      
      grad.addColorStop(0, startRGBA);
      grad.addColorStop(1, endRGBA);
      ctx.strokeStyle = grad;
      ctx.fillStyle = grad;
    }

    getBranchColorAtDepth(depth) {
      if (!this._branchColorCache) this._branchColorCache = {};
      let key = `${this.colorTheme}_${depth}_${this.maxDepth}`;
      if (this._branchColorCache[key]) return this._branchColorCache[key];

      let progress = (this.maxDepth - depth) / this.maxDepth;
      let col;
      if (this.colorTheme === 'sakura') {
        col = lerpColor(color(92, 64, 51), color(244, 143, 177), progress);
      } else if (this.colorTheme === 'autumn') {
        col = lerpColor(color(74, 61, 53), color(245, 158, 11), progress);
      } else if (this.colorTheme === 'emerald') {
        col = lerpColor(color(74, 59, 44), color(85, 115, 70), progress);
      } else if (this.colorTheme === 'eucalyptus') {
        col = lerpColor(color(61, 90, 76), color(168, 202, 184), progress);
      } else if (this.colorTheme === 'ebony') {
        col = lerpColor(color(61, 62, 72), color(85, 90, 100), progress);
      } else if (this.colorTheme === 'birch') {
        col = lerpColor(color(96, 98, 106), color(230, 235, 242), progress);
      } else if (this.colorTheme === 'mahogany') {
        col = lerpColor(color(92, 42, 42), color(175, 70, 50), progress);
      } else if (this.colorTheme === 'amber') {
        col = lerpColor(color(88, 58, 34), color(217, 119, 6), progress);
      } else {
        col = lerpColor(color(63, 50, 116), color(236, 72, 153), progress);
      }
      this._branchColorCache[key] = col;
      return col;
    }

    getEffectiveLeafShape() {
      if (this.leafShape && this.leafShape !== 'auto') {
        return this.leafShape;
      }
      switch(this.leafType) {
        case 'eucalyptus': return 'round';
        case 'ginkgo': return 'ginkgo_fan';
        case 'autumn': return 'maple';
        case 'sakura': return 'sakura_leaf';
        case 'frost': return 'needle';
        case 'sunset': return 'maple';
        case 'wisteria': return 'pointed';
        case 'midnight': return 'pointed';
        case 'emerald':
        default: return 'pointed';
      }
    }

    drawPointedLobe(w, h) {
      let ctx = (typeof drawingContext !== 'undefined') ? drawingContext : null;
      if (ctx) {
        if (h < 1.5 || w < 1.0) {
          ctx.fillRect(-w * 0.5, -h, w, h);
          return;
        }
        ctx.save();
        ctx.scale(w, h);
        ctx.fill(LeafPath2DCache.getPointedPath());
        ctx.restore();
        return;
      }
      beginShape();
      vertex(0, 0);
      bezierVertex(-w * 0.7, -h * 0.3, -w * 0.6, -h * 0.8, 0, -h * 1.1);
      bezierVertex(w * 0.6, -h * 0.8, w * 0.7, -h * 0.3, 0, 0);
      endShape(CLOSE);
    }

    drawRhombusLobe(w, h) {
      let ctx = (typeof drawingContext !== 'undefined') ? drawingContext : null;
      if (ctx) {
        if (h < 1.5 || w < 1.0) {
          ctx.fillRect(-w * 0.5, -h, w, h);
          return;
        }
        ctx.save();
        ctx.scale(w, h);
        ctx.fill(LeafPath2DCache.getRhombusPath());
        ctx.restore();
        return;
      }
      beginShape();
      vertex(0, 0);
      vertex(-w * 0.5, -h * 0.55);
      vertex(0, -h * 1.15);
      vertex(w * 0.5, -h * 0.55);
      endShape(CLOSE);
    }

    drawSingleLeafShape(shapeType, baseW = 7, baseH = 14, depth = 0, branchLevel = 1, gravityLocalAngle = Math.PI, progress = 1.0, branchId = 0, visibleLeaflets = null) {
      let ctx = (typeof drawingContext !== 'undefined') ? drawingContext : null;

      // LOD check for micro-leaves at high depths
      if (ctx && (baseH < 1.5 || baseW < 1.0) && shapeType !== 'needle') {
        ctx.fillRect(-baseW * 0.5, -baseH, baseW, baseH);
        return;
      }

      if (shapeType === 'pointed') {
        this.drawPointedLobe(baseW, baseH);
      } else if (shapeType === 'needle') {
        // 7-Needle Fan Pine Cluster (Lá thông 7 chân xòe quạt)
        let strokeCol;
        if (typeof drawingContext !== 'undefined' && typeof drawingContext.fillStyle === 'string') {
          strokeCol = drawingContext.fillStyle;
        } else {
          strokeCol = color(50, 200, 150);
        }
        noStroke();
        fill(strokeCol);

        // 7 Pine needles radiating symmetrically like a fan from petiole origin (0, 0)
        // Mỗi kim là một lưỡi kim thanh mảnh vuốt nhọn dần về đầu kim (độ dày gốc ~1.4px)
        const needlePoints = [
          [-baseW * 0.89, -baseH * 0.16],  // Kim 1 (ngoài cùng trái -70 deg)
          [-baseW * 1.18, -baseH * 0.55],  // Kim 2 (ngoài trái -47 deg)
          [-baseW * 0.81, -baseH * 1.00],  // Kim 3 (giữa trái -22 deg)
          [0, -baseH * 1.35],              // Kim 4 (đỉnh trung tâm 0 deg)
          [baseW * 0.81, -baseH * 1.00],   // Kim 5 (giữa phải +22 deg)
          [baseW * 1.18, -baseH * 0.55],   // Kim 6 (ngoài phải +47 deg)
          [baseW * 0.89, -baseH * 0.16]    // Kim 7 (ngoài cùng phải +70 deg)
        ];

        for (let j = 0; j < needlePoints.length; j++) {
          let tx = needlePoints[j][0];
          let ty = needlePoints[j][1];
          let dist = Math.hypot(tx, ty) || 1;
          let nx = (-ty / dist) * 0.7;
          let ny = (tx / dist) * 0.7;

          beginShape();
          vertex(-nx, -ny);
          vertex(tx, ty);
          vertex(nx, ny);
          endShape(CLOSE);
        }

        // Petiole sheath cap at base (0, 0)
        ellipse(0, 0, 1.8, 1.8);
      } else if (shapeType === 'maple') {
        // Redrawn 7-Lobe Composite Maple Leaf (Lá Phong 7 thùy đỉnh nhọn): Radiating from petiole origin (0, 0)
        let w = baseW * 1.4;
        let h = baseH * 1.4;

        // 1. Central Peak Lobe (1 thùy đỉnh chĩa thẳng lên trên)
        this.drawPointedLobe(w * 0.75, h * 1.1);

        // 2. Upper Shoulder Lobes (2 thùy vai chĩa nghiêng lên 2 bên +-40 deg)
        push();
        rotate(radians(-40));
        this.drawPointedLobe(w * 0.70, h * 1.0);
        pop();

        push();
        rotate(radians(40));
        this.drawPointedLobe(w * 0.70, h * 1.0);
        pop();

        // 3. Side Horizontal Lobes (2 thùy ngang nhỏ hơn chĩa sang 2 bên +-80 deg)
        push();
        rotate(radians(-80));
        this.drawPointedLobe(w * 0.55, h * 0.80);
        pop();

        push();
        rotate(radians(80));
        this.drawPointedLobe(w * 0.55, h * 0.80);
        pop();

        // 4. Rear Lobes (2 thùy sau nhỏ hơn nữa chĩa ra đằng sau +-135 deg)
        push();
        rotate(radians(-135));
        this.drawPointedLobe(w * 0.40, h * 0.55);
        pop();

        push();
        rotate(radians(135));
        this.drawPointedLobe(w * 0.40, h * 0.55);
        pop();
      } else if (shapeType === 'maple5') {
        // 7-Lobe Rhombus Maple Leaf (Lá Phong 7 thùy hình thoi xòe quạt)
        let w = baseW * 1.4;
        let h = baseH * 1.4;

        // 1. Central Top Rhombus Lobe (1 thùy chính đỉnh chĩa thẳng 0 deg)
        this.drawRhombusLobe(w * 0.80, h * 1.15);

        // 2. Upper Side Rhombus Lobes (2 thùy vai nghiêng 2 bên +-38 deg)
        push();
        rotate(radians(-38));
        this.drawRhombusLobe(w * 0.70, h * 0.95);
        pop();

        push();
        rotate(radians(38));
        this.drawRhombusLobe(w * 0.70, h * 0.95);
        pop();

        // 3. Lower Side Rhombus Lobes (2 thùy dưới nghiêng +-78 deg)
        push();
        rotate(radians(-78));
        this.drawRhombusLobe(w * 0.44, h * 0.60);
        pop();

        push();
        rotate(radians(78));
        this.drawRhombusLobe(w * 0.44, h * 0.60);
        pop();

        // 4. Rear Base Lobes (1 cặp thùy sát gốc +-128 deg, dài bằng 33% thùy chính)
        push();
        rotate(radians(-128));
        this.drawRhombusLobe(w * 0.41, h * 0.38);
        pop();

        push();
        rotate(radians(128));
        this.drawRhombusLobe(w * 0.41, h * 0.38);
        pop();
      } else if (shapeType === 'ginkgo_fan') {
        if (ctx) {
          let s = baseH * 0.868;
          ctx.save();
          ctx.scale(s, s);
          ctx.fill(LeafPath2DCache.getGinkgoPath());
          ctx.restore();
        } else {
          // Fallback
          let totalTriangles = 4;
          let baseLen = baseH * 0.868;
          let triangles = [
            { center: -57.5, left: -75.0, right: -40.0 },
            { center: -20.5, left: -38.0, right: -3.0 },
            { center: 20.5,  left: 3.0,   right: 38.0 },
            { center: 57.5,  left: 40.0,  right: 75.0 }
          ];
          for (let k = 0; k < totalTriangles; k++) {
            let tInfo = triangles[k];
            let aCenter = radians(tInfo.center);
            let aLeft = radians(tInfo.left);
            let aRight = radians(tInfo.right);
            let envelopeFactor = Math.cos(radians(tInfo.center) * 0.45);
            let triLen = baseLen * (0.78 + 0.22 * envelopeFactor);
            let aSideL = aLeft - radians(2.0);
            let x_sideL = sin(aSideL) * triLen * 0.48;
            let y_sideL = -cos(aSideL) * triLen * 0.48;
            let cp1L_x = sin(aLeft) * triLen * 0.22;
            let cp1L_y = -cos(aLeft) * triLen * 0.22;
            let cp2L_x = sin(aSideL) * triLen * 0.38;
            let cp2L_y = -cos(aSideL) * triLen * 0.38;
            let x_cornerL_c1 = sin(aLeft - radians(6.0)) * triLen * 0.85;
            let y_cornerL_c1 = -cos(aLeft - radians(6.0)) * triLen * 0.85;
            let aBaseL = aLeft + radians(11.5);
            let x_baseL = sin(aBaseL) * triLen * 0.95;
            let y_baseL = -cos(aBaseL) * triLen * 0.95;
            let x_cornerL_c2 = sin(aLeft + radians(3.0)) * triLen * 1.14;
            let y_cornerL_c2 = -cos(aLeft + radians(3.0)) * triLen * 1.14;
            let aSideR = aRight + radians(2.0);
            let x_sideR = sin(aSideR) * triLen * 0.48;
            let y_sideR = -cos(aSideR) * triLen * 0.48;
            let aBaseR = aRight - radians(11.5);
            let x_baseR = sin(aBaseR) * triLen * 0.95;
            let y_baseR = -cos(aBaseR) * triLen * 0.95;
            let x_cornerR_c1 = sin(aRight - radians(3.0)) * triLen * 1.14;
            let y_cornerR_c1 = -cos(aRight - radians(3.0)) * triLen * 1.14;
            let x_cornerR_c2 = sin(aRight + radians(6.0)) * triLen * 0.85;
            let y_cornerR_c2 = -cos(aRight + radians(6.0)) * triLen * 0.85;
            let cp2R_x = sin(aSideR) * triLen * 0.38;
            let cp2R_y = -cos(aSideR) * triLen * 0.38;
            let cp1R_x = sin(aRight) * triLen * 0.22;
            let cp1R_y = -cos(aRight) * triLen * 0.22;
            let cp1Base_x = sin(aCenter - radians(4.0)) * triLen * 0.90;
            let cp1Base_y = -cos(aCenter - radians(4.0)) * triLen * 0.90;
            let cp2Base_x = sin(aCenter + radians(4.0)) * triLen * 1.02;
            let cp2Base_y = -cos(aCenter + radians(4.0)) * triLen * 1.02;

            beginShape();
            vertex(0, 0);
            bezierVertex(cp1L_x, cp1L_y, cp2L_x, cp2L_y, x_sideL, y_sideL);
            bezierVertex(x_cornerL_c1, y_cornerL_c1, x_cornerL_c2, y_cornerL_c2, x_baseL, y_baseL);
            bezierVertex(cp1Base_x, cp1Base_y, cp2Base_x, cp2Base_y, x_baseR, y_baseR);
            bezierVertex(x_cornerR_c1, y_cornerR_c1, x_cornerR_c2, y_cornerR_c2, x_sideR, y_sideR);
            bezierVertex(cp2R_x, cp2R_y, cp1R_x, cp1R_y, 0, 0);
            endShape(CLOSE);
          }
        }
      } else if (shapeType === 'heart') {
        if (ctx) {
          ctx.save();
          ctx.scale(baseW, baseH);
          ctx.fill(LeafPath2DCache.getHeartPath());
          ctx.restore();
        } else {
          beginShape();
          vertex(0, 0);
          bezierVertex(-baseW * 1.1, -baseH * 0.35, -baseW * 1.1, -baseH * 1.1, -baseW * 0.5, -baseH * 1.15);
          bezierVertex(-baseW * 0.25, -baseH * 1.18, -baseW * 0.08, -baseH * 0.92, 0, -baseH * 0.82);
          bezierVertex(baseW * 0.08, -baseH * 0.92, baseW * 0.25, -baseH * 1.18, baseW * 0.5, -baseH * 1.15);
          bezierVertex(baseW * 1.1, -baseH * 1.1, baseW * 1.1, -baseH * 0.35, 0, 0);
          endShape(CLOSE);
        }
      } else if (shapeType === 'single_needle') {
        // Dạng Lá Me / Lá Kép Lông Chim Chẵn (7 cặp lá chét tạo hình oval dài tổng thể)
        let totalH = baseH * 2.5 * 0.576;

        // Trục chính lá me (Main rachis stem, kéo dài dọc qua 7 cặp lá)
        push();
        let stemCol = (this.getBranchColorAtDepth && typeof depth !== 'undefined') ? this.getBranchColorAtDepth(depth) : color(40, 50, 30, 180);
        stroke(stemCol);
        strokeWeight(0.6);
        line(0, 0, 0, -totalH * 0.94);
        pop();

        // 7 Cặp lá phụ hình oval dài sắp xếp theo đường bao oval tổng thể
        const pairs = [
          { yRatio: 0.12, scale: 0.62, angleDeg: 82 }, // #1: Gốc lá thon nhỏ
          { yRatio: 0.25, scale: 0.84, angleDeg: 80 }, // #2: Mở rộng dần
          { yRatio: 0.38, scale: 0.98, angleDeg: 76 }, // #3: Gần thân giữa
          { yRatio: 0.51, scale: 1.05, angleDeg: 72 }, // #4: Đỉnh rộng nhất của hình oval tổng thể
          { yRatio: 0.64, scale: 0.98, angleDeg: 66 }, // #5: Bắt đầu thuôn lại
          { yRatio: 0.77, scale: 0.84, angleDeg: 58 }, // #6: Thuôn nhỏ về ngọn
          { yRatio: 0.89, scale: 0.60, angleDeg: 48 }  // #7: Đầu ngọn lá nhỏ nhọn
        ];

        let baseLeafH = (baseH * 1.15 * 0.80) * 0.576; // Chiều dài cơ bản của lá con oval
        let baseLeafW = baseLeafH * 0.30;              // Chiều rộng lá con (hình oval dài tỉ lệ ~1:3.3)

        // Độ biến thiên tự nhiên dựa trên treeVariation và seed/branchId
        let treeVar = (this.treeVariation !== undefined) ? this.treeVariation : 0.8;
        let organicFactor = 0.4 + 0.6 * treeVar;

        // Bỏ viền đen cho lá chét để tránh làm tối xỉn màu lá trên nền sáng
        noStroke();

        for (let i = 0; i < pairs.length; i++) {
          let p = pairs[i];
          let baseY = -totalH * p.yRatio;

          // Kiểm tra hiển thị của lá chét bên trái (Left leaflet)
          let drawLeftLeaflet = !visibleLeaflets || visibleLeaflets.has('L_' + i);
          if (drawLeftLeaflet) {
            let hAngleL = (typeof hashRand === 'function') ? hashRand(branchId * 53 + i * 17 + 1, 101) : 0.5;
            let hScaleL = (typeof hashRand === 'function') ? hashRand(branchId * 53 + i * 17 + 2, 102) : 0.5;
            let hWidthL = (typeof hashRand === 'function') ? hashRand(branchId * 53 + i * 17 + 3, 103) : 0.5;
            let hPosYL  = (typeof hashRand === 'function') ? hashRand(branchId * 53 + i * 17 + 4, 104) : 0.5;

            let angleOffsetL = (hAngleL - 0.5) * 2 * 12 * organicFactor; // Lệch góc ±12°
            let lenScaleL = 1.0 + (hScaleL - 0.5) * 0.30 * organicFactor;  // Biến thiên chiều dài ±15%
            let widthScaleL = 1.0 + (hWidthL - 0.5) * 0.22 * organicFactor; // Biến thiên chiều rộng ±11%
            let yOffsetL = (hPosYL - 0.5) * totalH * 0.04 * organicFactor;   // Lệch nhẹ vị trí cuống lá

            let hL = baseLeafH * p.scale * lenScaleL;
            let wL = baseLeafW * p.scale * widthScaleL;
            let finalAngleL = radians(p.angleDeg + angleOffsetL);
            let yL = baseY + yOffsetL;

            // Lá phụ bên trái (Left oblong oval leaflet)
            push();
            translate(0, yL);
            rotate(-finalAngleL);
            ellipse(0, -hL * 0.5, wL, hL);
            pop();
          }

          // Kiểm tra hiển thị của lá chét bên phải (Right leaflet)
          let drawRightLeaflet = !visibleLeaflets || visibleLeaflets.has('R_' + i);
          if (drawRightLeaflet) {
            let hAngleR = (typeof hashRand === 'function') ? hashRand(branchId * 53 + i * 17 + 5, 201) : 0.5;
            let hScaleR = (typeof hashRand === 'function') ? hashRand(branchId * 53 + i * 17 + 6, 202) : 0.5;
            let hWidthR = (typeof hashRand === 'function') ? hashRand(branchId * 53 + i * 17 + 7, 203) : 0.5;
            let hPosYR  = (typeof hashRand === 'function') ? hashRand(branchId * 53 + i * 17 + 8, 204) : 0.5;

            let angleOffsetR = (hAngleR - 0.5) * 2 * 12 * organicFactor; // Lệch góc ±12°
            let lenScaleR = 1.0 + (hScaleR - 0.5) * 0.30 * organicFactor;  // Biến thiên chiều dài ±15%
            let widthScaleR = 1.0 + (hWidthR - 0.5) * 0.22 * organicFactor; // Biến thiên chiều rộng ±11%
            let yOffsetR = (hPosYR - 0.5) * totalH * 0.04 * organicFactor;   // Lệch nhẹ vị trí cuống lá

            let hR = baseLeafH * p.scale * lenScaleR;
            let wR = baseLeafW * p.scale * widthScaleR;
            let finalAngleR = radians(p.angleDeg + angleOffsetR);
            let yR = baseY + yOffsetR;

            // Lá phụ bên phải (Right oblong oval leaflet)
            push();
            translate(0, yR);
            rotate(finalAngleR);
            ellipse(0, -hR * 0.5, wR, hR);
            pop();
          }
        }

        noStroke();
      } else if (shapeType === 'tung_lahan') {
        // Lá Tùng La Hán (1 lá giữa thẳng đứng + 4 cặp lá 2 bên xòe quạt bo cong hướng lên trời)
        push();
        
        // 1. Phép chiếu ma trận chính xác 100%: Xoay trục lá CHĨA THẲNG ĐỨNG LÊN TRỜI (Screen Up: -PI/2)
        let m = (typeof drawingContext !== 'undefined') ? drawingContext.getTransform() : null;
        if (m) {
          // Hướng thực tế của trục dọc lá (local -Y) trên màn hình canvas: vx = -m.c, vy = -m.d
          let currentScreenAngle = Math.atan2(-m.d, -m.c);
          // Góc xoay bù để đỉnh lá chĩa thẳng đứng lên trời (-PI/2)
          let correctionAngle = -Math.PI / 2 - currentScreenAngle;
          
          // Thêm độ sai lệch ngẫu nhiên tự nhiên ±15 độ
          let organicNoise = (Math.sin(baseW * 31.7 + baseH * 19.3) - 0.5) * 2 * radians(15);
          rotate(correctionAngle + organicNoise);
        }

        // 2. Màu sắc lá kim Tùng La Hán
        let col = (typeof drawingContext !== 'undefined' && typeof drawingContext.fillStyle === 'string') ? drawingContext.fillStyle : color(40, 180, 110);
        noStroke();
        fill(col);

        // 3. Cấu trúc 9 lá kim: 1 lá giữa thẳng đứng (i=4) + 4 cặp lá 2 bên xòe quạt uốn cong nhẹ hướng lên
        let totalNeedles = 9;
        let maxLen = baseH * 1.8;
        let fanSpread = radians(136); // Góc xòe quạt 136 độ

        for (let i = 0; i < totalNeedles; i++) {
          let t = (i - (totalNeedles - 1) / 2) / ((totalNeedles - 1) / 2); // t từ -1.0 đến +1.0 (t=0 là lá giữa)
          let angle = t * (fanSpread / 2);

          // Tỉ lệ chiều dài: Lá giữa dài nhất, 4 cặp lá 2 bên ngắn dần mượt mà
          let shellEnvelope = Math.cos(t * Math.PI * 0.38);
          let bladeLen = maxLen * (0.55 + 0.45 * shellEnvelope);

          // Tọa độ đỉnh ngọn lá kim
          let tipX = sin(angle) * bladeLen;
          let tipY = -cos(angle) * bladeLen;

          // Uốn cong nhẹ hướng lên trên (Upward bow)
          let bowUp = (1 - Math.abs(t)) * baseW * 0.45 + bladeLen * 0.08;
          let ctrlX = sin(angle * 0.65) * bladeLen * 0.5;
          let ctrlY = -cos(angle * 0.65) * bladeLen * 0.5 - bowUp;

          // Pháp tuyến vuông góc với chord lá để tạo độ dày phiến lá (~1.8px) vuốt nhọn dần về đỉnh
          let bladeDist = Math.hypot(tipX, tipY) || 1;
          let nx = (-tipY / bladeDist) * 0.9;
          let ny = (tipX / bladeDist) * 0.9;

          // Vẽ phiến lá kim hình kiếm dẹt uốn lượn mềm mại
          beginShape();
          vertex(0, 0);
          quadraticVertex(ctrlX - nx, ctrlY - ny, tipX, tipY);
          quadraticVertex(ctrlX + nx, ctrlY + ny, 0, 0);
          endShape(CLOSE);
        }

        // 4. Bao gốc cuống cụm lá (Petiole sheath cap) trùng màu
        ellipse(0, 0, 2.0, 2.0);
        pop();
      } else if (shapeType === 'sakura_leaf') {
        // Lá Anh Đào / Cánh Hoa Anh Đào (Dạng giọt nước với khía chữ V ở đỉnh như miệng cá há)
        let w = baseW * 1.15;
        let h = baseH * 1.25;
        if (ctx) {
          ctx.save();
          ctx.scale(w, h);
          ctx.fill(LeafPath2DCache.getSakuraLeafPath());
          ctx.restore();
        } else {
          beginShape();
          vertex(0, 0);
          bezierVertex(-w * 0.95, -h * 0.35, -w * 0.85, -h * 0.85, -w * 0.42, -h * 1.15);
          vertex(0, -h * 0.82);
          vertex(w * 0.42, -h * 1.15);
          bezierVertex(w * 0.85, -h * 0.85, w * 0.95, -h * 0.35, 0, 0);
          endShape(CLOSE);
        }
      } else if (shapeType === 'willow') {
        // Cây Liễu Rủ Động: Hệ Cành Rủ Mềm Mại Nhiều Phân Đoạn & Lá Nhỏ So Le Dạng Lá Bạch Đàn
        // Cành càng ở cấp cao càng dài hơn (L1 = 12, L2 = 24, L3 = 36, L4 = 48, L5 = 60, L6 = 72, L7+ = 84 đoạn)
        let lvl = Math.max(1, branchLevel || 1);
        let targetSegments = Math.min(84, 12 + (lvl - 1) * 12);
        let dL = 4.0; // Mỗi phân đoạn cành phụ dài 4.0px

        // Tiến trình vươn dài các phân đoạn cành phụ theo thời gian mọc cành (progress từ 0 đến 1)
        let growthProgress = constrain(progress, 0.05, 1.0);
        let exactSegCount = targetSegments * growthProgress;
        let fullSegs = Math.floor(exactSegCount);
        let partialSegFrac = exactSegCount - fullSegs;

        let timeVal = (typeof time !== 'undefined' && !isNaN(time) && time > 0) ? time : (typeof frameCount !== 'undefined' ? frameCount * 0.03 : 0);
        let windMult = (this.windStrength !== undefined) ? this.windStrength : 1.0;

        // Tính góc Trọng Lực Đất chuẩn (+Y màn hình) trong hệ tọa độ Local hiện tại của cành
        let gravityLocalAngle = Math.PI;
        if (typeof drawingContext !== 'undefined' && drawingContext && drawingContext.getTransform) {
          let m = drawingContext.getTransform();
          let currentWorldAngle = Math.atan2(m.b, m.a);
          gravityLocalAngle = Math.PI - currentWorldAngle;
        }

        let leafColor;
        if (typeof drawingContext !== 'undefined' && typeof drawingContext.fillStyle === 'string') {
          leafColor = drawingContext.fillStyle;
        } else {
          leafColor = color(50, 200, 150);
        }
        let stemColor = leafColor;

        // Tích hợp trạng thái góc vật lý duy nhất cho từng cuống cành liễu rủ để đảm bảo Quán Tính Vận Tốc
        if (!this.willowLeafStates) this.willowLeafStates = new Map();
        let leafState = this.willowLeafStates.get(branchId);
        if (!leafState || leafState.targetSegments !== targetSegments) {
          leafState = {
            angles: new Array(targetSegments + 1).fill(0),
            angularVels: new Array(targetSegments + 1).fill(0),
            targetSegments: targetSegments
          };
          this.willowLeafStates.set(branchId, leafState);
        }

        // 1. Tính toán tọa độ chuỗi xương sống phân đoạn cành phụ (Branchlet Spine Nodes)
        let nodePositions = [{ x: 0, y: 0, angle: 0 }];
        let currX = 0;
        let currY = 0;

        for (let i = 0; i <= fullSegs; i++) {
          if (i === fullSegs && partialSegFrac < 0.01 && fullSegs > 0) break;
          let segLen = (i === fullSegs) ? (dL * partialSegFrac) : dL;
          let t = (i + 1) / targetSegments;

          // 1. Lá mọc dài ra theo đúng trục mọc tự nhiên trước (Angle 0), sau đó Trọng lực tác động kéo rủ dưới dạng Mô-men quay Vector (Vector Torque)
          let currentAngle = leafState.angles[i] || 0;
          let currentVel = leafState.angularVels[i] || 0;

          // Mô-men quay Trọng Lực Đất (Vector Gravity Torque) với đúng dấu Âm/Dương theo vị trí cành Trái/Phải
          let gravityTorque = Math.sin(gravityLocalAngle - currentAngle);

          // Phản lực uốn cuống gỗ ở gốc (Petiole Restoring Stiffness) với kháng uốn 0.30 & lực cuống gốc 0.35
          let stiffness = 0.95 * Math.exp(-t * 1.6) + 0.30;
          let petioleRestTorque = Math.sin(0 - currentAngle);

          // Tổng lực tác động = (Lực Trọng Lực kéo rủ) + (Lực kháng uốn cuống gốc 0.35) + (Sóng gió quán tính)
          let netTorque = (gravityTorque * (1.0 - stiffness * 0.65)) + (petioleRestTorque * stiffness * 0.35);
          let windWave = Math.sin(timeVal * 2.0 - i * 0.12 + branchId) * (windMult * 0.035) * t;

          currentVel = (currentVel * 0.88) + netTorque * 0.07 + windWave * 0.07;
          currentAngle += currentVel;

          leafState.angles[i] = currentAngle;
          leafState.angularVels[i] = currentVel;

          currX += Math.sin(currentAngle) * segLen;
          currY -= Math.cos(currentAngle) * segLen;
          nodePositions.push({ x: currX, y: currY, angle: currentAngle });
        }

        // 2. Vẽ đường trục cành phụ mềm mại rủ xuống
        stroke(stemColor);
        strokeWeight(1.1);
        noFill();
        beginShape();
        for (let pt of nodePositions) {
          vertex(pt.x, pt.y);
        }
        endShape();
        noStroke();

        // 3. Cứ mỗi 3 đoạn cành nhỏ thì mọc so le 1 lá nhỏ thon dài kiểu Lá Bạch Đàn (Eucalyptus Leaflets)
        let leafletW = 2.8;  // Nửa chiều rộng lá = 2.8px (rộng 5.6px)
        let leafletH = 10.0; // Chiều dài lá = 10.0px

        for (let i = 3; i < nodePositions.length; i += 3) {
          let node = nodePositions[i];
          let side = ((i / 3) % 2 === 0) ? -1 : 1; // Mọc so le trái / phải
          let leafAngle = node.angle + side * radians(35);

          push();
          translate(node.x, node.y);
          rotate(leafAngle);

          // Vẽ cuống lá nhỏ (Petiole stem) 2.5px
          stroke(stemColor);
          strokeWeight(0.8);
          line(0, 0, 0, -2.5);
          translate(0, -2.5);

          // Vẽ phiến lá nhỏ thon dài dạng lá bạch đàn (gốc thuôn ôm cuống)
          noStroke();
          this.setLeafFillColor(branchId * 77 + i);
          beginShape();
          vertex(0, 0);
          bezierVertex(-leafletW * 0.50, -leafletH * 0.22, -leafletW * 0.55, -leafletH * 0.68, 0, -leafletH);
          bezierVertex(leafletW * 0.55, -leafletH * 0.68, leafletW * 0.50, -leafletH * 0.22, 0, 0);
          endShape(CLOSE);
          pop();
        }
      } else if (shapeType === 'eucalyptus_long') {
        // Lá Bạch Đàn Dài (Long Eucalyptus Leaf): Thon dài hình trăng lưỡi liềm đến chữ C (70° - 150° Falcate/Crescent), uốn cong tự nhiên trái/phải, gốc thuôn nhọn ôm cuống
        noStroke();
        let leafLen = baseH * (50.0 / 14.0); // Chiều dài tổng thể = 50.0px (thon dài, vươn thanh thoát)

        // Biến thiên độ cong và hướng cong trái/phải ngẫu nhiên theo branchId
        let variantHash = (typeof hashRand === 'function') ? hashRand(branchId, 88) : ((Math.abs(Math.sin(branchId * 127.1 + 311.7)) * 43758.5453) % 1);
        let variantIdx = Math.floor(variantHash * 32);

        if (ctx) {
          ctx.save();
          ctx.scale(leafLen, leafLen);
          ctx.fill(LeafPath2DCache.getEucalyptusLongPath(variantIdx));
          ctx.restore();
        } else {
          // Fallback vẽ mượt mà trực tiếp các điểm hình học
          let pts = LeafPath2DCache.getEucalyptusPoints(variantIdx);
          if (pts) {
            beginShape();
            for (let p of pts.leftPts) {
              vertex(p.x * leafLen, p.y * leafLen);
            }
            for (let j = pts.rightPts.length - 1; j >= 0; j--) {
              let p = pts.rightPts[j];
              vertex(p.x * leafLen, p.y * leafLen);
            }
            endShape(CLOSE);
          }
        }
      } else if (shapeType === 'oval') {
        // Lá Oval (Bầu dục): Tinh chỉnh kích thước (giảm 25% so với bản phóng to, scale 2.25x)
        let w = baseW * 2.25;
        let h = baseH * 2.25;
        if (ctx) {
          ctx.save();
          ctx.scale(w, h);
          ctx.fill(LeafPath2DCache.getOvalPath());
          ctx.restore();
        } else {
          ellipse(0, -h * 0.5, w, h);
        }
      } else if (shapeType === 'round') {
        // Lá Tròn / Lá Xu Bạch Đàn (Orbicular Round Leaf): Hình tròn trịa như đồng xu với cuống thắt nhẹ ở gốc
        let r = baseW * 1.05;
        if (ctx) {
          ctx.save();
          ctx.scale(r, r);
          ctx.fill(LeafPath2DCache.getRoundPath());
          ctx.restore();
        } else {
          beginShape();
          vertex(0, 0);
          bezierVertex(-r * 1.35, -r * 0.25, -r * 1.35, -r * 1.75, 0, -r * 2.0);
          bezierVertex(r * 1.35, -r * 1.75, r * 1.35, -r * 0.25, 0, 0);
          endShape(CLOSE);
        }
      } else if (shapeType === 'bodhi') {
        // Bodhi leaf (Lá Bồ Đề): Tăng kích thước thêm gấp rưỡi (1.5x * 1.5x = 2.25x)
        push();
        scale(2.25);
        translate(0, -baseH * 1.05);
        rotate(PI);
        if (ctx) {
          ctx.save();
          ctx.scale(baseW, baseH);
          ctx.fill(LeafPath2DCache.getBodhiPath());
          ctx.restore();
        } else {
          beginShape();
          vertex(0, 0);
          bezierVertex(-baseW * 1.1, -baseH * 0.4, -baseW * 1.3, -baseH * 0.9, -baseW * 0.25, -baseH * 1.05);
          vertex(0, -baseH * 0.85);
          bezierVertex(baseW * 0.25, -baseH * 1.05, baseW * 1.3, -baseH * 0.9, baseW * 1.1, -baseH * 0.4);
          endShape(CLOSE);
        }
        pop();
      } else {
        ellipse(0, -baseH * 0.5, baseW, baseH);
      }
    }

    drawLeafAtTip(branchId, isTerminal = false, depth = 0, time = 0, gravityLocalAngle = Math.PI, progress = 1.0) {
      this._leafDrawDepth = (this._leafDrawDepth || 0) + 1;
      this.isDrawingLeaf = true;
      noStroke();
      
      let currentShape = this.getEffectiveLeafShape();
      let leafCfg = (typeof LEAF_TYPE_CONFIGS !== 'undefined' && LEAF_TYPE_CONFIGS[currentShape]) ? LEAF_TYPE_CONFIGS[currentShape] : null;

      let fruitCfg = (leafCfg && leafCfg.fruit && leafCfg.fruit.enabled) ? leafCfg.fruit : null;
      let fruitChance = fruitCfg ? (typeof fruitCfg.chance === 'number' ? fruitCfg.chance : 0.15) : 0.08;
      let hashFruit = (Math.abs(Math.sin(branchId * 12.9898 + 78.233)) * 43758.5453) % 1;
      let hasFruit = isTerminal && (fruitCfg ? (hashFruit < fruitChance) : ((this.treeVariation > 0) && (hashFruit < 0.08)));

      if (hasFruit) {
        this.isDrawingFruit = true;
        let fColor = (fruitCfg && fruitCfg.color) ? fruitCfg.color : [255, 215, 0];
        let fSize = (fruitCfg && typeof fruitCfg.size === 'number') ? fruitCfg.size : 10;
        let isGlow = (fruitCfg ? (fruitCfg.glow !== false) : true);
        let fType = (fruitCfg && fruitCfg.type) ? fruitCfg.type : 'single_glow';

        if (fType === 'berry_cluster') {
          // Chùm 2-3 quả mọng có cuống nhỏ bám đầu cành
          let berryCount = 2 + floor((hashFruit * 10) % 2); // 2 hoặc 3 quả
          for (let b = 0; b < berryCount; b++) {
            let bAngle = (b - (berryCount - 1) / 2) * radians(28);
            let stalkLen = fSize * 1.4;
            let bx = Math.sin(bAngle) * stalkLen;
            let by = -Math.cos(bAngle) * stalkLen;

            // Cuống nhỏ
            stroke(40, 30, 20, 200);
            strokeWeight(0.8);
            line(0, 0, bx, by);
            noStroke();

            // Quả mọng
            fill(fColor[0], fColor[1], fColor[2], 0.95);
            ellipse(bx, by, fSize, fSize);

            // Điểm sáng phản chiếu ánh sáng (Specular highlight)
            fill(255, 255, 255, 0.75);
            ellipse(bx - fSize * 0.2, by - fSize * 0.2, fSize * 0.32, fSize * 0.32);
          }
        } else {
          // Quả đơn phát sáng lung linh tỏa hào quang
          let r = fColor[0], g = fColor[1], b = fColor[2];
          if (isGlow) {
            fill(r, g, b, 0.18);
            ellipse(0, 0, fSize * 2.6, fSize * 2.6);
            fill(r, g, b, 0.45);
            ellipse(0, 0, fSize * 1.5, fSize * 1.5);
          }
          fill(r, g, b, 0.95);
          ellipse(0, 0, fSize, fSize);
          fill(255, 255, 255, 0.9);
          ellipse(0, 0, fSize * 0.4, fSize * 0.4);
        }
        this.isDrawingFruit = false;
      }
      
      let hasFlowers = false; // Tạm thời bỏ qua các loại hoa mọc ngẫu nhiên
      
      if (hasFlowers) {
        let clusterHash = (Math.abs(Math.sin(branchId * 61.7 + 12.9)) * 1000) % 1;
        let clusterCount = 2 + floor(clusterHash * 3);
        
        let r, g, b;
        if (this.colorTheme === 'cyberpunk') {
          if (this.treeFlowerColor === 'purple') {
            r = 168; g = 85; b = 247;
          } else if (this.treeFlowerColor === 'red') {
            r = 244; g = 63; b = 94;
          } else {
            r = 250; g = 204; b = 21;
          }
        } else if (this.colorTheme === 'autumn') {
          if (this.treeFlowerColor === 'purple') {
            r = 217; g = 70; b = 239;
          } else if (this.treeFlowerColor === 'red') {
            r = 239; g = 68; b = 68;
          } else {
            r = 251; g = 191; b = 36;
          }
        } else {
          if (this.treeFlowerColor === 'purple') {
            r = 192; g = 132; b = 252;
          } else if (this.treeFlowerColor === 'red') {
            r = 251; g = 113; b = 133;
          } else {
            r = 253; g = 224; b = 71;
          }
        }
        
        for (let i = 0; i < clusterCount; i++) {
          let clusterAngle = (i - (clusterCount - 1) / 2) * radians(15);
          let dist = 12 + i * 8;
          let popHash = (Math.abs(Math.sin(branchId * 33.1 + i * 17.4)) * 1000) % 1;
          let popScale = 0.8 + popHash * 0.4 * this.treeVariation;
          
          push();
          translate(sin(clusterAngle) * dist, dist);
          rotate(clusterAngle);
          scale(popScale);
          
          fill(r, g, b, 0.25);
          ellipse(0, 0, 18, 18);
          fill(r, g, b, 0.6);
          ellipse(0, 0, 11, 11);
          fill(255, 255, 255, 0.9);
          ellipse(0, 0, 5, 5);
          pop();
        }
      }
      
      let h = hashRand(branchId, 1);
      let w = hashRand(branchId, 2);
      let r = hashRand(branchId, 3);
      let s = hashRand(branchId, 4);
      let rotateOffset = radians((r - 0.5) * 25 * this.treeVariation);
      let scaleBase = 0.55 + s * 0.90 * this.treeVariation; // 0.55x to 1.45x organic leaf size variance
      let lenScale = scaleBase * (0.8 + (h - 0.5) * 0.4 * this.treeVariation);
      let widthScale = scaleBase * (0.8 + (w - 0.5) * 0.4 * this.treeVariation);
      if (this.treeVariation === 0) { lenScale = 1.0; widthScale = 1.0; }
      let shape = this.getEffectiveLeafShape();

      let stemColor = this.getBranchColorAtDepth ? this.getBranchColorAtDepth(depth) : color(40, 30, 20);
      let angleRad = radians(this.branchAngle || 20);
      let extraAngle = radians(10);

      let noiseCommon = noise(branchId * 17.5 + 44.8);
      let commonTilt = (noiseCommon - 0.5) * 2 * radians(20) * this.treeVariation;
      let noiseRelative = noise(branchId * 14.2 + 93.1);
      let relativeAngleVar = (noiseRelative - 0.5) * 2 * radians(15) * this.treeVariation;

      let leftAngle = -angleRad + (commonTilt - relativeAngleVar / 2) - extraAngle;
      let rightAngle = angleRad + (commonTilt + relativeAngleVar / 2) + extraAngle;

      let nodeLevel = (this.maxDepth !== undefined && depth !== undefined) ? (this.maxDepth - depth) : 0;
      let levelWindFactor = (!isTerminal && nodeLevel <= 4) ? 1.0 : 0.0;
      let windMult = ((this.windStrength !== undefined) ? this.windStrength : 1.0) * levelWindFactor;
      let timeVal = (typeof time !== 'undefined' && !isNaN(time) && time > 0) ? time : (typeof frameCount !== 'undefined' ? frameCount * 0.03 : 0);

      // MurmurHash3 High-Entropy PRNG leaf wind sway calculation (6 to 16 degrees flutter amplitude)
      let swayFreqL = 2.0 + hashRand(branchId, 11) * 2.5;
      let swayAmpL = radians(6 + hashRand(branchId, 12) * 10);
      let leafSwayL = sin(timeVal * swayFreqL + branchId * 5.7) * swayAmpL * windMult;

      let swayFreqR = 2.2 + hashRand(branchId, 13) * 2.5;
      let swayAmpR = radians(6 + hashRand(branchId, 14) * 10);
      let leafSwayR = sin(timeVal * swayFreqR + branchId * 8.3) * swayAmpR * windMult;

      let petioleMult = (shape === 'maple' || shape === 'maple5' || shape === 'ginkgo_fan') ? 2.0 : ((shape === 'willow') ? 1.4 : 1.0);

      if (isTerminal) {
        let branchLevel = (this.maxDepth !== undefined && depth !== undefined) ? Math.max(1, (this.maxDepth - depth) + 1) : 1;

        // Optional central terminal leaf if tipLeafRange supports 3+ leaves
        let tipCount = 2;
        if (leafCfg && leafCfg.tipLeafRange && leafCfg.tipLeafRange[1] >= 3) {
          tipCount = (hashRand(branchId, 25) > 0.45) ? 3 : 2;
        }

        if (tipCount >= 3) {
          let petioleHashM = hashRand(branchId, 23);
          let petioleLenM = (4.5 + petioleHashM * 7.0) * petioleMult;
          push();
          rotate(commonTilt + rotateOffset);
          stroke(stemColor);
          strokeWeight(1.1);
          noFill();
          beginShape();
          vertex(0, 0);
          quadraticVertex(0, -petioleLenM * 0.5, 0, -petioleLenM);
          endShape();
          noStroke();
          translate(0, -petioleLenM);
          scale(widthScale, lenScale);
          this.setLeafFillColor(branchId * 3 + 1);
          this.drawSingleLeafShape(shape, 7, 14, depth, branchLevel, gravityLocalAngle, progress, branchId * 3 + 1);
          pop();
        }

        // Left terminal leaf with slender randomized petiole (no sprout wind flutter for permanent leaves)
        let petioleHashL = hashRand(branchId, 21);
        let petioleLenL = (4.0 + petioleHashL * 8.0) * petioleMult;

        push();
        rotate(leftAngle + rotateOffset);
        stroke(stemColor);
        strokeWeight(1.1);
        noFill();
        let curveXL = (shape === 'ginkgo_fan') ? (petioleLenL * 0.20) : (petioleLenL * 0.08);
        beginShape();
        vertex(0, 0);
        quadraticVertex(curveXL, -petioleLenL * 0.5, 0, -petioleLenL);
        endShape();
        noStroke();
        translate(0, -petioleLenL);
        scale(widthScale, lenScale);
        this.setLeafFillColor(branchId * 3 + 2);
        this.drawSingleLeafShape(shape, 7, 14, depth, branchLevel, gravityLocalAngle, progress, branchId * 3 + 2);
        pop();

        // Right terminal leaf with slender randomized petiole
        let petioleHashR = hashRand(branchId, 22);
        let petioleLenR = (4.0 + petioleHashR * 8.0) * petioleMult;

        push();
        rotate(rightAngle + rotateOffset);
        stroke(stemColor);
        strokeWeight(1.1);
        noFill();
        let curveXR = (shape === 'ginkgo_fan') ? (-petioleLenR * 0.20) : (-petioleLenR * 0.08);
        beginShape();
        vertex(0, 0);
        quadraticVertex(curveXR, -petioleLenR * 0.5, 0, -petioleLenR);
        endShape();
        noStroke();
        translate(0, -petioleLenR);
        scale(widthScale, lenScale);
        this.setLeafFillColor(branchId * 3);
        this.drawSingleLeafShape(shape, 7, 14, depth, branchLevel, gravityLocalAngle, progress, branchId * 3);
        pop();
      } else {
        // Sprout leaves attached to growing branch tip on first 4 levels with extra 10deg outward tilt, randomized petioles
        let branchLevel = (this.maxDepth !== undefined && depth !== undefined) ? Math.max(1, (this.maxDepth - depth) + 1) : 1;
        let petioleHashL = hashRand(branchId, 21);
        let petioleLenL = (4.0 + petioleHashL * 8.0) * petioleMult;

        push();
        rotate(leftAngle + rotateOffset + leafSwayL);
        stroke(stemColor);
        strokeWeight(1.1);
        noFill();
        let curveXL = (shape === 'ginkgo_fan') ? (petioleLenL * 0.20) : (petioleLenL * 0.08);
        beginShape();
        vertex(0, 0);
        quadraticVertex(curveXL, -petioleLenL * 0.5, 0, -petioleLenL);
        endShape();
        noStroke();
        translate(0, -petioleLenL);
        scale(widthScale, lenScale);
        this.setLeafFillColor(branchId * 3 + 2);
        this.drawSingleLeafShape(shape, 7, 14, depth, branchLevel, gravityLocalAngle, progress, branchId * 3 + 2);
        pop();

        let petioleHashR = hashRand(branchId, 22);
        let petioleLenR = (4.0 + petioleHashR * 8.0) * petioleMult;

        push();
        rotate(rightAngle + rotateOffset + leafSwayR);
        stroke(stemColor);
        strokeWeight(1.1);
        noFill();
        let curveXR = (shape === 'ginkgo_fan') ? (-petioleLenR * 0.20) : (-petioleLenR * 0.08);
        beginShape();
        vertex(0, 0);
        quadraticVertex(curveXR, -petioleLenR * 0.5, 0, -petioleLenR);
        endShape();
        noStroke();
        translate(0, -petioleLenR);
        scale(widthScale, lenScale);
        this.setLeafFillColor(branchId * 3);
        this.drawSingleLeafShape(shape, 7, 14, depth, branchLevel, gravityLocalAngle, progress, branchId * 3);
        pop();
      }
    }

    drawSproutLeaves(branchId, leftAngle, rightAngle, midAngle = 0, depth = 0, time = 0, drawLeft = true, drawMid = true, drawRight = true, gravityLocalAngle = Math.PI, progress = 1.0, activeLeafletsMap = null) {
      noStroke();
      let shape = this.getEffectiveLeafShape();
      let isWillow = (shape === 'willow');
      let stemColor = this.getBranchColorAtDepth ? this.getBranchColorAtDepth(depth) : color(40, 30, 20);
      let nodeLevel = (this.maxDepth !== undefined && depth !== undefined) ? (this.maxDepth - depth) : 0;
      let levelWindFactor = (nodeLevel <= 5) ? 1.0 : 0.4;
      let windMult = ((this.windStrength !== undefined) ? this.windStrength : 1.0) * levelWindFactor;
      let timeVal = (typeof time !== 'undefined' && !isNaN(time) && time > 0) ? time : (typeof frameCount !== 'undefined' ? frameCount * 0.03 : 0);

      let swayFreqL = 2.0 + hashRand(branchId, 31) * 2.5;
      let swayAmpL = radians(6 + hashRand(branchId, 32) * 10);
      let leafSwayL = isWillow ? 0 : sin(timeVal * swayFreqL + branchId * 4.1) * swayAmpL * windMult;

      let swayFreqM = 2.2 + hashRand(branchId, 33) * 2.5;
      let swayAmpM = radians(6 + hashRand(branchId, 34) * 10);
      let leafSwayM = isWillow ? 0 : sin(timeVal * swayFreqM + branchId * 6.2) * swayAmpM * windMult;

      let swayFreqR = 2.1 + hashRand(branchId, 35) * 2.5;
      let swayAmpR = radians(6 + hashRand(branchId, 36) * 10);
      let leafSwayR = isWillow ? 0 : sin(timeVal * swayFreqR + branchId * 8.4) * swayAmpR * windMult;

      if (drawLeft) {
        let leafIdL = branchId * 3 + 2;
        let visibleMaskL = activeLeafletsMap ? activeLeafletsMap[leafIdL] : null;
        push();
        rotate(leftAngle + leafSwayL);
        this.drawSingleLeaf(leafIdL, 1.0, depth, time, false, true, gravityLocalAngle, progress, visibleMaskL);
        pop();
      }
      
      if (drawMid) {
        let leafIdM = branchId * 3 + 1;
        let visibleMaskM = activeLeafletsMap ? activeLeafletsMap[leafIdM] : null;
        push();
        rotate(midAngle + leafSwayM);
        this.drawSingleLeaf(leafIdM, 1.0, depth, time, false, true, gravityLocalAngle, progress, visibleMaskM);
        pop();
      }
      
      if (drawRight) {
        let leafIdR = branchId * 3 + 0;
        let visibleMaskR = activeLeafletsMap ? activeLeafletsMap[leafIdR] : null;
        push();
        rotate(rightAngle + leafSwayR);
        this.drawSingleLeaf(leafIdR, 1.0, depth, time, false, true, gravityLocalAngle, progress, visibleMaskR);
        pop();
      }
      this._leafDrawDepth = Math.max(0, (this._leafDrawDepth || 1) - 1);
      if (this._leafDrawDepth === 0) this.isDrawingLeaf = false;
    }

    drawSingleTamarindLeaflet(branchId, pairIdx, side, scaleVal = 1.0) {
      let baseH = 12 * scaleVal;
      let baseLeafH = (baseH * 1.15 * 0.80) * 0.576;
      let baseLeafW = baseLeafH * 0.30;
      const pairs = [
        { yRatio: 0.12, scale: 0.62, angleDeg: 82 },
        { yRatio: 0.25, scale: 0.84, angleDeg: 80 },
        { yRatio: 0.38, scale: 0.98, angleDeg: 76 },
        { yRatio: 0.51, scale: 1.05, angleDeg: 72 },
        { yRatio: 0.64, scale: 0.98, angleDeg: 66 },
        { yRatio: 0.77, scale: 0.84, angleDeg: 58 },
        { yRatio: 0.89, scale: 0.60, angleDeg: 48 }
      ];
      let p = pairs[pairIdx] || pairs[0];
      let treeVar = (this.treeVariation !== undefined) ? this.treeVariation : 0.8;
      let organicFactor = 0.4 + 0.6 * treeVar;

      let saltBase = (side === 'L') ? 100 : 200;
      let hashIdxBase = (side === 'L') ? 1 : 5;
      let hScale = (typeof hashRand === 'function') ? hashRand(branchId * 53 + pairIdx * 17 + hashIdxBase + 1, saltBase + 2) : 0.5;
      let hWidth = (typeof hashRand === 'function') ? hashRand(branchId * 53 + pairIdx * 17 + hashIdxBase + 2, saltBase + 3) : 0.5;

      let lenScale = 1.0 + (hScale - 0.5) * 0.30 * organicFactor;
      let widthScale = 1.0 + (hWidth - 0.5) * 0.22 * organicFactor;

      let h = baseLeafH * p.scale * lenScale;
      let w = baseLeafW * p.scale * widthScale;

      this._leafDrawDepth = (this._leafDrawDepth || 0) + 1;
      this.isDrawingLeaf = true;
      this.setLeafFillColor(branchId);
      noStroke();
      ellipse(0, -h * 0.5, w, h);
      this._leafDrawDepth = Math.max(0, (this._leafDrawDepth || 1) - 1);
      if (this._leafDrawDepth === 0) this.isDrawingLeaf = false;
    }

    drawSingleLeaf(branchId, scaleVal, depth = 0, time = 0, isTerminal = false, drawPetiole = true, gravityLocalAngle = Math.PI, progress = 1.0, visibleLeaflets = null) {
      this._leafDrawDepth = (this._leafDrawDepth || 0) + 1;
      this.isDrawingLeaf = true;
      noStroke();
      let shape = this.getEffectiveLeafShape();
      let stemColor = this.getBranchColorAtDepth ? this.getBranchColorAtDepth(depth) : color(40, 30, 20);
      let nodeLevel = (this.maxDepth !== undefined && depth !== undefined) ? (this.maxDepth - depth) : 0;
      let levelWindFactor = (!isTerminal && nodeLevel <= 4) ? 1.0 : 0.0;
      let windMult = ((this.windStrength !== undefined) ? this.windStrength : 1.0) * levelWindFactor;
      let timeVal = (typeof time !== 'undefined' && !isNaN(time) && time > 0) ? time : (typeof frameCount !== 'undefined' ? frameCount * 0.03 : 0);
      let petioleMult = (shape === 'maple' || shape === 'maple5' || shape === 'ginkgo_fan') ? 2.0 : 1.0;

      let h = hashRand(branchId, 73);
      let w = hashRand(branchId, 74);
      let r = hashRand(branchId, 75);
      let s = hashRand(branchId, 76);
      let rotateOffset = radians((r - 0.5) * 25 * this.treeVariation);
      let scaleBase = (0.55 + s * 0.90 * this.treeVariation) * scaleVal;
      let lenScale = scaleBase * (0.8 + (h - 0.5) * 0.4 * this.treeVariation);
      let widthScale = scaleBase * (0.8 + (w - 0.5) * 0.4 * this.treeVariation);
      if (this.treeVariation === 0) { lenScale = scaleVal; widthScale = scaleVal; }

      let petioleHash = hashRand(branchId, 77);
      let petioleLen = (4.0 + petioleHash * 8.0) * petioleMult;

      push();
      rotate(rotateOffset);
      if (drawPetiole) {
        stroke(stemColor);
        strokeWeight(1.1);
        noFill();
        let curveX = (shape === 'ginkgo_fan') ? (petioleLen * 0.18) : (petioleLen * 0.08);
        beginShape();
        vertex(0, 0);
        quadraticVertex(curveX, -petioleLen * 0.5, 0, -petioleLen);
        endShape();
        noStroke();
        translate(0, -petioleLen);
      }
      let branchLevel = (this.maxDepth !== undefined && depth !== undefined) ? Math.max(1, (this.maxDepth - depth) + 1) : 1;
      scale(widthScale, lenScale);
      this.setLeafFillColor(branchId);
      this.drawSingleLeafShape(shape, 6, 12, depth, branchLevel, gravityLocalAngle, progress, branchId, visibleLeaflets);
      pop();
      this._leafDrawDepth = Math.max(0, (this._leafDrawDepth || 1) - 1);
      if (this._leafDrawDepth === 0) this.isDrawingLeaf = false;
    }

    setLeafFillColor(branchId) {
      let hashColor = (Math.abs(Math.sin(branchId * 37.719 + 104.233)) * 98765.4321) % 1;
      
      switch(this.leafType) {
        case 'sakura':
          if (hashColor < 0.33) {
            fill(253, 164, 186, 0.85); // Sakura Pink
          } else if (hashColor < 0.66) {
            fill(244, 114, 182, 0.85); // Soft Magenta
          } else {
            fill(252, 231, 243, 0.90); // Pearl White-Pink
          }
          break;

        case 'autumn':
          if (hashColor < 0.25) {
            fill(220, 38, 38, 0.88);  // 1. Đỏ tươi rực rỡ (Crimson Red)
          } else if (hashColor < 0.50) {
            fill(239, 68, 68, 0.88);  // 2. Đỏ hoa hiên rực cháy (Fiery Scarlet Red)
          } else if (hashColor < 0.75) {
            fill(249, 115, 22, 0.88); // 3. Cam đỏ chuyển giao (Fiery Orange-Red)
          } else {
            fill(185, 28, 28, 0.88);  // 4. Đỏ mận chín thẫm (Deep Ruby Wine Red)
          }
          break;

        case 'ginkgo':
          if (hashColor < 0.35) {
            fill(250, 204, 21, 0.88); // Bright Canary Yellow
          } else if (hashColor < 0.70) {
            fill(234, 179, 8, 0.88); // Sun Gold
          } else {
            fill(245, 158, 11, 0.88); // Warm Honey
          }
          break;

        case 'wisteria':
          if (hashColor < 0.33) {
            fill(192, 132, 252, 0.85); // Pastel Lavender
          } else if (hashColor < 0.66) {
            fill(168, 85, 247, 0.85); // Royal Violet
          } else {
            fill(232, 121, 249, 0.85); // Soft Orchid
          }
          break;

        case 'frost':
          if (this.isDark === false) {
            if (hashColor < 0.35) {
              fill(2, 132, 199, 0.90); // Cobalt Glacial Azure (#0284c7)
            } else if (hashColor < 0.70) {
              fill(14, 165, 233, 0.90); // Vibrant Glacial Sky (#0ea5e9)
            } else {
              fill(56, 189, 248, 0.85); // Crisp Ice Cyan (#38bdf8)
            }
          } else {
            if (hashColor < 0.35) {
              fill(56, 189, 248, 0.80); // Ice Cyan
            } else if (hashColor < 0.70) {
              fill(125, 211, 252, 0.85); // Diamond Sky
            } else {
              fill(224, 242, 254, 0.90); // Frozen Crystal
            }
          }
          break;

        case 'sunset':
          if (hashColor < 0.33) {
            fill(244, 63, 94, 0.85); // Coral Red
          } else if (hashColor < 0.66) {
            fill(251, 146, 60, 0.85); // Fiery Peach
          } else {
            fill(251, 191, 36, 0.85); // Golden Flame
          }
          break;

        case 'midnight':
          if (hashColor < 0.35) {
            fill(99, 102, 241, 0.85); // Celestial Indigo
          } else if (hashColor < 0.70) {
            fill(59, 130, 246, 0.85); // Sapphire Blue
          } else {
            fill(129, 140, 248, 0.85); // Neon Violet-Blue
          }
          break;

        case 'eucalyptus':
          if (hashColor < 0.35) {
            fill(146, 185, 165, 0.88); // Glaucous Sage Silver Green (Xanh bạc sương mù)
          } else if (hashColor < 0.70) {
            fill(168, 202, 184, 0.90); // Powdered Eucalyptus White-Green (Xanh phủ phấn trắng)
          } else {
            fill(122, 160, 142, 0.88); // Dusty Eucalyptus Teal (Xanh ngọc phai bạc thẫm)
          }
          break;

        case 'golden':
          if (hashColor < 0.35) {
            fill(254, 240, 138, 0.92); // Kim Sa Hoàng Kim
          } else if (hashColor < 0.70) {
            fill(250, 204, 21, 0.90);  // Vàng Hoàng Gia
          } else {
            fill(202, 138, 4, 0.90);   // Hổ Phách Vàng Đồng
          }
          break;

        case 'ruby':
          if (hashColor < 0.35) {
            fill(251, 113, 133, 0.90); // Hồng Ngọc Sáng
          } else if (hashColor < 0.70) {
            fill(244, 63, 94, 0.90);   // Huyết Ngọc
          } else {
            fill(190, 18, 60, 0.92);   // Hồng Ngọc Thẫm
          }
          break;

        case 'shadow':
          if (hashColor < 0.35) {
            fill(148, 163, 184, 0.88); // Xám Bạc Hư Không
          } else if (hashColor < 0.70) {
            fill(71, 85, 105, 0.90);   // Hắc Thạch
          } else {
            fill(30, 41, 59, 0.92);    // Huyền Dạ Đen Tuyền
          }
          break;

        case 'emerald':
        default:
          if (hashColor < 0.35) {
            fill(52, 211, 153, 0.80); // Emerald Green
          } else if (hashColor < 0.70) {
            fill(110, 231, 183, 0.85); // Mint Green
          } else {
            fill(5, 150, 105, 0.85); // Deep Forest Green
          }
          break;
      }
    }
  }

  // Export for Browser global & Node/ES module compatibility
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FractalBranchTree;
  } else {
    global.FractalBranchTree = FractalBranchTree;
  }
})(typeof window !== 'undefined' ? window : this);
