/**
 * 评价结果展示组件
 * 显示对话评价报告，包括四维评分、优缺点、学习建议等
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { EvaluationReport, EvaluationDimension } from '@/types';

interface EvaluationResultProps {
  evaluation: EvaluationReport;
  onClose: () => void;
  onRestart: () => void;
}

export function EvaluationResult({ evaluation, onClose, onRestart }: EvaluationResultProps) {
  const [animatedScores, setAnimatedScores] = useState({
    grammar: 0,
    vocabulary: 0,
    fluency: 0,
    pronunciation: 0,
    overall: 0,
  });

  // 数字递增动画
  useEffect(() => {
    const duration = 800; // 动画时长
    const steps = 20;
    const interval = duration / steps;
    
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      
      const progress = currentStep / steps;
      
      setAnimatedScores({
        grammar: Math.round(evaluation.dimensions.grammar.score * progress),
        vocabulary: Math.round(evaluation.dimensions.vocabulary.score * progress),
        fluency: Math.round(evaluation.dimensions.fluency.score * progress),
        pronunciation: Math.round(evaluation.dimensions.pronunciation.score * progress),
        overall: Math.round(evaluation.overallScore * progress),
      });
      
      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [evaluation]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    return '需要提高';
  };

  const dimensions = [
    { key: 'grammar' as const, label: '语法准确性', icon: '📝', score: evaluation.dimensions.grammar.score, description: evaluation.dimensions.grammar.description },
    { key: 'vocabulary' as const, label: '词汇丰富度', icon: '📚', score: evaluation.dimensions.vocabulary.score, description: evaluation.dimensions.vocabulary.description },
    { key: 'fluency' as const, label: '流利度', icon: '💬', score: evaluation.dimensions.fluency.score, description: evaluation.dimensions.fluency.description },
    { key: 'pronunciation' as const, label: '发音', icon: '🎤', score: evaluation.dimensions.pronunciation.score, description: evaluation.dimensions.pronunciation.description },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white shadow-xl">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">对话评价报告</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* 综合得分 */}
          <div className="text-center py-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl">
            <div className="relative inline-block">
              <div className={`text-6xl font-bold ${getScoreColor(animatedScores.overall)}`}>
                {animatedScores.overall}
              </div>
              <div className="text-lg text-muted-foreground mt-1">
                综合得分
              </div>
              <Badge 
                variant={animatedScores.overall >= 80 ? 'default' : 'secondary'}
                className={`mt-2 ${animatedScores.overall >= 80 ? 'bg-success text-white' : animatedScores.overall >= 60 ? 'bg-warning text-white' : 'bg-destructive text-white'}`}
              >
                {getScoreLabel(animatedScores.overall)}
              </Badge>
            </div>
          </div>

          {/* 四维评分 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">能力维度评分</h3>
            <div className="grid grid-cols-2 gap-4">
              {dimensions.map((dim) => (
                <Card key={dim.key} className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{dim.icon}</span>
                        <span className="font-medium text-foreground">{dim.label}</span>
                      </div>
                      <span className={`text-xl font-bold ${getScoreColor(animatedScores[dim.key])}`}>
                        {animatedScores[dim.key]}
                      </span>
                    </div>
                    <Progress 
                      value={animatedScores[dim.key]} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {dim.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 优点 */}
          {evaluation.strengths.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                <span className="text-success">✓</span>
                表现优秀的地方
              </h3>
              <div className="space-y-2">
                {evaluation.strengths.map((strength, index) => (
                  <div key={index} className="p-3 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-sm text-foreground">{strength}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 需要改进 */}
          {evaluation.improvements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                <span className="text-warning">⚡</span>
                需要改进的地方
              </h3>
              <div className="space-y-2">
                {evaluation.improvements.map((improvement, index) => (
                  <div key={index} className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <p className="text-sm text-foreground">{improvement}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 学习建议 */}
          {evaluation.suggestions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                <span className="text-info">💡</span>
                学习建议
              </h3>
              <div className="space-y-2">
                {evaluation.suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 rounded-lg bg-info/10 border border-info/20">
                    <p className="text-sm text-foreground">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 语法纠正示例 */}
          {evaluation.grammarCorrections.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                <span className="text-primary">📝</span>
                语法纠正示例
              </h3>
              <div className="space-y-3">
                {evaluation.grammarCorrections.map((correction, index) => (
                  <Card key={index} className="shadow-sm">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Badge variant="destructive" className="text-xs">原句</Badge>
                          <p className="text-sm text-foreground flex-1">{correction.original}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Badge variant="default" className="text-xs bg-success">纠正</Badge>
                          <p className="text-sm text-foreground flex-1">{correction.corrected}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Badge variant="secondary" className="text-xs">解释</Badge>
                          <p className="text-sm text-muted-foreground flex-1">{correction.explanation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              返回首页
            </Button>
            <Button
              onClick={onRestart}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              再练一次
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}