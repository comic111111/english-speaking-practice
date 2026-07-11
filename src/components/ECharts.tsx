/**
 * ECharts 图表组件
 * 通过 CDN 加载 ECharts，支持多种图表类型
 */

'use client';

import { useEffect, useRef, useState } from 'react';

interface EChartsProps {
  option: Record<string, unknown>; // ECharts 配置项
  style?: React.CSSProperties;
  className?: string;
}

export function ECharts({ option, style, className }: EChartsProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载 ECharts CDN
  useEffect(() => {
    const loadECharts = async () => {
      try {
        // 检查是否已加载
        if (window.echarts) {
          setIsLoading(false);
          return;
        }

        // 动态加载 ECharts CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
        script.async = true;
        
        script.onload = () => {
          setIsLoading(false);
        };
        
        script.onerror = () => {
          setError('加载 ECharts 失败');
          setIsLoading(false);
        };
        
        document.head.appendChild(script);
      } catch (e) {
        setError('加载 ECharts 失败');
        setIsLoading(false);
      }
    };

    loadECharts();
  }, []);

  // 初始化图表
  useEffect(() => {
    if (!isLoading && !error && chartRef.current && window.echarts) {
      const chart = window.echarts.init(chartRef.current) as {
        setOption: (opt: Record<string, unknown>) => void;
        resize: () => void;
        dispose: () => void;
      };
      setChartInstance(chart);
      
      chart.setOption(option);

      // 响应式调整
      const handleResize = () => {
        chart.resize();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.dispose();
      };
    }
  }, [isLoading, error, option]);

  // 更新图表配置
  useEffect(() => {
    if (chartInstance) {
      (chartInstance as {
        setOption: (opt: Record<string, unknown>) => void;
      }).setOption(option);
    }
  }, [option, chartInstance]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载图表...</div>
      </div>
    );
  }

  return (
    <div 
      ref={chartRef} 
      className={className}
      style={{ ...style, width: '100%', height: '300px' }}
    />
  );
}

// 声明全局 echarts 类型
declare global {
  interface Window {
    echarts: {
      init: (element: HTMLElement) => unknown;
    };
  }
}