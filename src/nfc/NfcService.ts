/**
 * NFC Hardware Communication Service
 * Project: Fractal Tree NFC Mobile Game
 * Specification: docs/05-architecture.md & docs/07-api-contracts.md
 */

import { Platform } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { BinaryCodec, PAYLOAD_SIZE, NFC_MAGIC_BYTES } from './protocol/BinaryCodec';
import { Crc16 } from './protocol/Crc16';
import { TreeModel, SeedModel, NfcTagPayload } from '../types';
import { zenAudioService } from '../services/ZenAudioService';

export class NfcService {
  private static instance: NfcService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NfcService {
    if (!NfcService.instance) {
      NfcService.instance = new NfcService();
    }
    return NfcService.instance;
  }

  /**
   * Khởi tạo NFC Manager
   */
  async init(): Promise<boolean> {
    if (this.isInitialized) return true;
    try {
      await NfcManager.start();
      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn('[NFC] Thiết bị không hỗ trợ hoặc chưa bật NFC:', err);
      return false;
    }
  }

  /**
   * Kiểm tra phần cứng NFC có khả dụng và đã bật không
   */
  async isNfcAvailable(): Promise<{ supported: boolean; enabled: boolean }> {
    const supported = await NfcManager.isSupported();
    let enabled = false;
    if (supported) {
      enabled = await NfcManager.isEnabled();
    }
    return { supported, enabled };
  }

  /**
   * Đọc 1 chunk 16 Bytes (4 trang) từ vị trí startPage
   */
  private async readPagesChunk(startPage: number): Promise<number[]> {
    if (Platform.OS === 'android') {
      try {
        const res = await NfcManager.mifareUltralightHandlerAndroid.mifareUltralightReadPages(startPage);
        return Array.from(res);
      } catch {
        // Fallback đọc qua transceive chuẩn NfcA (Lệnh READ 0x30)
        const res = await NfcManager.nfcAHandler.transceive([0x30, startPage]);
        return Array.from(res);
      }
    } else {
      // iOS NTAG transceive command: [0x30, startPage] (READ 4 pages = 16B)
      const res = await NfcManager.sendMifareCommandIOS([0x30, startPage]);
      return Array.from(res);
    }
  }

