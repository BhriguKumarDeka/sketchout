import { IAIProvider } from './types.js';
import { GroqAIProvider } from './groqProvider.js';
import { HeuristicAIProvider } from './heuristicProvider.js';

export * from './types.js';
export * from './contextExtractor.js';
export * from './heuristicProvider.js';
export * from './groqProvider.js';

// Factory to dynamically pick provider based on env
export const getAIProvider = (): IAIProvider => {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey && groqKey.length > 5) {
    try {
      return new GroqAIProvider(groqKey);
    } catch (err) {
      console.warn('[AI Provider] Groq initialization failed, falling back to heuristic engine:', err);
      return new HeuristicAIProvider();
    }
  }
  return new HeuristicAIProvider();
};
