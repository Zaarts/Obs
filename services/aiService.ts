import { GoogleGenAI, Type } from "@google/genai";
import { SmartSaveResult } from "../types";

const modelName = "gemini-3-pro-preview";

// Вспомогательная функция для повторных попыток при 429
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.status === "RESOURCE_EXHAUSTED" || 
                        error?.error?.code === 429 || 
                        error?.message?.includes("429") ||
                        error?.message?.includes("quota");
                        
    if (retries > 0 && isRateLimit) {
      console.warn(`[AI Service] Превышена квота. Повтор через ${delay}ms... (Осталось попыток: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const AIService = {
  async chatWithSocrates(noteContent: string, userMessage: string, history: any[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          { role: 'user', parts: [{ text: `КОНТЕКСТ ЗАМЕТКИ:\n${noteContent}` }] },
          ...history,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: "Ты — Сократ. Твоя задача — побуждать к размышлению через вопросы. Будь лаконичен. Отвечай на русском.",
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });
      return response.text;
    });
  },

  async analyzeSmartSave(content: string, allNoteNames: string[], existingTags: string[]): Promise<SmartSaveResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `КОНТЕНТ ЗАМЕТКИ:\n${content}\n\nБАЗА ЗНАНИЙ:\nТеги: [${existingTags.join(', ')}]\nЗаметки: [${allNoteNames.join(', ')}]`,
        config: {
          systemInstruction: `Ты — Главный Библиотекарь и Архитектор Знаний.
          ТВОИ ПРАВИЛА:
          1. ЗАГОЛОВОК: Создай архитектурно точный заголовок (до 5 слов).
          2. ТАКСОНОМИЯ: Используй существующие теги, если они подходят. Только lowercase kebab-case.
          3. СВЯЗИ: Найди в списке заметок те, что расширяют или дополняют этот текст.
          Верни JSON.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              links: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "tags", "links"]
          }
        }
      });
      try {
        return JSON.parse(response.text || '{"title": "Без названия", "tags":[], "links":[]}');
      } catch {
        return { title: "Без названия", tags: [], links: [] };
      }
    });
  },

  async generateBriefing(reflection: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Утренняя рефлексия: "${reflection}"`,
        config: {
          systemInstruction: "Проанализируй состояние пользователя. Создай заголовок для журнала и краткий вдохновляющий план.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              briefing: { type: Type.STRING },
              analysis: { type: Type.STRING }
            },
            required: ["title", "briefing", "analysis"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  }
};