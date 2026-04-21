const fs = require('fs');
const path = require('path');

const suits = [
  { name: 'hearts', symbol: '♥', color: '#e74c3c' },
  { name: 'diamonds', symbol: '♦', color: '#e74c3c' },
  { name: 'clubs', symbol: '♣', color: '#2c3e50' },
  { name: 'spades', symbol: '♠', color: '#2c3e50' }
];

const values = [
  { name: 'A', display: 'A', points: 11 },
  { name: '2', display: '2', points: 2 },
  { name: '3', display: '3', points: 3 },
  { name: '4', display: '4', points: 4 },
  { name: '5', display: '5', points: 5 },
  { name: '6', display: '6', points: 6 },
  { name: '7', display: '7', points: 7 },
  { name: '8', display: '8', points: 8 },
  { name: '9', display: '9', points: 9 },
  { name: '10', display: '10', points: 10 },
  { name: 'J', display: 'J', points: 10 },
  { name: 'Q', display: 'Q', points: 10 },
  { name: 'K', display: 'K', points: 10 }
];

const outputDir = process.argv[2] || './cards';

// 生成牌面
suits.forEach(suit => {
  values.forEach(value => {
    const isRed = suit.color === '#e74c3c';
    const svg = `
<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="96" height="136" rx="8" fill="#fff" stroke="#333" stroke-width="1.5"/>
  
  <!-- 左上角 -->
  <text x="18" y="28" text-anchor="middle" font-size="20" font-weight="bold" fill="${suit.color}">${value.display}</text>
  <text x="18" y="48" text-anchor="middle" font-size="18" fill="${suit.color}">${suit.symbol}</text>
  
  <!-- 右下角（倒置） -->
  <text x="82" y="118" text-anchor="middle" font-size="20" font-weight="bold" fill="${suit.color}" transform="rotate(180 82,118)">${value.display}</text>
  <text x="82" y="100" text-anchor="middle" font-size="18" fill="${suit.color}" transform="rotate(180 82,100)">${suit.symbol}</text>
  
  <!-- 中央图案 -->
  ${getCenterPattern(value.display, suit.symbol, suit.color)}
</svg>
`.trim();

    const filename = `${value.name}${suit.name.charAt(0).toUpperCase()}.svg`;
    fs.writeFileSync(path.join(outputDir, filename), svg);
  });
});

function getCenterPattern(value, symbol, color) {
  // A：单个大符号
  if (value === 'A') {
    return `<text x="50" y="85" text-anchor="middle" font-size="60" fill="${color}">${symbol}</text>`;
  }
  
  // 2-3：少量符号
  if (value === '2') {
    return `
      <text x="50" y="50" text-anchor="middle" font-size="36" fill="${color}">${symbol}</text>
      <text x="50" y="100" text-anchor="middle" font-size="36" fill="${color}" transform="rotate(180 50,100)">${symbol}</text>
    `;
  }
  
  if (value === '3') {
    return `
      <text x="50" y="35" text-anchor="middle" font-size="32" fill="${color}">${symbol}</text>
      <text x="50" y="70" text-anchor="middle" font-size="32" fill="${color}">${symbol}</text>
      <text x="50" y="105" text-anchor="middle" font-size="32" fill="${color}" transform="rotate(180 50,105)">${symbol}</text>
    `;
  }
  
  // 4-10：多符号排列
  const positions = getPositions(value);
  return positions.map(pos => 
    `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" font-size="28" fill="${color}"${pos.rotate ? ` transform="rotate(180 ${pos.x},${pos.y})"` : ''}>${symbol}</text>`
  ).join('\n  ');
}

function getPositions(value) {
  const num = parseInt(value);
  if (isNaN(num)) return [];
  
  // 简化版：根据数字生成位置
  const positions = [];
  
  if (num <= 3) return [];
  
  // 4: 四角
  if (num === 4) {
    return [
      { x: 30, y: 45, rotate: false },
      { x: 70, y: 45, rotate: false },
      { x: 30, y: 95, rotate: true },
      { x: 70, y: 95, rotate: true }
    ];
  }
  
  // 5: 四角 + 中央
  if (num === 5) {
    return [
      { x: 30, y: 40, rotate: false },
      { x: 70, y: 40, rotate: false },
      { x: 50, y: 70, rotate: false },
      { x: 30, y: 100, rotate: true },
      { x: 70, y: 100, rotate: true }
    ];
  }
  
  // 6-10：多列排列（简化）
  for (let i = 0; i < num; i++) {
    const row = Math.floor(i / 2);
    const col = i % 2;
    positions.push({
      x: col === 0 ? 35 : 65,
      y: 30 + row * 18,
      rotate: col === 1
    });
  }
  
  return positions.slice(0, num);
}

console.log('扑克牌 SVG 生成完成！');
