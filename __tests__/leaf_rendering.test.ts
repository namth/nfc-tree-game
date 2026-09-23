import { FractalTreeBridge } from '../src/engine/fractal/FractalTreeBridge';
import { TreeGenetics, LeafType, LeafPalette } from '../src/types';

describe('Leaf Rendering & Falling Leaves Engine', () => {
  const baseGenetics: TreeGenetics = {
    leafType: LeafType.POINTED,
    paletteIndex: LeafPalette.EMERALD,
    branchAngle: 24,
    lengthDecay: 0.75,
    thicknessDecay: 0.55,
    initThickness: 36,
    maxDepth: 9,
    treeVariation: 0.80,
    trunkColor: '#2d2219',
    dnaSeed: 12345678
  };

  it('should generate multiple authentic leaf color layers for Emerald palette', () => {
    const svgOutput = FractalTreeBridge.generateAuthenticSvg(
      baseGenetics,
      1.0,
      0.82,
      0,
      1.0,
      0,
      undefined,
      false
    );

    expect(svgOutput.leafLayers.length).toBeGreaterThanOrEqual(2);
    // Colors should not all be identical
    const uniqueColors = new Set(svgOutput.leafLayers.map(l => l.color));
    expect(uniqueColors.size).toBeGreaterThanOrEqual(2);
  });

  it('should generate multi-shade leaf layers across different palettes (Sakura, Autumn, Golden, Ruby, Shadow)', () => {
    const palettesToTest = [
      LeafPalette.SAKURA,
      LeafPalette.AUTUMN,
      LeafPalette.GOLDEN,
      LeafPalette.RUBY,
      LeafPalette.SHADOW
    ];

    for (const pal of palettesToTest) {
      const genetics: TreeGenetics = {
        ...baseGenetics,
        paletteIndex: pal,
        dnaSeed: 99887766 + pal
      };

      const svgOutput = FractalTreeBridge.generateAuthenticSvg(
        genetics,
        1.0,
        0.82,
        0,
        1.0,
        0,
        undefined,
        false
      );

      expect(svgOutput.leafLayers.length).toBeGreaterThan(0);
      const uniqueColors = new Set(svgOutput.leafLayers.map(l => l.color));
      expect(uniqueColors.size).toBeGreaterThanOrEqual(2);
    }
  });

  it('should have activeFallingCount === 0 for static idle mature tree', () => {
    const svgOutput = FractalTreeBridge.generateAuthenticSvg(
      baseGenetics,
      1.0,
      0.82,
      0,
      1.0,
      0,
      undefined,
      false // static, not animating
    );

    expect(svgOutput.activeFallingCount).toBe(0);
  });

  it('should produce activeFallingCount and allow leaves to settle to 0 during animated settle phase', () => {
    const totalDuration = FractalTreeBridge.getTotalGrowthDuration(baseGenetics);
    expect(totalDuration).toBeGreaterThan(5.0);

    // At late growth, active falling leaves can exist when isAnimating = true
    const animatedSvg = FractalTreeBridge.generateAuthenticSvg(
      baseGenetics,
      1.0,
      0.82,
      0,
      1.0,
      0,
      totalDuration, // right at 100% boundary
      true // isAnimating
    );

    // After settling by 5 seconds past totalDuration, all falling leaves must have hit ground and vanished
    const settledSvg = FractalTreeBridge.generateAuthenticSvg(
      baseGenetics,
      1.0,
      0.82,
      0,
      1.0,
      0,
      totalDuration + 6.0,
      true
    );

    expect(settledSvg.activeFallingCount).toBe(0);
  });

  it('should generate distinct, organic branch geometries for different DNA seeds', () => {
    const tree1 = FractalTreeBridge.generateAuthenticSvg(
      { ...baseGenetics, dnaSeed: 111111 },
      1.0,
      0.82
    );
    const tree2 = FractalTreeBridge.generateAuthenticSvg(
      { ...baseGenetics, dnaSeed: 222222 },
      1.0,
      0.82
    );
    const tree3 = FractalTreeBridge.generateAuthenticSvg(
      { ...baseGenetics, dnaSeed: 333333 },
      1.0,
      0.82
    );

    // Branch SVG paths must not be identical across different seeds
    expect(tree1.branchesPath).not.toEqual(tree2.branchesPath);
    expect(tree1.branchesPath.length).toBeGreaterThan(100);
    expect(tree2.branchesPath.length).toBeGreaterThan(100);
    expect(tree3.branchesPath.length).toBeGreaterThan(100);
  });

  it('should render tamarind leaves (SINGLE_NEEDLE) cleanly into leafLayers without errors', () => {
    const tamarindGenetics: TreeGenetics = {
      leafType: LeafType.SINGLE_NEEDLE,
      paletteIndex: LeafPalette.EMERALD,
      branchAngle: 25,
      lengthDecay: 0.75,
      thicknessDecay: 0.55,
      initThickness: 32,
      maxDepth: 8,
      treeVariation: 0.75,
      trunkColor: '#2d2219',
      dnaSeed: 88776655
    };

    const svgOutput = FractalTreeBridge.generateAuthenticSvg(
      tamarindGenetics,
      1.0,
      0.82,
      0,
      1.0,
      0,
      undefined,
      false
    );

    expect(svgOutput.leafLayers.length).toBeGreaterThan(0);
    const hasLeafPath = svgOutput.leafLayers.some(layer => layer.d && layer.d.length > 0);
    expect(hasLeafPath).toBe(true);
  });

  it('should render golden Kim Sa (GOLDEN) leaves with warm tones and isolated bridge execution', () => {
    const goldenGenetics: TreeGenetics = {
      leafType: LeafType.ROUND,
      paletteIndex: LeafPalette.GOLDEN,
      branchAngle: 26,
      lengthDecay: 0.74,
      thicknessDecay: 0.54,
      initThickness: 34,
      maxDepth: 8,
      treeVariation: 0.8,
      trunkColor: '#3d2b1f',
      dnaSeed: 99998888
    };

    const svgOutput = FractalTreeBridge.generateAuthenticSvg(
      goldenGenetics,
      1.0,
      0.82,
      0.5,
      1.0,
      0,
      undefined,
      false
    );

    expect(svgOutput.leafLayers.length).toBeGreaterThan(0);
    const goldenColors = svgOutput.leafLayers.map(l => l.color);
    const hasGold = goldenColors.some(c => c.includes('254') || c.includes('250') || c.includes('202'));
    expect(hasGold).toBe(true);
  });

  it('should preserve alpha channel for glowing fruit (e.g. 0.18, 0.45 halo) without turning opaque', () => {
    // Mature tree with treeVariation > 0 produces fruit at terminal branches (e.g. GINKGO_FAN has single_glow fruit)
    const fruitGenetics: TreeGenetics = {
      leafType: LeafType.GINKGO_FAN,
      paletteIndex: LeafPalette.GINKGO,
      branchAngle: 24,
      lengthDecay: 0.75,
      thicknessDecay: 0.55,
      initThickness: 36,
      maxDepth: 9,
      treeVariation: 1.0,
      trunkColor: '#2d2219',
      dnaSeed: 12345678
    };

    const svgOutput = FractalTreeBridge.generateAuthenticSvg(
      fruitGenetics,
      1.0, // 100% mature
      0.82
    );

    // Verify there are layers with rgba alpha < 0.5 (representing soft halo glow of fruits)
    const hasAlphaGlow = svgOutput.leafLayers.some(layer => {
      const match = layer.color.match(/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/);
      if (match) {
        const alpha = parseFloat(match[1]);
        return alpha <= 0.5;
      }
      return false;
    });

    expect(hasAlphaGlow).toBe(true);
  });

  it('should calculate valid canopy bounding box for Golden Kim Sa breathing aura', () => {
    const goldenGenetics: TreeGenetics = {
      leafType: LeafType.POINTED,
      paletteIndex: LeafPalette.GOLDEN,
      branchAngle: 24,
      lengthDecay: 0.75,
      thicknessDecay: 0.55,
      initThickness: 36,
      maxDepth: 9,
      treeVariation: 0.8,
      trunkColor: '#2d2219',
      dnaSeed: 987654
    };

    const svgOutput = FractalTreeBridge.generateAuthenticSvg(goldenGenetics, 1.0, 0.82);
    expect(svgOutput.bounds.width).toBeGreaterThan(0);
    expect(svgOutput.bounds.height).toBeGreaterThan(0);

    const canopyCenterX = (svgOutput.bounds.minX + svgOutput.bounds.maxX) / 2;
    const canopyCenterY = svgOutput.bounds.minY + svgOutput.bounds.height * 0.45;
    const canopyRadius = Math.max(svgOutput.bounds.width, svgOutput.bounds.height) * 0.52;

    expect(Number.isFinite(canopyCenterX)).toBe(true);
    expect(Number.isFinite(canopyCenterY)).toBe(true);
    expect(canopyRadius).toBeGreaterThan(50);
  });

  it('should render TUNG_LAHAN (Tùng La Hán) leaves with authentic leaf color layers and not black petioles', () => {
    const tungLahanGenetics: TreeGenetics = {
      ...baseGenetics,
      leafType: LeafType.TUNG_LAHAN,
      paletteIndex: LeafPalette.GOLDEN,
      trunkColor: '#4a3b2c'
    };

    const svgOutput = FractalTreeBridge.generateAuthenticSvg(tungLahanGenetics, 1.0, 0.82);

    expect(svgOutput.leafLayers.length).toBeGreaterThan(0);
    // Golden palette contains yellow/amber hues like rgb(254, 240, 138) or rgb(250, 204, 21), NOT trunk color
    const allLeafColors = svgOutput.leafLayers.map(l => l.color);
    expect(allLeafColors.some(c => c.includes('254') || c.includes('250') || c.includes('202') || c.includes('yellow'))).toBe(true);
    // None of the leaf layers should be the trunk color
    expect(allLeafColors).not.toContain('#4a3b2c');
    expect(allLeafColors).not.toContain('#000000');
  });

  it('should render NEEDLE (Lá thông 7 kim) and WILLOW leaves with authentic leaf color layers', () => {
    const needleGenetics: TreeGenetics = {
      ...baseGenetics,
      leafType: LeafType.NEEDLE,
      paletteIndex: LeafPalette.RUBY,
      trunkColor: '#5c2a2a'
    };

    const svgOutput = FractalTreeBridge.generateAuthenticSvg(needleGenetics, 1.0, 0.82);
    expect(svgOutput.leafLayers.length).toBeGreaterThan(0);
    const allLeafColors = svgOutput.leafLayers.map(l => l.color);
    expect(allLeafColors.some(c => c.includes('251') || c.includes('244') || c.includes('190'))).toBe(true);
    expect(allLeafColors).not.toContain('#5c2a2a');

    const willowGenetics: TreeGenetics = {
      ...baseGenetics,
      leafType: LeafType.WILLOW,
      paletteIndex: LeafPalette.SAKURA,
      trunkColor: '#5c4033'
    };

    const willowSvg = FractalTreeBridge.generateAuthenticSvg(willowGenetics, 1.0, 0.82);
    expect(willowSvg.leafLayers.length).toBeGreaterThan(0);
  });

  it('should adapt FROST (Băng Tuyết) palette shades between Light and Dark mode', () => {
    const frostGenetics: TreeGenetics = {
      ...baseGenetics,
      leafType: LeafType.POINTED,
      paletteIndex: LeafPalette.FROST,
      trunkColor: '#3d4d3f'
    };

    // Dark Mode (isDark = true): generates luminous shades containing rgb(224, 242, 254) / rgb(125, 211, 252)
    const darkSvg = FractalTreeBridge.generateAuthenticSvg(
      frostGenetics,
      1.0,
      0.82,
      0,
      1.0,
      0,
      undefined,
      false,
      true
    );
    const darkColors = darkSvg.leafLayers.map(l => l.color);
    expect(darkColors.length).toBeGreaterThan(0);
    expect(darkColors.some(c => c.includes('224') || c.includes('125') || c.includes('56'))).toBe(true);

    // Light Mode (isDark = false): generates deeper vibrant glacial blue (Cobalt Azure rgb(2, 132, 199) or rgb(14, 165, 233))
    const lightSvg = FractalTreeBridge.generateAuthenticSvg(
      frostGenetics,
      1.0,
      0.82,
      0,
      1.0,
      0,
      undefined,
      false,
      false
    );
    const lightColors = lightSvg.leafLayers.map(l => l.color.replace(/\s+/g, ''));
    expect(lightColors.length).toBeGreaterThan(0);
    expect(lightColors.some(c => c.includes('2,132,199') || c.includes('14,165,233') || c.includes('56,189,248'))).toBe(true);
    // Light mode should NOT contain washed-out white/pale crystal rgb(224, 242, 254)
    expect(lightColors.some(c => c.includes('224,242,254'))).toBe(false);
  });
});


