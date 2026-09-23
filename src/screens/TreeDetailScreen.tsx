/**
 * TreeDetailScreen - Màn Hình Chi Tiết Cây & Zen View
 * Project: Fractal Tree NFC Mobile Game
 * Specification: ui-ux/02-tree-detail.html (100% pixel-perfect match)
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  PanResponder,
  ScrollView,
  Animated,
  Easing
} from 'react-native';
import Svg, {
  Path,
  Circle,
  G,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Line,
  Ellipse
} from 'react-native-svg';
import { TreeModel, SeedModel, LeafType, LeafPalette, TreeGenetics } from '../types';
import { FractalTreeBridge, AuthenticTreeSvgOutput } from '../engine/fractal/FractalTreeBridge';
import { GITHUB_LEAF_PALETTES } from '../engine/fractal/LeafPalettes';
import { gardenRepository, processTreeSeedLifecycle } from '../storage/repositories/GardenRepository';
import { CompendiumRepository } from '../storage/repositories/CompendiumRepository';
import { nfcService } from '../nfc/NfcService';
import { BottomNavBar, NavTabId } from '../components/BottomNavBar';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { AnimatedTreeCanvas } from '../components/AnimatedTreeCanvas';
import {
  generateChildGenetics,
  getTreeRarity,
  getLeafColorRarity,
  getGrowthDurationForGenetics,
  findTrunkTheme,
  LEAF_SHAPE_INFO,
  LEAF_PALETTE_INFO,
  getTrunkDisplay,
  getTreeFullName
} from '../config/GeneticsConfig';

interface TreeDetailScreenProps {
  tree: TreeModel;
  onBack: () => void;
  onNavigateTab?: (tab: NavTabId) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 4. Định dạng thời gian còn lại
const formatRemainingTime = (t: TreeModel, doneText = 'Hoàn tất'): string => {
  const duration = t.growthDuration || getGrowthDurationForGenetics(t.genetics);
  const elapsed = Math.max(0, (Date.now() - t.plantedAt) / 1000);
  const remainingSec = Math.max(0, Math.floor(duration - elapsed));
  if (remainingSec <= 0) return doneText;
  const days = Math.floor(remainingSec / 86400);
  const hours = Math.floor((remainingSec % 86400) / 3600);
  const mins = Math.floor((remainingSec % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

export const TreeDetailScreen: React.FC<TreeDetailScreenProps> = ({
  tree: initialTree,
  onBack,
  onNavigateTab
}) => {
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();

  // 1. Mốc thời gian xem gần nhất và mốc thời gian hiện tại
  const isArchived = Boolean(initialTree.isArchived);
  const isFullyMature = initialTree.currentProgress >= 1.0;
  const fallbackDuration = getGrowthDurationForGenetics(initialTree.genetics);
  const totalDuration = initialTree.growthDuration || fallbackDuration;

  let startProgress = initialTree.currentProgress;
  let targetProgress = initialTree.currentProgress;
  let deltaProgress = 0;

  if (!isArchived && !isFullyMature) {
    const lastViewed = initialTree.lastViewedAt || initialTree.plantedAt;
    const elapsedAtLastView = Math.max(0, (lastViewed - initialTree.plantedAt) / 1000);
    startProgress = Math.min(1.0, Math.max(0.01, elapsedAtLastView / totalDuration));

    const elapsedNow = Math.max(0, (Date.now() - initialTree.plantedAt) / 1000);
    targetProgress = Math.min(1.0, Math.max(0.01, elapsedNow / totalDuration));
    deltaProgress = Math.max(0, targetProgress - startProgress);
  }

  // Nếu cây có lớn thêm khi vắng mặt (>= 0.5%), khởi tạo từ startProgress để chạy hoạt họa
  const [tree, setTree] = useState<TreeModel>(() => {
    const initProgress = isArchived
      ? initialTree.currentProgress
      : (isFullyMature ? 1.0 : (deltaProgress >= 0.005 ? startProgress : targetProgress));
    const baseTree: TreeModel = {
      ...initialTree,
      currentProgress: initProgress,
      hasSeedReady: !isArchived && (initialTree.hasSeedReady || (initialTree.currentProgress < 1.0 && initProgress >= 1.0))
    };
    return isArchived ? baseTree : processTreeSeedLifecycle(baseTree).tree;
  });

  // Tự động kiểm tra và cập nhật chu kỳ hạt giống (chờ 24h sau thu hoạch / re-roll sau 24h chưa hái)
  useEffect(() => {
    if (!isArchived) {
      const { tree: processed, changed } = processTreeSeedLifecycle(tree);
      if (changed) {
        setTree(processed);
        gardenRepository.upsertTree(processed).catch(() => {});
      }
    }
  }, []);

  const [isGrowthTimelapseActive, setIsGrowthTimelapseActive] = useState<boolean>(false);
  const [growthGainPercent, setGrowthGainPercent] = useState<number>(0);
  const [isTimelapseSpeedUp, setIsTimelapseSpeedUp] = useState<boolean>(false);
  const growthAnimIdRef = useRef<number | null>(null);
  const growthSpeedMultiplierRef = useRef<number>(1);
  const [isChopModalOpen, setIsChopModalOpen] = useState<boolean>(false);

  // 1b. Tính toán tỉ lệ Auto-Fit duy nhất một lần khi mới nạp màn hình chi tiết cây
  const initialAutoFit = useMemo(() => {
    // Đo kích thước cây tại mốc sinh trưởng mục tiêu để tính tỉ lệ vừa vặn tuyệt đối
    const previewProgress = isArchived
      ? initialTree.currentProgress
      : (isFullyMature ? 1.0 : (deltaProgress >= 0.005 ? targetProgress : (initialTree.currentProgress || 0.01)));
    const sample = FractalTreeBridge.generateAuthenticSvg(
      initialTree.genetics,
      previewProgress,
      0.95,
      0,
      1.0,
      0,
      undefined,
      false
    );
    const bounds = sample.bounds || { minX: -50, maxX: 50, minY: -120, maxY: 15 };

    const topSafeMargin = 115;
    const sideMargin = 24;
    const groundOffset = 64 + 74 + 20; // 158px
    const gY = SCREEN_HEIGHT - groundOffset;

    const availH = Math.max(120, gY - topSafeMargin);
    const availW = Math.max(120, SCREEN_WIDTH - sideMargin * 2);

    const treeH = Math.max(60, -bounds.minY);
    const treeW = Math.max(60, bounds.maxX - bounds.minX);

    // fitScale đảm bảo cả chiều cao lẫn độ xòe cành đều nằm trọn trong khung nhìn
    const fitScale = Math.min(1.0, availH / treeH, availW / treeW) * 0.94;
    const centerOffsetX = ((bounds.minX + bounds.maxX) / 2) * fitScale;

    return {
      fitScale: Math.max(0.35, Math.min(1.25, fitScale)),
      initPanX: Math.round(-centerOffsetX)
    };
  }, []);

  const [zoomLevel, setZoomLevel] = useState<number>(initialAutoFit.fitScale);
  const zoomLevelRef = useRef<number>(initialAutoFit.fitScale);
  zoomLevelRef.current = zoomLevel;

  const [pan, setPan] = useState<{ x: number; y: number }>({ x: initialAutoFit.initPanX, y: 0 });
  const panRef = useRef<{ x: number; y: number }>({ x: initialAutoFit.initPanX, y: 0 });
  panRef.current = pan;

  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState<boolean>(false);
  const [harvestStatus, setHarvestStatus] = useState<string>(t('treeDetail.harvestNfcPrompt'));
  const [isHarvesting, setIsHarvesting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startPanRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);
  const initialDistanceRef = useRef<number>(0);
  const startZoomRef = useRef<number>(1.0);
  const isPinchingRef = useRef<boolean>(false);

  // PanResponder ổn định (khởi tạo 1 lần duy nhất bằng useRef, không bị hủy/tạo mới gây co giật)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1;
      },
      onPanResponderGrant: (evt) => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) {
          isPinchingRef.current = true;
          initialDistanceRef.current = Math.hypot(
            touches[0].pageX - touches[1].pageX,
            touches[0].pageY - touches[1].pageY
          );
          startZoomRef.current = zoomLevelRef.current;
        } else {
          isPinchingRef.current = false;
          startPanRef.current = { ...panRef.current };
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        // Hỗ trợ thu phóng 2 ngón tay mượt mà (Pinch to Zoom)
        if (touches && touches.length >= 2) {
          const dist = Math.hypot(
            touches[0].pageX - touches[1].pageX,
            touches[0].pageY - touches[1].pageY
          );
          if (initialDistanceRef.current > 0) {
            const scale = dist / initialDistanceRef.current;
            const newZoom = Math.min(2.5, Math.max(0.6, startZoomRef.current * scale));
            setZoomLevel(newZoom);
          }
          return;
        }

        // Kéo tự do 1 ngón tay (Drag / Pan)
        if (isPinchingRef.current) return;

        // Bỏ qua các chuyển động rung lắc siêu nhỏ (< 1px) tránh re-render thừa
        if (Math.abs(gestureState.dx) < 1 && Math.abs(gestureState.dy) < 1) return;

        // Nếu ngón tay thứ 2 vừa nhấc lên, đồng bộ lại điểm xuất phát để tránh bị giật vị trí
        if (gestureState.numberActiveTouches === 1 && initialDistanceRef.current > 0) {
          initialDistanceRef.current = 0;
          startPanRef.current = { ...panRef.current };
          return;
        }

        const nextX = Math.round(startPanRef.current.x + gestureState.dx);
        const nextY = Math.round(startPanRef.current.y + gestureState.dy);

        // Đồng bộ khung hình bằng requestAnimationFrame tránh nghẽn thread giao diện
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }
        rafIdRef.current = requestAnimationFrame(() => {
          setPan({ x: nextX, y: nextY });
          rafIdRef.current = null;
        });
      },
      // Ngăn chặn hệ thống hủy thao tác vuốt khi đang chạm
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        if (!isPinchingRef.current) {
          setPan({
            x: Math.round(startPanRef.current.x + gestureState.dx),
            y: Math.round(startPanRef.current.y + gestureState.dy)
          });
        }
        isPinchingRef.current = false;
        initialDistanceRef.current = 0;
      },
      onPanResponderTerminate: () => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        isPinchingRef.current = false;
        initialDistanceRef.current = 0;
      }
    })
  ).current;

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (rarityTapTimerRef.current) {
        clearTimeout(rarityTapTimerRef.current);
      }
    };
  }, []);

  // 2. Chụp snapshot thumbnail vector và lưu mốc thời gian xem gần nhất vào SQLite
  const saveSnapshotAndTimestamp = async (finalProgress: number) => {
    try {
      const now = Date.now();
      // Sinh SVG snapshot thu nhỏ (scaleFactor 0.42) để lưu vào database
      const thumb = FractalTreeBridge.generateAuthenticSvg(tree.genetics, finalProgress, 0.42);
      const thumbData = JSON.stringify({
        branchesPath: thumb.branchesPath,
        petiolesPath: thumb.petiolesPath,
        leafLayers: thumb.leafLayers,
        bounds: thumb.bounds
      });

      if (!isArchived) {
        if (finalProgress >= 0.999) {
          const treeDurationSec = tree.growthDuration || getGrowthDurationForGenetics(tree.genetics);
          const updatedPlantedAt = now - (treeDurationSec + 10) * 1000;
          let matureTree: TreeModel = {
            ...tree,
            plantedAt: updatedPlantedAt,
            currentProgress: 1.0,
            hasSeedReady: true,
            lastViewedAt: now,
            thumbnailData: thumbData
          };
          const { tree: processed } = processTreeSeedLifecycle(matureTree);
          matureTree = processed;
          await gardenRepository.upsertTree(matureTree);
          setTree(matureTree);
        } else {
          await gardenRepository.updateLastViewedSnapshot(tree.id, now, thumbData);
          setTree(prev => ({
            ...prev,
            lastViewedAt: now,
            thumbnailData: thumbData
          }));
        }
      } else {
        await gardenRepository.updateArchivedTreeProgress(tree.id, finalProgress, thumbData);
        setTree(prev => ({
          ...prev,
          lastViewedAt: now,
          thumbnailData: thumbData
        }));
      }
    } catch (e) {
      console.warn('[TreeDetailScreen] Lỗi khi lưu snapshot:', e);
    }
  };

  const [liveAnimationTime, setLiveAnimationTime] = useState<number | undefined>(undefined);

  // 3. Hoạt họa sinh trưởng tự nhiên theo đúng chuẩn công thức gốc từ FractalBranchTree (getTotalGrowthDuration)
  useEffect(() => {
    if (!isFullyMature && deltaProgress >= 0.005) {
      setIsGrowthTimelapseActive(true);
      setIsTimelapseSpeedUp(false);
      growthSpeedMultiplierRef.current = 1;
      setGrowthGainPercent(Math.round(deltaProgress * 100));

      // Tính tổng thời gian gốc của cây hiện tại từ cấu trúc FractalBranchTree
      const authenticTotalDurationSec = FractalTreeBridge.getTotalGrowthDuration(initialTree.genetics);
      // Thời gian hoạt họa tỉ lệ thuận với deltaProgress và authenticTotalDurationSec
      const animDurationMs = Math.max(350, deltaProgress * authenticTotalDurationSec * 1000);
      let lastFrameTime = Date.now();
      let accumulatedMs = 0;
      let settleStartTime = 0;
      let settleAccumulatedSec = 0;
      let isSettling = false;

      const frame = () => {
        const now = Date.now();
        const dt = (now - lastFrameTime) * growthSpeedMultiplierRef.current;
        lastFrameTime = now;

        if (!isSettling) {
          accumulatedMs += dt;
          const ratio = Math.min(1.0, accumulatedMs / animDurationMs);
          const currentVal = startProgress + deltaProgress * ratio;
          const curAnimTime = currentVal * authenticTotalDurationSec;

          setLiveAnimationTime(curAnimTime);
          setTree(prev => ({
            ...prev,
            currentProgress: currentVal,
            hasSeedReady: prev.hasSeedReady || (prev.currentProgress < 1.0 && currentVal >= 1.0)
          }));

          if (ratio < 1.0) {
            growthAnimIdRef.current = requestAnimationFrame(frame);
          } else {
            if (targetProgress >= 0.999) {
              // Chạm 100%: chuyển sang giai đoạn Settle để lá rụng rơi hết lộ trình
              isSettling = true;
              settleStartTime = now;
              settleAccumulatedSec = 0;
              growthAnimIdRef.current = requestAnimationFrame(frame);
            } else {
              growthAnimIdRef.current = null;
              setIsGrowthTimelapseActive(false);
              setIsTimelapseSpeedUp(false);
              setLiveAnimationTime(undefined);
              saveSnapshotAndTimestamp(targetProgress);
            }
          }
        } else {
          // Settle Phase: Duy trì hoạt họa cho các lá rụng rơi hết xuống đất
          settleAccumulatedSec += (dt / 1000);
          const settleAnimTime = authenticTotalDurationSec + settleAccumulatedSec;

          setLiveAnimationTime(settleAnimTime);

          const currentFrameSvg = FractalTreeBridge.generateAuthenticSvg(
            initialTree.genetics,
            1.0,
            0.95,
            0,
            1.0,
            0,
            settleAnimTime,
            true
          );

          if (currentFrameSvg.activeFallingCount === 0 || settleAccumulatedSec >= 3.5) {
            growthAnimIdRef.current = null;
            setIsGrowthTimelapseActive(false);
            setIsTimelapseSpeedUp(false);
            setLiveAnimationTime(undefined);
            saveSnapshotAndTimestamp(targetProgress);
          } else {
            growthAnimIdRef.current = requestAnimationFrame(frame);
          }
        }
      };

      growthAnimIdRef.current = requestAnimationFrame(frame);
      return () => {
        if (growthAnimIdRef.current !== null) {
          cancelAnimationFrame(growthAnimIdRef.current);
          growthAnimIdRef.current = null;
        }
      };
    } else {
      // Nếu cây không có thay đổi đáng kể: lưu ngay mốc xem và snapshot nếu chưa có
      saveSnapshotAndTimestamp(targetProgress);
    }
  }, []);

  const replaySpeedMultiplierRef = useRef<number>(1);
  const replayTargetProgressRef = useRef<number>(1.0);

  // Xử lý nút "Tua nhanh": Tăng tốc độ mọc lên x3 lần và ẩn nút tua nhanh đi
  const handleTimelapseSpeedUp = () => {
    growthSpeedMultiplierRef.current = 3;
    replaySpeedMultiplierRef.current = 3;
    setIsTimelapseSpeedUp(true);
  };

  // Xử lý nút "Lớn ngay": Dừng animation lập tức và nhảy thẳng về trạng thái đích cuối cùng (100%),
  // cập nhật lại toàn bộ trạng thái cuối của cây (plantedAt, currentProgress, hasSeedReady...) và cập nhật ảnh đại diện thumbnail vào database
  const handleTimelapseSkipToEnd = async () => {
    if (growthAnimIdRef.current !== null) {
      cancelAnimationFrame(growthAnimIdRef.current);
      growthAnimIdRef.current = null;
    }
    if (fastForwardAnimRef.current !== null) {
      cancelAnimationFrame(fastForwardAnimRef.current);
      fastForwardAnimRef.current = null;
    }

    setIsGrowthTimelapseActive(false);
    setIsFastForwardActive(false);
    setIsTimelapseSpeedUp(false);
    setLiveAnimationTime(undefined);

    const nowMs = Date.now();
    const treeDurationSec = tree.growthDuration || getGrowthDurationForGenetics(tree.genetics);
    // Cập nhật plantedAt lùi về quá khứ để thời gian thực (Date.now() - plantedAt) >= growthDuration luôn ra 100%
    const updatedPlantedAt = nowMs - (treeDurationSec + 10) * 1000;

    // Tạo snapshot thumbnail vector 100% chuẩn cho thẻ cây đại diện ngoài vườn và nhà kính
    const thumb = FractalTreeBridge.generateAuthenticSvg(tree.genetics, 1.0, 0.42);
    const thumbData = JSON.stringify({
      branchesPath: thumb.branchesPath,
      petiolesPath: thumb.petiolesPath,
      leafLayers: thumb.leafLayers,
      bounds: thumb.bounds
    });

    let updatedTree: TreeModel = {
      ...tree,
      plantedAt: isArchived ? tree.plantedAt : updatedPlantedAt,
      currentProgress: 1.0,
      hasSeedReady: !isArchived,
      lastViewedAt: nowMs,
      thumbnailData: thumbData
    };

    if (!isArchived) {
      const { tree: processed } = processTreeSeedLifecycle(updatedTree);
      updatedTree = processed;
      // Lưu toàn bộ trạng thái cuối cùng của cây vào SQLite bảng garden_trees
      await gardenRepository.upsertTree(updatedTree);
    } else {
      // Đối với cây nhà kính, cập nhật tiến độ 1.0 và ảnh thumbnail mới vào SQLite bảng archive_trees
      await gardenRepository.updateArchivedTreeProgress(tree.id, 1.0, thumbData);
    }

    setTree(updatedTree);
    showToast('✨ Cây đã lớn hoàn thiện 100%!');
  };

  // 4. Tự động cập nhật tiến trình sinh trưởng theo thời gian thực (5 giây / lần) khi đang xem cây
  useEffect(() => {
    if (isArchived || isFullyMature || isGrowthTimelapseActive || tree.currentProgress >= 1.0) return;

    const interval = setInterval(() => {
      const fallbackDuration = getGrowthDurationForGenetics(tree.genetics);
      const elapsedSec = Math.max(0, (Date.now() - tree.plantedAt) / 1000);
      const nextProgress = Math.min(1.0, Math.max(0.01, elapsedSec / (tree.growthDuration || fallbackDuration)));
      setTree(prev => {
        if (Math.abs(prev.currentProgress - nextProgress) < 0.001) return prev;
        return {
          ...prev,
          currentProgress: nextProgress,
          hasSeedReady: prev.hasSeedReady || (prev.currentProgress < 1.0 && nextProgress >= 1.0)
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isGrowthTimelapseActive, tree.plantedAt, tree.growthDuration, tree.currentProgress]);

  // 5. Xử lý Nút Tia Sét (⚡ Xem lại animation từ khi cây còn non 0% -> thời điểm hiện tại)
  const [isFastForwardActive, setIsFastForwardActive] = useState<boolean>(false);
  const fastForwardAnimRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (fastForwardAnimRef.current !== null) {
        cancelAnimationFrame(fastForwardAnimRef.current);
      }
    };
  }, []);

  const handleTriggerLightningGrowth = () => {
    if (isFastForwardActive || isGrowthTimelapseActive) return;

    // Xem lại hành trình từ khi cây còn non 0% cho đến thời điểm hiện tại
    const targetProgress = Math.max(0.01, tree.currentProgress);
    if (targetProgress <= 0.02) {
      showToast('🌱 Cây mới vừa gieo mầm, hãy chờ cây vươn lớn thêm một chút nhé!');
      return;
    }

    const authenticDurationSec = FractalTreeBridge.getTotalGrowthDuration(tree.genetics);
    // Thời gian replay tương ứng tỉ lệ từ 0% đến targetProgress
    const durationMs = Math.max(1200, targetProgress * authenticDurationSec * 1000);

    replaySpeedMultiplierRef.current = 1;
    replayTargetProgressRef.current = targetProgress;
    setIsTimelapseSpeedUp(false);
    setIsFastForwardActive(true);

    let lastTime = Date.now();
    let accumulatedMs = 0;
    let settleStartTime = 0;
    let isSettling = false;

    if (fastForwardAnimRef.current !== null) {
      cancelAnimationFrame(fastForwardAnimRef.current);
    }

    const animStep = () => {
      const now = Date.now();
      const dt = now - lastTime;
      lastTime = now;

      if (!isSettling) {
        accumulatedMs += dt * replaySpeedMultiplierRef.current;
        const ratio = Math.min(1.0, accumulatedMs / durationMs);
        const cur = targetProgress * ratio;
        const curAnimTime = cur * authenticDurationSec;

        setLiveAnimationTime(curAnimTime);
        setTree(prev => ({
          ...prev,
          currentProgress: cur
        }));

        if (ratio < 1.0) {
          fastForwardAnimRef.current = requestAnimationFrame(animStep);
        } else {
          // Nếu cây hiện tại đã đạt 100%, chuyển tiếp sang Settle Phase cho lá rụng bay lượn và tan biến
          if (targetProgress >= 0.999) {
            isSettling = true;
            settleStartTime = now;
            fastForwardAnimRef.current = requestAnimationFrame(animStep);
          } else {
            // Nếu cây đang ở mốc lửng (< 100%), kết thúc replay và khôi phục tiến trình thực
            fastForwardAnimRef.current = null;
            setIsFastForwardActive(false);
            setIsTimelapseSpeedUp(false);
            setLiveAnimationTime(undefined);
            setTree(prev => ({ ...prev, currentProgress: targetProgress }));
            showToast('✨ Đã xem lại hành trình từ mầm non đến hiện tại!');
          }
        }
      } else {
        // Giai đoạn Settle: Cây đạt 100%, animationTime tiếp tục tiến để lá rụng rơi hết lộ trình
        const settleElapsedSec = ((now - settleStartTime) / 1000) * replaySpeedMultiplierRef.current;
        const settleAnimTime = authenticDurationSec + settleElapsedSec;

        setLiveAnimationTime(settleAnimTime);

        const currentFrameSvg = FractalTreeBridge.generateAuthenticSvg(
          tree.genetics,
          1.0,
          0.95,
          0,
          1.0,
          0,
          settleAnimTime,
          true
        );

        if (currentFrameSvg.activeFallingCount === 0 || settleElapsedSec >= 3.5) {
          fastForwardAnimRef.current = null;
          setIsFastForwardActive(false);
          setIsTimelapseSpeedUp(false);
          setLiveAnimationTime(undefined);
          setTree(prev => ({ ...prev, currentProgress: targetProgress }));
          showToast('✨ Tái hiện toàn vẹn chu kỳ sinh trưởng!');
        } else {
          fastForwardAnimRef.current = requestAnimationFrame(animStep);
        }
      }
    };

    fastForwardAnimRef.current = requestAnimationFrame(animStep);
  };

  // 5b. Tính Năng Ẩn: Chạm 7 lần liên tiếp vào Tag Độ Hiếm để kích hoạt cây vươn lớn hoàn toàn 100%
  const rarityTapCountRef = useRef<number>(0);
  const rarityTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleRarityTagTap = () => {
    if (isFastForwardActive || isGrowthTimelapseActive) return;

    if (rarityTapTimerRef.current) {
      clearTimeout(rarityTapTimerRef.current);
    }

    rarityTapCountRef.current += 1;

    rarityTapTimerRef.current = setTimeout(() => {
      rarityTapCountRef.current = 0;
    }, 2200);

    if (rarityTapCountRef.current >= 7) {
      rarityTapCountRef.current = 0;
      if (rarityTapTimerRef.current) {
        clearTimeout(rarityTapTimerRef.current);
      }
      handleTriggerHiddenFullGrowth();
    }
  };

  const handleTriggerHiddenFullGrowth = () => {
    if (tree.currentProgress >= 0.999) {
      return;
    }

    const fromVal = tree.currentProgress;
    const toVal = 1.0;
    const progressSpan = toVal - fromVal;

    const authenticDurationSec = FractalTreeBridge.getTotalGrowthDuration(tree.genetics);
    const durationMs = Math.max(1200, progressSpan * authenticDurationSec * 1000);

    setIsFastForwardActive(true);

    const startAnimTime = Date.now();
    let settleStartTime = 0;
    let isSettling = false;

    if (fastForwardAnimRef.current !== null) {
      cancelAnimationFrame(fastForwardAnimRef.current);
    }

    const animStep = async () => {
      const now = Date.now();

      if (!isSettling) {
        const elapsed = now - startAnimTime;
        const ratio = Math.min(1.0, elapsed / durationMs);
        const cur = fromVal + progressSpan * ratio;
        const curAnimTime = cur * authenticDurationSec;

        setLiveAnimationTime(curAnimTime);
        setTree(prev => ({
          ...prev,
          currentProgress: cur,
          hasSeedReady: prev.hasSeedReady || (prev.currentProgress < 1.0 && cur >= 1.0)
        }));

        if (ratio < 1.0) {
          fastForwardAnimRef.current = requestAnimationFrame(animStep);
        } else {
          isSettling = true;
          settleStartTime = now;
          fastForwardAnimRef.current = requestAnimationFrame(animStep);
        }
      } else {
        const settleElapsedSec = (now - settleStartTime) / 1000;
        const settleAnimTime = authenticDurationSec + settleElapsedSec;

        setLiveAnimationTime(settleAnimTime);

        const currentFrameSvg = FractalTreeBridge.generateAuthenticSvg(
          tree.genetics,
          1.0,
          0.95,
          0,
          1.0,
          0,
          settleAnimTime,
          true
        );

        if (currentFrameSvg.activeFallingCount === 0 || settleElapsedSec >= 3.5) {
          fastForwardAnimRef.current = null;
          setIsFastForwardActive(false);
          setLiveAnimationTime(undefined);

          const nowMs = Date.now();
          const treeDurationSec = tree.growthDuration || getGrowthDurationForGenetics(tree.genetics);
          // Cập nhật plantedAt lùi về quá khứ để thời gian thực (Date.now() - plantedAt) >= growthDuration luôn ra 100%
          const updatedPlantedAt = nowMs - (treeDurationSec + 10) * 1000;

          // Tạo snapshot thumbnail vector 100% chuẩn cho Garden Dashboard
          const thumb = FractalTreeBridge.generateAuthenticSvg(tree.genetics, 1.0, 0.42);
          const thumbData = JSON.stringify({
            branchesPath: thumb.branchesPath,
            petiolesPath: thumb.petiolesPath,
            leafLayers: thumb.leafLayers,
            bounds: thumb.bounds
          });

          const finalTree: TreeModel = {
            ...tree,
            plantedAt: updatedPlantedAt,
            currentProgress: 1.0,
            hasSeedReady: true,
            lastViewedAt: nowMs,
            thumbnailData: thumbData
          };

          setTree(finalTree);
          await gardenRepository.upsertTree(finalTree);
        } else {
          fastForwardAnimRef.current = requestAnimationFrame(animStep);
        }
      }
    };

    fastForwardAnimRef.current = requestAnimationFrame(animStep);
  };

  // 6. Xử lý đốn hạ / xóa cây vĩnh viễn khỏi khu vườn hoặc Nhà Kính
  const handleConfirmChopTree = async () => {
    try {
      setIsChopModalOpen(false);
      if (isArchived) {
        await gardenRepository.deleteArchivedTree(tree.id);
        showToast(t('treeDetail.archiveDeleteSuccessToast'));
      } else {
        await gardenRepository.deleteTree(tree.id);
        showToast(t('treeDetail.chopSuccessToast'));
      }
      setTimeout(() => {
        onBack();
      }, 600);
    } catch {
      showToast(t('treeDetail.chopErrorToast'));
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Tra cứu thông số thiết kế
  const shapeInfo = LEAF_SHAPE_INFO[tree.genetics.leafType] || LEAF_SHAPE_INFO[LeafType.POINTED];
  const paletteInfo = LEAF_PALETTE_INFO[tree.genetics.paletteIndex] || LEAF_PALETTE_INFO[LeafPalette.EMERALD];
  const treeRarity = getTreeRarity(tree.genetics);
  const trunkInfo = getTrunkDisplay(tree.genetics.trunkColor);
  const palette = GITHUB_LEAF_PALETTES[tree.genetics.paletteIndex] || GITHUB_LEAF_PALETTES[LeafPalette.EMERALD];
  const leafColor = palette[0]?.hex || '#4ade80';

  // Thông số hạt giống đời sau (ổn định giá trị trong suốt chu kỳ 24h)
  const activeSeedGenetics: TreeGenetics = useMemo(() => {
    return tree.currentSeedGenetics || generateChildGenetics(tree.genetics);
  }, [tree.currentSeedGenetics, tree.genetics]);

  // Chỉ số độ hiếm của màu lá cây đời tiếp theo
  const childLeafColorRarity = useMemo(() => {
    return getLeafColorRarity(activeSeedGenetics.leafType, activeSeedGenetics.paletteIndex);
  }, [activeSeedGenetics.leafType, activeSeedGenetics.paletteIndex]);

  // Tên cây hoàn chỉnh chuẩn: Cổ Thụ Lục Bảo • Ngọc Bích (Thân)
  const fullTreeName = getTreeFullName(tree.genetics);

  const isParent = tree.generation === 0;
  const isDone = tree.currentProgress >= 1.0;
  const progressPercent = Math.min(100, Math.floor(tree.currentProgress * 100));

  // Tọa độ gốc cây bám sát gò đất trên mép hộp nền đất (Ground Soil Box)
  // Bottom nav (64px) + Soil Box (~74px) + khoảng đệm gò rễ (20px)
  const groundOffsetFromBottom = 64 + 74 + 20;
  const groundY = SCREEN_HEIGHT - groundOffsetFromBottom;


  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(2.4, +(prev * 1.25).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(0.45, +(prev * 0.8).toFixed(2)));
  };

  // Đảm bảo giải phóng antenna NFC khi rời khỏi màn hình
  useEffect(() => {
    return () => {
      nfcService.cancelScan();
    };
  }, []);

  const handleOpenHarvestModal = () => {
    setIsHarvestModalOpen(true);
    setIsHarvesting(false);
    setHarvestStatus(t('treeDetail.harvestNfcPrompt'));
  };

  const handleCloseHarvestModal = async () => {
    setIsHarvestModalOpen(false);
    if (isHarvesting) {
      setIsHarvesting(false);
      try {
        await nfcService.cancelScan();
      } catch {}
    }
  };

  const executeHarvestNfc = async () => {
    if (isHarvesting) return;
    setIsHarvesting(true);
    setHarvestStatus(t('treeDetail.harvestWaitingTag'));
    try {
      const childGen = tree.generation + 1;
      const childGenetics = activeSeedGenetics;
      const newSeed: SeedModel = {
        id: `seed-${tree.id}-${Date.now()}`,
        generation: childGen,
        parentTreeId: tree.id,
        genetics: childGenetics,
        growthDuration: getGrowthDurationForGenetics(childGenetics),
        spawnedAt: tree.seedSpawnedAt || Date.now()
      };

      const writeSuccess = await nfcService.writeNewSeedToTag(newSeed);
      if (writeSuccess) {
        const now = Date.now();
        const updatedTree: TreeModel = {
          ...tree,
          hasSeedReady: false,
          lastHarvestedAt: now,
          seedSpawnedAt: undefined,
          currentSeedGenetics: undefined
        };
        await gardenRepository.upsertTree(updatedTree);
        setTree(updatedTree);
        setHarvestStatus(t('treeDetail.harvestAuraDone', { gen: childGen }));
        showToast(t('treeDetail.harvestSuccessToast', { gen: childGen }));
        setTimeout(() => {
          setIsHarvestModalOpen(false);
          setIsHarvesting(false);
        }, 1200);
      } else {
        setHarvestStatus(t('treeDetail.harvestNfcPrompt'));
        setIsHarvesting(false);
      }
    } catch {
      setHarvestStatus(t('treeDetail.harvestInterrupted'));
      setIsHarvesting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar as any} backgroundColor={colors.background} />

      {/* 100% Fullscreen Interactive Canvas Viewport (Hỗ trợ kéo Pan & Drag tự do) */}
      <View
        style={styles.canvasContainer}
        {...panResponder.panHandlers}
      >
        <AnimatedTreeCanvas
          tree={tree}
          scaleFactor={0.95}
          pan={pan}
          zoomLevel={zoomLevel}
          groundY={groundY}
          isDark={isDark}
          trunkColor={trunkInfo.color}
          leafColor={leafColor}
          animationTime={liveAnimationTime}
          isAnimating={isFastForwardActive || isGrowthTimelapseActive}
        />
      </View>

      {/* Floating Top-Left Back Button (Chỉ icon, nền kính mờ) */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.topBackBtn,
          {
            backgroundColor: isDark ? 'rgba(18, 26, 22, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'
          }
        ]}
        onPress={onBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 18L9 12L15 6"
            stroke={colors.text}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* Floating Top-Right Badges & Zoom Controls (Dọc thẳng hàng) */}
      <View style={styles.topBadgesHud}>
        {/* Badge 1: Độ hiếm màu sắc (Chạm 7 lần để kích hoạt bí thuật vươn lớn 100%) */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleRarityTagTap}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[
            styles.rarityBadge,
            treeRarity === 'legendary'
              ? (isDark ? styles.rarityLegendaryDark : styles.rarityLegendaryLight)
              : (treeRarity === 'rare'
                  ? (isDark ? styles.rarityRareDark : styles.rarityRareLight)
                  : (isDark ? styles.rarityCommonDark : styles.rarityCommonLight))
          ]}
        >
          <Text style={[
            styles.rarityText,
            treeRarity === 'legendary'
              ? (isDark ? styles.rarityLegendaryTextDark : styles.rarityLegendaryTextLight)
              : (treeRarity === 'rare'
                  ? (isDark ? styles.rarityRareTextDark : styles.rarityRareTextLight)
                  : (isDark ? styles.rarityCommonTextDark : styles.rarityCommonTextLight))
          ]}>
            {treeRarity === 'legendary' ? t('treeDetail.rarityLegendary') : (treeRarity === 'rare' ? t('treeDetail.rarityRare') : t('treeDetail.rarityCommon'))}
          </Text>
        </TouchableOpacity>

        {/* Badge 2: Thế hệ đời cây */}
        <View style={[
          styles.genBadge,
          isDark ? styles.genBadgeDark : styles.genBadgeLight
        ]}>
          <Text style={[
            styles.genBadgeText,
            isDark ? styles.genBadgeTextDark : styles.genBadgeTextLight
          ]}>
            {isParent ? t('common.generationP') : t('common.generationFn', { gen: tree.generation })}
          </Text>
        </View>

        {/* Cụm Zoom In / Out xếp dọc thẳng bên dưới nhãn đời cây */}
        <View style={styles.zoomControlsCol}>
          <TouchableOpacity
            style={[
              styles.zoomBtn,
              {
                backgroundColor: isDark ? 'rgba(18, 26, 22, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'
              }
            ]}
            onPress={handleZoomIn}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <Line x1="12" y1="5" x2="12" y2="19" stroke={colors.textSecondary} strokeWidth="2.5" strokeLinecap="round" />
              <Line x1="5" y1="12" x2="19" y2="12" stroke={colors.textSecondary} strokeWidth="2.5" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.zoomBtn,
              {
                backgroundColor: isDark ? 'rgba(18, 26, 22, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'
              }
            ]}
            onPress={handleZoomOut}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <Line x1="5" y1="12" x2="19" y2="12" stroke={colors.textSecondary} strokeWidth="2.5" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* GROUND SOIL FOUNDATION BOX: Nền đất phẳng mép (border-radius: 0) */}
      <View style={[
        styles.groundSoilBox,
        {
          backgroundColor: colors.groundBox,
          borderTopColor: colors.groundBoxBorder,
          borderBottomColor: colors.border
        }
      ]}>
        {/* Vệt sáng xanh tự nhiên ở giữa mép hộp */}
        <View style={styles.groundSoilRim} />

        {/* Subtle Progress Bar 3px ở mép trên (Tự động ẨN HOÀN TOÀN khi đạt 100%) */}
        {!isDone && (
          <View style={[styles.groundProgressTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <View style={[styles.groundProgressBar, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
          </View>
        )}

        {/* Nút Tia Sét (⚡ Tua lớn 100% / Replay) nằm ngay phía trên nút Cái Rìu (-100px) */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isFastForwardActive || isGrowthTimelapseActive}
          style={[
            styles.lightningBtn,
            {
              backgroundColor: isDark ? 'rgba(28, 26, 16, 0.95)' : 'rgba(254, 252, 232, 0.96)',
              borderColor: isDark ? 'rgba(250, 204, 21, 0.65)' : 'rgba(234, 179, 8, 0.55)',
              opacity: (isFastForwardActive || isGrowthTimelapseActive) ? 0.45 : 1
            }
          ]}
          onPress={handleTriggerLightningGrowth}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
              fill={isDark ? '#facc15' : '#eab308'}
              stroke={isDark ? '#fef08a' : '#ca8a04'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        {/* Nút Đốn Hạ / Xóa Cây (Icon hình Cái Rìu chuẩn Lucide Duotone) nằm góc trái (-54px) */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isFastForwardActive || isGrowthTimelapseActive}
          style={[
            styles.axeBtn,
            {
              backgroundColor: isDark ? 'rgba(28, 18, 18, 0.94)' : 'rgba(254, 242, 242, 0.96)',
              borderColor: 'rgba(248, 113, 113, 0.65)',
              opacity: (isFastForwardActive || isGrowthTimelapseActive) ? 0.45 : 1
            }
          ]}
          onPress={() => setIsChopModalOpen(true)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Svg width="21" height="21" viewBox="0 0 24 24" fill="none">
            {/* Cán rìu */}
            <Path
              d="M14 12L5.5 20.5A2.12 2.12 0 1 1 2.5 17.5L11 9"
              stroke={isDark ? '#e2e8f0' : '#475569'}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Lưỡi rìu đốn mộc sắc bén */}
            <Path
              d="M15 13L9 7L13 3L19 9H22A8 8 0 0 1 15 16Z"
              fill="#ef4444"
              stroke="#f87171"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Vệt bén sáng bóng của thép */}
            <Path
              d="M21 9.5A7.5 7.5 0 0 1 15.5 15"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>

        {/* Quả cầu hạt giống tròn (🌰) nổi cao (-54px) xuất hiện khi cây có hạt giống chờ thu hoạch */}
        {!isArchived && tree.hasSeedReady && (
          <TouchableOpacity
            activeOpacity={0.88}
            disabled={isFastForwardActive || isGrowthTimelapseActive}
            style={[
              styles.harvestSeedBtn,
              {
                opacity: (isFastForwardActive || isGrowthTimelapseActive) ? 0.45 : 1
              }
            ]}
            onPress={handleOpenHarvestModal}
          >
            <Text style={styles.harvestSeedEmoji}>🌰</Text>
          </TouchableOpacity>
        )}

        {/* Top Row: Tên cây (cỡ thường, in đậm) & Thời gian còn lại (cỡ bé, ẩn khi 100%) */}
        <View style={styles.groundTopRow}>
          <Text style={[styles.groundTreeName, { color: colors.text }]} numberOfLines={1}>
            {fullTreeName}
          </Text>
          {!isDone && (
            <Text style={[styles.groundTimeCountdown, { color: colors.textSecondary }]}>
              {isArchived
                ? t('archive.progressBadge', { pct: progressPercent })
                : t('treeDetail.remaining', { time: formatRemainingTime(tree, t('treeDetail.done')) })}
            </Text>
          )}
        </View>

        {/* Core Specs 1 dòng: Loại lá • [chấm màu lá] Tên màu lá • [chấm màu thân] Tên màu thân */}
        <View style={styles.groundCompactSpecs}>
          <View style={styles.specCompactItem}>
            <Text style={[styles.specText, { color: colors.textSecondary }]}>{shapeInfo.name}</Text>
          </View>
          <Text style={[styles.specCompactDotDivider, { color: colors.textMuted }]}>•</Text>
          <View style={styles.specCompactItem}>
            <View style={[styles.specColorDot, { backgroundColor: leafColor, borderColor: colors.border }]} />
            <Text style={[styles.specText, { color: colors.textSecondary }]}>{paletteInfo.suffix}</Text>
          </View>
          <Text style={[styles.specCompactDotDivider, { color: colors.textMuted }]}>•</Text>
          <View style={styles.specCompactItem}>
            <View style={[styles.specColorDot, { backgroundColor: trunkInfo.color, borderColor: colors.border }]} />
            <Text style={[styles.specText, { color: colors.textSecondary }]}>{trunkInfo.name}</Text>
          </View>
        </View>
      </View>

      {/* POPUP THU HOẠCH HẠT GIỐNG: Có overlay màu đen tương tự popup đốn hạ */}
      {isHarvestModalOpen && (
        <View style={styles.harvestPopupCenter}>
          <View style={[
            styles.harvestPopupCard,
            {
              backgroundColor: isDark ? 'rgba(16, 32, 23, 0.97)' : 'rgba(238, 249, 242, 0.98)',
              borderColor: isDark ? 'rgba(74, 222, 128, 0.35)' : 'rgba(34, 197, 94, 0.35)'
            }
          ]}>
            <Text style={styles.harvestPopupIcon}>🌰</Text>
            <Text style={[styles.harvestPopupTitle, { color: isDark ? '#4ade80' : '#15803d' }]}>
              {t('treeDetail.harvestTitle')}
            </Text>
            <Text style={[styles.harvestPopupDesc, { color: colors.text }]}>
              {shapeInfo.baseName} {t('common.generationFn', { gen: tree.generation + 1 })}
            </Text>

            {/* Chỉ số độ hiếm của màu lá cây đời tiếp theo */}
            <View style={styles.harvestRarityRow}>
              <View
                style={[
                  styles.rarityBadge,
                  styles.harvestRarityBadge,
                  childLeafColorRarity === 'legendary'
                    ? (isDark ? styles.rarityLegendaryDark : styles.rarityLegendaryLight)
                    : (childLeafColorRarity === 'rare'
                        ? (isDark ? styles.rarityRareDark : styles.rarityRareLight)
                        : (isDark ? styles.rarityCommonDark : styles.rarityCommonLight))
                ]}
              >
                <Text
                  style={[
                    styles.rarityText,
                    childLeafColorRarity === 'legendary'
                      ? (isDark ? styles.rarityLegendaryTextDark : styles.rarityLegendaryTextLight)
                      : (childLeafColorRarity === 'rare'
                          ? (isDark ? styles.rarityRareTextDark : styles.rarityRareTextLight)
                          : (isDark ? styles.rarityCommonTextDark : styles.rarityCommonTextLight))
                  ]}
                >
                  {childLeafColorRarity === 'legendary'
                    ? t('treeDetail.rarityLegendary')
                    : (childLeafColorRarity === 'rare' ? t('treeDetail.rarityRare') : t('treeDetail.rarityCommon'))}
                </Text>
              </View>
            </View>

            {/* Khi ấn thu hoạch: hiển thị vòng tròn nhỏ dần hút vào tâm màn hình, bên trong có chữ Chạm thẻ NFC */}
            {isHarvesting ? (
              <NfcVortexRadar isDark={isDark} />
            ) : (
              <View
                style={[
                  styles.harvestPopupInstruction,
                  { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.08)' }
                ]}
              >
                <Text style={[styles.harvestInstructionText, { color: colors.textSecondary }]}>{harvestStatus}</Text>
              </View>
            )}

            {/* Actions: Khi ấn thu hoạch, ẩn nút thu hoạch hẳn đi, chỉ còn nút hủy */}
            <View style={styles.harvestPopupActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.btnCancelPopup,
                  isHarvesting && styles.btnCancelPopupFull,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: colors.border
                  }
                ]}
                onPress={handleCloseHarvestModal}
              >
                <Text style={[styles.btnCancelText, { color: colors.textSecondary }]}>{t('treeDetail.cancel')}</Text>
              </TouchableOpacity>

              {!isHarvesting && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.btnConfirmPopup,
                    {
                      backgroundColor: '#16a34a'
                    }
                  ]}
                  onPress={executeHarvestNfc}
                >
                  <Text style={styles.btnConfirmText}>
                    {t('treeDetail.harvestStartBtn')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* MODAL XÁC NHẬN ĐỐN HẠ CÂY (Axe Confirmation Modal) */}
      {isChopModalOpen && (
        <View style={styles.chopModalOverlay}>
          <View style={[
            styles.chopModalCard,
            {
              backgroundColor: isDark ? 'rgba(22, 28, 24, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              borderColor: 'rgba(239, 68, 68, 0.45)'
            }
          ]}>
            <View style={styles.chopModalIconCircle}>
              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                {/* Cán rìu */}
                <Path
                  d="M14 12L5.5 20.5A2.12 2.12 0 1 1 2.5 17.5L11 9"
                  stroke={isDark ? '#f1f5f9' : '#475569'}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Lưỡi rìu */}
                <Path
                  d="M15 13L9 7L13 3L19 9H22A8 8 0 0 1 15 16Z"
                  fill="#dc2626"
                  stroke="#f87171"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Vệt sáng sắc bén */}
                <Path
                  d="M21 9.5A7.5 7.5 0 0 1 15.5 15"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
            <Text style={styles.chopModalTitle}>
              {isArchived ? t('treeDetail.archiveDeleteTitle') : t('treeDetail.chopModalTitle')}
            </Text>
            <Text style={[styles.chopModalDesc, { color: colors.textSecondary }]}>
              {isArchived
                ? t('treeDetail.archiveDeleteDesc', { name: fullTreeName })
                : t('treeDetail.chopModalDesc', { name: fullTreeName })}
            </Text>

            <View style={styles.chopModalBtnRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.chopModalBtnCancel,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setIsChopModalOpen(false)}
              >
                <Text style={[styles.chopModalBtnCancelText, { color: colors.textSecondary }]}>{t('treeDetail.chopCancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.chopModalBtnConfirm}
                onPress={handleConfirmChopTree}
              >
                <Text style={styles.chopModalBtnConfirmText}>{t('treeDetail.chopConfirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Timelapse & Replay Growth Banner Pill với nút Tua nhanh (x3) và Lớn ngay */}
      {(isGrowthTimelapseActive || isFastForwardActive) && (
        <View style={[
          styles.timelapseBanner,
          {
            backgroundColor: isDark ? 'rgba(16, 26, 20, 0.94)' : 'rgba(240, 253, 244, 0.96)',
            borderColor: colors.primary
          }
        ]}>
          <View style={styles.timelapseTextRow}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <Path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" />
            </Svg>
            <Text style={[styles.timelapseBannerText, !isDark && { color: '#15803d' }]}>
              {isGrowthTimelapseActive
                ? t('treeDetail.timelapseActive', { gain: growthGainPercent })
                : t('treeDetail.replayActive')}
            </Text>
          </View>

          {/* Nút điều khiển Tua nhanh & Lớn ngay */}
          <View style={styles.timelapseBtnRow}>
            {!isTimelapseSpeedUp && (
              <TouchableOpacity
                activeOpacity={0.75}
                style={[
                  styles.timelapseActionBtn,
                  {
                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.22)' : 'rgba(34, 197, 94, 0.15)',
                    borderColor: isDark ? 'rgba(74, 222, 128, 0.45)' : 'rgba(34, 197, 94, 0.45)'
                  }
                ]}
                onPress={handleTimelapseSpeedUp}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.timelapseActionBtnText, { color: isDark ? '#86efac' : '#15803d' }]}>
                  ⏩ Tua nhanh
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.timelapseActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(234, 179, 8, 0.22)' : 'rgba(234, 179, 8, 0.16)',
                  borderColor: isDark ? 'rgba(250, 204, 21, 0.5)' : 'rgba(202, 138, 4, 0.45)'
                }
              ]}
              onPress={handleTimelapseSkipToEnd}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={[styles.timelapseActionBtnText, { color: isDark ? '#fde047' : '#a16207' }]}>
                ⚡ Lớn ngay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Toast Notification Pill */}
      {toastMessage && (
        <View style={[
          styles.toastPill,
          {
            backgroundColor: isDark ? 'rgba(18, 26, 22, 0.96)' : 'rgba(255, 255, 255, 0.98)',
            borderColor: colors.primary
          }
        ]} pointerEvents="none">
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17L4 12" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={[styles.toastMsgText, { color: colors.text }]}>{toastMessage}</Text>
        </View>
      )}

      {/* Bottom Navigation Bar (Đồng bộ toàn bộ app) */}
      <View style={styles.bottomNavContainer}>
        <BottomNavBar
          activeTab="garden"
          onSelectTab={(tab) => {
            if (tab === 'garden') {
              onBack();
            } else if (onNavigateTab) {
              onNavigateTab(tab);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070c0a'
  },
  // 100% Fullscreen Interactive Canvas Viewport
  canvasContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10
  },

  // Floating Top-Left Back Button (Chỉ icon, nền kính mờ)
  topBackBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(18, 26, 22, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8
  },

  // Floating Top-Right Badges & Zoom Controls (Dọc thẳng hàng)
  topBadgesHud: {
    position: 'absolute',
    top: 52,
    right: 16,
    zIndex: 50,
    alignItems: 'flex-end',
    gap: 6
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  // Dark Mode Rarity Badges (Nền đặc giàu sắc độ, viền sắc nét, không bị rỗng viền)
  rarityCommonDark: {
    backgroundColor: '#0c2e20',
    borderColor: '#10b981'
  },
  rarityRareDark: {
    backgroundColor: '#082f49',
    borderColor: '#38bdf8'
  },
  rarityLegendaryDark: {
    backgroundColor: '#382405',
    borderColor: '#f59e0b'
  },
  // Light Mode Rarity Badges (Nền ngọc pastel đặc, viền tinh tế, độ tương phản cao)
  rarityCommonLight: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac'
  },
  rarityRareLight: {
    backgroundColor: '#e0f2fe',
    borderColor: '#7dd3fc'
  },
  rarityLegendaryLight: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d'
  },

  rarityText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  rarityCommonTextDark: { color: '#34d399' },
  rarityRareTextDark: { color: '#38bdf8' },
  rarityLegendaryTextDark: { color: '#fbbf24' },

  rarityCommonTextLight: { color: '#15803d' },
  rarityRareTextLight: { color: '#0284c7' },
  rarityLegendaryTextLight: { color: '#b45309' },

  genBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  genBadgeDark: {
    backgroundColor: '#0f293a',
    borderColor: '#38bdf8'
  },
  genBadgeLight: {
    backgroundColor: '#e0f2fe',
    borderColor: '#7dd3fc'
  },
  genBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  genBadgeTextDark: { color: '#38bdf8' },
  genBadgeTextLight: { color: '#0369a1' },

  // Zoom Controls Column đặt ngay dưới đời cây dọc thẳng xuống
  zoomControlsCol: {
    flexDirection: 'column',
    gap: 6,
    marginTop: 4
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(18, 26, 22, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4
  },

  // Ground Soil Foundation Box (Nền đất fullwidth phẳng mép)
  groundSoilBox: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#101813',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(74, 222, 128, 0.35)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.85,
    shadowRadius: 25,
    elevation: 16,
    gap: 6
  },
  groundSoilRim: {
    position: 'absolute',
    top: -3,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: 'rgba(74, 222, 128, 0.4)'
  },
  groundProgressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)'
  },
  groundProgressBar: {
    height: '100%',
    backgroundColor: '#34d399'
  },

  // Nút Tia Sét nổi cao (-100px) ngay phía trên nút Cái Rìu
  lightningBtn: {
    position: 'absolute',
    top: -100,
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(28, 26, 16, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    shadowColor: '#facc15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 10
  },

  // Nút hình Cái Rìu nổi cao (-54px) bên góc trái hộp đất
  axeBtn: {
    position: 'absolute',
    top: -54,
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(28, 18, 18, 0.94)',
    borderWidth: 1.5,
    borderColor: 'rgba(248, 113, 113, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10
  },

  // Quả cầu hạt giống nổi cao (-54px) bên góc phải hộp đất
  harvestSeedBtn: {
    position: 'absolute',
    top: -54,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f59e0b',
    borderWidth: 1.5,
    borderColor: '#fef08a',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 12
  },
  harvestSeedEmoji: {
    fontSize: 18
  },

  // Top Row: Tên cây & Thời gian
  groundTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  groundTreeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
    letterSpacing: 0.2
  },
  groundTimeCountdown: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8ba598'
  },

  // Compact Specs 1 dòng
  groundCompactSpecs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingTop: 2
  },
  specCompactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  specCompactDotDivider: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 8
  },
  specColorDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  specText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600'
  },

  // Popup Thu Hoạch Giữa Màn Hình (Có overlay làm mờ đen hậu cảnh tương tự chopModal)
  harvestPopupCenter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 130
  },
  harvestPopupCard: {
    width: 280,
    backgroundColor: 'rgba(18, 28, 22, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.55)',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.9,
    shadowRadius: 45,
    elevation: 24,
    gap: 6
  },
  harvestPopupIcon: {
    fontSize: 32,
    marginBottom: 4
  },
  harvestPopupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16a34a',
    letterSpacing: 0.3
  },
  harvestPopupDesc: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2
  },
  harvestRarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 2
  },
  harvestRarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  vortexContainer: {
    width: 150,
    height: 135,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    position: 'relative'
  },
  vortexRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed'
  },
  vortexCenterPill: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    paddingHorizontal: 4
  },
  vortexNfcIcon: {
    fontSize: 20,
    marginBottom: 2
  },
  vortexCenterText: {
    fontSize: 9.5,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 12,
    letterSpacing: 0.2
  },
  harvestPopupInstruction: {
    marginTop: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)'
  },
  harvestInstructionText: {
    fontSize: 11,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 15
  },
  harvestPopupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
    width: '100%'
  },
  btnCancelPopup: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnCancelPopupFull: {
    flex: 1,
    width: '100%'
  },
  btnCancelText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700'
  },
  btnConfirmPopup: {
    flex: 1.4,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnConfirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },

  // Toast Notification Pill
  toastPill: {
    position: 'absolute',
    top: 96,
    alignSelf: 'center',
    backgroundColor: 'rgba(18, 26, 22, 0.96)',
    borderWidth: 1,
    borderColor: '#4ade80',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 12
  },
  toastMsgText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff'
  },

  // Timelapse Growth Banner Pill (Thông báo tua nhanh sinh trưởng)
  timelapseBanner: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(16, 26, 20, 0.94)',
    borderWidth: 1.5,
    borderColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    zIndex: 110,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10
  },
  timelapseTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  timelapseBannerText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#86efac',
    letterSpacing: 0.2
  },
  timelapseBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  timelapseActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  timelapseActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2
  },

  // Modal Xác Nhận Đốn Hạ Cây (Chop Modal)
  chopModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 130
  },
  chopModalCard: {
    width: 290,
    backgroundColor: 'rgba(22, 28, 24, 0.98)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    gap: 8
  },
  chopModalIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  chopModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f87171',
    letterSpacing: 0.3
  },
  chopModalDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: 4
  },
  chopModalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    width: '100%'
  },
  chopModalBtnCancel: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center'
  },
  chopModalBtnCancelText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700'
  },
  chopModalBtnConfirm: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6
  },
  chopModalBtnConfirmText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  },

  // Bottom Navigation Bar Container (Cố định ở đáy màn hình)
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 80
  }
});

