
import React, { useState, useCallback } from 'react';
import Editor from './components/Editor';
import TeleprompterOverlay from './components/TeleprompterOverlay';
import { AppMode, TeleprompterSettings, FontSize } from './types';
import { scriptApi } from './src/api/script';

const DEFAULT_SCRIPT = `AI产品管理正在从根本上改变我们处理软件开发生命周期的方式。通过将大型语言模型（LLM）直接集成到我们的产品中，我们不仅仅是在增加功能；我们正在通过自然语言重新构想用户体验。

作为产品经理，我们必须平衡生成式模型的幻觉风险与它们释放的巨大创造潜力。这需要从确定性逻辑向概率性结果的转变。今天，我们将讨论AI产品战略的三大支柱：数据来源、模型微调以及推动持续改进的反馈循环。

在设计AI产品时，请记住透明度是你最大的资产。用户需要知道他们何时在与智能体交互，并且他们需要明确的方式来验证输出。让我们深入探讨如何利用这些技术构建更直观、更强大的应用程序。`;

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.EDITOR);
  const [scriptId, setScriptId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<TeleprompterSettings>({
    speed: 25, // Default slower speed
    fontSize: 'medium',
    mirrorMode: false,
    showFocusLine: true,
    script: DEFAULT_SCRIPT
  });

  // Load initial script
  React.useEffect(() => {
    const loadScript = async () => {
      try {
        const scripts = await scriptApi.getAll();
        if (scripts.length > 0) {
          const firstScript = scripts[0];
          setScriptId(firstScript.id!);
          setSettings({
            speed: firstScript.speed!,
            mirrorMode: (firstScript as any).mirror_mode ?? false,
            showFocusLine: (firstScript as any).show_focus_line ?? true,
            script: firstScript.content,
            fontSize: (firstScript.font_size as FontSize) || 'medium',
          });
        } else {
          // Create default script if none exists
          const newScript = await scriptApi.create(settings);
          setScriptId(newScript.id!);
        }
      } catch (error) {
        console.error("Failed to load scripts:", error);
      } finally {
        setLoading(false);
      }
    };
    loadScript();
  }, []);

  const handleUpdateSettings = useCallback((newSettings: Partial<TeleprompterSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };

      // Auto-save to backend
      if (scriptId) {
        // Debounce could be added here, but for now direct update is okay for low frequency changes
        scriptApi.update(scriptId, newSettings).catch(err => console.error("Auto-save failed:", err));
      }

      return updated;
    });
  }, [scriptId]);

  const handleOpenFloating = () => {
    setMode(AppMode.FLOATING);
  };

  const handleCloseFloating = () => {
    setMode(AppMode.EDITOR);
  };

  if (loading) return <div className="h-screen w-screen bg-[#080c10] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="h-screen w-screen bg-[#080c10] flex items-center justify-center font-sans overflow-hidden">
      {/* Mobile Frame Container */}
      <div className="relative w-full h-full max-w-[430px] max-h-[932px] bg-background-dark shadow-2xl overflow-hidden flex flex-col border-x border-white/5 sm:rounded-[3rem]">

        {/* Editor Mode */}
        {mode === AppMode.EDITOR && (
          <Editor
            settings={settings}
            onUpdate={handleUpdateSettings}
            onStart={handleOpenFloating}
          />
        )}

        {/* Floating Mode Overlay */}
        {mode === AppMode.FLOATING && (
          <TeleprompterOverlay
            settings={settings}
            onClose={handleCloseFloating}
            onUpdateSpeed={(s) => handleUpdateSettings({ speed: s })}
          />
        )}
      </div>
    </div>
  );
};

export default App;
