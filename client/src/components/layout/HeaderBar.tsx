import React, { useState, useEffect, useRef } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import {
  AlertCircle,
  FileCode2,
  GitGraph,
  Layers,
  FileText,
  TableProperties,
  Sun,
  Moon,
  RefreshCw,
  Loader2,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Check,
  Code2,
} from 'lucide-react';
import { MermaidImportModal } from '../canvas/MermaidImportModal';

export const HeaderBar: React.FC = () => {
  const {
    workspaceId,
    workspaceName,
    setWorkspaceName,
    workspaces,
    fetchWorkspaces,
    switchWorkspace,
    createWorkspace,
    deleteWorkspace,
    copyFromWorkspace,
    exportCanvasJson,
    importCanvasJson,
    activeView,
    setActiveView,
    activeDrawer,
    setActiveDrawer,
    theme,
    toggleTheme,
    isSyncing,
    isFallbackMode,
    runGapDetection,
    generateFunctionalDocs,
    isGeneratingArtifact,
  } = useCanvasStore();

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isMermaidModalOpen, setIsMermaidModalOpen] = useState(false);
  const [selectedSourceWs, setSelectedSourceWs] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Click outside to close workspace dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    if (isWorkspaceMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWorkspaceMenuOpen]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    await createWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName('');
    setIsCreatingWorkspace(false);
    setIsWorkspaceMenuOpen(false);
  };

  const handleCopyFrom = async () => {
    if (!selectedSourceWs) return;
    await copyFromWorkspace(selectedSourceWs);
    setIsCopyModalOpen(false);
    setSelectedSourceWs('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        importCanvasJson(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header className="h-13 w-full bg-[var(--surface-1)] border-b border-[var(--border-subtle)] px-4 flex items-center justify-between z-40 select-none">
      {/* Brand & Workspace Switcher */}
      <div className="flex items-center gap-3">
        {/* Brand Logo with Tactile Inset Squircle - Click to open Introduction page */}
        <button
          onClick={() => setActiveView(activeView === 'intro' ? 'canvas' : 'intro')}
          className="flex items-center gap-2 group text-left cursor-pointer transition-transform active:scale-95"
          title="Visit Sketch Out Introduction & Guide"
        >
          <div className="w-7 h-7 rounded-[9px] bg-white flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.12)] border border-black/10 overflow-hidden p-1 transition-all group-hover:scale-105 group-hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.16)]">
            <img
              src="/assets/penLogo_cropped.png"
              alt="Sketch Out Pen"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)] group-hover:text-zinc-400 dark:group-hover:text-zinc-300 transition-colors">
            sketch out
          </span>
        </button>

        <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />

        {/* Workspace Dropdown Trigger */}
        <div className="relative" ref={menuRef}>
          <div className="flex items-center bg-[var(--surface-2)]/60 hover:bg-[var(--surface-hover)] rounded-md border border-[var(--border-subtle)] px-2 py-0.5">
            <span className="text-[10px] text-[var(--text-tertiary)] font-mono mr-1">ws:</span>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="bg-transparent text-xs text-[var(--text-secondary)] focus:text-[var(--text-primary)] outline-none w-28 font-medium"
              placeholder="Workspace name"
            />
            <button
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className="p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              title="Switch or manage workspaces"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Workspace Dropdown Menu */}
          {isWorkspaceMenuOpen && (
            <div className="absolute top-9 left-0 w-64 p-2 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl z-50 text-xs space-y-2 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center justify-between">
                <span>Workspaces</span>
                <span>{workspaces.length} total</span>
              </div>

              {/* Workspaces List */}
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {workspaces.map((ws) => (
                  <div
                    key={ws.workspaceId}
                    onClick={() => {
                      switchWorkspace(ws.workspaceId);
                      setIsWorkspaceMenuOpen(false);
                    }}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      ws.workspaceId === workspaceId
                        ? 'bg-[var(--surface-2)] text-[var(--text-primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {ws.workspaceId === workspaceId && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                      <span className="truncate">{ws.name}</span>
                    </div>

                    {workspaces.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete workspace "${ws.name}"?`)) {
                            deleteWorkspace(ws.workspaceId);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity text-[var(--text-tertiary)]"
                        title="Delete workspace"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Create New Workspace */}
              <div className="pt-1.5 border-t border-[var(--border-subtle)]">
                {isCreatingWorkspace ? (
                  <form onSubmit={handleCreateWorkspace} className="flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      placeholder="Workspace name..."
                      className="flex-1 bg-[var(--surface-2)] px-2 py-1 rounded text-xs text-[var(--text-primary)] border border-[var(--border-subtle)] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newWorkspaceName.trim()}
                      className="px-2 py-1 rounded bg-zinc-100 text-zinc-950 font-medium disabled:opacity-30"
                    >
                      Add
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsCreatingWorkspace(true)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Workspace</span>
                  </button>
                )}
              </div>

              {/* Context Transfer & Backup Options */}
              <div className="pt-1.5 border-t border-[var(--border-subtle)] space-y-0.5">
                {workspaces.length > 1 && (
                  <button
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      setIsCopyModalOpen(true);
                    }}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Context from Another Workspace...</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    exportCanvasJson();
                    setIsWorkspaceMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Canvas as JSON</span>
                </button>

                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsWorkspaceMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Canvas from JSON</span>
                </button>

                <button
                  onClick={() => {
                    setIsMermaidModalOpen(true);
                    setIsWorkspaceMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Import Mermaid Code...</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input for JSON Canvas Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Sync Status Badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] ml-1">
          {isSyncing ? (
            <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
          ) : isFallbackMode ? (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/90" title="Saved locally in browser" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" title="Connected to MongoDB Atlas" />
          )}
          <span className="hidden sm:inline">
            {isSyncing ? 'Saving...' : isFallbackMode ? 'Local Mode (Saved)' : 'Synced to MongoDB'}
          </span>
        </div>
      </div>

      {/* Central View Switcher */}
      <div className="flex items-center p-0.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
        <button
          onClick={() => setActiveView('canvas')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeView === 'canvas'
              ? 'bg-[var(--surface-1)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Canvas</span>
        </button>

        <button
          onClick={() => setActiveView('graph')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeView === 'graph'
              ? 'bg-[var(--surface-1)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <GitGraph className="w-3.5 h-3.5" />
          <span>Context Graph</span>
        </button>

        <button
          onClick={() => setActiveView('ledger')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeView === 'ledger'
              ? 'bg-[var(--surface-1)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <TableProperties className="w-3.5 h-3.5" />
          <span>Decision Ledger</span>
        </button>

        <button
          onClick={() => setActiveView('artifacts')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeView === 'artifacts'
              ? 'bg-[var(--surface-1)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Artifacts</span>
        </button>
      </div>

      {/* Right Actions & AI Controls */}
      <div className="flex items-center gap-2">
        {/* Mermaid Code Import */}
        <button
          onClick={() => setIsMermaidModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] transition-colors"
          title="Import Mermaid flowchart/architecture diagram"
        >
          <Code2 className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Mermaid</span>
        </button>

        {/* Gap Detector */}
        <button
          onClick={() => runGapDetection()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] transition-colors"
          title="Detect context gaps and inconsistencies"
        >
          <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Gaps</span>
        </button>

        {/* Functional Documentation Loader Button */}
        <button
          onClick={() => generateFunctionalDocs()}
          disabled={isGeneratingArtifact}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            isGeneratingArtifact
              ? 'bg-zinc-800 text-zinc-400 border-zinc-700 cursor-not-allowed'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 border-transparent shadow-xs'
          }`}
          title="Synthesize functional documentation from diagram boxes and arrows"
        >
          {isGeneratingArtifact ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Documenting Flow...</span>
            </>
          ) : (
            <>
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Document Flow</span>
            </>
          )}
        </button>

        {/* Hector AI Assistant */}
        <button
          onClick={() => setActiveDrawer(activeDrawer === 'ask' ? 'none' : 'ask')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeDrawer === 'ask'
              ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-xs'
              : 'bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)]'
          }`}
          title="Ask Hector AI about your whiteboard flow"
        >
          <div className="w-4 h-4 rounded-full overflow-hidden border border-zinc-600 bg-zinc-800 shrink-0">
            <img src="/assets/hector_avatar.png" alt="Hector AI" className="w-full h-full object-cover" />
          </div>
          <span>Hector AI</span>
        </button>

        <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-0.5" />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Copy from Workspace Modal */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Copy Elements from Another Workspace
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Select a source workspace. All its canvas shapes, notes, and arrows will be copied into <strong>{workspaceName}</strong>.
              </p>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {workspaces
                .filter((w) => w.workspaceId !== workspaceId)
                .map((ws) => (
                  <button
                    key={ws.workspaceId}
                    type="button"
                    onClick={() => setSelectedSourceWs(ws.workspaceId)}
                    className={`w-full text-left p-3 rounded-lg text-xs border transition-colors flex items-center justify-between ${
                      selectedSourceWs === ws.workspaceId
                        ? 'bg-[var(--surface-2)] border-[var(--border-focus)] text-[var(--text-primary)] font-medium'
                        : 'border-transparent hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span>{ws.name}</span>
                    <span className="font-mono text-[10px] text-[var(--text-tertiary)]">ID: {ws.workspaceId.slice(-6)}</span>
                  </button>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => {
                  setIsCopyModalOpen(false);
                  setSelectedSourceWs('');
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedSourceWs}
                onClick={handleCopyFrom}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-30 transition-colors"
              >
                Import Context
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mermaid Import Modal */}
      <MermaidImportModal
        isOpen={isMermaidModalOpen}
        onClose={() => setIsMermaidModalOpen(false)}
      />
    </header>
  );
};
