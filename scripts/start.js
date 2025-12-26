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

// 安装依赖
function installDependencies() {
  try {
    console.log('📦 清理旧的 node_modules...');
    const nodeModulesPath = join(rootDir, 'node_modules');
    const lockPath = join(rootDir, 'package-lock.json');
    
    if (existsSync(nodeModulesPath)) {
      rmSync(nodeModulesPath, { recursive: true, force: true });
    }
    if (existsSync(lockPath)) {
      rmSync(lockPath, { force: true });
    }
    
    console.log('🧹 清理 npm 缓存...');
    execSync('npm cache clean --force', { stdio: 'inherit', cwd: rootDir });
    
    console.log('📥 安装生产依赖...');
    execSync('npm ci --omit=dev', { stdio: 'inherit', cwd: rootDir });
    
    console.log('✅ 依赖安装完成');
    return true;
  } catch (error) {
    console.error('❌ 依赖安装失败:', error.message);
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
function main() {
  console.log('🔍 检查启动环境...');
  
  // 检查依赖
  if (!checkDependencies()) {
    if (!installDependencies()) {
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

