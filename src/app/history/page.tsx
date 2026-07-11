/**
 * 历史记录列表页面
 * 显示所有历史对话记录，可点击查看详情
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { getConversations, deleteConversation } from '@/lib/storage';
import type { ConversationRecord } from '@/types';

export default function HistoryPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = () => {
    const records = getConversations();
    setConversations(records);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      deleteConversation(id);
      loadConversations();
    }
  };

  const handleViewDetail = (id: string) => {
    router.push(`/history/${id}`);
  };

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
    if (score >= 80) return 'bg-success text-white';
    if (score >= 60) return 'bg-warning text-white';
    return 'bg-destructive text-white';
  };

  const getScenarioIcon = (scenarioId: string) => {
    const icons: Record<string, string> = {
      restaurant: '🍽️',
      airport: '✈️',
      ielts: '📝',
    };
    return icons[scenarioId] || '💬';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation title="历史记录" showBack />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 统计信息 */}
        <Card className="mb-6 bg-white shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总对话记录</p>
                <p className="text-2xl font-bold text-foreground">{conversations.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-primary">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 记录列表 */}
        {conversations.length > 0 ? (
          <div className="space-y-4">
            {conversations.map((record) => (
              <Card 
                key={record.id}
                className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    {/* 左侧信息 */}
                    <div className="flex-1" onClick={() => handleViewDetail(record.id)}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getScenarioIcon(record.scenarioId)}</span>
                        <div>
                          <h3 className="font-semibold text-foreground">{record.scenarioName}</h3>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(record.startTime)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-muted-foreground">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12,6 12,12 16,14" />
                          </svg>
                          <span className="text-sm text-muted-foreground">
                            {formatDuration(record.startTime, record.endTime)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-muted-foreground">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <span className="text-sm text-muted-foreground">
                            {record.totalRounds} 轮对话
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 右侧评分和操作 */}
                    <div className="flex flex-col items-end gap-2">
                      {record.evaluation ? (
                        <Badge className={getScoreColor(record.evaluation.overallScore)}>
                          {record.evaluation.overallScore} 分
                        </Badge>
                      ) : (
                        <Badge variant="secondary">未评价</Badge>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(record.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <polyline points="3,6 5,6 21,6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white shadow-sm">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-muted-foreground">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-foreground mb-2">暂无历史记录</p>
                <p className="text-sm text-muted-foreground mb-4">
                  开始练习后，对话记录会保存在这里
                </p>
                <Button
                  onClick={() => router.push('/')}
                  className="bg-primary hover:bg-primary/90"
                >
                  开始练习
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}