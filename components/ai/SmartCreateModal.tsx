import React, { useState } from 'react';
import { X, Sparkles, Loader2, BrainCircuit } from 'lucide-react';

interface SmartCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (thought: string) => Promise<void>;
}

export const SmartCreateModal: React.FC<SmartCreateModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    await onCreate(input);
    setIsLoading(false);
    setInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-[#141414] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-purple-900/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-500/20 rounded-xl">
               <BrainCircuit className="text-purple-400" size={20}/>
             </div>
             <div>
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">Новое озарение</h3>
               <p className="text-[10px] text-gray-500 uppercase tracking-tighter">ИИ структурирует вашу мысль автоматически</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
        </div>
        
        <div className="p-6">
          <textarea
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
            placeholder="Выгрузите сюда суть вашей мысли... (Ctrl + Enter для сохранения)"
            className="w-full h-40 bg-black/30 border border-white/5 rounded-2xl p-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
          />
        </div>
        
        <div className="px-6 py-4 bg-black/20 flex items-center justify-between">
          <span className="text-[10px] text-gray-600 font-mono italic">Библиотекарь подберет теги и заголовок</span>
          <button 
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
            {isLoading ? "Архивация..." : "Создать Смарт-Заметку"}
          </button>
        </div>
      </div>
    </div>
  );
};