
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TeleprompterSettings } from '../types';
import CanvasRenderer from './CanvasRenderer';

interface TeleprompterOverlayProps {
  settings: TeleprompterSettings;
  onClose: () => void;
  onUpdateSpeed: (speed: number) => void;
}

const TeleprompterOverlay: React.FC<TeleprompterOverlayProps> = ({ settings, onClose, onUpdateSpeed }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: -40 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Resize handler
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (contentContainerRef.current) {
        setCanvasSize({
          width: contentContainerRef.current.clientWidth,
          height: contentContainerRef.current.clientHeight
        });
      }
    };

    // Initial size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Timer
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  const handleFinish = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 relative overflow-hidden pointer-events-none">
      {/* Background Simulation */}
      <div className="absolute inset-0 z-0 bg-[#080c10] overflow-hidden p-8 flex flex-col gap-6 opacity-40">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`aspect-square rounded-2xl ${i % 3 === 0 ? 'bg-primary/20' : 'bg-white/5'}`} />
          ))}
        </div>
      </div>

      {/* Floating Window (Draggable) */}
      <div
        className="relative z-10 w-full max-w-lg aspect-[4/3] bg-[#000000] rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,1)] border border-white/20 flex flex-col overflow-hidden select-none pointer-events-auto"
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

        {/* Content Area - NOW CANVAS */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-black" ref={contentContainerRef}>
          {/* Render Canvas if size is ready */}
          {canvasSize.width > 0 && (
            <CanvasRenderer
              settings={settings}
              isPlaying={isPlaying}
              width={canvasSize.width}
              height={canvasSize.height}
              onFinish={handleFinish}
            />
          )}
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
            <span className="text-white text-[12px] font-black tracking-tight uppercase min-w-[60px]">{settings.speed} WPM</span>
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
