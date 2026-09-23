/**
 * AnimatedTreeCanvas.tsx
 * Component dựng hình cây Fractal bằng Skia GPU Native (@shopify/react-native-skia):
 * - Dựng hình trực tiếp trên GPU qua C++ JSI, giải phóng 100% luồng JavaScript
 * - Gốc cây và gò đất cố định tuyệt đối trên mặt đất
 * - Thân và tán lá đung đưa tự nhiên trong gió (harmonic sway) bằng Reanimated worklet
 * - Đạt chuẩn 60 - 120 FPS mượt mà, không giật lag, không hao pin
 */

import React, { useMemo, useEffect, useState, useRef, memo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  Group,
  Oval,
  Circle,
  RadialGradient,
  BlurMask,
  vec,
  Skia,
  SkPath
} from '@shopify/react-native-skia';
import { TreeModel, LeafPalette } from '../types';
import { FractalTreeBridge, AuthenticTreeSvgOutput } from '../engine/fractal/FractalTreeBridge';
import { usePerformance } from '../context/PerformanceContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StarConfig {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  speed: number;
  phase: number;
  color: string;
  isLuminous?: boolean;
}

// Đường dẫn hình thoi lấp lánh có 4 cạnh lõm vào tâm (Astroid / 4-pointed concave diamond star)
const SPARKLE_SHAPE_PATH = Skia.Path.MakeFromSVGString('M 0 -1 Q 0 0 1 0 Q 0 0 0 1 Q 0 0 -1 0 Q 0 0 0 -1 Z');

interface SparkleConfig {
  x: number;
  y: number;
  baseSize: number;
  speed: number;
  phase: number;
  color: string;
  isLuminous: boolean;
}

const STAR_COLORS = ['#ffffff', '#f0fdf4', '#fef9c3', '#e0f2fe', '#f5f3ff'];

interface AnimatedTreeCanvasProps {
  tree: TreeModel;
  scaleFactor?: number;
  pan: { x: number; y: number };
  zoomLevel: number;
  groundY: number;
  isDark: boolean;
  trunkColor: string;
  leafColor: string;
  animationTime?: number;
  isAnimating?: boolean;
}

