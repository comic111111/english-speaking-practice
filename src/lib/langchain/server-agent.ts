import { deepseekChatForEvaluation } from './llm';
import { createEvaluationPrompt } from './prompts';
import type { ScenarioType, EvaluationReport } from '@/types';

export async function generateEvaluationServer(
  scenarioId: ScenarioType,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<EvaluationReport | null> {
  console.log('[server-agent] 开始生成评价, scenarioId:', scenarioId);
  console.log('[server-agent] 对话历史长度:', conversationHistory.length);
  console.log('[server-agent] DEEPSEEK_API_KEY 是否存在:', !!process.env.DEEPSEEK_API_KEY);
  console.log('[server-agent] DEEPSEEK_API_URL:', process.env.DEEPSEEK_API_URL);

  try {
    const conversationText = conversationHistory
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
    console.log('[server-agent] 对话文本长度:', conversationText.length);

    const evaluationPrompt = createEvaluationPrompt(conversationText);
    console.log('[server-agent] 评价 prompt 已创建, 开始调用 LLM chain...');

    const chain = evaluationPrompt.pipe(deepseekChatForEvaluation);

    const response = await chain.invoke({});
    console.log('[server-agent] LLM chain 调用完成, 响应类型:', typeof response);

    const content = response.content as string;
    console.log('[server-agent] LLM 响应内容长度:', content?.length);
    console.log('[server-agent] LLM 响应前100字符:', content?.substring(0, 100));

    try {
      const evaluation = JSON.parse(content);
      console.log('[server-agent] JSON 解析成功');

      return {
        id: `eval-${Date.now()}`,
        timestamp: Date.now(),
        scenarioId,
        ...evaluation,
      };
    } catch (e) {
      console.error('[server-agent] 评价 JSON 解析失败:', e);
      console.error('[server-agent] 原始内容:', content);
      return null;
    }
  } catch (error) {
    console.error('[server-agent] 评价请求失败:', error);
    console.error('[server-agent] 错误堆栈:', error instanceof Error ? error.stack : 'N/A');
    return null;
  }
}