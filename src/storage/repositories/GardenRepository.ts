/**
 * Garden Repository for SQLite CRUD operations
 * Project: Fractal Tree NFC Mobile Game
 */

import { database } from '../database/Database';
import { TreeModel, LeafType, LeafPalette } from '../../types';
import { CompendiumRepository } from './CompendiumRepository';
import { getGrowthDurationForGenetics, generateChildGenetics } from '../../config/GeneticsConfig';

export const SEED_CYCLE_MS = 24 * 60 * 60 * 1000; // 24 giờ = 86,400,000 ms

/**
 * Xử lý vòng đời hạt giống chuẩn:
 * - Khi cây 100%: có hạt giống.
 * - Sau khi thu hoạch: phải chờ 1 ngày (24h) mới kết hạt tiếp theo.
 * - Nếu không thu hoạch: sau 1 ngày (24h) cây sẽ tự động re-roll (random) sang hạt khác.
 * - Trong thời gian chưa mọc hạt khác: hạt cũ giữ nguyên 100% giá trị kể từ khi sinh ra.
 */
export function processTreeSeedLifecycle(tree: TreeModel): { tree: TreeModel; changed: boolean } {
  const isMature = tree.currentProgress >= 1.0;
  if (!isMature || tree.isArchived) {
    if (tree.hasSeedReady) {
      return { tree: { ...tree, hasSeedReady: false }, changed: true };
    }
    return { tree, changed: false };
  }

  const now = Date.now();
  let changed = false;
  let hasSeedReady = tree.hasSeedReady;
  let lastHarvestedAt = tree.lastHarvestedAt;
  let seedSpawnedAt = tree.seedSpawnedAt;
  let currentSeedGenetics = tree.currentSeedGenetics;

  // 1. Kiểm tra thời gian chờ 24h sau khi thu hoạch
  if (lastHarvestedAt) {
    const elapsedSinceHarvest = now - lastHarvestedAt;
    if (elapsedSinceHarvest < SEED_CYCLE_MS) {
      // Đang trong thời gian 24h chờ kết hạt mới -> không có hạt
      if (hasSeedReady || currentSeedGenetics) {
        return {
          tree: {
            ...tree,
            hasSeedReady: false,
            currentSeedGenetics: undefined,
            seedSpawnedAt: undefined
          },
          changed: true
        };
      }
      return { tree, changed: false };
    } else {
      // Đã qua 24h -> cây mọc hạt mới!
      if (!hasSeedReady) {
        hasSeedReady = true;
        changed = true;
      }
    }
  } else {
    // Cây chưa từng thu hoạch: khi đạt 100% là có hạt
    if (!hasSeedReady) {
      hasSeedReady = true;
      changed = true;
    }
  }

  // 2. Nếu cây đang có hạt: kiểm tra chu kỳ 24h để re-roll nếu chưa thu hoạch
  if (hasSeedReady) {
    if (!currentSeedGenetics || !seedSpawnedAt) {
      // Khởi tạo hạt đầu tiên
      currentSeedGenetics = generateChildGenetics(tree.genetics);
      seedSpawnedAt = now;
      changed = true;
    } else {
      const elapsedSinceSpawn = now - seedSpawnedAt;
      if (elapsedSinceSpawn >= SEED_CYCLE_MS) {
        // Đã qua 24h không thu hoạch -> cây random lại hạt khác!
        currentSeedGenetics = generateChildGenetics(tree.genetics);
        seedSpawnedAt = now;
        changed = true;
      }
      // Trong thời gian chưa mọc hạt khác -> giữ nguyên giá trị hạt cũ!
    }
  }

  const updatedTree: TreeModel = {
    ...tree,
    hasSeedReady,
    lastHarvestedAt,
    seedSpawnedAt,
    currentSeedGenetics
  };

  return { tree: updatedTree, changed };
}

