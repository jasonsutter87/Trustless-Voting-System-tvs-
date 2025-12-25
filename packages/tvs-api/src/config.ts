/**
 * Configuration
 */

export const config = {
  // Server
  port: parseInt(process.env['PORT'] || '3000'),
  nodeEnv: process.env['NODE_ENV'] || 'development',

  // Database
  databaseUrl: process.env['DATABASE_URL'] || 'postgres://tvs:tvs_dev_password@localhost:5432/tvs',

  // VeilForms
  veilformsApiUrl: process.env['VEILFORMS_API_URL'] || 'https://api.veilforms.com',
  veilformsApiKey: process.env['VEILFORMS_API_KEY'] || '',
  veilformsFormId: process.env['VEILFORMS_FORM_ID'] || '',

  // Encryption (for storing private keys)
  masterKey: (() => {
    const key = process.env['MASTER_KEY'];
    if (!key) {
      if (process.env['NODE_ENV'] === 'production') {
        throw new Error('MASTER_KEY must be set in production');
      }
      return 'dev-key-replace-in-production';
    }
    // Validate key strength (at least 32 bytes hex = 64 chars)
    if (process.env['NODE_ENV'] === 'production' && !/^[a-f0-9]{64,}$/i.test(key)) {
      throw new Error('MASTER_KEY must be at least 32 bytes hex in production');
    }
    return key;
  })(),

  // Feature flags
  useDatabase: process.env['USE_DATABASE'] === 'true',
  useVeilForms: process.env['USE_VEILFORMS'] === 'true',
  useBitcoinAnchoring: process.env['USE_BITCOIN_ANCHORING'] === 'true',

  // Bitcoin Anchoring (via OpenTimestamps)
  // No node required - OTS calendar servers handle Bitcoin interaction
  bitcoinNetwork: (process.env['BITCOIN_NETWORK'] || 'mainnet') as 'mainnet' | 'testnet',
};

export function isDev(): boolean {
  return config.nodeEnv === 'development';
}

export function isProd(): boolean {
  return config.nodeEnv === 'production';
}
