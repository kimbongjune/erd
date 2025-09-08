import mongoose, { Schema, Document } from 'mongoose';

// SavedData와 동일한 구조를 가진 ERD 데이터 타입
export interface IERDData {
  version: string;
  timestamp: number;
  nodes: any[];
  edges: any[];
  nodeColors: Record<string, string>;
  edgeColors: Record<string, string>;
  commentColors: Record<string, string>;
  viewSettings: {
    entityView: 'logical' | 'physical';
    showKeys: boolean;
    showPhysicalName: boolean;
    showLogicalName: boolean;
    showDataType: boolean;
    showConstraints: boolean;
    showDefaults: boolean;
  };
  theme: 'light' | 'dark';
  showGrid: boolean;
  hiddenEntities: string[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  viewportRestoreTrigger: number;
}

export interface IDiagram extends Document {
  id: string;
  title: string;
  description?: string;
  userEmail: string;
  erdData: IERDData;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ERDDataSchema = new Schema({
  version: { type: String, required: true },
  timestamp: { type: Number, required: true },
  nodes: { type: Schema.Types.Mixed, default: [] },
  edges: { type: Schema.Types.Mixed, default: [] },
  nodeColors: { type: Schema.Types.Mixed, default: {} },
  edgeColors: { type: Schema.Types.Mixed, default: {} },
  commentColors: { type: Schema.Types.Mixed, default: {} },
  viewSettings: {
    entityView: { type: String, enum: ['logical', 'physical'], default: 'logical' },
    showKeys: { type: Boolean, default: true },
    showPhysicalName: { type: Boolean, default: true },
    showLogicalName: { type: Boolean, default: false },
    showDataType: { type: Boolean, default: true },
    showConstraints: { type: Boolean, default: false },
    showDefaults: { type: Boolean, default: false }
  },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  showGrid: { type: Boolean, default: false },
  hiddenEntities: { type: [String], default: [] },
  viewport: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    zoom: { type: Number, default: 1 }
  },
  viewportRestoreTrigger: { type: Number, default: Date.now }
}, { _id: false });

const DiagramSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  userEmail: { type: String, required: true, index: true },
  erdData: { type: ERDDataSchema, required: true },
  isPublic: { type: Boolean, default: false },
  tags: { type: [String], default: [] }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// 인덱스 설정
DiagramSchema.index({ userEmail: 1, createdAt: -1 });
DiagramSchema.index({ userEmail: 1, updatedAt: -1 });
DiagramSchema.index({ userEmail: 1, title: 1 });
DiagramSchema.index({ isPublic: 1, createdAt: -1 });

export default mongoose.models.Diagram || mongoose.model<IDiagram>('Diagram', DiagramSchema);
