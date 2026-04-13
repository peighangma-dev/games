const db = require('../config/db');

async function getConfig(name) {
  const [rows] = await db.execute('SELECT value FROM system_config WHERE name = ?', [name]);
  return rows.length > 0 ? rows[0].value : null;
}

async function setConfig(name, value) {
  await db.execute(
    'INSERT INTO system_config (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
    [name, value, value]
  );
}

async function isIpBanned(ip) {
  const [temp] = await db.execute(
    'SELECT id FROM ip_locks WHERE ip = ? AND expires_at > NOW()',
    [ip]
  );
  if (temp.length > 0) return true;

  const [perm] = await db.execute('SELECT id FROM ip_bans WHERE ? LIKE REPLACE(ip_pattern, "*", "%")', [ip]);
  return perm.length > 0;
}

async function isUsernameBanned(username) {
  const [rows] = await db.execute('SELECT id FROM banned_usernames WHERE ? LIKE REPLACE(name_pattern, "*", "%")', [username]);
  return rows.length > 0;
}

async function containsBadWord(text) {
  const [words] = await db.execute('SELECT word FROM bad_words');
  const lower = text.toLowerCase();
  return words.some(w => lower.includes(w.word.toLowerCase()));
}

async function encryptPassword(password) {
  const bcrypt = require('bcryptjs');
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hash);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  getConfig, setConfig, isIpBanned, isUsernameBanned,
  containsBadWord, encryptPassword, verifyPassword, escapeHtml
};
