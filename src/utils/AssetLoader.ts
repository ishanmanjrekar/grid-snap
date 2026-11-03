/**
 * AssetLoader
 * 
 * Simple utility to resolve and preload image and audio assets with Itch.io-compatible relative paths.
 */
export class AssetLoader {
  private static images: Map<string, HTMLImageElement> = new Map();
  private static audio: Map<string, HTMLAudioElement> = new Map();

  /**
   * Resolve asset path with the correct Vite base URL prefix (essential for Itch.io nested CDN paths)
   */
  public static resolvePath(path: string): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${import.meta.env.BASE_URL}${cleanPath}`;
  }

  /**
   * Preload an image asset
   */
  public static loadImage(path: string): Promise<HTMLImageElement> {
    const fullPath = this.resolvePath(path);
    if (this.images.has(fullPath)) {
      return Promise.resolve(this.images.get(fullPath)!);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(fullPath, img);
        resolve(img);
      };
      img.onerror = (err) => {
        console.error(`Failed to load image: ${fullPath}`, err);
        reject(err);
      };
      img.src = fullPath;
    });
  }

  /**
   * Preload an audio asset
   */
  public static loadAudio(path: string): Promise<HTMLAudioElement> {
    const fullPath = this.resolvePath(path);
    if (this.audio.has(fullPath)) {
      return Promise.resolve(this.audio.get(fullPath)!);
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        this.audio.set(fullPath, audio);
        resolve(audio);
      };
      audio.onerror = (err) => {
        console.error(`Failed to load audio: ${fullPath}`, err);
        reject(err);
      };
      audio.src = fullPath;
    });
  }

  /**
   * Get preloaded image
   */
  public static getImage(path: string): HTMLImageElement | undefined {
    return this.images.get(this.resolvePath(path));
  }

  /**
   * Get preloaded audio
   */
  public static getAudio(path: string): HTMLAudioElement | undefined {
    return this.audio.get(this.resolvePath(path));
  }
}

