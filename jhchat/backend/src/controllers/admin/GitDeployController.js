const { exec } = require('child_process');
const { logger } = require('../../utils/logger');

/**
 * Git 同步部署控制器 - 简化版
 */
class GitDeployController {
  static async gitSync(req, res) {
    const execPromise = (cmd) => {
      return new Promise((resolve, reject) => {
        exec(cmd, { timeout: 300000 }, (error, stdout, stderr) => {
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

    try {
      // 使用当前运行目录作为 Git 仓库和生产目录
      const prodDir = process.cwd();
      const gitRepoDir = prodDir;
      const branch = '260413-feat-jhchat-refactor';

      log('开始 Git 同步...');

      // 1. 检查 Git 仓库
      log('1. 检查 Git 仓库...');
      const gitStatus = await execPromise(`cd ${gitRepoDir} && git rev-parse --git-dir`);
      log('✓ Git 仓库存在：' + gitStatus.trim());

      // 2. 拉取最新代码
      log('2. 拉取最新代码...');
      await execPromise(`cd ${gitRepoDir} && git fetch origin ${branch}`);
      const localHead = await execPromise(`cd ${gitRepoDir} && git rev-parse HEAD`);
      const remoteHead = await execPromise(`cd ${gitRepoDir} && git rev-parse origin/${branch}`);
      
      if (localHead.trim() === remoteHead.trim()) {
        log('已是最新版本');
      } else {
        await execPromise(`cd ${gitRepoDir} && git checkout ${branch} && git pull origin ${branch}`);
        log('✓ 代码已更新');
      }

      // 3. 备份
      const timestamp = Date.now();
      const backupDir = `${prodDir}/backup/${timestamp}`;
      log(`3. 备份到 ${backupDir}...`);
      await execPromise(`mkdir -p ${backupDir}`);
      await execPromise(`cp -r ${prodDir}/backend/src ${backupDir}/src 2>/dev/null || true`);
      await execPromise(`cp -r ${prodDir}/dist ${backupDir}/dist 2>/dev/null || true`);
      log('✓ 备份完成');

      // 4. 同步代码（本地就是 Git 仓库，无需 rsync）
      log('4. 代码已在正确位置，跳过同步...');

      // 5. 安装依赖并构建
      log('5. 安装依赖...');
      await execPromise(`cd ${prodDir}/backend && npm install --production --silent`);
      await execPromise(`cd ${prodDir}/frontend && npm install --silent && npm run build`);
      log('✓ 依赖安装和构建完成');

      // 6. 重启 PM2 服务
      log('6. 重启 PM2 服务...');
      try {
        process.env.PM2_HOME = '/www/server/panel/PM2';
        await execPromise('pm2 restart jhchat-backend --update-env');
        await new Promise(r => setTimeout(r, 5000));
        log('✓ PM2 服务已重启');
      } catch (pm2Err) {
        logger.error('PM2 重启失败:', pm2Err);
        log('⚠ PM2 失败，服务可能需要手动重启');
      }

      log('✓ Git 同步完成');
      
      res.json({
        success: true,
        message: '部署成功！请手动重启 PM2 服务：pm2 restart jhchat-backend',
        data: {
          branch,
          backup: backupDir,
          updated: localHead.trim() !== remoteHead.trim()
        }
      });

    } catch (error) {
      logger.error('[GitDeploy] 同步失败:', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: '部署失败：' + error.message,
        details: error.message
      });
    }
  }

  static async checkGitStatus(req, res) {
    try {
      const gitRepoDir = '/www/wwwroot/games';
      const branch = '260413-feat-jhchat-refactor';

      const { exec } = require('child_process');
      const execAsync = (cmd) => new Promise((resolve) => {
        exec(cmd, (_, stdout) => resolve(stdout?.trim() || ''));
      });

      const localCommit = await execAsync(`cd ${gitRepoDir} && git rev-parse HEAD`);
      const remoteCommit = await execAsync(`cd ${gitRepoDir} && git rev-parse origin/${branch}`);

      res.json({
        success: true,
        data: {
          upToDate: localCommit === remoteCommit,
          branch,
          commit: localCommit.substring(0, 7)
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
