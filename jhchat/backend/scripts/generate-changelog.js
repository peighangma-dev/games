#!/usr/bin/env node

/**
 * 从 Git 提交历史生成更新日志
 * 使用方法：node scripts/generate-changelog.js v1.2.0 [start-tag]
 */

const { execSync } = require('child_process');

function getGitCommits(sinceTag) {
  let command = 'git log --oneline';
  
  if (sinceTag) {
    command += ` ${sinceTag}..HEAD`;
  } else {
    command += ' -20'; // 默认取最近 20 条
  }
  
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    return output.trim().split('\n').filter(line => line);
  } catch (error) {
    console.error('获取 Git 提交失败:', error.message);
    return [];
  }
}

function parseCommits(commits) {
  const changes = {
    feat: [],
    fix: [],
    docs: [],
    refactor: [],
    chore: []
  };
  
  commits.forEach(commit => {
    const match = commit.match(/^[a-f0-9]+\s+(\w+)(?:\(([^)]+)\))?:\s*(.+)/);
    if (match) {
      const [, type, scope, message] = match;
      const entry = scope ? `${scope}: ${message}` : message;
      
      if (changes[type]) {
        changes[type].push(entry);
      } else {
        changes.chore.push(entry);
      }
    } else {
      changes.chore.push(commit);
    }
  });
  
  return changes;
}

function generateChangelog(version, sinceTag) {
  const commits = getGitCommits(sinceTag);
  
  if (commits.length === 0) {
    console.log('没有新的提交记录');
    return null;
  }
  
  const changes = parseCommits(commits);
  const changesList = [];
  
  if (changes.feat.length > 0) {
    changesList.push(...changes.feat.map(c => `✨ ${c}`));
  }
  if (changes.fix.length > 0) {
    changesList.push(...changes.fix.map(c => `🐛 ${c}`));
  }
  if (changes.refactor.length > 0) {
    changesList.push(...changes.refactor.map(c => `♻️ ${c}`));
  }
  if (changes.docs.length > 0) {
    changesList.push(...changes.docs.map(c => `📝 ${c}`));
  }
  if (changes.chore.length > 0) {
    changesList.push(...changes.chore.map(c => `🔧 ${c}`));
  }
  
  return {
    version,
    title: `版本 ${version} 更新`,
    description: `共 ${commits.length} 项更新`,
    changes: changesList,
    type: version.includes('major') ? 'major' : 
          version.includes('minor') ? 'minor' : 'patch'
  };
}

// Main
const [,, version, sinceTag] = process.argv;

if (!version) {
  console.error('用法：node generate-changelog.js <version> [since-tag]');
  console.error('示例：node generate-changelog.js v1.2.0 v1.1.0');
  process.exit(1);
}

const changelog = generateChangelog(version, sinceTag);

if (changelog) {
  console.log('\n=== 生成的更新日志 ===\n');
  console.log(`版本：${changelog.version}`);
  console.log(`标题：${changelog.title}`);
  console.log(`类型：${changelog.type}`);
  console.log('\n更新内容：');
  changelog.changes.forEach(change => {
    console.log(`  - ${change}`);
  });
  
  console.log('\n=== JSON 格式 (可直接用于 API) ===\n');
  console.log(JSON.stringify({
    version: changelog.version,
    title: changelog.title,
    description: changelog.description,
    changes: changelog.changes,
    type: changelog.type,
    priority: 'normal',
    force_update: false,
    breaking_changes: false
  }, null, 2));
}
