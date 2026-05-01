#!/usr/bin/env node

/**
 * 游戏系统测试脚本
 * 测试增强后的游戏 API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/games';
const TEST_USERNAME = '东方不败'; // 使用现有用户

// 模拟登录获取 token
async function login(username) {
  try {
    // 直接获取用户信息（绕过密码验证）
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'jhchat',
      password: 'JhChat@2026Secure!',
      database: 'jhchat'
    });
    
    const [users] = await connection.execute(
      'SELECT id, username, grade FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      console.error('❌ 用户不存在');
      process.exit(1);
    }
    
    await connection.end();
    
    // 生成简单 token（仅用于测试）
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: users[0].id, username: users[0].username, grade: users[0].grade },
      process.env.JWT_SECRET || 'jhchat-secret-key-change-in-production-2026',
      { expiresIn: '1h' }
    );
    
    return token;
  } catch (error) {
    console.error('登录失败:', error.message);
    process.exit(1);
  }
}

// 测试 21 点游戏
async function testBlackjack(token) {
  console.log('\n🎰 测试 21 点游戏...');
  
  try {
    // 下注
    const betRes = await axios.post(
      `${BASE_URL}/blackjack/bet`,
      { bet: 100 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (betRes.data.success) {
      console.log('✅ 下注成功');
      console.log('   手牌:', betRes.data.data.playerCards);
      console.log('   点数:', betRes.data.data.playerPoints);
      console.log('   庄家:', betRes.data.data.dealerCards);
      console.log('   连胜:', betRes.data.data.streak || 0);
      
      // 如果要牌
      if (betRes.data.data.playerPoints < 21) {
        const hitRes = await axios.post(
          `${BASE_URL}/blackjack/hit`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (hitRes.data.success) {
          console.log('✅ 要牌成功');
          console.log('   新手牌:', hitRes.data.data.playerCards);
          console.log('   新点数:', hitRes.data.data.playerPoints);
          
          if (hitRes.data.data.playerPoints <= 21) {
            // 停牌
            const standRes = await axios.post(
              `${BASE_URL}/blackjack/stand`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (standRes.data.success) {
              console.log('✅ 停牌结果:', standRes.data.data.result);
              console.log('   庄家牌:', standRes.data.data.dealerCards);
              console.log('   赢得:', standRes.data.data.winAmount);
              console.log('   连胜:', standRes.data.data.streak);
            }
          }
        }
      }
    } else {
      console.error('❌ 下注失败:', betRes.data.message);
    }
  } catch (error) {
    console.error('❌ 21 点测试失败:', error.response?.data?.message || error.message);
  }
}

// 测试打猎游戏
async function testHunting(token) {
  console.log('\n🏹 测试打猎游戏...');
  
  try {
    const huntRes = await axios.post(
      `${BASE_URL}/hunt`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (huntRes.data.success) {
      console.log('✅ 打猎成功');
      console.log('   猎物:', huntRes.data.data.hunt);
      console.log('   价值:', huntRes.data.data.value);
      console.log('   经验:', huntRes.data.data.exp);
      console.log('   稀有度:', huntRes.data.data.rarity);
      console.log('   猎户等级:', huntRes.data.data.hunterLevel);
      console.log('   连胜:', huntRes.data.data.streak);
      
      if (huntRes.data.data.specialItem) {
        console.log('   🎁 特殊物品:', huntRes.data.data.specialItem);
      }
      if (huntRes.data.data.buffApplied) {
        console.log('   ✨ Buff 已应用');
      }
    } else {
      console.error('❌ 打猎失败:', huntRes.data.message);
    }
  } catch (error) {
    console.error('❌ 打猎测试失败:', error.response?.data?.message || error.message);
  }
}

// 测试骰子游戏
async function testDice(token) {
  console.log('\n🎲 测试骰子游戏...');
  
  try {
    // 测试压大小
    const diceRes = await axios.post(
      `${BASE_URL}/dice`,
      { bet: 50, type: 'big' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (diceRes.data.success) {
      console.log('✅ 骰子游戏成功');
      console.log('   骰子:', diceRes.data.data.dice.join(', '));
      console.log('   总和:', diceRes.data.data.total);
      console.log('   结果:', diceRes.data.data.win ? '赢' : '输');
      console.log('   赢得:', diceRes.data.data.winAmount);
      console.log('   赔率:', diceRes.data.data.multiplier + 'x');
      
      if (diceRes.data.data.details.isLeopard) {
        console.log('   🎉 豹子！');
      }
      if (diceRes.data.data.details.isStraight) {
        console.log('   🎉 顺子！');
      }
    }
  } catch (error) {
    console.error('❌ 骰子测试失败:', error.response?.data?.message || error.message);
  }
}

// 测试钓鱼游戏
async function testFishing(token) {
  console.log('\n🎣 测试钓鱼游戏...');
  
  try {
    // 开始钓鱼
    await axios.post(
      `${BASE_URL}/fish/start`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // 等待 3 秒
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 收竿
    const reelRes = await axios.post(
      `${BASE_URL}/fish/reel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (reelRes.data.success) {
      console.log('✅ 钓鱼成功');
      console.log('   钓到:', reelRes.data.data.catch);
      console.log('   价值:', reelRes.data.data.value);
      console.log('   经验:', reelRes.data.data.exp);
      console.log('   稀有度:', reelRes.data.data.rarity);
      console.log('   鱼竿等级:', reelRes.data.data.rodLevel);
      
      if (reelRes.data.data.specialItem) {
        console.log('   🎁 特殊物品:', reelRes.data.data.specialItem);
      }
      if (reelRes.data.data.buffApplied) {
        console.log('   ✨ Buff 已应用');
      }
    }
  } catch (error) {
    console.error('❌ 钓鱼测试失败:', error.response?.data?.message || error.message);
  }
}

// 主函数
async function main() {
  console.log('🎮 游戏系统增强测试');
  console.log('=' .repeat(50));
  
  // 登录
  console.log('\n📝 登录系统...');
  const token = await login(TEST_USERNAME);
  console.log('✅ 登录成功:', TEST_USERNAME);
  
  // 运行测试
  await testBlackjack(token);
  await testHunting(token);
  await testDice(token);
  await testFishing(token);
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ 测试完成！');
}

main().catch(console.error);
