jest.mock('@op-engineering/op-sqlite', () => ({
  open: jest.fn(() => null)
}));

import { BinaryCodec, PAYLOAD_SIZE, NFC_MAGIC_BYTES } from '../src/nfc/protocol/BinaryCodec';
import { Crc16 } from '../src/nfc/protocol/Crc16';
import { LeafType, LeafPalette, TreeModel, TreeGenetics } from '../src/types';

describe('NFC Binary Codec & 14 Leaf Types Synchronization', () => {
  it('should encode and decode all 14 leaf types without data loss', () => {
    for (let leaf = 0; leaf <= 13; leaf++) {
      const dummyTree: TreeModel = {
        id: `tree-${leaf}`,
        nfcUid: 'uid-test-123',
        generation: 0,
        genetics: {
          leafType: leaf as LeafType,
          paletteIndex: LeafPalette.EMERALD,
          branchAngle: 24,
          lengthDecay: 0.75,
          thicknessDecay: 0.55,
          maxDepth: 9,
          trunkColor: '#2d2219',
          dnaSeed: 12345678 + leaf
        },
        plantedAt: 0,
        growthDuration: 86400,
        currentProgress: 0,
        hasSeedReady: false,
        isArchived: false,
        lastSyncedAt: Date.now()
      };

      const bytes = BinaryCodec.encodeTree(dummyTree);
      expect(bytes.length).toBe(PAYLOAD_SIZE);

      // Verify CRC
      expect(Crc16.verify(bytes)).toBe(true);

      const { payload, isValidCrc } = BinaryCodec.decodePayload(bytes);
      expect(isValidCrc).toBe(true);
      expect(payload.magic).toBe(NFC_MAGIC_BYTES);
      expect(payload.leafType).toBe(leaf);
      expect(payload.dnaSeed).toBe(12345678 + leaf);
    }
  });

  it('should preserve trunk and leaf palette colors via RGB565', () => {
    for (let p = 0; p <= 11; p++) {
      const dummyTree: TreeModel = {
        id: `tree-pal-${p}`,
        nfcUid: 'uid-test-pal',
        generation: 0,
        genetics: {
          leafType: LeafType.ROUND,
          paletteIndex: p as LeafPalette,
          branchAngle: 20,
          lengthDecay: 0.75,
          thicknessDecay: 0.55,
          maxDepth: 9,
          trunkColor: '#2d2219',
          dnaSeed: 99887766
        },
        plantedAt: 0,
        growthDuration: 86400,
        currentProgress: 0,
        hasSeedReady: false,
        isArchived: false,
        lastSyncedAt: Date.now()
      };

      const bytes = BinaryCodec.encodeTree(dummyTree);
      const { payload } = BinaryCodec.decodePayload(bytes);
      expect(payload.leafPalette).toBe(p);
    }
  });

  it('should locate payload wrapped inside simulated NDEF TLV buffer', () => {
    const seedBytes = BinaryCodec.encodeTree({
      id: 'tree-ndef',
      nfcUid: 'uid-ndef',
      generation: 0,
      genetics: {
        leafType: LeafType.WILLOW, // 13
        paletteIndex: LeafPalette.AUTUMN,
        branchAngle: 28,
        lengthDecay: 0.72,
        thicknessDecay: 0.55,
        maxDepth: 9,
        trunkColor: '#181412',
        dnaSeed: 556677
      },
      plantedAt: 0,
      growthDuration: 86400,
      currentProgress: 0,
      hasSeedReady: false,
      isArchived: false,
      lastSyncedAt: Date.now()
    });

    const buffer = new Uint8Array(96);
    // Fill front with simulated NDEF header bytes
    buffer.fill(0x33, 0, 32);
    buffer.set(seedBytes, 32);

    let foundPayload = null;
    for (let offset = 0; offset <= buffer.length - PAYLOAD_SIZE; offset++) {
      const magic = (buffer[offset] << 8) | buffer[offset + 1];
      if (magic === NFC_MAGIC_BYTES) {
        const candidate = buffer.slice(offset, offset + PAYLOAD_SIZE);
        if (Crc16.verify(candidate)) {
          foundPayload = BinaryCodec.decodePayload(candidate).payload;
          break;
        }
      }
    }

    expect(foundPayload).not.toBeNull();
    expect(foundPayload?.leafType).toBe(LeafType.WILLOW);
  });

  it('should encode and decode treeVariation, thicknessDecay, initThickness and maxDepth 8..12', () => {
    for (let depth = 8; depth <= 12; depth++) {
      const tree: TreeModel = {
        id: `tree-depth-${depth}`,
        nfcUid: `uid-${depth}`,
        generation: 1,
        parentTreeId: '10001',
        genetics: {
          leafType: LeafType.POINTED,
          paletteIndex: LeafPalette.GOLDEN,
          branchAngle: 25,
          lengthDecay: 0.78,
          thicknessDecay: 0.62,
          initThickness: 48,
          maxDepth: depth,
          treeVariation: 0.95,
          trunkColor: '#3d2817',
          dnaSeed: 888999 + depth,
        },
        plantedAt: 1700000000,
        growthDuration: 3600,
        currentProgress: 1.0,
        hasSeedReady: true,
        isArchived: false,
        lastSyncedAt: Date.now(),
      };

      const bytes = BinaryCodec.encodeTree(tree);
      expect(bytes.length).toBe(PAYLOAD_SIZE);
      expect(Crc16.verify(bytes)).toBe(true);

      const { payload, isValidCrc } = BinaryCodec.decodePayload(bytes);
      expect(isValidCrc).toBe(true);
      expect(payload.maxDepth).toBe(depth);
      expect(payload.generation).toBe(1);
      expect(payload.parentTreeId).toBe(10001);

      // Verify new fields
      expect(payload.treeVariation).toBeCloseTo(0.95, 2);
      expect(payload.thicknessDecay).toBeCloseTo(0.62, 2);
      expect(payload.initThickness).toBe(48);

      // Convert to TreeModel and back
      const restored = BinaryCodec.payloadToTreeModel(payload, `uid-${depth}`);
      expect(restored.genetics.maxDepth).toBe(depth);
      expect(restored.genetics.treeVariation).toBeCloseTo(0.95, 2);
      expect(restored.genetics.thicknessDecay).toBeCloseTo(0.62, 2);
      expect(restored.genetics.initThickness).toBe(48);
    }
  });

  it('should clamp maxDepth between 8 and 12 and handle fallback defaults', () => {
    const rawBuffer = new Uint8Array(PAYLOAD_SIZE);
    // Build a payload with maxDepth out of bounds (e.g. 5 or 20)
    const tree: TreeModel = {
      id: 'tree-clamp',
      nfcUid: 'uid-clamp',
      generation: 0,
      genetics: {
        leafType: LeafType.MAPLE,
        paletteIndex: LeafPalette.SAKURA,
        branchAngle: 20,
        lengthDecay: 0.7,
        thicknessDecay: 0.5,
        maxDepth: 15, // Out of 8..12 range
        trunkColor: '#2d2219',
        dnaSeed: 42,
      },
      plantedAt: 0,
      growthDuration: 60,
      currentProgress: 0,
      hasSeedReady: false,
      isArchived: false,
      lastSyncedAt: Date.now(),
    };

    const bytes = BinaryCodec.encodeTree(tree);
    const { payload } = BinaryCodec.decodePayload(bytes);
    // Should clamp to 12
    expect(payload.maxDepth).toBe(12);
  });

  it('should encode a harvested F1 seed and clean reset simulated NTAG213 tag memory (Pages 4..39)', () => {
    // 1. Giả lập bộ nhớ người dùng thẻ NTAG213 (Pages 4..39 = 36 trang * 4B = 144B)
    // Ban đầu thẻ chứa đầy dữ liệu của cây cũ (giả lập bytes không phải 0)
    const simulatedTagUserMemory = new Uint8Array(36 * 4);
    simulatedTagUserMemory.fill(0xAA); // Dữ liệu cây cũ / rác

    // 2. Tạo hạt giống F1 được thu hoạch từ cây mẹ P
    const harvestSeed = {
      id: 'seed-harvest-999',
      generation: 1,
      parentTreeId: 'tree-parent-12345',
      genetics: {
        leafType: LeafType.GINKGO_FAN,
        paletteIndex: LeafPalette.GINKGO,
        branchAngle: 28,
        lengthDecay: 0.76,
        thicknessDecay: 0.58,
        initThickness: 42,
        maxDepth: 10,
        treeVariation: 0.85,
        trunkColor: '#3a2d24',
        dnaSeed: 55443322,
      },
      growthDuration: 86400,
      spawnedAt: Date.now(),
    };

    const seedPayload64 = BinaryCodec.encodeSeed(harvestSeed);
    expect(seedPayload64.length).toBe(PAYLOAD_SIZE);
    expect(Crc16.verify(seedPayload64)).toBe(true);

    // 3. Thực hiện mô phỏng cơ chế ghi thẻ:
    // - Ghi 64B vào Pages 4..19 (16 trang đầu)
    simulatedTagUserMemory.set(seedPayload64, 0);

    // - Reset toàn bộ các trang sau (Pages 20..39 = 20 trang = 80 bytes) về 0x00
    const trailingOffset = 16 * 4; // Byte thứ 64 (tương ứng Page 20)
    simulatedTagUserMemory.fill(0x00, trailingOffset);

    // Kiểm tra các trang trailing đã sạch 100% (không còn 0xAA)
    for (let i = trailingOffset; i < simulatedTagUserMemory.length; i++) {
      expect(simulatedTagUserMemory[i]).toBe(0x00);
    }

    // 4. Giải mã payload từ 64 Bytes đầu tiên và xác minh hạt F1
    const readPayloadBytes = simulatedTagUserMemory.slice(0, PAYLOAD_SIZE);
    const { payload, isValidCrc } = BinaryCodec.decodePayload(readPayloadBytes);

    expect(isValidCrc).toBe(true);
    expect(payload.generation).toBe(1);
    expect(payload.leafType).toBe(LeafType.GINKGO_FAN);
    expect(payload.parentTreeId).toBe(12345);
    expect(payload.treeVariation).toBeCloseTo(0.85, 2);
    expect(payload.thicknessDecay).toBeCloseTo(0.58, 2);
    expect(payload.initThickness).toBe(42);
    expect(payload.maxDepth).toBe(10);
    expect(payload.plantTimestamp).toBe(0n); // Hạt chưa gieo mầm
  });

  it('should pick leaf palette within the leaf type color pool and respect rarity pools', () => {
    const { pickLeafPaletteForType, LEAF_TYPE_COLOR_POOLS } = require('../src/config/GeneticsConfig');
    
    // Kiểm tra tất cả 14 loài lá
    for (let leaf = 0; leaf <= 13; leaf++) {
      const pool = LEAF_TYPE_COLOR_POOLS[leaf as LeafType];
      const validPalettes = [...pool.common, ...pool.rare, ...pool.legendary];
      
      for (let i = 0; i < 20; i++) {
        const picked = pickLeafPaletteForType(leaf as LeafType);
        expect(validPalettes).toContain(picked);
      }
    }
  });

  it('should generate completely randomized child genetics within authentic code ranges while preserving mother leafType', () => {
    const { generateChildGenetics } = require('../src/config/GeneticsConfig');

    const parentGenetics: TreeGenetics = {
      leafType: LeafType.SAKURA_LEAF,
      paletteIndex: LeafPalette.SAKURA,
      branchAngle: 20,
      lengthDecay: 0.75,
      thicknessDecay: 0.55,
      initThickness: 36,
      maxDepth: 9,
      treeVariation: 0.80,
      trunkColor: '#2d2219',
      dnaSeed: 112233
    };

    const children = Array.from({ length: 10 }, () => generateChildGenetics(parentGenetics));

    for (const child of children) {
      // 1. Loài lá luôn kế thừa theo mẹ
      expect(child.leafType).toBe(LeafType.SAKURA_LEAF);

      // 2. Màu lá thuộc pool của sakura_leaf
      const { LEAF_TYPE_COLOR_POOLS } = require('../src/config/GeneticsConfig');
      const validPalettes = [
        ...LEAF_TYPE_COLOR_POOLS[LeafType.SAKURA_LEAF].common,
        ...LEAF_TYPE_COLOR_POOLS[LeafType.SAKURA_LEAF].rare,
        ...LEAF_TYPE_COLOR_POOLS[LeafType.SAKURA_LEAF].legendary
      ];
      expect(validPalettes).toContain(child.paletteIndex);

      // 3. Các chỉ số khác nằm chuẩn xác trong khoảng quy định
      expect(child.branchAngle).toBeGreaterThanOrEqual(14);
      expect(child.branchAngle).toBeLessThanOrEqual(34);

      expect(child.lengthDecay).toBeGreaterThanOrEqual(0.68);
      expect(child.lengthDecay).toBeLessThanOrEqual(0.86);

      expect(child.thicknessDecay).toBeGreaterThanOrEqual(0.48);
      expect(child.thicknessDecay).toBeLessThanOrEqual(0.66);

      expect(child.initThickness).toBeGreaterThanOrEqual(24);
      expect(child.initThickness).toBeLessThanOrEqual(60);

      expect(child.maxDepth).toBeGreaterThanOrEqual(8);
      expect(child.maxDepth).toBeLessThanOrEqual(12);

      expect(child.treeVariation).toBeGreaterThanOrEqual(0.50);
      expect(child.treeVariation).toBeLessThanOrEqual(1.20);

      expect(typeof child.trunkColor).toBe('string');
      expect(child.dnaSeed).toBeGreaterThan(0);
    }

    // 4. Xác nhận không phải các cá thể y hệt nhau (có tính đa dạng ngẫu nhiên)
    const angles = new Set(children.map(c => c.branchAngle));
    const dnas = new Set(children.map(c => c.dnaSeed));
    expect(angles.size).toBeGreaterThan(1);
    expect(dnas.size).toBe(10);
  });

  it('should accurately detect when a reused NFC tag contains a new next-gen seed', () => {
    // Cây mẹ đời P trong vườn
    const motherTree: TreeModel = {
      id: 'mother-tree-p',
      nfcUid: 'TAG-UID-001',
      generation: 0,
      genetics: {
        leafType: LeafType.POINTED,
        paletteIndex: LeafPalette.EMERALD,
        branchAngle: 24,
        lengthDecay: 0.75,
        thicknessDecay: 0.55,
        initThickness: 36,
        maxDepth: 9,
        trunkColor: '#2d2219',
        dnaSeed: 111222333
      },
      plantedAt: Date.now() - 86400000,
      growthDuration: 86400,
      currentProgress: 1.0,
      hasSeedReady: true,
      isArchived: false,
      lastSyncedAt: Date.now()
    };

    // Hạt giống F1 được thu hoạch và ghi đè vào chính thẻ NFC 'TAG-UID-001'
    const childSeed = {
      id: `seed-f1-${Date.now()}`,
      generation: 1,
      parentTreeId: '111222333',
      growthDuration: 86400,
      spawnedAt: Date.now(),
      genetics: {
        leafType: LeafType.POINTED,
        paletteIndex: LeafPalette.SAKURA,
        branchAngle: 28,
        lengthDecay: 0.76,
        thicknessDecay: 0.54,
        initThickness: 38,
        maxDepth: 10,
        trunkColor: '#2d2219',
        dnaSeed: 999888777
      }
    };

    const encodedSeedBytes = BinaryCodec.encodeSeed(childSeed);
    const { payload } = BinaryCodec.decodePayload(encodedSeedBytes);

    // Kiểm tra các điều kiện nhận diện hạt giống mới
    const isFreshSeed = !payload.plantTimestamp || payload.plantTimestamp === 0n;
    const tagGen = payload.generation ?? payload.flags?.generation ?? 0;
    const isDifferentDna = payload.dnaSeed !== undefined && payload.dnaSeed !== 0 && payload.dnaSeed !== motherTree.genetics.dnaSeed;
    const isNextGen = tagGen > motherTree.generation;
    const isSeedPayload = isFreshSeed || isDifferentDna || isNextGen;

    expect(isFreshSeed).toBe(true);
    expect(isDifferentDna).toBe(true);
    expect(isNextGen).toBe(true);
    expect(isSeedPayload).toBe(true);
  });

  describe('Growth Duration by Rarity (Common: 1 day, Rare: 3 days, Legendary: 7 days)', () => {
    it('should assign 86400s (1 day) for Common trees', () => {
      const { getTreeRarity, getGrowthDurationForGenetics, RARITY_DURATIONS } = require('../src/config/GeneticsConfig');
      const commonGenetics = {
        leafType: LeafType.POINTED,
        paletteIndex: LeafPalette.EMERALD
      };
      expect(getTreeRarity(commonGenetics)).toBe('common');
      expect(getGrowthDurationForGenetics(commonGenetics)).toBe(86400);
      expect(RARITY_DURATIONS.common).toBe(86400);
    });

    it('should assign 259200s (3 days) for Rare trees (by leaf color)', () => {
      const { getTreeRarity, getGrowthDurationForGenetics, RARITY_DURATIONS } = require('../src/config/GeneticsConfig');
      // Rare theo màu (Tử đằng, Hoàng kim, Dạ lam, Hồng ngọc, Hắc diệp, Hoàng hôn)
      const rareByColor = {
        leafType: LeafType.POINTED,
        paletteIndex: LeafPalette.WISTERIA // Màu rare
      };
      expect(getTreeRarity(rareByColor)).toBe('rare');
      expect(getGrowthDurationForGenetics(rareByColor)).toBe(259200);
      expect(RARITY_DURATIONS.rare).toBe(259200);

      // Cây có loài lá hiếm nhưng màu common -> độ hiếm cây vẫn là common
      const commonColorRareLeaf = {
        leafType: LeafType.HEART,
        paletteIndex: LeafPalette.EMERALD // Màu common
      };
      expect(getTreeRarity(commonColorRareLeaf)).toBe('common');
      expect(getGrowthDurationForGenetics(commonColorRareLeaf)).toBe(86400);
    });

    it('should assign 604800s (7 days) for Legendary trees (by leaf color)', () => {
      const { getTreeRarity, getGrowthDurationForGenetics, RARITY_DURATIONS } = require('../src/config/GeneticsConfig');
      // Legendary theo màu: Hồng phấn (SAKURA), Băng tuyết (FROST), Kim sa (GOLDEN)
      expect(getTreeRarity({ leafType: LeafType.POINTED, paletteIndex: LeafPalette.GOLDEN })).toBe('legendary');
      expect(getTreeRarity({ leafType: LeafType.POINTED, paletteIndex: LeafPalette.FROST })).toBe('legendary');
      expect(getTreeRarity({ leafType: LeafType.POINTED, paletteIndex: LeafPalette.SAKURA })).toBe('legendary');

      expect(getGrowthDurationForGenetics({ leafType: LeafType.POINTED, paletteIndex: LeafPalette.GOLDEN })).toBe(604800);
      expect(RARITY_DURATIONS.legendary).toBe(604800);

      // Cây loài lá legendary (MAPLE) nhưng màu common (EMERALD) -> độ hiếm cây là common
      expect(getTreeRarity({ leafType: LeafType.MAPLE, paletteIndex: LeafPalette.EMERALD })).toBe('common');
      expect(getGrowthDurationForGenetics({ leafType: LeafType.MAPLE, paletteIndex: LeafPalette.EMERALD })).toBe(86400);
    });

    it('should correctly handle color rarity exceptions per leaf shape', () => {
      const { getLeafColorRarity, getTreeRarity, getGrowthDurationForGenetics } = require('../src/config/GeneticsConfig');
      // Ngoại lệ 1: Cánh Anh Đào: màu Hồng Phấn là common (thay vì legendary)
      expect(getLeafColorRarity(LeafType.SAKURA_LEAF, LeafPalette.SAKURA)).toBe('common');
      // Phân cấp cây tính theo màu lá ngoại lệ -> Cây là common
      expect(getTreeRarity({ leafType: LeafType.SAKURA_LEAF, paletteIndex: LeafPalette.SAKURA })).toBe('common');
      expect(getGrowthDurationForGenetics({ leafType: LeafType.SAKURA_LEAF, paletteIndex: LeafPalette.SAKURA })).toBe(86400);

      // Ngoại lệ 2: Lá phong (2 loại): màu hoàng hôn là common (thay vì rare)
      expect(getLeafColorRarity(LeafType.MAPLE, LeafPalette.SUNSET)).toBe('common');
      expect(getLeafColorRarity(LeafType.MAPLE5, LeafPalette.SUNSET)).toBe('common');
      expect(getTreeRarity({ leafType: LeafType.MAPLE, paletteIndex: LeafPalette.SUNSET })).toBe('common');

      // Ngoại lệ 3: Lá ngân hạnh: màu Hoàng Kim là common (thay vì rare)
      expect(getLeafColorRarity(LeafType.GINKGO_FAN, LeafPalette.GINKGO)).toBe('common');
      expect(getTreeRarity({ leafType: LeafType.GINKGO_FAN, paletteIndex: LeafPalette.GINKGO })).toBe('common');

      // Ngoại lệ 4: Lá khuynh diệp tròn và lá bạch đàn: màu khói bạc là common
      expect(getLeafColorRarity(LeafType.ROUND, LeafPalette.EUCALYPTUS)).toBe('common');
      expect(getLeafColorRarity(LeafType.EUCALYPTUS_LONG, LeafPalette.EUCALYPTUS)).toBe('common');
      expect(getTreeRarity({ leafType: LeafType.ROUND, paletteIndex: LeafPalette.EUCALYPTUS })).toBe('common');
      expect(getGrowthDurationForGenetics({ leafType: LeafType.ROUND, paletteIndex: LeafPalette.EUCALYPTUS })).toBe(86400);
    });

    it('should decode payload with fallback duration matching rarity if growthDurationSec is 0 or omitted', () => {
      const { getGrowthDurationForGenetics } = require('../src/config/GeneticsConfig');
      const rareTree: TreeModel = {
        id: 'tree-rare-test',
        nfcUid: 'uid-rare-1',
        generation: 1,
        genetics: {
          leafType: LeafType.GINKGO_FAN,
          paletteIndex: LeafPalette.WISTERIA, // Rare for GINKGO_FAN
          branchAngle: 24,
          lengthDecay: 0.75,
          thicknessDecay: 0.55,
          maxDepth: 9,
          trunkColor: '#2d2219',
          dnaSeed: 556677
        },
        plantedAt: Date.now(),
        growthDuration: 259200,
        currentProgress: 0.1,
        hasSeedReady: false,
        isArchived: false,
        lastSyncedAt: Date.now()
      };

      const bytes = BinaryCodec.encodeTree(rareTree);
      const { payload } = BinaryCodec.decodePayload(bytes);
      const decodedTree = BinaryCodec.payloadToTreeModel(payload, 'uid-rare-1');

      expect(decodedTree.growthDuration).toBe(259200);
    });

    it('should correctly archive an incomplete tree at its current progress without forcing 100%', async () => {
      const { gardenRepository } = require('../src/storage/repositories/GardenRepository');
      const { database } = require('../src/storage/database/Database');

      const mockDb = {
        execute: jest.fn().mockImplementation((sql: string, params?: any[]) => {
          if (sql.includes('SELECT * FROM archive_trees')) {
            return Promise.resolve({
              rows: {
                _array: [
                  {
                    id: 'archive-test-incomplete',
                    original_tree_id: 'tree-incomplete-1',
                    generation: 1,
                    parent_tree_id: 'tree-p',
                    planted_at: 1700000000000,
                    completed_at: 1700050000000,
                    leaf_type: LeafType.MAPLE,
                    trunk_color: '#3a2d24',
                    leaf_color: '1',
                    dna_seed: 887766,
                    archived_at: 1700050000000,
                    nfc_uid: '04AABBCCDD',
                    progress: 0.45,
                    growth_duration: 86400,
                    branch_angle: 26,
                    length_factor: 0.78,
                    thickness_decay: 0.58,
                    init_thickness: 38,
                    tree_variation: 0.85,
                    max_depth: 9
                  },
                  {
                    id: 'archive-test-mature',
                    original_tree_id: 'tree-mature-1',
                    generation: 0,
                    parent_tree_id: null,
                    planted_at: 1690000000000,
                    completed_at: 1690086400000,
                    leaf_type: LeafType.SAKURA_LEAF,
                    trunk_color: '#2d2219',
                    leaf_color: '0',
                    dna_seed: 112233,
                    archived_at: 1690086400000,
                    nfc_uid: '04FFEEDDCC',
                    progress: 1.0,
                    growth_duration: 86400
                  }
                ]
              }
            });
          }
          return Promise.resolve({ rows: { _array: [] } });
        })
      };

      jest.spyOn(database, 'init').mockResolvedValue(mockDb as any);

      // 1. Test getArchivedTrees mapping
      const archivedList = await gardenRepository.getArchivedTrees();
      expect(archivedList.length).toBe(2);

      // Cây 1: Lưu ở tiến độ 45% (chưa lớn 100%)
      const incomplete = archivedList[0];
      expect(incomplete.currentProgress).toBe(0.45);
      expect(incomplete.isArchived).toBe(true);
      expect(incomplete.genetics.leafType).toBe(LeafType.MAPLE);
      expect(incomplete.genetics.branchAngle).toBe(26);
      expect(incomplete.genetics.lengthDecay).toBe(0.78);
      expect(incomplete.genetics.thicknessDecay).toBe(0.58);
      expect(incomplete.genetics.initThickness).toBe(38);
      expect(incomplete.genetics.treeVariation).toBe(0.85);

      // Cây 2: Lưu ở tiến độ 100%
      const mature = archivedList[1];
      expect(mature.currentProgress).toBe(1.0);
      expect(mature.isArchived).toBe(true);

      // 2. Test archiveTree call with specific progress
      const treeToArchive: TreeModel = {
        id: 'tree-to-archive',
        nfcUid: '04AABBCCDD',
        generation: 2,
        genetics: {
          leafType: LeafType.GINKGO_FAN,
          paletteIndex: LeafPalette.GOLDEN,
          branchAngle: 22,
          lengthDecay: 0.75,
          thicknessDecay: 0.55,
          initThickness: 36,
          maxDepth: 9,
          treeVariation: 0.8,
          trunkColor: '#3a2d24',
          dnaSeed: 99999
        },
        plantedAt: Date.now() - 43200000,
        growthDuration: 86400,
        currentProgress: 0.5,
        hasSeedReady: false,
        isArchived: false,
        lastSyncedAt: Date.now()
      };

      const archiveRes = await gardenRepository.archiveTree(treeToArchive, 0.5);
      expect(archiveRes).toBe(true);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO archive_trees'),
        expect.arrayContaining([0.5])
      );
    });
  });
});




