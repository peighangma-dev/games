<template>
  <PageLayout>
    <div class="sect-page">
      <!-- 门派列表页 -->
      <div v-if="!selectedSect" class="sect-list-page">
        <div class="page-header">
          <h1><i class="icon">⚔️</i> 门派</h1>
          <button v-if="!userSect || userSect === '无'" class="btn btn-primary" @click="showCreateModal = true">
            ＋ 创建门派
          </button>
        </div>
        
        <div class="sect-grid">
          <div v-for="s in sects" :key="s.name" class="sect-card card" @click="viewSect(s.name)">
            <div class="sect-card-header">
              <h3 class="sect-name">{{ s.name }}</h3>
              <span v-if="s.name === '六扇门'" class="gov-badge">朝廷</span>
            </div>
            <div class="sect-card-body">
              <div class="info-row"><i class="icon">👑</i> 掌门：{{ s.leader || '无' }}</div>
              <div class="info-row"><i class="icon">👥</i> 成员：{{ s.member_count || 0 }}人</div>
              <div class="info-row"><i class="icon">🚻</i> {{ genderText(s.fit_gender) }}</div>
            </div>
          </div>
        </div>
        
        <div v-if="sects.length === 0" class="empty-state">
          <i class="empty-icon">🏔️</i>
          <p>暂无门派，快来创建第一个门派吧！</p>
        </div>
      </div>

      <!-- 门派详情页 -->
      <div v-else class="sect-detail-page">
        <div class="back-bar">
          <button class="btn-text" @click="selectedSect = null; activeTab = null">
            <i class="icon">←</i> 返回列表
          </button>
          <h2 class="page-title">{{ selectedSect }}</h2>
        </div>

        <!-- Tab 导航 -->
        <div class="tabs">
          <button :class="['tab', { active: activeTab === 'overview' }]" @click="activeTab = 'overview'">概览</button>
          <button v-if="userSect === selectedSect && userSect && userSect !== '无'" :class="['tab', { active: activeTab === 'my' }]" @click="activeTab = 'my'">我的</button>
          <button :class="['tab', { active: activeTab === 'members' }]" @click="activeTab = 'members'">{{ isLeader ? '管理' : '成员' }}</button>
          <button v-if="userSect === selectedSect && userSect && userSect !== '无'" :class="['tab', { active: activeTab === 'practice' }]" @click="activeTab = 'practice'">修炼</button>
          <button v-if="userSect === selectedSect && userSect && userSect !== '无'" :class="['tab', { active: activeTab === 'skills' }]" @click="activeTab = 'skills'">技能</button>
          <button v-if="userSect === selectedSect && userSect && userSect !== '无'" :class="['tab', { active: activeTab === 'tasks' }]" @click="activeTab = 'tasks'">任务</button>
          <button v-if="userSect === selectedSect && userSect && userSect !== '无'" :class="['tab', { active: activeTab === 'warehouse' }]" @click="activeTab = 'warehouse'">仓库</button>
          <button :class="['tab', { active: activeTab === 'leaderboard' }]" @click="activeTab = 'leaderboard'">排行</button>
        </div>

        <!-- 概览 -->
        <div v-if="activeTab === 'overview'" class="tab-panel">
          <div class="card">
            <div v-if="sectDetail?.name === '六扇门'" class="notice notice-warning">
              <strong>📜 朝廷禁令：</strong>六扇门乃朝廷捕快机构，只招收官府人员，不可创建，不可解散。
            </div>
            <div class="detail-grid">
              <div class="detail-item"><span class="label">掌门</span><span class="value">{{ sectDetail?.leader || '无' }}</span></div>
              <div class="detail-item"><span class="label">成员数</span><span class="value">{{ sectDetail?.member_count || 0 }}</span></div>
              <div class="detail-item"><span class="label">性别限制</span><span class="value">{{ genderText(sectDetail?.fit_gender) }}</span></div>
              <div class="detail-item"><span class="label">创建时间</span><span class="value">{{ formatDate(sectDetail?.created_at) }}</span></div>
            </div>
            <div v-if="sectDetail?.slogan" class="section-block">
              <div class="block-label">📯 门派口号</div>
              <div class="block-content">{{ sectDetail.slogan }}</div>
            </div>
            <div v-if="sectDetail?.description" class="section-block">
              <div class="block-label">📖 门派介绍</div>
              <div class="block-content">{{ sectDetail.description }}</div>
            </div>
            <div v-if="sectDetail?.rules" class="section-block">
              <div class="block-label">⚖️ 门规</div>
              <div class="block-content">{{ sectDetail.rules }}</div>
            </div>
            <div class="actions">
              <button v-if="userSect !== selectedSect && !isLiushan" class="btn btn-primary btn-block" @click="joinSect(selectedSect)">加入门派</button>
              <button v-if="userSect === selectedSect" class="btn btn-danger btn-block" @click="leaveSect">离开</button>
            </div>
          </div>
        </div>

        <!-- 我的 -->
        <div v-if="activeTab === 'my' && mySectInfo" class="tab-panel">
          <div class="card">
            <h3 class="card-title">📊 我的信息</h3>
            <div class="info-grid-2">
              <div class="info-item"><span class="label">门派</span><span class="value">{{ mySectInfo?.sect?.name }}</span></div>
              <div class="info-item"><span class="label">身份</span><span class="value badge">{{ mySectInfo?.sect?.title }}</span></div>
              <div class="info-item"><span class="label">掌门</span><span class="value">{{ mySectInfo?.sect?.leader }}</span></div>
              <div class="info-item"><span class="label">人数</span><span class="value">{{ mySectInfo?.sect?.memberCount }}</span></div>
            </div>
          </div>
          
          <div class="card">
            <h3 class="card-title">💰 俸禄</h3>
            <div class="salary-row">
              <span>今日俸禄：<strong class="highlight">{{ mySectInfo?.salary?.amount || 0 }}</strong> 两</span>
              <button v-if="mySectInfo?.salary?.canClaim" class="btn btn-success" @click="claimSalary">领取</button>
              <button v-else class="btn btn-disabled" disabled>已领</button>
            </div>
          </div>
          
          <div class="card">
            <h3 class="card-title">🎖️ 贡献值：<span class="highlight">{{ myContribution }}</span></h3>
            <div class="contribution-records">
              <div v-for="r in contributionRecords" :key="r.id" class="record-row">
                <span class="record-reason">{{ r.reason }}</span>
                <span class="record-value">+{{ r.contribution }}</span>
                <span class="record-time">{{ formatTime(r.created_at) }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="isLeader" class="card leader-card">
            <h3 class="card-title">👑 掌门管理</h3>
            <div class="btn-group">
              <button class="btn" @click="showRecruitModal = true">📢 招收</button>
              <button class="btn" @click="showPositionModal = true">🎖️ 职位</button>
              <button class="btn btn-danger" @click="showDissolveConfirm = true">💥 解散</button>
            </div>
          </div>
        </div>

        <!-- 成员 -->
        <div v-if="activeTab === 'members'" class="tab-panel">
          <div class="card">
            <h3 class="card-title">👥 门派成员 ({{ sectMembers.length }})</h3>
            <div class="member-list">
              <div v-for="m in sectMembers" :key="m.username" class="member-row">
                <div class="member-main">
                  <span class="member-name">{{ m.username }}</span>
                  <span class="member-title">{{ m.sect_title }}</span>
                  <span class="member-level">Lv.{{ m.grade }}</span>
                </div>
                <div class="member-extra">
                  <span class="member-exp">✨ {{ m.total_exp }}</span>
                  <div v-if="isLeader && m.username !== userStore.username && m.sect_title !== '掌门'" class="member-ops">
                    <button class="btn-xs" @click="showAbdicate(m.username)">禅让</button>
                    <button class="btn-xs btn-danger" @click="expelMember(m.username)">开除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 修炼 -->
        <div v-if="activeTab === 'practice'" class="tab-panel">
          <div class="card">
            <h3 class="card-title">🧘 修炼</h3>
            <div class="practice-status">
              <div class="status-row">体力：<span :class="{ warning: userStore.profile?.tili < 20 }">{{ userStore.profile?.tili || 0 }}</span></div>
              <div class="status-row">今日修炼：{{ userStore.profile?.practice_count_today || 0 }} 次</div>
            </div>
            <div class="practice-grid">
              <div class="practice-card" @click="doPractice('basic')">
                <div class="practice-icon">🧘</div>
                <div class="practice-name">基础修炼</div>
                <div class="practice-desc">50-100 经验</div>
              </div>
              <div class="practice-card" @click="doPractice('advanced')">
                <div class="practice-icon">⚡</div>
                <div class="practice-name">高级修炼</div>
                <div class="practice-desc">100-200 经验</div>
              </div>
              <div class="practice-card" @click="doPractice('intensive')">
                <div class="practice-icon">🔥</div>
                <div class="practice-name">闭关修炼</div>
                <div class="practice-desc">200-400 经验</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 技能 -->
        <div v-if="activeTab === 'skills'" class="tab-panel">
          <div class="card">
            <h3 class="card-title">📖 技能</h3>
            <div class="skill-list">
              <div v-for="skill in skills" :key="skill.id" class="skill-item">
                <div class="skill-info">
                  <div class="skill-name-row">
                    <span class="skill-name">{{ skill.name }}</span>
                    <span :class="['skill-level', skill.level]">{{ skill.level_name || skill.level }}</span>
                  </div>
                  <div class="skill-desc-short">{{ skill.description }}</div>
                </div>
                <div class="skill-action">
                  <span class="skill-cost">💰 {{ skill.expense }}两</span>
                  <button v-if="!skill.learned" :disabled="userStore.profile?.silver < skill.expense" class="btn btn-sm" @click="learnSkill(skill)">学习</button>
                  <span v-else class="badge-success">已学习</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 任务 -->
        <div v-if="activeTab === 'tasks'" class="tab-panel">
          <div class="card">
            <h3 class="card-title">📜 任务</h3>
            <div class="task-list">
              <div v-for="task in tasks" :key="task.id" class="task-item">
                <div class="task-header">
                  <span class="task-title">{{ task.title }}</span>
                  <span :class="['task-tag', task.quest_type]">{{ taskTypeText(task.quest_type) }}</span>
                </div>
                <div class="task-desc">{{ task.description }}</div>
                <div class="task-rewards">
                  <span class="reward">✨ {{ task.reward_exp }}exp</span>
                  <span class="reward">💰 {{ task.reward_silver }}两</span>
                </div>
                <button v-if="!task.completed" class="btn btn-sm btn-primary" @click="completeTask(task)">完成</button>
                <span v-else class="badge-success">已完成</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 仓库 -->
        <div v-if="activeTab === 'warehouse'" class="tab-panel">
          <div class="card">
            <h3 class="card-title">🏦 仓库</h3>
            <div class="fund-display">门派资金：<strong>{{ warehouseData?.fund || 0 }}</strong> 两</div>
            <h4 class="sub-title">📦 物品</h4>
            <div class="item-list">
              <div v-for="item in warehouseData?.items" :key="item.id" class="item-row">
                <span>{{ item.item_name }} × {{ item.amount }}</span>
                <span class="muted">捐赠：{{ item.donated_by }}</span>
              </div>
            </div>
            <h4 class="sub-title">📜 捐赠记录</h4>
            <div class="donation-list">
              <div v-for="d in warehouseData?.donations" :key="d.id" class="donation-row">
                <span>{{ d.username }}</span>
                <span>{{ d.amount }}两</span>
                <span class="muted">{{ formatTime(d.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 排行 -->
        <div v-if="activeTab === 'leaderboard'" class="tab-panel">
          <div class="card">
            <h3 class="card-title">🏆 排行榜</h3>
            <div class="lb-tabs">
              <button :class="['lb-tab', { active: leaderboardType === 'contribution' }]" @click="loadLeaderboard('contribution')">💎 贡献</button>
              <button :class="['lb-tab', { active: leaderboardType === 'exp' }]" @click="loadLeaderboard('exp')">✨ 经验</button>
              <button :class="['lb-tab', { active: leaderboardType === 'wealth' }]" @click="loadLeaderboard('wealth')">💰 财富</button>
            </div>
            <div class="leaderboard">
              <div v-for="(p, i) in leaderboardData" :key="p.username" class="leaderboard-row">
                <span class="rank">{{ ['🥇','🥈','🥉','4','5','6','7','8','9','10'][i] }}</span>
                <span class="name">{{ p.username }}</span>
                <span class="sect muted">{{ p.sect }}</span>
                <span class="value">{{ getLeaderboardValue(p) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 弹窗：创建门派 -->
      <div v-if="showCreateModal" class="modal" @click.self="showCreateModal = false">
        <div class="modal-content">
          <h3>🏛️ 创建门派</h3>
          <div class="form-group"><label>名称</label><input v-model="createForm.name" class="input" maxlength="30" /></div>
          <div class="form-group"><label>口号</label><input v-model="createForm.slogan" class="input" maxlength="100" /></div>
          <div class="form-group"><label>介绍</label><textarea v-model="createForm.description" class="input" rows="3" maxlength="500"></textarea></div>
          <div class="form-group"><label>门规</label><input v-model="createForm.rules" class="input" maxlength="100" /></div>
          <div class="form-group"><label>性别</label><select v-model="createForm.fit_gender" class="input"><option value="both">不限</option><option value="male">男</option><option value="female">女</option></select></div>
          <div class="hint">💰 费用：100 万两 (需等级 5+)</div>
          <div class="modal-actions"><button class="btn" @click="showCreateModal = false">取消</button><button class="btn btn-primary" @click="createSect" :disabled="creating">创建</button></div>
        </div>
      </div>

      <!-- 弹窗：招收 -->
      <div v-if="showRecruitModal" class="modal" @click.self="showRecruitModal = false">
        <div class="modal-content">
          <h3>📢 招收弟子</h3>
          <div class="form-group"><label>用户名</label><input v-model="recruitForm.username" class="input" /></div>
          <div class="modal-actions"><button class="btn" @click="showRecruitModal = false">取消</button><button class="btn btn-primary" @click="recruitMember" :disabled="recruiting">招收</button></div>
        </div>
      </div>

      <!-- 弹窗：禅让 -->
      <div v-if="showAbdicateModal" class="modal" @click.self="showAbdicateModal = false">
        <div class="modal-content">
          <h3>👑 禅让掌门</h3>
          <p>确定禅让给 <strong>{{ abdicateTarget }}</strong> 吗？您将成为长老。</p>
          <div class="modal-actions"><button class="btn" @click="showAbdicateModal = false">取消</button><button class="btn btn-primary" @click="confirmAbdicate" :disabled="abdicating">确认</button></div>
        </div>
      </div>

      <!-- 弹窗：解散 -->
      <div v-if="showDissolveConfirm" class="modal" @click.self="showDissolveConfirm = false">
        <div class="modal-content">
          <h3>⚠️ 解散门派</h3>
          <p>确定解散 <strong>{{ mySectInfo?.sect?.name }}</strong> 吗？所有成员将被除名！</p>
          <div class="form-group"><label>输入门派名称确认</label><input v-model="dissolveConfirm" class="input" /></div>
          <div class="modal-actions"><button class="btn" @click="showDissolveConfirm = false">取消</button><button class="btn btn-danger" @click="dissolveSect" :disabled="dissolveConfirm !== mySectInfo?.sect?.name">确认解散</button></div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'
import PageLayout from '../components/PageLayout.vue'

const userStore = useUserStore()

// 状态
const sects = ref([])
const selectedSect = ref(null)
const sectDetail = ref(null)
const sectMembers = ref([])
const mySectInfo = ref(null)
const activeTab = ref(null)

// 掌门管理
const isLeader = computed(() => mySectInfo.value?.sect?.title === '掌门')
const userSect = computed(() => userStore.profile?.sect || userStore.user?.sect || '无')
const isLiushan = computed(() => selectedSect.value === '六扇门')

// 表单
const showCreateModal = ref(false)
const creating = ref(false)
const createForm = ref({ name: '', slogan: '', description: '', rules: '', fit_gender: 'both' })

const showRecruitModal = ref(false)
const recruiting = ref(false)
const recruitForm = ref({ username: '' })

const showAbdicateModal = ref(false)
const abdicating = ref(false)
const abdicateTarget = ref('')

const showDissolveConfirm = ref(false)
const dissolving = ref(false)
const dissolveConfirm = ref('')

// 新功能数据
const myContribution = ref(0)
const contributionRecords = ref([])
const skills = ref([])
const tasks = ref([])
const warehouseData = ref({ fund: 0, items: [], donations: [] })
const leaderboardData = ref([])
const leaderboardType = ref('contribution')

// 工具函数
function genderText(g) {
  return g === 'male' ? '仅男' : g === 'female' ? '仅女' : '不限'
}

function taskTypeText(t) {
  return t === 'daily' ? '日常' : t === 'sect' ? '门派' : t
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('zh-CN') : '-'
}

function formatTime(d) {
  return d ? new Date(d).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''
}

function getLeaderboardValue(p) {
  if (leaderboardType.value === 'contribution') return p.total_contribution
  if (leaderboardType.value === 'exp') return p.total_exp
  return p.silver
}

// API 调用
async function loadSects() {
  const res = await api.get('/sect')
  if (res.success) sects.value = res.data || []
}

async function loadMySectInfo() {
  try {
    const res = await api.get('/sect/info')
    if (res.success && res.data?.hasSect) {
      mySectInfo.value = res.data
      // 如果有门派，设置选中状态
      if (res.data.sect?.name) {
        selectedSect.value = res.data.sect.name
      }
    } else {
      // 用户没有门派
      mySectInfo.value = null
    }
  } catch (e) {
    // 用户没有门派时 API 返回 404 或错误是正常现象
    console.log('用户暂无门派')
    mySectInfo.value = null
  }
}

async function viewSect(name) {
  selectedSect.value = name
  activeTab.value = 'overview'
  const res = await api.get(`/sect/${name}`)
  if (res.success) sectDetail.value = res.data
  loadMembers()
}

function goBack() {
  selectedSect.value = null
  activeTab.value = null
}

async function loadMembers() {
  if (!selectedSect.value) return
  const res = await api.get(`/sect/${selectedSect.value}/members`)
  if (res.success) sectMembers.value = res.data || []
}

async function joinSect(name) {
  const res = await api.post('/commands/join-sect', { target: name })
  if (res.success) {
    await userStore.fetchProfile()
    viewSect(name)
  } else alert(res.message || '加入失败')
}

async function leaveSect() {
  if (!confirm('离开门派需扣除 5 万两和 500 内力，确定？')) return
  const res = await api.post('/commands/leave-sect')
  if (res.success) {
    await userStore.fetchProfile()
    selectedSect.value = null
    loadSects()
  } else alert(res.message || '离开失败')
}

async function claimSalary() {
  const res = await api.post('/sect/checkin')
  if (res.success) {
    alert(`✅ 领取 ${res.data.amount} 两`)
    await userStore.fetchProfile()
    loadMySectInfo()
  } else alert(res.message || '领取失败')
}

// 贡献
async function loadContribution() {
  if (!userSect.value || userSect.value === '无') return
  try {
    const res = await api.get('/sect/contribution')
    if (res.success) {
      myContribution.value = res.data.total || 0
      contributionRecords.value = res.data.records || []
    }
  } catch (e) {
    console.error('加载贡献失败', e)
  }
}

// 修炼
async function doPractice(type) {
  const res = await api.post('/sect/practice', { type })
  if (res.success) {
    alert(`✅ ${res.message}`)
    await userStore.fetchProfile()
    loadContribution()
  } else alert(res.message || '修炼失败')
}

// 技能
async function loadSkills() {
  if (!userSect.value || userSect.value === '无') {
    skills.value = []
    return
  }
  try {
    const res = await api.get('/sect/skills')
    if (res.success) skills.value = res.data || []
  } catch (e) {
    console.error('加载技能失败', e)
  }
}

async function learnSkill(skill) {
  if (userStore.profile.silver < skill.expense) return alert('银两不足')
  const res = await api.post('/sect/skills/learn', { skillId: skill.id })
  if (res.success) {
    alert(`✅ 学会 ${skill.name}`)
    await userStore.fetchProfile()
    loadSkills()
  } else alert(res.message || '学习失败')
}

// 任务
async function loadTasks() {
  if (!userSect.value || userSect.value === '无') {
    tasks.value = []
    return
  }
  try {
    const res = await api.get('/sect/tasks')
    if (res.success) tasks.value = res.data || []
  } catch (e) {
    console.error('加载任务失败', e)
  }
}

async function completeTask(task) {
  const res = await api.post('/sect/tasks/complete', { questId: task.id })
  if (res.success) {
    alert(`✅ ${res.message}`)
    await userStore.fetchProfile()
    loadTasks()
  } else alert(res.message || '完成失败')
}

// 仓库
async function loadWarehouse() {
  if (!userSect.value || userSect.value === '无') {
    warehouseData.value = { fund: 0, items: [], donations: [] }
    return
  }
  try {
    const res = await api.get('/sect/warehouse')
    if (res.success) warehouseData.value = res.data || { fund: 0, items: [], donations: [] }
  } catch (e) {
    console.error('加载仓库失败', e)
  }
}

// 排行
async function loadLeaderboard(type = 'contribution') {
  leaderboardType.value = type
  const res = await api.get(`/sect/leaderboard?type=${type}`)
  if (res.success) leaderboardData.value = res.data || []
}

// 管理
async function recruitMember() {
  if (!recruitForm.value.username) return alert('输入用户名')
  const res = await api.post('/sect/recruit', recruitForm.value)
  if (res.success) {
    alert('招收成功')
    showRecruitModal.value = false
    loadMembers()
  } else alert(res.message || '招收失败')
}

function showAbdicate(username) {
  abdicateTarget.value = username
  showAbdicateModal.value = true
}

async function confirmAbdicate() {
  const res = await api.post('/sect/abdicate', { newLeader: abdicateTarget.value })
  if (res.success) {
    alert('禅让成功')
    await userStore.fetchProfile()
    loadMySectInfo()
    loadMembers()
  } else alert(res.message || '禅让失败')
  showAbdicateModal.value = false
}

async function expelMember(username) {
  if (!confirm(`开除 ${username}？`)) return
  const res = await api.post('/sect/expel', { username })
  if (res.success) {
    alert('开除成功')
    loadMembers()
  } else alert(res.message || '开除失败')
}

async function dissolveSect() {
  const res = await api.post('/sect/dissolve', { name: mySectInfo.value.sect.name })
  if (res.success) {
    alert('门派已解散')
    await userStore.fetchProfile()
    selectedSect.value = null
    loadSects()
  } else alert(res.message || '解散失败')
}

async function createSect() {
  if (!createForm.value.name) return alert('输入名称')
  if (createForm.value.name === '六扇门') return alert('六扇门不可创建')
  creating.value = true
  const res = await api.post('/sect/create', createForm.value)
  if (res.success) {
    alert('创建成功')
    await userStore.fetchProfile()
    showCreateModal.value = false
    loadSects()
  } else alert(res.message || '创建失败')
  creating.value = false
}

onMounted(() => {
  loadSects()
  loadMySectInfo()
})

// Watch tab changes to load data
watch(activeTab, (newTab) => {
  if (newTab === 'my') loadContribution()
  if (newTab === 'skills') loadSkills()
  if (newTab === 'tasks') loadTasks()
  if (newTab === 'warehouse') loadWarehouse()
  if (newTab === 'leaderboard') loadLeaderboard()
  if (newTab === 'members') loadMembers()
})
</script>

<style scoped>
/* 基础样式 */
.sect-page { max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h1 { color: #7eb8da; font-size: 24px; margin: 0; }
.sect-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.sect-card { cursor: pointer; transition: transform 0.2s, border-color 0.2s; }
.sect-card:hover { transform: translateY(-2px); border-color: #4B87C3; }
.sect-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.sect-name { color: #7eb8da; font-size: 18px; margin: 0; }
.gov-badge { background: linear-gradient(135deg, #c9a040, #f0d060); color: #2d1f00; font-size: 11px; padding: 2px 6px; border-radius: 3px; }
.sect-card-body .info-row { color: #aaa; font-size: 13px; margin-bottom: 6px; }
.empty-state { text-align: center; padding: 60px 20px; color: #666; }
.empty-icon { font-size: 64px; display: block; margin-bottom: 16px; }

/* 详情页 */
.back-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.btn-text { background: none; border: none; color: #7eb8da; cursor: pointer; font-size: 14px; }
.page-title { color: #fff; font-size: 20px; margin: 0; }
.tabs { display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 8px; }
.tab { padding: 8px 16px; background: rgba(75, 135, 195, 0.1); border: 1px solid rgba(75, 135, 195, 0.3); border-radius: 6px; color: #7eb8da; cursor: pointer; white-space: nowrap; }
.tab.active { background: rgba(75, 135, 195, 0.2); border-color: #4B87C3; }
.tab-panel { animation: fadeIn 0.3s; }

/* 卡片内容 */
.card { background: rgba(30, 30, 50, 0.6); border: 1px solid rgba(75, 135, 195, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.card-title { color: #7eb8da; font-size: 16px; margin: 0 0 16px 0; border-left: 3px solid #4B87C3; padding-left: 10px; }
.detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-item .label { color: #888; font-size: 12px; }
.detail-item .value { color: #eee; font-size: 14px; font-weight: 500; }
.section-block { background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; margin-bottom: 12px; }
.block-label { color: #888; font-size: 12px; margin-bottom: 6px; }
.block-content { color: #ccc; font-size: 14px; line-height: 1.5; }
.actions { margin-top: 20px; }
.btn-block { width: 100%; }

/* 通知 */
.notice { background: rgba(231, 76, 60, 0.1); border: 1px solid #e74c3c; border-radius: 6px; padding: 12px; margin-bottom: 16px; color: #ff9999; font-size: 13px; }
.notice-warning strong { color: #ffb3b3; }

/* 我的信息 */
.info-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-item .badge { background: rgba(240, 192, 64, 0.2); color: #f0c040; padding: 2px 8px; border-radius: 4px; display: inline-block; }
.highlight { color: #ffc107; font-weight: bold; }
.salary-row { display: flex; justify-content: space-between; align-items: center; }
.salary-row .highlight { font-size: 18px; }

/* 贡献 */
.contribution-records { display: flex; flex-direction: column; gap: 8px; }
.record-row { display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px; font-size: 13px; }
.record-value { color: #2ecc71; font-weight: bold; }
.record-time { color: #666; font-size: 11px; }

/* 掌门面板 */
.leader-card { border-color: rgba(255, 193, 7, 0.3); }
.btn-group { display: flex; gap: 10px; }

/* 成员列表 */
.member-list { display: flex; flex-direction: column; gap: 8px; }
.member-row { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; }
.member-main { display: flex; gap: 12px; align-items: center; }
.member-name { color: #7eb8da; font-weight: 500; }
.member-title { color: #f0c040; font-size: 12px; padding: 2px 8px; background: rgba(240, 192, 64, 0.1); border-radius: 4px; }
.member-level { color: #888; font-size: 12px; }
.member-extra { display: flex; gap: 8px; align-items: center; }
.member-exp { color: #aaa; font-size: 12px; }
.member-ops { display: flex; gap: 4px; }
.btn-xs { padding: 3px 8px; font-size: 11px; border-radius: 4px; border: 1px solid rgba(126, 184, 218, 0.3); background: rgba(126, 184, 218, 0.1); color: #7eb8da; cursor: pointer; }
.btn-xs.btn-danger { border-color: rgba(231, 76, 60, 0.3); background: rgba(231, 76, 60, 0.1); color: #e74c3c; }

/* 修炼 */
.practice-status { background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; margin-bottom: 16px; }
.status-row { color: #ccc; margin-bottom: 6px; }
.status-row .warning { color: #e74c3c; }
.practice-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.practice-card { background: rgba(75, 135, 195, 0.1); border: 1px solid rgba(75, 135, 195, 0.2); border-radius: 8px; padding: 16px; text-align: center; cursor: pointer; transition: all 0.2s; }
.practice-card:hover { border-color: #4B87C3; background: rgba(75, 135, 195, 0.15); }
.practice-icon { font-size: 40px; margin-bottom: 8px; }
.practice-name { color: #7eb8da; font-weight: 500; margin-bottom: 4px; }
.practice-desc { color: #888; font-size: 12px; }

/* 技能 */
.skill-list { display: flex; flex-direction: column; gap: 12px; }
.skill-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 6px; }
.skill-info { flex: 1; }
.skill-name-row { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }
.skill-name { color: #eee; font-weight: 500; }
.skill-level { font-size: 11px; padding: 2px 6px; border-radius: 4px; }
.skill-level.丙 { background: rgba(136, 136, 136, 0.2); color: #888; }
.skill-level.乙 { background: rgba(126, 184, 218, 0.2); color: #7eb8da; }
.skill-level.甲 { background: rgba(240, 192, 64, 0.2); color: #f0c040; }
.skill-level.绝 { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }
.skill-desc-short { color: #888; font-size: 12px; }
.skill-action { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.skill-cost { color: #ffc107; font-size: 12px; }
.badge-success { color: #2ecc71; font-size: 12px; }

/* 任务 */
.task-list { display: flex; flex-direction: column; gap: 12px; }
.task-item { padding: 12px; background: rgba(0,0,0,0.2); border-radius: 6px; }
.task-header { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.task-title { color: #eee; font-weight: 500; }
.task-tag { font-size: 11px; padding: 2px 6px; border-radius: 4px; }
.task-tag.daily { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
.task-tag.sect { background: rgba(126, 184, 218, 0.2); color: #7eb8da; }
.task-desc { color: #aaa; font-size: 13px; margin-bottom: 8px; line-height: 1.4; }
.task-rewards { display: flex; gap: 12px; margin-bottom: 8px; }
.reward { color: #888; font-size: 12px; }

/* 仓库 */
.fund-display { background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); padding: 12px; border-radius: 6px; margin-bottom: 16px; color: #ffc107; }
.sub-title { color: #888; font-size: 14px; margin: 16px 0 8px 0; }
.item-list, .donation-list { display: flex; flex-direction: column; gap: 8px; }
.item-row, .donation-row { display: flex; justify-content: space-between; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px; font-size: 13px; }
.muted { color: #666; font-size: 11px; }

/* 排行 */
.lb-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.lb-tab { flex: 1; padding: 8px; background: rgba(75, 135, 195, 0.1); border: 1px solid rgba(75, 135, 195, 0.2); border-radius: 6px; color: #7eb8da; cursor: pointer; }
.lb-tab.active { background: rgba(75, 135, 195, 0.2); border-color: #4B87C3; }
.leaderboard { display: flex; flex-direction: column; gap: 8px; }
.leaderboard-row { display: flex; gap: 12px; align-items: center; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; }
.rank { font-size: 20px; width: 30px; }
.name { color: #eee; flex: 1; }
.sect { width: 100px; font-size: 12px; }
.value { color: #ffc107; font-weight: bold; }

/* 弹窗 */
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: linear-gradient(135deg, #1a1a2e, #16213e); border: 1px solid #4B87C3; border-radius: 12px; padding: 24px; width: 90%; max-width: 400px; }
.modal-content h3 { color: #7eb8da; margin: 0 0 20px 0; text-align: center; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; color: #aaa; font-size: 13px; margin-bottom: 6px; }
.input { width: 100%; padding: 8px 12px; background: rgba(0,0,0,0.3); border: 1px solid #3a4a5a; border-radius: 4px; color: #eee; }
.hint { background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); padding: 12px; border-radius: 6px; text-align: center; color: #ffc107; font-size: 13px; margin-bottom: 16px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }

/* 动画 */
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* 响应式 */
@media (max-width: 768px) {
  .detail-grid, .info-grid-2 { grid-template-columns: 1fr; }
  .practice-grid { grid-template-columns: 1fr; }
  .skill-item { flex-direction: column; align-items: flex-start; gap: 12px; }
  .skill-action { flex-direction: row; align-items: center; }
}
</style>
