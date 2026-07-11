import { NextRequest, NextResponse } from 'next/server';
import { getScenarioById } from '@/lib/api';
import { getHistoryFromMemory, addMessageToMemory, getRoundCount } from '@/lib/langchain/memory';
import { generateAndStoreFeedback } from '@/lib/langchain/agent';
import type { ScenarioType } from '@/types';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const { scenarioId, message, sessionId } = await request.json();

    const scenario = getScenarioById(scenarioId as ScenarioType);
    if (!scenario) {
      return NextResponse.json({ error: '场景不存在' }, { status: 400 });
    }

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'API 密钥未配置' }, { status: 500 });
    }

    const historyMessages = await getHistoryFromMemory(sessionId || 'default');
    const roundCount = getRoundCount(sessionId || 'default');

    const formattedHistory = historyMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const systemPrompt = `${scenario.systemPrompt}

当前对话轮次：${roundCount}
注意：如果是第5的倍数轮次（5, 10, 15...），请在回复中加入语法错误总结。`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message },
    ];

    await addMessageToMemory(sessionId || 'default', 'user', message);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
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
      return NextResponse.json(
        { error: errorData.error?.message || 'API 调用失败' },
        { status: response.status }
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: '无法读取响应流' }, { status: 500 });
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              try {
                const data = JSON.parse(dataStr);
                
                if (data.choices && data.choices[0] && data.choices[0].delta) {
                  const content = data.choices[0].delta.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
                  }
                }
                
                if (data.choices && data.choices[0] && data.choices[0].finish_reason) {
                  await addMessageToMemory(sessionId || 'default', 'assistant', fullResponse);
                  
                  generateAndStoreFeedback(sessionId || 'default', message, fullResponse).catch(
                    (err) => console.error('反馈存储失败:', err)
                  );
                  
                  controller.enqueue(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
                }
              } catch (e) {
                if (dataStr.trim() !== '[DONE]') {
                  console.error('解析 SSE 数据失败:', e);
                }
              }
            }
          }
        }

        if (fullResponse) {
          await addMessageToMemory(sessionId || 'default', 'assistant', fullResponse);
          
          generateAndStoreFeedback(sessionId || 'default', message, fullResponse).catch(
            (err) => console.error('反馈存储失败:', err)
          );
        }

        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API 处理错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}