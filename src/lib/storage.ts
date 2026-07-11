/**
 * localStorage 工具函数
 * 用于管理本地数据存储
 */

import type { ConversationRecord, UserStats } from '@/types';

// 存储键名
const STORAGE_KEYS = {
  CONVERSATIONS: 'english-practice-conversations',
  USER_STATS: 'english-practice-user-stats',
  CURRENT_SCENARIO: 'english-practice-current-scenario',
};

/**
 * 获取所有对话记录
 */
export function getConversations(): ConversationRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('读取对话记录失败:', error);
    return [];
  }
}

/**
 * 保存对话记录
 */
export function saveConversation(record: ConversationRecord): void {
  try {
    const conversations = getConversations();
    
    // 查找是否已存在该记录
    const existingIndex = conversations.findIndex(c => c.id === record.id);
    
    if (existingIndex >= 0) {
      // 更新现有记录
      conversations[existingIndex] = record;
    } else {
      // 添加新记录
      conversations.unshift(record);
    }
    
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (error) {
    console.error('保存对话记录失败:', error);
  }
}

/**
 * 删除对话记录
 */
export function deleteConversation(id: string): void {
  try {
    const conversations = getConversations();
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error('删除对话记录失败:', error);
  }
}

/**
 * 获取单个对话记录
 */
export function getConversationById(id: string): ConversationRecord | null {
  const conversations = getConversations();
  return conversations.find(c => c.id === id) || null;
}

/**
 * 获取用户统计数据
 */
export function getUserStats(): UserStats {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_STATS);
    
    if (data) {
      return JSON.parse(data);
    }
    
    // 返回默认统计数据
    return {
      totalPracticeTime: 0,
      totalConversationRounds: 0,
      consecutiveDays: 0,
      lastPracticeDate: '',
      dailyScores: [],
      averageDimensions: {
        grammar: 0,
        vocabulary: 0,
        fluency: 0,
        pronunciation: 0,
      },
      scenarioCounts: {
        restaurant: 0,
        airport: 0,
        ielts: 0,
      },
    };
  } catch (error) {
    console.error('读取用户统计失败:', error);
    return {
      totalPracticeTime: 0,
      totalConversationRounds: 0,
      consecutiveDays: 0,
      lastPracticeDate: '',
      dailyScores: [],
      averageDimensions: {
        grammar: 0,
        vocabulary: 0,
        fluency: 0,
        pronunciation: 0,
      },
      scenarioCounts: {
        restaurant: 0,
        airport: 0,
        ielts: 0,
      },
    };
  }
}

/**
 * 更新用户统计数据
 */
export function updateUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('更新用户统计失败:', error);
  }
}

/**
 * 更新连续打卡天数
 */
export function updateConsecutiveDays(): number {
  const stats = getUserStats();
  const today = new Date().toISOString().split('T')[0];
  
  if (stats.lastPracticeDate === today) {
    // 今天已经练习过，不增加天数
    return stats.consecutiveDays;
  }
  
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (stats.lastPracticeDate === yesterday) {
    // 昨天练习过，连续天数 +1
    stats.consecutiveDays += 1;
  } else if (stats.lastPracticeDate === '') {
    // 第一次练习
    stats.consecutiveDays = 1;
  } else {
    // 中断了，重新开始
    stats.consecutiveDays = 1;
  }
  
  stats.lastPracticeDate = today;
  updateUserStats(stats);
  
  return stats.consecutiveDays;
}

/**
 * 更新练习统计数据
 */
export function updatePracticeStats(
  scenarioId: 'restaurant' | 'airport' | 'ielts',
  rounds: number,
  duration: number, // 分钟
  evaluationScore: number
): void {
  const stats = getUserStats();
  const today = new Date().toISOString().split('T')[0];
  
  // 更新总练习时长和对话轮次
  stats.totalPracticeTime += duration;
  stats.totalConversationRounds += rounds;
  
  // 更新场景练习次数
  stats.scenarioCounts[scenarioId] += 1;
  
  // 更新每日得分
  const todayScoreIndex = stats.dailyScores.findIndex(s => s.date === today);
  if (todayScoreIndex >= 0) {
    // 更新今天的平均得分
    const existingScore = stats.dailyScores[todayScoreIndex].score;
    stats.dailyScores[todayScoreIndex].score = (existingScore + evaluationScore) / 2;
  } else {
    // 添加今天的得分记录
    stats.dailyScores.push({
      date: today,
      score: evaluationScore,
    });
    
    // 保持最近30天的记录
    if (stats.dailyScores.length > 30) {
      stats.dailyScores = stats.dailyScores.slice(-30);
    }
  }
  
  updateUserStats(stats);
}

/**
 * 获取当前选择的场景
 */
export function getCurrentScenario(): 'restaurant' | 'airport' | 'ielts' | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SCENARIO);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

/**
 * 保存当前选择的场景
 */
export function saveCurrentScenario(scenarioId: 'restaurant' | 'airport' | 'ielts'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SCENARIO, JSON.stringify(scenarioId));
  } catch (error) {
    console.error('保存当前场景失败:', error);
  }
}

/**
 * 清除所有数据
 */
export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.USER_STATS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SCENARIO);
  } catch (error) {
    console.error('清除数据失败:', error);
  }
}