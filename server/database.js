import { Pool } from 'pg';
import dotenv from 'dotenv';

// ESM import 会在 index.js 的 dotenv.config() 之前执行，因此这里需先加载环境变量
dotenv.config({ override: true });
dotenv.config({ path: '.env.local', override: true });

const useConnectionString = process.env.DATABASE_URL;

const databaseConfig = useConnectionString
  ? {
      connectionString: useConnectionString,
      ssl: process.env.PGSSL?.toLowerCase() === 'true' ? { rejectUnauthorized: false } : undefined
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE || 'Softwares',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      max: Number(process.env.PGPOOL_MAX || 20),
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT || 30000),
      connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT || 5000),
      ssl: process.env.PGSSL?.toLowerCase() === 'true' ? { rejectUnauthorized: false } : undefined
    };

if (!useConnectionString && !process.env.PGPASSWORD) {
  console.warn('⚠️ 未设置 PGPASSWORD，将使用空密码连接本地数据库，仅用于本地开发。');
}

export const pool = new Pool(databaseConfig);

export const handleDatabaseError = (error, res) => {
  console.error('数据库错误:', error);
  if (res) {
    res.status(500).json({
      error: '数据库操作失败',
      message: error.message
    });
  } else {
    throw error;
  }
};

export const testConnection = async () => {
  try {
    const result = await pool.query('SELECT 1 as ok');
    console.log('PostgreSQL 数据库连接成功', result.rows[0]);
    return true;
  } catch (error) {
    console.error('PostgreSQL 数据库连接失败:', error);
    return false;
  }
};

export const query = async (text, params) => {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } catch (error) {
    handleDatabaseError(error);
    throw error;
  } finally {
    client.release();
  }
};