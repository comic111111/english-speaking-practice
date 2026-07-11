/**
 * 输入区域组件
 * 支持文字输入和语音输入两种方式
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSpeechRecognition } from '@/hooks/useSpeech';

interface InputAreaProps {
  onSendMessage: (message: string, audioConfidence?: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputArea({ 
  onSendMessage, 
  disabled = false,
  placeholder = '输入您的回复...'
}: InputAreaProps) {
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  
  const {
    isListening,
    transcript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 当语音识别有结果时，自动填充到输入框
  useEffect(() => {
    if (transcript) {
      setTextInput(transcript);
    }
  }, [transcript]);

  // 自动聚焦到输入框
  useEffect(() => {
    if (!disabled && inputMode === 'text' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled, inputMode]);

  const handleTextSubmit = () => {
    if (!textInput.trim() || disabled) return;
    
    onSendMessage(textInput.trim());
    setTextInput('');
    resetTranscript();
  };

  const handleVoiceSubmit = () => {
    if (!transcript.trim() || disabled) return;
    
    onSendMessage(transcript.trim(), confidence);
    setTextInput('');
    resetTranscript();
    stopListening();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const toggleVoiceMode = () => {
    if (inputMode === 'voice') {
      setInputMode('text');
      stopListening();
    } else {
      setInputMode('voice');
      startListening();
    }
  };

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-40">
      <div className="max-w-4xl mx-auto">
        {/* 语音识别状态提示 */}
        {isListening && (
          <div className="mb-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3">
              {/* 语音波形动画 */}
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-6 bg-primary rounded animate-pulse" style={{ animationDelay: '100ms' }} />
                <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '200ms' }} />
                <div className="w-1 h-5 bg-primary rounded animate-pulse" style={{ animationDelay: '300ms' }} />
                <div className="w-1 h-3 bg-primary rounded animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">正在录音...</p>
                <p className="text-xs text-muted-foreground">
                  {transcript || '请说出您的回复'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* 输入区域 */}
        <div className="flex gap-2">
          {/* 输入框 */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[48px] max-h-[120px] resize-none pr-12"
              rows={1}
            />
            
            {/* 字数提示 */}
            {textInput && (
              <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
                {textInput.length}
              </div>
            )}
          </div>

          {/* 语音按钮 */}
          {isSupported && (
            <Button
              variant={inputMode === 'voice' ? 'default' : 'outline'}
              size="icon"
              onClick={toggleVoiceMode}
              disabled={disabled}
              className={cn(
                'h-12 w-12',
                inputMode === 'voice' && 'bg-primary hover:bg-primary/90'
              )}
            >
              {isListening ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </Button>
          )}

          {/* 发送按钮 */}
          <Button
            onClick={inputMode === 'voice' && isListening ? handleVoiceSubmit : handleTextSubmit}
            disabled={disabled || (!textInput.trim() && !transcript.trim())}
            size="icon"
            className="h-12 w-12 bg-primary hover:bg-primary/90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22,2 15,22 11,13 2,9" />
            </svg>
          </Button>
        </div>

        {/* 输入模式切换提示 */}
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          {inputMode === 'text' ? (
            <span>按 Enter 发送，Shift + Enter 换行</span>
          ) : (
            <span>点击发送按钮完成语音输入</span>
          )}
        </div>
      </div>
    </div>
  );
}

// 导入 cn 工具函数
import { cn } from '@/lib/utils';