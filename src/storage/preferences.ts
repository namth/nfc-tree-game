/**
 * User Preferences Storage with MMKV & In-Memory Fallback
 * Project: Fractal Tree NFC Mobile Game
 */

import { MMKV } from 'react-native-mmkv';

export type AppThemeMode = 'dark' | 'light';
export type AppLanguage = 'vi' | 'en';

let mmkvInstance: MMKV | null = null;
const memoryStore = new Map<string, any>();

try {
  mmkvInstance = new MMKV({ id: 'treenfc-user-prefs' });
} catch (e) {
  console.warn('[Preferences] MMKV initialization error, using in-memory store:', e);
}

export const Preferences = {
  getString(key: string, defaultValue: string): string {
    try {
      if (mmkvInstance) {
        const val = mmkvInstance.getString(key);
        return val !== undefined ? val : defaultValue;
      }
    } catch (e) {
      // Fallback
    }
    return memoryStore.has(key) ? memoryStore.get(key) : defaultValue;
  },

  setString(key: string, value: string): void {
    try {
      if (mmkvInstance) {
        mmkvInstance.set(key, value);
      }
    } catch (e) {
      // Fallback
    }
    memoryStore.set(key, value);
  },

  getBoolean(key: string, defaultValue: boolean): boolean {
    try {
      if (mmkvInstance) {
        const val = mmkvInstance.getBoolean(key);
        return val !== undefined ? val : defaultValue;
      }
    } catch (e) {
      // Fallback
    }
    return memoryStore.has(key) ? memoryStore.get(key) : defaultValue;
  },

  setBoolean(key: string, value: boolean): void {
    try {
      if (mmkvInstance) {
        mmkvInstance.set(key, value);
      }
    } catch (e) {
      // Fallback
    }
    memoryStore.set(key, value);
  },

  getNumber(key: string, defaultValue: number): number {
    try {
      if (mmkvInstance) {
        const val = mmkvInstance.getNumber(key);
        return val !== undefined && !isNaN(val) ? val : defaultValue;
      }
    } catch (e) {
      // Fallback
    }
    return memoryStore.has(key) ? memoryStore.get(key) : defaultValue;
  },

  setNumber(key: string, value: number): void {
    try {
      if (mmkvInstance) {
        mmkvInstance.set(key, value);
      }
    } catch (e) {
      // Fallback
    }
    memoryStore.set(key, value);
  },

  // Language
  getLanguage(): AppLanguage {
    return this.getString('app_language', 'vi') as AppLanguage;
  },

  setLanguage(lang: AppLanguage): void {
    this.setString('app_language', lang);
  },

  // Theme
  getTheme(): AppThemeMode {
    return this.getString('app_theme', 'dark') as AppThemeMode;
  },

  setTheme(theme: AppThemeMode): void {
    this.setString('app_theme', theme);
  },

  // Graphics & Performance
  getEffectsEnabled(): boolean {
    return this.getBoolean('app_effects_enabled', true);
  },

  setEffectsEnabled(enabled: boolean): void {
    this.setBoolean('app_effects_enabled', enabled);
  },

  getTargetFps(): 24 | 30 | 45 | 60 {
    const fps = this.getNumber('app_target_fps', 60);
    if (fps === 24 || fps === 30 || fps === 45 || fps === 60) return fps;
    return 60;
  },

  setTargetFps(fps: 24 | 30 | 45 | 60): void {
    this.setNumber('app_target_fps', fps);
  }
};