export class GardenRepository {
  /**
   * Lấy toàn bộ danh sách cây đang sống trong vườn
   */
  async getAllTrees(): Promise<TreeModel[]> {
    const db = await database.init();
    if (!db) return [];

    try {
      const result = await db.execute('SELECT * FROM garden_trees ORDER BY planted_at DESC;');
      const rows = result.rows?._array || [];

      // Nếu vườn chưa có cây, tự động gieo sẵn cây Cổ Thụ Kim Sa mẫu (100% Trưởng Thành, có quả phát sáng)
      // để người dùng có thể trải nghiệm ngay hiệu ứng 3 tầng lấp lánh & hào quang
      if (rows.length === 0) {
        const now = Date.now();
        const sampleGenetics = {
          leafType: LeafType.POINTED,
          paletteIndex: LeafPalette.GOLDEN,
          branchAngle: 24,
          lengthDecay: 0.75,
          thicknessDecay: 0.55,
          initThickness: 36,
          maxDepth: 9,
          treeVariation: 0.80,
          trunkColor: '#2d2219',
          dnaSeed: 12345678
        };
        const sampleTree: TreeModel = {
          id: 'tree-sample-golden',
          nfcUid: '04A1B2C3D4E5F6',
          generation: 0,
          plantedAt: now - 86400000 * 7,
          growthDuration: 604800,
          currentProgress: 1.0,
          hasSeedReady: true,
          isArchived: false,
          lastSyncedAt: now,
          lastViewedAt: now,
          seedSpawnedAt: now,
          currentSeedGenetics: generateChildGenetics(sampleGenetics),
          genetics: sampleGenetics
        };
        await this.upsertTree(sampleTree);
        try {
          await CompendiumRepository.recordTreeTraits(sampleTree.genetics, now, true);
        } catch {
          // ignore
        }
        return [sampleTree];
      }

      return rows.map((r: any) => {
        let paletteVal = 11;
        if (r.leaf_color !== null && r.leaf_color !== undefined) {
          const parsed = parseInt(String(r.leaf_color), 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 11) {
            paletteVal = parsed;
          }
        }

        const standardDuration = getGrowthDurationForGenetics({ leafType: r.leaf_type, paletteIndex: paletteVal });
        const durationSec = (r.growth_duration && r.growth_duration !== 86400)
          ? r.growth_duration
          : standardDuration;

        // Tự động tính toán tiến trình lớn động dựa trên thời gian trôi qua hoặc tiến trình đã lưu
        const elapsedSec = Math.max(0, (Date.now() - (r.planted_at || Date.now())) / 1000);
        const timeProgress = Math.min(1.0, Math.max(0.01, elapsedSec / durationSec));
        const savedProgress = (r.current_progress !== undefined && r.current_progress !== null) ? Number(r.current_progress) : 0;
        const computedProgress = Math.min(1.0, Math.max(timeProgress, savedProgress));

        let parsedSeedGenetics: any = undefined;
        if (r.seed_genetics) {
          try {
            parsedSeedGenetics = JSON.parse(r.seed_genetics);
          } catch {}
        }

        const rawTree: TreeModel = {
          id: r.id,
          nfcUid: r.nfc_uid,
          generation: r.generation,
          parentTreeId: r.parent_tree_id,
          plantedAt: r.planted_at,
          growthDuration: durationSec,
          currentProgress: computedProgress,
          hasSeedReady: r.has_seed_ready === 1,
          isArchived: false,
          lastSyncedAt: r.last_synced_at,
          lastViewedAt: r.last_viewed_at || r.planted_at,
          thumbnailData: r.thumbnail_data || undefined,
          lastHarvestedAt: r.last_harvested_at ? Number(r.last_harvested_at) : undefined,
          seedSpawnedAt: r.seed_spawned_at ? Number(r.seed_spawned_at) : undefined,
          currentSeedGenetics: parsedSeedGenetics,
          genetics: {
            leafType: r.leaf_type,
            paletteIndex: paletteVal,
            branchAngle: r.branch_angle,
            lengthDecay: r.length_factor,
            thicknessDecay: r.thickness_decay !== undefined && r.thickness_decay !== null ? r.thickness_decay : 0.55,
            maxDepth: r.max_depth,
            trunkColor: r.trunk_color,
            dnaSeed: r.dna_seed,
            treeVariation: r.tree_variation !== undefined && r.tree_variation !== null ? r.tree_variation : 0.80,
            initThickness: r.init_thickness !== undefined && r.init_thickness !== null ? r.init_thickness : 36.0
          }
        };

        const { tree: processedTree, changed } = processTreeSeedLifecycle(rawTree);
        if (changed) {
          this.upsertTree(processedTree).catch(() => {});
        }
        return processedTree;
      });
    } catch (err) {
      console.error('[GardenRepository] Lỗi khi lấy danh sách cây:', err);
      return [];
    }
  }

