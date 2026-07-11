/**
 * 底部栏组件
 * 显示在页面底部，显示当前选择的场景名称
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { getScenarioById } from '@/lib/api';
import type { ScenarioType } from '@/types';

interface FooterProps {
  currentScenario: ScenarioType | null;
}

export function Footer({ currentScenario }: FooterProps) {
  if (!currentScenario) {
    return null;
  }

  const scenario = getScenarioById(currentScenario);
  
  if (!scenario) {
    return null;
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-4 py-3 shadow-md md:hidden">
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl">{scenario.icon}</span>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            当前场景：{scenario.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {scenario.roleDescription}
          </p>
        </div>
      </div>
    </footer>
  );
}