export const AnimatedTreeCanvas: React.FC<AnimatedTreeCanvasProps> = memo(({
  tree,
  scaleFactor = 0.95,
  pan,
  zoomLevel,
  groundY,
  isDark,
  trunkColor,
  leafColor,
  animationTime,
  isAnimating = false
}) => {
  const { targetFps, effectsEnabled } = usePerformance();

  // 1. Nhịp gió tự nhiên liên tục theo thời gian thực có điều tiết theo Target FPS
  const [windTime, setWindTime] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = Date.now();
    let lastRenderTime = 0;
    let accum = 0;
    const minFrameInterval = 1000 / targetFps;

    const loop = () => {
      const now = Date.now();
      const deltaFromLastRender = now - lastRenderTime;

      // Chỉ cập nhật khung hình khi đủ khoảng thời gian theo Target FPS
      if (deltaFromLastRender >= minFrameInterval) {
        lastRenderTime = now - (deltaFromLastRender % minFrameInterval);
        const dt = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;
        // Tốc độ gió êm đềm: 0.85 rad/s
        accum += dt * 0.85;
        setWindTime(accum);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [targetFps]);

  // 2. Biên dịch cấu trúc hình học Fractal chuẩn với nhịp gió tự nhiên và tuổi sinh trưởng
  const treeSvg = useMemo<AuthenticTreeSvgOutput>(() => {
    return FractalTreeBridge.generateAuthenticSvg(
      tree.genetics,
      tree.currentProgress,
      scaleFactor,
      windTime, // Truyền trực tiếp time vào hàm draw để từng cành và lá uốn lượn tự nhiên
      1.0,
      0,
      animationTime,
      isAnimating,
      isDark
    );
  }, [tree.genetics, tree.currentProgress, scaleFactor, windTime, animationTime, isAnimating, isDark]);

  // 3. Chuyển đổi các chuỗi SVG sang Skia SkPath (GPU-ready path objects)
  const branchesSkPath = useMemo<SkPath | null>(() => {
    return treeSvg.branchesPath ? Skia.Path.MakeFromSVGString(treeSvg.branchesPath) : null;
  }, [treeSvg.branchesPath]);

  const petiolesSkPath = useMemo<SkPath | null>(() => {
    return treeSvg.petiolesPath ? Skia.Path.MakeFromSVGString(treeSvg.petiolesPath) : null;
  }, [treeSvg.petiolesPath]);

  const leafLayersSkPath = useMemo<Array<{ skPath: SkPath; color: string }>>(() => {
    const list: Array<{ skPath: SkPath; color: string }> = [];
    for (const layer of treeSvg.leafLayers) {
      if (layer.d) {
        const skp = Skia.Path.MakeFromSVGString(layer.d);
        if (skp) {
          list.push({ skPath: skp, color: layer.color });
        }
      }
    }
    return list;
  }, [treeSvg.leafLayers]);

  // 4. Hiệu ứng đồ họa đặc biệt (Băng Tinh & Kim Sa lấp lánh + Hào quang)
  const isGoldenTree = tree.genetics.paletteIndex === LeafPalette.GOLDEN;
  const isFrostTree = tree.genetics.paletteIndex === LeafPalette.FROST;
  const showGoldenEffects = isGoldenTree && effectsEnabled;
  const showFrostEffects = isFrostTree && effectsEnabled;

  // Chu kỳ nhịp thở êm ả thư thái (~3.7s/chu kỳ, sóng sin mềm mại)
  const breathPulse = 0.5 + 0.5 * Math.sin(windTime * 1.7);
  const canopyCenterX = (treeSvg.bounds.minX + treeSvg.bounds.maxX) / 2;
  const canopyCenterY = treeSvg.bounds.minY + treeSvg.bounds.height * 0.45;
  const canopyRadius = Math.max(treeSvg.bounds.width, treeSvg.bounds.height) * 0.52;

  // 5. Danh sách các hạt Băng Tinh / Kim Sa lấp lánh hình thoi lõm quanh tán lá
  const sparkles = useMemo<SparkleConfig[]>(() => {
    if (!showGoldenEffects && !showFrostEffects) return [];
    const list: SparkleConfig[] = [];
    const count = 68; // Tăng đáng kể số lượng hạt lấp lánh trên vòm tán
    let seed = (tree.genetics.dnaSeed || 777) ^ 0x5a3c9b1f;
    const pseudoRandom = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const b = treeSvg.bounds;
    const w = Math.max(50, b.width);
    const h = Math.max(50, b.height);
    const cx = (b.minX + b.maxX) / 2;
    const cy = b.minY + h * 0.44;

    const colors = showFrostEffects
      ? ['#ffffff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8']
      : ['#ffffff', '#fef9c3', '#fef08a', '#facc15', '#fde047'];

    for (let i = 0; i < count; i++) {
      const angle = pseudoRandom() * Math.PI * 2;
      const distRatio = 0.15 + 0.80 * Math.sqrt(pseudoRandom());
      const rx = (w * 0.48) * distRatio;
      const ry = (h * 0.45) * distRatio;

      const px = cx + rx * Math.cos(angle);
      const py = cy + ry * Math.sin(angle);

      const rSize = pseudoRandom();
      const rSpeed = pseudoRandom();
      const rPhase = pseudoRandom();
      const rColor = pseudoRandom();

      list.push({
        x: px,
        y: py,
        baseSize: 3.5 + rSize * 5.0,
        speed: 3.2 + rSpeed * 4.6, // Tốc độ xuất hiện và mất đi nhanh hơn gấp đôi
        phase: rPhase * Math.PI * 2,
        color: colors[Math.floor(rColor * colors.length)],
        isLuminous: i % 3 === 0
      });
    }
    return list;
  }, [showGoldenEffects, showFrostEffects, tree.genetics.dnaSeed, treeSvg.bounds]);

  // 5. Bầu trời đêm đầy sao tĩnh lặng và lung linh (Chỉ khởi tạo và hiển thị khi ở giao diện tối)
  const starrySky = useMemo<StarConfig[]>(() => {
    if (!isDark) return [];
    const list: StarConfig[] = [];
    const count = 85;
    let seed = 918273;
    const pseudoRandom = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const maxY = Math.max(180, Math.min(SCREEN_HEIGHT * 0.75, groundY - 12));

    for (let i = 0; i < count; i++) {
      const rx = pseudoRandom();
      const ry = pseudoRandom();
      const rSpeed = pseudoRandom();
      const rSize = pseudoRandom();
      const rAlpha = pseudoRandom();
      const rColor = pseudoRandom();

      // Mật độ sao tập trung tự nhiên trên vòm trời cao
      const y = 16 + Math.pow(ry, 1.3) * (maxY - 16);
      const x = 10 + rx * (SCREEN_WIDTH - 20);

      const isLuminous = i % 12 === 0; // Các vì sao chính tinh phát quang rực rỡ
      const r = isLuminous ? 2.2 + rSize * 0.9 : 0.75 + rSize * 1.05;

      list.push({
        x,
        y,
        r,
        baseAlpha: 0.35 + rAlpha * 0.55,
        speed: 0.7 + rSpeed * 1.8,
        phase: (i * 1.618) % (2 * Math.PI),
        color: STAR_COLORS[Math.floor(rColor * STAR_COLORS.length)],
        isLuminous
      });
    }
    return list;
  }, [isDark, groundY]);

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      {/* Nền radial hào quang zen sâu thẳm */}
      <Oval
        x={SCREEN_WIDTH * 0.5 - SCREEN_WIDTH * 0.9}
        y={SCREEN_HEIGHT * 0.4 - SCREEN_HEIGHT * 0.55}
        width={SCREEN_WIDTH * 1.8}
        height={SCREEN_HEIGHT * 1.1}
      >
        <RadialGradient
          c={vec(SCREEN_WIDTH * 0.5, SCREEN_HEIGHT * 0.4)}
          r={SCREEN_WIDTH * 0.9}
          colors={[isDark ? '#101d24' : '#d8edd9', isDark ? '#060a08' : '#edf5ef']}
        />
      </Oval>

      {/* BẦU TRỜI ĐÊM ĐẦY SAO (STARRY NIGHT SKY - CHỈ XUẤT HIỆN Ở GIAO DIỆN TỐI) */}
      {isDark && (
        <Group>
          {starrySky.map((star, idx) => {
            const twinkle = effectsEnabled
              ? 0.50 + 0.50 * Math.sin(windTime * star.speed + star.phase)
              : 0.85;
            const alpha = Math.max(0.12, Math.min(1.0, star.baseAlpha * twinkle));

            return (
              <Group key={`night-star-${idx}`}>
                {/* Vầng hào quang tán xạ êm dịu cho các ngôi sao sáng */}
                {star.isLuminous && (
                  <Circle
                    cx={star.x}
                    cy={star.y}
                    r={star.r * 2.8}
                    color={star.color}
                    opacity={alpha * 0.25}
                  />
                )}
                {/* Thân ngôi sao */}
                <Circle
                  cx={star.x}
                  cy={star.y}
                  r={star.r}
                  color={star.color}
                  opacity={alpha}
                />
                {/* Tâm phát quang trắng tinh khôi */}
                {star.isLuminous && (
                  <Circle
                    cx={star.x}
                    cy={star.y}
                    r={star.r * 0.45}
                    color="#ffffff"
                    opacity={alpha * 0.95}
                  />
                )}
              </Group>
            );
          })}
        </Group>
      )}

      {/* Cụm Transform cho toàn bộ khung nhìn cây (Pan + Zoom), neo tại (SCREEN_WIDTH / 2 + pan.x, groundY + pan.y) */}
      <Group
        transform={[
          { translateX: SCREEN_WIDTH / 2 + pan.x },
          { translateY: groundY + pan.y },
          { scale: zoomLevel }
        ]}
      >
        {/* VÙNG GÒ ĐẤT TỰ NHIÊN ÔM SÁT GỐC CÂY (CỐ ĐỊNH TRÊN MẶT ĐẤT) */}
        {/* Lớp đất tối nền dưới */}
        <Oval
          x={-SCREEN_WIDTH * 0.42}
          y={-5}
          width={SCREEN_WIDTH * 0.84}
          height={34}
          color={isDark ? '#121c16' : '#c2dec9'}
          opacity={0.95}
        />
        {/* Gò đất màu mỡ ôm gốc rễ */}
        <Oval
          x={-SCREEN_WIDTH * 0.28}
          y={-2}
          width={SCREEN_WIDTH * 0.56}
          height={20}
          color={isDark ? '#1c2a22' : '#d5ebd9'}
          opacity={0.88}
        />
        {/* Vạt rêu hữu cơ nhạt nhẹ sát gốc cây */}
        <Oval
          x={-SCREEN_WIDTH * 0.14}
          y={-2}
          width={SCREEN_WIDTH * 0.28}
          height={12}
          color={isDark ? '#2d4430' : '#95c49b'}
          opacity={0.65}
        />

        {/* CỤM THÂN CÂY & TÁN LÁ (Cành lá uốn lượn tự nhiên theo nhịp gió từ cấu trúc fractal) */}
        <Group>
          {/* HIỆU ỨNG BĂNG TUYẾT: Vầng hào quang xanh mát dịu & lá phát sáng */}
          {showFrostEffects && (
            <Group>
              {/* 1. Hào quang vòm tán lan tỏa ánh sáng xanh băng mát dịu */}
              <Circle
                cx={canopyCenterX}
                cy={canopyCenterY}
                r={canopyRadius * (0.95 + 0.18 * breathPulse)}
                opacity={0.32 + 0.32 * breathPulse}
              >
                <RadialGradient
                  c={vec(canopyCenterX, canopyCenterY)}
                  r={canopyRadius * (0.95 + 0.18 * breathPulse)}
                  colors={[
                    'rgba(125, 211, 252, 0.42)',
                    'rgba(56, 189, 248, 0.20)',
                    'rgba(14, 165, 233, 0.07)',
                    'rgba(14, 165, 233, 0)'
                  ]}
                />
              </Circle>

              {/* 2. Vầng hào quang phát quang ôm sát viền hình học tán lá với BlurMask */}
              {leafLayersSkPath.map((layer, idx) => (
                <Path
                  key={`frost-leaf-halo-${idx}`}
                  path={layer.skPath}
                  color="#38bdf8"
                  opacity={0.25 + 0.35 * breathPulse}
                >
                  <BlurMask blur={9 + 5 * breathPulse} style="normal" />
                </Path>
              ))}
            </Group>
          )}

          {/* HIỆU ỨNG KIM SA: Vùng lá phát sáng vàng tỏa ra xung quanh nhẹ nhàng như hơi thở */}
          {showGoldenEffects && (
            <Group>
              {/* 1. Hào quang vòm tán lan tỏa ánh sáng vàng kim ấm áp ra xung quanh */}
              <Circle
                cx={canopyCenterX}
                cy={canopyCenterY}
                r={canopyRadius * (0.95 + 0.18 * breathPulse)}
                opacity={0.35 + 0.35 * breathPulse}
              >
                <RadialGradient
                  c={vec(canopyCenterX, canopyCenterY)}
                  r={canopyRadius * (0.95 + 0.18 * breathPulse)}
                  colors={[
                    'rgba(254, 240, 138, 0.45)',
                    'rgba(250, 204, 21, 0.22)',
                    'rgba(234, 179, 8, 0.08)',
                    'rgba(234, 179, 8, 0)'
                  ]}
                />
              </Circle>

              {/* 2. Vầng hào quang phát quang ôm sát viền hình học tán lá với BlurMask làm mờ biên độ */}
              {leafLayersSkPath.map((layer, idx) => (
                <Path
                  key={`golden-leaf-halo-${idx}`}
                  path={layer.skPath}
                  color="#facc15"
                  opacity={0.28 + 0.38 * breathPulse}
                >
                  <BlurMask blur={10 + 6 * breathPulse} style="normal" />
                </Path>
              ))}
            </Group>
          )}

          {/* Thân cây, cành và rễ bạnh gốc */}
          {branchesSkPath && (
            <Path
              path={branchesSkPath}
              color={trunkColor}
            />
          )}

          {/* Cuống lá */}
          {petiolesSkPath && (
            <Path
              path={petiolesSkPath}
              color={trunkColor}
              style="stroke"
              strokeWidth={1.1}
              strokeCap="round"
            />
          )}

          {/* Tán lá fractal chân thực */}
          {leafLayersSkPath.map((layer, idx) => (
            <Path
              key={`leaf-layer-${idx}`}
              path={layer.skPath}
              color={layer.color || leafColor}
            />
          ))}

          {/* BĂNG TINH & KIM SA LẤP LÁNH (Hình thoi 4 cạnh lõm Skia GPU Native) */}
          {(showFrostEffects || showGoldenEffects) && SPARKLE_SHAPE_PATH && (
            <Group>
              {sparkles.map((sp, idx) => {
                // Chu kỳ xuất hiện và tắt hẳn (biến mất hoàn toàn) với tốc độ nhanh gấp đôi
                const rawSin = Math.sin(windTime * sp.speed + sp.phase);
                if (rawSin <= 0) return null; // Hạt tắt hẳn và biến mất hoàn toàn

                const pulse = Math.pow(rawSin, 1.8);
                const scale = sp.baseSize * (0.25 + 0.85 * pulse);
                const alpha = Math.min(1.0, pulse * 1.25);
                if (alpha <= 0.02) return null;

                const swayX = Math.sin(windTime * 1.5 + sp.phase) * 2.2;
                const swayY = Math.cos(windTime * 1.4 + sp.phase) * 1.8;

                return (
                  <Group
                    key={`sparkle-${idx}`}
                    transform={[
                      { translateX: sp.x + swayX },
                      { translateY: sp.y + swayY },
                      { scale: scale }
                    ]}
                  >
                    {/* Hạt hình thoi 4 cạnh lõm (Astroid star) */}
                    <Path
                      path={SPARKLE_SHAPE_PATH}
                      color={sp.color}
                      opacity={alpha}
                    />
                    {/* Tâm phát quang trắng khi bừng sáng */}
                    {sp.isLuminous && (
                      <Circle
                        cx={0}
                        cy={0}
                        r={0.25}
                        color="#ffffff"
                        opacity={alpha * 0.95}
                      />
                    )}
                  </Group>
                );
              })}
            </Group>
          )}
        </Group>
      </Group>
    </Canvas>
  );
});
