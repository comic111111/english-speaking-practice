import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { Scenario } from '@/types';

export function createScenarioPrompt(scenario: Scenario): ChatPromptTemplate {
  const systemPrompt = `你是一个专业的英语口语练习助手。

核心规则：
- 使用自然、地道的英语回复
- 保持角色设定，不要跳出角色
- 回复简洁，1-3句话即可
- 鼓励用户练习，提供积极反馈
- 不要直接纠正语法错误，用自然对话引导用户

场景设定：
` + scenario.description + `

当前角色：` + scenario.roleDescription;

  const prompt = ChatPromptTemplate.fromMessages([
    { role: 'system', content: systemPrompt },
    ['user', '{input}'],
  ]);

  return prompt;
}

export function createEvaluationPrompt(conversationText: string): ChatPromptTemplate {
  const EVALUATION_JSON_EXAMPLE = `{{
  "dimensions": {{
    "grammar": {{"score": 0-100, "description": "brief description"}},
    "vocabulary": {{"score": 0-100, "description": "brief description"}},
    "fluency": {{"score": 0-100, "description": "brief description"}},
    "pronunciation": {{"score": 0-100, "description": "estimated based on text content"}}
  }},
  "strengths": ["2-3 specific strengths"],
  "improvements": ["2-3 specific areas to improve"],
  "suggestions": ["2-3 specific learning suggestions"],
  "grammarCorrections": [
    {{"original": "original sentence", "corrected": "corrected version", "explanation": "why"}}
  ],
  "overallScore": 0-100
}}`;

  const systemPrompt = `你是一个专业的英语学习评估专家。

根据以下对话，为英语学习者提供全面的评估报告。

评估要求：
1. 从四个维度进行评分（0-100分）
2. 提供具体的优点和改进建议
3. 给出语法纠正示例（如果有）
4. 提供学习建议

请以JSON格式输出评估结果：

` + EVALUATION_JSON_EXAMPLE + `

只返回JSON，不要包含其他文字。`;

  const prompt = ChatPromptTemplate.fromMessages([
    { role: 'system', content: systemPrompt },
    ['user', '对话内容：\n' + conversationText],
  ]);

  return prompt;
}