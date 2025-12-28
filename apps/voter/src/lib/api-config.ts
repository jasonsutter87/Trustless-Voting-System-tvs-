/**
 * TVS API Configuration
 *
 * Supports multiple deployment modes:
 * - local: Connect to local Pi edge node
 * - cloud: Connect to central cloud API
 * - auto: Auto-detect based on network availability
 */

export type DeploymentMode = 'local' | 'cloud' | 'auto';

export interface APIConfig {
  mode: DeploymentMode;
  localUrl: string;
  cloudUrl: string;
  timeout: number;
  retries: number;
}

export interface DeploymentInfo {
  mode: 'local' | 'cloud';
  nodeName?: string;
  jurisdiction?: string;
  connected: boolean;
}

// Default configuration from environment
const defaultConfig: APIConfig = {
  mode: (process.env.NEXT_PUBLIC_DEPLOYMENT_MODE as DeploymentMode) || 'auto',
  localUrl: process.env.NEXT_PUBLIC_LOCAL_API_URL || 'http://192.168.1.1:3000',
  cloudUrl: process.env.NEXT_PUBLIC_CLOUD_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  retries: parseInt(process.env.NEXT_PUBLIC_API_RETRIES || '3', 10),
};

// Cached values
let cachedConfig: APIConfig | null = null;
let detectedEndpoint: string | null = null;
let endpointDetectionPromise: Promise<string> | null = null;

/**
 * Get configuration
 */
export function getConfig(): APIConfig {
  if (!cachedConfig) {
    cachedConfig = { ...defaultConfig };
  }
  return cachedConfig;
}

/**
 * Detect available API endpoint
 */
async function detectEndpoint(): Promise<string> {
  // Return cached result if available
  if (detectedEndpoint) {
    return detectedEndpoint;
  }

  // Prevent multiple concurrent detection attempts
  if (endpointDetectionPromise) {
    return endpointDetectionPromise;
  }

  endpointDetectionPromise = (async () => {
    const config = getConfig();

    // Try local first (faster response expected for local Pi)
    if (config.mode === 'auto' || config.mode === 'local') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const localResponse = await fetch(`${config.localUrl}/health`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (localResponse.ok) {
          const health = await localResponse.json();
          if (health.deploymentMode === 'edge' || health.status === 'ok') {
            detectedEndpoint = config.localUrl;
            console.log('[API] Using local Pi endpoint:', detectedEndpoint);
            return detectedEndpoint;
          }
        }
      } catch {
        // Local not available, try cloud
        console.log('[API] Local endpoint not available, trying cloud...');
      }
    }

    // Fall back to cloud
    if (config.mode === 'auto' || config.mode === 'cloud') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const cloudResponse = await fetch(`${config.cloudUrl}/health`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (cloudResponse.ok) {
          detectedEndpoint = config.cloudUrl;
          console.log('[API] Using cloud endpoint:', detectedEndpoint);
          return detectedEndpoint;
        }
      } catch (err) {
        console.error('[API] Cloud endpoint not available:', err);
      }
    }

    // If forced mode and endpoint not available, still use it
    if (config.mode === 'local') {
      detectedEndpoint = config.localUrl;
    } else {
      detectedEndpoint = config.cloudUrl;
    }

    console.warn('[API] Using fallback endpoint:', detectedEndpoint);
    return detectedEndpoint;
  })();

  try {
    return await endpointDetectionPromise;
  } finally {
    endpointDetectionPromise = null;
  }
}

/**
 * Get API base URL based on configuration
 */
export async function getAPIBaseUrl(): Promise<string> {
  const config = getConfig();

  switch (config.mode) {
    case 'local':
      return config.localUrl;
    case 'cloud':
      return config.cloudUrl;
    case 'auto':
    default:
      return detectEndpoint();
  }
}

/**
 * Get API base URL synchronously (uses cached value or default)
 */
export function getAPIBaseUrlSync(): string {
  if (detectedEndpoint) {
    return detectedEndpoint;
  }

  const config = getConfig();
  return config.mode === 'local' ? config.localUrl : config.cloudUrl;
}

/**
 * Reset endpoint detection (useful after network changes)
 */
export function resetEndpointDetection(): void {
  detectedEndpoint = null;
  endpointDetectionPromise = null;
}

/**
 * Get deployment info from current endpoint
 */
export async function getDeploymentInfo(): Promise<DeploymentInfo> {
  try {
    const baseUrl = await getAPIBaseUrl();
    const health = await apiFetch<{
      status: string;
      deploymentMode?: string;
      nodeName?: string;
      jurisdictionCode?: string;
    }>('/health');

    return {
      mode: health.deploymentMode === 'edge' ? 'local' : 'cloud',
      nodeName: health.nodeName,
      jurisdiction: health.jurisdictionCode,
      connected: true,
    };
  } catch {
    return {
      mode: getConfig().mode === 'local' ? 'local' : 'cloud',
      connected: false,
    };
  }
}

/**
 * Typed fetch wrapper with error handling, retry, and timeout
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getConfig();
  const baseUrl = await getAPIBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `API error: ${response.status}`);
      }

      return response.json();
    } catch (err) {
      lastError = err as Error;

      // Don't retry on client errors (4xx)
      if (err instanceof Error && err.message.includes('API error: 4')) {
        throw err;
      }

      // Don't retry on abort
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timed out');
      }

      // Exponential backoff before retry
      if (attempt < config.retries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[API] Retry ${attempt + 1}/${config.retries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

// Legacy export for backward compatibility
export const API_BASE_URL = getAPIBaseUrlSync();
