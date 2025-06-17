import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  dbUrl: string;
  storageType: 'local' | 's3' | 'r2';
  storageConfig: {
    bucket?: string;
    region?: string;
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  searchConfig: {
    type: 'meilisearch' | 'typesense';
    host: string;
    apiKey: string;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  dbUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prostor',
  storageType: (process.env.STORAGE_TYPE as 'local' | 's3' | 'r2') || 'local',
  storageConfig: {
    bucket: process.env.STORAGE_BUCKET,
    region: process.env.STORAGE_REGION,
    endpoint: process.env.STORAGE_ENDPOINT,
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
  },
  searchConfig: {
    type: (process.env.SEARCH_TYPE as 'meilisearch' | 'typesense') || 'meilisearch',
    host: process.env.SEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.SEARCH_API_KEY || '',
  },
};