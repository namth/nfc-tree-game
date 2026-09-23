/**
 * Compendium Repository for Botanical Encyclopedia CRUD operations
 * Project: Fractal Tree NFC Mobile Game
 * Specification: docs/features/botanical-compendium-library.md
 */

import { database } from '../database/Database';
import { TreeGenetics } from '../../types';
import { findTrunkTheme } from '../../config/GeneticsConfig';

export interface CompendiumEntry {
  id: number;
  traitType: 'leaf_variety' | 'leaf_type' | 'palette' | 'trunk';
  traitId: string;
  firstDiscoveredAt: number;
  timesEncountered: number;
  isViewed: boolean;
}

export interface CompendiumStats {
  totalDiscovered: number;
  totalTraits: number; // 14 loài lá * 12 màu sắc = 168 biến thể
  percent: number;
  hasUnviewedNew: boolean;
}

export class CompendiumRepository {
  // Bộ nhớ in-memory fallback cho môi trường test/mock không có native SQLite
  private static inMemoryEntries: Map<string, CompendiumEntry> = new Map();

  /**
   * Lấy toàn bộ danh sách đặc tính đã được khám phá
   */
  static async getAllEntries(): Promise<CompendiumEntry[]> {
    const db = await database.init();
    if (!db) {
      return Array.from(this.inMemoryEntries.values());
    }

    try {
      const result = await db.execute('SELECT * FROM compendium_entries ORDER BY first_discovered_at ASC;');
      const rows = result.rows?._array || [];
      return rows.map((r: any) => ({
        id: r.id,
        traitType: r.trait_type as 'leaf_variety' | 'leaf_type' | 'palette' | 'trunk',
        traitId: String(r.trait_id),
        firstDiscoveredAt: r.first_discovered_at,
        timesEncountered: r.times_encountered || 1,
        isViewed: r.is_viewed === 1
      }));
    } catch (err) {
      console.warn('[CompendiumRepository] Lỗi đọc compendium_entries:', err);
      return Array.from(this.inMemoryEntries.values());
    }
  }

  /**
   * Lấy Map tra cứu nhanh O(1) theo key: `${traitType}_${traitId}` và `${leafType}_${paletteIndex}`
   */
  static async getEntriesMap(): Promise<Record<string, CompendiumEntry>> {
    const entries = await this.getAllEntries();
    const map: Record<string, CompendiumEntry> = {};
    for (const item of entries) {
      map[`${item.traitType}_${item.traitId}`] = item;
      if (item.traitType === 'leaf_variety') {
        map[`variety_${item.traitId}`] = item;
        map[item.traitId] = item;
      }
      // Ánh xạ linh hoạt cho thân cây để hỗ trợ cả mã hex chuẩn và theme ID
      if (item.traitType === 'trunk') {
        const theme = findTrunkTheme(item.traitId);
        map[`trunk_${theme.color}`] = item;
        map[`trunk_${theme.id}`] = item;
      }
    }
    return map;
  }

  /**
   * Thống kê số lượng biến thể lá đã mở khóa (14 loài lá * 12 màu = 168 mục)
   */
  static async getStats(): Promise<CompendiumStats> {
    const entries = await this.getAllEntries();
    // Đếm các biến thể lá theo cặp (loài lá, màu sắc)
    const varietyEntries = entries.filter(e => e.traitType === 'leaf_variety');
    const totalTraits = 168; // 14 loài lá * 12 bảng màu
    const totalDiscovered = varietyEntries.length;
    const percent = Math.min(100, Math.round((totalDiscovered / totalTraits) * 100));
    const hasUnviewedNew = varietyEntries.some(e => !e.isViewed);

    return {
      totalDiscovered,
      totalTraits,
      percent,
      hasUnviewedNew
    };
  }

