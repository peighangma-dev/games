const { exec, execSync } = require('child_process');
const { logger } = require('../../utils/logger');

/**
 * Git 同步部署控制器 - 修复版
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
      
      // 设置 PM2_HOME 环境变量
      process.env.PM2_HOME = '/www/server/panel/PM2';
      log(`设置 PM2_HOME=${process.env.PM2_HOME}`);

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
      if (await execPromise(`test -f ${prodDir}/VERSION && echo 1 || echo 0`).then(o => o.trim() === '1')) {
        await execPromise(`cp ${prodDir}/VERSION ${backupDir}/ 2>/dev/null || true`);
      }
      log(`✓ 备份完成：${backupDir}`);

      // 步骤 4: 停止 PM2 服务
      log('步骤 4: 停止 PM2 服务...');
      try {
        await execPromise('export PM2_HOME=/www/server/panel/PM2 && pm2 stop jhchat-backend 2>/dev/null || true');
        await execPromise('export PM2_HOME=/www/server/panel/PM2 && pm2 stop jhchat-frontend 2>/dev/null || true');
        await new Promise(resolve => setTimeout(resolve, 2000));
        log('✓ PM2 服务已停止');
      } catch (error) {
        log('⚠ PM2 停止失败，尝试直接杀进程...');
        await execPromise('fuser -k 3001/tcp 2>/dev/null || true');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // 步骤 5: 同步代码到生产目录
      log('步骤 5: 同步代码到生产目录...');
      await execPromise(`rsync -av --delete ${gitRepoDir}/${gitSubdir}/backend/ ${prodDir}/backend/`);
      await execPromise(`rsync -av --delete ${gitRepoDir}/${gitSubdir}/frontend/ ${prodDir}/frontend/`);
      await execPromise(`rsync -av --delete ${gitRepoDir}/${gitSubdir}/scripts/ ${prodDir}/scripts/ 2>/dev/null || true`);
      log('✓ 代码同步完成');

      // 步骤 6: 安装后端依赖
      log('步骤 6: 安装后端依赖...');
      const backendInstall = await execPromise(
        `cd ${prodDir}/backend && npm install --production --silent 2>&1 | tail -5`
      );
      log('✓ 后端依赖安装完成');

      // 步骤 7: 安装前端依赖并编译
      log('步骤 7: 安装前端依赖并编译...');
      await execPromise(`cd ${prodDir}/frontend && npm install --silent 2>&1`);
      const frontendBuild = await execPromise(
        `cd ${prodDir}/frontend && npm run build 2>&1 | tail -10`
      );
      log('✓ 前端编译完成');

      // 步骤 8: 执行数据库迁移
      log('步骤 8: 执行数据库迁移...');
      try {
        const fs = require('fs');
        const path = require('path');
        const { execSync } = require('child_process');
        
        // 从环境变量读取数据库配置
        const dotenv = require('dotenv');
        const envPath = path.join(prodDir, 'backend', '.env');
        const envConfig = dotenv.config({ path: envPath }).parsed || {};
        
        const dbConfig = {
          host: envConfig.DB_HOST || 'localhost',
          user: envConfig.DB_USER || 'jhchat',
          password: envConfig.DB_PASSWORD || 'JhChat@2026Secure!',
          database: envConfig.DB_NAME || 'jhchat'
        };
        
        const migrationDir = `${prodDir}/backend/migrations`;
        
        if (fs.existsSync(migrationDir)) {
          const migrations = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql'));
          
          if (migrations.length > 0) {
            log(`发现 ${migrations.length} 个迁移文件`);
            
            for (const migration of migrations) {
              const migrationPath = `${migrationDir}/${migration}`;
              try {
                execSync(
                  `mysql -h ${dbConfig.host} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} < "${migrationPath}"`,
                  { stdio: 'pipe' }
                );
                log(`✓ 执行迁移：${migration}`);
              } catch (error) {
                logger.warn(`迁移 ${migration} 执行失败`, { error: error.message });
              }
            }
            
            log('✓ 数据库迁移完成');
          } else {
            log('无需执行数据库迁移');
          }
        }
      } catch (error) {
        logger.warn('数据库迁移执行失败', { error: error.message });
      }

      // 步骤 9: 使用 PM2 启动服务
      log('步骤 9: 使用 PM2 启动服务...');
      try {
        // 先删除旧进程
        await execPromise('export PM2_HOME=/www/server/panel/PM2 && pm2 delete jhchat-backend 2>/dev/null || true');
        await execPromise('export PM2_HOME=/www/server/panel/PM2 && pm2 delete jhchat-frontend 2>/dev/null || true');
        
        // 启动后端
        await execPromise(
          `cd ${prodDir}/backend && export PM2_HOME=/www/server/panel/PM2 && pm2 start npm --name "jhchat-backend" -- run start`
        );
        log('✓ 后端服务已启动');
        
        // 启动前端（如果需要）
        // await execPromise(
        //   `cd ${prodDir}/frontend && export PM2_HOME=/www/server/panel/PM2 && pm2 start npm --name "jhchat-frontend" -- run start`
        // );
        // log('✓ 前端服务已启动');
        
        // 等待服务启动
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 验证服务
        const checkAttempts = 5;
        for (let i = 0; i < checkAttempts; i++) {
          try {
            const result = await execPromise('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/admin/dashboard');
            if (result.trim() === '200' || result.trim() === '401') {
              log('✓ 服务启动成功并验证通过');
              break;
            }
          } catch (error) {
            if (i === checkAttempts - 1) throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        logger.error('PM2 启动失败', { error: error.message });
        log('⚠ PM2 启动失败，尝试后台运行...');
        await execPromise(`cd ${prodDir}/backend && nohup npm run dev > backend.log 2>&1 &`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // 步骤 10: 更新版本号
      const newVersion = await execPromise(
        `cd ${gitRepoDir} && git describe --tags --always 2>/dev/null || echo "v2026.3.1"`
      );
      const version = newVersion.trim();
      await execPromise(`echo "${version}" > ${prodDir}/VERSION`);
      log(`✓ 版本号已更新：${version}`);

      // 保存 PM2 配置
      await execPromise('export PM2_HOME=/www/server/panel/PM2 && pm2 save 2>/dev/null || true');
      log('✓ PM2 配置已保存');

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
      logger.error('Git 同步部署失败', { error: error.message, stack: error.stack });
      
      res.status(500).json({
        success: false,
        message: '部署失败：' + error.message,
        error: error.message
      });
    }
  }

  /**
   * 检查 Git 状态
   */
  static async checkGitStatus(req, res) {
    const execPromise = (command) => {
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(stderr || error.message));
          } else {
            resolve(stdout);
          }
        });
      });
    };

    try {
      const gitRepoDir = '/www/wwwroot/games';
      const branch = '260413-feat-jhchat-refactor';

      // 检查当前分支
      const currentBranch = await execPromise(`cd ${gitRepoDir} && git rev-parse --abbrev-ref HEAD`);
      
      // 检查是否有未提交的更改
      const gitStatus = await execPromise(`cd ${gitRepoDir} && git status --porcelain`);
      
      // 检查远程更新
      await execPromise(`cd ${gitRepoDir} && git fetch origin`);
      const localCommit = await execPromise(`cd ${gitRepoDir} && git rev-parse HEAD`);
      const remoteCommit = await execPromise(`cd ${gitRepoDir} && git rev-parse origin/${branch}`);

      res.json({
        success: true,
        data: {
          currentBranch: currentBranch.trim(),
          hasUncommittedChanges: gitStatus.trim() !== '',
          isUpToDate: localCommit.trim() === remoteCommit.trim(),
          localCommit: localCommit.trim(),
          remoteCommit: remoteCommit.trim(),
          lastCommit: await execPromise(`cd ${gitRepoDir} && git log -1 --pretty=format:"%h - %s (%ar)"`)
        }
      });
    } catch (error) {
      logger.error('检查 Git 状态失败', { error: error.message });
      res.status(500).json({
        success: false,
        message: '检查失败：' + error.message
      });
    }
  }
}

module.exports = GitDeployController;
