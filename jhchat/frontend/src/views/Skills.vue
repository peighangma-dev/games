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
          <div class="card">
            <h3 class="section-title">🔥 选择练功方式</h3>
            <div class="practice-options">
              <div :class="['practice-card', { selected: practiceType === 1 }]" @click="practiceType = 1">
                <div class="practice-icon">💫</div>
                <div class="practice-name">内功修炼</div>
                <div class="practice-desc">提升内力修为</div>
                <div class="practice-cost">消耗：15 内力</div>
              </div>
              <div :class="['practice-card', { selected: practiceType === 2 }]" @click="practiceType = 2">
                <div class="practice-icon">👊</div>
                <div class="practice-name">外功修炼</div>
                <div class="practice-desc">提升武功招式</div>
                <div class="practice-cost">消耗：10 内力</div>
              </div>
              <div :class="['practice-card', { selected: practiceType === 3 }]" @click="practiceType = 3">
                <div class="practice-icon">🦶</div>
                <div class="practice-name">轻功修炼</div>
                <div class="practice-desc">提升身法速度</div>
                <div class="practice-cost">消耗：15 内力</div>
              </div>
            </div>
            <div class="practice-tips">
              <div class="tip-icon">💡</div>
              <div class="tip-text">
                <p>• 练功需要消耗体力和内力</p>
                <p>• 每次练功随机获得 10-60 点经验</p>
                <p>• 体力不足时可在物品店购买人参</p>
              </div>
            </div>
            <button class="btn btn-primary btn-large" @click="doPractice" :disabled="practicing">
              {{ practicing ? '🧘 练功中...' : '⚡ 开始练功' }}
            </button>
            <div v-if="practiceResult" :class="['practice-result', practiceResultType]">
              {{ practiceResult }}
            </div>
          </div>

          <div class="card practice-help">
            <h4 class="help-title">📖 练功说明</h4>
            <div class="help-content">
              <p><strong>内功修炼：</strong>专注内力修炼，适合内力不足的玩家</p>
              <p><strong>外功修炼：</strong>练习招式技巧，性价比最高的升级方式</p>
              <p><strong>轻功修炼：</strong>修炼身法步法，提升闪避和先手能力</p>
            </div>
          </div>
        </div>

        <!-- 藏经阁页面 -->
        <div v-if="skillTab === 'secret'" class="secret-section">
          <div class="secret-intro">
            <div class="intro-icon">🏛️</div>
            <div class="intro-text">
              <h3>藏经阁</h3>
              <p>收藏天下武学典籍，可用银两购买学习</p>
            </div>
          </div>

          <div class="skill-filter">
            <label>类型筛选：</label>
            <select v-model="secretFilter" class="filter-select">
              <option value="all">全部</option>
              <option value="neili">内功类</option>
              <option value="speed">轻功类</option>
              <option value="both">全能类</option>
            </select>
          </div>

          <div v-for="s in filteredSecretSkills" :key="s.id" class="card skill-card secret-card">
            <div class="skill-header">
              <div class="skill-name-box">
                <span class="skill-name">{{ s.name }}</span>
                <span :class="['skill-level-badge', 'level-' + s.level]">Lv.{{ s.level }}</span>
              </div>
              <div class="skill-price">💰 {{ formatPrice(s.price) }}</div>
            </div>
            <div class="skill-bonus">
              <span v-if="s.neili_bonus > 0" class="bonus-neili">
                👁️ 内力 +{{ s.neili_bonus }}
              </span>
              <span v-if="s.speed_bonus > 0" class="bonus-speed">
                🏃 轻功 +{{ s.speed_bonus }}
              </span>
            </div>
            <button class="btn btn-sm" @click="learnSkill(s)" :disabled="!canLearnSkill(s)">
              {{ hasLearned(s.name) ? '✅ 已习得' : '📖 学习' }}
            </button>
          </div>
          <div v-if="filteredSecretSkills.length === 0" class="empty-text">藏经阁空空如也</div>
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
import { ref, computed, onMounted } from 'vue'
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
const secretFilter = ref('all')

const userAttributes = computed(() => ({
  wugong: userStore.profile?.wugong || userStore.user?.wugong || 0,
  neili: userStore.profile?.neili || userStore.user?.neili || 0,
  speed: (userStore.profile?.all_value || 0) - (userStore.profile?.wugong || 0) - (userStore.profile?.neili || 0)
}))

const filteredSecretSkills = computed(() => {
  let list = secretSkills.value
  if (secretFilter.value === 'neili') {
    return list.filter(s => s.neili_bonus > 0 && s.speed_bonus === 0)
  } else if (secretFilter.value === 'speed') {
    return list.filter(s => s.speed_bonus > 0 && s.neili_bonus === 0)
  } else if (secretFilter.value === 'both') {
    return list.filter(s => s.neili_bonus > 0 && s.speed_bonus > 0)
  }
  return list
})

function formatPrice(price) {
  if (price >= 10000) {
    return (price / 10000).toFixed(1) + '万'
  }
  return price.toString()
}

function canLearnSkill(skill) {
  const userSilver = userStore.profile?.silver || userStore.user?.silver || 0
  const userLevel = userStore.profile?.grade || userStore.user?.grade || 1
  return userLevel >= skill.level && userSilver >= skill.price && !hasLearned(skill.name)
}

function hasLearned(skillName) {
  return learnedSkills.value.some(s => s.skill_name === skillName)
}

async function doPractice() {
  practicing.value = true
  practiceResult.value = ''
  practiceResultType.value = 'success'
  try {
    const res = await api.post(`/skills/${practiceType.value}/practice`)
    if (res.success) {
      const data = res.data || res
      practiceResult.value = `练功完成！${data.message || ''} 获得 ${data.expGain || 0} 点经验`
      practiceResultType.value = 'success'
      await userStore.fetchProfile()
    } else {
      practiceResult.value = res.message || '练功失败'
      practiceResultType.value = 'error'
    }
  } catch (err) {
    practiceResult.value = err.message || '练功失败'
    practiceResultType.value = 'error'
  } finally {
    practicing.value = false
  }
}

async function loadSecret() {
  try {
    const res = await api.get('/skills/secret')
    if (res.success) secretSkills.value = res.data || []
  } catch (e) {}
}

async function loadLearned() {
  try {
    const res = await api.get('/skills/learned')
    if (res.success) learnedSkills.value = res.data || []
  } catch (e) {}
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

onMounted(() => {
  loadLearned()
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
}
</style>