// Component hoạt họa vòng tròn nhỏ dần hút vào tâm màn hình khi đang chờ quét NFC
interface NfcVortexRadarProps {
  isDark: boolean;
}

const NfcVortexRadar: React.FC<NfcVortexRadarProps> = ({ isDark }) => {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createVortexLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2100,
            easing: Easing.bezier(0.2, 0, 0.2, 1),
            useNativeDriver: true
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true
          })
        ])
      );
    };

    const anim1 = createVortexLoop(ring1, 0);
    const anim2 = createVortexLoop(ring2, 700);
    const anim3 = createVortexLoop(ring3, 1400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [ring1, ring2, ring3]);

  const renderRing = (anim: Animated.Value, key: string) => {
    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [1.6, 0.32]
    });
    const opacity = anim.interpolate({
      inputRange: [0, 0.25, 0.8, 1],
      outputRange: [0.05, 0.85, 0.6, 0]
    });

    return (
      <Animated.View
        key={key}
        style={[
          styles.vortexRing,
          {
            borderColor: isDark ? '#4ade80' : '#16a34a',
            transform: [{ scale }],
            opacity
          }
        ]}
      />
    );
  };

  return (
    <View style={styles.vortexContainer}>
      {renderRing(ring1, 'vortex-ring-1')}
      {renderRing(ring2, 'vortex-ring-2')}
      {renderRing(ring3, 'vortex-ring-3')}
      <View
        style={[
          styles.vortexCenterPill,
          {
            backgroundColor: isDark ? 'rgba(22, 101, 52, 0.85)' : 'rgba(220, 252, 231, 0.95)',
            borderColor: isDark ? '#4ade80' : '#16a34a'
          }
        ]}
      >
        <Text style={styles.vortexNfcIcon}>📶</Text>
        <Text
          style={[
            styles.vortexCenterText,
            { color: isDark ? '#bbf7d0' : '#15803d' }
          ]}
        >
          Chạm thẻ NFC
        </Text>
      </View>
    </View>
  );
};

