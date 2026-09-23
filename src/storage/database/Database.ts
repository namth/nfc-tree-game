/**
 * Local SQLite Database Setup using @op-engineering/op-sqlite
 * Project: Fractal Tree NFC Mobile Game
 * Specification: docs/06-database-schema.md
 */

import { open, DB } from '@op-engineering/op-sqlite';

export const DB_NAME = 'TreeNFCGame.sqlite';

export class Database {
  private static instance: Database;
  private db: DB | null = null;
  private isInitialized = false;
  private initPromise: Promise<DB | null> | null = null;

  private constructor() {
    const globalRef = globalThis as any;
    if (globalRef.__opSqlite_TreeNFCGame) {
      this.db = globalRef.__opSqlite_TreeNFCGame;
    }
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Mở kết nối và khởi tạo CSDL SQLite cục bộ (An toàn với Concurrent Calls & Fast Refresh)
   */
  async init(): Promise<DB | null> {
    const globalRef = globalThis as any;

    if (this.isInitialized && this.db) {
      return this.db;
    }

    if (globalRef.__opSqlite_TreeNFCGame) {
      this.db = globalRef.__opSqlite_TreeNFCGame;
      if (!this.isInitialized) {
        try {
          await this.runMigrations();
          this.isInitialized = true;
        } catch (migErr) {
          console.warn('[Database] Lỗi khi chạy migration với kết nối tái sử dụng:', migErr);
        }
      }
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        if (!this.db) {
          try {
            this.db = open({ name: DB_NAME });
            globalRef.__opSqlite_TreeNFCGame = this.db;
          } catch (openErr: any) {
            if (
              openErr?.message?.includes('You can only have one JS connection per database') &&
              globalRef.__opSqlite_TreeNFCGame
            ) {
              this.db = globalRef.__opSqlite_TreeNFCGame;
            } else {
              throw openErr;
            }
          }
        }

        if (this.db && !this.isInitialized) {
          await this.runMigrations();
          this.isInitialized = true;
        }

        return this.db;
      } catch (err: any) {
        if (
          err?.message?.includes('You can only have one JS connection per database') &&
          globalRef.__opSqlite_TreeNFCGame
        ) {
          this.db = globalRef.__opSqlite_TreeNFCGame;
          return this.db;
        }
        console.warn('[Database] Chạy trong môi trường không hỗ trợ OP-SQLite native:', err);
        return this.db || null;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Tạo bảng theo DDL chuẩn docs/06-database-schema.md
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) return;

    // 1. Bảng garden_trees
    this.db.execute(`
      CREATE TABLE IF NOT EXISTS garden_trees (
        id TEXT PRIMARY KEY,
        nfc_uid TEXT NOT NULL,
        generation INTEGER NOT NULL DEFAULT 0,
        parent_tree_id TEXT DEFAULT NULL,
        planted_at INTEGER NOT NULL,
        growth_duration INTEGER NOT NULL,
        max_depth INTEGER NOT NULL DEFAULT 9,
        branch_angle REAL NOT NULL,
        length_factor REAL NOT NULL,
        leaf_type INTEGER NOT NULL,
        trunk_color TEXT NOT NULL,
        leaf_color TEXT NOT NULL,
        dna_seed INTEGER NOT NULL,
        current_progress REAL NOT NULL DEFAULT 0,
        has_seed_ready INTEGER NOT NULL DEFAULT 0,
        last_synced_at INTEGER NOT NULL,
        last_viewed_at INTEGER DEFAULT NULL,
        thumbnail_data TEXT DEFAULT NULL
      );
    `);

    // Migration an toàn cho các DB đã tạo trước đó
    try {
      this.db.execute('ALTER TABLE garden_trees ADD COLUMN last_viewed_at INTEGER DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE garden_trees ADD COLUMN thumbnail_data TEXT DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE garden_trees ADD COLUMN tree_variation REAL DEFAULT 0.80;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE garden_trees ADD COLUMN thickness_decay REAL DEFAULT 0.55;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE garden_trees ADD COLUMN init_thickness REAL DEFAULT 36.0;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE garden_trees ADD COLUMN last_harvested_at INTEGER DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE garden_trees ADD COLUMN seed_spawned_at INTEGER DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE garden_trees ADD COLUMN seed_genetics TEXT DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    // 2. Bảng archive_trees
    this.db.execute(`
      CREATE TABLE IF NOT EXISTS archive_trees (
        id TEXT PRIMARY KEY,
        original_tree_id TEXT NOT NULL,
        generation INTEGER NOT NULL DEFAULT 0,
        parent_tree_id TEXT DEFAULT NULL,
        planted_at INTEGER NOT NULL,
        completed_at INTEGER NOT NULL,
        leaf_type INTEGER NOT NULL,
        trunk_color TEXT NOT NULL,
        leaf_color TEXT NOT NULL,
        dna_seed INTEGER NOT NULL,
        archived_at INTEGER NOT NULL,
        snapshot_thumbnail_uri TEXT,
        nfc_uid TEXT DEFAULT NULL,
        thumbnail_data TEXT DEFAULT NULL,
        progress REAL DEFAULT 1.0,
        growth_duration INTEGER DEFAULT NULL,
        branch_angle REAL DEFAULT NULL,
        length_factor REAL DEFAULT NULL,
        thickness_decay REAL DEFAULT NULL,
        init_thickness REAL DEFAULT NULL,
        tree_variation REAL DEFAULT NULL,
        max_depth INTEGER DEFAULT NULL
      );
    `);

    try {
      this.db.execute('ALTER TABLE archive_trees ADD COLUMN nfc_uid TEXT DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE archive_trees ADD COLUMN thumbnail_data TEXT DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE archive_trees ADD COLUMN progress REAL DEFAULT 1.0;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE archive_trees ADD COLUMN growth_duration INTEGER DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE archive_trees ADD COLUMN branch_angle REAL DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE archive_trees ADD COLUMN length_factor REAL DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE archive_trees ADD COLUMN thickness_decay REAL DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE archive_trees ADD COLUMN init_thickness REAL DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE archive_trees ADD COLUMN tree_variation REAL DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    try {
      this.db.execute('ALTER TABLE archive_trees ADD COLUMN max_depth INTEGER DEFAULT NULL;');
    } catch {
      // Bỏ qua nếu cột đã tồn tại
    }

    // 3. Bảng compendium_entries (Bách Thảo Thư Viện)
    this.db.execute(`
      CREATE TABLE IF NOT EXISTS compendium_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trait_type TEXT NOT NULL,
        trait_id TEXT NOT NULL,
        first_discovered_at INTEGER NOT NULL,
        times_encountered INTEGER DEFAULT 1,
        is_viewed INTEGER DEFAULT 0,
        UNIQUE(trait_type, trait_id)
      );
    `);
    this.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_compendium_lookup ON compendium_entries (trait_type, trait_id);
    `);
  }

  getDb(): DB | null {
    return this.db;
  }
}

export const database = Database.getInstance();
