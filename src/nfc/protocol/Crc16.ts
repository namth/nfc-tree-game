/**
 * CRC-16-CCITT Checksum Implementation
 * Project: Fractal Tree NFC Mobile Game
 * Specification: docs/05-architecture.md
 * Polynomial: 0x1021, Initial: 0xFFFF
 */

export class Crc16 {
  /**
   * Tính toán mã kiểm tra CRC-16-CCITT cho một mảng byte
   * @param buffer Mảng dữ liệu Uint8Array
   * @param length Số byte cần tính (mặc định là toàn bộ mảng)
   * @returns Số nguyên 16-bit không dấu (0x0000 - 0xFFFF)
   */
  static compute(buffer: Uint8Array, length: number = buffer.length): number {
    let crc = 0xffff;
    const len = Math.min(length, buffer.length);

    for (let i = 0; i < len; i++) {
      crc ^= buffer[i] << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }

    return crc;
  }

  /**
   * Xác thực tính toàn vẹn của khối 64 Bytes NFC
   * Kiểm tra 62 byte dữ liệu đầu tiên so với checksum 2 byte ở cuối (Offset 62-63)
   */
  static verify(buffer: Uint8Array): boolean {
    if (!buffer || buffer.length < 64) {
      return false;
    }

    const computedCrc = Crc16.compute(buffer, 62);
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const expectedCrc = view.getUint16(62, false); // Big-Endian

    return computedCrc === expectedCrc;
  }
}
