#!/usr/bin/env node

/**
 * 期末复习刷题平台 - 一键启动脚本
 * 支持Windows、macOS和Linux操作系统
 * 自动启动前后端开发服务器，配置环境变量，打开浏览器
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 项目根目录
const rootDir = process.cwd();
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

// 端口配置
const config = {
  backend: {
    port: 5000,
    url: `http://localhost:5000`,
    apiUrl: `http://localhost:5000/api`
  },
  frontend: {
    port: 5173,
    url: `http://localhost:5173`
  }
};

// 日志输出函数
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logHeading(message) {
  log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}`, 'cyan');
}

// 检查命令是否存在
function commandExists(cmd) {
  return new Promise((resolve) => {
    const process = spawn(cmd, ['--version'], {
      shell: true,
      stdio: 'ignore'
    });

    process.on('exit', (code) => {
      resolve(code === 0);
    });

    process.on('error', () => {
      resolve(false);
    });
  });
}

// 检查端口是否被占用
function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port);
  });
}

// 安装依赖
function installDependencies() {
  return new Promise((resolve, reject) => {
    logInfo('正在安装项目依赖...');

    const npmInstall = spawn('npm', ['install'], {
      cwd: rootDir,
      shell: true
    });

    npmInstall.on('close', (code) => {
      if (code === 0) {
        logSuccess('项目依赖安装成功');
        resolve();
      } else {
        logError('项目依赖安装失败');
        reject(new Error('项目依赖安装失败'));
      }
    });

    npmInstall.on('error', (error) => {
      logError(`安装依赖时发生错误: ${error.message}`);
      reject(error);
    });
  });
}

// 检查依赖是否已安装
function checkDependencies() {
  const nodeModulesPath = path.join(rootDir, 'node_modules');
  return fs.existsSync(nodeModulesPath);
}

// 启动后端服务器
function startBackend() {
  return new Promise((resolve, reject) => {
    logInfo('正在启动后端服务器...');

    const backendProcess = spawn('node', ['index.js'], {
      cwd: backendDir,
      shell: true
    });

    let backendStarted = false;

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();

      if (output.includes('Server running on port')) {
        backendStarted = true;
        logSuccess(`后端服务器已启动: ${config.backend.apiUrl}`);
        resolve(backendProcess);
      }

      // 实时输出后端日志
      if (output.trim()) {
        console.log(`${colors.blue}[BACKEND]${colors.reset} ${output.trim()}`);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`${colors.red}[BACKEND ERROR]${colors.reset} ${output.trim()}`);
    });

    backendProcess.on('error', (error) => {
      logError(`后端服务器启动失败: ${error.message}`);
      reject(error);
    });

    backendProcess.on('close', (code) => {
      if (!backendStarted) {
        logError(`后端服务器意外退出，退出码: ${code}`);
        reject(new Error(`后端服务器意外退出，退出码: ${code}`));
      }
    });

    // 超时处理
    setTimeout(() => {
      if (!backendStarted) {
        backendProcess.kill();
        reject(new Error('后端服务器启动超时'));
      }
    }, 10000);
  });
}

// 启动前端服务器
function startFrontend() {
  return new Promise((resolve, reject) => {
    logInfo('正在启动前端服务器...');

    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: frontendDir,
      shell: true
    });

    let frontendStarted = false;

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();

      // 实时输出前端日志
      if (output.trim()) {
        console.log(`${colors.magenta}[FRONTEND]${colors.reset} ${output.trim()}`);
      }

      // 检测前端服务器是否启动成功
      if ((output.includes('ready in') || output.includes('Local:')) && !frontendStarted) {
        frontendStarted = true;
        logSuccess(`前端服务器已启动: ${config.frontend.url}`);
        resolve(frontendProcess);
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`${colors.red}[FRONTEND ERROR]${colors.reset} ${output.trim()}`);
    });

    frontendProcess.on('error', (error) => {
      logError(`前端服务器启动失败: ${error.message}`);
      reject(error);
    });

    frontendProcess.on('close', (code) => {
      if (!frontendStarted) {
        logError(`前端服务器意外退出，退出码: ${code}`);
        reject(new Error(`前端服务器意外退出，退出码: ${code}`));
      }
    });

    // 超时处理
    setTimeout(() => {
      if (!frontendStarted) {
        frontendProcess.kill();
        reject(new Error('前端服务器启动超时'));
      }
    }, 10000);
  });
}

// 自动打开浏览器
function openBrowser() {
  return new Promise((resolve) => {
    logInfo(`正在打开浏览器...`);

    let command;

    // 根据不同操作系统选择打开浏览器的命令
    if (process.platform === 'win32') {
      // Windows
      command = `start ${config.frontend.url}`;
    } else if (process.platform === 'darwin') {
      // macOS
      command = `open ${config.frontend.url}`;
    } else {
      // Linux
      command = `xdg-open ${config.frontend.url}`;
    }

    // 执行命令打开浏览器
    exec(command, (error) => {
      if (error) {
        logWarning(`无法自动打开浏览器: ${error.message}`);
        logInfo(`请手动访问: ${config.frontend.url}`);
      } else {
        logSuccess(`前端应用已打开: ${config.frontend.url}`);
      }
      resolve();
    });
  });
}

// 主函数
async function main() {
  logHeading('🚀 期末复习刷题平台 - 一键启动脚本');

  try {
    // 1. 系统检查
    logHeading('🔍 正在检查系统环境...');

    // 检查Node.js
    if (!(await commandExists('node'))) {
      logError('Node.js 未安装，请先安装 Node.js');
      process.exit(1);
    }
    logSuccess('Node.js 已安装');

    // 检查npm
    if (!(await commandExists('npm'))) {
      logError('npm 未安装，请先安装 npm');
      process.exit(1);
    }
    logSuccess('npm 已安装');

    // 检查端口
    const backendPortAvailable = await checkPort(config.backend.port);
    if (!backendPortAvailable) {
      logError(`后端端口 ${config.backend.port} 已被占用`);
      process.exit(1);
    }
    logSuccess(`后端端口 ${config.backend.port} 可用`);

    const frontendPortAvailable = await checkPort(config.frontend.port);
    if (!frontendPortAvailable) {
      logError(`前端端口 ${config.frontend.port} 已被占用`);
      process.exit(1);
    }
    logSuccess(`前端端口 ${config.frontend.port} 可用`);

    // 2. 依赖检查与安装
    logHeading('📦 正在检查依赖...');

    // 检查项目依赖
    if (!checkDependencies()) {
      logWarning('项目依赖未安装，正在安装...');
      await installDependencies();
    } else {
      logSuccess('项目依赖已安装');
    }

    // 3. 启动服务
    logHeading('🚀 正在启动服务...');

    // 启动后端
    const backendProcess = await startBackend();

    // 启动前端
    const frontendProcess = await startFrontend();

    // 4. 打开浏览器
    await openBrowser();

    // 5. 显示最终状态
    logHeading('🎉 启动成功！');
    logSuccess(`后端 API: ${config.backend.apiUrl}`);
    logSuccess(`前端应用: ${config.frontend.url}`);
    logInfo('按 Ctrl+C 停止所有服务');

    // 监听Ctrl+C信号
    process.on('SIGINT', () => {
      logInfo('\n正在停止服务...');

      backendProcess.kill();
      frontendProcess.kill();

      logSuccess('所有服务已停止');
      process.exit(0);
    });

  } catch (error) {
    logError(`启动失败: ${error.message}`);
    process.exit(1);
  }
}

// 启动脚本
main();
