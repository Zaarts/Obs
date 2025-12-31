import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Loader2 } from 'lucide-react';
import { AIService } from '../../services/aiService';

interface SocratesPanelProps {
  noteContent: string;
  onClose: () => void;
  history: any[];
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
}

export const SocratesPanel: React.FC<SocratesPanelProps> = ({ noteContent, onClose, history, setHistory }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [history, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    const newHistory = [...history, { role: 'user', parts: [{ text: userMsg }] }];
    setHistory(newHistory);
    
    setIsLoading(true);
    try {
      const response = await AIService.chatWithSocrates(noteContent, userMsg, history);
      if (response) {
        setHistory(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
      }
    } catch (err) {
      console.error('Socrates Error:', err);
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: "Извините, мой разум затуманился. Попробуйте еще раз." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-96 border-l border-[#2c2c2c] bg-[#1a1a1a] flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
      <div className="p-4 border-b border-[#2c2c2c] flex items-center justify-between bg-purple-900/10">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-purple-300">Сократ AI</h3>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {history.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
               <Sparkles size={20} className="text-purple-400" />
            </div>
            <p className="text-gray-500 text-xs italic leading-relaxed">
              "Я не могу никого ничему научить, я могу только заставить их думать."
            </p>
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-2xl max-w-[90%] text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-purple-600 text-white rounded-tr-none' 
                : 'bg-[#2c2c2c] text-gray-200 rounded-tl-none border border-white/5'
            }`}>
              {msg.parts[0].text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-purple-400 p-2">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs font-medium animate-pulse">Сократ размышляет...</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#1a1a1a] border-t border-[#2c2c2c]">
        <div className="relative group">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Задайте глубокий вопрос..."
            className="w-full bg-[#151515] border border-[#333] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all"
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-purple-500 hover:text-purple-400 disabled:opacity-30 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};