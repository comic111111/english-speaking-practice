/**
 * 语音识别和语音合成 Hook
 * 使用 Web Speech API 实现
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Web Speech API 类型定义
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

// 扩展 Window 接口
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

/**
 * 语音识别 Hook
 */
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // 检查浏览器支持
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('您的浏览器不支持语音识别功能');
      return;
    }

    setIsSupported(true);
    
    // 创建语音识别实例
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // 单次识别
    recognition.interimResults = true; // 显示临时结果
    recognition.lang = 'en-US'; // 英语
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      
      setTranscript(result[0].transcript);
      setConfidence(result[0].confidence);
      
      if (result.isFinal) {
        setIsListening(false);
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      
      switch (event.error) {
        case 'no-speech':
          setError('未检测到语音输入');
          break;
        case 'audio-capture':
          setError('无法访问麦克风');
          break;
        case 'not-allowed':
          setError('麦克风权限被拒绝');
          break;
        default:
          setError(`语音识别错误: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  /**
   * 开始语音识别
   */
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('语音识别不可用');
      return;
    }

    setError(null);
    setTranscript('');
    setConfidence(0);
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (e) {
      // 可能已经在识别中，先停止再开始
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.start();
          }
        }, 100);
      }
    }
  }, [isSupported]);

  /**
   * 停止语音识别
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  /**
   * 重置状态
   */
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}

/**
 * 语音合成 Hook
 */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // 检查浏览器支持
    if (!window.speechSynthesis) {
      setIsSupported(false);
      setError('您的浏览器不支持语音合成功能');
      return;
    }

    setIsSupported(true);
  }, []);

  /**
   * 朗读文本
   */
  const speak = useCallback((text: string, rate = 0.9, pitch = 1) => {
    if (!isSupported || !window.speechSynthesis) {
      setError('语音合成不可用');
      return;
    }

    // 停止当前朗读
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // 英语
    utterance.rate = rate; // 语速
    utterance.pitch = pitch; // 音调
    
    // 尝试选择英语女声
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => 
      v.lang.startsWith('en') && v.name.includes('Female')
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      setError(`语音合成错误: ${event.error}`);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  /**
   * 停止朗读
   */
  const cancel = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  /**
   * 检查语音列表是否已加载
   */
  useEffect(() => {
    if (isSupported && window.speechSynthesis) {
      // 确保语音列表已加载
      window.speechSynthesis.getVoices();
      
      // 有些浏览器需要等待 voiceschanged 事件
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    error,
    speak,
    cancel,
  };
}