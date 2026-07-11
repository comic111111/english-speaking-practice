import { NextRequest, NextResponse } from 'next/server';
import { getScenarioById } from '@/lib/api';
import { getHistoryFromMemory, addMessageToMemory, getRoundCount } from '@/lib/langchain/memory';
import { generateAndStoreFeedback } from '@/lib/langchain/agent';
import type { ScenarioType } from '@/types';

export const runtime = 'edge';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  console.log('[conversation] 收到请求, URL:', request.url);
  console.log('[conversation] 请求方法:', request.method);

  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  console.log('[conversation] DEEPSEEK_API_KEY 是否存在:', !!DEEPSEEK_API_KEY);
  console.log('[conversation] DEEPSEEK_API_URL:', process.env.DEEPSEEK_API_URL);

  try {
    const body = await request.json();
    const { scenarioId, message, sessionId } = body;
    console.log('[conversation] 请求参数:', { scenarioId, messageLength: message?.length, sessionId });

    const scenario = getScenarioById(scenarioId as ScenarioType);
    if (!scenario) {
      console.warn('[conversation] 场景不存在:', scenarioId);
      return NextResponse.json({ error: '场景不存在' }, { status: 400, headers: corsHeaders });
    }

    if (!DEEPSEEK_API_KEY) {
      console.error('[conversation] DEEPSEEK_API_KEY 未配置');
      return NextResponse.json({ error: 'API 密钥未配置' }, { status: 500, headers: corsHeaders });
    }

    const historyMessages = await getHistoryFromMemory(sessionId || 'default');
    const roundCount = getRoundCount(sessionId || 'default');
    console.log('[conversation] 历史消息数:', historyMessages.length, '当前轮次:', roundCount);

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

    console.log('[conversation] 开始调用 DeepSeek API');
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

    console.log('[conversation] DeepSeek API 响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[conversation] DeepSeek API 错误:', response.status, errorText);
      let errorMessage = 'API 调用失败';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status, headers: corsHeaders }
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      console.error('[conversation] 无法读取响应流');
      return NextResponse.json({ error: '无法读取响应流' }, { status: 500, headers: corsHeaders });
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
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
                    console.log('[conversation] 流结束, 响应长度:', fullResponse.length);
                    await addMessageToMemory(sessionId || 'default', 'assistant', fullResponse);

                    generateAndStoreFeedback(sessionId || 'default', message, fullResponse).catch(
                      (err) => console.error('[conversation] 反馈存储失败:', err)
                    );

                    controller.enqueue(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
                  }
                } catch (e) {
                  if (dataStr.trim() !== '[DONE]') {
                    console.error('[conversation] 解析 SSE 数据失败:', e, '原始数据:', dataStr);
                  }
                }
              }
            }
          }

          if (fullResponse) {
            console.log('[conversation] 流完成, 总响应长度:', fullResponse.length);
            await addMessageToMemory(sessionId || 'default', 'assistant', fullResponse);

            generateAndStoreFeedback(sessionId || 'default', message, fullResponse).catch(
              (err) => console.error('[conversation] 反馈存储失败:', err)
            );
          }

          controller.close();
        } catch (streamError) {
          console.error('[conversation] 流处理错误:', streamError);
          controller.error(streamError);
        }
      },
    });

    console.log('[conversation] 返回流式响应');
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('[conversation] API 处理错误:', error);
    console.error('[conversation] 错误堆栈:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}