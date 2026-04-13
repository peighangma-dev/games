<template>
  <div class="skills-page">
    <div class="nav-bar">
      <router-link to="/main">首页</router-link>
      <router-link to="/chat">聊天</router-link>
      <span class="nav-spacer"></span>
      <router-link to="/profile">{{ userStore.username }}</router-link>
    </div>

    <div class="page-container">
      <div class="title-bar">
        <h1>武功</h1>
      </div>

      <div class="skill-tabs">
        <span :class="['skill-tab', { active: skillTab === 'practice' }]" @click="skillTab = 'practice'">练功</span>
        <span :class="['skill-tab', { active: skillTab === 'secret' }]" @click="skillTab = 'secret'; loadSecret()">藏经阁</span>
        <span :class="['skill-tab', { active: skillTab === 'learned' }]" @click="skillTab = 'learned'; loadLearned()">已学武功</span>
      </div>

      <div v-if="skillTab === 'practice'" class="practice-section">
        <div class="card">
          <h3 class="section-title">选择练功方式</h3>
          <div class="practice-options">
            <div :class="['practice-card', { selected: practiceType === 1 }]" @click="practiceType = 1">
              <div class="practice-name">内功修炼</div>
              <div class="practice-desc">提升内力</div>
            </div>
            <div :class="['practice-card', { selected: practiceType === 2 }]" @click="practiceType = 2">
              <div class="practice-name">外功修炼</div>
              <div class="practice-desc">提升武功</div>
            </div>
            <div :class="['practice-card', { selected: practiceType === 3 }]" @click="practiceType = 3">
              <div class="practice-name">轻功修炼</div>
              <div class="practice-desc">提升攻防</div>
            </div>
          </div>
          <button class="btn btn-primary" @click="doPractice" :disabled="practicing">
            {{ practicing ? '练功中...' : '开始练功' }}
          </button>
          <div v-if="practiceResult" class="practice-result">{{ practiceResult }}</div>
        </div>
      </div>

      <div v-if="skillTab === 'secret'" class="secret-section">
        <div v-for="s in secretSkills" :key="s.id" class="card skill-card">
          <div class="skill-info">
            <span class="skill-name">{{ s.name }}</span>
            <span class="skill-type">{{ s.type }}</span>
          </div>
          <div class="skill-desc">{{ s.description }}</div>
          <button class="btn btn-sm btn-primary" @click="learnSkill(s.id)">学习</button>
        </div>
        <div v-if="secretSkills.length === 0" class="empty-text">藏经阁空空如也</div>
      </div>

      <div v-if="skillTab === 'learned'" class="learned-section">
        <div v-for="s in learnedSkills" :key="s.id" class="card skill-card">
          <div class="skill-info">
            <span class="skill-name">{{ s.name }}</span>
            <span class="skill-level">等级: {{ s.level || 1 }}</span>
          </div>
          <div class="skill-desc">{{ s.description }}</div>
        </div>
        <div v-if="learnedSkills.length === 0" class="empty-text">尚未习得任何武功</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'

const userStore = useUserStore()

const skillTab = ref('practice')
const practiceType = ref(1)
const practicing = ref(false)
const practiceResult = ref('')
const secretSkills = ref([])
const learnedSkills = ref([])

async function doPractice() {
  practicing.value = true
  practiceResult.value = ''
  try {
    const res = await api.post(`/skills/${practiceType.value}/practice`)
    if (res.success) {
      practiceResult.value = res.message || '练功完成'
      await userStore.fetchProfile()
    } else {
      practiceResult.value = res.message || '练功失败'
    }
  } catch (err) {
    practiceResult.value = err.message || '练功失败'
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

async function learnSkill(id) {
  try {
    const res = await api.post(`/skills/secret/${id}/learn`)
    if (res.success) {
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

onMounted(() => {
  loadLearned()
})
</script>

<style scoped>
.section-title {
  color: #7eb8da;
  font-size: 16px;
  margin-bottom: 12px;
  border-left: 3px solid #4B87C3;
  padding-left: 10px;
}

.skill-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.skill-tab {
  padding: 10px 20px;
  cursor: pointer;
  color: #888;
  font-size: 14px;
  transition: all 0.2s;
}

.skill-tab.active {
  color: #7eb8da;
  border-bottom: 2px solid #4B87C3;
}

.skill-tab:hover {
  color: #ccc;
}

.practice-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.practice-card {
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.practice-card:hover {
  border-color: #4B87C3;
}

.practice-card.selected {
  border-color: #4B87C3;
  background: rgba(75, 135, 195, 0.15);
}

.practice-name {
  color: #7eb8da;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 6px;
}

.practice-desc {
  color: #888;
  font-size: 13px;
}

.practice-result {
  margin-top: 12px;
  padding: 10px;
  background: rgba(74, 124, 89, 0.2);
  border: 1px solid rgba(74, 124, 89, 0.4);
  border-radius: 4px;
  color: #8fc9a0;
  font-size: 14px;
}

.skill-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skill-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 180px;
}

.skill-name {
  color: #7eb8da;
  font-weight: bold;
  font-size: 15px;
}

.skill-type {
  color: #f0c040;
  font-size: 12px;
  padding: 2px 6px;
  background: rgba(240, 192, 64, 0.15);
  border-radius: 3px;
}

.skill-level {
  color: #f0c040;
  font-size: 13px;
}

.skill-desc {
  flex: 1;
  color: #aaa;
  font-size: 13px;
}

.empty-text {
  text-align: center;
  color: #666;
  padding: 30px;
}

.nav-spacer {
  flex: 1;
}

@media (max-width: 600px) {
  .practice-options {
    grid-template-columns: 1fr;
  }
}
</style>
