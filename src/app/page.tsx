/**
 * 首页 - 场景选择页面
 * 用户可以在此选择想要练习的情景场景
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { getAllScenarios, getScenarioById } from '@/lib/api';
import { getUserStats, saveCurrentScenario } from '@/lib/storage';
import type { Scenario, ScenarioType, UserStats } from '@/types';
import Link from 'next/link';

const defaultStats: UserStats = {
  totalPracticeTime: 0,
  totalConversationRounds: 0,
  consecutiveDays: 0,
  lastPracticeDate: '',
  dailyScores: [],
  averageDimensions: {
    grammar: 0,
    vocabulary: 0,
    fluency: 0,
    pronunciation: 0,
  },
  scenarioCounts: {
    restaurant: 0,
    airport: 0,
    ielts: 0,
  },
};

export default function HomePage() {
  const router = useRouter();
  const [scenarios] = useState<Scenario[]>(getAllScenarios());
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
  const [stats, setStats] = useState(defaultStats);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setStats(getUserStats());
  }, []);

  const handleScenarioSelect = (scenarioId: ScenarioType) => {
    setSelectedScenario(scenarioId);
    saveCurrentScenario(scenarioId);
  };

  const handleStartPractice = () => {
    if (selectedScenario) {
      router.push(`/practice/${selectedScenario}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation title="英语口语陪练" />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 顶部统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总练习时长</p>
                  <p className="text-2xl font-bold text-foreground" suppressHydrationWarning>
                    {stats.totalPracticeTime}
                  </p>
                  <p className="text-xs text-muted-foreground">分钟</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-primary">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">对话轮次</p>
                  <p className="text-2xl font-bold text-foreground" suppressHydrationWarning>
                    {stats.totalConversationRounds}
                  </p>
                  <p className="text-xs text-muted-foreground">轮</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-secondary-foreground">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">连续打卡</p>
                  <p className="text-2xl font-bold text-foreground" suppressHydrationWarning>
                    {stats.consecutiveDays}
                  </p>
                  <p className="text-xs text-muted-foreground">天</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-success">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 场景选择区域 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">选择练习场景</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedScenario === scenario.id
                    ? 'ring-2 ring-primary shadow-lg scale-105'
                    : 'shadow-sm hover:scale-102'
                }`}
                onClick={() => handleScenarioSelect(scenario.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{scenario.icon}</span>
                    {selectedScenario === scenario.id && (
                      <Badge className="bg-primary text-white">已选择</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{scenario.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {scenario.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      AI角色：{scenario.roleDescription}
                    </span>
                    <Badge variant="secondary" className="text-xs" suppressHydrationWarning>
                      已练习 {stats.scenarioCounts[scenario.id]} 次
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 开始练习按钮 */}
        {selectedScenario && (
          <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 z-40">
            <Button
              onClick={handleStartPractice}
              className="w-full max-w-4xl mx-auto h-14 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg"
              size="lg"
            >
              开始练习
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 ml-2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        )}

        {/* 快捷导航 */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Link href="/dashboard">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-info">
                      <path d="M3 3v18h18" />
                      <path d="M18 17V9" />
                      <path d="M13 17V5" />
                      <path d="M8 17v-3" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">学习仪表盘</p>
                    <p className="text-xs text-muted-foreground">查看详细数据</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/history">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-warning">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">历史记录</p>
                    <p className="text-xs text-muted-foreground">查看过往对话</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}