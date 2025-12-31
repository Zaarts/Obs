import { useState, useCallback, useEffect } from 'react';
import { AIState, ReflectionLog } from '../types';

export const useAI = () => {
  const [state, setState] = useState<AIState>(() => {
    const last = localStorage.getItem('last_reflection_date');
    const today = new Date().toISOString().split('T')[0];
    return {
      isSocratesOpen: false,
      isDumpOpen: false,
      morningFlowStep: last === today ? 'complete' : 'reflection',
      lastReflectionDate: last
    };
  });

  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [reflectionLogs, setReflectionLogs] = useState<ReflectionLog[]>(() => {
    const data = localStorage.getItem('reflection_logs');
    return data ? JSON.parse(data) : [];
  });

  const completeReflection = useCallback((content: string, briefing: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newLog = { date: today, content, briefing };
    const updatedLogs = [...reflectionLogs, newLog];
    
    setReflectionLogs(updatedLogs);
    localStorage.setItem('reflection_logs', JSON.stringify(updatedLogs));
    localStorage.setItem('last_reflection_date', today);
    
    setState(prev => ({ ...prev, morningFlowStep: 'briefing', lastReflectionDate: today }));
  }, [reflectionLogs]);

  const finishBriefing = () => setState(prev => ({ ...prev, morningFlowStep: 'complete' }));

  const toggleSocrates = () => setState(prev => ({ ...prev, isSocratesOpen: !prev.isSocratesOpen }));
  const toggleDump = () => setState(prev => ({ ...prev, isDumpOpen: !prev.isDumpOpen }));

  return {
    aiState: state,
    toggleSocrates,
    toggleDump,
    completeReflection,
    finishBriefing,
    chatHistory,
    setChatHistory,
    currentBriefing: reflectionLogs[reflectionLogs.length - 1]?.briefing
  };
};