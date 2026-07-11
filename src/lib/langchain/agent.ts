import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { deepseekChat, deepseekChatForEvaluation } from './llm';
import { scenarioTools, FeedbackTool } from './tools';
import { getScenarioById } from '../api';
import { getRoundCount, addFeedbackToMemory, getFeedbacksFromMemory } from './memory';
import type { ScenarioType, EvaluationReport } from '@/types';

export function createConversationAgent(scenarioId: ScenarioType) {
  const scenario = getScenarioById(scenarioId);
  
  if (!scenario) {
    throw new Error(`场景 ${scenarioId} 不存在`);
  }

  const systemPrompt = `你是一个专业的英语口语练习助手。

核心规则：
- 使用自然、地道的英语回复
- 保持角色设定，不要跳出角色
- 回复简洁，1-3句话即可
- 鼓励用户练习，提供积极反馈
- 不要直接纠正语法错误，用自然对话引导用户

场景设定：
` + scenario.description + `

当前角色：` + scenario.roleDescription + `

你可以使用以下工具：
- check_grammar: 检查用户输入的英语语法错误
- get_word_definition: 查询单词的释义和用法
- get_recommendation: 根据用户水平推荐适合的练习内容
- feedback_tool: 在每轮对话后调用此工具，生成简短的反馈并存储
- lookup_word: 查询英语单词的中文释义、音标、词性和例句
- create_quiz: 根据当前对话主题生成一道英语选择题

当用户询问某个单词的意思、要求查词、或者想要练习题目时，主动调用对应的工具。

如果需要使用工具，请按照工具调用格式输出。`;

  const prompt = ChatPromptTemplate.fromMessages([
    { role: 'system', content: systemPrompt },
    ['placeholder', '{messages}'],
  ]);

  const agent = createReactAgent({
    llm: deepseekChat,
    prompt,
    tools: scenarioTools,
  });

  return agent;
}

export async function generateAgentResponse(
  scenarioId: ScenarioType,
  userMessage: string,
  sessionId: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  try {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      throw new Error(`场景 ${scenarioId} 不存在`);
    }

    const roundCount = getRoundCount(sessionId);

    const systemPrompt = `${scenario.systemPrompt}

当前对话轮次：${roundCount}
注意：如果是第5的倍数轮次（5, 10, 15...），请在回复中加入语法错误总结。`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ];

    const response = await deepseekChat.invoke(messages);
    
    const assistantMessage = response.content as string || '';

    await generateAndStoreFeedback(sessionId, userMessage, assistantMessage);

    return assistantMessage;
  } catch (error) {
    console.error('Agent 调用失败:', error);
    throw new Error(error instanceof Error ? error.message : 'Agent 调用失败');
  }
}

export async function generateAndStoreFeedback(
  sessionId: string,
  userMessage: string,
  assistantMessage: string
): Promise<void> {
  try {
    const prompt = `请根据以下对话生成简短的反馈：

用户输入：${userMessage}
助手回复：${assistantMessage}

请生成：
1. 用户的语法错误（如果有）
2. 用词建议
3. 改进建议

用非常简洁的英语回复，不超过50个词。`;

    const response = await deepseekChat.invoke([
      { role: 'system', content: '你是一个专业的英语学习反馈助手，提供简洁有效的学习建议。' },
      { role: 'user', content: prompt },
    ]);
    
    const feedback = response.content as string || 'No feedback available';
    
    await addFeedbackToMemory(sessionId, feedback);
    
    console.log('反馈已记录:', feedback);
  } catch (error) {
    console.error('反馈生成失败:', error);
  }
}

export async function getSessionFeedbacks(sessionId: string): Promise<Array<{ round: number; feedback: string }>> {
  try {
    const feedbacks = await getFeedbacksFromMemory(sessionId);
    return feedbacks.map(f => ({
      round: f.round,
      feedback: f.feedback,
    }));
  } catch (error) {
    console.error('获取反馈失败:', error);
    return [];
  }
}

export async function generateEvaluation(
  scenarioId: ScenarioType,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<EvaluationReport | null> {
  try {
    const response = await fetch('/api/evaluation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenarioId,
        history: conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error('评价请求失败');
    }

    const evaluation = await response.json();
    return evaluation;
  } catch (error) {
    console.error('评价请求失败:', error);
    return null;
  }
}