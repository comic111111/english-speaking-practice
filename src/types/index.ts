/**
 * 类型定义文件
 * 定义项目中使用的所有核心数据类型
 */

// 场景类型
export type ScenarioType = 'restaurant' | 'airport' | 'ielts';

// 场景配置
export interface Scenario {
  id: ScenarioType;
  name: string;
  description: string;
  icon: string;
  roleDescription: string;
  systemPrompt: string;
}

// 消息类型
export type MessageType = 'user' | 'ai';

// 单条消息
export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: number;
  audioConfidence?: number; // 语音识别置信度（仅用户消息有）
}

// 一轮对话（包含用户消息和AI回复）
export interface ConversationRound {
  id: string;
  userMessage: Message;
  aiMessage: Message;
  timestamp: number;
}

// 评价维度
export interface EvaluationDimension {
  name: string;
  score: number; // 0-100
  description: string;
}

// 语法纠正示例
export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

// 评价报告
export interface EvaluationReport {
  id: string;
  timestamp: number;
  scenarioId: ScenarioType;
  
  // 四维评分
  dimensions: {
    grammar: EvaluationDimension;
    vocabulary: EvaluationDimension;
    fluency: EvaluationDimension;
    pronunciation: EvaluationDimension;
  };
  
  // 优点列表
  strengths: string[];
  
  // 需要改进的地方
  improvements: string[];
  
  // 学习建议
  suggestions: string[];
  
  // 语法纠正示例
  grammarCorrections: GrammarCorrection[];
  
  // 综合得分
  overallScore: number;
}

// 对话记录
export interface ConversationRecord {
  id: string;
  scenarioId: ScenarioType;
  scenarioName: string;
  startTime: number;
  endTime?: number;
  messages: Message[];
  rounds: ConversationRound[];
  evaluation?: EvaluationReport;
  totalRounds: number;
  isActive: boolean;
}

// 用户学习统计
export interface UserStats {
  totalPracticeTime: number; // 总练习时长（分钟）
  totalConversationRounds: number; // 总对话轮次
  consecutiveDays: number; // 连续打卡天数
  lastPracticeDate: string; // 最后练习日期 YYYY-MM-DD
  
  // 每日得分记录
  dailyScores: Array<{
    date: string;
    score: number;
  }>;
  
  // 四维能力平均值
  averageDimensions: {
    grammar: number;
    vocabulary: number;
    fluency: number;
    pronunciation: number;
  };
  
  // 各场景练习次数
  scenarioCounts: {
    restaurant: number;
    airport: number;
    ielts: number;
  };
}

// API 响应类型
export interface DeepSeekResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

// 流式响应片段
export interface StreamChunk {
  id: string;
  choices: Array<{
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string;
  }>;
}