/**
 * Binary Codec for 64-Bytes NFC Tag Protocol V1
 * Project: Fractal Tree NFC Mobile Game
 * Specification: docs/05-architecture.md
 */

import { Crc16 } from './Crc16';
import { LeafType, LeafPalette, TreeModel, SeedModel, NfcTagPayload } from '../../types';
import { findClosestLeafPalette, GITHUB_LEAF_PALETTES } from '../../engine/fractal/LeafPalettes';
import { getGrowthDurationForGenetics } from '../../config/GeneticsConfig';

export const NFC_MAGIC_BYTES = 0x5452; // 'TR' in ASCII
export const PROTOCOL_VERSION = 0x01;
export const PAYLOAD_SIZE = 64;

export function hexToRgb565(hex: string): number {
  if (!hex) return 0x07e0; // Default green
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return ((r & 0xf8) << 8) | ((g & 0xfc) << 3) | (b >> 3);
}

export function rgb565ToHex(rgb565: number): string {
  const r = (rgb565 >> 11) & 0x1f;
  const g = (rgb565 >> 5) & 0x3f;
  const b = rgb565 & 0x1f;
  const r8 = Math.round((r * 255) / 31);
  const g8 = Math.round((g * 255) / 63);
  const b8 = Math.round((b * 255) / 31);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r8)}${toHex(g8)}${toHex(b8)}`;
}

export function rgb565ToRgb(rgb565: number): [number, number, number] {
  const r = (rgb565 >> 11) & 0x1f;
  const g = (rgb565 >> 5) & 0x3f;
  const b = rgb565 & 0x1f;
  return [
    Math.round((r * 255) / 31),
    Math.round((g * 255) / 63),
    Math.round((b * 255) / 31)
  ];
}

export class BinaryCodec {
  /**
   * Đóng gói thông tin cây thành mảng nhị phân đúng 64 Bytes
   */
  static encodeTree(tree: TreeModel): Uint8Array {
    const buffer = new ArrayBuffer(PAYLOAD_SIZE);
    const view = new DataView(buffer);
    const uint8 = new Uint8Array(buffer);

    // 0-1: Magic 'TR' (0x5452)
    view.setUint16(0, NFC_MAGIC_BYTES, false);

    // 2: Protocol Version 0x01
    view.setUint8(2, PROTOCOL_VERSION);

    // 3: Flags
    let flags = 0;
    // Bit 0: 0=Hạt chưa gieo, 1=Đã gieo mầm
    if (tree.plantedAt > 0) flags |= 0x01;
    // Bit 1: 1=Đã kết hạt mới
    if (tree.hasSeedReady) flags |= 0x02;
    view.setUint8(3, flags);

    // 4-7: Tree ID (numeric hash or parsed int)
    const numericId = parseInt(tree.id.replace(/[^0-9]/g, '').slice(0, 9), 10) || 1;
    view.setUint32(4, numericId, false);

    // 8-15: Planted At (epoch ms)
    view.setBigUint64(8, BigInt(tree.plantedAt || 0), false);

    // 16-19: Growth Duration (seconds)
    view.setUint32(16, tree.growthDuration, false);

    // 20: Leaf Type (0..13)
    view.setUint8(20, (tree.genetics.leafType ?? LeafType.POINTED) & 0xff);

    // 21: Branch Angle (value / 2 = degrees)
    view.setUint8(21, Math.min(255, Math.round((tree.genetics.branchAngle ?? 20) * 2)));

    // 22: Length Decay (value / 255 = 0.0 .. 1.0)
    view.setUint8(22, Math.min(255, Math.round((tree.genetics.lengthDecay ?? 0.75) * 255)));

    // 23: Max Depth (8..12)
    view.setUint8(23, Math.min(12, Math.max(8, tree.genetics.maxDepth ?? 9)));

    // 24-25: Trunk Color RGB565
    view.setUint16(24, hexToRgb565(tree.genetics.trunkColor || '#2d2219'), false);

    // 26-27: Leaf Color RGB565
    const paletteHex = GITHUB_LEAF_PALETTES[tree.genetics.paletteIndex]?.[0]?.hex || '#34d399';
    view.setUint16(26, hexToRgb565(paletteHex), false);

    // 28-31: DNA Seed
    view.setUint32(28, tree.genetics.dnaSeed >>> 0, false);

    // 32: Generation (0 = P, 1 = F1...)
    view.setUint8(32, tree.generation & 0xff);

    // 33-36: Parent Tree ID
    const parentIdNum = tree.parentTreeId !== undefined && tree.parentTreeId !== null
      ? (typeof tree.parentTreeId === 'number'
          ? tree.parentTreeId
          : parseInt(String(tree.parentTreeId).replace(/[^0-9]/g, '').slice(0, 9), 10) || 0)
      : 0;
    view.setUint32(33, parentIdNum, false);

    // 37: Tree Variation (value * 100 -> 0..255, default 80 = 0.80)
    const variationVal = Math.min(255, Math.max(0, Math.round((tree.genetics.treeVariation ?? 0.80) * 100)));
    view.setUint8(37, variationVal);

    // 38: Thickness Decay (value * 255 -> 0..255, default 140 = ~0.55)
    const thickDecayVal = Math.min(255, Math.max(0, Math.round((tree.genetics.thicknessDecay ?? 0.55) * 255)));
    view.setUint8(38, thickDecayVal);

    // 39: Init Thickness (10..120px, default 36)
    const initThickVal = Math.min(120, Math.max(10, Math.round(tree.genetics.initThickness ?? 36)));
    view.setUint8(39, initThickVal);

    // 40-61: Reserved bytes (22 bytes 0x00)
    for (let i = 40; i < 62; i++) {
      view.setUint8(i, 0x00);
    }

    // 62-63: CRC-16 Checksum
    const checksum = Crc16.compute(uint8, 62);
    view.setUint16(62, checksum, false);

    return uint8;
  }

  /**
   * Đóng gói hạt giống thành mảng nhị phân đúng 64 Bytes
   */
  static encodeSeed(seed: SeedModel): Uint8Array {
    const seedTree: TreeModel = {
      id: seed.id,
      nfcUid: '',
      generation: seed.generation,
      parentTreeId: seed.parentTreeId,
      genetics: seed.genetics,
      plantedAt: 0, // 0 biểu thị hạt chưa gieo mầm
      growthDuration: seed.growthDuration,
      currentProgress: 0,
      hasSeedReady: false,
      isArchived: false,
      lastSyncedAt: Date.now()
    };
    return this.encodeTree(seedTree);
  }

  /**
   * Giải mã mảng 64 Bytes từ chip NFC
   */
  static decodePayload(bytes: Uint8Array): { payload: NfcTagPayload; isValidCrc: boolean } {
    if (!bytes || bytes.length < PAYLOAD_SIZE) {
      throw new Error(`Dữ liệu không đủ 64 Bytes (Nhận được: ${bytes ? bytes.length : 0}B)`);
    }

    const isValidCrc = Crc16.verify(bytes);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    const magic = view.getUint16(0, false);
    const version = view.getUint8(2);
    const flagByte = view.getUint8(3);
    const dnaSeed = view.getUint32(28, false);
    const leafTypeVal = view.getUint8(20);
    const branchAngleVal = view.getUint8(21) / 2.0;
    const lengthDecayVal = view.getUint8(22) / 255.0;
    const rawDepth = view.getUint8(23);
    const maxDepth = Math.min(12, Math.max(8, rawDepth || 9));
    const trunkColor565 = view.getUint16(24, false);
    const leafColor565 = view.getUint16(26, false);
    const growthDurationSec = view.getUint32(16, false);
    const plantTimestamp = view.getBigUint64(8, false);
    const generation = view.getUint8(32);
    const parentTreeId = view.getUint32(33, false);

    // Bytes 37..39: Mở rộng bộ gen
    const rawVariation = view.getUint8(37);
    const treeVariationVal = rawVariation > 0 ? +(rawVariation / 100.0).toFixed(2) : 0.80;

    const rawThicknessDecay = view.getUint8(38);
    const thicknessDecayPct = rawThicknessDecay > 0 ? Math.round((rawThicknessDecay / 255.0) * 100) : 55;

    const rawInitThickness = view.getUint8(39);
    const initThicknessVal = rawInitThickness >= 10 ? rawInitThickness : 36;

    const checksum = view.getUint16(62, false);

    const [leafR, leafG, leafB] = rgb565ToRgb(leafColor565);
    const decodedPalette = findClosestLeafPalette(leafR, leafG, leafB);
    const trunkColorHex = rgb565ToHex(trunkColor565);

    const payload: NfcTagPayload = {
      magic,
      version,
      flags: {
        generation,
        isMature: (flagByte & 0x01) !== 0 && plantTimestamp > 0n,
        seedAvailable: (flagByte & 0x02) !== 0,
        isTampered: false
      },
      dnaSeed,
      leafType: leafTypeVal as LeafType,
      leafPalette: decodedPalette,
      trunkColorIndex: 0,
      trunkColorHex,
      flowerType: 0,
      growthDurationSec,
      plantTimestamp,
      lastWateredOffset: 0,
      healthScore: 100,
      branchAngle: branchAngleVal,
      lengthDecayPct: Math.round(lengthDecayVal * 100),
      thicknessDecayPct,
      maxDepth,
      generation,
      parentTreeId,
      treeVariation: treeVariationVal,
      treeVariationVal,
      thicknessDecay: +(thicknessDecayPct / 100).toFixed(2),
      initThickness: initThicknessVal,
      initThicknessVal,
      reserved: bytes.slice(40, 62),
      checksum
    };

    return { payload, isValidCrc };
  }

  /**
   * Chuyển đổi đối tượng NfcTagPayload thành TreeModel hoàn chỉnh
   */
  static payloadToTreeModel(payload: NfcTagPayload, nfcUid: string = ''): TreeModel {
    const isFreshSeed = !payload.plantTimestamp || payload.plantTimestamp === 0n;
    const now = Date.now();
    const plantTime = isFreshSeed ? now : Number(payload.plantTimestamp);

    const genetics = {
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

    return {
      id: `tree-${Date.now()}-${payload.dnaSeed % 10000}`,
      nfcUid,
      generation: payload.generation ?? payload.flags.generation ?? 0,
      parentTreeId: payload.parentTreeId ? String(payload.parentTreeId) : undefined,
      genetics,
      plantedAt: plantTime,
      growthDuration: (payload.growthDurationSec && payload.growthDurationSec > 0)
        ? payload.growthDurationSec
        : getGrowthDurationForGenetics(genetics),
      currentProgress: 0.01,
      hasSeedReady: payload.flags.seedAvailable,
      isArchived: false,
      lastSyncedAt: now,
      lastViewedAt: now
    };
  }
}
