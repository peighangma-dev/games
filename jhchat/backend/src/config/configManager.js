const db = require('../config/db');

async function getConfig(name) {
  try {
    const [rows] = await db.execute('SELECT value FROM system_config WHERE name = ?', [name]);
    return rows.length > 0 ? rows[0].value : null;
  } catch (error) {
    return null;
  }
}

async function setConfig(name, value) {
  await db.execute(
    'INSERT INTO system_config (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
    [name, value, value]
  );
}

async function incrementStat(statName) {
  try {
    await db.execute(
      'INSERT INTO system_stats (name, value) VALUES (?, 1) ON DUPLICATE KEY UPDATE value = value + 1',
      [statName]
    );
  } catch (error) {
    // Ignore errors for stats
  }
}

module.exports = { getConfig, setConfig, incrementStat };
