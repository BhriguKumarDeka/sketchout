import React, { useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { api } from '../../services/api';
import {
  Sparkles,
  X,
  Send,
  CornerDownRight,
  Zap,
  Target,
} from 'lucide-react';

export const AskCanvasDrawer: React.FC = () => {
  const {
    workspaceId,
    elements,
    activeDrawer,
    setActiveDrawer,
    focusElement,
    aiStatus,
  } = useCanvasStore();

  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [askMode, setAskMode] = useState<'casual' | 'technical'>('casual');
  const [messages, setMessages] = useState<
    Array<{
      role: 'user' | 'assistant';
      content: string;
      references?: string[];
      followUps?: string[];
    }>
  >([
    {
      role: 'assistant',
      content: 'I understand your entire visual canvas topology and semantic context. Ask me anything about your architecture, decisions, open questions, or dependencies.',
      followUps: ['What have we decided?', 'What remains unresolved?', 'Explain this architecture'],
    },
  ]);

  if (activeDrawer !== 'ask') return null;

  const handleAsk = async (queryText?: string) => {
    const q = queryText || inputQuestion;
    if (!q.trim() || loading) return;

    const newMessages = [...messages, { role: 'user' as const, content: q }];
    setMessages(newMessages);
    setInputQuestion('');
    setLoading(true);

    try {
      const res = await api.askCanvas(q, workspaceId, elements, askMode);
      if (res.result) {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: res.result.answer,
            references: res.result.referencedElementIds,
            followUps: res.result.suggestedFollowUps,
          },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Unable to reach context reasoning engine. Please verify connectivity.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-13 right-0 bottom-0 w-96 bg-[var(--surface-1)] border-l border-[var(--border-subtle)] flex flex-col z-30 shadow-sm animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-zinc-100" />
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            Ask Canvas
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-tertiary)]">
            {aiStatus.isLiveGroq ? 'Groq AI' : 'Context Engine'}
          </span>
        </div>
        <button
          onClick={() => setActiveDrawer('none')}
          className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Selector Toggle: Casual & Essence vs Technical */}
      <div className="px-3.5 py-2 border-b border-[var(--border-subtle)] bg-[var(--surface-2)]/40 flex items-center gap-1.5 text-[11px]">
        <button
          onClick={() => setAskMode('casual')}
          className={`flex-1 py-1 rounded-md transition-colors font-medium text-center ${
            askMode === 'casual'
              ? 'bg-zinc-100 text-zinc-950 shadow-xs'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
          }`}
          title="Colleague tone: focuses on essence, creative intent, analogies, and human story (zero shape jargon)"
        >
          Casual & Essence
        </button>
        <button
          onClick={() => setAskMode('technical')}
          className={`flex-1 py-1 rounded-md transition-colors font-medium text-center ${
            askMode === 'technical'
              ? 'bg-zinc-100 text-zinc-950 shadow-xs'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
          }`}
          title="Architect tone: focuses on system design, component boundaries, data flow, and trade-offs"
        >
          Technical & Deep
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col gap-1.5 ${
              m.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`p-3 rounded-xl max-w-[90%] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-zinc-200 text-zinc-950 font-medium'
                  : 'bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>

              {/* Interactive Traceability Citations */}
              {m.references && m.references.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5">
                    <Target className="w-2.5 h-2.5" /> Cited Nodes:
                  </span>
                  {m.references.map((nodeId) => (
                    <button
                      key={nodeId}
                      onClick={() => focusElement(nodeId)}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors flex items-center gap-1"
                    >
                      <span>#{nodeId.slice(0, 6)}</span>
                      <CornerDownRight className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Suggested Followups */}
            {m.followUps && m.followUps.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 max-w-[95%]">
                {m.followUps.map((fu, fIdx) => (
                  <button
                    key={fIdx}
                    onClick={() => handleAsk(fu)}
                    className="text-[10px] px-2 py-1 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors text-left"
                  >
                    {fu}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] bg-[var(--surface-2)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
            <Zap className="w-3.5 h-3.5 animate-pulse text-zinc-300" />
            <span>Reasoning over canvas graph...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask about your canvas..."
            className="flex-1 bg-[var(--surface-2)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] px-3 py-2 rounded-lg outline-none border border-[var(--border-subtle)] focus:border-[var(--border-focus)] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || loading}
            className="p-2 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
