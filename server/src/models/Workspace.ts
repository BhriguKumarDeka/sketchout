import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspace extends Document {
  workspaceId: string;
  name: string;
  description?: string;
  activeView: 'canvas' | 'document' | 'ledger' | 'graph';
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema: Schema = new Schema(
  {
    workspaceId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, default: 'sketch out' },
    description: { type: String, default: 'Context-aware visual workspace' },
    activeView: { type: String, enum: ['canvas', 'document', 'ledger', 'graph'], default: 'canvas' },
    viewport: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      zoom: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

export const WorkspaceModel = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
