
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TeleprompterSettings } from '../types';

interface TeleprompterOverlayProps {
  settings: TeleprompterSettings;
  onClose: () => void;
  onUpdateSpeed: (speed: number) => void;
}

const TeleprompterOverlay: React.FC<TeleprompterOverlayProps> = ({ settings, onClose, onUpdateSpeed }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [scrollPos, setScrollPos] = useState(0);

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: -40 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const requestRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  const pixelsPerSecond = (settings.speed / 60) * 18;

  const animate = useCallback((time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time;

    // 检查是否滚动到底部，如果是则停止播放
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const containerHeight = contentRef.current.parentElement?.clientHeight || 0;
      const maxScroll = contentHeight - containerHeight;

      setScrollPos(prev => {
        const newPos = prev + (pixelsPerSecond * (16.7 / 1000));
        // 如果超过最大滚动距离，停止播放并固定在最后位置
        if (newPos >= maxScroll) {
          setIsPlaying(false);
          return maxScroll;
        }
        return newPos;
      });
    } else {
      setScrollPos(prev => prev + (pixelsPerSecond * (16.7 / 1000)));
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [pixelsPerSecond]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
      const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        clearInterval(timer);
      };
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [isPlaying, animate]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fontSizeClass = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl'
  }[settings.fontSize];

  // 焦点框高度根据字体大小动态调整（与编辑器同步）
  const focusLineHeights = {
    small: 'h-10',    // 40px - 适配小字体
    medium: 'h-14',   // 56px - 适配中字体
    large: 'h-20'     // 80px - 适配大字体
  };

  // Dragging handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    setIsDragging(true);
    dragStartRef.current = {
      x: clientX - position.x,
      y: clientY - position.y
    };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      setPosition({
        x: clientX - dragStartRef.current.x,
        y: clientY - dragStartRef.current.y
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  return (
    <div ref={containerRef} className="h-full w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Simulation */}
      <div className="absolute inset-0 z-0 bg-[#080c10] overflow-hidden p-8 flex flex-col gap-6 opacity-40 pointer-events-none">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`aspect-square rounded-2xl ${i % 3 === 0 ? 'bg-primary/20' : 'bg-white/5'}`} />
          ))}
        </div>
      </div>

      {/* Floating Window (Draggable) */}
      <div
        className="relative z-10 w-full aspect-[4/3] bg-[#000000] rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,1)] border border-white/20 flex flex-col overflow-hidden select-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >

        {/* Header Bar */}
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent z-20">
          <div className="flex items-center gap-2">
            <div className={`size-2 rounded-full bg-red-500 ${isPlaying ? 'animate-pulse' : ''}`} />
            <span className="text-white text-[10px] font-bold tracking-tight uppercase">REC {formatTime(elapsedTime)}</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">fullscreen</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {/* Synchronized Focus Line */}
          {settings.showFocusLine && (
            <div className="absolute inset-0 flex flex-col justify-center pointer-events-none z-10">
              <div className={`${focusLineHeights[settings.fontSize]} w-full border-y border-primary/50 shadow-[0_0_20px_rgba(13,127,242,0.2)]`} />
            </div>
          )}

          <div
            ref={contentRef}
            className={`flex-1 px-8 flex flex-col items-center transition-transform duration-75 ease-linear ${settings.mirrorMode ? 'scale-x-[-1]' : ''}`}
            style={{
              transform: `translateY(${-scrollPos}px)`,
              paddingTop: '35%',
              paddingBottom: '35%'
            }}
          >
            <div className={`text-center space-y-4 font-bold leading-relaxed ${fontSizeClass}`}>
              {settings.script.split('\n').map((line, idx) => (
                <p key={idx} className="text-white/90">{line || '\u00A0'}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="size-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined fill-1 text-2xl">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <span className="text-white text-[12px] font-black tracking-tight uppercase">{settings.speed} WPM</span>
          </div>

          {/* Drag Handle */}
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="size-10 flex items-center justify-center text-white/30 cursor-move hover:text-white/60 transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">drag_indicator</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeleprompterOverlay;
