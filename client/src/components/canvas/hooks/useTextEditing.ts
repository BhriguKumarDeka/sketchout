import { useState, useRef, useEffect } from 'react';
import type { CanvasElement } from '../../../types/canvas';
import { useCanvasStore } from '../../../store/useCanvasStore';

export interface EditingState {
  id?: string;
  isNew: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  elementType?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  strokeColor?: string;
}

export function useTextEditing() {
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const openedAtRef = useRef<number>(0);

  const {
    elements,
    activeStyle,
    theme,
    addElement,
    updateElement,
    deleteElement,
    setSelectedIds,
  } = useCanvasStore();

  const isLight = theme === 'light';

  // Auto-focus and auto-select textarea text when editor opens
  useEffect(() => {
    if (editingState && editTextareaRef.current) {
      editTextareaRef.current.focus();
      if (!editingState.isNew) {
        editTextareaRef.current.select();
      }
    }
  }, [editingState?.id, editingState?.isNew]);

  const handleStartTextEdit = (el: CanvasElement) => {
    openedAtRef.current = Date.now();
    setEditingState({
      id: el.id,
      isNew: false,
      x: el.x,
      y: el.y,
      width: el.width || 180,
      height: el.height || 60,
      text: el.content || '',
      elementType: el.type,
      fontSize: el.style.fontSize,
      textAlign: el.style.textAlign,
      strokeColor: el.style.strokeColor,
    });
  };

  const handleStartNewText = (worldX: number, worldY: number) => {
    openedAtRef.current = Date.now();
    setEditingState({
      isNew: true,
      x: worldX,
      y: worldY,
      width: 220,
      height: 48,
      text: '',
      elementType: 'text',
      fontSize: activeStyle.fontSize || 16,
      textAlign: activeStyle.textAlign || 'left',
      strokeColor: activeStyle.strokeColor,
    });
  };

  const handleFinishEditing = () => {
    if (!editingState) return;
    if (Date.now() - openedAtRef.current < 200) return;

    const trimmed = editingState.text.trim();

    if (editingState.isNew) {
      if (trimmed.length > 0) {
        const lines = trimmed.split('\n');
        const maxLineLen = Math.max(...lines.map((l) => l.length), 4);
        const fontSize = activeStyle.fontSize || 16;
        const charWidth = fontSize * 0.62;
        const lineHeight = fontSize * 1.45;
        const w = Math.max(Math.round(maxLineLen * charWidth + 24), 80);
        const h = Math.max(Math.round(lines.length * lineHeight + 16), 36);

        const newElem: CanvasElement = {
          id: `elem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'text',
          semanticType: 'none',
          confidence: 'FACT',
          x: editingState.x,
          y: editingState.y,
          width: w,
          height: h,
          content: trimmed,
          style: {
            ...activeStyle,
            fillColor: 'transparent',
            strokeColor: activeStyle.strokeColor || (isLight ? '#18181b' : '#f4f4f5'),
            fontSize,
          },
          zIndex: elements.length + 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addElement(newElem);
        setSelectedIds([newElem.id]);
      }
    } else if (editingState.id) {
      const target = elements.find((el) => el.id === editingState.id);
      if (target) {
        if (target.type === 'text' && trimmed.length === 0) {
          deleteElement(editingState.id);
        } else if (trimmed !== target.content) {
          updateElement(editingState.id, { content: trimmed });
        }
      }
    }

    setEditingState(null);
  };

  return {
    editingState,
    setEditingState,
    editTextareaRef,
    handleStartTextEdit,
    handleStartNewText,
    handleFinishEditing,
  };
}
