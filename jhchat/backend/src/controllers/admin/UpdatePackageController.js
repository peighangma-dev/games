const db = require('../../config/db');
const { logger } = require('../../utils/logger');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const archiver = require('archiver');

const UPDATE_PACKAGE_PATH = path.join(__dirname, '..', '..', '..', 'update-packages');

/**
 * 更新包管理控制器
 * 提供更新包生成、下载、安装等功能
 */
class UpdatePackageController {
  /**
   * 生成更新包
   */
  static async generatePackage(req, res) {
    try {
      const { update_id } = req.body;
      
      if (!update_id) {
        return res.status(400).json({
          success: false,
          message: '缺少 update_id 参数',
          code: 'MISSING_UPDATE_ID'
        });
      }

      // 获取更新记录
      const [updates] = await db.execute(
        'SELECT * FROM system_updates WHERE id = ?',
        [update_id]
      );

      if (updates.length === 0) {
        return res.status(404).json({
          success: false,
          message: '更新记录不存在',
          code: 'UPDATE_NOT_FOUND'
        });
      }

      const update = updates[0];
      if (update.status !== 'released') {
        return res.status(400).json({
          success: false,
          message: '只能为已发布的更新生成包',
          code: 'NOT_RELEASED'
        });
      }

      // 创建更新包目录
      if (!fs.existsSync(UPDATE_PACKAGE_PATH)) {
        fs.mkdirSync(UPDATE_PACKAGE_PATH, { recursive: true });
      }

      const packageFileName = `update-${update.version}-${Date.now()}.zip`;
      const packagePath = path.join(UPDATE_PACKAGE_PATH, packageFileName);
      const packageHashPath = packagePath + '.sha256';

      // 从 Git 生成更新包
      await this.createGitPackage(update.version, packagePath);

      // 计算文件哈希
      const fileHash = this.calculateFileHash(packagePath);
      fs.writeFileSync(packageHashPath, fileHash);

      // 计算文件大小
      const stats = fs.statSync(packagePath);
      const fileSize = stats.size;

      // 更新数据库记录
      await db.execute(
        `UPDATE system_updates 
         SET release_note = ?, 
             metadata = JSON_SET(COALESCE(metadata, '{}'), 
               '$.package_file', ?, 
               '$.package_hash', ?, 
               '$.package_size', ?)
         WHERE id = ?`,
        [
          update.release_note || `更新包已生成：${packageFileName}`,
          packageFileName,
          fileHash,
          fileSize,
          update_id
        ]
      );

      logger.info('生成更新包', {
        operator: req.user?.username,
        update_id,
        version: update.version,
        package: packageFileName,
        size: fileSize,
        hash: fileHash
      });

      res.json({
        success: true,
        data: {
          package_file: packageFileName,
          package_path: packagePath,
          package_hash: fileHash,
          package_size: fileSize,
          version: update.version
        },
        message: '更新包生成成功'
      });
    } catch (err) {
      logger.error('生成更新包失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '生成更新包失败',
        code: 'GENERATE_PACKAGE_ERROR',
        error: err.message
      });
    }
  }

  /**
   * 从 Git 创建更新包
   */
  static async createGitPackage(version, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const workspaceRoot = path.join(__dirname, '..', '..', '..', '..');
        const diffOutputPath = path.join(UPDATE_PACKAGE_PATH, 'diff.txt');

        // 获取上一次的标签
        const getPreviousTag = () => {
          try {
            const prevTag = execSync(
              `cd ${workspaceRoot} && git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo ""`,
              { encoding: 'utf-8' }
            ).trim();
            return prevTag || 'HEAD~20';
          } catch {
            return 'HEAD~20';
          }
        };

        const sinceCommit = getPreviousTag();

        // 获取变更文件列表
        const changedFiles = execSync(
          `cd ${workspaceRoot} && git diff --name-only ${sinceCommit} HEAD`,
          { encoding: 'utf-8' }
        ).trim().split('\n').filter(f => f);

        if (changedFiles.length === 0 || (changedFiles.length === 1 && !changedFiles[0])) {
          // 如果没有变更，创建一个空包
          fs.writeFileSync(outputPath, '');
          return resolve(outputPath);
        }

        // 过滤只包含 jhchat 目录的文件
        const jhchatFiles = changedFiles
          .filter(f => f.startsWith('jhchat/'))
          .filter(f => !f.includes('.git') && !f.includes('node_modules'));

        if (jhchatFiles.length === 0) {
          fs.writeFileSync(outputPath, '');
          return resolve(outputPath);
        }

        // 创建临时目录
        const tempDir = path.join(UPDATE_PACKAGE_PATH, 'temp-' + Date.now());
        fs.mkdirSync(tempDir, { recursive: true });

        // 复制文件到临时目录
        jhchatFiles.forEach(file => {
          const srcPath = path.join(workspaceRoot, file);
          const dstPath = path.join(tempDir, file);
          
          if (fs.existsSync(srcPath)) {
            const dstDir = path.dirname(dstPath);
            fs.mkdirSync(dstDir, { recursive: true });
            fs.copyFileSync(srcPath, dstPath);
            logger.info('打包文件', { file });
          }
        });

        // 创建版本信息文件
        const versionInfo = {
          version,
          generated_at: new Date().toISOString(),
          files: jhchatFiles,
          file_count: jhchatFiles.length
        };
        fs.writeFileSync(
          path.join(tempDir, 'UPDATE_INFO.json'),
          JSON.stringify(versionInfo, null, 2)
        );

        // 创建压缩包
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
          // 清理临时目录
          fs.rmSync(tempDir, { recursive: true, force: true });
          resolve(outputPath);
        });

        archive.on('error', (err) => {
          fs.rmSync(tempDir, { recursive: true, force: true });
          reject(err);
        });

        archive.pipe(output);
        archive.directory(tempDir, false);
        archive.finalize();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 计算文件 SHA256 哈希
   */
  static calculateFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  /**
   * 下载更新包
   */
  static async downloadPackage(req, res) {
    try {
      const { update_id } = req.params;

      const [updates] = await db.execute(
        `SELECT * FROM system_updates 
         WHERE id = ? AND status = 'released'`,
        [update_id]
      );

      if (updates.length === 0) {
        return res.status(404).json({
          success: false,
          message: '更新记录不存在或未发布',
          code: 'UPDATE_NOT_FOUND'
        });
      }

      const update = updates[0];
      const metadata = update.metadata ? JSON.parse(update.metadata) : null;

      if (!metadata?.package_file) {
        return res.status(404).json({
          success: false,
          message: '更新包尚未生成',
          code: 'PACKAGE_NOT_FOUND'
        });
      }

      const packagePath = path.join(UPDATE_PACKAGE_PATH, metadata.package_file);

      if (!fs.existsSync(packagePath)) {
        return res.status(404).json({
          success: false,
          message: '更新包文件不存在',
          code: 'FILE_NOT_FOUND'
        });
      }

      // 设置下载头
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${metadata.package_file}"`);
      res.setHeader('X-Update-Version', update.version);
      res.setHeader('X-Update-Hash', metadata.package_hash);
      res.setHeader('X-Update-Size', metadata.package_size);

      // 发送文件
      const fileStream = fs.createReadStream(packagePath);
      fileStream.pipe(res);

    } catch (err) {
      logger.error('下载更新包失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '下载更新包失败',
        code: 'DOWNLOAD_ERROR'
      });
    }
  }

  /**
   * 获取更新包列表
   */
  static async getPackages(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const [packages] = await db.execute(
        `SELECT id, version, title, type, priority, status, 
                release_date, 
                JSON_EXTRACT(metadata, '$.package_file') as package_file,
                JSON_EXTRACT(metadata, '$.package_hash') as package_hash,
                JSON_EXTRACT(metadata, '$.package_size') as package_size
         FROM system_updates 
         WHERE status = 'released' 
           AND metadata IS NOT NULL 
           AND JSON_EXTRACT(metadata, '$.package_file') IS NOT NULL
         ORDER BY version_code DESC
         LIMIT ? OFFSET ?`,
        [parseInt(limit), offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total 
         FROM system_updates 
         WHERE status = 'released' 
           AND metadata IS NOT NULL 
           AND JSON_EXTRACT(metadata, '$.package_file') IS NOT NULL`
      );

      res.json({
        success: true,
        data: {
          packages,
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (err) {
      logger.error('获取更新包列表失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取更新包列表失败',
        code: 'GET_PACKAGES_ERROR'
      });
    }
  }

  /**
   * 生产端：获取可用更新包
   */
  static async getAvailablePackages(req, res) {
    try {
      const { currentVersion } = req.query;

      if (!currentVersion) {
        return res.status(400).json({
          success: false,
          message: '缺少 currentVersion 参数',
          code: 'MISSING_VERSION'
        });
      }

      // 解析当前版本号
      const versionMatch = currentVersion.match(/v(\d+)\.(\d+)\.(\d+)/);
      if (!versionMatch) {
        return res.status(400).json({
          success: false,
          message: '版本号格式错误',
          code: 'INVALID_VERSION_FORMAT'
        });
      }

      const currentVersionCode = parseInt(versionMatch[1]) * 10000 +
                                  parseInt(versionMatch[2]) * 100 +
                                  parseInt(versionMatch[3]);

      // 查询更新的版本（包含包信息）
      const [updates] = await db.execute(
        `SELECT id, version, version_code, title, description, type, 
                priority, force_update, release_date,
                JSON_EXTRACT(metadata, '$.package_file') as package_file,
                JSON_EXTRACT(metadata, '$.package_hash') as package_hash,
                JSON_EXTRACT(metadata, '$.package_size') as package_size,
                JSON_EXTRACT(metadata, '$.breaking_changes') as breaking_changes
         FROM system_updates 
         WHERE status = 'released' 
           AND version_code > ?
           AND metadata IS NOT NULL
           AND JSON_EXTRACT(metadata, '$.package_file') IS NOT NULL
         ORDER BY version_code ASC`,
        [currentVersionCode]
      );

      const baseUrl = `${req.protocol}://${req.get('host')}`;

      res.json({
        success: true,
        data: {
          hasUpdate: updates.length > 0,
          currentVersion,
          updates: updates.map(u => ({
            id: u.id,
            version: u.version,
            versionCode: u.version_code,
            title: u.title,
            type: u.type,
            priority: u.priority,
            forceUpdate: !!u.force_update,
            releaseDate: u.release_date,
            breakingChanges: !!u.breaking_changes,
            package: {
              file: u.package_file,
              hash: u.package_hash,
              size: u.package_size,
              download_url: `${baseUrl}/api/updates/packages/${u.id}/download`
            }
          }))
        }
      });
    } catch (err) {
      logger.error('获取可用更新包失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '获取可用更新包失败',
        code: 'GET_AVAILABLE_PACKAGES_ERROR'
      });
    }
  }

  /**
   * 记录安装状态
   */
  static async recordInstallation(req, res) {
    try {
      const { update_id } = req.params;
      const {
        status = 'success',
        error_message,
        server_url,
        installed_by
      } = req.body;

      // 检查更新记录
      const [updates] = await db.execute(
        'SELECT id FROM system_updates WHERE id = ?',
        [update_id]
      );

      if (updates.length === 0) {
        return res.status(404).json({
          success: false,
          message: '更新记录不存在',
          code: 'UPDATE_NOT_FOUND'
        });
      }

      // 查找或创建推送记录
      let [logs] = await db.execute(
        'SELECT id FROM update_push_logs WHERE update_id = ? AND environment = "production"',
        [update_id]
      );

      if (logs.length > 0) {
        // 更新现有记录
        await db.execute(
          `UPDATE update_push_logs 
           SET push_status = ?, 
               push_time = NOW(),
               acknowledge_time = NOW(),
               acknowledge_by = ?,
               server_url = ?,
               error_message = ?,
               rollback_status = ?
           WHERE id = ?`,
          [
            status === 'success' ? 'success' : 'failed',
            installed_by || 'production-server',
            server_url || null,
            error_message || null,
            status === 'failed' ? 'failed' : 'none',
            logs[0].id
          ]
        );
      } else {
        // 创建新记录
        await db.execute(
          `INSERT INTO update_push_logs 
           (update_id, version, environment, push_status, push_time, acknowledge_time, 
            acknowledge_by, server_url, error_message)
           SELECT ?, version, 'production', ?, NOW(), NOW(), ?, ?, ?
           FROM system_updates WHERE id = ?`,
          [
            update_id,
            status === 'success' ? 'success' : 'failed',
            installed_by || 'production-server',
            server_url || null,
            error_message || null,
            update_id
          ]
        );
      }

      logger.info('记录更新安装', {
        update_id,
        status,
        server_url,
        installed_by
      });

      res.json({
        success: true,
        message: '安装状态已记录'
      });
    } catch (err) {
      logger.error('记录安装状态失败', { error: err.message });
      res.status(500).json({
        success: false,
        message: '记录安装状态失败',
        code: 'RECORD_INSTALLATION_ERROR'
      });
    }
  }
}

module.exports = UpdatePackageController;
