import { ChatOpenAI } from '@langchain/openai';

export const deepseekChat = new ChatOpenAI({
  model: 'deepseek-chat',
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: process.env.DEEPSEEK_API_URL,
  },
  temperature: 0.7,
  maxTokens: 500,
});

export const deepseekChatForEvaluation = new ChatOpenAI({
  model: 'deepseek-chat',
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: process.env.DEEPSEEK_API_URL,
  },
  temperature: 0.3,
  maxTokens: 1000,
});