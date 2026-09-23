/**
 * Zen Audio Service - Quản lý nhạc nền thiền định & hiệu ứng âm thanh
 * Project: Fractal Tree NFC Mobile Game
 * Hỗ trợ NativeModule Android (MediaPlayer) & iOS (AVAudioPlayer)
 */

import { NativeModules } from 'react-native';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'zen_audio_settings' });
const BGM_ENABLED_KEY = 'zen_bgm_enabled';
const BGM_VOLUME_KEY = 'zen_bgm_volume';
const CHIME_ENABLED_KEY = 'zen_chime_enabled';

const { ZenAudioModule } = NativeModules;

class ZenAudioService {
  private isEnabled: boolean = true;
  private isChimeEnabled: boolean = true;
  private volume: number = 0.5;
  private isInitialized: boolean = false;

  constructor() {
    // Mặc định bật nhạc nền Zen êm dịu
    const storedEnabled = storage.getBoolean(BGM_ENABLED_KEY);
    this.isEnabled = storedEnabled !== undefined ? storedEnabled : true;

    // Mặc định bật chuông gió Zen khi quét NFC
    const storedChime = storage.getBoolean(CHIME_ENABLED_KEY);
    this.isChimeEnabled = storedChime !== undefined ? storedChime : true;

    const storedVol = storage.getNumber(BGM_VOLUME_KEY);
    this.volume = storedVol !== undefined ? storedVol : 0.5;
  }

  /**
   * Khởi động phát nhạc nền khi vào game nếu đang bật
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (this.isEnabled) {
      await this.play();
    }
  }

  /**
   * Bắt đầu hoặc tiếp tục phát nhạc nền Zen
   */
  public async play(): Promise<void> {
    if (ZenAudioModule && typeof ZenAudioModule.play === 'function') {
      try {
        await ZenAudioModule.setVolume(this.volume);
        await ZenAudioModule.play();
      } catch (err) {
        console.warn('[ZenAudioService] play error:', err);
      }
    }
  }

  /**
   * Tạm dừng nhạc nền Zen
   */
  public async pause(): Promise<void> {
    if (ZenAudioModule && typeof ZenAudioModule.pause === 'function') {
      try {
        await ZenAudioModule.pause();
      } catch (err) {
        console.warn('[ZenAudioService] pause error:', err);
      }
    }
  }

  /**
   * Đổi trạng thái bật/tắt nhạc nền
   */
  public async setEnabled(enabled: boolean): Promise<boolean> {
    this.isEnabled = enabled;
    storage.set(BGM_ENABLED_KEY, enabled);
    if (enabled) {
      await this.play();
    } else {
      await this.pause();
    }
    return this.isEnabled;
  }

  /**
   * Lấy trạng thái bật/tắt hiện tại
   */
  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Điều chỉnh âm lượng (0.0 đến 1.0)
   */
  public async setVolume(vol: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, vol));
    storage.set(BGM_VOLUME_KEY, this.volume);
    if (ZenAudioModule && typeof ZenAudioModule.setVolume === 'function') {
      try {
        await ZenAudioModule.setVolume(this.volume);
      } catch (err) {
        console.warn('[ZenAudioService] setVolume error:', err);
      }
    }
  }

  /**
   * Lấy mức âm lượng hiện tại
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * Phát âm thanh chuông gió Zen (khi quét thẻ NFC hoặc tương tác)
   */
  public async playChime(): Promise<void> {
    if (!this.isChimeEnabled) return;
    if (ZenAudioModule && typeof ZenAudioModule.playChime === 'function') {
      try {
        await ZenAudioModule.playChime();
      } catch (err) {
        console.warn('[ZenAudioService] playChime error:', err);
      }
    }
  }

  /**
   * Lấy trạng thái bật/tắt chuông gió Zen
   */
  public getIsChimeEnabled(): boolean {
    return this.isChimeEnabled;
  }

  /**
   * Đổi trạng thái bật/tắt chuông gió Zen
   */
  public setChimeEnabled(enabled: boolean): boolean {
    this.isChimeEnabled = enabled;
    storage.set(CHIME_ENABLED_KEY, enabled);
    return this.isChimeEnabled;
  }
}

export const zenAudioService = new ZenAudioService();
