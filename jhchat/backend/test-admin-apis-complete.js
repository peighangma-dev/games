const http = require('http');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3001';

// 使用 curl 获取 token（避免 Node.js 中文字符问题）
function getToken() {
  try {
    const output = execSync(
      `curl -s -X POST http://localhost:3001/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"站长","password":"admin123"}'`,
      { encoding: 'utf8' }
    );
    
    const result = JSON.parse(output);
    if (result.success && result.data?.token) {
      return result.data.token;
    } else {
      throw new Error('获取 token 失败：' + result.message);
    }
  } catch (error) {
    console.error('获取 token 错误:', error.message);
    throw error;
  }
}

const endpoints = [
  // 仪表盘
  { name: '仪表盘', method: 'GET', path: '/api/admin/dashboard' },
  { name: '实时数据', method: 'GET', path: '/api/admin/dashboard/realtime' },
  { name: '图表数据', method: 'GET', path: '/api/admin/dashboard/charts' },
  
  // 房间管理
  { name: '房间管理 - 列表', method: 'GET', path: '/api/admin/rooms' },
  
  // 商店物品管理
  { name: '商店物品 - 列表', method: 'GET', path: '/api/admin/shop-items' },
  { name: '商店物品 - 详情 (ID:1)', method: 'GET', path: '/api/admin/shop-items/1' },
  
  // 物品管理
  { name: '物品管理 - 列表', method: 'GET', path: '/api/admin/items' },
  { name: '物品管理 - 详情 (ID:1)', method: 'GET', path: '/api/admin/items/1' },
  
  // 武功秘籍管理
  { name: '武功秘籍 - 列表', method: 'GET', path: '/api/admin/secret-skills' },
  { name: '武功秘籍 - 详情 (ID:1)', method: 'GET', path: '/api/admin/secret-skills/1' },
  
  // 任务管理
  { name: '任务管理 - 列表', method: 'GET', path: '/api/admin/quests' },
  { name: '任务管理 - 详情 (ID:1)', method: 'GET', path: '/api/admin/quests/1' },
  
  // 门派管理
  { name: '门派管理 - 列表', method: 'GET', path: '/api/admin/sects' },
  { name: '门派管理 - 详情 (ID:1)', method: 'GET', path: '/api/admin/sects/1' },
  
  // 经济监控
  { name: '经济监控 - 统计', method: 'GET', path: '/api/admin/economy/stats' },
  { name: '经济监控 - 富豪榜', method: 'GET', path: '/api/admin/economy/rich-list' },
  
  // 市场管理
  { name: '市场管理 - 列表', method: 'GET', path: '/api/admin/market/listings' },
  
  // 统计分析
  { name: '统计 - 在线', method: 'GET', path: '/api/admin/statistics/online' },
  { name: '统计 - 注册', method: 'GET', path: '/api/admin/statistics/registration' },
  { name: '统计 - 聊天', method: 'GET', path: '/api/admin/statistics/chat' },
  { name: '统计 - 经济', method: 'GET', path: '/api/admin/statistics/economy' },
  
  // 公告管理
  { name: '公告管理 - 列表', method: 'GET', path: '/api/admin/news' },
  { name: '公告管理 - 详情 (ID:1)', method: 'GET', path: '/api/admin/news/1' },
];

function request(method, path, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            success: parsed.success !== undefined ? parsed.success : true,
            data: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: data.substring(0, 200),
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        success: false,
        error: error.message,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        status: 0,
        success: false,
        error: '请求超时',
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('\n========================================');
  console.log('  后台管理接口完整测试');
  console.log('========================================\n');

  // 获取 token
  let token;
  try {
    token = getToken();
    console.log('✅ 获取管理员 token 成功\n');
  } catch (error) {
    console.log('❌ 获取管理员 token 失败:', error.message);
    console.log('\n无法继续测试，退出...\n');
    return;
  }

  const results = [];
  const summary = {
    success: 0,
    businessError: 0,
    notFound: 0,
    serverError: 0,
    total: endpoints.length,
  };

  for (const endpoint of endpoints) {
    const result = await request(endpoint.method, endpoint.path, token);
    
    let status, message;
    if (result.status === 0) {
      status = '❌ 连接失败';
      message = result.error;
      summary.serverError++;
    } else if (result.status >= 200 && result.status < 300) {
      if (result.success !== false || endpoint.method === 'DELETE') {
        status = '✅ 成功';
        summary.success++;
      } else {
        status = '⚠️ 业务失败';
        message = result.data?.message || '未知错误';
        summary.businessError++;
      }
    } else if (result.status === 404) {
      status = '❌ 未找到';
      summary.notFound++;
    } else if (result.status >= 500) {
      status = '❌ 服务器错误';
      message = result.data?.message || `HTTP ${result.status}`;
      summary.serverError++;
    } else {
      status = '❌ HTTP 错误';
      message = result.data?.message || `HTTP ${result.status}`;
      summary.serverError++;
    }

    results.push({ name: endpoint.name, status, code: result.status, message, data: result.data });

    if (status.includes('✅')) {
      console.log(`✅ ${endpoint.name} - HTTP ${result.status}`);
    } else if (status.includes('⚠️')) {
      console.log(`⚠️ ${endpoint.name} - ${message}`);
    } else {
      console.log(`${status} ${endpoint.name} - HTTP ${result.status} - ${message || ''}`);
    }
  }

  console.log('\n========================================');
  console.log('  测试总结');
  console.log('========================================');
  console.log(`总测试数：${summary.total}`);
  console.log(`✅ 成功：${summary.success}`);
  console.log(`⚠️ 业务失败：${summary.businessError}`);
  console.log(`❌ 未找到：${summary.notFound}`);
  console.log(`❌ 服务器错误：${summary.serverError}`);
  if (summary.total > 0) {
    const successRate = ((summary.success / summary.total) * 100).toFixed(1);
    console.log(`成功率：${successRate}%`);
  }
  console.log('========================================\n');

  // 输出失败详情
  const failures = results.filter(r => !r.status.includes('✅'));
  if (failures.length > 0) {
    console.log('\n详细失败信息：\n');
    failures.forEach(f => {
      console.log(`${f.name}:`);
      console.log(`  状态：${f.status}`);
      console.log(`  HTTP: ${f.code}`);
      if (f.message) console.log(`  消息：${f.message}`);
      if (f.data && typeof f.data === 'object') {
        console.log(`  详情:`, JSON.stringify(f.data, null, 2).substring(0, 500));
      }
      console.log('');
    });
  }

  return summary;
}

// 运行测试
runTests().catch(console.error);