  /**
   * Ghi 1 trang (4 Bytes) vào trang chỉ định (NTAG WRITE command 0xA2)
   */
  private async writeSinglePage(page: number, bytes4: number[]): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await NfcManager.mifareUltralightHandlerAndroid.mifareUltralightWritePage(page, bytes4);
      } catch {
        // Fallback ghi qua transceive chuẩn NfcA (Lệnh WRITE 0xA2)
        await NfcManager.nfcAHandler.transceive([0xa2, page, ...bytes4]);
      }
    } else {
      // iOS WRITE command: [0xA2, page, b0, b1, b2, b3]
      await NfcManager.sendMifareCommandIOS([0xa2, page, ...bytes4]);
    }
  }

  /**
   * Xác định trang người dùng tối đa dựa vào Capability Container (CC byte 14)
   * NTAG213: Page 39 (144B user memory)
   * NTAG215: Page 129 (504B user memory)
   * NTAG216: Page 225 (888B user memory)
   */
  private async getMaxUserPage(): Promise<number> {
    try {
      const headerChunk = await this.readPagesChunk(0);
      if (headerChunk && headerChunk.length >= 16) {
        // Byte 14 là MLEN (Memory Length / 8) trong trang CC (Page 3)
        const mlen = headerChunk[14];
        if (mlen === 0x12) return 39;  // NTAG213: 144B
        if (mlen === 0x3e) return 129; // NTAG215: 504B
        if (mlen === 0x6d) return 225; // NTAG216: 888B
      }
    } catch (e) {
      // Không đọc được CC, dùng mặc định an toàn cho NTAG213
    }
    return 39;
  }

  /**
   * Quét và đọc 64 Bytes dữ liệu từ thẻ NFC (Hỗ trợ cả Web NFC NDEF và Mifare Raw Pages)
   * @param keepSessionAlive Nếu true, giữ nguyên kết nối phần cứng để tiếp tục ghi dữ liệu ngay sau đó
   */
  async scanAndReadTag(keepSessionAlive = false): Promise<{ payload: NfcTagPayload; nfcUid: string; rawBytes: Uint8Array } | null> {
    await this.init();
    // Giải phóng phiên cũ nếu còn dở dang
    await this.cancelScan();

    let sessionKept = false;
    try {
      // Yêu cầu công nghệ thẻ có timeout bảo vệ 20s
      await Promise.race([
        NfcManager.requestTechnology([NfcTech.NfcA, NfcTech.MifareUltralight]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('NFC scan timed out')), 20000))
      ]);

      const tag = await NfcManager.getTag();
      const nfcUid = tag?.id || `tag-${Date.now()}`;
      // Phát âm thanh chuông gió Zen chào đón khi chạm thẻ thành công
      zenAudioService.playChime().catch(() => {});

      // =========================================================================
      // CÁCH 1: KIỂM TRA BẢN GHI NDEF (NẾU THẺ GHI TỪ WEB NFC TRÌNH DUYỆT CHROME)
      // =========================================================================
      if (tag?.ndefMessage && Array.isArray(tag.ndefMessage)) {
        for (const record of tag.ndefMessage) {
          const recPayload = record.payload;
          if (recPayload && recPayload.length >= PAYLOAD_SIZE) {
            const uint8 = new Uint8Array(recPayload);
            for (let offset = 0; offset <= uint8.length - PAYLOAD_SIZE; offset++) {
              const magic = (uint8[offset] << 8) | uint8[offset + 1];
              if (magic === NFC_MAGIC_BYTES) {
                const candidate = uint8.slice(offset, offset + PAYLOAD_SIZE);
                if (Crc16.verify(candidate)) {
                  const { payload } = BinaryCodec.decodePayload(candidate);
                  if (keepSessionAlive) sessionKept = true;
                  return { payload, nfcUid, rawBytes: candidate };
                }
              }
            }
          }
        }
      }

      // =========================================================================
      // CÁCH 2: ĐỌC THÔ TỪNG TRANG MIFARE ULTRALIGHT (PAGE 4 ĐẾN PAGE 27 = 96 BYTES)
      // =========================================================================
      const totalChunks = 6; // 6 chunk * 16B = 96 Bytes
      const rawBuffer = new Uint8Array(totalChunks * 16);
      let bytesRead = 0;

      for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        const startPage = 4 + chunkIdx * 4;
        let chunk: number[] = [];

        try {
          chunk = await this.readPagesChunk(startPage);
        } catch (readErr) {
          // Dừng lại nếu đã chạm giới hạn bộ nhớ của chip
          break;
        }

        if (chunk && chunk.length >= 16) {
          rawBuffer.set(chunk.slice(0, 16), chunkIdx * 16);
          bytesRead += 16;
        }
      }

      // Quét tìm chữ ký 0x5452 ('TR') kèm Checksum CRC-16 thỏa mãn
      let finalBytes: Uint8Array | null = null;
      if (bytesRead >= PAYLOAD_SIZE) {
        for (let offset = 0; offset <= bytesRead - PAYLOAD_SIZE; offset++) {
          const magic = (rawBuffer[offset] << 8) | rawBuffer[offset + 1];
          if (magic === NFC_MAGIC_BYTES) {
            const candidate = rawBuffer.slice(offset, offset + PAYLOAD_SIZE);
            if (Crc16.verify(candidate)) {
              finalBytes = candidate;
              break;
            }
          }
        }
      }

      // Nếu tìm thấy chữ ký hợp lệ ở bất kỳ offset nào (kể cả khi bị NDEF header đẩy lùi)
      if (finalBytes) {
        const { payload } = BinaryCodec.decodePayload(finalBytes);
        if (keepSessionAlive) sessionKept = true;
        return { payload, nfcUid, rawBytes: finalBytes };
      }

      // Nếu không tìm thấy, trả về 64 bytes đầu tiên từ Page 4 để nhận diện thẻ trắng
      const fallbackBytes = rawBuffer.slice(0, PAYLOAD_SIZE);
      const { payload, isValidCrc } = BinaryCodec.decodePayload(fallbackBytes);
      if (!isValidCrc) {
        console.warn('[NFC] Cảnh báo: Checksum CRC-16 không khớp, có thể thẻ trắng hoặc ghi dở dang');
      }

      if (keepSessionAlive) sessionKept = true;
      return { payload, nfcUid, rawBytes: fallbackBytes };
    } catch (err: any) {
      const isCancelled =
        err?.message?.toLowerCase().includes('cancel') ||
        err?.name === 'UserCancel' ||
        err?.toString().toLowerCase().includes('cancel');
      if (!isCancelled) {
        console.error('[NFC] Lỗi trong phiên quét thẻ:', err);
      }
      return null;
    } finally {
      // Chỉ giải phóng phiên quét nếu không yêu cầu giữ kết nối hoặc phiên quét gặp lỗi
      if (!sessionKept) {
        await this.cancelScan();
      }
    }
  }

  /**
   * Ghi 64 Bytes trực tiếp vào thẻ NFC đang kết nối trong phiên hiện tại (không request technology lại)
   */
  async writeConnectedTag(data64Bytes: Uint8Array, wipeTrailingPages: boolean = true): Promise<boolean> {
    if (data64Bytes.length !== PAYLOAD_SIZE) {
      throw new Error(`Kích thước dữ liệu phải đúng 64 Bytes (Hiện tại: ${data64Bytes.length}B)`);
    }

    try {
      // 1. Xác định giới hạn vùng nhớ người dùng an toàn
      const maxUserPage = await this.getMaxUserPage();

      // 2. NTAG ghi 64 Bytes theo từng trang 4 bytes (tổng cộng 16 trang từ Page 4..19)
      for (let i = 0; i < 16; i++) {
        const page = 4 + i;
        const pageBytes = Array.from(data64Bytes.slice(i * 4, i * 4 + 4));
        await this.writeSinglePage(page, pageBytes);
      }

      // 3. Reset toàn bộ vùng nhớ người dùng còn lại về 0x00 (từ Page 20 đến maxUserPage)
      if (wipeTrailingPages && maxUserPage >= 20) {
        const zeroPage = [0x00, 0x00, 0x00, 0x00];
        for (let page = 20; page <= maxUserPage; page++) {
          try {
            await this.writeSinglePage(page, zeroPage);
          } catch (wipeErr) {
            console.warn(`[NFC] Dừng xóa trang ${page}:`, wipeErr);
            break;
          }
        }
      }

      // Phát chuông gió Zen báo hiệu ghi hạt giống / dữ liệu thẻ thành công
      zenAudioService.playChime().catch(() => {});
      return true;
    } catch (err) {
      console.error('[NFC] Lỗi khi ghi trực tiếp thẻ đang kết nối:', err);
      return false;
    }
  }

  /**
   * Ghi 64 Bytes vào thẻ NTAG (bắt đầu từ Page 4) và reset sạch toàn bộ dữ liệu cũ phía sau
   */
  async writePayload(data64Bytes: Uint8Array, wipeTrailingPages: boolean = true): Promise<boolean> {
    if (data64Bytes.length !== PAYLOAD_SIZE) {
      throw new Error(`Kích thước dữ liệu phải đúng 64 Bytes (Hiện tại: ${data64Bytes.length}B)`);
    }

    await this.init();
    // Luôn hủy phiên quét cũ nếu còn treo dở trước khi yêu cầu mới
    await this.cancelScan();

    try {
      await Promise.race([
        NfcManager.requestTechnology([NfcTech.NfcA, NfcTech.MifareUltralight]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('NFC write request timed out')), 20000))
      ]);

      return await this.writeConnectedTag(data64Bytes, wipeTrailingPages);
    } catch (err: any) {
      const isCancelled =
        err?.message?.toLowerCase().includes('cancel') ||
        err?.name === 'UserCancel' ||
        err?.toString().toLowerCase().includes('cancel');
      if (!isCancelled) {
        console.error('[NFC] Lỗi khi ghi thẻ:', err);
      }
      return false;
    } finally {
      await this.cancelScan();
    }
  }

  /**
   * Reset / Xóa trắng toàn bộ vùng nhớ người dùng trên thẻ NFC về 0x00 (từ Page 4 trở đi)
   */
  async wipeTag(): Promise<boolean> {
    await this.init();
    await this.cancelScan();

    try {
      await Promise.race([
        NfcManager.requestTechnology([NfcTech.NfcA, NfcTech.MifareUltralight]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('NFC wipe request timed out')), 20000))
      ]);
      const maxUserPage = await this.getMaxUserPage();
      const zeroPage = [0x00, 0x00, 0x00, 0x00];

      for (let page = 4; page <= maxUserPage; page++) {
        try {
          await this.writeSinglePage(page, zeroPage);
        } catch (wipeErr) {
          console.warn(`[NFC] Dừng wipe thẻ ở trang ${page}:`, wipeErr);
          break;
        }
      }
      return true;
    } catch (err: any) {
      const isCancelled =
        err?.message?.toLowerCase().includes('cancel') ||
        err?.name === 'UserCancel' ||
        err?.toString().toLowerCase().includes('cancel');
      if (!isCancelled) {
        console.error('[NFC] Lỗi khi wipe toàn bộ thẻ:', err);
      }
      return false;
    } finally {
      await this.cancelScan();
    }
  }

  /**
   * Gieo mầm: Ghi thông tin mầm cây mới vào thẻ và reset sạch dữ liệu cũ
   */
  async plantSeedOnTag(tree: TreeModel): Promise<boolean> {
    const bytes = BinaryCodec.encodeTree(tree);
    return this.writePayload(bytes, true);
  }

  /**
   * Gieo mầm trực tiếp lên thẻ đang kết nối
   */
  async plantSeedOnConnectedTag(tree: TreeModel): Promise<boolean> {
    const bytes = BinaryCodec.encodeTree(tree);
    return this.writeConnectedTag(bytes, true);
  }

  /**
   * Ghi hạt giống mới F1/F2 vào thẻ mục tiêu và reset sạch dữ liệu cũ
   */
  async writeNewSeedToTag(seed: SeedModel): Promise<boolean> {
    const bytes = BinaryCodec.encodeSeed(seed);
    return this.writePayload(bytes, true);
  }

  /**
   * Ghi hạt giống trực tiếp lên thẻ đang kết nối
   */
  async writeSeedOnConnectedTag(seed: SeedModel): Promise<boolean> {
    const bytes = BinaryCodec.encodeSeed(seed);
    return this.writeConnectedTag(bytes, true);
  }

  /**
   * Hủy phiên quét thẻ đang chờ
   */
  async cancelScan(): Promise<void> {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {
      // Bỏ qua lỗi nếu phiên quét đã kết thúc trước đó
    }
  }
}

export const nfcService = NfcService.getInstance();
