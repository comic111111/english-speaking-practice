import { deepseekChatForEvaluation } from './llm';
import { createEvaluationPrompt } from './prompts';
import type { ScenarioType, EvaluationReport } from '@/types';

export async function generateEvaluationServer(
  scenarioId: ScenarioType,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<EvaluationReport | null> {
  try {
    const conversationText = conversationHistory
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const evaluationPrompt = createEvaluationPrompt(conversationText);

    const chain = evaluationPrompt.pipe(deepseekChatForEvaluation);
    
    const response = await chain.invoke({});

    const content = response.content as string;

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