const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { logger } = require('../../utils/logger');

/**
 * Git 同步部署控制器 - 当前目录版本
 * 直接在服务运行目录执行 Git 操作
 */
class GitDeployController {
  static async gitSync(req, res) {
    const execPromise = (cmd) => {
      return new Promise((resolve, reject) => {
        exec(cmd, { 
          timeout: 300000,
          cwd: process.cwd() // 在当前工作目录执行
        }, (error, stdout, stderr) => {
          if (error) {
            logger.error('[GitDeploy] 命令执行失败:', { cmd, error: error.message, stderr });
            reject(new Error(stderr || error.message));
          } else {
            resolve(stdout);
          }
        });
      });
    };

    const log = (msg) => logger.info('[GitDeploy] ' + msg);
    const cwd = process.cwd();

    try {
      const branch = '260413-feat-jhchat-refactor';

      log(`开始 Git 同步 (当前目录：${cwd})...`);

      // 1. 检查是否是 Git 仓库
      log('1. 检查 Git 仓库...');
      try {
        await execPromise('git rev-parse --git-dir');
        log('✓ 当前目录是 Git 仓库');
      } catch (error) {
        throw new Error('当前目录不是 Git 仓库，无法执行同步');
      }

      // 2. 检查分支
      log('2. 切换到目标分支...');
      const currentBranch = await execPromise('git rev-parse --abbrev-ref HEAD');
      if (currentBranch.trim() !== branch) {
        try {
          await execPromise(`git checkout ${branch}`);
          log(`✓ 已切换到分支：${branch}`);
        } catch (error) {
          await execPromise(`git fetch origin ${branch}`);
          await execPromise(`git checkout -b ${branch} origin/${branch}`);
          log(`✓ 已创建并切换到分支：${branch}`);
        }
      }

      // 3. 拉取最新代码
      log('3. 拉取最新代码...');
      const localHead = await execPromise('git rev-parse HEAD');
      await execPromise(`git fetch origin ${branch}`);
      const remoteHead = await execPromise(`git rev-parse origin/${branch}`);
      
      if (localHead.trim() === remoteHead.trim()) {
        log('✓ 代码已是最新版本');
      } else {
        await execPromise(`git pull origin ${branch}`);
        log('✓ 代码已更新');
      }

      // 4. 备份当前代码
      const timestamp = Date.now();
      const backupDir = path.join(cwd, 'backup', timestamp.toString());
      log(`4. 备份到 ${backupDir}...`);
      fs.mkdirSync(backupDir, { recursive: true });
      
      try {
        const srcDir = path.join(cwd, 'src');
        if (fs.existsSync(srcDir)) {
          fs.cpSync(srcDir, path.join(backupDir, 'src'), { recursive: true });
        }
        const distDir = path.join(cwd, '..', 'dist');
        if (fs.existsSync(distDir)) {
          fs.cpSync(distDir, path.join(backupDir, 'dist'), { recursive: true });
        }
        log('✓ 备份完成');
      } catch (error) {
        logger.warn('备份失败', { error: error.message });
      }

      // 5. 安装依赖
      log('5. 安装依赖...');
      const packageJson = path.join(cwd, 'package.json');
      if (fs.existsSync(packageJson)) {
        await execPromise('npm install --production --silent');
        log('✓ 依赖安装完成');
      }

      // 6. 构建前端（如果存在）
      const frontendDir = path.join(cwd, '..', 'frontend');
      if (fs.existsSync(path.join(frontendDir, 'package.json'))) {
        log('6. 构建前端...');
        await execPromise(`cd ${frontendDir} && npm install --silent && npm run build`);
        log('✓ 前端构建完成');
      }

      // 7. 重启 PM2 服务
      log('7. 重启服务...');
      try {
        process.env.PM2_HOME = '/www/server/panel/PM2';
        await execPromise('pm2 restart jhchat-backend --update-env');
        await new Promise(r => setTimeout(r, 5000));
        log('✓ 服务已重启');
      } catch (pm2Err) {
        logger.error('PM2 重启失败:', pm2Err);
        log('⚠ PM2 失败，请手动执行：pm2 restart jhchat-backend');
      }

      log('✓ Git 同步完成');
      
      res.json({
        success: true,
        message: '部署成功！',
        data: {
          branch,
          backup: backupDir,
          cwd,
          updated: localHead.trim() !== remoteHead.trim()
        }
      });

    } catch (error) {
      logger.error('[GitDeploy] 同步失败:', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: '部署失败：' + error.message,
        details: error.message,
        cwd: cwd
      });
    }
  }

  static async checkGitStatus(req, res) {
    try {
      const { exec } = require('child_process');
      const execAsync = (cmd) => new Promise((resolve) => {
        exec(cmd, { cwd: process.cwd() }, (_, stdout) => resolve(stdout?.trim() || ''));
      });

      const branch = '260413-feat-jhchat-refactor';
      const localCommit = await execAsync('git rev-parse HEAD');
      const remoteCommit = await execAsync(`git rev-parse origin/${branch}`);

      res.json({
        success: true,
        data: {
          upToDate: localCommit === remoteCommit,
          branch,
          commit: localCommit.substring(0, 7),
          cwd: process.cwd()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = GitDeployController;
