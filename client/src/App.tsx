import React, { useEffect } from 'react';
import { useCanvasStore } from './store/useCanvasStore';
import { HeaderBar } from './components/layout/HeaderBar';
import { Toolbar } from './components/layout/Toolbar';
import { ElementPropertiesBar } from './components/layout/ElementPropertiesBar';
import { InfiniteCanvas } from './components/canvas/InfiniteCanvas';
import { ContextGraphView } from './components/views/ContextGraphView';
import { DecisionLedgerView } from './components/views/DecisionLedgerView';
import { ArtifactsView } from './components/views/ArtifactsView';
import { IntroductionView } from './components/views/IntroductionView';
import { AskCanvasDrawer } from './components/ai/AskCanvasDrawer';
import { GapDetectorModal } from './components/ai/GapDetectorModal';
import { ToastNotification } from './components/layout/ToastNotification';

export const App: React.FC = () => {
  const { activeView, loadWorkspace, theme } = useCanvasStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    loadWorkspace('default');
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-hidden">
      {/* Top Navigation Bar */}
      <HeaderBar />

      {/* Main View Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {activeView === 'canvas' && (
          <>
            <InfiniteCanvas />
            <Toolbar />
            <ElementPropertiesBar />
          </>
        )}

        {activeView === 'graph' && <ContextGraphView />}
        {activeView === 'ledger' && <DecisionLedgerView />}
        {activeView === 'artifacts' && <ArtifactsView />}
        {activeView === 'intro' && <IntroductionView />}

        {/* AI Sliding Drawers */}
        <AskCanvasDrawer />
        <GapDetectorModal />

        {/* Floating Toast Notification */}
        <ToastNotification />
      </main>
    </div>
  );
};

export default App;
