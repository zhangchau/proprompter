
import React, { useState } from 'react';
import { TeleprompterSettings, FontSize } from '../types';

interface EditorProps {
  settings: TeleprompterSettings;
  onUpdate: (settings: Partial<TeleprompterSettings>) => void;
  onStart: () => void;
}

const Editor: React.FC<EditorProps> = ({ settings, onUpdate, onStart }) => {
  const charCount = settings.script.length;
  const [isControlPanelExpanded, setIsControlPanelExpanded] = useState(true);

  // 触摸滑动状态
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchCurrentY, setTouchCurrentY] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // Define exact font configurations (Must match CanvasRenderer)
  // small: ~text-lg/text-xl, medium: ~text-2xl/3xl, large: ~text-4xl/5xl
  const fontConfig = {
    small: { fontSize: '24px', lineHeight: '36px' },
    medium: { fontSize: '32px', lineHeight: '48px' },
    large: { fontSize: '48px', lineHeight: '72px' }
  };

  const currentFont = fontConfig[settings.fontSize];

  // 焦点框样式
  // Height must match lineHeight
  // Position must be synchronized with textarea padding
  const focusLineTop = '60px'; // Initial Focus Position

  // 触摸事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchCurrentY(e.touches[0].clientY);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    setTouchCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;

    const deltaY = touchCurrentY - touchStartY;
    const threshold = 50;

    if (deltaY > threshold) {
      setIsControlPanelExpanded(false);
    } else if (deltaY < -threshold) {
      setIsControlPanelExpanded(true);
    }

    setIsSwiping(false);
    setTouchStartY(0);
    setTouchCurrentY(0);
  };

  return (
    <div className="flex flex-col h-full relative bg-[#0a1118]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 pt-8 border-b border-white/5 shrink-0 z-20 bg-[#0a1118]">
        <div className="w-14"></div>
        <h1 className="text-sm font-bold text-white/90 tracking-wide">提词器</h1>
        <button
          onClick={() => onUpdate({ script: '' })}
          className="text-primary font-bold text-sm h-8 flex items-center justify-end transition-all w-14 hover:text-blue-400 active:scale-95"
        >
          清空
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Placeholder Label Area */}
        <div className="absolute top-[60px] left-6 right-6 pointer-events-none z-0">
          {settings.script.length === 0 && (
            <label
              className="text-[24px] font-bold text-white/20 tracking-wide uppercase animate-in fade-in duration-300"
              style={{ lineHeight: '36px' }}
            >
              请输入/粘贴文案...
            </label>
          )}
        </div>

        {/* Text Area */}
        <div className="flex-1 px-6 pb-32 overflow-y-auto custom-scrollbar relative z-0">
          <textarea
            className="w-full h-full bg-transparent border-none focus:ring-0 font-bold text-white/90 placeholder:text-transparent resize-none p-0 transition-opacity duration-200"
            style={{
              fontSize: currentFont.fontSize,
              lineHeight: currentFont.lineHeight,
              paddingTop: focusLineTop, // Align first line to focus line
              paddingBottom: '50vh' // Allow scrolling last line to top
            }}
            placeholder=""
            value={settings.script}
            onChange={(e) => onUpdate({ script: e.target.value })}
            spellCheck={false}
          />
        </div>

        {/* Focus Area Highlight Frame - Positioned Absolutely */}
        {settings.showFocusLine && (
          <div
            className="absolute inset-x-0 pointer-events-none z-10 transition-all duration-300 border-y border-primary/50 shadow-[0_0_20px_rgba(13,127,242,0.2)] bg-primary/5 backdrop-blur-[1px]"
            style={{
              top: focusLineTop,
              height: currentFont.lineHeight
            }}
          />
        )}

        <div className="absolute bottom-24 right-6 pointer-events-none z-10">
          <span className="text-[9px] text-white/20 font-bold tracking-widest uppercase bg-black/50 px-2 py-1 rounded">
            {charCount} Characters
          </span>
        </div>
      </main>

      {/* Control Panel (Drawer) */}
      <section
        className="absolute bottom-0 left-0 right-0 bg-[#0d1621] border-t border-white/10 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-50 transition-transform duration-300 ease-out"
        style={{
          transform: isControlPanelExpanded ? 'translateY(0)' : 'translateY(calc(100% - 3.5rem))'
        }}
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full flex justify-center py-3 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-10 h-1 rounded-full bg-white/20"></div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Speed Control */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-white/60 tracking-tight">滚动速度</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-primary tracking-tighter">{settings.speed}</span>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">WPM</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative flex items-center h-2">
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="5"
                  value={settings.speed}
                  onChange={(e) => onUpdate({ speed: parseInt(e.target.value) })}
                  className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div className="flex justify-between px-1">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">慢</span>
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">快</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Font Size Segmented Control */}
            <div className="bg-white/5 border border-white/5 p-3 rounded-2xl space-y-2">
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">字体</p>
              <div className="flex bg-black/40 p-1 rounded-2xl">
                {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => onUpdate({ fontSize: size })}
                    className={`flex-1 flex items-center justify-center py-2 rounded-xl transition-all duration-200 ${settings.fontSize === size
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.05] z-10'
                      : 'text-white/30 hover:text-white/50'
                      }`}
                  >
                    <span className={`font-bold ${size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-sm'}`}>
                      {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col justify-center space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">镜像</span>
                <button
                  onClick={() => onUpdate({ mirrorMode: !settings.mirrorMode })}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${settings.mirrorMode ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 shadow-sm ${settings.mirrorMode ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">焦点</span>
                <button
                  onClick={() => onUpdate({ showFocusLine: !settings.showFocusLine })}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${settings.showFocusLine ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 shadow-sm ${settings.showFocusLine ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onStart}
            className="w-full bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 text-white font-bold py-4 rounded-[1.25rem] flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 transition-all active:scale-[0.98] border border-white/10"
          >
            <span className="material-symbols-outlined text-lg">picture_in_picture_alt</span>
            <span className="text-sm tracking-wide">生成悬浮窗</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Editor;
