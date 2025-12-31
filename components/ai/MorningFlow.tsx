import React, { useState } from 'react';
import { Coffee, ArrowRight, BrainCircuit, Sparkles, Loader2 } from 'lucide-react';
import { AIService } from '../../services/aiService';

interface MorningFlowProps {
  step: 'reflection' | 'briefing';
  onComplete: (reflection: string, analysis: any) => void;
  onFinish: () => void;
  currentBriefing?: string;
}

export const MorningFlow: React.FC<MorningFlowProps> = ({ step, onComplete, onFinish, currentBriefing }) => {
  const [reflection, setReflection] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStartDay = async () => {
    if (!reflection.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const analysis = await AIService.generateBriefing(reflection);
      onComplete(reflection, analysis);
    } catch (err) {
      onComplete(reflection, { 
        briefing: "Удачи в делах! Твой разум готов к работе.", 
        title: "Заметка рефлексии", 
        analysis: reflection 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex items-center justify-center p-6 backdrop-blur-xl">
      <div className="max-w-2xl w-full bg-[#151515] border border-white/5 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full" />
        
        {step === 'reflection' ? (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-4 text-purple-400">
              <Coffee size={32} />
              <h1 className="text-3xl font-bold tracking-tight text-white">Утренняя рефлексия</h1>
            </div>
            <p className="text-gray-400 text-lg leading-relaxed">
              Как вы себя чувствуете сегодня? О чем вы думаете перед началом работы?
            </p>
            <textarea 
              autoFocus
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full h-48 bg-[#202020] border border-white/5 rounded-2xl p-6 text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none placeholder:text-gray-700"
              placeholder="Выгрузите сюда свои мысли..."
            />
            <button 
              onClick={handleStartDay}
              disabled={!reflection.trim() || isGenerating}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <><BrainCircuit size={20} /> Подготовить мой день</>}
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 text-yellow-500">
              <Sparkles size={32} />
              <h1 className="text-3xl font-bold tracking-tight text-white">Ваш брифинг</h1>
            </div>
            <div className="bg-purple-900/5 border border-purple-500/20 rounded-2xl p-8">
              <p className="text-xl text-purple-100 italic leading-relaxed">
                "{currentBriefing}"
              </p>
            </div>
            <button 
              onClick={onFinish}
              className="w-full py-4 bg-white text-black hover:bg-gray-200 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
            >
              Открыть разум <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};