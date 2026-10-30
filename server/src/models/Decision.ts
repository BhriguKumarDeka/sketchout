import mongoose, { Schema, Document } from 'mongoose';

export interface IDecision extends Document {
  decisionId: string;
  workspaceId: string;
  title: string;
  rationale: string;
  alternatives: string[];
  status: 'Proposed' | 'Accepted' | 'Rejected' | 'Superseded' | 'Final';
  linkedElementIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DecisionSchema: Schema = new Schema(
  {
    decisionId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    rationale: { type: String, default: '' },
    alternatives: [{ type: String }],
    status: {
      type: String,
      enum: ['Proposed', 'Accepted', 'Rejected', 'Superseded', 'Final'],
      default: 'Proposed',
    },
    linkedElementIds: [{ type: String }],
  },
  { timestamps: true }
);

export const DecisionModel = mongoose.model<IDecision>('Decision', DecisionSchema);
