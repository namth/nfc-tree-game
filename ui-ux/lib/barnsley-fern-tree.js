/**
 * BarnsleyFernTree - Standalone p5.js Library for Barnsley / Trigonometric Fern Trees
 * 
 * Usage:
 *   const fern = new BarnsleyFernTree({
 *     initLength: 640,
 *     maxDepth: 3,
 *     treeVariation: 0.15,
 *     initThickness: 4,
 *     fernFrondCount: 5,
 *     fernSpreadAngle: 45,
 *     fernLeafletLength: 75,
 *     fernLeafletWidth: 100,
 *     fernTaperProfile: 1.2,
 *     fernBranchPoints: 8,
 *     fernAlternateRate: 0,
 *     windStrength: 1.0,
 *     colorTheme: 'emerald',
 *     seed: 12345
 *   });
 * 
 *   fern.update(dt);
 *   fern.draw(); // or fern.draw(p5Instance)
 */
(function (global) {
  // Hardware-accelerated vector Path2D Cache for Fern Leaflets
  class FernLeafPath2DCache {
    static getSoftPointedPath() {
      if (!this._softPointed) {
        let p = new Path2D();
        p.moveTo(0, 0);
        p.bezierCurveTo(-0.5, -0.05, -1.0, -0.12, -1.0, -0.25);
        p.bezierCurveTo(-0.9, -0.45, -0.4, -0.75, 0, -1.0);
        p.bezierCurveTo(0.4, -0.75, 0.9, -0.45, 1.0, -0.25);
        p.bezierCurveTo(1.0, -0.12, 0.5, -0.05, 0, 0);
        p.closePath();
        this._softPointed = p;
      }
      return this._softPointed;
    }

    static getRoundedPath() {
      if (!this._rounded) {
        let p = new Path2D();
        p.moveTo(0, 0);
        p.bezierCurveTo(-0.9, -0.1, -1.2, -0.6, -0.6, -0.9);
        p.bezierCurveTo(-0.2, -1.1, 0.2, -1.1, 0.6, -0.9);
        p.bezierCurveTo(1.2, -0.6, 0.9, -0.1, 0, 0);
        p.closePath();
        this._rounded = p;
      }
      return this._rounded;
    }
  }

  class BarnsleyFernTree {
    constructor(params = {}) {
      this.initLength = 640;
      this.maxDepth = 3;
      this.treeVariation = 0.15;
      this.initThickness = 4;
      this.fernFrondCount = 5;
      this.fernSpreadAngle = 45;
      this.fernLeafletLength = 75;
      this.fernLeafletWidth = 100;
      this.fernTaperProfile = 1.2;
      this.fernBranchPoints = 8;
      this.fernAlternateRate = 0;
      this.windStrength = 1.0;
      this.leafType = 'emerald';
      this.colorTheme = 'emerald';
      this.seed = Math.floor(Math.random() * 1000000);
      
      this.setParams(params);
      this.animationTime = 0;
      this.rebuild();
    }

    setParams(params = {}) {
      if (params.initLength !== undefined) this.initLength = params.initLength;
      if (params.maxDepth !== undefined && !isNaN(params.maxDepth)) this.maxDepth = parseInt(params.maxDepth);
      if (params.treeVariation !== undefined) this.treeVariation = params.treeVariation;
      if (params.initThickness !== undefined) this.initThickness = params.initThickness;
      if (params.fernFrondCount !== undefined) this.fernFrondCount = params.fernFrondCount;
      if (params.fernSpreadAngle !== undefined) this.fernSpreadAngle = params.fernSpreadAngle;
      if (params.fernLeafletLength !== undefined) this.fernLeafletLength = params.fernLeafletLength;
      if (params.fernLeafletWidth !== undefined) this.fernLeafletWidth = parseFloat(params.fernLeafletWidth);
      if (params.fernTaperProfile !== undefined) this.fernTaperProfile = params.fernTaperProfile;
      if (params.fernBranchPoints !== undefined) this.fernBranchPoints = parseInt(params.fernBranchPoints);
      if (params.fernAlternateRate !== undefined) this.fernAlternateRate = parseInt(params.fernAlternateRate);
      if (params.windStrength !== undefined) this.windStrength = params.windStrength;
      if (params.leafType !== undefined) this.leafType = params.leafType;
      if (params.colorTheme !== undefined) this.colorTheme = params.colorTheme;
      if (params.seed !== undefined) this.seed = params.seed;
    }

    rebuild() {
      this.animationTime = 0;
      noiseSeed(this.seed);
      randomSeed(this.seed);
    }

    update(dt) {
      this.animationTime += dt;
    }

    getFrondTiming() {
      let frondDuration = 1.0;
      let staggerDelay = frondDuration;
      let totalDuration = this.fernFrondCount * frondDuration;
      return { staggerDelay, frondDuration, totalDuration };
    }

    getTotalGrowthTime() {
      let { totalDuration } = this.getFrondTiming();
      return totalDuration;
    }

    isSubtreeFinished() {
      let { totalDuration } = this.getFrondTiming();
      return this.animationTime >= totalDuration;
    }

    getTreeGrowthProgress() {
      let { totalDuration } = this.getFrondTiming();
      return { current: min(this.animationTime, totalDuration), target: totalDuration };
    }

    getLeafThemeColor(branchId) {
      let hashColor = (Math.abs(Math.sin((branchId || 1) * 37.719 + 104.233)) * 98765.4321) % 1;
      let currentTheme = this.leafType || this.colorTheme || 'emerald';
      
      switch(currentTheme) {
        case 'sakura':
          if (hashColor < 0.33) return color(253, 164, 186, 220); // Sakura Pink
          if (hashColor < 0.66) return color(244, 114, 182, 220); // Soft Magenta
          return color(252, 231, 243, 230); // Pearl White-Pink

        case 'autumn':
          if (hashColor < 0.25) return color(220, 38, 38, 225);  // Crimson Red
          if (hashColor < 0.50) return color(239, 68, 68, 225);  // Fiery Scarlet Red
          if (hashColor < 0.75) return color(249, 115, 22, 225); // Fiery Orange-Red
          return color(185, 28, 28, 225);  // Deep Ruby Wine Red

        case 'ginkgo':
          if (hashColor < 0.35) return color(250, 204, 21, 225); // Bright Canary Yellow
          if (hashColor < 0.70) return color(234, 179, 8, 225);  // Sun Gold
          return color(245, 158, 11, 225); // Warm Honey

        case 'wisteria':
          if (hashColor < 0.33) return color(192, 132, 252, 220); // Pastel Lavender
          if (hashColor < 0.66) return color(168, 85, 247, 220);  // Royal Violet
          return color(232, 121, 249, 220); // Soft Orchid

        case 'frost':
          if (hashColor < 0.35) return color(56, 189, 248, 210);  // Ice Cyan
          if (hashColor < 0.70) return color(125, 211, 252, 220); // Diamond Sky
          return color(224, 242, 254, 230); // Frozen Crystal

        case 'sunset':
          if (hashColor < 0.33) return color(244, 63, 94, 220);  // Coral Red
          if (hashColor < 0.66) return color(251, 146, 60, 220);  // Fiery Peach
          return color(251, 191, 36, 220);  // Golden Flame

        case 'midnight':
          if (hashColor < 0.35) return color(99, 102, 241, 220);  // Celestial Indigo
          if (hashColor < 0.70) return color(59, 130, 246, 220);  // Sapphire Blue
          return color(129, 140, 248, 220); // Neon Violet-Blue

        case 'eucalyptus':
          if (hashColor < 0.35) return color(146, 185, 165, 225); // Glaucous Sage Silver Green
          if (hashColor < 0.70) return color(168, 202, 184, 230); // Powdered Eucalyptus White-Green
          return color(122, 160, 142, 225); // Dusty Eucalyptus Teal

        case 'cyberpunk':
          if (hashColor < 0.33) return color(6, 182, 212, 225);   // Neon Cyan
          if (hashColor < 0.66) return color(236, 72, 153, 225);  // Neon Pink
          return color(168, 85, 247, 225);  // Neon Purple

        case 'emerald':
        default:
          if (hashColor < 0.35) return color(52, 211, 153, 210); // Emerald Green
          if (hashColor < 0.70) return color(110, 231, 183, 220); // Mint Green
          return color(5, 150, 105, 220);  // Deep Forest Green
      }
    }

    drawSoftPointedLeaf(x, y, angle, w, h, pColor) {
      if (h < 0.6 || w < 0.2) return;
      
      let ctx = (typeof drawingContext !== 'undefined') ? drawingContext : null;
      if (ctx) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        if (h < 1.8) {
          ctx.strokeStyle = pColor.toString ? pColor.toString() : pColor;
          ctx.lineWidth = Math.max(0.4, w);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -h);
          ctx.stroke();
        } else if (h < 3.8) {
          ctx.fillStyle = pColor.toString ? pColor.toString() : pColor;
          ctx.beginPath();
          ctx.ellipse(0, -h * 0.5, Math.max(0.2, w * 0.5), h * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = pColor.toString ? pColor.toString() : pColor;
          ctx.scale(w, h);
          ctx.fill(FernLeafPath2DCache.getSoftPointedPath());
        }
        ctx.restore();
        return;
      }

      push();
      translate(x, y);
      rotate(angle);
      
      if (h < 1.8) {
        stroke(pColor);
        strokeWeight(max(0.4, w));
        line(0, 0, 0, -h);
      } else if (h < 3.8) {
        noStroke();
        fill(pColor);
        ellipse(0, -h * 0.5, w, h);
      } else {
        noStroke();
        fill(pColor);
        beginShape();
        vertex(0, 0);
        bezierVertex(-w * 0.5, -h * 0.05, -w * 1.0, -h * 0.12, -w * 1.0, -h * 0.25);
        bezierVertex(-w * 0.9, -h * 0.45, -w * 0.4, -h * 0.75, 0, -h);
        bezierVertex(w * 0.4, -h * 0.75, w * 0.9, -h * 0.45, w * 1.0, -h * 0.25);
        bezierVertex(w * 1.0, -h * 0.12, w * 0.5, -h * 0.05, 0, 0);
        endShape(CLOSE);
      }
      pop();
    }

    drawRoundedLeaf(x, y, angle, w, h, pColor) {
      if (h < 0.6 || w < 0.2) return;

      let ctx = (typeof drawingContext !== 'undefined') ? drawingContext : null;
      if (ctx) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        if (h < 1.2) {
          ctx.strokeStyle = pColor.toString ? pColor.toString() : pColor;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -h);
          ctx.stroke();
        } else if (h < 3.8) {
          ctx.fillStyle = pColor.toString ? pColor.toString() : pColor;
          ctx.beginPath();
          ctx.ellipse(0, -h * 0.5, Math.max(0.2, w * 0.5), h * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = pColor.toString ? pColor.toString() : pColor;
          ctx.scale(w, h);
          ctx.fill(FernLeafPath2DCache.getRoundedPath());
        }
        ctx.restore();
        return;
      }

      push();
      translate(x, y);
      rotate(angle);
      
      if (h < 1.2) {
        stroke(pColor);
        strokeWeight(0.6);
        line(0, 0, 0, -h);
      } else if (h < 3.8) {
        noStroke();
        fill(pColor);
        ellipse(0, -h * 0.5, w, h);
      } else {
        noStroke();
        fill(pColor);
        beginShape();
        vertex(0, 0);
        bezierVertex(-w * 0.9, -h * 0.1, -w * 1.2, -h * 0.6, -w * 0.6, -h * 0.9);
        bezierVertex(-w * 0.2, -h * 1.1, w * 0.2, -h * 1.1, w * 0.6, -h * 0.9);
        bezierVertex(w * 1.2, -h * 0.6, w * 0.9, -h * 0.1, 0, 0);
        endShape(CLOSE);
      }
      pop();
    }

    drawSegmentedLeaf(startX, startY, branchAngle, branchLen, pColor, ratio, widthScale) {
      if (widthScale === undefined) widthScale = 1.0;
      
      let M = 8;
      let step = branchLen / M;
      
      let curX = startX;
      let curY = startY;
      let curAngle = branchAngle;
      
      let frondPhase = (millis() / 1000.0) * 3.4;
      let activeWind = this.windStrength * (1.0 + 2.0 * (noise(this.seed + startX * 0.05 + startY * 0.05) - 0.5));
      let segmentSway = sin(frondPhase) * (activeWind * 0.006);
      
      let gravityStrength = 0.13 * (branchLen > 80 ? 1.0 : 0.35);
      
      let pts = [];
      for (let m = 0; m <= M; m++) {
        pts.push({ x: curX, y: curY, u: m / M, angle: curAngle });
        curX += step * sin(curAngle);
        curY -= step * cos(curAngle);
        
        let u = m / M;
        let gravityBend = gravityStrength * sin(curAngle) * Math.pow(u, 1.2);
        curAngle += segmentSway + gravityBend;
      }
      
      let maxW = branchLen * ratio * widthScale;
      
      noStroke();
      fill(pColor);
      
      for (let m = 0; m < M; m++) {
        let pt1 = pts[m];
        let pt2 = pts[m + 1];
        
        let w1 = maxW * Math.pow(pt1.u, 0.35) * (1.0 - pt1.u) * 2.15;
        let w2 = maxW * Math.pow(pt2.u, 0.35) * (1.0 - pt2.u) * 2.15;
        
        let x1_L = pt1.x - w1 * 0.5 * cos(pt1.angle);
        let y1_L = pt1.y - w1 * 0.5 * sin(pt1.angle);
        let x1_R = pt1.x + w1 * 0.5 * cos(pt1.angle);
        let y1_R = pt1.y + w1 * 0.5 * sin(pt1.angle);
        
        let x2_L = pt2.x - w2 * 0.5 * cos(pt2.angle);
        let y2_L = pt2.y - w2 * 0.5 * sin(pt2.angle);
        let x2_R = pt2.x + w2 * 0.5 * cos(pt2.angle);
        let y2_R = pt2.y + w2 * 0.5 * sin(pt2.angle);
        
        beginShape();
        vertex(x1_L, y1_L);
        vertex(x2_L, y2_L);
        vertex(x2_R, y2_R);
        vertex(x1_R, y1_R);
        endShape(CLOSE);
      }
    }

    drawFernBranch(startX, startY, branchAngle, branchLen, baseThickness, currentLevel, maxLevel, pColor, widthScale, overridePairs, bId) {
      if (widthScale === undefined) widthScale = 1.0;
      if (bId === undefined) bId = 1;
      
      if (branchLen < 0.8) return;
      
      if (currentLevel >= maxLevel || branchLen < 2.5) {
        let leafWidthFactor = this.fernLeafletWidth / 100.0;
        let ratio = 0.065 * leafWidthFactor;
        if (currentLevel === 2) ratio = 0.12 * leafWidthFactor;
        else if (currentLevel === 3) ratio = 0.22 * leafWidthFactor;
        else if (currentLevel >= 4) ratio = 0.42 * leafWidthFactor;
        
        let levelWidthScale = Math.pow(0.82, currentLevel - 1);
        let leafScale = Math.pow(0.72, currentLevel - 1);
        
        let leafHash = (Math.abs(Math.sin(bId * 12.9898 + 78.233)) * 43758.5453) % 1;
        let leafHash2 = (Math.abs(Math.sin(bId * 73.987 + 12.45)) * 98765.4321) % 1;
        let leafHash3 = (Math.abs(Math.sin(bId * 19.345 + 56.78)) * 54321.0987) % 1;
        let leafHash4 = (Math.abs(Math.sin(bId * 87.654 + 34.21)) * 67890.1234) % 1;

        let angleOffset = (leafHash - 0.5) * radians(24) * this.treeVariation;
        let finalBranchLen = branchLen * (1.0 + (leafHash2 - 0.5) * 0.4 * this.treeVariation);
        let finalWidthScale = widthScale * (1.0 + (leafHash3 - 0.5) * 0.4 * this.treeVariation);
        let posX = startX + (leafHash4 - 0.5) * 4 * this.treeVariation;
        let posY = startY + (leafHash2 - 0.5) * 4 * this.treeVariation;

        let seedHashWidth = (Math.abs(Math.sin(this.seed * 18.3 + 4.5)) * 1000) % 1;
        let seedHashLen = (Math.abs(Math.sin(this.seed * 27.9 + 2.1)) * 1000) % 1;
        let seedHashShape = (Math.abs(Math.sin(this.seed * 88.8 + 1.1)) * 1000) % 1;
        
        let globalWidthMultiplier = map(seedHashWidth, 0, 1, 0.4, 1.8);
        let globalLenMultiplier = map(seedHashLen, 0, 1, 0.6, 1.5);
        let isRounded = (seedHashShape < 0.35);
        
        let leafCol = pColor;
        if (maxLevel <= 2) {
          this.drawSegmentedLeaf(posX, posY, branchAngle + angleOffset, finalBranchLen * globalLenMultiplier, leafCol, ratio, finalWidthScale * levelWidthScale * leafScale * globalWidthMultiplier);
        } else {
          let w = finalBranchLen * ratio * finalWidthScale * levelWidthScale * leafScale * globalWidthMultiplier;
          let h = finalBranchLen * leafScale * globalLenMultiplier;
          
          if (isRounded) {
            this.drawRoundedLeaf(posX, posY, branchAngle + angleOffset, w, h, leafCol);
          } else {
            this.drawSoftPointedLeaf(posX, posY, branchAngle + angleOffset, w, h, leafCol);
          }
        }
        return;
      }

      let levelPairs = (overridePairs !== undefined) ? overridePairs : Math.max(2, Math.round(this.fernBranchPoints * Math.pow(0.65, currentLevel)));
      let M = levelPairs + 1;
      
      let step = branchLen / M;
      let curX = startX;
      let curY = startY;
      
      let pts = [];
      for (let m = 0; m <= M; m++) {
        pts.push({ x: curX, y: curY, u: m / M });
        curX += step * sin(branchAngle);
        curY -= step * cos(branchAngle);
      }
      
      stroke(pColor);
      noFill();
      for (let m = 0; m < M; m++) {
        let u = m / M;
        let segThick = max(0.2, baseThickness * 0.72 * Math.pow(1.0 - u, 1.2));
        strokeWeight(segThick);
        line(pts[m].x, pts[m].y, pts[m + 1].x, pts[m + 1].y);
      }
      
      let altFactor = this.fernAlternateRate / 100.0;
      let seedHashAng = (Math.abs(Math.sin(this.seed * 42.12 + 8.9)) * 1000) % 1;
      let globalDeepBaseAng = map(seedHashAng, 0, 1, 40.0, 90.0);
      
      let baseAng = (currentLevel === 1) ? 50.0 : globalDeepBaseAng;
      let tipAng  = (currentLevel === 1) ? 6.0  : 5.0;
      
      let P = levelPairs;
      let reduceCount = Math.max(1, Math.round(P * 0.25));
      let defaultChildPairs = Math.max(2, Math.round(this.fernBranchPoints * Math.pow(0.65, currentLevel + 1)));
      
      for (let m = 1; m < M; m++) {
        let distFromTipL = P - m;
        let childPairsL = defaultChildPairs;
        if (distFromTipL < reduceCount) {
          let steps = reduceCount - distFromTipL;
          childPairsL = Math.max(2, Math.round(defaultChildPairs * Math.pow(0.65, steps)));
        }
        
        let uL = m / M;
        
        let hashL = (Math.abs(Math.sin(bId * 11.1 + m * 44.4)) * 1000) % 1;
        let hashL2 = (Math.abs(Math.sin(bId * 55.5 + m * 88.8)) * 1000) % 1;
        let hashL3 = (Math.abs(Math.sin(bId * 99.9 + m * 33.3)) * 1000) % 1;
        
        let uL_var = uL + (hashL - 0.5) * 0.08 * this.treeVariation;
        uL_var = constrain(uL_var, 0.05, 0.95);
        
        let xL = startX + uL_var * branchLen * sin(branchAngle);
        let yL = startY - uL_var * branchLen * cos(branchAngle);
        
        let subLenL = branchLen * 1.15 * Math.pow(uL_var, 0.4) * Math.pow(1.0 - uL_var, 1.3);
        subLenL *= (1.0 + (hashL2 - 0.5) * 0.25 * this.treeVariation);
        
        if (subLenL >= 2.5 && currentLevel + 1 < maxLevel) {
          let childWidthScaleL = widthScale * (1.0 - uL_var * 0.55);
          let subBranchAngleL = map(uL_var, 0, 1, radians(baseAng), radians(tipAng));
          let angleDevL = (hashL3 - 0.5) * radians(15) * this.treeVariation;
          
          let subThickL = max(0.3, baseThickness * 0.4 * (1.0 - 0.4 * uL_var));
          let childIdL = bId * 100 + m * 2;
          this.drawFernBranch(xL, yL, branchAngle - (subBranchAngleL + angleDevL), subLenL, subThickL, currentLevel + 1, maxLevel, pColor, childWidthScaleL, childPairsL, childIdL);
        } else if (subLenL >= 1.0) {
          let subBranchAngleL = map(uL_var, 0, 1, radians(baseAng), radians(tipAng));
          this.drawSoftPointedLeaf(xL, yL, branchAngle - subBranchAngleL, subLenL * 0.35, subLenL, pColor);
        }
        
        let distFromTipR = P - (m + 0.5 * altFactor);
        let childPairsR = defaultChildPairs;
        if (distFromTipR < reduceCount) {
          let steps = reduceCount - distFromTipR;
          childPairsR = Math.max(2, Math.round(defaultChildPairs * Math.pow(0.65, steps)));
        }
        
        let uR = (m + 0.5 * altFactor) / M;
        
        let hashR = (Math.abs(Math.sin(bId * 12.3 + m * 78.9)) * 1000) % 1;
        let hashR2 = (Math.abs(Math.sin(bId * 90.1 + m * 67.8)) * 1000) % 1;
        let hashR3 = (Math.abs(Math.sin(bId * 34.5 + m * 90.1)) * 1000) % 1;
        
        let uR_var = uR + (hashR - 0.5) * 0.08 * this.treeVariation;
        uR_var = constrain(uR_var, 0.05, 0.95);
        
        let xR = startX + uR_var * branchLen * sin(branchAngle);
        let yR = startY - uR_var * branchLen * cos(branchAngle);
        
        let subLenR = branchLen * 1.15 * Math.pow(uR_var, 0.4) * Math.pow(1.0 - uR_var, 1.3);
        subLenR *= (1.0 + (hashR2 - 0.5) * 0.25 * this.treeVariation);
        
        if (subLenR >= 2.5 && currentLevel + 1 < maxLevel) {
          let childWidthScaleR = widthScale * (1.0 - uR_var * 0.55);
          let subBranchAngleR = map(uR_var, 0, 1, radians(baseAng), radians(tipAng));
          let angleDevR = (hashR3 - 0.5) * radians(15) * this.treeVariation;
          
          let subThickR = max(0.3, baseThickness * 0.4 * (1.0 - 0.4 * uR_var));
          let childIdR = bId * 100 + m * 2 + 1;
          this.drawFernBranch(xR, yR, branchAngle + (subBranchAngleR + angleDevR), subLenR, subThickR, currentLevel + 1, maxLevel, pColor, childWidthScaleR, childPairsR, childIdR);
        } else if (subLenR >= 1.0) {
          let subBranchAngleR = map(uR_var, 0, 1, radians(baseAng), radians(tipAng));
          this.drawSoftPointedLeaf(xR, yR, branchAngle + subBranchAngleR, subLenR * 0.35, subLenR, pColor);
        }
      }
    }

    drawFrond(heightFactor, animTime, frondDuration, leafletBranchAngle, frondColor, time, i, baseAngle) {
      let p = min(animTime / frondDuration, 1.0);
      if (p <= 0) return;
      
      let N = this.fernBranchPoints;
      let countToDraw = Math.floor(N * p);
      let h = this.initLength * heightFactor;
      
      let frondPhase = time * 3.4 + i * 0.08;
      let activeWind = this.windStrength * (1.0 + 2.0 * (noise(this.seed + i * 15.3 + time * 0.4) - 0.5));
      let baseSway = sin(frondPhase) * (activeWind * 0.075);
      
      let M = 60;
      let spinePoints = [];
      let curX = 0;
      let curY = 0;
      let curAngle = baseAngle;
      let stepLenDetailed = h / M;
      let spineCurvatureDetailed = radians(12.0 / M) * (noise(this.seed + i * 19.8) - 0.5);
      let totalGravity = 0.65;
      
      for (let k = 0; k <= M; k++) {
        let t = k / M;
        let bendingFactor = 1.0 + 12.5 * Math.pow(t, 2.4);
        let currentAngle = curAngle + baseSway * bendingFactor;
        
        spinePoints.push({
          x: curX,
          y: curY,
          angle: currentAngle,
          t: t
        });
        
        curX += stepLenDetailed * sin(currentAngle);
        curY -= stepLenDetailed * cos(currentAngle);
        
        let gravityStep = (totalGravity * sin(currentAngle) * Math.pow(t, 1.3)) / M;
        curAngle += spineCurvatureDetailed + gravityStep;
      }
      
      let countToDrawDetailed = Math.floor(M * p);
      noStroke();
      
      let transitionLimit = 0.22;
      if (this.maxDepth === 0) {
        let factor = this.currentTrunkHeightFactor !== undefined ? this.currentTrunkHeightFactor : 1.0;
        transitionLimit = map(factor, 0, 1, 0.08, 0.26);
      }
      
      for (let k = 0; k < countToDrawDetailed; k++) {
        let pt1 = spinePoints[k];
        let pt2 = spinePoints[k + 1];
        if (!pt2) break;
        
        let t1 = pt1.t;
        let t2 = pt2.t;
        
        let thick1, thick2;
        
        if (t1 < transitionLimit) {
          let bulge1 = 1.0 + (6.5 - 1.0) * Math.pow(1.0 - (t1 / transitionLimit), 3.5);
          thick1 = max(0.2, this.initThickness * 1.3 * Math.pow(1.0 - t1, 1.25) * bulge1);
        } else {
          let stemThick1 = this.initThickness * 1.3 * Math.pow(1.0 - t1, 1.25);
          let leafThick1 = 0;
          if (this.maxDepth === 0) {
            let u1 = (t1 - transitionLimit) / (1.0 - transitionLimit);
            let maxW = h * (this.fernLeafletWidth / 100.0) * 0.11;
            leafThick1 = maxW * Math.pow(u1, 0.35) * (1.0 - u1) * 2.15;
          }
          thick1 = max(0.2, stemThick1 + leafThick1);
        }
        
        if (t2 < transitionLimit) {
          let bulge2 = 1.0 + (6.5 - 1.0) * Math.pow(1.0 - (t2 / transitionLimit), 3.5);
          thick2 = max(0.2, this.initThickness * 1.3 * Math.pow(1.0 - t2, 1.25) * bulge2);
        } else {
          let stemThick2 = this.initThickness * 1.3 * Math.pow(1.0 - t2, 1.25);
          let leafThick2 = 0;
          if (this.maxDepth === 0) {
            let u2 = (t2 - transitionLimit) / (1.0 - transitionLimit);
            let maxW = h * (this.fernLeafletWidth / 100.0) * 0.11;
            leafThick2 = maxW * Math.pow(u2, 0.35) * (1.0 - u2) * 2.15;
          }
          thick2 = max(0.2, stemThick2 + leafThick2);
        }
        
        let w1 = thick1 / 2;
        let w2 = thick2 / 2;
        
        let nx1 = cos(pt1.angle);
        let ny1 = sin(pt1.angle);
        let nx2 = cos(pt2.angle);
        let ny2 = sin(pt2.angle);
        
        let x1_L = pt1.x - w1 * nx1, y1_L = pt1.y - w1 * ny1;
        let x1_R = pt1.x + w1 * nx1, y1_R = pt1.y + w1 * ny1;
        
        let x2_L = pt2.x - w2 * nx2, y2_L = pt2.y - w2 * ny2;
        let x2_R = pt2.x + w2 * nx2, y2_R = pt2.y + w2 * ny2;
        
        fill(frondColor);
        noStroke();
        beginShape();
        vertex(x1_L, y1_L);
        vertex(x2_L, y2_L);
        vertex(x2_R, y2_R);
        vertex(x1_R, y1_R);
        endShape(CLOSE);
      }
      
      noStroke();
      
      if (this.maxDepth === 0) {
        let startIndex = Math.floor(M * transitionLimit);
        let endIndex = countToDrawDetailed - 1;
        
        for (let k = startIndex; k < endIndex; k++) {
          let pt1 = spinePoints[k];
          let pt2 = spinePoints[k + 1];
          if (!pt2) break;
          
          let t1 = pt1.t;
          stroke(frondColor);
          
          let u = (t1 - transitionLimit) / (1.0 - transitionLimit);
          let veinThick = map(u, 0, 1, 1.3, 0.3);
          strokeWeight(veinThick);
          
          line(pt1.x, pt1.y, pt2.x, pt2.y);
        }
        noStroke();
      }
      
      if (this.maxDepth > 0) {
        let getSpinePointAtT = (tVal, ptsList) => {
          let len = ptsList.length;
          let idxFloat = tVal * (len - 1);
          let idxFloor = Math.floor(idxFloat);
          let idxCeil = Math.ceil(idxFloat);
          if (idxFloor >= len) return ptsList[len - 1];
          if (idxFloor === idxCeil) return ptsList[idxFloor];
          
          let frac = idxFloat - idxFloor;
          let pF = ptsList[idxFloor];
          let pC = ptsList[idxCeil];
          
          return {
            x: lerp(pF.x, pC.x, frac),
            y: lerp(pF.y, pC.y, frac),
            angle: lerp(pF.angle, pC.angle, frac),
            t: lerp(pF.t, pC.t, frac)
          };
        };
        
        let altFrac = this.fernAlternateRate / 100.0;
        
        for (let k = 1; k <= countToDraw; k++) {
          let tL = k / N;
          let ptL = getSpinePointAtT(tL, spinePoints);
          
          let angleBase = 90.0;
          let angleTip = 8.0;
          let currentBranchAngleL = map(tL, 0, 1, radians(angleBase), radians(angleTip));
          
          let maxLen = h * (this.fernLeafletLength / 100.0);
          let leafletLenL = maxLen * Math.pow(tL, 0.45) * Math.pow(1.0 - tL, this.fernTaperProfile);
          let lenVarL = (noise(this.seed + k * 14.3 + i * 7.2) - 0.5) * 0.22;
          leafletLenL *= (1.0 + lenVarL);
          
          let reduceCount = Math.max(1, Math.round(N * 0.25));
          let defaultChildPairs = Math.max(2, Math.round(this.fernBranchPoints * 0.65));
          let distFromTipL = N - k;
          let childPairsL = defaultChildPairs;
          if (distFromTipL < reduceCount) {
            let steps = reduceCount - distFromTipL;
            childPairsL = Math.max(2, Math.round(defaultChildPairs * Math.pow(0.65, steps)));
          }
          
          if (leafletLenL >= 2.0) {
            let stemThickL = max(0.5, this.initThickness * (1.3 - 1.05 * tL));
            let thetaL = ptL.angle - currentBranchAngleL;
            this.drawFernBranch(ptL.x, ptL.y, thetaL, leafletLenL, stemThickL, 1, this.maxDepth, frondColor, 1.0, childPairsL, i * 1000 + k * 2);
          }
          
          let tR = (k + 0.5 * altFrac) / N;
          if (tR <= p) {
            let ptR = getSpinePointAtT(tR, spinePoints);
            
            let currentBranchAngleR = map(tR, 0, 1, radians(angleBase), radians(angleTip));
            let leafletLenR = maxLen * Math.pow(tR, 0.45) * Math.pow(1.0 - tR, this.fernTaperProfile);
            let lenVarR = (noise(this.seed + (k + 0.5 * altFrac) * 14.3 + i * 7.2) - 0.5) * 0.22;
            leafletLenR *= (1.0 + lenVarR);
            
            let reduceCountR = Math.max(1, Math.round(N * 0.25));
            let defaultChildPairsR = Math.max(2, Math.round(this.fernBranchPoints * 0.65));
            let distFromTipR = N - (k + 0.5 * altFrac);
            let childPairsR = defaultChildPairsR;
            if (distFromTipR < reduceCountR) {
              let steps = reduceCountR - distFromTipR;
              childPairsR = Math.max(2, Math.round(defaultChildPairsR * Math.pow(0.65, steps)));
            }
            
            if (leafletLenR >= 2.0) {
              let stemThickR = max(0.5, this.initThickness * (1.3 - 1.05 * tR));
              let thetaR = ptR.angle + currentBranchAngleR;
              this.drawFernBranch(ptR.x, ptR.y, thetaR, leafletLenR, stemThickR, 1, this.maxDepth, frondColor, 1.0, childPairsR, i * 1000 + k * 2 + 1);
            }
          }
        }
      }
    }

    draw(p, options = {}) {
      push();
      
      let time;
      if (typeof p === 'number') {
        time = p;
      } else if (options && options.time !== undefined) {
        time = options.time;
      } else {
        time = millis() / 1000.0;
      }
      let count = this.fernFrondCount;
      let spread = this.fernSpreadAngle;
      let { staggerDelay, frondDuration } = this.getFrondTiming();
      
      let trunkHash = (Math.abs(Math.sin(this.seed * 53.7 + 12.9)) * 1000) % 1;
      let trunkHeightFactor = trunkHash < 0.25 ? 0 : map(trunkHash, 0.25, 1.0, 0, 1.0);
      this.currentTrunkHeightFactor = trunkHeightFactor;
      let trunkLength = this.initLength * 0.12 * trunkHeightFactor;
      
      let N = trunkLength < 30 ? 3 : 5;
      let step = trunkLength / N;
      let curX = 0;
      let curY = 0;
      let curAngle = 0;
      
      let trunkCurvature = radians(8.0 / N) * (noise(this.seed + 50.5) - 0.5) * this.treeVariation;
      let trunkSway = sin(time * 2.5) * (this.windStrength * 0.005) * this.treeVariation;
      
      let trunkPoints = [];
      for (let k = 0; k <= N; k++) {
        let t = k / N;
        let angle = curAngle + trunkSway * Math.pow(t, 2);
        trunkPoints.push({ x: curX, y: curY, angle: angle, t: t });
        
        curX += step * sin(angle);
        curY -= step * cos(angle);
        curAngle += trunkCurvature;
      }
      
      let sheathBaseScale = this.initThickness * 1.3 * 6.5;
      
      if (trunkLength > 0) {
        noStroke();
        let baseSheathCol = this.getLeafThemeColor(this.seed);
        let trunkCol = lerpColor(baseSheathCol, color(20, 20, 20), 0.35);
        trunkCol.setAlpha(0.92);
        fill(trunkCol);

        for (let k = 0; k < N; k++) {
          let pt1 = trunkPoints[k];
          let pt2 = trunkPoints[k + 1];
          if (!pt2) break;
          
          let t1 = pt1.t;
          let t2 = pt2.t;
          
          let w1 = sheathBaseScale * (1.45 - 0.40 * Math.pow(t1, 1.5)) / 2;
          let w2 = sheathBaseScale * (1.45 - 0.40 * Math.pow(t2, 1.5)) / 2;
          
          let nx1 = cos(pt1.angle), ny1 = sin(pt1.angle);
          let nx2 = cos(pt2.angle), ny2 = sin(pt2.angle);
          
          let x1_L = pt1.x - w1 * nx1, y1_L = pt1.y - w1 * ny1;
          let x1_R = pt1.x + w1 * nx1, y1_R = pt1.y + w1 * ny1;
          
          let x2_L = pt2.x - w2 * nx2, y2_L = pt2.y - w2 * ny2;
          let x2_R = pt2.x + w2 * nx2, y2_R = pt2.y + w2 * ny2;
          
          beginShape();
          vertex(x1_L, y1_L);
          vertex(x2_L, y2_L);
          vertex(x2_R, y2_R);
          vertex(x1_R, y1_R);
          endShape(CLOSE);
        }
      }
      
      let topPt = trunkPoints[N];
      let topW = sheathBaseScale * (1.45 - 0.40 * Math.pow(1.0, 1.5));
      let baseSheathCol = this.getLeafThemeColor(this.seed);
      let capCol = lerpColor(baseSheathCol, color(20, 20, 20), 0.35);
      capCol.setAlpha(0.92);
      fill(capCol);
      noStroke();
      ellipse(topPt.x, topPt.y, topW, topW);
      
      translate(topPt.x, topPt.y);
      rotate(topPt.angle);
      
      let leafletBranchAngle = radians(50 + this.treeVariation * 30);
      
      let cycleDuration = 3.0;
      let currentCycle = Math.floor(time / cycleDuration);
      let cycleProgress = (time % cycleDuration) / cycleDuration;
      let transitionFrac = 2.5 / cycleDuration;
      let t = Math.min(1.0, cycleProgress / transitionFrac);
      let easedProgress = t * t * (3.0 - 2.0 * t);
      
      for (let i = 0; i < count; i++) {
        let baseAngleVal = count > 1 ? map(i, 0, count - 1, -spread, spread) : 0;
        baseAngleVal += (noise(this.seed + i * 15.3) - 0.5) * 8.0;
        
        let prevMag  = map(noise(this.seed + i * 27.4 + currentCycle * 5.7), 0, 1, 9, 21);
        let prevSign = noise(this.seed + i * 83.1 + currentCycle * 7.3) > 0.5 ? 1 : -1;
        let prevOffset = prevSign * prevMag;
        
        let nextMag  = map(noise(this.seed + i * 27.4 + (currentCycle + 1) * 5.7), 0, 1, 9, 21);
        let nextSign = noise(this.seed + i * 83.1 + (currentCycle + 1) * 7.3) > 0.5 ? 1 : -1;
        let nextOffset = nextSign * nextMag;
        let swayOffset = lerp(prevOffset, nextOffset, easedProgress);
        
        let angleVal = constrain(baseAngleVal + swayOffset, -spread, spread);
        
        let lengthNoise = noise(this.seed + i * 43.1 + 12.3);
        let heightFactor = map(lengthNoise, 0, 1, 0.50, 1.15);
        
        let frondStartTime = i * staggerDelay;
        let localAnimTime = this.animationTime - frondStartTime;
        
        if (localAnimTime >= 0) {
          // Mỗi cành chính (cấp 0 / tàu lá thứ i) của dương xỉ là 1 lá và mang 1 màu ngẫu nhiên của theme từ gốc đến ngọn
          let frondColor = this.getLeafThemeColor(this.seed * 1000 + i * 37 + 11);
          let baseAngle = radians(angleVal);
          
          this.drawFrond(heightFactor, localAnimTime, frondDuration, leafletBranchAngle, frondColor, time, i, baseAngle);
        }
      }
      
      pop();
    }
  }

  // Export for Browser global & Node/ES module compatibility
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BarnsleyFernTree;
  } else {
    global.BarnsleyFernTree = BarnsleyFernTree;
  }
})(typeof window !== 'undefined' ? window : this);
