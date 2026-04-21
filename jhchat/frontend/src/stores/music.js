import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'

export const useMusicStore = defineStore('music', () => {
  // 音乐列表
  const musicList = [
    { id: 'default_bgm', name: '🎵 默认背景音乐' },
    { id: 39, name: '笑傲江湖' },
    { id: 1, name: '爱的奉献' },
    { id: 2, name: '爱之初体验' },
    { id: 3, name: '把悲伤留给自己' },
    { id: 4, name: '博基上校进行曲' },
    { id: 5, name: '不要分离' },
    { id: 6, name: '不知不觉想起你' },
    { id: 7, name: '不装饰你的梦' },
    { id: 8, name: '长江之歌' },
    { id: 9, name: '迟来的爱' },
    { id: 10, name: '春节' },
    { id: 11, name: '春节序曲' },
    { id: 12, name: '单身情歌' },
    { id: 13, name: '独钓一江秋' },
    { id: 14, name: '对你太在乎' },
    { id: 15, name: '飞船即将坠毁' },
    { id: 16, name: '奉献' },
    { id: 17, name: '敢去承担爱' },
    { id: 18, name: '给你一份惊喜' },
    { id: 19, name: '国歌' },
    { id: 20, name: '好日子' },
    { id: 21, name: '洪湖水 2' },
    { id: 22, name: '呼吸我' },
    { id: 23, name: '加尔各答的天使' },
    { id: 24, name: '将自己给你' },
    { id: 25, name: '今宵多珍重' },
    { id: 26, name: '京腔京韵' },
    { id: 27, name: '九月九的酒' },
    { id: 28, name: '辣妹子' },
    { id: 29, name: '流浪歌手的情人' },
    { id: 30, name: '路边的野花不要采' },
    { id: 31, name: '没有恋爱的日子' },
    { id: 32, name: '没有雨的夜里' },
    { id: 33, name: '每一句说话' },
    { id: 34, name: '梦回故园' },
    { id: 35, name: '梦驼铃' },
    { id: 36, name: '秘密情人' },
    { id: 37, name: '呢喃' },
    { id: 38, name: '你怎么舍得我难过' },
    { id: 40, name: '千千阙歌' },
    { id: 41, name: '如果可以再见你' },
    { id: 42, name: '山丹丹' },
    { id: 43, name: '伤了三个心' },
    { id: 44, name: '伤心太平洋' },
    { id: 45, name: '死不了' },
    { id: 46, name: '天涯' },
    { id: 47, name: '天意' },
    { id: 48, name: '同桌的你' },
    { id: 49, name: '童年' },
    { id: 50, name: '弯弯的月亮' }
  ]

  const currentMusicId = ref('default_bgm')  // 默认播放 default_bgm.mp3
  const isPlaying = ref(false)
  const audioElement = ref(null)
  
  // 首页登录页音乐状态
  const landingAudioElement = ref(null)
  const isLandingPlaying = ref(false)

  // 计算属性
  const currentMusicName = computed(() => {
    const music = musicList.find(m => m.id === currentMusicId.value)
    return music ? music.name : '音乐'
  })

  const currentMusicUrl = computed(() => {
    return `/assets/music/${currentMusicId.value}.mp3`
  })

  // 方法
  function setAudioElement(element) {
    audioElement.value = element
  }

  function setLandingAudioElement(element) {
    landingAudioElement.value = element
  }

  function toggle() {
    if (!audioElement.value) return

    if (isPlaying.value) {
      audioElement.value.pause()
    } else {
      audioElement.value.play().catch(err => {
        console.warn('音乐播放失败:', err)
        isPlaying.value = false
      })
    }
  }

  function play() {
    if (!audioElement.value) return
    audioElement.value.play().catch(err => {
      console.warn('音乐播放失败:', err)
      isPlaying.value = false
    })
  }

  function pause() {
    if (!audioElement.value) return
    audioElement.value.pause()
  }

  function setMusic(musicId) {
    const wasPlaying = isPlaying.value
    currentMusicId.value = musicId
    
    // 等待 DOM 更新后重新播放
    if (wasPlaying && audioElement.value) {
      nextTick(() => {
        if (audioElement.value) {
          audioElement.value.currentTime = 0
          audioElement.value.play()
        }
      })
    }
  }

  function onPlay() {
    isPlaying.value = true
  }

  function onPause() {
    isPlaying.value = false
  }

  function onError(e) {
    console.warn('音乐播放错误:', e)
    isPlaying.value = false
  }

  function onEnded() {
    // 循环播放由 HTML audio 元素的 loop 属性处理
    isPlaying.value = false
  }
  
  // 首页登录页音乐控制
  function playLandingMusic() {
    if (!landingAudioElement.value) return
    landingAudioElement.value.play().catch(err => {
      console.warn('首页音乐播放失败:', err)
    })
  }
  
  function pauseLandingMusic() {
    if (!landingAudioElement.value) return
    landingAudioElement.value.pause()
  }
  
  function onLandingPlay() {
    isLandingPlaying.value = true
  }
  
  function onLandingPause() {
    isLandingPlaying.value = false
  }
  
  function onLandingError(e) {
    console.warn('首页音乐播放错误:', e)
    isLandingPlaying.value = false
  }
  
  // 页面切换时暂停首页音乐
  function stopLandingMusicForNavigation() {
    if (landingAudioElement.value && isLandingPlaying.value) {
      landingAudioElement.value.pause()
      isLandingPlaying.value = false
    }
  }

  return {
    // 状态
    musicList,
    currentMusicId,
    isPlaying,
    isLandingPlaying,
    // 计算属性
    currentMusicName,
    currentMusicUrl,
    // 方法
    setAudioElement,
    setLandingAudioElement,
    toggle,
    play,
    pause,
    setMusic,
    onPlay,
    onPause,
    onError,
    onEnded,
    playLandingMusic,
    pauseLandingMusic,
    onLandingPlay,
    onLandingPause,
    onLandingError,
    stopLandingMusicForNavigation
  }
})
