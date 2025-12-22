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
  masterKey: process.env['MASTER_KEY'] || 'dev-key-replace-in-production',

  // Feature flags
  useDatabase: process.env['USE_DATABASE'] === 'true',
  useVeilForms: process.env['USE_VEILFORMS'] === 'true',
};

export function isDev(): boolean {
  return config.nodeEnv === 'development';
}

export function isProd(): boolean {
  return config.nodeEnv === 'production';
}
