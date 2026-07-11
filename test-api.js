const { ChatOpenAI } = require('@langchain/openai');

const deepseekChat = new ChatOpenAI({
  model: 'deepseek-chat',
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: process.env.DEEPSEEK_API_URL,
  },
  temperature: 0.7,
});

async function testAPI() {
  try {
    const response = await deepseekChat.invoke([
      { role: 'system', content: '你是一个测试助手' },
      { role: 'user', content: 'Hello' },
    ]);
    console.log('✅ API 连接成功！');
    console.log('响应内容:', response.content);
    process.exit(0);
  } catch (error) {
    console.error('❌ API 连接失败:', error.message);
    process.exit(1);
  }
}

testAPI();