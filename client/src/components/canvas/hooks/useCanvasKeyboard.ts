import { useEffect } from 'react';
import { useCanvasStore } from '../../../store/useCanvasStore';

interface UseCanvasKeyboardProps {
  isEditingText: boolean;
  onFinishEditing?: () => void;
  isSpacePressed?: boolean;
  setIsSpacePressed: (pressed: boolean) => void;
}

export function useCanvasKeyboard({
  isEditingText,
  setIsSpacePressed,
}: UseCanvasKeyboardProps) {
  const {
    undo,
    redo,
    deleteSelectedElements,
    duplicateSelected,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    setSelectedIds,
    setActiveTool,
    elements,
  } = useCanvasStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts when editing text inside a node
      if (isEditingText) return;

      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      // Spacebar for quick Pan mode
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete / Backspace: Delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedElements();
        return;
      }

      // Duplicate: Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Select All: Ctrl+A
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedIds(elements.map((el) => el.id));
        return;
      }

      // Layer ordering: ] bring forward, [ send backward
      if (e.key === ']') {
        e.preventDefault();
        if (e.shiftKey) bringToFront();
        else bringForward();
        return;
      }
      if (e.key === '[') {
        e.preventDefault();
        if (e.shiftKey) sendToBack();
        else sendBackward();
        return;
      }

      // Tool shortcuts (single keys)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setActiveTool('select');
            break;
          case 'h':
            setActiveTool('pan');
            break;
          case 'r':
            setActiveTool('rectangle');
            break;
          case 'o':
            setActiveTool('ellipse');
            break;
          case 'd':
            setActiveTool('diamond');
            break;
          case 'a':
            setActiveTool('arrow');
            break;
          case 'p':
            setActiveTool('draw');
            break;
          case 't':
            setActiveTool('text');
            break;
          case 's':
            setActiveTool('sticky');
            break;
          case 'f':
            setActiveTool('frame');
            break;
          case 'e':
            setActiveTool('eraser');
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isEditingText,
    undo,
    redo,
    deleteSelectedElements,
    duplicateSelected,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    setSelectedIds,
    setActiveTool,
    elements,
    setIsSpacePressed,
  ]);
}
