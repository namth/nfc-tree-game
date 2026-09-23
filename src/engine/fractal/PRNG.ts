/**
 * Mulberry32 PRNG & MurmurHash3
 * Deterministic Pseudo-Random Number Generator
 * Project: Fractal Tree NFC Mobile Game
 */

export class PRNG {
  private state: number;

  constructor(seed: number = 1337) {
    this.state = seed >>> 0;
  }

  /**
   * Sinh số float ngẫu nhiên trong khoảng [0.0, 1.0)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Sinh số float ngẫu nhiên trong khoảng [min, max)
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Chọn ngẫu nhiên một phần tử từ mảng
   */
  choice<T>(arr: T[]): T {
    const idx = Math.floor(this.range(0, arr.length));
    return arr[idx];
  }

  /**
   * MurmurHash3 32-bit cho chuỗi
   */
  static hashString(str: string, seed: number = 0): number {
    let h1 = seed >>> 0;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;

    for (let i = 0; i < str.length; i++) {
      let k1 = str.charCodeAt(i);
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);

      h1 ^= k1;
      h1 = (h1 << 13) | (h1 >>> 19);
      h1 = Math.imul(h1, 5) + 0xe6546b64;
    }

    h1 ^= str.length;
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0xc2b2ae35);
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
  }
}
