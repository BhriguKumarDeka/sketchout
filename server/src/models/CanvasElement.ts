import mongoose, { Schema, Document } from 'mongoose';

export interface ICanvasElement extends Document {
  elementId: string;
  workspaceId: string;
  type: 'rectangle' | 'ellipse' | 'diamond' | 'sticky' | 'text' | 'draw' | 'arrow' | 'cylinder' | 'frame';
  semanticType: 'idea' | 'question' | 'decision' | 'requirement' | 'task' | 'assumption' | 'risk' | 'research' | 'note' | 'none';
  confidence: 'FACT' | 'DECISION' | 'SUGGESTION' | 'ASSUMPTION' | 'INFERENCE' | 'UNKNOWN';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  points?: Array<{ x: number; y: number }>;
  style: {
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
    opacity?: number;
    roughness?: number;
  };
  groupId?: string;
  sourceElementId?: string;
  targetElementId?: string;
  relationshipType?: 'SUPPORTS' | 'CONTRADICTS' | 'DEPENDS_ON' | 'DERIVED_FROM' | 'RELATED_TO' | 'REPLACES' | 'REJECTED_BY' | 'RESULTS_IN' | 'IMPLEMENTS';
  zIndex: number;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CanvasElementSchema: Schema = new Schema(
  {
    elementId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    semanticType: { type: String, default: 'none' },
    confidence: { type: String, default: 'FACT' },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, default: 160 },
    height: { type: Number, default: 100 },
    content: { type: String, default: '' },
    points: [{ x: Number, y: Number }],
    style: {
      strokeColor: { type: String, default: '#ffffff' },
      fillColor: { type: String, default: '#18181b' },
      strokeWidth: { type: Number, default: 2 },
      strokeStyle: { type: String, default: 'solid' },
      fontSize: { type: Number, default: 14 },
      textAlign: { type: String, default: 'left' },
      opacity: { type: Number, default: 1 },
      roughness: { type: Number, default: 0 },
    },
    groupId: { type: String },
    sourceElementId: { type: String },
    targetElementId: { type: String },
    relationshipType: { type: String },
    zIndex: { type: Number, default: 0 },
    author: { type: String, default: 'user' },
  },
  { timestamps: true }
);

CanvasElementSchema.index({ workspaceId: 1, elementId: 1 }, { unique: true });

export const CanvasElementModel = mongoose.model<ICanvasElement>('CanvasElement', CanvasElementSchema);
