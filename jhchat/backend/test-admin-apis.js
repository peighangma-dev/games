const http = require('http');

const BASE_URL = 'http://localhost:3001';

// 更新为实际的路由路径
const endpoints = [
  // 房间管理
  { name: '房间管理 - 列表', method: 'GET', path: '/api/admin/rooms' },
  
  // 商店物品管理
  { name: '商店物品 - 列表', method: 'GET', path: '/api/admin/shop-items' },
  
  // 物品管理
  { name: '物品管理 - 列表', method: 'GET', path: '/api/admin/items' },
  
  // 武功秘籍管理
  { name: '武功秘籍 - 列表', method: 'GET', path: '/api/admin/secret-skills' },
  
  // 任务管理
  { name: '任务管理 - 列表', method: 'GET', path: '/api/admin/quests' },
  
  // 门派管理
  { name: '门派管理 - 列表', method: 'GET', path: '/api/admin/sects' },
  
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
  
  // 仪表盘
  { name: '仪表盘', method: 'GET', path: '/api/admin/dashboard' },
];

function request(method, path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
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
  console.log('  后台管理接口测试（无需认证）');
  console.log('========================================\n');

  const results = [];
  const summary = {
    success: 0,
    authRequired: 0,
    notFound: 0,
    failed: 0,
    total: endpoints.length,
  };

  for (const endpoint of endpoints) {
    const result = await request(endpoint.method, endpoint.path);
    
    let status, message;
    if (result.status === 0) {
      status = '❌ 连接失败';
      message = result.error;
      summary.failed++;
    } else if (result.status === 401) {
      status = '🔒 需认证';
      summary.authRequired++;
    } else if (result.status === 404) {
      status = '❌ 未找到';
      summary.notFound++;
    } else if (result.status >= 200 && result.status < 300) {
      status = '✅ 成功';
      summary.success++;
    } else {
      status = '❌ HTTP 错误';
      message = result.data?.message || `HTTP ${result.status}`;
      summary.failed++;
    }

    results.push({ name: endpoint.name, status, code: result.status, message });

    if (status.includes('✅')) {
      console.log(`✅ ${endpoint.name} - HTTP ${result.status}`);
    } else if (status.includes('🔒')) {
      console.log(`🔒 ${endpoint.name} - 需要管理员认证`);
    } else if (status.includes('❌')) {
      console.log(`${status} ${endpoint.name} - HTTP ${result.status} - ${message || ''}`);
    }
  }

  console.log('\n========================================');
  console.log('  测试总结');
  console.log('========================================');
  console.log(`总测试数：${summary.total}`);
  console.log(`✅ 成功：${summary.success}`);
  console.log(`🔒 需认证：${summary.authRequired}`);
  console.log(`❌ 未找到：${summary.notFound}`);
  console.log(`❌ 失败：${summary.failed}`);
  console.log('========================================\n');

  // 输出详细 404 信息
  const notFound = results.filter(r => r.status === '❌ 未找到');
  if (notFound.length > 0) {
    console.log('\n404 未找到的接口：\n');
    notFound.forEach(f => {
      console.log(`${f.name}: ${f.message || ''}`);
    });
    console.log('\n这些接口需要在路由配置中添加。\n');
  }

  return summary;
}

// 运行测试
runTests().catch(console.error);
