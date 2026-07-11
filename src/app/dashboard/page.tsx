'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { ECharts } from '@/components/ECharts';
import { getUserStats } from '@/lib/storage';
import type { UserStats } from '@/types';

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

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setStats(getUserStats());
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation title="学习仪表盘" showBack />
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-white shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">加载中...</p>
                      <p className="text-2xl font-bold text-foreground">0</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <div className="w-5 h-5 bg-primary/30 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">每日得分趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  加载中...
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">四维能力评估</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  加载中...
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">各场景练习次数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                加载中...
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const lineChartOption = {
    title: {
      text: '每日得分趋势',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
      },
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: stats.dailyScores.map(s => s.date.slice(5)),
      axisLabel: {
        color: '#636E72',
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        color: '#636E72',
      },
    },
    series: [
      {
        name: '得分',
        type: 'line',
        data: stats.dailyScores.map(s => s.score),
        smooth: true,
        lineStyle: {
          color: '#FF7B54',
          width: 3,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 123, 84, 0.3)' },
              { offset: 1, color: 'rgba(255, 123, 84, 0.05)' },
            ],
          },
        },
        itemStyle: {
          color: '#FF7B54',
        },
      },
    ],
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '20%',
    },
  };

  const radarChartOption = {
    title: {
      text: '四维能力评估',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
      },
    },
    tooltip: {
      trigger: 'item',
    },
    radar: {
      indicator: [
        { name: '语法准确性', max: 100 },
        { name: '词汇丰富度', max: 100 },
        { name: '流利度', max: 100 },
        { name: '发音', max: 100 },
      ],
      axisName: {
        color: '#636E72',
      },
      splitLine: {
        lineStyle: {
          color: '#DFE6E9',
        },
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(78, 205, 196, 0.1)', 'rgba(78, 205, 196, 0.05)'],
        },
      },
    },
    series: [
      {
        name: '能力评估',
        type: 'radar',
        data: [
          {
            value: [
              stats.averageDimensions.grammar,
              stats.averageDimensions.vocabulary,
              stats.averageDimensions.fluency,
              stats.averageDimensions.pronunciation,
            ],
            name: '平均能力',
            areaStyle: {
              color: 'rgba(78, 205, 196, 0.3)',
            },
            lineStyle: {
              color: '#4ECDC4',
              width: 2,
            },
            itemStyle: {
              color: '#4ECDC4',
            },
          },
        ],
      },
    ],
  };

  const barChartOption = {
    title: {
      text: '各场景练习次数',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    xAxis: {
      type: 'category',
      data: ['餐厅点餐', '机场值机', '雅思口语'],
      axisLabel: {
        color: '#636E72',
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#636E72',
      },
    },
    series: [
      {
        name: '练习次数',
        type: 'bar',
        data: [
          stats.scenarioCounts.restaurant,
          stats.scenarioCounts.airport,
          stats.scenarioCounts.ielts,
        ],
        itemStyle: {
          color: '#00B894',
          borderRadius: [8, 8, 0, 0],
        },
        barWidth: '40%',
      },
    ],
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '20%',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation title="学习仪表盘" showBack />
      
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总练习时长</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalPracticeTime}</p>
                  <p className="text-xs text-muted-foreground">分钟</p>
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

          <Card className="bg-white shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">对话轮次</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalConversationRounds}</p>
                  <p className="text-xs text-muted-foreground">轮</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-secondary-foreground">
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
                  <p className="text-2xl font-bold text-foreground">{stats.consecutiveDays}</p>
                  <p className="text-xs text-muted-foreground">天</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-success">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">平均得分</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.dailyScores.length > 0 
                      ? Math.round(stats.dailyScores.reduce((a, b) => a + b.score, 0) / stats.dailyScores.length)
                      : 0
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">分</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-warning">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">每日得分趋势</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.dailyScores.length > 0 ? (
                <ECharts option={lineChartOption} />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  暂无数据，开始练习后会显示趋势
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">四维能力评估</CardTitle>
            </CardHeader>
            <CardContent>
              {(stats.averageDimensions.grammar > 0 || 
                stats.averageDimensions.vocabulary > 0 || 
                stats.averageDimensions.fluency > 0 || 
                stats.averageDimensions.pronunciation > 0) ? (
                <ECharts option={radarChartOption} />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  暂无数据，完成对话后会显示能力评估
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">各场景练习次数</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats.scenarioCounts.restaurant > 0 || 
              stats.scenarioCounts.airport > 0 || 
              stats.scenarioCounts.ielts > 0) ? (
              <ECharts option={barChartOption} />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                暂无数据，开始练习后会显示各场景统计
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}