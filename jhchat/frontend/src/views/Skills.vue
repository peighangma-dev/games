<template>
  <PageLayout>
    <div class="skills-page">
      <div class="page-container">
        <div class="title-bar">
          <h1 class="page-title">⚔️ 江湖武功</h1>
          <div class="title-stats">
            <span class="stat-item">💪 武功：<strong>{{ userAttributes.wugong }}</strong></span>
            <span class="stat-item">👁️ 内力：<strong>{{ userAttributes.neili }}</strong></span>
            <span class="stat-item">🏃 轻功：<strong>{{ userAttributes.speed }}</strong></span>
          </div>
        </div>

        <div class="skill-tabs">
          <span :class="['skill-tab', { active: skillTab === 'practice' }]" @click="skillTab = 'practice'">
            🧘 练功
          </span>
          <span :class="['skill-tab', { active: skillTab === 'secret' }]" @click="skillTab = 'secret'; loadSecret()">
            📚 藏经阁
          </span>
          <span :class="['skill-tab', { active: skillTab === 'learned' }]" @click="skillTab = 'learned'; loadLearned()">
            ✅ 已学武功
          </span>
        </div>

        <!-- 练功页面 -->
        <div v-if="skillTab === 'practice'" class="practice-section">
          <!-- 修炼状态卡片 -->
          <div class="card practice-status-card">
            <h3 class="section-title">📊 修炼状态</h3>
            <div class="status-grid">
              <div class="status-item">
                <div class="status-label">🕐 冷却时间</div>
                <div :class="['status-value', isCoolingDown ? 'warning' : 'success']">
                  {{ cooldownText }}
                </div>
              </div>
              <div class="status-item">
                <div class="status-label">📈 今日修炼</div>
                <div class="status-value">
                  {{ practiceStatus.practiceCountToday }} / {{ practiceStatus.maxDailyPractices }}
                </div>
              </div>
              <div class="status-item">
                <div class="status-label">💫 剩余次数</div>
                <div class="status-value">
                  {{ practiceStatus.remainingDailyPractices }} 次
                </div>
              </div>
              <div class="status-item">
                <div class="status-label">✨ 累计经验</div>
                <div class="status-value highlight">
                  {{ practiceStatus.totalPracticeExp.toLocaleString() }}
                </div>
              </div>
            </div>
          </div>

          <!-- 修为进度卡片 -->
          <div class="card cultivation-card" v-if="cultivationDetail.cultivations.length > 0">
            <h3 class="section-title">🧘 修为境界</h3>
            <div class="cultivation-grid">
              <div v-for="c in cultivationDetail.cultivations" :key="c.practiceType" class="cultivation-item">
                <div class="cultivation-header">
                  <span class="cultivation-name">{{ c.typeName }}</span>
                  <span class="cultivation-level">第{{ c.level }}重天</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: c.progressPercent + '%' }"
                    :class="'progress-' + c.typeName"
                  ></div>
                </div>
                <div class="progress-text">{{ c.progress.toLocaleString() }} / {{ c.requiredProgress.toLocaleString() }} ({{ c.progressPercent }}%)</div>
                <div class="cultivation-stats">总修炼：{{ c.totalPractices }}次</div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="section-title">🔥 选择练功方式</h3>
            <div class="practice-options">
              <div :class="['practice-card', { selected: practiceType === 1 }]" @click="practiceType = 1">
                <div class="practice-icon">💫</div>
                <div class="practice-name">内功修炼</div>
                <div class="practice-desc">提升内力修为</div>
                <div class="practice-cost">消耗：15 内力 +5 体力</div>
                <div class="practice-time">⏱️ 约 15 秒</div>
              </div>
              <div :class="['practice-card', { selected: practiceType === 2 }]" @click="practiceType = 2">
                <div class="practice-icon">👊</div>
                <div class="practice-name">外功修炼</div>
                <div class="practice-desc">提升武功招式</div>
                <div class="practice-cost">消耗：10 内力 +5 体力</div>
                <div class="practice-time">⏱️ 约 10 秒</div>
              </div>
              <div :class="['practice-card', { selected: practiceType === 3 }]" @click="practiceType = 3">
                <div class="practice-icon">🦶</div>
                <div class="practice-name">轻功修炼</div>
                <div class="practice-desc">提升身法速度</div>
                <div class="practice-cost">消耗：15 内力 +5 体力</div>
                <div class="practice-time">⏱️ 约 7 秒</div>
              </div>
            </div>
            <div class="practice-tips">
              <div class="tip-icon">💡</div>
              <div class="tip-text">
                <p>• 练功需要消耗体力和内力</p>
                <p>• 每次练功有{{ isCoolingDown ? '60 秒' : '1 分钟' }}冷却时间</p>
                <p>• 每日最多修炼{{ practiceStatus.maxDailyPractices }}次</p>
                <p>• 修为等级越高，获得经验越多</p>
                <p>• 体力不足时可在物品店购买人参</p>
              </div>
            </div>
            <button class="btn btn-primary btn-large" @click="doPractice" :disabled="practicing || isCoolingDown">
              {{ practicing ? '🧘 练功中...' : (isCoolingDown ? `⏳ ${cooldownText}` : '⚡ 开始练功') }}
            </button>
            <div v-if="practiceResult" :class="['practice-result', practiceResultType]">
              {{ practiceResult }}
            </div>
          </div>

          <div class="card practice-help">
            <h4 class="help-title">📖 练功说明</h4>
            <div class="help-content">
              <p><strong>内功修炼：</strong>专注内力修炼，适合内力不足的玩家，会增加内力上限</p>
              <p><strong>外功修炼：</strong>练习招式技巧，性价比最高的升级方式，直接增加武功值</p>
              <p><strong>轻功修炼：</strong>修炼身法步法，提升闪避和先手能力</p>
              <p><strong>修为系统：</strong>每次修炼会增加修为进度，突破后获得额外属性加成</p>
            </div>
          </div>
        </div>

        <!-- 藏经阁页面 -->
        <div v-if="skillTab === 'secret'" class="secret-section">
          <!-- 藏经阁统计 -->
          <div class="secret-stats-card card">
            <h3 class="section-title">📚 藏经阁总览</h3>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-icon">📖</div>
                <div class="stat-label">武功总数</div>
                <div class="stat-value">{{ secretSkills.length }} 部</div>
              </div>
              <div class="stat-box">
                <div class="stat-icon">✅</div>
                <div class="stat-label">已习得</div>
                <div class="stat-value">{{ learnedCount }} 部</div>
              </div>
              <div class="stat-box">
                <div class="stat-icon">📕</div>
                <div class="stat-label">未习得</div>
                <div class="stat-value">{{ secretSkills.length - learnedCount }} 部</div>
              </div>
              <div class="stat-box">
                <div class="stat-icon">💪</div>
                <div class="stat-label">内力加成</div>
                <div class="stat-value">+{{ totalNeiliBonus }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-icon">🏃</div>
                <div class="stat-label">轻功加成</div>
                <div class="stat-value">+{{ totalSpeedBonus }}</div>
              </div>
            </div>
          </div>

          <!-- 任务进度关联 -->
          <div v-if="relatedQuests.length > 0" class="quest-progress-card card">
            <h3 class="section-title">📋 相关任务进度</h3>
            <div v-for="quest in relatedQuests" :key="quest.id" class="quest-item">
              <div class="quest-info">
                <span class="quest-name">{{ quest.title }}</span>
                <span class="quest-desc">{{ quest.description }}</span>
              </div>
              <div class="quest-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: quest.progressPercent + '%' }"></div>
                </div>
                <span class="progress-text">{{ quest.current }} / {{ quest.target }}</span>
              </div>
              <div class="quest-reward">奖励：{{ quest.reward }}</div>
            </div>
          </div>

          <!-- 属性预测 -->
          <div class="attribute-preview-card card">
            <h3 class="section-title">📊 属性现状与预测</h3>
            <div class="attribute-compare">
              <div class="attribute-row">
                <span class="attribute-label">💪 武功</span>
                <div class="attribute-values">
                  <span class="current-value">{{ userAttributes.wugong }}</span>
                  <span class="arrow">→</span>
                  <span class="predicted-value" :class="{ highlight: potentialWugongGain > 0 }">
                    {{ userAttributes.wugong + potentialWugongGain }}
                    <span v-if="potentialWugongGain > 0" class="gain-badge">+{{ potentialWugongGain }}</span>
                  </span>
                </div>
              </div>
              <div class="attribute-row">
                <span class="attribute-label">👁️ 内力</span>
                <div class="attribute-values">
                  <span class="current-value">{{ userAttributes.neili }}</span>
                  <span class="arrow">→</span>
                  <span class="predicted-value" :class="{ highlight: potentialNeiliGain > 0 }">
                    {{ userAttributes.neili + potentialNeiliGain }}
                    <span v-if="potentialNeiliGain > 0" class="gain-badge">+{{ potentialNeiliGain }}</span>
                  </span>
                </div>
              </div>
              <div class="attribute-row">
                <span class="attribute-label">🏃 轻功</span>
                <div class="attribute-values">
                  <span class="current-value">{{ userAttributes.speed }}</span>
                  <span class="arrow">→</span>
                  <span class="predicted-value" :class="{ highlight: potentialSpeedGain > 0 }">
                    {{ userAttributes.speed + potentialSpeedGain }}
                    <span v-if="potentialSpeedGain > 0" class="gain-badge">+{{ potentialSpeedGain }}</span>
                  </span>
                </div>
              </div>
            </div>
            <div class="preview-tip">💡 预测值 = 当前属性 + 未习武功中可学习部分的总加成</div>
          </div>

          <!-- 筛选器 -->
          <div class="skill-filter card">
            <div class="filter-row">
              <div class="filter-group">
                <label class="filter-label">📂 类型</label>
                <select v-model="secretFilter" class="filter-select">
                  <option value="all">全部</option>
                  <option value="neili">内功</option>
                  <option value="speed">轻功</option>
                  <option value="both">全能</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label class="filter-label">💎 稀有度</label>
                <select v-model="secretRarity" class="filter-select">
                  <option value="all">全部</option>
                  <option value="common">普通</option>
                  <option value="uncommon">稀有</option>
                  <option value="rare">珍贵</option>
                  <option value="epic">史诗</option>
                  <option value="legendary">传说</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label class="filter-label">📊 状态</label>
                <select v-model="secretStatus" class="filter-select">
                  <option value="all">全部</option>
                  <option value="learnable">可学习</option>
                  <option value="learned">已习得</option>
                  <option value="locked">未达成</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label class="filter-label">🔄 排序</label>
                <select v-model="secretSort" class="filter-select">
                  <option value="level">等级↑</option>
                  <option value="price">价格↑</option>
                  <option value="bonus">加成↑</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 武功卡片列表 -->
          <div class="skills-grid">
            <div v-for="s in filteredSecretSkills" :key="s.id" class="card skill-card secret-card" :class="{ 'learned': hasLearned(s.name), 'affordable': canAfford(s), 'locked': !canMeetLevelRequirement(s) }">
              <div class="skill-rarity-indicator" :class="s.rarity"></div>
              <div class="skill-header">
                <div class="skill-name-box">
                  <span class="skill-name">{{ s.name }}</span>
                  <span :class="['skill-level-badge', 'level-' + s.level]">Lv.{{ s.level }}</span>
                  <span v-if="hasLearned(s.name)" class="learned-badge">✅</span>
                </div>
                <div class="skill-price" :class="{ 'can-afford': canAfford(s) }">{{ formatPrice(s.price) }}两</div>
              </div>
              
              <div v-if="s.description" class="skill-description">
                <span class="desc-icon">📜</span>
                <span class="desc-text">{{ s.description }}</span>
              </div>
              
              <div class="skill-bonus">
                <span v-if="s.neili_bonus > 0" class="bonus-neili">
                  👁️ +{{ s.neili_bonus }}
                </span>
                <span v-if="s.speed_bonus > 0" class="bonus-speed">
                  🏃 +{{ s.speed_bonus }}
                </span>
                <span v-if="!s.neili_bonus && !s.speed_bonus" class="bonus-none">
                  ❓ 神秘
                </span>
              </div>
              
              <div class="skill-meta">
                <span class="meta-rarity" :class="s.rarity">{{ getRarityName(s.rarity) }}</span>
                <span class="meta-type">{{ getSkillType(s) }}</span>
              </div>
              
              <div class="skill-actions">
                <button v-if="!hasLearned(s.name)" class="btn btn-sm btn-learn" @click="learnSkill(s)" :disabled="!canLearnSkill(s)">
                  {{ !canMeetLevelRequirement(s) ? `需要 Lv.${s.level}` : (!canAfford(s) ? '银两不足' : '学习') }}
                </button>
                <button v-else class="btn btn-sm btn-learned" disabled>
                  已习得
                </button>
                <button class="btn btn-sm btn-detail" @click="showSkillDetail(s)">
                  详情
                </button>
              </div>
              
              <!-- 详情弹窗 -->
              <div v-if="selectedSkill && selectedSkill.id === s.id" class="skill-detail-modal" @click.self="selectedSkill = null">
                <div class="detail-content">
                  <div class="detail-header">
                    <h3>{{ selectedSkill.name }}</h3>
                    <button class="close-btn" @click="selectedSkill = null">×</button>
                  </div>
                  <div class="detail-body">
                    <div class="detail-row">
                      <span class="detail-label">等级要求</span>
                      <span class="detail-value">Lv.{{ selectedSkill.level }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">学习费用</span>
                      <span class="detail-value">{{ selectedSkill.price }} 两</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">稀有度</span>
                      <span class="detail-value" :class="selectedSkill.rarity">{{ getRarityName(selectedSkill.rarity) }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">类型</span>
                      <span class="detail-value">{{ getSkillType(selectedSkill) }}</span>
                    </div>
                    <div class="detail-row bonuses">
                      <span class="detail-label">属性加成</span>
                      <div class="bonus-list">
                        <span v-if="selectedSkill.neili_bonus > 0" class="bonus-item neili">内力 +{{ selectedSkill.neili_bonus }}</span>
                        <span v-if="selectedSkill.speed_bonus > 0" class="bonus-item speed">轻功 +{{ selectedSkill.speed_bonus }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">描述</span>
                      <p class="detail-desc">{{ selectedSkill.description || '暂无描述' }}</p>
                    </div>
                  </div>
                  <div v-if="!hasLearned(selectedSkill.name)" class="detail-footer">
                    <button class="btn btn-primary btn-block" @click="learnSkill(selectedSkill)" :disabled="!canLearnSkill(selectedSkill)">
                      立即学习
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="filteredSecretSkills.length === 0" class="empty-text">
            <div class="empty-icon">📚</div>
            <p>暂无符合条件的武功</p>
          </div>
        </div>

        <!-- 已学武功页面 -->
        <div v-if="skillTab === 'learned'" class="learned-section">
          <div class="learned-intro">
            <div class="intro-icon">📜</div>
            <p>已习得的武功会永久增加属性</p>
          </div>

          <div v-for="s in learnedSkills" :key="s.id" class="card skill-card learned-card">
            <div class="skill-name-box">
              <span class="skill-name">{{ s.skill_name }}</span>
              <span :class="['skill-level-badge', 'level-' + (s.level || 1)]">Lv.{{ s.level || 1 }}</span>
            </div>
            <div class="skill-bonus">
              <span v-if="s.neili_bonus > 0" class="bonus-neili">
                👁️ 内力 +{{ s.neili_bonus }}
              </span>
              <span v-if="s.speed_bonus > 0" class="bonus-speed">
                🏃 轻功 +{{ s.speed_bonus }}
              </span>
            </div>
            <div class="learned-time">习得时间：{{ formatDate(s.learned_at) }}</div>
          </div>
          <div v-if="learnedSkills.length === 0" class="empty-text">尚未习得任何武功</div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'
import PageLayout from '../components/PageLayout.vue'

const userStore = useUserStore()

const skillTab = ref('practice')
const practiceType = ref(1)
const practicing = ref(false)
const practiceResult = ref('')
const practiceResultType = ref('success')
const secretSkills = ref([])
const learnedSkills = ref([])
const relatedQuests = ref([])
const selectedSkill = ref(null)

// 筛选和排序
const secretFilter = ref('all')
const secretRarity = ref('all')
const secretStatus = ref('all')
const secretSort = ref('level')

// 修炼状态
const practiceStatus = ref({
  cooldownRemaining: 0,
  practiceCountToday: 0,
  remainingDailyPractices: 50,
  totalPracticeExp: 0
})

// 修为详情
const cultivationDetail = ref({
  cultivations: []
})

// 倒计时定时器
let countdownTimer = null

const userAttributes = computed(() => ({
  wugong: userStore.profile?.wugong || userStore.user?.wugong || 0,
  neili: userStore.profile?.neili || userStore.user?.neili || 0,
  speed: (userStore.profile?.all_value || 0) - (userStore.profile?.wugong || 0) - (userStore.profile?.neili || 0)
}))

// 是否正在冷却
const isCoolingDown = computed(() => practiceStatus.value.cooldownRemaining > 0)

// 冷却时间格式化
const cooldownText = computed(() => {
  const seconds = practiceStatus.value.cooldownRemaining
  if (seconds <= 0) return '可以修炼'
  if (seconds < 60) return `${seconds}秒后可修炼`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes}分钟后可修炼`
})

// 藏经阁统计
const learnedCount = computed(() => {
  return secretSkills.value.filter(s => hasLearned(s.name)).length
})

const totalNeiliBonus = computed(() => {
  return learnedSkills.value.reduce((sum, s) => sum + (s.neili_bonus || 0), 0)
})

const totalSpeedBonus = computed(() => {
  return learnedSkills.value.reduce((sum, s) => sum + (s.speed_bonus || 0), 0)
})

// 潜在属性增益（未习得但可学习的武功）
const potentialNeiliGain = computed(() => {
  return secretSkills.value
    .filter(s => !hasLearned(s.name) && canMeetLevelRequirement(s) && s.neili_bonus > 0)
    .reduce((sum, s) => sum + s.neili_bonus, 0)
})

const potentialSpeedGain = computed(() => {
  return secretSkills.value
    .filter(s => !hasLearned(s.name) && canMeetLevelRequirement(s) && s.speed_bonus > 0)
    .reduce((sum, s) => sum + s.speed_bonus, 0)
})

const potentialWugongGain = computed(() => {
  // 武功值 = 内力 + 轻功
  return potentialNeiliGain.value + potentialSpeedGain.value
})

const filteredSecretSkills = computed(() => {
  let list = [...secretSkills.value]
  
  // 类型筛选
  if (secretFilter.value === 'neili') {
    list = list.filter(s => s.neili_bonus > 0 && !s.speed_bonus)
  } else if (secretFilter.value === 'speed') {
    list = list.filter(s => s.speed_bonus > 0 && !s.neili_bonus)
  } else if (secretFilter.value === 'both') {
    list = list.filter(s => s.neili_bonus > 0 && s.speed_bonus > 0)
  }
  
  // 稀有度筛选
  if (secretRarity.value !== 'all') {
    list = list.filter(s => s.rarity === secretRarity.value)
  }
  
  // 状态筛选
  if (secretStatus.value === 'learned') {
    list = list.filter(s => hasLearned(s.name))
  } else if (secretStatus.value === 'learnable') {
    list = list.filter(s => !hasLearned(s.name) && canMeetLevelRequirement(s) && canAfford(s))
  } else if (secretStatus.value === 'locked') {
    list = list.filter(s => !canMeetLevelRequirement(s))
  }
  
  // 排序
  if (secretSort.value === 'level') {
    list.sort((a, b) => a.level - b.level)
  } else if (secretSort.value === 'price') {
    list.sort((a, b) => a.price - b.price)
  } else if (secretSort.value === 'bonus') {
    list.sort((a, b) => (b.neili_bonus + b.speed_bonus) - (a.neili_bonus + a.speed_bonus))
  }
  
  return list
})

function formatPrice(price) {
  if (price >= 10000) {
    return (price / 10000).toFixed(1) + '万'
  }
  return price.toString()
}

function getRarityName(rarity) {
  const names = {
    common: '普通',
    uncommon: '稀有',
    rare: '珍贵',
    epic: '史诗',
    legendary: '传说'
  }
  return names[rarity] || rarity
}

function getSkillType(skill) {
  if (skill.neili_bonus > 0 && skill.speed_bonus > 0) return '全能'
  if (skill.neili_bonus > 0) return '内功'
  if (skill.speed_bonus > 0) return '轻功'
  return '神秘'
}

function canMeetLevelRequirement(skill) {
  const userLevel = userStore.profile?.grade || userStore.user?.grade || 1
  return userLevel >= skill.level
}

function canAfford(skill) {
  const userSilver = userStore.profile?.silver || userStore.user?.silver || 0
  return userSilver >= skill.price
}

function canLearnSkill(skill) {
  return canMeetLevelRequirement(skill) && canAfford(skill) && !hasLearned(skill.name)
}

function hasLearned(skillName) {
  return learnedSkills.value.some(s => s.skill_name === skillName)
}

// 获取修炼状态
async function fetchPracticeStatus() {
  try {
    const res = await api.get('/skills/practice/status')
    if (res.success) {
      practiceStatus.value = res.data
    }
  } catch (e) {
    console.error('获取修炼状态失败:', e)
  }
}

// 获取修为详情
async function fetchCultivationDetail() {
  try {
    const res = await api.get('/skills/cultivation/detail')
    if (res.success) {
      cultivationDetail.value = res.data
    }
  } catch (e) {
    console.error('获取修为详情失败:', e)
  }
}

// 加载相关任务
async function loadRelatedQuests() {
  try {
    const res = await api.get('/quests')
    if (res.success && Array.isArray(res.data)) {
      // 筛选与武功学习相关的任务
      relatedQuests.value = res.data
        .filter(q => q.type === 'learn_skill' || q.title?.includes('武功') || q.description?.includes('武学'))
        .map(q => ({
          id: q.id,
          title: q.title,
          description: q.description,
          current: q.current_progress || 0,
          target: q.target_progress || 0,
          progressPercent: Math.min(100, ((q.current_progress || 0) / (q.target_progress || 1)) * 100),
          reward: q.reward || '未知'
        }))
    }
  } catch (e) {
    console.error('加载任务失败:', e)
  }
}

// 显示武功详情
function showSkillDetail(skill) {
  selectedSkill.value = skill
}

async function doPractice() {
  if (isCoolingDown.value) {
    practiceResult.value = `正在调息中，${cooldownText.value}`
    practiceResultType.value = 'error'
    return
  }
  
  practicing.value = true
  practiceResult.value = ''
  practiceResultType.value = 'success'
  try {
    const res = await api.post(`/skills/${practiceType.value}/practice`)
    if (res.success) {
      const data = res.data || res
      practiceResult.value = data.message || '练功完成！'
      practiceResultType.value = 'success'
      await userStore.fetchProfile()
      await fetchPracticeStatus()
      await fetchCultivationDetail()
    } else {
      practiceResult.value = res.message || '练功失败'
      practiceResultType.value = 'error'
    }
  } catch (err) {
    practiceResult.value = err.message || err.data?.message || '练功失败'
    practiceResultType.value = 'error'
  } finally {
    practicing.value = false
  }
}

async function loadSecret() {
  try {
    const res = await api.get('/skills/secret')
    if (res.success) {
      secretSkills.value = res.data || []
    }
  } catch (err) {
    console.error('加载藏经阁失败:', err)
  }
}

async function loadLearned() {
  try {
    const res = await api.get('/skills/learned')
    if (res.success) {
      window.learnedSkills = res.data || []
    }
  } catch (err) {
    console.error('加载已学武功失败:', err)
  }
}

async function learnSkill(skill) {
  if (!confirm(`确定要学习"${skill.name}"吗？\n消耗：${skill.price}两银子\n等级要求：Lv.${skill.level}`)) return
  try {
    const res = await api.post(`/skills/secret/${skill.id}/learn`)
    if (res.success) {
      alert(`恭喜！学会${skill.name}！\n${res.message || ''}`)
      loadSecret()
      loadLearned()
      await userStore.fetchProfile()
    } else {
      alert(res.message || '学习失败')
    }
  } catch (err) {
    alert(err.message || '学习失败')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 更新倒计时
function updateCountdown() {
  if (practiceStatus.value.cooldownRemaining > 0) {
    practiceStatus.value.cooldownRemaining--
  }
}

// 监听藏经阁 Tab 切换
watch(() => skillTab.value, (newTab) => {
  if (newTab === 'secret') {
    loadSecret()
    loadLearned()
    loadRelatedQuests()
  }
})

onMounted(() => {
  loadLearned()
  fetchPracticeStatus()
  fetchCultivationDetail()
  
  // 如果当前是藏经阁 tab，加载相关数据
  if (skillTab.value === 'secret') {
    loadSecret()
    loadLearned()
    loadRelatedQuests()
  }
  
  // 启动倒计时
  countdownTimer = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.page-title {
  color: #7eb8da;
  font-size: 24px;
  margin: 0;
}

.title-stats {
  display: flex;
  gap: 20px;
  margin-top: 12px;
}

.stat-item {
  color: #aaa;
  font-size: 14px;
}

.stat-item strong {
  color: #f0c040;
  font-size: 16px;
  margin-left: 4px;
}

.skill-tabs {
  display: flex;
  gap: 0;
  margin: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.skill-tab {
  padding: 12px 24px;
  cursor: pointer;
  color: #888;
  font-size: 15px;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.skill-tab.active {
  color: #7eb8da;
  border-bottom-color: #4B87C3;
}

.skill-tab:hover {
  color: #ccc;
}

.practice-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 20px 0;
}

.practice-card {
  padding: 20px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(20, 20, 40, 0.3));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.practice-card:hover {
  border-color: #4B87C3;
  transform: translateY(-2px);
}

.practice-card.selected {
  border-color: #4B87C3;
  background: linear-gradient(135deg, rgba(75, 135, 195, 0.15), rgba(75, 135, 195, 0.05));
  box-shadow: 0 0 15px rgba(75, 135, 195, 0.2);
}

.practice-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.practice-name {
  color: #7eb8da;
  font-size: 17px;
  font-weight: bold;
  margin-bottom: 8px;
}

.practice-desc {
  color: #888;
  font-size: 13px;
  margin-bottom: 12px;
}

.practice-cost {
  color: #f0c040;
  font-size: 12px;
  padding: 4px 8px;
  background: rgba(240, 192, 64, 0.1);
  border-radius: 4px;
  display: inline-block;
}

.practice-tips {
  display: flex;
  gap: 12px;
  background: rgba(126, 184, 218, 0.05);
  border: 1px solid rgba(126, 184, 218, 0.2);
  border-radius: 6px;
  padding: 12px 16px;
  margin: 16px 0;
}

.tip-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.tip-text {
  color: #aaa;
  font-size: 13px;
  line-height: 1.6;
}

.tip-text p {
  margin: 2px 0;
}

.btn-large {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  margin: 16px 0;
}

/* 修炼状态卡片 */
.practice-status-card {
  margin-bottom: 16px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.status-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.status-label {
  color: #666;
  font-size: 12px;
  margin-bottom: 4px;
}

.status-value {
  color: #ddd;
  font-size: 16px;
  font-weight: bold;
}

.status-value.success {
  color: #8fc9a0;
}

.status-value.warning {
  color: #f0c040;
}

.status-value.highlight {
  color: #7eb8da;
}

/* 修为进度卡片 */
.cultivation-card {
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(126, 184, 218, 0.05), rgba(75, 135, 195, 0.05));
  border: 1px solid rgba(126, 184, 218, 0.2);
}

.cultivation-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
}

.cultivation-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 3px solid #4B87C3;
}

.cultivation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.cultivation-name {
  color: #7eb8da;
  font-size: 15px;
  font-weight: bold;
}

.cultivation-level {
  color: #f0c040;
  font-size: 14px;
  font-weight: bold;
}

.progress-bar {
  height: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4B87C3, #7eb8da);
  transition: width 0.3s ease;
}

.progress-fill.progress-内功 {
  background: linear-gradient(90deg, #7eb8da, #4B87C3);
}

.progress-fill.progress-外功 {
  background: linear-gradient(90deg, #f0c040, #ffd700);
}

.progress-fill.progress-轻功 {
  background: linear-gradient(90deg, #8fc9a0, #4a7c59);
}

.progress-text {
  color: #888;
  font-size: 12px;
  margin-bottom: 4px;
}

.cultivation-stats {
  color: #666;
  font-size: 11px;
}

.practice-result {
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.practice-result.success {
  background: rgba(74, 124, 89, 0.2);
  border: 1px solid rgba(74, 124, 89, 0.4);
  color: #8fc9a0;
}

.practice-result.error {
  background: rgba(195, 75, 75, 0.2);
  border: 1px solid rgba(195, 75, 75, 0.4);
  color: #f88;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.practice-help {
  margin-top: 16px;
}

.help-title {
  color: #7eb8da;
  font-size: 16px;
  margin-bottom: 12px;
}

.help-content {
  color: #aaa;
  font-size: 13px;
  line-height: 1.8;
}

.help-content p {
  margin: 6px 0;
}

.secret-intro, .learned-intro {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(126, 184, 218, 0.05), rgba(75, 135, 195, 0.05));
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid rgba(126, 184, 218, 0.2);
}

.intro-icon {
  font-size: 40px;
}

.intro-text h3, .learned-intro p {
  color: #eee;
  font-size: 16px;
  margin: 0;
}

.secret-intro p {
  color: #888;
  font-size: 13px;
  margin: 4px 0 0 0;
}

.skill-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.skill-filter label {
  color: #888;
  font-size: 13px;
}

.filter-select {
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #3a4a5a;
  border-radius: 4px;
  color: #eee;
  font-size: 13px;
}

.filter-select:focus {
  outline: none;
  border-color: #4B87C3;
}

.secret-card {
  margin-bottom: 12px;
  transition: all 0.2s;
}

.secret-card:hover {
  border-color: #4B87C3;
  transform: translateX(4px);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.skill-name-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.skill-level-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: bold;
}

.level-1 { background: rgba(100, 100, 100, 0.3); color: #aaa; }
.level-2 { background: rgba(100, 100, 100, 0.3); color: #aaa; }
.level-3 { background: rgba(100, 100, 100, 0.3); color: #ccc; }
.level-4 { background: rgba(75, 135, 195, 0.3); color: #7eb8da; }
.level-5 { background: rgba(75, 135, 195, 0.3); color: #7eb8da; }
.level-6 { background: rgba(240, 192, 64, 0.3); color: #f0c040; }
.level-7 { background: rgba(240, 192, 64, 0.3); color: #f0c040; }
.level-8 { background: rgba(240, 192, 64, 0.3); color: #ffd700; }
.level-9 { background: rgba(255, 100, 100, 0.3); color: #ff8888; }
.level-10 { background: linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(255, 100, 100, 0.4)); color: #fff; }

.skill-price {
  color: #f0c040;
  font-size: 15px;
  font-weight: bold;
}

.skill-bonus {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.bonus-neili {
  color: #7eb8da;
  font-size: 13px;
}

.bonus-speed {
  color: #8fc9a0;
  font-size: 13px;
}

.learned-card {
  margin-bottom: 12px;
}

.learned-time {
  color: #666;
  font-size: 12px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.empty-text {
  text-align: center;
  color: #666;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

/* 藏经阁统计卡片 */
.secret-stats-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(75, 135, 195, 0.1), rgba(75, 135, 195, 0.05));
  border: 1px solid rgba(75, 135, 195, 0.3);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.stat-box {
  background: rgba(0, 0, 0, 0.3);
  padding: 16px 12px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid rgba(75, 135, 195, 0.2);
  transition: all 0.3s;
}

.stat-box:hover {
  border-color: rgba(75, 135, 195, 0.5);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-label {
  color: #888;
  font-size: 12px;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  color: #f0c040;
  font-size: 20px;
  font-weight: bold;
}

/* 筛选器优化 */
.skill-filter {
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(75, 135, 195, 0.2);
}

.filter-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
  flex: 1;
}

.filter-label {
  color: #7eb8da;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(75, 135, 195, 0.3);
  border-radius: 6px;
  color: #eee;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: rgba(75, 135, 195, 0.5);
}

.filter-select:focus {
  outline: none;
  border-color: #4B87C3;
  box-shadow: 0 0 0 2px rgba(75, 135, 195, 0.2);
}

/* 武功卡片网格 */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.secret-card {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, rgba(30, 42, 58, 0.8), rgba(15, 26, 38, 0.8));
  border: 1px solid rgba(75, 135, 195, 0.2);
}

.secret-card:hover {
  transform: translateY(-4px);
  border-color: rgba(75, 135, 195, 0.4);
  box-shadow: 0 8px 24px rgba(75, 135, 195, 0.2);
}

.secret-card.learned {
  opacity: 0.85;
  background: linear-gradient(135deg, rgba(143, 201, 160, 0.1), rgba(74, 124, 89, 0.1));
  border-color: rgba(143, 201, 160, 0.3);
}

.secret-card.affordable {
  border-color: rgba(240, 192, 64, 0.4);
}

.secret-card.affordable:hover {
  box-shadow: 0 8px 24px rgba(240, 192, 64, 0.25);
}

.secret-card.locked {
  opacity: 0.6;
  filter: grayscale(0.3);
}

/* 任务进度卡片 */
.quest-progress-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(240, 192, 64, 0.05), rgba(255, 152, 0, 0.05));
  border: 1px solid rgba(240, 192, 64, 0.2);
}

.quest-item {
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  margin-bottom: 10px;
}

.quest-item:last-child {
  margin-bottom: 0;
}

.quest-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.quest-name {
  color: #f0c040;
  font-weight: bold;
  font-size: 14px;
}

.quest-desc {
  color: #888;
  font-size: 12px;
}

.quest-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.quest-progress .progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.quest-progress .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f0c040, #ffd700);
  transition: width 0.3s ease;
}

.progress-text {
  color: #f0c040;
  font-size: 12px;
  font-weight: bold;
  min-width: 60px;
  text-align: right;
}

.quest-reward {
  color: #8fc9a0;
  font-size: 12px;
}

/* 属性预测卡片 */
.attribute-preview-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(126, 184, 218, 0.05), rgba(143, 201, 160, 0.05));
  border: 1px solid rgba(126, 184, 218, 0.2);
}

.attribute-compare {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.attribute-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.attribute-label {
  color: #888;
  font-size: 14px;
  width: 100px;
}

.attribute-values {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-value {
  color: #ddd;
  font-size: 16px;
  font-weight: bold;
}

.arrow {
  color: #666;
  font-size: 16px;
}

.predicted-value {
  color: #7eb8da;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
}

.predicted-value.highlight {
  color: #8fc9a0;
}

.gain-badge {
  background: rgba(143, 201, 160, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.preview-tip {
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(126, 184, 218, 0.1);
  border-radius: 4px;
  color: #888;
  font-size: 12px;
}

/* 藏经阁卡片增强 */
.skill-rarity-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
}

.skill-rarity-indicator.common {
  background: linear-gradient(180deg, #6b7280, #4b5563);
}

.skill-rarity-indicator.uncommon {
  background: linear-gradient(180deg, #22c55e, #16a34a);
}

.skill-rarity-indicator.rare {
  background: linear-gradient(180deg, #3b82f6, #2563eb);
}

.skill-rarity-indicator.epic {
  background: linear-gradient(180deg, #a855f7, #9333ea);
}

.skill-rarity-indicator.legendary {
  background: linear-gradient(180deg, #fbbf24, #f59e0b, #d97706);
}

.skill-description {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  margin-bottom: 12px;
  border: 1px solid rgba(75, 135, 195, 0.1);
}

.desc-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.desc-text {
  color: #aaa;
  font-size: 12px;
  line-height: 1.6;
  flex: 1;
}

.skill-bonus {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.bonus-neili {
  color: #7eb8da;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  background: rgba(126, 184, 218, 0.1);
  border-radius: 4px;
}

.bonus-speed {
  color: #8fc9a0;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  background: rgba(143, 201, 160, 0.1);
  border-radius: 4px;
}

.bonus-none {
  color: #f88;
  font-size: 13px;
  font-style: italic;
}

.skill-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.meta-rarity {
  font-size: 11px;
  font-weight: bold;
  padding: 3px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s;
}

.meta-rarity.common { 
  color: #9ca3af;
  border-color: rgba(156, 163, 175, 0.3);
  background: rgba(156, 163, 175, 0.1);
}
.meta-rarity.uncommon { 
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.3);
  background: rgba(74, 222, 128, 0.1);
}
.meta-rarity.rare { 
  color: #60a5fa;
  border-color: rgba(96, 165, 250, 0.3);
  background: rgba(96, 165, 250, 0.1);
}
.meta-rarity.epic { 
  color: #c084fc;
  border-color: rgba(192, 132, 252, 0.3);
  background: rgba(192, 132, 252, 0.1);
}
.meta-rarity.legendary { 
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.4);
  background: rgba(251, 191, 36, 0.15);
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.2);
}

.meta-type {
  font-size: 11px;
  color: #aaa;
  padding: 3px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.skill-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.btn-learn {
  background: linear-gradient(135deg, rgba(126, 184, 218, 0.3), rgba(75, 135, 195, 0.3));
  border: none;
  color: #fff;
  flex: 1;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-learn:not(:disabled):hover {
  background: linear-gradient(135deg, rgba(126, 184, 218, 0.5), rgba(75, 135, 195, 0.5));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(126, 184, 218, 0.3);
}

.btn-learn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-learned {
  background: rgba(143, 201, 160, 0.2);
  border: 1px solid rgba(143, 201, 160, 0.4);
  color: #8fc9a0;
  flex: 1;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: not-allowed;
}

.btn-detail {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ddd;
  flex-shrink: 0;
  font-weight: 500;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-detail:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.learned-badge {
  background: rgba(143, 201, 160, 0.3);
  color: #8fc9a0;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: bold;
}

/* 详情弹窗 */
.skill-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: modalFadeIn 0.2s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.detail-content {
  background: linear-gradient(135deg, #1a2a3a, #0f1a26);
  border: 1px solid rgba(126, 184, 218, 0.3);
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(126, 184, 218, 0.2);
  background: rgba(0, 0, 0, 0.2);
}

.detail-header h3 {
  color: #7eb8da;
  font-size: 22px;
  margin: 0;
  font-weight: bold;
}

.close-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 28px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  transform: rotate(90deg);
}

.detail-body {
  padding: 24px;
}

.detail-row {
  margin-bottom: 16px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row.bonuses {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(126, 184, 218, 0.2);
}

.detail-label {
  color: #888;
  font-size: 13px;
  display: block;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.detail-value {
  color: #ddd;
  font-size: 16px;
  font-weight: bold;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-value.common { color: #9ca3af; }
.detail-value.uncommon { color: #4ade80; }
.detail-value.rare { color: #60a5fa; }
.detail-value.epic { color: #c084fc; }
.detail-value.legendary { 
  color: #fbbf24;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
}

.detail-desc {
  color: #aaa;
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
  padding: 14px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.bonus-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.bonus-item {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  border: 1px solid transparent;
}

.bonus-item.neili {
  background: rgba(126, 184, 218, 0.2);
  color: #7eb8da;
  border-color: rgba(126, 184, 218, 0.3);
}

.bonus-item.speed {
  background: rgba(143, 201, 160, 0.2);
  color: #8fc9a0;
  border-color: rgba(143, 201, 160, 0.3);
}

.detail-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(126, 184, 218, 0.2);
  background: rgba(0, 0, 0, 0.15);
}

.btn-block {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-block:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(75, 135, 195, 0.4);
}

/* 筛选器增强 */
.skill-filter {
  flex-wrap: wrap;
  gap: 16px;
}

.skill-filter label {
  font-size: 13px;
  color: #888;
}

.filter-select {
  min-width: 100px;
}

.can-afford {
  color: #8fc9a0 !important;
}

.price-unaffordable {
  color: #f88 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .practice-options {
    grid-template-columns: 1fr;
  }
  
  .title-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .skill-filter {
    flex-wrap: wrap;
  }
  
  /* 平板 - 武功卡片网格调整为 2 列 */
  .skills-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
  
  /* 详情弹窗 */
  .detail-content {
    width: 95%;
    max-height: 85vh;
  }
  
  .detail-header {
    padding: 16px 20px;
  }
  
  .detail-body {
    padding: 16px;
  }
  
  .detail-footer {
    padding: 16px 20px;
  }
}

@media (max-width: 480px) {
  /* 手机 - 武功卡片网格调整为单列 */
  .skills-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  /* 统计卡片 */
  .stat-card {
    min-width: 100%;
  }
  
  /* 筛选器 */
  .filter-group {
    min-width: 100%;
    flex: none;
  }
  
  /* 奖励卡片 */
  .reward-preview {
    flex-direction: column;
  }
  
  .reward-item {
    width: 100%;
  }
  
  /* 详情弹窗 */
  .detail-header h3 {
    font-size: 18px;
  }
  
  .detail-value {
    font-size: 14px;
    padding: 8px 12px;
  }
  
  .bonus-list {
    gap: 8px;
  }
  
  .bonus-item {
    flex: 1;
    text-align: center;
    font-size: 13px;
    padding: 6px 12px;
  }
  
  /* 卡片内稀有度标签和类型 */
  .skill-meta {
    justify-content: flex-start;
  }
  
  .meta-rarity,
  .meta-type {
    font-size: 10px;
    padding: 2px 8px;
  }
  
  /* 卡片操作按钮 */
  .skill-actions {
    flex-wrap: wrap;
  }
  
  .btn-learn,
  .btn-learned,
  .btn-detail {
    font-size: 12px;
    padding: 6px 10px;
    flex: 1 1 100%;
  }
  
  .btn-detail {
    flex: 1;
  }
}
</style>
