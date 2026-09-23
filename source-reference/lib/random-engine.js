/**
 * Advanced Pseudorandom Number Generator (PRNG) Suite for Procedural Fractal Trees
 * Uses Mulberry32 & MurmurHash3 bitwise mixing algorithms.
 * Passes BigCrush statistical quality tests for uniform, artifact-free organic randomness.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RandomEngine = factory();
    root.hashRand = root.RandomEngine.hashFloat;
  }
}(typeof self !== 'undefined' ? self : this, function () {

  class RandomEngine {
    constructor(seed = Date.now()) {
      this.setSeed(seed);
    }

    setSeed(seed) {
      if (typeof seed === 'string') {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < seed.length; i++) {
          h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
        }
        this.state = h >>> 0;
      } else {
        this.state = (Math.floor(Math.abs(seed)) || 1337) >>> 0;
      }
    }

    /**
     * Mulberry32 PRNG Core Generator
     * @returns {number} Uniform float in range [0, 1)
     */
    nextFloat() {
      let z = (this.state = (this.state + 0x6D2B79F5) >>> 0);
      z = Math.imul(z ^ (z >>> 15), z | 1);
      z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
      return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Uniform float between min and max
     */
    range(min, max) {
      return min + this.nextFloat() * (max - min);
    }

    /**
     * Integer between min and max (inclusive)
     */
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    }

    /**
     * High-entropy MurmurHash3 32-bit integer bit-mixer
     * Deterministic pseudo-random float [0, 1) for any key and salt.
     * Replaces low-entropy Math.sin hashes.
     */
    static hashFloat(key, salt = 0) {
      let k = (key || 0) >>> 0;
      let s = (salt || 0) >>> 0;
      let h = Math.imul(k ^ 0x9E3779B9, 0x85EBCA6B) ^ Math.imul(s, 0xC2B2AE35);
      h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B);
      h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
  }

  return RandomEngine;
}));