  /**
   * Ghi nhận các đặc tính di truyền của cây (biến thể lá, loài lá, màu sắc, thân) vào Thư Viện
   * Trả về danh sách đặc tính mới phát hiện lần đầu
   */
  static async recordTreeTraits(
    genetics: TreeGenetics,
    timestamp: number = Date.now(),
    markAsViewedImmediately: boolean = false
  ): Promise<{ isNewDiscovery: boolean; newTraits: string[] }> {
    const trunkTheme = findTrunkTheme(genetics.trunkColor);
    const varietyKey = `${genetics.leafType}_${genetics.paletteIndex}`;
    const traitsToRecord: Array<{ type: 'leaf_variety' | 'leaf_type' | 'palette' | 'trunk'; id: string }> = [
      { type: 'leaf_variety', id: varietyKey },
      { type: 'leaf_type', id: String(genetics.leafType) },
      { type: 'palette', id: String(genetics.paletteIndex) },
      { type: 'trunk', id: trunkTheme.color }
    ];

    const db = await database.init();
    const newTraits: string[] = [];
    const isViewedVal = markAsViewedImmediately ? 1 : 0;

    for (const trait of traitsToRecord) {
      const key = `${trait.type}_${trait.id}`;

      if (!db) {
        // Fallback in-memory
        if (!this.inMemoryEntries.has(key)) {
          this.inMemoryEntries.set(key, {
            id: this.inMemoryEntries.size + 1,
            traitType: trait.type,
            traitId: trait.id,
            firstDiscoveredAt: timestamp,
            timesEncountered: 1,
            isViewed: markAsViewedImmediately
          });
          newTraits.push(key);
        } else {
          const existing = this.inMemoryEntries.get(key)!;
          existing.timesEncountered += 1;
        }
        continue;
      }

      try {
        const checkResult = await db.execute(
          'SELECT id, times_encountered FROM compendium_entries WHERE trait_type = ? AND trait_id = ? LIMIT 1;',
          [trait.type, trait.id]
        );
        const existingRow = checkResult.rows?._array?.[0];

        if (!existingRow) {
          await db.execute(
            `INSERT INTO compendium_entries (trait_type, trait_id, first_discovered_at, times_encountered, is_viewed)
             VALUES (?, ?, ?, 1, ?);`,
            [trait.type, trait.id, timestamp, isViewedVal]
          );
          newTraits.push(key);
        } else {
          await db.execute(
            'UPDATE compendium_entries SET times_encountered = times_encountered + 1 WHERE id = ?;',
            [existingRow.id]
          );
        }
      } catch (err) {
        console.warn('[CompendiumRepository] Lỗi ghi nhận đặc tính:', trait, err);
      }
    }

    return {
      isNewDiscovery: newTraits.length > 0,
      newTraits
    };
  }

  /**
   * Đánh dấu tất cả các mục trong Thư Viện là đã xem (tắt chấm đỏ notification dot)
   */
  static async markAllAsViewed(): Promise<void> {
    const db = await database.init();
    if (!db) {
      for (const entry of this.inMemoryEntries.values()) {
        entry.isViewed = true;
      }
      return;
    }

    try {
      await db.execute('UPDATE compendium_entries SET is_viewed = 1 WHERE is_viewed = 0;');
    } catch (err) {
      console.warn('[CompendiumRepository] Lỗi markAllAsViewed:', err);
    }
  }

  /**
   * Tự động quét và đồng bộ các đặc tính từ các cây hiện có trong Vườn và Nhà Kính
   * (Chạy một lần khi khởi động ứng dụng để nạp các cây đã trồng trước khi có tính năng Thư Viện)
   */
  static async syncFromExistingTrees(): Promise<void> {
    const db = await database.init();
    if (!db) return;

    try {
      // 1. Quét từ garden_trees
      const gardenRes = await db.execute(
        'SELECT leaf_type, leaf_color, trunk_color, planted_at FROM garden_trees;'
      );
      const gardenRows = gardenRes.rows?._array || [];

      // 2. Quét từ archive_trees
      const archiveRes = await db.execute(
        'SELECT leaf_type, leaf_color, trunk_color, planted_at FROM archive_trees;'
      );
      const archiveRows = archiveRes.rows?._array || [];

      const allRows = [...gardenRows, ...archiveRows];

      for (const r of allRows) {
        let paletteVal = 11;
        if (r.leaf_color !== null && r.leaf_color !== undefined) {
          const parsed = parseInt(String(r.leaf_color), 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 11) {
            paletteVal = parsed;
          }
        }

        const trunkTheme = findTrunkTheme(r.trunk_color);

        const genetics: TreeGenetics = {
          leafType: r.leaf_type,
          paletteIndex: paletteVal,
          trunkColor: trunkTheme.color,
          branchAngle: 20,
          lengthDecay: 0.75,
          thicknessDecay: 0.55,
          maxDepth: 9,
          dnaSeed: 0
        };

        // Ghi nhận đồng bộ với cờ isViewed = true để không hiện chấm đỏ spam
        await this.recordTreeTraits(genetics, r.planted_at || Date.now(), true);
      }
    } catch (err) {
      console.warn('[CompendiumRepository] Lỗi syncFromExistingTrees:', err);
    }
  }
}
