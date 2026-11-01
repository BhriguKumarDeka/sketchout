import React from 'react';
import type { CanvasElement, ResizeHandle, SemanticType } from '../../types/canvas';
import { useCanvasStore } from '../../store/useCanvasStore';
import { adaptColorForTheme } from '../../utils/themeColors';
import { getElementBounds } from './geometry';
import {
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  ListTodo,
  AlertTriangle,
  FileText,
  Search,
  Bookmark,
} from 'lucide-react';

interface CanvasElementViewProps {
  element: CanvasElement;
  isSelected: boolean;
  isHighlighted: boolean;
  isEditing?: boolean;
  onStartResize: (e: React.MouseEvent, handle: ResizeHandle, element: CanvasElement) => void;
  onStartTextEdit: (element: CanvasElement) => void;
  onStartArrowEndpointDrag?: (e: React.MouseEvent, arrow: CanvasElement, endpointIndex: 0 | 1) => void;
}

const getSemanticIcon = (type: SemanticType) => {
  switch (type) {
    case 'idea':
      return <Lightbulb className="w-3 h-3 text-zinc-300" />;
    case 'question':
      return <HelpCircle className="w-3 h-3 text-zinc-300" />;
    case 'decision':
      return <CheckCircle2 className="w-3 h-3 text-zinc-100" />;
    case 'task':
      return <ListTodo className="w-3 h-3 text-zinc-300" />;
    case 'risk':
      return <AlertTriangle className="w-3 h-3 text-zinc-300" />;
    case 'requirement':
      return <FileText className="w-3 h-3 text-zinc-300" />;
    case 'research':
      return <Search className="w-3 h-3 text-zinc-300" />;
    case 'assumption':
      return <Bookmark className="w-3 h-3 text-zinc-300" />;
    default:
      return null;
  }
};

