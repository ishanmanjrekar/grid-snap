import type { EconomyConfig, LevelConfig } from '../engine/types';

export const REMOTE_CONFIG_BASE_URL =
  'https://raw.githubusercontent.com/ishanmanjrekar/grid-snap/main/src/config/';

/**
 * Runtime schema validator for `levels.json` payloads.
 * Protects against captive portals, network proxies, or malformed JSON commits.
 */
export function isValidLevelsConfig(data: unknown): data is LevelConfig[] {
  if (!Array.isArray(data) || data.length === 0) return false;
  return data.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const lvl = item as Partial<LevelConfig>;
    return (
      typeof lvl.id === 'number' &&
      (lvl.cols === 3 || lvl.cols === 4) &&
      typeof lvl.rows === 'number' &&
      lvl.rows >= 3 &&
      lvl.rows <= 8 &&
      typeof lvl.timeLimitSeconds === 'number' &&
      lvl.timeLimitSeconds > 0 &&
      typeof lvl.colorCount === 'number' &&
      lvl.colorCount >= 1 &&
      Array.isArray(lvl.frames) &&
      lvl.frames.length === lvl.rows &&
      Array.isArray(lvl.initialGrid) &&
      lvl.initialGrid.length === lvl.rows
    );
  });
}

/**
 * Runtime schema validator for `economy.json` payloads.
 */
export function isValidEconomyConfig(data: unknown): data is EconomyConfig {
  if (!data || typeof data !== 'object') return false;
  const eco = data as Partial<EconomyConfig>;
  return (
    typeof eco.maxLives === 'number' &&
    eco.maxLives > 0 &&
    typeof eco.startingLives === 'number' &&
    typeof eco.lifeRegenIntervalSeconds === 'number' &&
    eco.lifeRegenIntervalSeconds > 0 &&
    typeof eco.startingCoins === 'number' &&
    typeof eco.levelClearReward === 'number' &&
    typeof eco.campaignLoopSize === 'number' &&
    eco.campaignLoopSize > 0 &&
    Boolean(
      eco.starThresholds &&
        typeof eco.starThresholds.threeStarMinRatio === 'number' &&
        typeof eco.starThresholds.twoStarMinRatio === 'number'
    ) &&
    Boolean(
      eco.boosters &&
        typeof eco.boosters.hintCostCoins === 'number' &&
        typeof eco.boosters.extraTimeCostCoins === 'number' &&
        typeof eco.boosters.extraTimeSeconds === 'number' &&
        typeof eco.boosters.reviveCostCoins === 'number' &&
        typeof eco.boosters.reviveSeconds === 'number'
    ) &&
    Array.isArray(eco.storePacks)
  );
}

/**
 * Generic utility to fetch JSON from a remote URL with an AbortController timeout,
 * schema validation, and automatic fallback to bundled local data.
 */
export async function fetchRemoteConfig<T>(
  url: string,
  fallback: T,
  validator?: (data: unknown) => data is T,
  timeoutMs = 3000
): Promise<T> {
  const controller = new AbortController();
  const timerId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-cache',
    });

    window.clearTimeout(timerId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: unknown = await response.json();
    if (validator && !validator(data)) {
      throw new Error(`Remote payload failed schema validation for ${url}`);
    }

    return data as T;
  } catch (error) {
    window.clearTimeout(timerId);
    console.warn(
      `[RemoteConfig] Failed to fetch ${url}. Using bundled fallback.`,
      error
    );
    return fallback;
  }
}

/**
 * Fetches live `levels.json` and `economy.json` in parallel for production builds
 * (Itch.io Web & Android APK), while preserving local disk configs during `npm run dev`
 * so Level Editor changes can be playtested before pushing to GitHub.
 */
export async function fetchLiveGameConfigs(
  localLevels: LevelConfig[],
  localEconomy: EconomyConfig,
  timeoutMs = 3000
): Promise<{ levels: LevelConfig[]; economy: EconomyConfig }> {
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_FORCE_REMOTE_CONFIG !== 'true'
  ) {
    return { levels: localLevels, economy: localEconomy };
  }

  const [levels, economy] = await Promise.all([
    fetchRemoteConfig(
      `${REMOTE_CONFIG_BASE_URL}levels.json`,
      localLevels,
      isValidLevelsConfig,
      timeoutMs
    ),
    fetchRemoteConfig(
      `${REMOTE_CONFIG_BASE_URL}economy.json`,
      localEconomy,
      isValidEconomyConfig,
      timeoutMs
    ),
  ]);

  return { levels, economy };
}

