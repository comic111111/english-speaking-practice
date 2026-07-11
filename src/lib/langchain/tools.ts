import { Tool, DynamicStructuredTool } from '@langchain/core/tools';
import { deepseekChat } from './llm';
import { addFeedbackToMemory } from './memory';
import { z } from 'zod';

export class GrammarCheckTool extends Tool {
  name = 'check_grammar';
  description = '检查用户输入的英语语法错误，返回详细的语法分析和改进建议';

  async _call(text: string): Promise<string> {
    try {
      const prompt = `请分析以下英语句子的语法：

句子：${text}

请提供：
1. 语法正确性判断
2. 语法错误分析（如果有）
3. 修正建议

用简洁的中文回复。`;

      const response = await deepseekChat.invoke([
        { role: 'system', content: '你是一个专业的英语语法专家，擅长分析和纠正英语语法错误。' },
        { role: 'user', content: prompt },
      ]);

      return response.content as string || '语法检查完成，未发现明显错误。';
    } catch (error) {
      return `语法检查失败：${error instanceof Error ? error.message : '未知错误'}`;
    }
  }
}

export class WordDefinitionTool extends Tool {
  name = 'get_word_definition';
  description = '查询英语单词的释义、音标、词性和例句';

  async _call(word: string): Promise<string> {
    try {
      const prompt = `请提供单词 "${word}" 的详细信息：

1. 音标
2. 词性
3. 中文释义（多种含义）
4. 英文例句（含中文翻译）

用简洁的格式回复。`;

      const response = await deepseekChat.invoke([
        { role: 'system', content: '你是一个专业的英语词典助手，提供准确的单词释义和用法说明。' },
        { role: 'user', content: prompt },
      ]);

      return response.content as string || `未找到单词 "${word}" 的释义。`;
    } catch (error) {
      return `单词查询失败：${error instanceof Error ? error.message : '未知错误'}`;
    }
  }
}

export class RecommendationTool extends Tool {
  name = 'get_recommendation';
  description = '根据用户水平推荐适合的英语口语练习内容和场景';

  async _call(userLevel: string): Promise<string> {
    const recommendations: Record<string, string> = {
      beginner: '初学者建议：\n- 从餐厅点餐场景开始，练习基础日常对话\n- 重点练习简单句和常用词汇\n- 每天练习10-15分钟',
      intermediate: '中级学习者建议：\n- 尝试机场值机场景，练习更复杂的交流\n- 学习使用连接词和从句\n- 注重发音和语调练习',
      advanced: '高级学习者建议：\n- 挑战雅思口语场景，模拟真实考试环境\n- 练习长难句和复杂表达\n- 关注语域和用词精准度',
    };

    const basicLevels = ['beginner', '初级', '入门', '基础', 'low', 'easy', '简单'];
    const intermediateLevels = ['intermediate', '中级', '中等', 'medium', 'middle'];
    const advancedLevels = ['advanced', '高级', '困难', 'high', 'hard'];

    const normalizedLevel = userLevel.toLowerCase();

    if (basicLevels.some(l => normalizedLevel.includes(l))) {
      return recommendations.beginner;
    } else if (intermediateLevels.some(l => normalizedLevel.includes(l))) {
      return recommendations.intermediate;
    } else if (advancedLevels.some(l => normalizedLevel.includes(l))) {
      return recommendations.advanced;
    }

    return `请提供您的英语水平（beginner/intermediate/advanced），我会为您推荐适合的练习内容。`;
  }
}

export class FeedbackTool extends Tool {
  name = 'feedback_tool';
  description = '在每轮对话后调用此工具，生成简短的反馈并存储，用于后续对话改进';
  
  async _call(args: string): Promise<string> {
    try {
      const parsedArgs = JSON.parse(args);
      const { sessionId, userMessage, assistantMessage } = parsedArgs;
      
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
      
      return `反馈已记录: ${feedback}`;
    } catch (error) {
      return `反馈生成失败：${error instanceof Error ? error.message : '未知错误'}`;
    }
  }
}

export const lookupWordTool = new DynamicStructuredTool({
  name: 'lookup_word',
  description: '查询英语单词的中文释义、音标、词性和例句。当用户问某个单词是什么意思，或者需要查词时使用此工具。',
  schema: z.object({
    word: z.string().describe('要查询的英语单词'),
  }),
  func: async ({ word }) => {
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
      );

      if (!response.ok) {
        return `暂时无法查词 "${word}"，请稍后重试。`;
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        return `未找到单词 "${word}" 的释义。`;
      }

      const entry = data[0];
      const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || '';
      
      let meaningsText = '';
      let examples: string[] = [];
      
      if (entry.meanings && Array.isArray(entry.meanings)) {
        for (const meaning of entry.meanings.slice(0, 3)) {
          const partOfSpeech = meaning.partOfSpeech || '';
          const definitions = meaning.definitions || [];
          
          if (definitions.length > 0) {
            meaningsText += `\n【${partOfSpeech}】\n`;
            for (let i = 0; i < Math.min(2, definitions.length); i++) {
              const def = definitions[i];
              meaningsText += `${i + 1}. ${def.definition || ''}\n`;
              if (def.example) {
                examples.push(def.example);
              }
            }
          }
        }
      }

      let result = `单词: ${word}\n`;
      if (phonetic) {
        result += `音标: ${phonetic}\n`;
      }
      result += `释义:${meaningsText}`;
      
      if (examples.length > 0) {
        result += `\n例句:\n`;
        for (let i = 0; i < Math.min(2, examples.length); i++) {
          result += `${i + 1}. ${examples[i]}\n`;
        }
      }

      return result.trim();
    } catch (error) {
      return `暂时无法查词 "${word}"，请稍后重试。`;
    }
  },
});

export const createQuizTool = new DynamicStructuredTool({
  name: 'create_quiz',
  description: '根据当前对话主题生成一道英语选择题或填空题。当用户想要练习、测试或出题时使用此工具。',
  schema: z.object({
    topic: z.string().describe('对话主题，用于生成相关的练习题'),
  }),
  func: async ({ topic }) => {
    try {
      const prompt = `请根据主题 "${topic}" 生成一道英语选择题。

要求：
1. 题目要实用，适合中级英语学习者
2. 提供4个选项（A, B, C, D）
3. 给出正确答案
4. 提供简短的解析

请以 JSON 格式返回：
{
  "question": "题目内容",
  "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
  "answer": "正确答案（如 A）",
  "explanation": "答案解析"
}

只返回 JSON，不要包含其他文字。`;

      const response = await deepseekChat.invoke([
        { role: 'system', content: '你是一个专业的英语出题老师，擅长根据主题生成高质量的英语练习题。' },
        { role: 'user', content: prompt },
      ]);

      const content = response.content as string || '';
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const quiz = JSON.parse(jsonMatch[0]);
          return `📝 练习题\n\n题目：${quiz.question}\n\n选项：\n${quiz.options?.join('\n') || ''}\n\n答案：${quiz.answer}\n解析：${quiz.explanation || ''}`;
        }
      } catch (e) {
        // 解析失败，直接返回内容
      }

      return content || '题目生成失败，请稍后重试。';
    } catch (error) {
      return '题目生成失败，请稍后重试。';
    }
  },
});

export const scenarioTools = [
  new GrammarCheckTool(),
  new WordDefinitionTool(),
  new RecommendationTool(),
  new FeedbackTool(),
  lookupWordTool,
  createQuizTool,
];