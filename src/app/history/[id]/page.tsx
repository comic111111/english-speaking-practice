/**
 * 历史记录详情页面
 * 显示单个对话记录的完整内容和评价报告
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Navigation } from '@/components/Navigation';
import { MessageBubble } from '@/components/MessageBubble';
import { getConversationById } from '@/lib/storage';
import type { ConversationRecord } from '@/types';

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  
  const [record, setRecord] = useState<ConversationRecord | null>(null);

  useEffect(() => {
    const conversationRecord = getConversationById(conversationId);
    setRecord(conversationRecord);
  }, [conversationId]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: number, end?: number) => {
    if (!end) return '进行中';
    const duration = Math.round((end - start) / 60000);
    return `${duration} 分钟`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScenarioIcon = (scenarioId: string) => {
    const icons: Record<string, string> = {
      restaurant: '🍽️',
      airport: '✈️',
      ielts: '📝',
    };
    return icons[scenarioId] || '💬';
  };

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">记录不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation title={record.scenarioName} showBack />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 基本信息 */}
        <Card className="mb-6 bg-white shadow-sm">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">场景</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <span className="text-xl">{getScenarioIcon(record.scenarioId)}</span>
                  {record.scenarioName}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">开始时间</p>
                <p className="font-medium text-foreground">{formatDate(record.startTime)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">练习时长</p>
                <p className="font-medium text-foreground">{formatDuration(record.startTime, record.endTime)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">对话轮次</p>
                <p className="font-medium text-foreground">{record.totalRounds} 轮</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 评价报告 */}
        {record.evaluation && (
          <Card className="mb-6 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>评价报告</span>
                <Badge className={`${
                  record.evaluation.overallScore >= 80 ? 'bg-success text-white' : 
                  record.evaluation.overallScore >= 60 ? 'bg-warning text-white' : 
                  'bg-destructive text-white'
                }`}>
                  {record.evaluation.overallScore} 分
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 四维评分 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { key: 'grammar', label: '语法准确性', icon: '📝', score: record.evaluation.dimensions.grammar.score, description: record.evaluation.dimensions.grammar.description },
                  { key: 'vocabulary', label: '词汇丰富度', icon: '📚', score: record.evaluation.dimensions.vocabulary.score, description: record.evaluation.dimensions.vocabulary.description },
                  { key: 'fluency', label: '流利度', icon: '💬', score: record.evaluation.dimensions.fluency.score, description: record.evaluation.dimensions.fluency.description },
                  { key: 'pronunciation', label: '发音', icon: '🎤', score: record.evaluation.dimensions.pronunciation.score, description: record.evaluation.dimensions.pronunciation.description },
                ].map((dim) => (
                  <Card key={dim.key} className="shadow-sm">
                    <CardContent className="pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-lg">{dim.icon}</span>
                          <span className="font-medium text-foreground text-sm">{dim.label}</span>
                        </div>
                        <span className={`font-bold ${getScoreColor(dim.score)}`}>
                          {dim.score}
                        </span>
                      </div>
                      <Progress value={dim.score} className="h-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 优点 */}
              {record.evaluation.strengths.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-1">
                    <span className="text-success">✓</span>
                    表现优秀的地方
                  </h3>
                  <div className="space-y-2">
                    {record.evaluation.strengths.map((strength, index) => (
                      <div key={index} className="p-2 rounded-lg bg-success/10 border border-success/20">
                        <p className="text-sm text-foreground">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 需要改进 */}
              {record.evaluation.improvements.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-1">
                    <span className="text-warning">⚡</span>
                    需要改进的地方
                  </h3>
                  <div className="space-y-2">
                    {record.evaluation.improvements.map((improvement, index) => (
                      <div key={index} className="p-2 rounded-lg bg-warning/10 border border-warning/20">
                        <p className="text-sm text-foreground">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 学习建议 */}
              {record.evaluation.suggestions.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-1">
                    <span className="text-info">💡</span>
                    学习建议
                  </h3>
                  <div className="space-y-2">
                    {record.evaluation.suggestions.map((suggestion, index) => (
                      <div key={index} className="p-2 rounded-lg bg-info/10 border border-info/20">
                        <p className="text-sm text-foreground">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 语法纠正 */}
              {record.evaluation.grammarCorrections.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-1">
                    <span className="text-primary">📝</span>
                    语法纠正示例
                  </h3>
                  <div className="space-y-2">
                    {record.evaluation.grammarCorrections.map((correction, index) => (
                      <Card key={index} className="shadow-sm">
                        <CardContent className="pt-3">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <Badge variant="destructive" className="text-xs">原句</Badge>
                              <p className="text-sm text-foreground">{correction.original}</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <Badge variant="default" className="text-xs bg-success">纠正</Badge>
                              <p className="text-sm text-foreground">{correction.corrected}</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <Badge variant="secondary" className="text-xs">解释</Badge>
                              <p className="text-sm text-muted-foreground">{correction.explanation}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 对话内容 */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">对话内容</CardTitle>
          </CardHeader>
          <CardContent>
            {record.messages.length > 0 ? (
              <div className="space-y-2">
                {record.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">暂无对话内容</p>
            )}
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/history')}
            className="flex-1"
          >
            返回列表
          </Button>
          <Button
            onClick={() => router.push(`/practice/${record.scenarioId}`)}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            再练一次
          </Button>
        </div>
      </main>
    </div>
  );
}