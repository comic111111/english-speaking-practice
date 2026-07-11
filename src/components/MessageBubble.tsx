/**
 * 对话消息气泡组件
 * 显示用户和AI的消息，采用气泡样式
 */

'use client';

import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import { useSpeechSynthesis } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean; // 是否正在流式输出
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const { speak, isSpeaking, cancel, isSupported } = useSpeechSynthesis();
  
  const isUser = message.type === 'user';

  const handleSpeak = () => {
    if (isSpeaking) {
      cancel();
    } else {
      speak(message.content);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={cn(
      'flex w-full mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[80%] md:max-w-[70%]',
        'relative'
      )}>
        {/* 消息气泡 */}
        <div className={cn(
          'px-4 py-3 rounded-2xl shadow-sm',
          'transition-all duration-200',
          isUser 
            ? 'bg-primary text-white rounded-br-md' 
            : 'bg-secondary text-foreground rounded-bl-md',
          isStreaming && 'animate-pulse'
        )}>
          {/* 消息内容 */}
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
            )}
          </p>
          
          {/* 语音识别置信度（仅用户消息显示） */}
          {isUser && message.audioConfidence && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <p className="text-xs text-white/80">
                语音识别置信度：{Math.round(message.audioConfidence * 100)}%
              </p>
            </div>
          )}
        </div>

        {/* 时间戳和操作按钮 */}
        <div className={cn(
          'flex items-center gap-2 mt-1',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
          
          {/* AI消息可以朗读 */}
          {!isUser && isSupported && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSpeak}
              className="h-6 px-2 text-xs"
            >
              {isSpeaking ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <polygon points="11,5 6,9 6,15 11,19 11,5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}