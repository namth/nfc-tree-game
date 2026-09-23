/**
 * Garden Dashboard Screen - Khu Vườn Của Tôi (Themed & Bilingual)
 * Project: Fractal Tree NFC Mobile Game
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Alert
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { TreeModel, LeafType, LeafPalette, SeedModel } from '../types';
import { gardenRepository } from '../storage/repositories/GardenRepository';
import { CompendiumRepository } from '../storage/repositories/CompendiumRepository';
import { nfcService } from '../nfc/NfcService';
import { BinaryCodec } from '../nfc/protocol/BinaryCodec';
import { TreeCard } from '../components/TreeCard';
import { NfcScanModal } from '../components/NfcScanModal';
import { BottomNavBar, NavTabId } from '../components/BottomNavBar';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { pickLeafPaletteForType, getGrowthDurationForGenetics, ALL_TRUNK_THEMES } from '../config/GeneticsConfig';

interface GardenDashboardProps {
  onSelectTree?: (tree: TreeModel) => void;
  onOpenSettings?: () => void;
  onNavigateTab?: (tab: NavTabId) => void;
}

export const GardenDashboardScreen: React.FC<GardenDashboardProps> = ({
  onSelectTree,
  onNavigateTab
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [trees, setTrees] = useState<TreeModel[]>([]);
  const [isNfcModalOpen, setIsNfcModalOpen] = useState<boolean>(false);
  const [nfcStatusText, setNfcStatusText] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    loadTrees();
  }, []);

  const loadTrees = async () => {
    try {
      const list = await gardenRepository.getAllTrees();
      setTrees(list.filter(t => !t.isArchived));
    } catch (err) {
      console.error('[GardenDashboard] Lỗi khi tải danh sách cây:', err);
      setTrees([]);
    }
  };

  /**
   * Tiến hành trồng cây mới từ payload hạt giống và ghi nhận vào cơ sở dữ liệu
   */
  const plantNewTreeFromPayload = async (payload: any, nfcUid: string) => {
    const isBlankTag = payload.magic !== 0x5452;
    const now = Date.now();

    let newTree: TreeModel;

    if (isBlankTag) {
      setNfcStatusText(t('garden.newSeedMsg'));
      const randomLeafType = Math.floor(Math.random() * 14) as LeafType;
      const randomPalette = pickLeafPaletteForType(randomLeafType);
      const randomAngle = 18 + Math.floor(Math.random() * 16);
      const randomDna = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
      const randomTrunk = ALL_TRUNK_THEMES[Math.floor(Math.random() * ALL_TRUNK_THEMES.length)];

      const newGenetics = {
        leafType: randomLeafType,
        paletteIndex: randomPalette,
        branchAngle: randomAngle,
        lengthDecay: 0.75,
        thicknessDecay: 0.55,
        initThickness: 36,
        maxDepth: 9,
        treeVariation: 0.80,
        trunkColor: randomTrunk.color,
        dnaSeed: randomDna
      };

      newTree = {
        id: `tree-${now}`,
        nfcUid: nfcUid,
        generation: 0,
        genetics: newGenetics,
        plantedAt: now,
        growthDuration: getGrowthDurationForGenetics(newGenetics),
        currentProgress: 0.01,
        hasSeedReady: false,
        isArchived: false,
        lastSyncedAt: now,
        lastViewedAt: now
      };

      try {
        await nfcService.plantSeedOnConnectedTag(newTree);
      } catch (e) {
        console.warn('[NFC] Ghi thẻ trắng thất bại, lưu cục bộ:', e);
      }
    } else {
      const isFreshSeed = !payload.plantTimestamp || payload.plantTimestamp === 0n;
      const plantTime = isFreshSeed ? now : Number(payload.plantTimestamp);

      const treeGenetics = {
        leafType: payload.leafType,
        paletteIndex: payload.leafPalette ?? LeafPalette.EMERALD,
        branchAngle: payload.branchAngle,
        lengthDecay: payload.lengthDecayPct / 100,
        thicknessDecay: payload.thicknessDecay ?? (payload.thicknessDecayPct / 100),
        initThickness: payload.initThickness ?? payload.initThicknessVal ?? 36,
        maxDepth: payload.maxDepth ?? 9,
        treeVariation: payload.treeVariation ?? payload.treeVariationVal ?? 0.80,
        trunkColor: payload.trunkColorHex || '#3a2d24',
        dnaSeed: payload.dnaSeed
      };

      newTree = {
        id: `tree-${now}`,
        nfcUid: nfcUid,
        generation: payload.generation ?? payload.flags?.generation ?? 0,
        parentTreeId: payload.parentTreeId ? String(payload.parentTreeId) : undefined,
        genetics: treeGenetics,
        plantedAt: plantTime,
        growthDuration: (payload.growthDurationSec && payload.growthDurationSec > 0)
          ? payload.growthDurationSec
          : getGrowthDurationForGenetics(treeGenetics),
        currentProgress: 0.01,
        hasSeedReady: false,
        isArchived: false,
        lastSyncedAt: now,
        lastViewedAt: now
      };

      if (isFreshSeed) {
        try {
          await nfcService.plantSeedOnConnectedTag(newTree);
        } catch (e) {
          console.warn('[NFC] Ghi mốc gieo mầm vào thẻ thất bại, lưu cục bộ:', e);
        }
      }
    }

    try {
      await nfcService.cancelScan();
    } catch {}

    await gardenRepository.upsertTree(newTree);
    setNfcStatusText(t('garden.plantedSuccess', { id: newTree.id.slice(-4) }));
    await loadTrees();
    setTimeout(() => {
      setIsNfcModalOpen(false);
      setIsScanning(false);
      if (onSelectTree) onSelectTree(newTree);
    }, 1200);
  };

  /**
   * Bắt đầu quét thẻ NFC thực tế từ phần cứng để gieo mầm
   */
  const handleStartRealNfcScan = async () => {
    setIsNfcModalOpen(true);
    setIsScanning(true);
    setNfcStatusText(t('nfcModal.readyPrompt'));

    try {
      // Giữ phiên kết nối sau khi đọc để có thể ghi mốc gieo mầm trực tiếp (Atomic Read-Then-Write)
      const res = await nfcService.scanAndReadTag(true);
      if (res && res.payload) {
        let payload = res.payload;

        // 1. Kiểm tra xem thẻ này đã từng gieo mầm trong vườn chưa
        const existingTree = trees.find(t => t.nfcUid === res.nfcUid);
        if (existingTree) {
          // Thẻ chỉ thực sự là HẠT GIỐNG MỚI nếu mang thế hệ con cao hơn (F1 -> F2) hoặc mã gen DNA khác hẳn cây đang trồng
          const tagGen = payload.generation ?? payload.flags?.generation ?? 0;
          const isNextGen = tagGen > existingTree.generation;
          const isDifferentDna =
            payload.dnaSeed !== undefined &&
            payload.dnaSeed !== 0 &&
            payload.dnaSeed !== existingTree.genetics.dnaSeed;

          const isSeedPayload = isNextGen || isDifferentDna;

          if (isSeedPayload) {
            // Tính toán tiến độ sinh trưởng động hiện tại của cây
            const fallbackDuration = getGrowthDurationForGenetics(existingTree.genetics);
            const totalDuration = existingTree.growthDuration || fallbackDuration;
            const elapsedSec = Math.max(0, (Date.now() - (existingTree.plantedAt || Date.now())) / 1000);
            const timeProgress = Math.min(1.0, Math.max(0.01, elapsedSec / totalDuration));
            const savedProgress = existingTree.currentProgress || 0;
            const currentTreeProgress = Math.min(1.0, Math.max(timeProgress, savedProgress));

            if (currentTreeProgress < 1.0) {
              // Cây chưa đạt 100%: Dừng NFC scan và hiện Alert cảnh báo hỏi ý kiến người dùng
              await nfcService.cancelScan();
              setIsNfcModalOpen(false);
              setIsScanning(false);

              const treeName = `${existingTree.generation === 0 ? t('common.generationP') : t('common.generationFn', { gen: existingTree.generation })} #${existingTree.id.slice(-4)}`;
              const progressPct = Math.floor(currentTreeProgress * 100);

              Alert.alert(
                t('garden.incompleteWarningTitle'),
                t('garden.incompleteWarningDesc', { name: treeName, progress: progressPct }),
                [
                  {
                    text: t('garden.cancelBtn'),
                    style: 'cancel',
                    onPress: () => {
                      // Người dùng chọn HỦY: Giữ nguyên cây cũ trong vườn, không trồng cây mới
                    }
                  },
                  {
                    text: t('garden.continueBtn'),
                    style: 'destructive',
                    onPress: async () => {
                      // Người dùng chọn TIẾP TỤC:
                      // Chuyển cây cũ vào Nhà Kính với tiến độ hiện tại (không phải 100%)
                      await gardenRepository.archiveTree(existingTree, currentTreeProgress);
                      await gardenRepository.deleteTree(existingTree.id);
                      // Gieo mầm cây mới từ thẻ NFC
                      await plantNewTreeFromPayload(payload, res.nfcUid);
                    }
                  }
                ]
              );
              return;
            } else {
              // Cây đã hoàn thành 100%: Tự động chuyển vào Nhà Kính và gieo mầm mới
              setNfcStatusText(t('garden.archivingExistingTree'));
              await gardenRepository.archiveTree(existingTree, 1.0);
              await gardenRepository.deleteTree(existingTree.id);
              setNfcStatusText(t('garden.plantingSeedMsg'));
            }
          } else {
            // Thẻ này chứa chính xác cây cũ đang sinh trưởng trong vườn -> Giải phóng NFC và mở xem chi tiết
            // Tự động đồng bộ mốc đã gieo lên thẻ nếu lần trước bị ngắt quãng
            if (!payload.plantTimestamp || payload.plantTimestamp === 0n) {
              nfcService.plantSeedOnConnectedTag(existingTree).catch(() => {});
            }

            await nfcService.cancelScan();
            setNfcStatusText(t('garden.existingTreeMsg', { id: existingTree.id.slice(-4) }));
            setTimeout(() => {
              setIsNfcModalOpen(false);
              setIsScanning(false);
              if (onSelectTree) onSelectTree(existingTree);
            }, 1200);
            return;
          }
        }

        // 2 & 3. Gieo mầm cây mới (thẻ trắng hoặc hạt giống trên thẻ)
        await plantNewTreeFromPayload(payload, res.nfcUid);
      } else {
        await nfcService.cancelScan();
        setNfcStatusText(t('nfcModal.readyPrompt'));
      }
    } catch (err) {
      console.error('[NFC] Lỗi khi quét gieo hạt:', err);
      await nfcService.cancelScan();
      setNfcStatusText(t('nfcModal.readyPrompt'));
    } finally {
      setIsScanning(false);
    }
  };


  const handleHarvestSeed = (tree: TreeModel) => {
    Alert.alert(
      t('treeDetail.harvestBtn', { gen: tree.generation + 1 }),
      `Tree #${tree.id.slice(-4)} (${t('common.generationFn', { gen: tree.generation + 1 })})`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('garden.scanFloating'),
          onPress: () => {
            handleStartRealNfcScan();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/app_icon.png')}
            style={[styles.appIconThumb, { borderColor: colors.border }]}
          />
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t('garden.title')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {trees.length > 0
                ? t('garden.statsCount', { count: trees.length })
                : t('garden.subtitle')}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tree Card 2-Column Grid */}
        {trees.length > 0 ? (
          <View style={styles.treeGrid}>
            {trees.map((tree) => (
              <TreeCard
                key={tree.id}
                tree={tree}
                onPress={onSelectTree}
                onHarvestSeed={handleHarvestSeed}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.border
                }
              ]}
            >
              <Text style={styles.emptyIcon}>🌱</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('garden.emptyTitle')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {t('garden.emptyDesc')}
            </Text>

            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.emptyCtaBtn,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primary
                }
              ]}
              onPress={handleStartRealNfcScan}
            >
              <Text style={[styles.emptyCtaText, { color: colors.primary }]}>
                🌿 {t('garden.scanSeedBtn')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating NFC Scan Button */}
      {trees.length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.nfcFab, { backgroundColor: colors.primary }]}
            onPress={handleStartRealNfcScan}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 8C4 5.79086 5.79086 4 8 4H16C18.2091 4 20 5.79086 20 8V16C20 18.2091 18.2091 20 16 20H8C5.79086 20 4 18.2091 4 16V8Z"
                stroke={isDark ? '#080b0a' : '#ffffff'}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <Path
                d="M8.5 15.5V8.5L12 13.5V8.5"
                stroke={isDark ? '#080b0a' : '#ffffff'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M15.5 8.5V15.5"
                stroke={isDark ? '#080b0a' : '#ffffff'}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </Svg>
            <Text style={[styles.nfcFabText, { color: isDark ? '#080b0a' : '#ffffff' }]}>
              {t('garden.scanFloating')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* NFC Scan Modal */}
      <NfcScanModal
        visible={isNfcModalOpen}
        statusText={nfcStatusText}
        isScanning={isScanning}
        onClose={() => {
          nfcService.cancelScan();
          setIsNfcModalOpen(false);
        }}
      />

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        activeTab="garden"
        onSelectTab={onNavigateTab || (() => {})}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  appIconThumb: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4
  },
  headerSubtitle: {
    fontSize: 11.5,
    marginTop: 1
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 96
  },
  treeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
    paddingHorizontal: 24
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  emptyIcon: {
    fontSize: 38
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.2
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 290
  },
  emptyCtaBtn: {
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20
  },
  emptyCtaText: {
    fontSize: 13.5,
    fontWeight: '700'
  },
  fabContainer: {
    position: 'absolute',
    bottom: 78,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  nfcFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8
  },
  nfcFabText: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.3
  }
});
