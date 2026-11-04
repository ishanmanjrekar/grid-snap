import { AssetLoader } from '../utils/AssetLoader';
import { playSynthesizedSfx, type SfxKey } from './sfx';

export type MusicTrack = 'menu' | 'gameplay';

class AudioManagerController {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private sfxEnabled = true;
  private musicEnabled = true;
  private isDucked = false;

  private currentTrack: MusicTrack | null = null;
  private musicElements: Partial<Record<MusicTrack, HTMLAudioElement>> = {};
  private musicLoadFailed: Partial<Record<MusicTrack, boolean>> = {};
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

  public unlock(): void {
    this.ensureContext();
    if (this.currentTrack && this.musicEnabled) {
      this.startTrackElement(this.currentTrack);
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

    const activeEl = this.currentTrack ? this.musicElements[this.currentTrack] : null;
    if (activeEl) {
      activeEl.volume = this.musicEnabled ? (this.isDucked ? 0.16 : 0.45) : 0;
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
    if (this.currentTrack === track) {
      if (this.musicEnabled) {
        this.startTrackElement(track);
      }
      return;
    }

    // Pause previous track
    if (this.currentTrack && this.musicElements[this.currentTrack]) {
      const prevEl = this.musicElements[this.currentTrack]!;
      prevEl.pause();
      prevEl.currentTime = 0;
    }

    this.currentTrack = track;
    if (this.musicEnabled && this.ctx) {
      this.startTrackElement(track);
    }
  }

  private startTrackElement(track: MusicTrack): void {
    if (this.musicLoadFailed[track]) return;

    let el = this.musicElements[track];
    if (!el) {
      el = new Audio();
      el.loop = true;
      el.preload = 'auto';
      el.src = AssetLoader.resolvePath(`audio/music/${track}.ogg`);
      el.onerror = () => {
        // Fallback probe for .mp3 if .ogg is not supplied yet, otherwise fail silently
        if (el && el.src.endsWith('.ogg')) {
          el.src = AssetLoader.resolvePath(`audio/music/${track}.mp3`);
        } else {
          this.musicLoadFailed[track] = true;
        }
      };
      this.musicElements[track] = el;
    }

    el.volume = this.musicEnabled ? (this.isDucked ? 0.16 : 0.45) : 0;
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
    if (this.currentTrack && this.musicElements[this.currentTrack]) {
      this.musicElements[this.currentTrack]!.pause();
    }
  }

  public resumeOnShow(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    if (this.currentTrack && this.musicEnabled && this.musicElements[this.currentTrack]) {
      void this.musicElements[this.currentTrack]!.play().catch(() => {});
    }
  }
}

export const audioManager = new AudioManagerController();

