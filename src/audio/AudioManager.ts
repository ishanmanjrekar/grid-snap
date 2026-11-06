import { AssetLoader } from '../utils/AssetLoader';
import { playSynthesizedSfx, type SfxKey } from './sfx';

export type MusicTrack = 'menu' | 'gameplay' | 'theme';

const MUSIC_VOLUME = 0.36; // Reduced by 20% from 0.45
const MUSIC_DUCKED_VOLUME = 0.13; // Reduced by 20% from 0.16

const TRACK_ASSET_MAP: Record<MusicTrack, string> = {
  menu: 'theme',
  gameplay: 'theme',
  theme: 'theme',
};

class AudioManagerController {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private sfxEnabled = true;
  private musicEnabled = true;
  private isDucked = false;

  private currentTrack: MusicTrack | null = null;
  private musicElements: Partial<Record<string, HTMLAudioElement>> = {};
  private musicLoadFailed: Partial<Record<string, boolean>> = {};
  private customSfxBuffers: Partial<Record<SfxKey, AudioBuffer | null>> = {};

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.ctx.destination);
      this.musicGain.connect(this.ctx.destination);
      this.updateGainNodes();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getActiveMusicElement(): HTMLAudioElement | null {
    if (!this.currentTrack) return null;
    const assetKey = TRACK_ASSET_MAP[this.currentTrack] || this.currentTrack;
    return this.musicElements[assetKey] || null;
  }

  public unlock(): void {
    this.ensureContext();
    if (this.currentTrack && this.musicEnabled) {
      const assetKey = TRACK_ASSET_MAP[this.currentTrack] || this.currentTrack;
      this.startTrackElement(assetKey);
    }
  }

  public syncSettings(settings: {
    musicEnabled: boolean;
    sfxEnabled: boolean;
    isModalOpen?: boolean;
  }): void {
    this.musicEnabled = settings.musicEnabled;
    this.sfxEnabled = settings.sfxEnabled;
    if (settings.isModalOpen !== undefined) {
      this.isDucked = settings.isModalOpen;
    }
    this.updateGainNodes();

    const activeEl = this.getActiveMusicElement();
    if (activeEl) {
      activeEl.volume = this.musicEnabled ? (this.isDucked ? MUSIC_DUCKED_VOLUME : MUSIC_VOLUME) : 0;
      if (!this.musicEnabled && !activeEl.paused) {
        activeEl.pause();
      } else if (this.musicEnabled && activeEl.paused && this.ctx) {
        void activeEl.play().catch(() => {});
      }
    }
  }

  private updateGainNodes(): void {
    if (!this.ctx || !this.sfxGain || !this.musicGain) return;
    this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 1 : 0, this.ctx.currentTime);
    const targetMusicGain = this.musicEnabled ? (this.isDucked ? 0.35 : 1.0) : 0;
    this.musicGain.gain.setValueAtTime(targetMusicGain, this.ctx.currentTime);
  }

  public playSfx(key: SfxKey): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const cachedBuffer = this.customSfxBuffers[key];
    if (cachedBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = cachedBuffer;
      source.connect(this.sfxGain);
      source.start();
      return;
    }

    // Play WebAudio synthesized 16-bit SFX immediately
    playSynthesizedSfx(ctx, this.sfxGain, key);

    // Opportunistically probe once for an optional override file in public/audio/sfx/<key>.ogg
    if (this.customSfxBuffers[key] === undefined) {
      this.customSfxBuffers[key] = null;
      const url = AssetLoader.resolvePath(`audio/sfx/${key}.ogg`);
      void fetch(url)
        .then((res) => {
          if (!res.ok) return null;
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('text/html')) return null;
          return res.arrayBuffer();
        })
        .then((buf) => (buf ? ctx.decodeAudioData(buf) : null))
        .then((decoded) => {
          if (decoded) {
            this.customSfxBuffers[key] = decoded;
          }
        })
        .catch(() => {
          // Silently keep synthesized SFX
        });
    }
  }

  public setMusicTrack(track: MusicTrack): void {
    const prevAsset = this.currentTrack ? (TRACK_ASSET_MAP[this.currentTrack] || this.currentTrack) : null;
    const nextAsset = TRACK_ASSET_MAP[track] || track;

    this.currentTrack = track;

    // Continuous playback: if both track roles share the same audio asset, keep playing without interrupting
    if (prevAsset === nextAsset) {
      if (this.musicEnabled && this.ctx) {
        this.startTrackElement(nextAsset);
      }
      return;
    }

    // Pause previous track if switching to a different asset
    if (prevAsset && this.musicElements[prevAsset]) {
      const prevEl = this.musicElements[prevAsset]!;
      prevEl.pause();
      prevEl.currentTime = 0;
    }

    if (this.musicEnabled && this.ctx) {
      this.startTrackElement(nextAsset);
    }
  }

  private startTrackElement(assetKey: string): void {
    if (typeof Audio === 'undefined') return;
    if (this.musicLoadFailed[assetKey]) return;

    let el = this.musicElements[assetKey];
    if (!el) {
      el = new Audio();
      el.loop = true;
      el.preload = 'auto';
      el.src = AssetLoader.resolvePath(`audio/music/${assetKey}.ogg`);
      el.onerror = () => {
        // Fallback probe for .mp3 if .ogg is not supported or missing
        if (el && el.src.endsWith('.ogg')) {
          el.src = AssetLoader.resolvePath(`audio/music/${assetKey}.mp3`);
        } else {
          this.musicLoadFailed[assetKey] = true;
        }
      };
      this.musicElements[assetKey] = el;
    }

    el.volume = this.musicEnabled ? (this.isDucked ? MUSIC_DUCKED_VOLUME : MUSIC_VOLUME) : 0;
    if (this.musicEnabled && el.paused) {
      void el.play().catch(() => {
        // Ignore NotAllowedError or missing user-supplied track
      });
    }
  }

  public suspendOnHide(): void {
    if (this.ctx && this.ctx.state === 'running') {
      void this.ctx.suspend().catch(() => {});
    }
    const activeEl = this.getActiveMusicElement();
    if (activeEl) {
      activeEl.pause();
    }
  }

  public resumeOnShow(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    const activeEl = this.getActiveMusicElement();
    if (activeEl && this.musicEnabled) {
      void activeEl.play().catch(() => {});
    }
  }
}

export const audioManager = new AudioManagerController();

