/**
 * DeepSeek API 调用工具
 * 用于调用 DeepSeek API 进行对话和评价生成
 */

import type { Scenario, EvaluationReport, StreamChunk } from '@/types';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// TODO: 如果遇到 CORS 问题，可能需要设置代理
// 示例：const CORS_PROXY = 'https://your-cors-proxy.com/';
const CORS_PROXY = '';

/**
 * 获取实际的 API URL
 */
function getApiUrl(): string {
  return CORS_PROXY ? `${CORS_PROXY}${DEEPSEEK_API_URL}` : DEEPSEEK_API_URL;
}

/**
 * 获取 API Headers
 */
function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
  };
}

/**
 * 场景配置数据
 */
export const SCENARIOS: Scenario[] = [
  {
    id: 'restaurant',
    name: '餐厅点餐',
    description: '练习在餐厅点餐、询问菜品、与服务员交流',
    icon: '🍽️',
    roleDescription: '餐厅服务员',
    systemPrompt: `You are a friendly restaurant waiter helping customers order food. Your role is to:
1. Greet customers warmly
2. Introduce menu items and answer questions about dishes
3. Handle orders professionally
4. Make polite conversation

Rules:
- Stay in character as a waiter
- Use natural, conversational English
- Keep responses concise (1-3 sentences)
- Be encouraging and supportive
- If user makes grammar mistakes, don't correct immediately but respond naturally`,
  },
  {
    id: 'airport',
    name: '机场值机',
    description: '练习在机场办理登机手续、询问航班信息、解决问题',
    icon: '✈️',
    roleDescription: '机场地勤人员',
    systemPrompt: `You are a professional airport ground staff helping passengers with check-in. Your role is to:
1. Assist with check-in procedures
2. Answer questions about flights, baggage, and boarding
3. Handle passenger concerns professionally
4. Provide clear instructions

Rules:
- Stay in character as airport staff
- Use clear, professional English
- Keep responses concise (1-3 sentences)
- Be helpful and reassuring
- If user makes grammar mistakes, don't correct immediately but respond naturally`,
  },
  {
    id: 'ielts',
    name: '雅思口语考试',
    description: '模拟雅思口语考试 Part 1 & Part 2，获得专业反馈',
    icon: '📝',
    roleDescription: '雅思口语考官',
    systemPrompt: `You are a professional IELTS speaking examiner. Follow these strict instructions:

EXAMINER ROLE:
- Start by asking a general question about "technology"
- After each response, ask at least 2 follow-up questions to dig deeper
- If user's response is less than 30 words, encourage them to speak more
- Every 5 rounds of conversation, provide a summary of grammar mistakes
- Maintain a professional yet friendly exam atmosphere

QUESTION STRATEGY:
1. First question: Always start with a technology-related topic (e.g., "Do you use technology a lot in your daily life?")
2. Follow-up: Ask open-ended questions to encourage detailed responses
3. Probe: Ask about specific examples, reasons, or personal opinions

RESPONSE GUIDELINES:
- Keep your questions clear and concise
- Use formal but natural English
- Wait for the user to finish before responding
- Record any grammar errors for the 5-round summary

GRAMMAR SUMMARY (every 5 rounds):
- List the most common grammar mistakes made
- Provide corrections with examples
- Keep the summary brief and constructive

Your goal is to simulate a real IELTS speaking test experience and help the candidate improve.`,
  },
];

/**
 * 生成对话响应（流式输出）
 */
export async function generateConversationStream(
  scenarioId: 'restaurant' | 'airport' | 'ielts',
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  const scenario = SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) {
    onError('场景不存在');
    return;
  }

  const messages = [
    { role: 'system', content: scenario.systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      onError(errorData.error?.message || 'API 调用失败');
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('无法读取响应流');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      // 解析 SSE 格式的数据
      const lines = buffer.split('\n');
      buffer = '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            onComplete();
            return;
          }
          
          try {
            const chunk: StreamChunk = JSON.parse(data);
            const content = chunk.choices[0]?.delta?.content;
            
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // JSON 解析失败，可能是不完整的数据，继续累积
            buffer = line;
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error.message : '网络请求失败');
  }
}

/**
 * 生成评价报告（非流式）
 */
export async function generateEvaluation(
  scenarioId: 'restaurant' | 'airport' | 'ielts',
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<EvaluationReport | null> {
  const evaluationPrompt = `Based on the following conversation, provide a comprehensive evaluation report for the English learner.

Conversation:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

Please provide an evaluation in JSON format with the following structure:
{
  "dimensions": {
    "grammar": {"score": 0-100, "description": "brief description"},
    "vocabulary": {"score": 0-100, "description": "brief description"},
    "fluency": {"score": 0-100, "description": "brief description"},
    "pronunciation": {"score": 0-100, "description": "estimated based on text content"}
  },
  "strengths": ["2-3 specific strengths"],
  "improvements": ["2-3 specific areas to improve"],
  "suggestions": ["2-3 specific learning suggestions"],
  "grammarCorrections": [
    {"original": "original sentence", "corrected": "corrected version", "explanation": "why"}
  ],
  "overallScore": 0-100
}

Provide realistic scores based on the English level shown in the conversation. Return only valid JSON, no additional text.`;

  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: evaluationPrompt }],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('评价生成失败:', await response.json());
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('无评价内容');
      return null;
    }

    // 解析 JSON 评价结果
    try {
      const evaluation = JSON.parse(content);
      
      return {
        id: `eval-${Date.now()}`,
        timestamp: Date.now(),
        scenarioId,
        ...evaluation,
      };
    } catch (e) {
      console.error('评价 JSON 解析失败:', e);
      return null;
    }
  } catch (error) {
    console.error('评价请求失败:', error);
    return null;
  }
}

/**
 * 获取场景配置
 */
export function getScenarioById(id: 'restaurant' | 'airport' | 'ielts'): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}

/**
 * 获取所有场景配置
 */
export function getAllScenarios(): Scenario[] {
  return SCENARIOS;
}