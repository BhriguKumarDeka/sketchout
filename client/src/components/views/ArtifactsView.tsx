import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import {
  FileText,
  FileCode2,
  Target,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Loader2,
  Trash2,
  Eye,
  Code,
  Database,
  Plus,
} from 'lucide-react';

export const ArtifactsView: React.FC = () => {
  const {
    workspaceId,
    artifacts,
    allDbArtifacts,
    fetchAllDbArtifacts,
    importArtifactToWorkspace,
    generateArtifact,
    deleteArtifactRecord,
    focusElement,
  } = useCanvasStore();

  const [tabScope, setTabScope] = useState<'workspace' | 'all'>('workspace');
  const [selectedArtifactIndex, setSelectedArtifactIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllDbArtifacts();
  }, [fetchAllDbArtifacts]);

  const activeList = tabScope === 'workspace' ? artifacts : allDbArtifacts;
  const currentArtifact = activeList[selectedArtifactIndex] || activeList[0];

  const handleGenerate = async (type: string) => {
    setIsGenerating(true);
    await generateArtifact(type);
    setSelectedArtifactIndex(0);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    if (!currentArtifact) return;
    navigator.clipboard.writeText(currentArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentArtifact) return;
    const blob = new Blob([currentArtifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentArtifact.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (e: React.MouseEvent, artifactId: string, idx: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this documentation artifact?')) return;
    setDeletingId(artifactId);
    await deleteArtifactRecord(artifactId);
    setDeletingId(null);
    if (selectedArtifactIndex >= idx && selectedArtifactIndex > 0) {
      setSelectedArtifactIndex(selectedArtifactIndex - 1);
    }
  };

  return (
    <div className="w-full h-full bg-[var(--bg-canvas)] overflow-hidden flex select-none">
      {/* Sidebar List */}
      <div className="w-72 h-full bg-[var(--surface-1)] border-r border-[var(--border-subtle)] flex flex-col shrink-0">
        <div className="p-3 border-b border-[var(--border-subtle)] space-y-2">
          <div className="text-xs font-semibold text-[var(--text-primary)]">
            Functional Documentation
          </div>

          {/* Scope Selector Tabs */}
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--surface-2)] text-[11px]">
            <button
              onClick={() => {
                setTabScope('workspace');
                setSelectedArtifactIndex(0);
              }}
              className={`flex-1 py-1 rounded-md font-medium text-center transition-colors ${
                tabScope === 'workspace'
                  ? 'bg-[var(--surface-1)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              This Workspace ({artifacts.length})
            </button>
            <button
              onClick={() => {
                setTabScope('all');
                fetchAllDbArtifacts();
                setSelectedArtifactIndex(0);
              }}
              className={`flex-1 py-1 rounded-md font-medium text-center transition-colors ${
                tabScope === 'all'
                  ? 'bg-[var(--surface-1)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
              title="View all artifacts stored across the entire database"
            >
              All DB ({allDbArtifacts.length})
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              onClick={() => handleGenerate('prd')}
              disabled={isGenerating}
              className="px-2 py-1.5 rounded-lg text-[11px] bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileCode2 className="w-3 h-3" />}
              <span>Diagram Spec</span>
            </button>
            <button
              onClick={() => handleGenerate('tech_spec')}
              disabled={isGenerating}
              className="px-2 py-1.5 rounded-lg text-[11px] bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
              <span>Tech Flow</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeList.length === 0 ? (
            <div className="p-6 text-center text-[var(--text-tertiary)] text-xs">
              {tabScope === 'workspace'
                ? "No artifacts in this workspace. Click 'Diagram Spec' or 'Tech Flow' to synthesize, or switch to 'All DB' to import prior docs."
                : "No saved artifacts found in the database."}
            </div>
          ) : (
            activeList.map((art, idx) => (
              <div
                key={art.artifactId || idx}
                onClick={() => setSelectedArtifactIndex(idx)}
                className={`group relative w-full text-left p-3 rounded-lg text-xs space-y-1 transition-colors cursor-pointer border ${
                  selectedArtifactIndex === idx
                    ? 'bg-[var(--surface-2)] border-[var(--border-focus)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border-transparent'
                }`}
              >
                <div className="font-medium pr-6 truncate">{art.title}</div>
                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                  <span className="uppercase font-mono">{art.type}</span>
                  {art.isStale && (
                    <span className="text-amber-400 flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" /> Outdated
                    </span>
                  )}
                </div>

                {/* Workspace Tag & Import Link for All DB view */}
                {tabScope === 'all' && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-tertiary)] font-mono">
                      {art.workspaceId === workspaceId ? 'this workspace' : `ws: ${art.workspaceId?.slice(-6) || 'other'}`}
                    </span>
                    {art.workspaceId !== workspaceId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          importArtifactToWorkspace(art.artifactId);
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white flex items-center gap-1 transition-colors"
                        title="Link to current workspace"
                      >
                        <Plus className="w-2.5 h-2.5" /> Link
                      </button>
                    )}
                  </div>
                )}

                {/* Quick Delete Artifact Button */}
                <button
                  onClick={(e) => handleDelete(e, art.artifactId, idx)}
                  disabled={deletingId === art.artifactId}
                  title="Delete artifact from database"
                  className="absolute top-2.5 right-2.5 p-1 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Document Content */}
      <div className="flex-1 h-full overflow-y-auto p-8 max-w-4xl mx-auto space-y-6">
        {currentArtifact ? (
          <>
            {currentArtifact.workspaceId && currentArtifact.workspaceId !== workspaceId && (
              <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Database className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>
                    This artifact belongs to workspace <strong>{currentArtifact.workspaceId}</strong>.
                  </span>
                </div>
                <button
                  onClick={() => importArtifactToWorkspace(currentArtifact.artifactId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-950 hover:bg-white transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link to Current Workspace</span>
                </button>
              </div>
            )}

            {currentArtifact.isStale && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Documentation Drift Detected:</strong> {currentArtifact.staleReason || 'Canvas nodes were updated after document generation.'}
                  </span>
                </div>
                <button
                  onClick={() => handleGenerate(currentArtifact.type)}
                  className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] shrink-0 font-medium transition-colors"
                >
                  Resync Artifact
                </button>
              </div>
            )}

            {/* Header and Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  {currentArtifact.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mt-1 font-mono">
                  <span>Type: {currentArtifact.type.toUpperCase()}</span>
                  <span>•</span>
                  <span>{currentArtifact.traceableNodes?.length || 0} Traceable nodes</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle: Preview vs Raw Markdown */}
                <div className="flex items-center p-0.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      viewMode === 'preview'
                        ? 'bg-[var(--surface-1)] text-[var(--text-primary)] shadow-xs'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      viewMode === 'raw'
                        ? 'bg-[var(--surface-1)] text-[var(--text-primary)] shadow-xs'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Markdown</span>
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-zinc-100 text-zinc-950 font-medium hover:bg-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* Traceability Nodes Pill Bar */}
            {currentArtifact.traceableNodes && currentArtifact.traceableNodes.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-2">
                <div className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
                  <Target className="w-3 h-3 text-zinc-300" />
                  <span>Traceable Canvas Anchors (Click to focus on whiteboard):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentArtifact.traceableNodes.map((tn, idx) => (
                    <button
                      key={idx}
                      onClick={() => tn.sourceElementId && focusElement(tn.sourceElementId)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center gap-1 transition-colors"
                    >
                      <span className="text-[var(--text-tertiary)] font-mono">[{tn.nodeId}]</span>
                      <span className="truncate max-w-[200px] font-medium">{tn.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rendered Preview or Raw Markdown */}
            {viewMode === 'preview' ? (
              <div className="p-8 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-6 text-sm text-[var(--text-primary)] leading-relaxed font-sans shadow-xs">
                <MarkdownRenderer content={currentArtifact.content} onFocusElement={focusElement} />
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-xs leading-relaxed text-[var(--text-secondary)] space-y-4">
                <pre className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[12px] font-mono text-zinc-200 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                  {currentArtifact.content}
                </pre>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] text-xs gap-2 py-24">
            <FileCode2 className="w-10 h-10 opacity-30" />
            <p className="font-medium text-sm">No documentation artifact selected</p>
            <p className="text-xs text-[var(--text-tertiary)]">Click 'Diagram Spec' or 'Tech Flow' to generate documentation from your canvas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Clean, lightweight, zero-dependency Markdown renderer
 * Formats headings, blockquotes, lists, bold text, and clickable trace tags
 */
const MarkdownRenderer: React.FC<{ content: string; onFocusElement: (id: string) => void }> = ({
  content,
  onFocusElement,
}) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-3">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // 1. Heading 1
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-2xl font-bold text-[var(--text-primary)] tracking-tight pt-2 pb-1 border-b border-[var(--border-subtle)]">
              {renderFormattedText(trimmed.replace(/^#\s+/, ''), onFocusElement)}
            </h1>
          );
        }

        // 2. Heading 2
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg font-semibold text-[var(--text-primary)] tracking-tight pt-4 pb-1 border-b border-[var(--border-subtle)]">
              {renderFormattedText(trimmed.replace(/^##\s+/, ''), onFocusElement)}
            </h2>
          );
        }

        // 3. Heading 3
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-sm font-semibold text-[var(--text-primary)] pt-2">
              {renderFormattedText(trimmed.replace(/^###\s+/, ''), onFocusElement)}
            </h3>
          );
        }

        // 4. Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-2 border-zinc-500 pl-3 italic text-[var(--text-secondary)] text-xs py-1">
              {renderFormattedText(trimmed.replace(/^>\s+/, ''), onFocusElement)}
            </blockquote>
          );
        }

        // 5. Bullet List
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={idx} className="ml-5 list-disc text-xs text-[var(--text-secondary)] leading-relaxed">
              {renderFormattedText(trimmed.replace(/^[-*]\s+/, ''), onFocusElement)}
            </li>
          );
        }

        // 6. Numbered List
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 text-xs text-[var(--text-secondary)] ml-2">
              <span className="font-mono text-[var(--text-tertiary)] shrink-0">{numMatch[1]}.</span>
              <div>{renderFormattedText(numMatch[2], onFocusElement)}</div>
            </div>
          );
        }

        // Empty lines
        if (trimmed.length === 0) {
          return <div key={idx} className="h-1.5" />;
        }

        // Normal paragraph
        return (
          <p key={idx} className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {renderFormattedText(trimmed, onFocusElement)}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Replaces **bold**, *italic*, and <!-- trace:ID --> tags with rendered nodes
 */
function renderFormattedText(text: string, onFocusElement: (id: string) => void): React.ReactNode {
  // Extract <!-- trace:ID --> tags
  const traceRegex = /<!--\s*trace:([^\s>]+)\s*-->/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = traceRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(formatInlineMarkdown(text.slice(lastIndex, match.index)));
    }
    const traceId = match[1];
    if (traceId && traceId !== 'none') {
      parts.push(
        <button
          key={`trace-${match.index}`}
          onClick={() => onFocusElement(traceId)}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 mx-1 rounded text-[10px] font-mono bg-[var(--surface-3)] text-zinc-300 hover:text-white border border-[var(--border-subtle)] transition-colors align-middle"
          title={`Focus node ${traceId} on canvas`}
        >
          <Target className="w-2.5 h-2.5" />
          <span>#{traceId.slice(-4)}</span>
        </button>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(formatInlineMarkdown(text.slice(lastIndex)));
  }

  return <>{parts}</>;
}

function formatInlineMarkdown(str: string): React.ReactNode {
  // Simple bold and code formatting
  const tokens = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-[var(--text-primary)]">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={i} className="px-1 py-0.5 rounded bg-[var(--surface-2)] text-[11px] font-mono text-zinc-300">
          {token.slice(1, -1)}
        </code>
      );
    }
    return token;
  });
}
