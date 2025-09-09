import { Node, Edge } from 'reactflow';

// 히스토리 액션 타입 상수
export const HISTORY_ACTIONS = {
  // Tier 1 - 필수 기록 (데이터 무결성 중요)
  CREATE_ENTITY: 'CREATE_ENTITY',
  DELETE_ENTITY: 'DELETE_ENTITY',
  CREATE_COMMENT: 'CREATE_COMMENT',
  DELETE_COMMENT: 'DELETE_COMMENT',
  CREATE_IMAGE: 'CREATE_IMAGE',
  DELETE_IMAGE: 'DELETE_IMAGE',
  CREATE_RELATIONSHIP: 'CREATE_RELATIONSHIP',
  DELETE_RELATIONSHIP: 'DELETE_RELATIONSHIP',
  ADD_COLUMN: 'ADD_COLUMN',
  DELETE_COLUMN: 'DELETE_COLUMN',
  MODIFY_COLUMN: 'MODIFY_COLUMN',
  REORDER_COLUMNS: 'REORDER_COLUMNS',
  
  // 컬럼 체크박스 상태 변경
  CHANGE_COLUMN_PK: 'CHANGE_COLUMN_PK',
  CHANGE_COLUMN_NN: 'CHANGE_COLUMN_NN',
  CHANGE_COLUMN_UQ: 'CHANGE_COLUMN_UQ',
  CHANGE_COLUMN_AI: 'CHANGE_COLUMN_AI',
  CHANGE_COLUMN_FK_CONSTRAINT: 'CHANGE_COLUMN_FK_CONSTRAINT',
  
  // Tier 2 - 중요 기록 (사용자 편의)
  CHANGE_ENTITY_PHYSICAL_NAME: 'CHANGE_ENTITY_PHYSICAL_NAME',
  CHANGE_ENTITY_LOGICAL_NAME: 'CHANGE_ENTITY_LOGICAL_NAME',
  CHANGE_COLUMN_PHYSICAL_NAME: 'CHANGE_COLUMN_PHYSICAL_NAME',
  CHANGE_COLUMN_LOGICAL_NAME: 'CHANGE_COLUMN_LOGICAL_NAME',
  CHANGE_COMMENT_TEXT: 'CHANGE_COMMENT_TEXT',
  CHANGE_IMAGE_SOURCE: 'CHANGE_IMAGE_SOURCE',
  MOVE_NODE: 'MOVE_NODE',
  CHANGE_NODE_COLOR: 'CHANGE_NODE_COLOR',
  RESIZE_NODE: 'RESIZE_NODE',
  PASTE_NODE: 'PASTE_NODE'
} as const;

export type HistoryActionType = typeof HISTORY_ACTIONS[keyof typeof HISTORY_ACTIONS];

// 직렬화 가능한 히스토리 상태
export interface SerializableHistoryState {
  nodes: Node[];
  edges: Edge[];
  nodeColors: Record<string, string>;     // Map 대신 Record 사용
  edgeColors: Record<string, string>;
  commentColors: Record<string, string>;
  hiddenEntities: string[];               // Set 대신 Array 사용
}

// 히스토리 엔트리
export interface HistoryEntry {
  id: string;
  timestamp: number;
  actionType: HistoryActionType;
  description: string;
  data: SerializableHistoryState;
}

