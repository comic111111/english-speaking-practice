import { NextRequest, NextResponse } from 'next/server';
import { generateEvaluationServer } from '@/lib/langchain/server-agent';
import type { ScenarioType } from '@/types';

export const runtime = 'edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  console.log('[evaluation] 收到评价请求, URL:', request.url);

  try {
    const { scenarioId, history } = await request.json();
    console.log('[evaluation] 请求参数:', {
      scenarioId,
      historyLength: history?.length,
    });

    if (!scenarioId || !history || !Array.isArray(history)) {
      console.warn('[evaluation] 参数无效:', { scenarioId, historyType: typeof history });
      return NextResponse.json(
        { error: '参数无效: 需要 scenarioId 和 history 数组' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('[evaluation] 开始生成评价, 使用 ChatOpenAI...');
    const evaluation = await generateEvaluationServer(
      scenarioId as ScenarioType,
      history as Array<{ role: 'user' | 'assistant'; content: string }>
    );

    console.log('[evaluation] 评价生成结果:', evaluation ? '成功' : '返回 null');

    if (!evaluation) {
      console.error('[evaluation] 评价生成失败, 返回 null');
      return NextResponse.json(
        { error: '评价生成失败, 请检查 LLM 配置' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('[evaluation] 评价总得分:', evaluation.overallScore);
    return NextResponse.json(evaluation, { headers: corsHeaders });
  } catch (error) {
    console.error('[evaluation] API 处理错误:', error);
    console.error('[evaluation] 错误堆栈:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}