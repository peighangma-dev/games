const { exec } = require('child_process');
const { logger } = require('../../utils/logger');

/**
 * Git 同步部署控制器
 * 实现从 Git 仓库拉取代码并自动部署
 */
class GitDeployController {
  /**
   * Git 同步部署
   */
  static async gitSync(req, res) {
    const execPromise = (command, options = {}) => {
      return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(stderr || error.message));
          } else {
            resolve(stdout);
          }
        });
      });
    };

    const log = (message) => {
      logger.info('[GitDeploy] ' + message);
    };

    try {
      const gitRepoDir = '/www/wwwroot/games';
      const gitSubdir = 'jhchat';
      const prodDir = '/www/wwwroot/jhchat';
      const branch = '260413-feat-jhchat-refactor';

      log('开始 Git 同步部署...');

      // 步骤 1: 检查 Git 仓库
      log('步骤 1: 检查 Git 仓库...');
      await execPromise(`cd ${gitRepoDir} && git status`);
      log('✓ Git 仓库检查通过');

      // 步骤 2: 拉取最新代码
      log('步骤 2: 拉取最新代码...');
      const pullOutput = await execPromise(
        `cd ${gitRepoDir} && git fetch origin && git checkout ${branch} && git pull origin ${branch}`
      );
      log('✓ 代码拉取完成');

      // 步骤 3: 备份当前版本
      log('步骤 3: 备份当前版本...');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                        new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
      const backupDir = `${prodDir}/backup/deploy-${timestamp}`;
      
      await execPromise(`mkdir -p ${backupDir}`);
      await execPromise(`cp -r ${prodDir}/backend/src ${backupDir}/ 2>/dev/null || true`);
      await execPromise(`cp -r ${prodDir}/dist ${backupDir}/ 2>/dev/null || true`);
      await execPromise(`cp ${prodDir}/VERSION ${backupDir}/ 2>/dev/null || true`);
      log(`✓ 备份完成：${backupDir}`);

      // 步骤 4: 停止服务
      log('步骤 4: 停止服务...');
      await execPromise('fuser -k 3001/tcp 2>/dev/null || true');
      await new Promise(resolve => setTimeout(resolve, 2000));
      log('✓ 服务已停止');

      // 步骤 5: 同步代码到生产目录
      log('步骤 5: 同步代码到生产目录...');
      await execPromise(`rsync -av --delete ${gitRepoDir}/${gitSubdir}/backend/ ${prodDir}/backend/`);
      await execPromise(`rsync -av --delete ${gitRepoDir}/${gitSubdir}/frontend/ ${prodDir}/frontend/`);
      await execPromise(`rsync -av --delete ${gitRepoDir}/${gitSubdir}/scripts/ ${prodDir}/scripts/`);
      log('✓ 代码同步完成');

      // 步骤 6: 安装后端依赖
      log('步骤 6: 安装后端依赖...');
      const backendInstall = await execPromise(
        `cd ${prodDir}/backend && npm install --production 2>&1 | tail -5`
      );
      log('✓ 后端依赖安装完成');

      // 步骤 7: 安装前端依赖并编译
      log('步骤 7: 安装前端依赖并编译...');
      const frontendBuild = await execPromise(
        `cd ${prodDir}/frontend && npm install 2>&1 && npm run build 2>&1 | tail -10`
      );
      log('✓ 前端编译完成');

      // 步骤 8: 修复脚本 API 路径
      log('步骤 8: 修复脚本 API 路径...');
      await execPromise(
        `sed -i 's|/api/updates/|/api/admin/updates/|g' ${prodDir}/scripts/auto-update.sh 2>/dev/null || true`
      );
      log('✓ 脚本修复完成');

      // 步骤 9: 启动服务
      log('步骤 9: 启动服务...');
      await execPromise(`cd ${prodDir}/backend && nohup npm run dev > backend.log 2>&1 &`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 验证服务
      const { execSync } = require('child_process');
      try {
        execSync('curl -s http://localhost:3001/api/ping');
        log('✓ 服务启动成功');
      } catch (error) {
        throw new Error('服务启动失败，正在回滚...');
      }

      // 步骤 10: 更新版本号
      const newVersion = await execPromise(
        `cd ${gitRepoDir} && git describe --tags --always 2>/dev/null || echo "v1.2.0"`
      );
      const version = newVersion.trim();
      await execPromise(`echo "${version}" > ${prodDir}/VERSION`);
      log(`✓ 版本号已更新：${version}`);

      const message = `部署成功！版本：${version}\n备份目录：${backupDir}`;
      log(message);

      res.json({
        success: true,
        message: message,
        data: {
          version,
          backupDir,
          branch,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Git 同步部署失败', { error: error.message });
      
      // 尝试回滚
      try {
        logger.info('正在回滚...');
        await execPromise('fuser -k 3001/tcp 2>/dev/null || true');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 找到最新备份
        const latestBackup = await execPromise(
          `ls -t /www/wwwroot/jhchat/backup | head -1`
        );
        
        if (latestBackup.trim()) {
          const backupPath = `/www/wwwroot/jhchat/backup/${latestBackup.trim()}`;
          await execPromise(
            `cp -r ${backupPath}/backend-src/* /www/wwwroot/jhchat/backend/src/ 2>/dev/null || true`
          );
          await execPromise(
            `cp -r ${backupPath}/dist/* /www/wwwroot/jhchat/dist/ 2>/dev/null || true`
          );
          
          await execPromise(
            `cd /www/wwwroot/jhchat/backend && nohup npm run dev > backend.log 2>&1 &`
          );
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          logger.info('回滚完成');
        }
      } catch (rollbackError) {
        logger.error('回滚失败', { error: rollbackError.message });
      }
      
      res.status(500).json({
        success: false,
        message: '部署失败：' + error.message,
        error: error.message
      });
    }
  }

  /**
   * 检查 Git 仓库状态
   */
  static async checkGitStatus(req, res) {
    try {
      const gitRepoDir = '/www/wwwroot/games/jhchat';
      const branch = '260413-feat-jhchat-refactor';

      // 获取当前分支
      const currentBranch = execSync(
        `cd ${gitRepoDir} && git branch --show-current`,
        { encoding: 'utf8' }
      ).trim();

      // 获取最新提交
      const latestCommit = execSync(
        `cd ${gitRepoDir} && git log --oneline -1`,
        { encoding: 'utf8' }
      ).trim();

      // 检查是否有未提交的更改
      const hasChanges = execSync(
        `cd ${gitRepoDir} && git status --short`,
        { encoding: 'utf8' }
      ).trim();

      // 获取最新提交
      const latestCommit = execSync(
        `cd ${gitRepoDir} && git log --oneline -1`,
        { encoding: 'utf8' }
      ).trim();

      // 检查是否有未推送的提交
      const aheadBehind = execSync(
        `cd ${gitRepoDir} && git status --short`,
        { encoding: 'utf8' }
      ).trim();

      res.json({
        success: true,
        data: {
          currentBranch,
          latestCommit,
          hasUncommittedChanges: !!aheadBehind,
          repoDir: gitRepoDir
        }
      });
    } catch (error) {
      logger.error('检查 Git 状态失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: '检查 Git 状态失败：' + error.message
      });
    }
  }
}

module.exports = GitDeployController;