// 액션 타입별 설명 생성 함수
export const getActionDescription = (actionType: HistoryActionType, metadata?: any): string => {
  switch (actionType) {
    case HISTORY_ACTIONS.CREATE_ENTITY:
      return `엔티티 '${metadata?.name || '새 엔티티'}' 생성`;
    case HISTORY_ACTIONS.DELETE_ENTITY:
      return `엔티티 '${metadata?.name || '엔티티'}' 삭제`;
    case HISTORY_ACTIONS.CREATE_COMMENT:
      return '커멘트 생성';
    case HISTORY_ACTIONS.DELETE_COMMENT:
      return '커멘트 삭제';
    case HISTORY_ACTIONS.CREATE_IMAGE:
      return '이미지 노드 생성';
    case HISTORY_ACTIONS.DELETE_IMAGE:
      return '이미지 노드 삭제';
    case HISTORY_ACTIONS.CREATE_RELATIONSHIP:
      return `관계선 생성 (${metadata?.sourceLabel || '?'} → ${metadata?.targetLabel || '?'})`;
    case HISTORY_ACTIONS.DELETE_RELATIONSHIP:
      return '관계선 삭제';
    case HISTORY_ACTIONS.ADD_COLUMN:
      return `컬럼 '${metadata?.columnName || '새 컬럼'}' 추가`;
    case HISTORY_ACTIONS.DELETE_COLUMN:
      return `컬럼 '${metadata?.columnName || '컬럼'}' 삭제`;
    case HISTORY_ACTIONS.MODIFY_COLUMN:
      return `컬럼 '${metadata?.columnName || '컬럼'}' 수정`;
    case HISTORY_ACTIONS.REORDER_COLUMNS:
      return '컬럼 순서 변경';
    case HISTORY_ACTIONS.CHANGE_COLUMN_PK:
      return `컬럼 '${metadata?.columnName || '컬럼'}' PK ${metadata?.value ? '설정' : '해제'}`;
    case HISTORY_ACTIONS.CHANGE_COLUMN_NN:
      return `컬럼 '${metadata?.columnName || '컬럼'}' NN ${metadata?.value ? '설정' : '해제'}`;
    case HISTORY_ACTIONS.CHANGE_COLUMN_UQ:
      return `컬럼 '${metadata?.columnName || '컬럼'}' UQ ${metadata?.value ? '설정' : '해제'}`;
    case HISTORY_ACTIONS.CHANGE_COLUMN_AI:
      return `컬럼 '${metadata?.columnName || '컬럼'}' AI ${metadata?.value ? '설정' : '해제'}`;
    case HISTORY_ACTIONS.CHANGE_COLUMN_FK_CONSTRAINT:
      const constraintType = metadata?.field === 'onDelete' ? 'ON DELETE' : 'ON UPDATE';
      return `컬럼 '${metadata?.columnName || '컬럼'}' ${constraintType} 변경 (${metadata?.oldValue || '?'} → ${metadata?.newValue || '?'})`;
    case HISTORY_ACTIONS.CHANGE_ENTITY_PHYSICAL_NAME:
      return `엔티티 물리명 변경 (${metadata?.oldName || '?'} → ${metadata?.newName || '?'})`;
    case HISTORY_ACTIONS.CHANGE_ENTITY_LOGICAL_NAME:
      return `엔티티 논리명 변경 (${metadata?.oldName || '?'} → ${metadata?.newName || '?'})`;
    case HISTORY_ACTIONS.CHANGE_COLUMN_PHYSICAL_NAME:
      return `컬럼 물리명 변경 (${metadata?.oldName || '?'} → ${metadata?.newName || '?'})`;
    case HISTORY_ACTIONS.CHANGE_COLUMN_LOGICAL_NAME:
      return `컬럼 논리명 변경 (${metadata?.oldName || '?'} → ${metadata?.newName || '?'})`;
    case HISTORY_ACTIONS.CHANGE_COMMENT_TEXT:
      return '커멘트 텍스트 변경';
    case HISTORY_ACTIONS.CHANGE_IMAGE_SOURCE:
      return '이미지 변경';
    case HISTORY_ACTIONS.MOVE_NODE:
      return metadata?.multiple ? `노드 ${metadata.count}개 이동` : '노드 이동';
    case HISTORY_ACTIONS.CHANGE_NODE_COLOR:
      return metadata?.nodeType ? `${metadata.nodeType} 색상 변경` : '노드 색상 변경';
    case HISTORY_ACTIONS.RESIZE_NODE:
      return '노드 크기 변경';
    case HISTORY_ACTIONS.PASTE_NODE:
      return `${metadata?.nodeType || '노드'} 붙여넣기`;
    default:
      return '작업 수행';
  }
};

// Map과 Set을 직렬화 가능한 형태로 변환
export const serializeState = (state: {
  nodes: Node[];
  edges: Edge[];
  nodeColors: Map<string, string>;
  edgeColors: Map<string, string>;
  commentColors: Map<string, string>;
  hiddenEntities: Set<string>;
}): SerializableHistoryState => {
  return {
    nodes: JSON.parse(JSON.stringify(state.nodes)), // 깊은 복사
    edges: JSON.parse(JSON.stringify(state.edges)),
    nodeColors: Object.fromEntries(state.nodeColors),
    edgeColors: Object.fromEntries(state.edgeColors),
    commentColors: Object.fromEntries(state.commentColors),
    hiddenEntities: Array.from(state.hiddenEntities)
  };
};

// 직렬화된 상태를 다시 Map, Set 형태로 변환
export const deserializeState = (serializedState: SerializableHistoryState) => {
  return {
    nodes: serializedState.nodes,
    edges: serializedState.edges,
    nodeColors: new Map(Object.entries(serializedState.nodeColors)),
    edgeColors: new Map(Object.entries(serializedState.edgeColors)),
    commentColors: new Map(Object.entries(serializedState.commentColors)),
    hiddenEntities: new Set(serializedState.hiddenEntities)
  };
};

// 히스토리 매니저 클래스
export class HistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex: number = -1; // -1은 최신 상태를 의미
  private readonly maxHistorySize: number = 50;

  // 현재 상태를 히스토리에 저장
  saveState(
    actionType: HistoryActionType,
    currentState: SerializableHistoryState,
    metadata?: any
  ): void {
    // 현재 인덱스 이후의 히스토리 제거 (새로운 분기 시작)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // 새 히스토리 엔트리 생성
    const newEntry: HistoryEntry = {
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      actionType,
      description: getActionDescription(actionType, metadata),
      data: JSON.parse(JSON.stringify(currentState)) // 깊은 복사
    };

    // 히스토리에 추가
    this.history.push(newEntry);
    this.currentIndex = this.history.length - 1;

    // 최대 크기 초과 시 오래된 히스토리 제거
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  // 이전 상태로 되돌리기
  undo(): HistoryEntry | null {
    if (!this.canUndo()) {
      return null;
    }

    this.currentIndex--;
    return this.history[this.currentIndex];
  }

  // 다시 실행
  redo(): HistoryEntry | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    return this.history[this.currentIndex];
  }

  // Undo 가능 여부
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  // Redo 가능 여부
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // 현재 상태 가져오기
  getCurrentState(): HistoryEntry | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return null;
  }

  // 히스토리 목록 가져오기
  getHistoryList(): HistoryEntry[] {
    return [...this.history];
  }

  // 히스토리 초기화
  clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  // 현재 인덱스 가져오기
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  // 히스토리 크기 가져오기
  getHistorySize(): number {
    return this.history.length;
  }
}
