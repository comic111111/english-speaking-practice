/**
 * 对话练习页面
 * 用户在此页面与AI进行实时对话练习
 */

'use client';

export const runtime = 'edge';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { MessageBubble } from '@/components/MessageBubble';
import { InputArea } from '@/components/InputArea';
import { EvaluationResult } from '@/components/EvaluationResult';
import { getScenarioById } from '@/lib/api';
import { generateConversationStream, generateEvaluation } from '@/lib/langchain';
import { saveConversation, updateConsecutiveDays, updatePracticeStats } from '@/lib/storage';
import type { Message, ConversationRecord, EvaluationReport, ScenarioType } from '@/types';

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = params.scenarioId as ScenarioType;
  
  const [scenario, setScenario] = useState<ReturnType<typeof getScenarioById>>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rounds, setRounds] = useState(0);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [conversationId, setConversationId] = useState(`conv-${Date.now()}`);
  const [startTime, setStartTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // 加载场景和更新连续学习天数
  useEffect(() => {
    const scenario = getScenarioById(scenarioId);
    if (scenario) {
      setScenario(scenario);
    } else {
      router.push('/');
      return;
    }
    updateConsecutiveDays();
    setIsLoading(false);
  }, [scenarioId, router]);

  // 发送消息处理
  const handleSendMessage = useCallback(async (
    userContent: string, 
    audioConfidence?: number
  ) => {
    if (!scenario || isAiResponding) return;

    // 创建用户消息
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      type: 'user',
      content: userContent,
      timestamp: Date.now(),
      audioConfidence,
    };

    // 添加用户消息
    setMessages(prev => [...prev, userMessage]);
    
    // 更新对话历史
    conversationHistoryRef.current.push({
      role: 'user',
      content: userContent,
    });

    // 开始AI响应
    setIsAiResponding(true);
    setStreamingMessage('');

    let aiResponse = '';
    
    // 调用 DeepSeek API（流式输出，带会话记忆）
    await generateConversationStream(
      scenarioId,
      userContent,
      conversationId,
      (chunk) => {
        // 流式输出回调
        aiResponse += chunk;
        setStreamingMessage(aiResponse);
      },
      () => {
        // 完成回调
        const aiMessage: Message = {
          id: `msg-${Date.now()}-ai`,
          type: 'ai',
          content: aiResponse,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, aiMessage]);
        setStreamingMessage('');
        setIsAiResponding(false);

        // 更新对话历史
        conversationHistoryRef.current.push({
          role: 'assistant',
          content: aiResponse,
        });

        // 更新轮次
        const newRounds = rounds + 1;
        setRounds(newRounds);

        // 达到5轮自动结束并生成评价
        if (newRounds >= 5) {
          handleEndConversation([...messages, userMessage, aiMessage], newRounds);
        }
      },
      (error) => {
        // 错误回调
        console.error('AI响应失败:', error);
        setIsAiResponding(false);
        setStreamingMessage('');
        
        // 添加错误消息
        const errorMessage: Message = {
          id: `msg-${Date.now()}-error`,
          type: 'ai',
          content: `抱歉，出现了错误：${error}`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    );
  }, [scenario, scenarioId, isAiResponding, rounds, messages]);

  // 结束对话并生成评价
  const handleEndConversation = async (
    finalMessages?: Message[], 
    finalRounds?: number
  ) => {
    const currentMessages = finalMessages || messages;
    const currentRounds = finalRounds || rounds;

    if (currentMessages.length === 0) {
      router.push('/');
      return;
    }

    setIsAiResponding(true);

    // 生成评价报告
    const evalReport = await generateEvaluation(
      scenarioId,
      conversationHistoryRef.current
    );

    setIsAiResponding(false);

    if (evalReport) {
      setEvaluation(evalReport);
      setShowEvaluation(true);
    }

    // 保存对话记录
    const record: ConversationRecord = {
      id: conversationId,
      scenarioId,
      scenarioName: scenario?.name || '',
      startTime,
      endTime: Date.now(),
      messages: currentMessages,
      rounds: [],
      evaluation: evalReport || undefined,
      totalRounds: currentRounds,
      isActive: false,
    };

    saveConversation(record);

    // 更新统计数据
    if (evalReport) {
      const duration = Math.round((Date.now() - startTime) / 60000); // 分钟
      updatePracticeStats(scenarioId, currentRounds, duration, evalReport.overallScore);
    }
  };

  // 用户手动结束对话
  const handleManualEnd = () => {
    handleEndConversation();
  };

  // 关闭评价弹窗，返回首页
  const handleCloseEvaluation = () => {
    setShowEvaluation(false);
    router.push('/');
  };

  // 重新开始对话
  const handleRestart = () => {
    setMessages([]);
    setRounds(0);
    setEvaluation(null);
    setShowEvaluation(false);
    setConversationId(`conv-${Date.now()}`);
    setStartTime(Date.now());
    conversationHistoryRef.current = [];
  };

  if (isLoading || !scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">
            {isLoading ? '加载中...' : '场景不存在'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-16">
      <Navigation title={scenario.name} showBack />
      <Footer currentScenario={scenarioId} />
      
      <main className="container mx-auto px-4 py-4 max-w-4xl">
        {/* 对话信息卡片 */}
        <Card className="mb-4 shadow-sm">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{scenario.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    AI角色：{scenario.roleDescription}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scenario.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  第 {rounds} / 5 轮
                </Badge>
                
                {rounds > 0 && rounds < 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualEnd}
                    disabled={isAiResponding}
                  >
                    结束对话
                  </Button>
                )}
                
                {rounds >= 5 && !showEvaluation && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleManualEnd}
                    disabled={isAiResponding}
                    className="bg-primary"
                  >
                    查看评价
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 对话消息区域 */}
        <div className="space-y-2 mb-4">
          {/* 初始欢迎消息 */}
          {messages.length === 0 && !isAiResponding && (
            <div className="text-center py-8">
              <div className="inline-block px-6 py-4 rounded-2xl bg-secondary shadow-sm">
                <p className="text-base text-foreground">
                  👋 Hello! I'm your {scenario.roleDescription.toLowerCase()}. Let's start our conversation!
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  请用英语与我对话，我会根据场景进行回复
                </p>
              </div>
            </div>
          )}

          {/* 消息列表 */}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* 流式输出消息 */}
          {isAiResponding && streamingMessage && (
            <MessageBubble 
              message={{
                id: 'streaming',
                type: 'ai',
                content: streamingMessage,
                timestamp: Date.now(),
              }}
              isStreaming={true}
            />
          )}

          {/* AI正在思考提示 */}
          {isAiResponding && !streamingMessage && (
            <div className="flex justify-start mb-4">
              <div className="px-4 py-3 rounded-2xl bg-secondary shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-secondary-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-secondary-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-secondary-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">AI正在思考...</span>
                </div>
              </div>
            </div>
          )}

          {/* 滚动锚点 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        {!showEvaluation && (
          <InputArea 
            onSendMessage={handleSendMessage}
            disabled={isAiResponding}
            placeholder="用英语回复..."
          />
        )}

        {/* 评价结果弹窗 */}
        {showEvaluation && evaluation && (
          <EvaluationResult 
            evaluation={evaluation}
            onClose={handleCloseEvaluation}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
}