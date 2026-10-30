import mongoose, { Schema, Document } from 'mongoose';

export interface IArtifactNode {
  nodeId: string;
  section: string;
  text: string;
  sourceElementId?: string;
  semanticType?: string;
}

export interface IArtifact extends Document {
  artifactId: string;
  workspaceId: string;
  type: 'prd' | 'tech_spec' | 'action_items' | 'meeting_summary' | 'risk_assessment' | 'synthesis';
  title: string;
  content: string;
  traceableNodes: IArtifactNode[];
  isStale: boolean;
  staleReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArtifactSchema: Schema = new Schema(
  {
    artifactId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    traceableNodes: [
      {
        nodeId: { type: String },
        section: { type: String },
        text: { type: String },
        sourceElementId: { type: String },
        semanticType: { type: String },
      },
    ],
    isStale: { type: Boolean, default: false },
    staleReason: { type: String },
  },
  { timestamps: true }
);

export const ArtifactModel = mongoose.model<IArtifact>('Artifact', ArtifactSchema);
