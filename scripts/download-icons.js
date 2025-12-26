import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 先加载环境变量（与 server/database.js 保持一致）
dotenv.config({ override: true });
dotenv.config({ path: '.env.local', override: true });

const useConnectionString = process.env.DATABASE_URL;

// 数据库配置：禁止在代码中硬编码密码/密钥，请使用环境变量
// - 优先使用 DATABASE_URL
// - 或使用 PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD 等变量
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

const pool = new Pool(databaseConfig);

// 创建图标存储目录
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 下载图片的函数
async function downloadImage(url, filename) {
  try {
    console.log(`📥 开始下载: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const filePath = path.join(iconsDir, filename);
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log(`✅ 下载完成: ${filename}`);
    
    return `/icons/${filename}`;
  } catch (error) {
    console.error(`❌ 下载失败 ${url}:`, error.message);
    return null;
  }
}

// 获取文件扩展名
function getFileExtension(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const ext = path.extname(pathname).toLowerCase();
    
    // 如果没有扩展名，根据响应类型判断
    if (!ext) {
      return '.png'; // 默认为PNG
    }
    
    return ext;
  } catch {
    return '.png'; // 默认为PNG
  }
}

// 生成唯一的文件名
function generateUniqueFilename(softwareName, url) {
  const extension = getFileExtension(url);
  const cleanName = softwareName
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_') // 替换特殊字符
    .toLowerCase();
  
  return `${cleanName}${extension}`;
}

// 主函数：下载所有图标
async function downloadAllIcons() {
  try {
    console.log('🚀 开始下载所有软件图标...\n');
    
    // 获取所有软件数据
    const result = await pool.query('SELECT id, name, icon FROM softwares WHERE icon IS NOT NULL AND icon != \'\'');
    const softwares = result.rows;
    
    console.log(`📊 找到 ${softwares.length} 个软件需要下载图标\n`);
    
    let successCount = 0;
    let failCount = 0;
    const updates = [];
    
    for (const software of softwares) {
      const { id, name, icon } = software;
      
      if (!icon || icon.startsWith('/icons/')) {
        console.log(`⏭️  跳过 ${name}：已经是本地图标`);
        continue;
      }
      
      const filename = generateUniqueFilename(name, icon);
      const localPath = await downloadImage(icon, filename);
      
      if (localPath) {
        updates.push({ id, localPath });
        successCount++;
      } else {
        failCount++;
      }
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 下载统计:`);
    console.log(`✅ 成功: ${successCount} 个`);
    console.log(`❌ 失败: ${failCount} 个`);
    
    if (updates.length > 0) {
      console.log('\n🔄 更新数据库中的图标路径...');
      
      for (const update of updates) {
        await pool.query(
          'UPDATE softwares SET icon = $1 WHERE id = $2',
          [update.localPath, update.id]
        );
      }
      
      console.log(`✅ 已更新 ${updates.length} 个软件的图标路径`);
    }
    
    console.log('\n🎉 图标下载完成！');
    
  } catch (error) {
    console.error('❌ 下载过程中出错:', error);
  } finally {
    await pool.end();
  }
}

// 运行脚本
downloadAllIcons(); 