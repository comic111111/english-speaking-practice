import { NextRequest, NextResponse } from 'next/server';
import { generateEvaluationServer } from '@/lib/langchain/server-agent';
import type { ScenarioType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { scenarioId, history } = await request.json();

    const evaluation = await generateEvaluationServer(
      scenarioId as ScenarioType,
      history as Array<{ role: 'user' | 'assistant'; content: string }>
    );

    return NextResponse.json(evaluation);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}