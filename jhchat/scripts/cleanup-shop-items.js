/**
 * 商店物品重复数据清理脚本
 * 
 * 使用方法:
 * cd /workspace/jhchat/backend && node ../scripts/cleanup-shop-items.js
 * 
 * 功能:
 * 1. 删除 shop_items 表中的重复记录（保留 ID 最小的）
 * 2. 添加唯一约束防止未来重复
 */

// 在 backend 目录下运行：cd backend && node ../scripts/cleanup-shop-items.js
const mysql = require('mysql2/promise')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') })

async function cleanupShopItems() {
  let connection
  try {
    // 连接数据库
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'jhchat'
    })

    console.log('✅ 数据库连接成功')

    // 查询重复数据
    const [duplicates] = await connection.query(`
      SELECT name, price, type, COUNT(*) as count, GROUP_CONCAT(id ORDER BY id) as ids
      FROM shop_items
      GROUP BY name, price, type
      HAVING count > 1
    `)

    console.log(`\n📊 发现 ${duplicates.length} 种重复物品`)

    let deletedCount = 0
    let keptCount = 0

    // 对每组重复数据，只保留 ID 最小的记录
    for (const dup of duplicates) {
      const ids = dup.ids.split(',').map(id => parseInt(id))
      const keepId = ids[0] // 保留最小的 ID
      const deleteIds = ids.slice(1) // 删除其他重复的

      console.log(`\n物品：${dup.name} (${dup.type}) - 价格：${dup.price}`)
      console.log(`  保留 ID: ${keepId}`)
      console.log(`  删除 ID: ${deleteIds.join(', ')}`)

      // 删除重复记录
      if (deleteIds.length > 0) {
        const placeholders = deleteIds.map(() => '?').join(',')
        await connection.query(`DELETE FROM shop_items WHERE id IN (${placeholders})`, deleteIds)
        deletedCount += deleteIds.length
        keptCount++
      }
    }

    // 添加唯一约束，防止未来重复
    console.log('\n🔒 添加唯一约束...')
    try {
      await connection.query(`
        ALTER TABLE shop_items
        ADD UNIQUE KEY unique_shop_item (name, price, type)
      `)
      console.log('✅ 唯一约束添加成功：unique_shop_item (name, price, type)')
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  唯一约束已存在，跳过')
      } else {
        throw error
      }
    }

    console.log('\n✅ 清理完成！')
    console.log(`📈 保留了 ${keptCount} 条记录`)
    console.log(`🗑️  删除了 ${deletedCount} 条重复记录`)

    // 验证结果
    const [remaining] = await connection.query(`
      SELECT COUNT(*) as total FROM shop_items
    `)
    console.log(`📦 当前商店物品总数：${remaining[0].total}`)

  } catch (error) {
    console.error('❌ 清理失败:', error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// 运行清理
cleanupShopItems()