export const CanvasElementView: React.FC<CanvasElementViewProps> = ({
  element,
  isSelected,
  isHighlighted,
  isEditing = false,
  onStartResize,
  onStartTextEdit,
  onStartArrowEndpointDrag,
}) => {
  const theme = useCanvasStore((s) => s.theme);
  const isLight = theme === 'light';

  const width = Math.max(element.width || 100, 10);
  const height = Math.max(element.height || 60, 10);

  // Adapt colors dynamically with slight saturation/luminance shifts based on light/dark/cutting-mat mode
  const rawStroke = element.style.strokeColor || '#f4f4f5';
  const rawFill = element.style.fillColor || 'transparent';
  const strokeColor = adaptColorForTheme(rawStroke, theme);
  const fillColor = adaptColorForTheme(rawFill, theme);
  const strokeWidth = element.style.strokeWidth || 2;
  const strokeDash = element.style.strokeStyle === 'dashed' ? '6 4' : undefined;

  // 1. Render Arrow Connector
  if (element.type === 'arrow') {
    const pts = element.points && element.points.length >= 2
      ? element.points
      : [{ x: element.x, y: element.y }, { x: element.x + width, y: element.y + height }];
    const start = pts[0];
    const end = pts[pts.length - 1];

    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLength = 12;
    const arrowAngle = Math.PI / 6;

    const headX1 = end.x - arrowLength * Math.cos(angle - arrowAngle);
    const headY1 = end.y - arrowLength * Math.sin(angle - arrowAngle);
    const headX2 = end.x - arrowLength * Math.cos(angle + arrowAngle);
    const headY2 = end.y - arrowLength * Math.sin(angle + arrowAngle);

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    // Check if arrow has a custom name/label; empty arrows have NO pill badge
    const rawLabel = element.content || (element.relationshipType && element.relationshipType !== 'NONE' && element.relationshipType !== 'none' ? element.relationshipType.replace(/_/g, ' ') : '');
    const arrowLabel = rawLabel.trim();

    return (
      <g
        className="cursor-pointer select-none"
        onDoubleClick={(e) => {
          e.stopPropagation();
          onStartTextEdit(element);
        }}
      >
        {/* Wider hit zone */}
        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke="transparent"
          strokeWidth={16}
        />
        {/* Glow when selected */}
        {isSelected && (
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={
              theme === 'cutting-mat'
                ? 'rgba(250, 204, 21, 0.45)'
                : isLight
                ? 'rgba(0, 0, 0, 0.25)'
                : 'rgba(255, 255, 255, 0.4)'
            }
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
          />
        )}
        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          strokeLinecap="round"
        />
        <polygon
          points={`${end.x},${end.y} ${headX1},${headY1} ${headX2},${headY2}`}
          fill={strokeColor}
        />

        {/* Arrow Label Badge (ONLY rendered if a name is provided; supports nameless arrows) */}
        {arrowLabel.length > 0 && (
          <g transform={`translate(${midX}, ${midY})`}>
            <rect
              x={-arrowLabel.length * 3.8 - 8}
              y={-10}
              width={arrowLabel.length * 7.6 + 16}
              height={20}
              rx={10}
              fill={theme === 'cutting-mat' ? '#143526' : isLight ? '#ffffff' : '#121215'}
              stroke={theme === 'cutting-mat' ? '#facc15' : isLight ? '#d4d4d8' : '#3f3f46'}
              strokeWidth={1}
            />
            <text
              x={0}
              y={3.5}
              textAnchor="middle"
              className="text-[10px] font-mono tracking-tight font-medium"
              fill={theme === 'cutting-mat' ? '#facc15' : isLight ? '#18181b' : '#a1a1aa'}
            >
              {arrowLabel}
            </text>
          </g>
        )}

        {/* Re-routable Arrow Endpoint Handles when selected */}
        {isSelected && (
          <g className="cursor-default">
            {/* Start Handle */}
            <circle
              cx={start.x}
              cy={start.y}
              r={6.5}
              fill={theme === 'cutting-mat' ? '#143526' : isLight ? '#ffffff' : '#18181b'}
              stroke={theme === 'cutting-mat' ? '#facc15' : isLight ? '#09090b' : '#ffffff'}
              strokeWidth={2}
              className="cursor-crosshair hover:scale-125 transition-transform"
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartArrowEndpointDrag?.(e, element, 0);
              }}
            />
            {/* End Handle */}
            <circle
              cx={end.x}
              cy={end.y}
              r={6.5}
              fill={theme === 'cutting-mat' ? '#143526' : isLight ? '#ffffff' : '#18181b'}
              stroke={theme === 'cutting-mat' ? '#facc15' : isLight ? '#09090b' : '#ffffff'}
              strokeWidth={2}
              className="cursor-crosshair hover:scale-125 transition-transform"
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartArrowEndpointDrag?.(e, element, 1);
              }}
            />
          </g>
        )}
      </g>
    );
  }

  // 2. Render Freehand Pen Draw
  if (element.type === 'draw') {
    if (!element.points || element.points.length < 2) return null;
    const d = element.points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
    const b = getElementBounds(element);

    return (
      <g className="cursor-pointer select-none">
        {/* Wider hit zone */}
        <path
          d={d}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(strokeWidth + 12, 16)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Glow when selected */}
        {isSelected && (
          <path
            d={d}
            fill="none"
            stroke={
              theme === 'cutting-mat'
                ? 'rgba(250, 204, 21, 0.45)'
                : isLight
                ? 'rgba(0, 0, 0, 0.2)'
                : 'rgba(255, 255, 255, 0.35)'
            }
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Resizable Bounding Box with 8 Resize Handles for Pen Drawings */}
        {isSelected && (
          <g className="cursor-default">
            {/* Dashed outer bounding box */}
            <rect
              x={b.minX - 4}
              y={b.minY - 4}
              width={b.width + 8}
              height={b.height + 8}
              rx={3}
              fill="none"
              stroke={
                theme === 'cutting-mat'
                  ? 'rgba(250, 204, 21, 0.6)'
                  : isLight
                  ? 'rgba(0, 0, 0, 0.45)'
                  : 'rgba(255, 255, 255, 0.45)'
              }
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            {/* 8 Resize grips */}
            <ResizeHandleGrip theme={theme} isLight={isLight} x={b.minX - 4} y={b.minY - 4} cursor="nwse-resize" onMouseDown={(e) => onStartResize(e, 'nw', element)} />
            <ResizeHandleGrip theme={theme} isLight={isLight} x={b.minX + b.width / 2 - 4} y={b.minY - 4} cursor="ns-resize" onMouseDown={(e) => onStartResize(e, 'n', element)} />
            <ResizeHandleGrip theme={theme} isLight={isLight} x={b.minX + b.width - 4} y={b.minY - 4} cursor="nesw-resize" onMouseDown={(e) => onStartResize(e, 'ne', element)} />
            <ResizeHandleGrip theme={theme} isLight={isLight} x={b.minX + b.width - 4} y={b.minY + b.height / 2 - 4} cursor="ew-resize" onMouseDown={(e) => onStartResize(e, 'e', element)} />
            <ResizeHandleGrip theme={theme} isLight={isLight} x={b.minX + b.width - 4} y={b.minY + b.height - 4} cursor="nwse-resize" onMouseDown={(e) => onStartResize(e, 'se', element)} />
            <ResizeHandleGrip theme={theme} isLight={isLight} x={b.minX + b.width / 2 - 4} y={b.minY + b.height - 4} cursor="ns-resize" onMouseDown={(e) => onStartResize(e, 's', element)} />
            <ResizeHandleGrip theme={theme} isLight={isLight} x={b.minX - 4} y={b.minY + b.height - 4} cursor="nesw-resize" onMouseDown={(e) => onStartResize(e, 'sw', element)} />
            <ResizeHandleGrip theme={theme} isLight={isLight} x={b.minX - 4} y={b.minY + b.height / 2 - 4} cursor="ew-resize" onMouseDown={(e) => onStartResize(e, 'w', element)} />
          </g>
        )}
      </g>
    );
  }

  // 3. Render Vector Shapes (Rectangle, Ellipse, Diamond, Cylinder, Sticky, Text, Frame)
  const isCylinder = element.type === 'cylinder';
  const isDiamond = element.type === 'diamond';
  const isEllipse = element.type === 'ellipse';
  const isSticky = element.type === 'sticky';
  const isFrame = element.type === 'frame';
  const isText = element.type === 'text';

  // Cylinder geometry calculations
  const capRy = Math.min(height * 0.2, 20);

  // Background fallback for sticky
  const stickyFill =
    fillColor !== 'transparent'
      ? fillColor
      : theme === 'cutting-mat'
      ? '#1a4230'
      : isLight
      ? '#f4f4f5'
      : '#18181b';

  return (
    <g
      transform={`translate(${element.x}, ${element.y})`}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartTextEdit(element);
      }}
      className="cursor-pointer select-none"
    >
      {/* Selection Glow / Pulse */}
      {isSelected && (
        <rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          rx={isEllipse ? height / 2 + 4 : 8}
          fill="none"
          stroke={
            theme === 'cutting-mat'
              ? 'rgba(250, 204, 21, 0.65)'
              : isLight
              ? 'rgba(0, 0, 0, 0.45)'
              : 'rgba(255, 255, 255, 0.45)'
          }
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      )}
      {isHighlighted && (
        <rect
          x={-6}
          y={-6}
          width={width + 12}
          height={height + 12}
          rx={8}
          fill="none"
          stroke={theme === 'cutting-mat' ? '#facc15' : isLight ? '#09090b' : '#ffffff'}
          strokeWidth={2}
          className="animate-pulse"
        />
      )}

      {/* Frame / Section Container */}
      {isFrame && (
        <g>
          {/* Top Header Tab */}
          <rect
            x={0}
            y={-26}
            width={Math.min(Math.max((element.content?.length || 7) * 9 + 32, 100), width)}
            height={26}
            rx={6}
            fill={theme === 'cutting-mat' ? '#1a4230' : isLight ? '#f4f4f5' : '#27272a'}
            stroke={
              isSelected
                ? theme === 'cutting-mat'
                  ? '#facc15'
                  : isLight
                  ? '#18181b'
                  : '#f4f4f5'
                : theme === 'cutting-mat'
                ? 'rgba(250, 204, 21, 0.35)'
                : isLight
                ? '#e4e4e7'
                : '#3f3f46'
            }
            strokeWidth={1}
          />
          {!isEditing && (
            <text
              x={10}
              y={-9}
              fill={theme === 'cutting-mat' ? '#facc15' : isLight ? '#18181b' : '#f4f4f5'}
              fontSize={12}
              fontWeight="600"
              letterSpacing="0.02em"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {element.content?.trim() || 'Section'}
            </text>
          )}
          {/* Main Enclosing Frame Body */}
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={10}
            fill={
              fillColor !== 'transparent'
                ? fillColor
                : theme === 'cutting-mat'
                ? 'rgba(250, 204, 21, 0.02)'
                : isLight
                ? 'rgba(0, 0, 0, 0.015)'
                : 'rgba(255, 255, 255, 0.015)'
            }
            stroke={
              isSelected
                ? theme === 'cutting-mat'
                  ? '#facc15'
                  : isLight
                  ? '#18181b'
                  : '#f4f4f5'
                : theme === 'cutting-mat'
                ? 'rgba(250, 204, 21, 0.25)'
                : isLight
                ? '#d4d4d8'
                : '#27272a'
            }
            strokeWidth={isSelected ? 1.5 : 1}
            strokeDasharray="6 4"
          />
        </g>
      )}

      {/* Shape Geometry */}
      {!isFrame && isRectangleLike(element.type) && (
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={isSticky ? 8 : 6}
          fill={isSticky ? stickyFill : fillColor}
          stroke={isText ? 'transparent' : strokeColor}
          strokeWidth={isText ? 0 : strokeWidth}
          strokeDasharray={strokeDash}
        />
      )}

      {isEllipse && (
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
        />
      )}

      {isDiamond && (
        <polygon
          points={`${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
        />
      )}

      {isCylinder && (
        <g>
          {/* Cylinder Body */}
          <path
            d={`M 0 ${capRy} L 0 ${height - capRy} A ${width / 2} ${capRy} 0 0 0 ${width} ${height - capRy} L ${width} ${capRy} Z`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Top Cap */}
          <ellipse
            cx={width / 2}
            cy={capRy}
            rx={width / 2}
            ry={capRy}
            fill={
              fillColor !== 'transparent'
                ? fillColor
                : theme === 'cutting-mat'
                ? '#1a4230'
                : isLight
                ? '#f4f4f5'
                : '#18181b'
            }
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </g>
      )}

      {/* Text Inside Shape / Note (Non-frame shapes) */}
      {element.content && !isFrame && !isEditing && (
        <foreignObject
          x={
            isDiamond
              ? width * 0.2
              : isEllipse
              ? width * 0.15
              : isCylinder
              ? 12
              : isText
              ? 4
              : 12
          }
          y={
            isDiamond
              ? height * 0.2
              : isEllipse
              ? height * 0.15
              : isCylinder
              ? capRy + 6
              : isText
              ? 4
              : 10
          }
          width={
            isDiamond
              ? Math.max(width * 0.6, 20)
              : isEllipse
              ? Math.max(width * 0.7, 20)
              : isCylinder
              ? Math.max(width - 24, 20)
              : isText
              ? Math.max(width - 8, 20)
              : Math.max(width - 24, 20)
          }
          height={
            isDiamond
              ? Math.max(height * 0.6, 20)
              : isEllipse
              ? Math.max(height * 0.7, 20)
              : isCylinder
              ? Math.max(height - capRy * 2 - 12, 20)
              : isText
              ? Math.max(height - 8, 20)
              : Math.max(height - 20, 20)
          }
          className="pointer-events-none overflow-hidden"
        >
          <div
            style={{
              fontSize: `${element.style.fontSize || 16}px`,
              textAlign: element.style.textAlign || (isDiamond || isEllipse ? 'center' : 'left'),
              color:
                strokeColor === 'transparent'
                  ? theme === 'cutting-mat'
                    ? '#facc15'
                    : isLight
                    ? '#09090b'
                    : '#f4f4f5'
                  : strokeColor,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
            className="w-full h-full flex flex-col justify-center whitespace-pre-wrap leading-relaxed select-none font-sans"
          >
            {element.content}
          </div>
        </foreignObject>
      )}

      {!element.content && isText && !isEditing && (
        <text
          x={8}
          y={24}
          fill={theme === 'cutting-mat' ? '#a3e635' : isLight ? '#a1a1aa' : '#52525b'}
          fontSize={element.style.fontSize || 16}
          className="font-sans italic select-none"
        >
          Type text...
        </text>
      )}

      {/* Subtle Semantic Classification Tag */}
      {element.semanticType && element.semanticType !== 'none' && (
        <g transform={`translate(${width - 24}, 8)`} className="opacity-80">
          <rect
            x={-2}
            y={-2}
            width={18}
            height={18}
            rx={4}
            fill={theme === 'cutting-mat' ? '#143526' : isLight ? '#f4f4f5' : '#18181b'}
            stroke={theme === 'cutting-mat' ? '#facc15' : isLight ? '#d4d4d8' : '#3f3f46'}
            strokeWidth={0.8}
          />
          <foreignObject x={0} y={0} width={14} height={14}>
            <div className="flex items-center justify-center w-full h-full">
              {getSemanticIcon(element.semanticType)}
            </div>
          </foreignObject>
        </g>
      )}

      {/* Resize Handles (8 handles) when selected */}
      {isSelected && (
        <g className="cursor-default">
          <ResizeHandleGrip theme={theme} isLight={isLight} x={-4} y={-4} cursor="nwse-resize" onMouseDown={(e) => onStartResize(e, 'nw', element)} />
          <ResizeHandleGrip theme={theme} isLight={isLight} x={width / 2 - 4} y={-4} cursor="ns-resize" onMouseDown={(e) => onStartResize(e, 'n', element)} />
          <ResizeHandleGrip theme={theme} isLight={isLight} x={width - 4} y={-4} cursor="nesw-resize" onMouseDown={(e) => onStartResize(e, 'ne', element)} />
          <ResizeHandleGrip theme={theme} isLight={isLight} x={width - 4} y={height / 2 - 4} cursor="ew-resize" onMouseDown={(e) => onStartResize(e, 'e', element)} />
          <ResizeHandleGrip theme={theme} isLight={isLight} x={width - 4} y={height - 4} cursor="nwse-resize" onMouseDown={(e) => onStartResize(e, 'se', element)} />
          <ResizeHandleGrip theme={theme} isLight={isLight} x={width / 2 - 4} y={height - 4} cursor="ns-resize" onMouseDown={(e) => onStartResize(e, 's', element)} />
          <ResizeHandleGrip theme={theme} isLight={isLight} x={-4} y={height - 4} cursor="nesw-resize" onMouseDown={(e) => onStartResize(e, 'sw', element)} />
          <ResizeHandleGrip theme={theme} isLight={isLight} x={-4} y={height / 2 - 4} cursor="ew-resize" onMouseDown={(e) => onStartResize(e, 'w', element)} />
        </g>
      )}
    </g>
  );
};

function isRectangleLike(type: string): boolean {
  return type === 'rectangle' || type === 'sticky' || type === 'text' || type === 'frame';
}

const ResizeHandleGrip: React.FC<{
  theme?: string;
  isLight: boolean;
  x: number;
  y: number;
  cursor: string;
  onMouseDown: (e: React.MouseEvent) => void;
}> = ({ theme, isLight, x, y, cursor, onMouseDown }) => {
  return (
    <rect
      x={x}
      y={y}
      width={8}
      height={8}
      rx={1.5}
      fill={theme === 'cutting-mat' ? '#143526' : '#ffffff'}
      stroke={theme === 'cutting-mat' ? '#facc15' : isLight ? '#09090b' : '#09090b'}
      strokeWidth={1.5}
      style={{ cursor }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e);
      }}
    />
  );
};
