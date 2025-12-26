#!/usr/bin/env node

import { existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 检查关键依赖是否存在
function checkDependencies() {
  const nodeModulesPath = join(rootDir, 'node_modules');
  const expressPath = join(nodeModulesPath, 'express');
  
  if (!existsSync(nodeModulesPath) || !existsSync(expressPath)) {
    console.log('⚠️  检测到依赖不完整，开始重新安装...');
    return false;
  }
  
  return true;
}

// 彻底清理 node_modules（使用系统命令，更可靠）
async function cleanNodeModules() {
  const nodeModulesPath = join(rootDir, 'node_modules');
  const lockPath = join(rootDir, 'package-lock.json');
  
  try {
    // 使用系统命令 rm -rf 彻底删除（比 Node.js 的 rmSync 更可靠）
    if (existsSync(nodeModulesPath)) {
      console.log('📦 清理 node_modules 目录...');
      // 根据操作系统选择命令
      const isWindows = process.platform === 'win32';
      if (isWindows) {
        // Windows 使用 rmdir /s /q
        execSync(`rmdir /s /q "${nodeModulesPath}"`, { 
          stdio: 'inherit', 
          cwd: rootDir,
          shell: true
        });
      } else {
        // Linux/Mac 使用 rm -rf
        execSync(`rm -rf "${nodeModulesPath}"`, { 
          stdio: 'inherit', 
          cwd: rootDir,
          shell: true
        });
      }
    }
    
    if (existsSync(lockPath)) {
      console.log('📦 清理 package-lock.json...');
      rmSync(lockPath, { force: true });
    }
    
    // 等待一下确保文件系统操作完成
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (error) {
    console.warn('⚠️  清理警告:', error.message);
    // 即使清理失败也继续，npm install 可能会处理
  }
}

// 安装依赖
async function installDependencies() {
  try {
    // 彻底清理
    await cleanNodeModules();
    
    console.log('🧹 清理 npm 缓存...');
    execSync('npm cache clean --force', { stdio: 'inherit', cwd: rootDir });
    
    console.log('📥 安装生产依赖...');
    // 使用 npm install 而不是 npm ci，更宽容一些
    execSync('npm install --omit=dev --no-audit --no-fund', { 
      stdio: 'inherit', 
      cwd: rootDir 
    });
    
    // 验证关键依赖是否安装成功
    const expressPath = join(rootDir, 'node_modules', 'express');
    if (!existsSync(expressPath)) {
      throw new Error('express 依赖安装失败');
    }
    
    console.log('✅ 依赖安装完成');
    return true;
  } catch (error) {
    console.error('❌ 依赖安装失败:', error.message);
    console.error('   请手动执行: rm -rf node_modules package-lock.json && npm install --omit=dev');
    return false;
  }
}

// 检查构建产物是否存在
function checkBuild() {
  const distPath = join(rootDir, 'dist');
  const indexHtmlPath = join(distPath, 'index.html');
  
  if (!existsSync(distPath) || !existsSync(indexHtmlPath)) {
    console.error('❌ 错误：未找到前端构建产物（dist 目录）');
    console.error('   请先执行构建命令：npm run build');
    console.error('   注意：构建需要 devDependencies，请确保已安装完整依赖');
    return false;
  }
  
  return true;
}

// 启动服务器
function startServer() {
  console.log('🚀 启动服务器...');
  const serverPath = join(rootDir, 'server', 'index.js');
  
  // 使用 spawn 启动服务器，保持进程运行
  const serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    cwd: rootDir,
    shell: false
  });
  
  // 处理进程退出
  serverProcess.on('error', (error) => {
    console.error('❌ 服务器启动失败:', error.message);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ 服务器异常退出，退出码: ${code}`);
      process.exit(code);
    }
  });
  
  // 传递信号到子进程
  process.on('SIGINT', () => {
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    serverProcess.kill('SIGTERM');
  });
}

// 主函数
async function main() {
  console.log('🔍 检查启动环境...');
  
  // 检查依赖
  if (!checkDependencies()) {
    if (!await installDependencies()) {
      console.error('❌ 无法启动：依赖安装失败');
      process.exit(1);
    }
  }
  
  // 检查构建
  if (!checkBuild()) {
    process.exit(1);
  }
  
  console.log('✅ 环境检查通过，启动服务器');
  startServer();
}

main();

