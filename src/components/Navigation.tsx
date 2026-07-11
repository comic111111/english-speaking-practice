/**
 * 导航栏组件
 * 显示在页面顶部，包含返回按钮和连续学习天数
 */

'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { getUserStats } from '@/lib/storage';

interface NavigationProps {
  title?: string;
  showBack?: boolean;
}

export function Navigation({ title, showBack = false }: NavigationProps) {
  const router = useRouter();
  const [consecutiveDays, setConsecutiveDays] = useState(0);

  useEffect(() => {
    // 获取连续学习天数
    const stats = getUserStats();
    setConsecutiveDays(stats.consecutiveDays);
  }, []);

  const handleBack = () => {
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* 左侧：返回按钮或标题 */}
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Button>
          )}
          {title && (
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          )}
        </div>

        {/* 右侧：连续学习天数 */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary"
            className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 mr-1"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <span className="font-medium">
              {consecutiveDays > 0 ? `已连续学习 ${consecutiveDays} 天` : '开始学习'}
            </span>
          </Badge>
        </div>
      </div>
    </nav>
  );
}