  /**
   * Lưu hoặc cập nhật thông tin cây
   */
  async upsertTree(tree: TreeModel): Promise<boolean> {
    const db = await database.init();
    if (!db) return false;

    try {
      await db.execute(
        `INSERT OR REPLACE INTO garden_trees (
          id, nfc_uid, generation, parent_tree_id, planted_at,
          growth_duration, max_depth, branch_angle, length_factor,
          leaf_type, trunk_color, leaf_color, dna_seed,
          current_progress, has_seed_ready, last_synced_at,
          last_viewed_at, thumbnail_data, tree_variation, thickness_decay, init_thickness,
          last_harvested_at, seed_spawned_at, seed_genetics
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          tree.id,
          tree.nfcUid,
          tree.generation,
          tree.parentTreeId || null,
          tree.plantedAt,
          tree.growthDuration,
          tree.genetics.maxDepth,
          tree.genetics.branchAngle,
          tree.genetics.lengthDecay,
          tree.genetics.leafType,
          tree.genetics.trunkColor,
          String(tree.genetics.paletteIndex ?? 11),
          tree.genetics.dnaSeed,
          tree.currentProgress,
          tree.hasSeedReady ? 1 : 0,
          tree.lastSyncedAt,
          tree.lastViewedAt || null,
          tree.thumbnailData || null,
          tree.genetics.treeVariation ?? 0.80,
          tree.genetics.thicknessDecay ?? 0.55,
          tree.genetics.initThickness ?? 36.0,
          tree.lastHarvestedAt || null,
          tree.seedSpawnedAt || null,
          tree.currentSeedGenetics ? JSON.stringify(tree.currentSeedGenetics) : null
        ]
      );

      // Tự động ghi nhận đặc tính vào Thư Viện Bách Thảo
      try {
        await CompendiumRepository.recordTreeTraits(tree.genetics, tree.plantedAt);
      } catch (e) {
        // Không làm gián đoạn luồng lưu
      }

      return true;
    } catch (err) {
      console.error('[GardenRepository] Lỗi khi lưu cây:', err);
      return false;
    }
  }

  /**
   * Cập nhật nhanh mốc thời gian xem gần nhất và snapshot thumbnail vector
   */
  async updateLastViewedSnapshot(
    treeId: string,
    timestamp: number,
    thumbnailData?: string
  ): Promise<boolean> {
    const db = await database.init();
    if (!db) return false;

    try {
      if (thumbnailData) {
        await db.execute(
          'UPDATE garden_trees SET last_viewed_at = ?, thumbnail_data = ? WHERE id = ?;',
          [timestamp, thumbnailData, treeId]
        );
        await db.execute(
          'UPDATE archive_trees SET thumbnail_data = ? WHERE id = ?;',
          [thumbnailData, treeId]
        );
      } else {
        await db.execute(
          'UPDATE garden_trees SET last_viewed_at = ? WHERE id = ?;',
          [timestamp, treeId]
        );
      }
      return true;
    } catch (err) {
      console.error('[GardenRepository] Lỗi khi cập nhật snapshot xem cây:', err);
      return false;
    }
  }

  /**
   * Xóa cây khỏi vườn hoặc Nhà Kính
   */
  async deleteTree(treeId: string): Promise<boolean> {
    const db = await database.init();
    if (!db) return false;

    try {
      await db.execute('DELETE FROM garden_trees WHERE id = ?;', [treeId]);
      await db.execute('DELETE FROM archive_trees WHERE id = ?;', [treeId]);
      return true;
    } catch (err) {
      console.error('[GardenRepository] Lỗi khi xóa cây:', err);
      return false;
    }
  }

  /**
   * Xóa cây lưu trữ khỏi Nhà Kính danh dự
   */
  async deleteArchivedTree(treeId: string): Promise<boolean> {
    const db = await database.init();
    if (!db) return false;

    try {
      await db.execute('DELETE FROM archive_trees WHERE id = ?;', [treeId]);
      return true;
    } catch (err) {
      console.error('[GardenRepository] Lỗi khi xóa cây lưu trữ:', err);
      return false;
    }
  }

  /**
   * Cập nhật tiến độ và ảnh đại diện thumbnail cho cây trong Nhà Kính
   */
  async updateArchivedTreeProgress(
    treeId: string,
    progress: number,
    thumbnailData?: string
  ): Promise<boolean> {
    const db = await database.init();
    if (!db) return false;

    try {
      if (thumbnailData) {
        await db.execute(
          'UPDATE archive_trees SET progress = ?, thumbnail_data = ? WHERE id = ?;',
          [progress, thumbnailData, treeId]
        );
      } else {
        await db.execute(
          'UPDATE archive_trees SET progress = ? WHERE id = ?;',
          [progress, treeId]
        );
      }
      return true;
    } catch (err) {
      console.error('[GardenRepository] Lỗi khi cập nhật tiến độ cây lưu trữ:', err);
      return false;
    }
  }

  /**
   * Lấy toàn bộ danh sách cây trong Nhà Kính (giữ nguyên tiến độ lúc lưu trữ)
   */
  async getArchivedTrees(): Promise<TreeModel[]> {
    const db = await database.init();
    if (!db) return [];

    try {
      const result = await db.execute('SELECT * FROM archive_trees ORDER BY completed_at DESC;');
      const rows = result.rows?._array || [];

      return rows.map((r: any) => {
        let paletteVal = 11;
        if (r.leaf_color !== null && r.leaf_color !== undefined) {
          const parsed = parseInt(String(r.leaf_color), 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 11) {
            paletteVal = parsed;
          }
        }

        const standardDuration = getGrowthDurationForGenetics({ leafType: r.leaf_type, paletteIndex: paletteVal });
        const nfcId = (r.nfc_uid && r.nfc_uid !== 'ARCHIVED')
          ? r.nfc_uid
          : (r.original_tree_id ? r.original_tree_id : r.id);

        const savedProgress = (r.progress !== null && r.progress !== undefined)
          ? Number(r.progress)
          : 1.0;

        return {
          id: r.id,
          nfcUid: nfcId,
          generation: r.generation,
          parentTreeId: r.parent_tree_id,
          plantedAt: r.planted_at,
          growthDuration: (r.growth_duration && r.growth_duration > 0) ? Number(r.growth_duration) : standardDuration,
          currentProgress: savedProgress,
          hasSeedReady: false,
          isArchived: true,
          lastSyncedAt: r.completed_at,
          thumbnailData: r.thumbnail_data || undefined,
          genetics: {
            leafType: r.leaf_type,
            paletteIndex: paletteVal,
            branchAngle: (r.branch_angle !== null && r.branch_angle !== undefined) ? Number(r.branch_angle) : 22,
            lengthDecay: (r.length_factor !== null && r.length_factor !== undefined) ? Number(r.length_factor) : 0.75,
            thicknessDecay: (r.thickness_decay !== null && r.thickness_decay !== undefined) ? Number(r.thickness_decay) : 0.55,
            maxDepth: (r.max_depth !== null && r.max_depth !== undefined) ? Number(r.max_depth) : 9,
            treeVariation: (r.tree_variation !== null && r.tree_variation !== undefined) ? Number(r.tree_variation) : 0.80,
            initThickness: (r.init_thickness !== null && r.init_thickness !== undefined) ? Number(r.init_thickness) : 36.0,
            trunkColor: r.trunk_color,
            dnaSeed: r.dna_seed
          }
        };
      });
    } catch (err) {
      console.error('[GardenRepository] Lỗi khi đọc danh sách cây lưu trữ:', err);
      return [];
    }
  }

  /**
   * Chuyển cây vào Nhà Kính Lưu Trữ với tiến độ hiện tại
   */
  async archiveTree(tree: TreeModel, progress?: number): Promise<boolean> {
    const db = await database.init();
    if (!db) return false;

    const actualProgress = progress !== undefined ? progress : (tree.currentProgress ?? 1.0);
    const now = Date.now();

    try {
      await db.execute(
        `INSERT INTO archive_trees (
          id, original_tree_id, generation, parent_tree_id,
          planted_at, completed_at, leaf_type, trunk_color,
          leaf_color, dna_seed, archived_at, nfc_uid, thumbnail_data,
          progress, growth_duration, branch_angle, length_factor,
          thickness_decay, init_thickness, tree_variation, max_depth
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          `archive-${tree.id}-${now}`,
          tree.id,
          tree.generation,
          tree.parentTreeId || null,
          tree.plantedAt,
          now,
          tree.genetics.leafType,
          tree.genetics.trunkColor,
          String(tree.genetics.paletteIndex ?? 11),
          tree.genetics.dnaSeed,
          now,
          tree.nfcUid || null,
          tree.thumbnailData || null,
          actualProgress,
          tree.growthDuration || null,
          tree.genetics.branchAngle ?? null,
          tree.genetics.lengthDecay ?? null,
          tree.genetics.thicknessDecay ?? null,
          tree.genetics.initThickness ?? null,
          tree.genetics.treeVariation ?? null,
          tree.genetics.maxDepth ?? null
        ]
      );

      // Đảm bảo đặc tính của cây lưu trữ được lưu trong Thư Viện
      try {
        await CompendiumRepository.recordTreeTraits(tree.genetics, tree.plantedAt);
      } catch (e) {}

      return true;
    } catch (err) {
      console.error('[GardenRepository] Lỗi khi lưu trữ cây:', err);
      return false;
    }
  }
}

export const gardenRepository = new GardenRepository();

