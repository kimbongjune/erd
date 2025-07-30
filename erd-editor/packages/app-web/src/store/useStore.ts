import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges, addEdge, Connection, NodeChange, MarkerType } from 'reactflow';
import { toast } from 'react-toastify';
import { createHandleId } from '../utils/handleUtils';
import { validateDataTypeForSQL } from '../utils/mysqlTypes';

// SQL 파싱 관련 타입 정의
interface ParsedColumn {
  id: string;
  name: string;
  dataType: string;
  pk: boolean;
  fk: boolean;
  nn: boolean;
  uq: boolean;
  ai: boolean;
  comment: string;
  logicalName?: string;
  defaultValue?: string;
}

interface ParsedTable {
  name: string;
  logicalName?: string;
  columns: ParsedColumn[];
}

// SQL 파싱 함수
const parseSQLTables = (sqlContent: string): ParsedTable[] => {
  const tables: ParsedTable[] = [];
  
  // CREATE TABLE 문 찾기
  const createTableRegex = /CREATE\s+TABLE\s+(?:`?(\w+)`?\.)?`?(\w+)`?\s*\(([\s\S]*?)\)\s*(?:ENGINE\s*=\s*\w+)?\s*(?:DEFAULT\s+CHARSET\s*=\s*\w+)?\s*(?:COMMENT\s*=\s*'([^']*)')?/gi;
  
  let match;
  while ((match = createTableRegex.exec(sqlContent)) !== null) {
    const schemaName = match[1];
    const tableName = match[2];
    const columnDefinitions = match[3];
    const tableComment = match[4];
    
    const columns: ParsedColumn[] = [];
    
    // 컬럼 정의 파싱
    const columnLines = columnDefinitions.split(',').map(line => line.trim());
    
    for (const line of columnLines) {
      if (!line || line.startsWith('PRIMARY KEY') || line.startsWith('KEY') || line.startsWith('UNIQUE') || line.startsWith('FOREIGN KEY')) {
        continue;
      }
      
      // 컬럼 정의 파싱
      const columnMatch = line.match(/`?(\w+)`?\s+(\w+(?:\(\d+(?:,\d+)?\))?)\s*(NOT\s+NULL)?\s*(DEFAULT\s+([^,\s]+))?\s*(AUTO_INCREMENT)?\s*(COMMENT\s+'([^']*)')?/i);
      
      if (columnMatch) {
        const columnName = columnMatch[1];
        const dataType = columnMatch[2];
        const isNotNull = columnMatch[3];
        const defaultValue = columnMatch[4];
        const isAutoIncrement = columnMatch[5];
        const comment = columnMatch[6] || '';
        
        // PK, FK, UQ 확인 (간단한 구현)
        const isPK = line.includes('PRIMARY KEY') || line.includes('PRIMARY KEY');
        const isFK = false; // FK는 별도 파싱 필요
        const isUQ = line.includes('UNIQUE');
        
        columns.push({
          id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: columnName,
          dataType: dataType.toUpperCase(),
          pk: isPK,
          fk: isFK,
          nn: !!isNotNull,
          uq: isUQ,
          ai: !!isAutoIncrement,
          comment: comment,
          logicalName: columnName,
          defaultValue: defaultValue
        });
      }
    }
    
    tables.push({
      name: tableName,
      logicalName: tableComment || tableName,
      columns: columns
    });
  }
  
  return tables;
};

// localStorage 키 상수
const STORAGE_KEY = 'erd-editor-data';
const STORAGE_VERSION = '1.0';

// 하위 계층으로의 연쇄 FK 추가 전파 함수 (PK 추가 시 사용)
export const propagateColumnAddition = (
  nodeId: string,
  addedColumn: any,
  allNodes: any[],
  allEdges: any[]
): { updatedNodes: any[], updatedEdges: any[] } => {
  let finalNodes = [...allNodes];
  let finalEdges = [...allEdges];
  
  // 현재 노드가 부모인 관계선들 찾기
  const childEdges = finalEdges.filter(edge => edge.source === nodeId);
  
  childEdges.forEach(edge => {
    const childNode = finalNodes.find(n => n.id === edge.target);
    if (childNode && childNode.type === 'entity') {
      const parentNode = finalNodes.find(n => n.id === nodeId);
      if (!parentNode) return;
      
      const childColumns = childNode.data.columns || [];
      const fkColumnName = `${parentNode.data.label.toLowerCase()}_${addedColumn.name}`;
      
      // 이미 해당 FK 컬럼이 존재하는지 확인
      const existingFkColumn = childColumns.find((col: any) => 
        (col.name === fkColumnName) ||
        (col.fk && col.parentEntityId === nodeId && 
         (col.parentColumnId === addedColumn.id || col.parentColumnId === addedColumn.name))
      );
      
      if (!existingFkColumn) {
        // 관계 타입에 따라 PK 여부 결정
        const isIdentifyingRelationship = edge.type === 'one-to-one-identifying' || edge.type === 'one-to-many-identifying';
        
        const newFkColumn = {
          id: `fk-${edge.target}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: fkColumnName,
          type: addedColumn.dataType || addedColumn.type,
          dataType: addedColumn.dataType || addedColumn.type,
          pk: isIdentifyingRelationship,
          fk: true,
          nn: isIdentifyingRelationship,
          uq: false,
          ai: false,
          comment: `Foreign key from ${parentNode.data.label}.${addedColumn.name}`,
          defaultValue: '',
          parentEntityId: nodeId,
          parentColumnId: addedColumn.id || addedColumn.name,
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        };
        
        const updatedChildColumns = [...childColumns, newFkColumn];
        
        // 자식 노드 업데이트
        finalNodes = finalNodes.map(node => 
          node.id === edge.target 
            ? { ...node, data: { ...node.data, columns: updatedChildColumns } }
            : node
        );
        
        // 추가된 FK가 PK이기도 한 경우 (식별자 관계), 재귀적으로 손자에게도 전파
        if (isIdentifyingRelationship) {
          const recursiveResult = propagateColumnAddition(
            edge.target,
            newFkColumn,
            finalNodes,
            finalEdges
          );
          finalNodes = recursiveResult.updatedNodes;
          finalEdges = recursiveResult.updatedEdges;
        }
      }
    }
  });
  
  return { updatedNodes: finalNodes, updatedEdges: finalEdges };
};

// 하위 계층으로의 연쇄 삭제 전파 함수
export const propagateColumnDeletion = (
  nodeId: string, 
  deletedColumn: any, 
  allNodes: any[], 
  allEdges: any[]
): { updatedNodes: any[], updatedEdges: any[] } => {
    let finalNodes = [...allNodes];
  let finalEdges = [...allEdges];
  
  // 현재 노드가 부모인 관계선들 찾기
  const childEdges = finalEdges.filter(edge => edge.source === nodeId);
  
  childEdges.forEach(edge => {
    const childNode = finalNodes.find(n => n.id === edge.target);
    if (childNode && childNode.type === 'entity') {
      const parentNode = finalNodes.find(n => n.id === nodeId);
      if (!parentNode) return;
      
      // 다양한 방법으로 FK 컬럼 찾기 (이름 변경에 대응 - 강화된 버전)
      let targetFkColumn = null;
      const childColumns = childNode.data.columns || [];
      
      // 1. parentEntityId + parentColumnId로 정확한 매칭 (ID 우선)
      targetFkColumn = childColumns.find((col: any) => 
        col.fk && col.parentEntityId === nodeId && 
        (col.parentColumnId === deletedColumn.id || col.parentColumnId === deletedColumn.name)
      );

      
      // 2. 부모 컬럼의 원래 이름으로도 찾기 (컬럼 이름 변경 대응)
      if (!targetFkColumn) {
        // 부모 엔티티의 모든 컬럼에서 현재 삭제되는 컬럼의 ID와 매칭되는 원래 컬럼 찾기
        const parentColumns = parentNode.data.columns || [];
        const currentParentColumn = parentColumns.find((col: any) => col.id === deletedColumn.id);
        
        // currentName 속성도 고려 (이름 변경된 경우)
        const searchNames = [
          deletedColumn.name,
          deletedColumn.currentName,
          currentParentColumn?.name
        ].filter(Boolean);
        
        if (currentParentColumn || searchNames.length > 0) {
          // 다양한 방식으로 FK 매핑 시도
          targetFkColumn = childColumns.find((col: any) => 
            col.fk && col.parentEntityId === nodeId && (
              col.parentColumnId === deletedColumn.id ||
              col.parentColumnId === deletedColumn.currentName ||
              col.parentColumnId === currentParentColumn?.id ||
              col.parentColumnId === currentParentColumn?.name ||
              col.parentColumnId === deletedColumn.name ||
              // 과거 이름 패턴들도 시도
              searchNames.some(name => 
                col.name === `${parentNode.data.label.toLowerCase()}_${name}` ||
                col.parentColumnId === name
              )
            )
          );
        }
      }
      
      // 3. 같은 부모에서 온 FK 중 타입이 일치하는 것 찾기 (복합키 상황 대응)
      if (!targetFkColumn) {
        const candidateFks = childColumns.filter((col: any) => 
          col.fk && 
          col.parentEntityId === nodeId && 
          (col.type === deletedColumn.type || col.dataType === deletedColumn.type)
        );
        
        // 후보가 하나뿐이면 그것을 선택
        if (candidateFks.length === 1) {
          targetFkColumn = candidateFks[0];
        }
        // 복수 후보가 있으면 parentColumnId가 가장 유사한 것 선택
        else if (candidateFks.length > 1) {
          targetFkColumn = candidateFks.find((col: any) => 
            col.parentColumnId && (
              col.parentColumnId.includes(deletedColumn.name) ||
              deletedColumn.name.includes(col.parentColumnId) ||
              col.parentColumnId === deletedColumn.id
            )
          ) || candidateFks[0]; // 매칭되는 것이 없으면 첫 번째 선택
        }
      }
      
      // 4. 이름 패턴으로 찾기 (최종 백업)
      if (!targetFkColumn) {
        const expectedFkName = `${parentNode.data.label.toLowerCase()}_${deletedColumn.name}`;
        targetFkColumn = childColumns.find((col: any) => 
          col.fk && col.name === expectedFkName
        );
      }
      
      if (targetFkColumn) {
        // FK 컬럼 삭제
        const updatedChildColumns = childColumns.filter((col: any) => col.id !== targetFkColumn.id);
        
        // 자식 노드 업데이트
        finalNodes = finalNodes.map(node => 
          node.id === edge.target 
            ? { ...node, data: { ...node.data, columns: updatedChildColumns } }
            : node
        );
        
        // 삭제된 FK가 해당 자식 노드의 PK이기도 했다면, 재귀적으로 전파
        if (targetFkColumn.pk) {
          const recursiveResult = propagateColumnDeletion(
            edge.target, 
            targetFkColumn, 
            finalNodes, 
            finalEdges
          );
          finalNodes = recursiveResult.updatedNodes;
          finalEdges = recursiveResult.updatedEdges;
        }
        
        // 남은 FK가 있는지 확인하여 관계 유지 여부 결정
        const remainingFKsFromThisParent = updatedChildColumns.filter((col: any) => 
          col.fk && col.parentEntityId === nodeId
        );
        
        if (remainingFKsFromThisParent.length === 0) {
          // 남은 FK가 없으면 관계 제거
          finalEdges = finalEdges.filter(e => e.id !== edge.id);
        }
      }
    }
  });
  
  return { updatedNodes: finalNodes, updatedEdges: finalEdges };
};

// PK 컬럼의 데이터타입 변경 시 모든 FK에 전파하는 함수
export const propagateDataTypeChange = (
  nodeId: string,
  changedColumn: any,
  newDataType: string,
  allNodes: any[],
  allEdges: any[]
): { updatedNodes: any[] } => {
  let finalNodes = [...allNodes];
  
  // 현재 노드가 부모인 관계선들 찾기
  const childEdges = allEdges.filter(edge => edge.source === nodeId);
  
  childEdges.forEach(edge => {
    const childNode = finalNodes.find(n => n.id === edge.target);
    if (childNode && childNode.type === 'entity') {
      const parentNode = finalNodes.find(n => n.id === nodeId);
      if (!parentNode) return;
      
      const childColumns = childNode.data.columns || [];
      
      // 해당 PK에 대응하는 FK 컬럼 찾기 (강화된 매핑)
      const targetFkColumn = childColumns.find((col: any) => 
        col.fk && col.parentEntityId === nodeId && 
        (col.parentColumnId === changedColumn.id || 
         col.parentColumnId === changedColumn.name ||
         col.name === `${parentNode.data.label.toLowerCase()}_${changedColumn.name}`)
      );
      
      if (targetFkColumn) {
        // FK의 데이터타입과 type 변경
        const updatedChildColumns = childColumns.map((col: any) => 
          col.id === targetFkColumn.id 
            ? { ...col, dataType: newDataType, type: newDataType }
            : col
        );
        
        // 자식 노드 업데이트
        finalNodes = finalNodes.map(node => 
          node.id === edge.target 
            ? { ...node, data: { ...node.data, columns: updatedChildColumns } }
            : node
        );
        
        // 해당 FK가 PK이기도 하다면 재귀적으로 하위 계층에도 전파
        if (targetFkColumn.pk) {
          const updatedFkColumn = { ...targetFkColumn, dataType: newDataType, type: newDataType };
          const recursiveResult = propagateDataTypeChange(
            edge.target,
            updatedFkColumn,
            newDataType,
            finalNodes,
            allEdges
          );
          finalNodes = recursiveResult.updatedNodes;
        }
      }
    }
  });
  
  return { updatedNodes: finalNodes };
};

// 개선된 FK 컬럼 탐색 함수 (export하여 다른 컴포넌트에서도 사용 가능)
export const findExistingFkColumn = (
  targetColumns: any[], 
  sourceEntityId: string, 
  sourcePkColumn: any, 
  sourceEntityLabel: string
) => {
  if (!targetColumns || targetColumns.length === 0) {
    return null;
  }

  // 1단계: parentEntityId와 parentColumnId 기반 정확 매칭
  const exactMatch = targetColumns.find((col: any) => 
    col.fk && 
    col.parentEntityId === sourceEntityId && 
    (col.parentColumnId === sourcePkColumn.id || col.parentColumnId === sourcePkColumn.name)
  );
  
  if (exactMatch) {
    return { column: exactMatch, matchType: 'exact' };
  }

  // 2단계: 같은 부모 엔티티에서 온 FK 중 타입이 일치하는 컬럼들 찾기
  const typeMatches = targetColumns.filter((col: any) => 
    col.fk && 
    col.parentEntityId === sourceEntityId && 
    (col.type === sourcePkColumn.type || col.dataType === sourcePkColumn.type)
  );

  if (typeMatches.length === 1) {
    return { column: typeMatches[0], matchType: 'type' };
  }

  // 3단계: 기존 이름 패턴과 일치하는 컬럼 찾기 (기존 로직 유지)
  const expectedFkName = `${sourceEntityLabel.toLowerCase()}_${sourcePkColumn.name}`;
  const nameMatch = targetColumns.find((col: any) => 
    col.name === expectedFkName && col.fk
  );

  if (nameMatch) {
    return { column: nameMatch, matchType: 'name' };
  }

  // 4단계: 같은 부모 엔티티의 FK 중 타입이 호환 가능한 컬럼들 (복수 후보)
  if (typeMatches.length > 1) {
    // 가장 최근에 생성된 컬럼을 우선 선택 (id 기준)
    const mostRecentMatch = typeMatches.reduce((latest, current) => {
      // id가 타임스탬프를 포함하는 경우 비교
      if (typeof latest.id === 'string' && typeof current.id === 'string') {
        return latest.id > current.id ? latest : current;
      }
      return latest;
    });
    
    return { 
      column: mostRecentMatch, 
      matchType: 'type_multiple',
      candidates: typeMatches 
    };
  }

  // 5단계: 같은 부모 엔티티의 모든 FK 컬럼들 (타입 무관)
  const sameParentFks = targetColumns.filter((col: any) => 
    col.fk && col.parentEntityId === sourceEntityId
  );

  if (sameParentFks.length > 0) {
    return { 
      column: sameParentFks[0], 
      matchType: 'same_parent',
      candidates: sameParentFks 
    };
  }

  // 매칭되는 FK 컬럼이 없음
  return null;
};

// 자동 저장 디바운싱을 위한 타이머
let autoSaveTimer: number | null = null;

// 디바운싱된 자동 저장 함수
const debounceAutoSave = (saveFunction: () => void, delay: number = 1000) => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  autoSaveTimer = setTimeout(() => {
    saveFunction();
  }, delay);
};

// Viewport 타입 정의
type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

// 저장할 데이터 타입 정의
type SavedData = {
  version: string;
  timestamp: number;
  nodes: Node[];
  edges: Edge[];
  nodeColors: Record<string, string>;
  edgeColors: Record<string, string>;
  commentColors: Record<string, string>;
  viewSettings: ViewSettings;
  theme: Theme;
  showGrid: boolean;
  hiddenEntities: string[];
  viewport: Viewport;
  viewportRestoreTrigger: number; // 데이터 로드 시 viewport 복원을 위한 트리거
};

type SnapGuide = {
  type: 'vertical' | 'horizontal';
  position: number;
  color: string;
  priority?: number;
};

// 엔티티 간의 최적 handle 위치를 결정하는 함수
const determineHandlePositions = (sourceNode: Node, targetNode: Node) => {
  const sourceWidth = sourceNode.width || 200;
  const targetWidth = targetNode.width || 200;
  
  const sourceLeft = sourceNode.position.x;
  const sourceRight = sourceLeft + sourceWidth;
  const sourceCenterX = sourceLeft + sourceWidth / 2;
  
  const targetLeft = targetNode.position.x;
  const targetRight = targetLeft + targetWidth;
  const targetCenterX = targetLeft + targetWidth / 2;
  
  // 겹침 여부 확인
  const isOverlapping = !(sourceRight <= targetLeft || targetRight <= sourceLeft);
  
  // 중심점 간 거리
  const centerDistance = Math.abs(sourceCenterX - targetCenterX);
  const minDistance = (sourceWidth + targetWidth) / 2 + 50; // 50px 여유 공간
  
  let sourceHandle: string, targetHandle: string;
  
  if (isOverlapping || centerDistance < minDistance) {
    // 겹치거나 매우 가까운 경우: 같은 방향으로 배치해서 겹침 방지
    if (sourceCenterX <= targetCenterX) {
      sourceHandle = 'right';
      targetHandle = 'right'; // target을 오른쪽으로
    } else {
      sourceHandle = 'left';
      targetHandle = 'left'; // target을 왼쪽으로
    }
  } else {
    // 충분히 떨어져 있는 경우: 최단거리로 연결
    if (sourceCenterX <= targetCenterX) {
      sourceHandle = 'right';
      targetHandle = 'left';
    } else {
      sourceHandle = 'left';
      targetHandle = 'right';
    }
  }
  
  return { sourceHandle, targetHandle };
};

type ViewSettings = {
  entityView: 'logical' | 'physical' | 'both';
  showKeys: boolean;
  showPhysicalName: boolean;
  showLogicalName: boolean;
  showDataType: boolean;
  showConstraints: boolean;
  showDefaults: boolean;
};

type Theme = 'light' | 'dark';

type AppTheme = {
  mode: Theme;
  colors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
  };
};

type RFState = {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  hoveredEdgeId: string | null;
  hoveredEntityId: string | null;
  highlightedEntities: string[];
  highlightedEdges: string[];
  highlightedColumns: Map<string, string[]>; // entityId -> columnNames[]
  isBottomPanelOpen: boolean;
  connectionMode: string | null;
  connectingNodeId: string | null;
  createMode: string | null;
  selectMode: boolean;
  
  // 로딩 관련
  isLoading: boolean;
  loadingMessage: string;
  loadingProgress: number; // 0-100 진행률
  
  // 색상 팔레트 관련
  nodeColors: Map<string, string>; // nodeId -> color
  edgeColors: Map<string, string>; // edgeId -> color
  commentColors: Map<string, string>; // commentId -> color
  showColorPalette: boolean;
  palettePosition: { x: number; y: number };
  paletteTarget: { type: 'node' | 'edge' | 'comment'; id: string } | null;
  previewNodeColor: { nodeId: string; color: string } | null; // 미리보기 색상
  
  // 스냅 기능 관련
  isDragging: boolean;
  draggingNodeId: string | null;
  snapGuides: SnapGuide[];
  snapThreshold: number;
  
  // 툴바 관련
  searchActive: boolean;
  relationsHighlight: boolean;
  showGrid: boolean;
  showAlignPopup: boolean;
  showViewPopup: boolean;
  
  // 검색 패널 관련
  isSearchPanelOpen: boolean;
  searchQuery: string;
  hiddenEntities: Set<string>;
  selectedSearchEntity: string | null;
  
  // 뷰 설정
  viewSettings: ViewSettings;
  
  // 테마 설정
  theme: Theme;
  
  // 캔버스 뷰포트 설정
  viewport: Viewport;
  viewportRestoreTrigger: number; // 데이터 로드 시 viewport 복원을 위한 트리거
  
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addNode: (type: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setHoveredEdgeId: (id: string | null) => void;
  setHoveredEntityId: (id: string | null) => void;
  setHighlightedEntities: (ids: string[]) => void;
  setHighlightedEdges: (ids: string[]) => void;
  setHighlightedColumns: (columns: Map<string, string[]>) => void;
  updateEntityHighlights: (entityId: string | null) => void;
  updateAllHighlights: () => void;
  clearAllHighlights: () => void;
  clearRelationsHighlight: () => void;
  setBottomPanelOpen: (isOpen: boolean) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  deleteSelected: () => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onConnect: (connection: Connection) => void;
  setConnectionMode: (mode: string | null) => void;
  setConnectingNodeId: (id: string | null) => void;
  finishConnection: (targetNodeId: string | null) => void;
  cancelConnection: () => void;
  updateSelectedEdgeType: (newType: string) => void;
  updateNodeData: (nodeId: string, newData: any) => void;
  setCreateMode: (mode: string | null) => void;
  setSelectMode: (mode: boolean) => void;
  
  // 스냅 기능 관련 함수들
  setIsDragging: (isDragging: boolean) => void;
  setDraggingNodeId: (nodeId: string | null) => void;
  setSnapGuides: (guides: SnapGuide[]) => void;
  calculateSnapGuides: (draggedNodeId: string, position: { x: number; y: number }) => SnapGuide[];
  
  // 툴바 관련 함수들
  setSearchActive: (active: boolean) => void;
  setRelationsHighlight: (active: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setShowAlignPopup: (show: boolean) => void;
  setShowViewPopup: (show: boolean) => void;
  updateEdgeHandles: () => void;
  clearAllEdges: () => void;
  
  // 검색 패널 관련 함수들
  toggleSearchPanel: () => void;
  setSearchQuery: (query: string) => void;
  hideEntity: (entityId: string) => void;
  showEntity: (entityId: string) => void;
  hideAllEntities: () => void;
  showAllEntities: () => void;
  setSelectedSearchEntity: (entityId: string | null) => void;
  focusOnEntity: (entityId: string) => void;
  closeSearchPanel: () => void;
  
  // 내보내기 관련 함수들
  exportToImage: () => void;
  exportToSQL: () => void;
  
  // 뷰 설정 함수들
  updateViewSettings: (settings: Partial<ViewSettings>) => void;
  
  // 테마 함수들
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  
  // 색상 팔레트 함수들
  showPalette: (target: { type: 'node' | 'edge' | 'comment'; id: string }, position: { x: number; y: number }) => void;
  hidePalette: () => void;
  setNodeColor: (nodeId: string, color: string) => void;
  setEdgeColor: (edgeId: string, color: string) => void;
  setCommentColor: (commentId: string, color: string) => void;
  getNodeColor: (nodeId: string) => string;
  getEdgeColor: (edgeId: string) => string;
  getCommentColor: (commentId: string) => string;
  setPreviewNodeColor: (nodeId: string, color: string) => void;
  clearPreviewNodeColor: () => void;
  
  // 자동 배치 함수들
  arrangeLeftRight: () => void;
  arrangeSnowflake: () => void;
  arrangeCompact: () => void;
  
  // localStorage 관련 함수들
  saveToLocalStorage: (showToast?: boolean) => void;
  loadFromLocalStorage: () => void;
  clearLocalStorage: () => void;
  
  // SQL import 관련 함수들
  importFromSQL: (sqlContent: string) => void;
  
  // 로딩 관련 함수들
  setLoading: (loading: boolean, message?: string) => void;
  setLoadingProgress: (progress: number, message?: string) => void;
  checkAndAutoLoad: () => boolean;
  
  // viewport 관련 함수들
  setViewport: (viewport: Viewport) => void;
  updateViewport: (viewport: Viewport) => void;
};

const useStore = create<RFState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  hoveredEdgeId: null,
  hoveredEntityId: null,
  highlightedEntities: [],
  highlightedEdges: [],
  highlightedColumns: new Map(),
  isBottomPanelOpen: false,
  connectionMode: null,
  connectingNodeId: null,
  createMode: null,
  selectMode: true,
  
  // 로딩 관련 초기값
  isLoading: false,
  loadingMessage: '',
  loadingProgress: 0,
  
  // 색상 팔레트 관련 초기값
  nodeColors: new Map(),
  edgeColors: new Map(),
  commentColors: new Map(),
  showColorPalette: false,
  palettePosition: { x: 0, y: 0 },
  paletteTarget: null,
  previewNodeColor: null,
  
  onNodesChange: (changes: NodeChange[]) => {
    set((state) => {
      const newNodes = applyNodeChanges(changes, state.nodes);
      
      // 노드가 이동했을 때 관계선의 핸들 위치를 자동으로 업데이트
      const hasPositionChange = changes.some(change => change.type === 'position');
      if (hasPositionChange) {
        const updatedEdges = state.edges.map(edge => {
          const sourceNode = newNodes.find(node => node.id === edge.source);
          const targetNode = newNodes.find(node => node.id === edge.target);
          
          if (sourceNode && targetNode) {
            // 새로운 handle 결정 로직 사용
            const { sourceHandle, targetHandle } = determineHandlePositions(sourceNode, targetNode);
            
            // 컬럼 기반 handle ID 생성
            const sourcePkColumn = sourceNode.data.columns?.find((col: any) => col.pk);
            const targetFkColumn = targetNode.data.columns?.find((col: any) => 
              col.fk && sourcePkColumn && col.name.startsWith(`${sourceNode.data.label.toLowerCase()}_`)
            );
            
            const sourceHandleId = sourcePkColumn 
              ? createHandleId(sourcePkColumn.name, sourceHandle as 'left' | 'right')
              : sourceHandle;
              
            const targetHandleId = targetFkColumn
              ? createHandleId(targetFkColumn.name, targetHandle as 'left' | 'right')
              : targetHandle;
            
            return {
              ...edge,
              sourceHandle: sourceHandleId,
              targetHandle: targetHandleId,
            };
          }
          return edge;
        });
        
        // nodes와 edges를 한 번에 업데이트
        return { nodes: newNodes, edges: updatedEdges };
      }
      
      return { nodes: newNodes };
    });
    
    // 노드 변경 시 자동 저장 (디바운싱 적용)
    debounceAutoSave(() => {
      get().saveToLocalStorage(false); // 자동 저장 시 토스트 없음
    }, 2000); // 2초 후 저장
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    
    // 엣지 변경 시 자동 저장 (디바운싱 적용)
    debounceAutoSave(() => {
      get().saveToLocalStorage(false); // 자동 저장 시 토스트 없음
    }, 2000); // 2초 후 저장
  },
  addNode: (type) => {
    const newNode = {
      id: `node_${Math.random()}`,
      type: type,
      position: { x: 100, y: 100 },
      data: type === 'entity' ? {
        label: `New ${type}`,
        physicalName: `New ${type}`,
        logicalName: 'Table',
        columns: [] // 빈 배열로 시작
      } : { label: `New ${type}` },
    };
    set({ nodes: [...get().nodes, newNode] });
  },
  setSelectedNodeId: (id) => {
    const state = get();
    // 선택이 해제되거나 다른 노드가 선택될 때 팔레트 숨김
    if (state.selectedNodeId !== id) {
      state.hidePalette();
    }
    set({ selectedNodeId: id });
    get().updateAllHighlights();
  },
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
  setHoveredEdgeId: (id: string | null) => set({ hoveredEdgeId: id }),
  setHoveredEntityId: (id: string | null) => {
    set({ hoveredEntityId: id });
    get().updateAllHighlights();
  },
  setHighlightedEntities: (ids: string[]) => set({ highlightedEntities: ids }),
  setHighlightedEdges: (ids: string[]) => set({ highlightedEdges: ids }),
  setHighlightedColumns: (columns: Map<string, string[]>) => set({ highlightedColumns: columns }),
  updateEntityHighlights: (entityId: string | null) => {
    if (!entityId) {
      set({ 
        highlightedEntities: [], 
        highlightedEdges: [], 
        highlightedColumns: new Map() 
      });
      return;
    }

    const state = get();
    const currentEntity = state.nodes.find(n => n.id === entityId);
    if (!currentEntity) return;

    const relatedEdges = state.edges.filter(edge => 
      edge.source === entityId || edge.target === entityId
    );
    const relatedEntityIds = new Set<string>();
    const highlightedColumns = new Map<string, string[]>();

    // 현재 엔티티의 컬럼들 분석 및 하이라이트
    const currentEntityColumns: string[] = [];
    
    relatedEdges.forEach(edge => {
      if (edge.source === entityId) {
        // 현재 엔티티가 부모인 경우 - 본인의 PK 컬럼들 하이라이트 (실제 FK가 있는 것만)
        relatedEntityIds.add(edge.target);
        
        // 자식 엔티티의 FK 컬럼들 찾기 - parentEntityId 기준
        const targetEntity = state.nodes.find(n => n.id === edge.target);
        if (targetEntity) {
          const fkColumns = targetEntity.data.columns?.filter((col: any) => 
            col.fk && col.parentEntityId === entityId
          ).map((col: any) => col.name) || [];
          if (fkColumns.length > 0) {
            highlightedColumns.set(edge.target, fkColumns);
          }
          
          // 본인의 PK 컬럼들 중에서 실제로 FK가 존재하는 것만 하이라이트
          const pkColumns = currentEntity.data.columns?.filter((col: any) => {
            if (!col.pk) return false;
            // 해당 PK에 대응하는 FK가 자식 엔티티에 존재하는지 확인 (parentEntityId 기준)
            return targetEntity.data.columns?.some((targetCol: any) => 
              targetCol.fk && targetCol.parentEntityId === entityId &&
              (targetCol.parentColumnId === col.id || targetCol.parentColumnId === col.name)
            );
          }).map((col: any) => col.name) || [];
          currentEntityColumns.push(...pkColumns);
        }
        
      } else {
        // 현재 엔티티가 자식인 경우 - 본인의 FK 컬럼들 하이라이트 (실제 PK가 있는 것만)
        relatedEntityIds.add(edge.source);
        
        // 부모 엔티티의 PK 컬럼들 찾기
        const sourceEntity = state.nodes.find(n => n.id === edge.source);
        if (sourceEntity) {
          // 본인의 FK 컬럼들 중에서 이 부모 엔티티에서 온 것들만 하이라이트
          const fkColumns = currentEntity.data.columns?.filter((col: any) => {
            return col.fk && col.parentEntityId === edge.source;
          }).map((col: any) => col.name) || [];
          currentEntityColumns.push(...fkColumns);
          
          // 부모 엔티티의 PK 컬럼들 중에서 실제로 FK가 존재하는 것만 하이라이트
          const pkColumns = sourceEntity.data.columns?.filter((col: any) => {
            if (!col.pk) return false;
            // 해당 PK에 대응하는 FK가 현재 엔티티에 존재하는지 확인 (parentEntityId 기준)
            return currentEntity.data.columns?.some((currentCol: any) => 
              currentCol.fk && currentCol.parentEntityId === edge.source &&
              (currentCol.parentColumnId === col.id || currentCol.parentColumnId === col.name)
            );
          }).map((col: any) => col.name) || [];
          if (pkColumns.length > 0) {
            highlightedColumns.set(edge.source, pkColumns);
          }
        }
      }
    });

    // 현재 엔티티의 컬럼들 하이라이트에 추가
    if (currentEntityColumns.length > 0) {
      // 중복 제거
      const uniqueColumns = [...new Set(currentEntityColumns)];
      highlightedColumns.set(entityId, uniqueColumns);
    }

    set({
      highlightedEntities: Array.from(relatedEntityIds),
      highlightedEdges: relatedEdges.map(edge => edge.id),
      highlightedColumns
    });
  },
  updateAllHighlights: () => {
    const state = get();
    // 관계선 하이라이트 모드가 활성화되어 있으면 하이라이트 변경하지 않음
    if (state.relationsHighlight) {
      return;
    }
    const activeEntityId = state.selectedNodeId || state.hoveredEntityId;
    get().updateEntityHighlights(activeEntityId);
  },
  clearAllHighlights: () => set({ 
    highlightedEntities: [], 
    highlightedEdges: [], 
    highlightedColumns: new Map(),
    hoveredEntityId: null
  }),
  clearRelationsHighlight: () => set({ 
    relationsHighlight: false,
    highlightedEdges: [], 
    highlightedColumns: new Map()
  }),
  setBottomPanelOpen: (isOpen) => set({ isBottomPanelOpen: isOpen }),
  deleteNode: (id) => {
    set((state) => {
      const nodeToDelete = state.nodes.find(node => node.id === id);
      if (!nodeToDelete) return state;

      // 삭제할 노드가 엔티티인 경우 관련 처리
      if (nodeToDelete.type === 'entity') {
        // 1. 이 엔티티와 연결된 모든 관계선 찾기
        const relatedEdges = state.edges.filter(edge => 
          edge.source === id || edge.target === id
        );
        
        // 2. 관련된 다른 엔티티들에서 FK 제거
        let updatedNodes = state.nodes.filter(node => node.id !== id);
        
        relatedEdges.forEach(edge => {
          if (edge.source === id) {
            // 삭제되는 엔티티가 부모(source)인 경우, 자식의 FK 제거
            const childNodeId = edge.target;
            updatedNodes = updatedNodes.map(node => {
              if (node.id === childNodeId && node.type === 'entity') {
                const filteredColumns = (node.data.columns || []).filter((col: any) => 
                  !(col.fk && col.name.startsWith(`${nodeToDelete.data.label.toLowerCase()}_`))
                );
                return { ...node, data: { ...node.data, columns: filteredColumns } };
              }
              return node;
            });
            
          }
        });

        // 3. 관련 관계선들 제거
        const updatedEdges = state.edges.filter(edge => 
          edge.source !== id && edge.target !== id
        );

                  toast.info(`엔티티 ${nodeToDelete.data.label}이(가) 삭제되었습니다.`);

        return {
          nodes: updatedNodes,
          edges: updatedEdges,
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        };
      } else {
        // 엔티티가 아닌 경우 (코멘트 등) 단순 삭제
        toast.info(`${nodeToDelete.type === 'comment' ? '코멘트' : '노드'}가 삭제되었습니다.`);
        return {
          nodes: state.nodes.filter(node => node.id !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        };
      }
    });
  },

  deleteEdge: (id) => {
    set((state) => {
      const edgeToDelete = state.edges.find(edge => edge.id === id);
      if (!edgeToDelete) return state;

      // 관계선 삭제 시 자식 엔티티의 FK만 제거 (부모 PK는 유지)
      const sourceNode = state.nodes.find(node => node.id === edgeToDelete.source);
      const targetNode = state.nodes.find(node => node.id === edgeToDelete.target);

      if (sourceNode && targetNode && sourceNode.type === 'entity' && targetNode.type === 'entity') {
        const updatedNodes = state.nodes.map(node => {
          if (node.id === edgeToDelete.target) {
            // parentEntityId를 사용해서 정확한 FK 컬럼 찾기
            let filteredColumns = [...(node.data.columns || [])];
            
            // 해당 관계에서 생성된 FK 컬럼들만 제거 (parentEntityId 기준)
            filteredColumns = filteredColumns.filter(col => 
              !(col.fk && col.parentEntityId === edgeToDelete.source)
            );

            return { ...node, data: { ...node.data, columns: filteredColumns } };
          }
          return node;
        });

        toast.info(`${sourceNode.data.label}과 ${targetNode.data.label} 간의 관계가 제거되었습니다.`);

        return {
          nodes: updatedNodes,
          edges: state.edges.filter(edge => edge.id !== id),
          selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
        };
      }

      return {
        edges: state.edges.filter(edge => edge.id !== id),
        selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
      };
    });
  },

  deleteSelected: () => {
    const state = get();
    if (state.selectedNodeId) {
      get().deleteNode(state.selectedNodeId);
    } else if (state.selectedEdgeId) {
      get().deleteEdge(state.selectedEdgeId);
    }
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onConnect: (connection) => {
    set((state) => {
      let updatedNodes = state.nodes;
      const sourceNode = state.nodes.find((node) => node.id === connection.source);
      const targetNode = state.nodes.find((node) => node.id === connection.target);

      // 순환참조 체크: 이미 반대 방향으로 관계가 있는지 확인 (자기 자신과의 관계는 제외)
      const existingReverseEdge = state.edges.find(edge => 
        edge.source === connection.target && edge.target === connection.source
      );
      
      if (existingReverseEdge && connection.source !== connection.target) {
        toast.error('순환참조는 허용되지 않습니다. 이미 반대 방향으로 관계가 설정되어 있습니다.');
        return state; // 상태 변경 없이 반환
      }

      // Check if there's already an edge between these nodes
      const existingEdge = state.edges.find(edge => 
        (edge.source === connection.source && edge.target === connection.target) ||
        (edge.source === connection.target && edge.target === connection.source)
      );

      // 부모에는 세로선, 자식에는 관계 타입에 따른 마커 (1:1은 마커 없음, 1:N은 까마귀발)
      let sourceMarker = undefined; // markerStart용 - 자식 쪽
      let targetMarker = { type: MarkerType.ArrowClosed, id: 'marker-parent' }; // markerEnd용 (부모)

      // Determine markers based on connectionMode
      if (state.connectionMode?.includes('oneToMany')) {
        sourceMarker = { type: MarkerType.ArrowClosed, id: 'marker-crow-many' }; // N쪽 (자식)에 까마귀발
      }
      // 1:1 관계는 자식 쪽에 마커 없음 (sourceMarker = undefined)

      if (sourceNode && targetNode && sourceNode.type === 'entity' && targetNode.type === 'entity') {
        const sourcePkColumns = sourceNode.data.columns?.filter((col: any) => col.pk) || [];

        // PK가 없는 경우 토스트 메시지 표시하고 관계 생성 중단
        if (sourcePkColumns.length === 0) {
          toast.error('관계를 생성하려면 부모 엔티티에 기본키(PK)가 필요합니다.');
          return state; // 상태 변경 없이 반환
        }

        // 셀프 관계에서 식별자 관계 체크
        if (connection.source === connection.target) {
          const relationshipType = state.connectionMode;
          const isIdentifyingRelationship = relationshipType === 'oneToOneIdentifying' || relationshipType === 'oneToManyIdentifying';
          
          if (isIdentifyingRelationship) {
            toast.error('자기 자신과의 관계에서는 식별자 관계를 설정할 수 없습니다. 비식별자 관계만 가능합니다.');
            return state; // 상태 변경 없이 반환
          }
        }

        // 식별자 관계의 경우 PK 선택, 비식별자 관계의 경우 일반 컬럼으로 FK 생성
        const relationshipType = state.connectionMode;
        const isIdentifyingRelationship = relationshipType === 'oneToOneIdentifying' || relationshipType === 'oneToManyIdentifying';

        let newTargetColumns = [...(targetNode.data.columns || [])];
        
        // 여러 PK가 있는 경우 모두 FK로 추가
        sourcePkColumns.forEach((sourcePkColumn: any) => {
          const fkColumnName = `${sourceNode.data.label.toLowerCase()}_${sourcePkColumn.name}`;
          
          // 기존 관계가 있는 경우 개선된 탐색, 새 관계인 경우 기존 방식
          let existingFkIndex = -1;
          let shouldUseAdvancedSearch = false;
          
          // 이미 관계가 존재하는지 확인 (재연결 상황)
          if (existingEdge) {
            shouldUseAdvancedSearch = true;
            // 개선된 FK 탐색 - parentEntityId와 parentColumnId 기반
            const existingFkResult = findExistingFkColumn(
              newTargetColumns, 
              sourceNode.id, 
              sourcePkColumn, 
              sourceNode.data.label
            );
            
            if (existingFkResult) {
              existingFkIndex = newTargetColumns.findIndex(col => col.id === existingFkResult.column.id);
            }
          } else {
            // 새로운 관계 - 기존 방식 (이름 기반)
            existingFkIndex = newTargetColumns.findIndex(col => col.name === fkColumnName);
          }

          if (isIdentifyingRelationship) {
            // 식별자 관계: FK가 PK의 일부가 됨
            if (existingFkIndex === -1) {
              newTargetColumns.push({ 
                id: `${Date.now()}_${Math.random()}`,
                name: fkColumnName, 
                type: sourcePkColumn.type, 
                pk: true, 
                fk: true,
                uk: false,
                comment: `Foreign key from ${sourceNode.data.label}.${sourcePkColumn.name}`,
                // FK 관계 추적을 위한 메타데이터 추가 (문제 6 해결)
                parentEntityId: sourceNode.id,
                parentColumnId: sourcePkColumn.id || sourcePkColumn.name
              });
            } else {
              newTargetColumns[existingFkIndex] = { 
                ...newTargetColumns[existingFkIndex], 
                pk: true, 
                fk: true,
                type: sourcePkColumn.type, // 타입 동기화
                // FK 관계 추적을 위한 메타데이터 추가 (문제 6 해결)
                parentEntityId: sourceNode.id,
                parentColumnId: sourcePkColumn.id || sourcePkColumn.name,
                comment: shouldUseAdvancedSearch ? 
                  `Foreign key from ${sourceNode.data.label}.${sourcePkColumn.name} (재사용됨)` :
                  `Foreign key from ${sourceNode.data.label}.${sourcePkColumn.name}`
              };
            }
          } else {
            // 비식별자 관계: FK는 일반 컬럼
            if (existingFkIndex === -1) {
              newTargetColumns.push({ 
                id: `${Date.now()}_${Math.random()}`,
                name: fkColumnName, 
                type: sourcePkColumn.type, 
                pk: false, 
                fk: true,
                uk: false,
                comment: `Foreign key from ${sourceNode.data.label}.${sourcePkColumn.name}`,
                // FK 관계 추적을 위한 메타데이터 추가 (문제 6 해결)
                parentEntityId: sourceNode.id,
                parentColumnId: sourcePkColumn.id || sourcePkColumn.name
              });
            } else {
              newTargetColumns[existingFkIndex] = { 
                ...newTargetColumns[existingFkIndex], 
                pk: false, 
                fk: true,
                type: sourcePkColumn.type, // 타입 동기화
                // FK 관계 추적을 위한 메타데이터 추가 (문제 6 해결)
                parentEntityId: sourceNode.id,
                parentColumnId: sourcePkColumn.id || sourcePkColumn.name,
                comment: shouldUseAdvancedSearch ? 
                  `Foreign key from ${sourceNode.data.label}.${sourcePkColumn.name} (재사용됨)` :
                  `Foreign key from ${sourceNode.data.label}.${sourcePkColumn.name}`
              };
            }
          }
        });

        updatedNodes = state.nodes.map((node) =>
          node.id === targetNode.id
            ? { ...node, data: { ...node.data, columns: newTargetColumns } }
            : node
        );
      }

      const sourceX = sourceNode?.position.x ? sourceNode.position.x + (sourceNode.width ?? 0) / 2 : 0;
      const targetX = targetNode?.position.x ? targetNode.position.x + (targetNode.width ?? 0) / 2 : 0;

      // 부모 엔티티의 PK 컬럼과 자식 엔티티의 새로 생성된 FK 컬럼을 찾아서 Handle 사용
      const sourcePkColumn = sourceNode?.data.columns?.find((col: any) => col.pk);
      
      // 자식 엔티티에서 새로 생성된 FK 컬럼 찾기
      let targetFkColumn = null;
      if (sourcePkColumn && sourceNode) {
        const fkColumnName = `${sourceNode.data.label.toLowerCase()}_${sourcePkColumn.name}`;
        const targetUpdatedNode = updatedNodes.find(node => node.id === targetNode?.id);
        if (targetUpdatedNode) {
          targetFkColumn = targetUpdatedNode.data.columns?.find((col: any) => col.name === fkColumnName && col.fk);
        }
      }
      
      // 새로운 handle 결정 로직 사용
      let sourceHandle: string, targetHandle: string;
      if (sourceNode && targetNode) {
        const handlePositions = determineHandlePositions(sourceNode, targetNode);
        sourceHandle = handlePositions.sourceHandle;
        targetHandle = handlePositions.targetHandle;
      } else {
        // 기본값 (기존 로직)
        sourceHandle = sourceX <= targetX ? 'right' : 'left';
        targetHandle = sourceX <= targetX ? 'left' : 'right';
      }
      
      // Handle ID 결정
      const sourceHandleId = sourcePkColumn 
        ? createHandleId(sourcePkColumn.name, sourceHandle as 'left' | 'right')
        : sourceHandle;
        
      const targetHandleId = targetFkColumn
        ? createHandleId(targetFkColumn.name, targetHandle as 'left' | 'right')
        : targetHandle;

      let updatedEdges;

      const getEdgeType = (connectionMode: string | null) => {
        if (!connectionMode) return 'one-to-many-non-identifying';
        switch (connectionMode) {
          case 'oneToOneIdentifying':
            return 'one-to-one-identifying';
          case 'oneToOneNonIdentifying':
            return 'one-to-one-non-identifying';
          case 'oneToManyIdentifying':
            return 'one-to-many-identifying';
          case 'oneToManyNonIdentifying':
            return 'one-to-many-non-identifying';
          default:
            return 'one-to-many-non-identifying';
        }
      };

      if (existingEdge) {
        // Update existing edge
        updatedEdges = state.edges.map(edge => {
          if (edge.id === existingEdge.id) {
            return {
              ...edge,
              type: getEdgeType(state.connectionMode),
              markerStart: sourceMarker,
              markerEnd: targetMarker,
              sourceHandle: sourceHandleId,
              targetHandle: targetHandleId,
            };
          }
          return edge;
        });
      } else {
        // Create new edge
        const newEdge = {
          ...connection,
          sourceHandle: sourceHandleId,
          targetHandle: targetHandleId,
          type: getEdgeType(state.connectionMode),
          markerStart: sourceMarker,
          markerEnd: targetMarker,
        };
        updatedEdges = addEdge(newEdge, state.edges);
      }

      return { nodes: updatedNodes, edges: updatedEdges };
    });
    
    // 관계 생성 후 현재 선택된 엔티티가 있으면 하이라이트 업데이트
    setTimeout(() => {
      get().updateAllHighlights();
    }, 0);
  },
  setConnectionMode: (mode) => {
    set({ connectionMode: mode });
  },
  setConnectingNodeId: (id) => set({ connectingNodeId: id }),
  finishConnection: (targetNodeId) => {
    const { connectingNodeId, connectionMode, onConnect } = get();
    if (targetNodeId && connectingNodeId && connectionMode) {
      onConnect({
        source: connectingNodeId,
        target: targetNodeId,
        sourceHandle: null,
        targetHandle: null,
      });
    }
    // 관계 생성 후 선택 모드로 돌아가기
    set({ 
      connectingNodeId: null, 
      connectionMode: null,
      createMode: null,
      selectMode: true 
    });
  },
  cancelConnection: () => {
    set({ connectingNodeId: null, connectionMode: null });
  },
  updateSelectedEdgeType: (newType: string) => {
    set((state) => {
      if (!state.selectedEdgeId) return state;
      
      const updatedEdges = state.edges.map(edge => {
        if (edge.id === state.selectedEdgeId) {
          // 부모에는 세로선, 자식에는 관계 타입에 따른 마커
          let sourceMarker = undefined; // markerStart용 - 자식 쪽
          let targetMarker = { type: MarkerType.ArrowClosed, id: 'marker-parent' }; // markerEnd용 (부모)

          if (newType.includes('one-to-many')) {
            sourceMarker = { type: MarkerType.ArrowClosed, id: 'marker-crow-many' }; // N쪽 (자식)
          }
          // 1:1 관계는 자식 쪽에 마커 없음

          return {
            ...edge,
            type: newType,
            markerStart: sourceMarker,
            markerEnd: targetMarker,
          };
        }
        return edge;
      });

      return { edges: updatedEdges };
    });
  },

  setCreateMode: (mode: string | null) => set({ createMode: mode }),
  setSelectMode: (mode: boolean) => set({ selectMode: mode }),
  
  // 스냅 기능 관련 상태 초기값
  isDragging: false,
  draggingNodeId: null,
  snapGuides: [],
  snapThreshold: 5,
  
  // 툴바 관련 상태 초기값
  searchActive: false,
  relationsHighlight: false,
  showGrid: false,
  showAlignPopup: false,
  showViewPopup: false,
  
  // 검색 패널 관련 상태 초기값
  isSearchPanelOpen: false,
  searchQuery: '',
  hiddenEntities: new Set(),
  selectedSearchEntity: null,
  
  // 뷰 설정 초기값
  viewSettings: {
    entityView: 'logical',
    showKeys: true,
    showPhysicalName: true,
    showLogicalName: false,
    showDataType: true,
    showConstraints: false,
    showDefaults: false,
  },
  
  // 테마 초기값
  theme: 'light',
  
  // 캔버스 뷰포트 초기값
  viewport: { x: 0, y: 0, zoom: 1 },
  viewportRestoreTrigger: 0,
  
  // 스냅 기능 관련 함수들
  setIsDragging: (isDragging: boolean) => set({ isDragging }),
  setDraggingNodeId: (nodeId: string | null) => set({ draggingNodeId: nodeId }),
  setSnapGuides: (guides: SnapGuide[]) => set({ snapGuides: guides }),
  
  calculateSnapGuides: (draggedNodeId: string, position: { x: number; y: number }) => {
    const state = get();
    const nodes = state.nodes;
    const draggedNode = nodes.find(n => n.id === draggedNodeId);
    
    if (!draggedNode) return [];
    
    const guides: SnapGuide[] = [];
    const threshold = state.snapThreshold;
    
    // 드래그 중인 노드의 크기 (기본값 설정)
    const draggedWidth = draggedNode.width || 280;
    const draggedHeight = draggedNode.height || 120;
    
    // nodeOrigin=[0.5, 0.5]이므로 position이 노드 중심점
    const draggedBounds = {
      left: position.x - draggedWidth / 2,
      right: position.x + draggedWidth / 2,
      top: position.y - draggedHeight / 2,
      bottom: position.y + draggedHeight / 2,
      centerX: position.x,
      centerY: position.y
    };
    
    let bestVerticalGuide: { guide: SnapGuide; distance: number } | null = null;
    let bestHorizontalGuide: { guide: SnapGuide; distance: number } | null = null;
    
    // 다른 노드들과 비교
    nodes.forEach(node => {
      if (node.id === draggedNodeId) return;
      
      const nodeWidth = node.width || 280;
      const nodeHeight = node.height || 120;
      
      // nodeOrigin=[0.5, 0.5]이므로 position이 노드 중심점
      const nodeBounds = {
        left: node.position.x - nodeWidth / 2,
        right: node.position.x + nodeWidth / 2,
        top: node.position.y - nodeHeight / 2,
        bottom: node.position.y + nodeHeight / 2,
        centerX: node.position.x,
        centerY: node.position.y
      };
      
      // 수직 가이드라인 (X축 정렬) - 우선순위: center > left/right
      const verticalChecks = [
        { name: 'centerX', targetValue: nodeBounds.centerX, draggedValue: draggedBounds.centerX, priority: 1 },
        { name: 'left', targetValue: nodeBounds.left, draggedValue: draggedBounds.left, priority: 2 },
        { name: 'left', targetValue: nodeBounds.left, draggedValue: draggedBounds.right, priority: 2 },
        { name: 'right', targetValue: nodeBounds.right, draggedValue: draggedBounds.left, priority: 2 },
        { name: 'right', targetValue: nodeBounds.right, draggedValue: draggedBounds.right, priority: 2 }
      ];
      
      verticalChecks.forEach(check => {
        const distance = Math.abs(check.targetValue - check.draggedValue);
        if (distance <= threshold) {
          if (!bestVerticalGuide || check.priority < (bestVerticalGuide.guide.priority || 99) || 
              (check.priority === (bestVerticalGuide.guide.priority || 99) && distance < bestVerticalGuide.distance)) {
            bestVerticalGuide = {
              guide: {
                type: 'vertical',
                position: check.targetValue,
                color: check.priority === 1 ? '#ef4444' : '#3b82f6',
                priority: check.priority
              },
              distance
            };
          }
        }
      });
      
      // 수평 가이드라인 (Y축 정렬) - 우선순위: center > top/bottom
      const horizontalChecks = [
        { name: 'centerY', targetValue: nodeBounds.centerY, draggedValue: draggedBounds.centerY, priority: 1 },
        { name: 'top', targetValue: nodeBounds.top, draggedValue: draggedBounds.top, priority: 2 },
        { name: 'top', targetValue: nodeBounds.top, draggedValue: draggedBounds.bottom, priority: 2 },
        { name: 'bottom', targetValue: nodeBounds.bottom, draggedValue: draggedBounds.top, priority: 2 },
        { name: 'bottom', targetValue: nodeBounds.bottom, draggedValue: draggedBounds.bottom, priority: 2 }
      ];
      
      horizontalChecks.forEach(check => {
        const distance = Math.abs(check.targetValue - check.draggedValue);
        if (distance <= threshold) {
          if (!bestHorizontalGuide || check.priority < (bestHorizontalGuide.guide.priority || 99) || 
              (check.priority === (bestHorizontalGuide.guide.priority || 99) && distance < bestHorizontalGuide.distance)) {
            bestHorizontalGuide = {
              guide: {
                type: 'horizontal',
                position: check.targetValue,
                color: check.priority === 1 ? '#ef4444' : '#3b82f6',
                priority: check.priority
              },
              distance
            };
          }
        }
      });
    });
    
    // 최고 우선순위 가이드만 반환
    const result: SnapGuide[] = [];
    if (bestVerticalGuide) {
      result.push((bestVerticalGuide as { guide: SnapGuide; distance: number }).guide);
    }
    if (bestHorizontalGuide) {
      result.push((bestHorizontalGuide as { guide: SnapGuide; distance: number }).guide);
    }
    
    return result;
  },
  
  // 툴바 관련 함수들
  setSearchActive: (active: boolean) => set({ searchActive: active }),
  setRelationsHighlight: (active: boolean) => set({ relationsHighlight: active }),
  setShowGrid: (show: boolean) => {
    set({ showGrid: show });
    // 그리드 설정 변경 시 localStorage에 자동 저장
    setTimeout(() => {
      get().saveToLocalStorage(false);
    }, 0);
  },
  setShowAlignPopup: (show: boolean) => set({ showAlignPopup: show }),
  setShowViewPopup: (show: boolean) => set({ showViewPopup: show }),
  
  // 검색 패널 관련 함수들
  toggleSearchPanel: () => set((state) => ({ 
    isSearchPanelOpen: !state.isSearchPanelOpen,
    searchActive: !state.isSearchPanelOpen 
  })),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  hideEntity: (entityId: string) => set((state) => {
    const newHidden = new Set([...state.hiddenEntities, entityId]);
    return { hiddenEntities: newHidden };
  }),
  showEntity: (entityId: string) => set((state) => {
    const newHidden = new Set(state.hiddenEntities);
    newHidden.delete(entityId);
    return { hiddenEntities: newHidden };
  }),
  hideAllEntities: () => set((state) => ({
    hiddenEntities: new Set(state.nodes.filter(n => n.type === 'entity').map(n => n.id))
  })),
  showAllEntities: () => set({ hiddenEntities: new Set() }),
  setSelectedSearchEntity: (entityId: string | null) => set({ selectedSearchEntity: entityId }),
  focusOnEntity: (entityId: string) => {
    const { nodes, setSelectedNodeId } = get();
    const entity = nodes.find(n => n.id === entityId && n.type === 'entity');
    if (entity) {
      // 엔티티로 포커스 이동 (이 부분은 나중에 ReactFlow의 fitView 등을 사용해 구현)
      setSelectedNodeId(entityId);
      set({ selectedSearchEntity: entityId });
    }
  },
  closeSearchPanel: () => set({ 
    isSearchPanelOpen: false, 
    searchActive: false,
    searchQuery: '',
    selectedSearchEntity: null,
    hiddenEntities: new Set()
  }),
  
  // 내보내기 관련 함수들
  exportToImage: () => {
    // 이 함수는 Canvas 컴포넌트에서 ReactFlow 컨텍스트 내에서 실행되어야 함
    // 여기서는 상태만 변경하고 실제 내보내기는 Canvas에서 수행
    const event = new CustomEvent('exportToImage');
    window.dispatchEvent(event);
  },
  
  exportToSQL: () => {
    const { nodes, edges } = get();
    const entityNodes = nodes.filter(node => node.type === 'entity');
    
    // 엔티티 물리명이 비어있는 경우 검증
    for (const node of entityNodes) {
      if (!node.data.label || node.data.label.trim() === '') {
        // 해당 엔티티를 활성화
        get().setSelectedNodeId(node.id);
        get().setBottomPanelOpen(true);
        
        // 엔티티를 화면 중앙으로 이동
        const nodeElement = document.querySelector(`[data-id="${node.id}"]`) as HTMLElement;
        if (nodeElement) {
          // ReactFlow의 fitView를 사용하여 특정 노드에 zoom to fit 적용
          const reactFlowInstance = (window as any).reactFlowInstance;
          if (reactFlowInstance) {
            reactFlowInstance.fitView({
              nodes: [node],
              padding: 0.2, // 원래대로 복원
              duration: 500
            });
          }
        }
        
        setTimeout(() => {
          toast.error(`엔티티의 물리명이 비어있습니다. (ID: ${node.id})`);
        }, 200);
        return;
      }
    }
    
    // 중복 테이블명 검증
    const tableNames = entityNodes.map(node => node.data.label);
    const duplicateTableNames = tableNames.filter((name, index) => tableNames.indexOf(name) !== index);
    
    if (duplicateTableNames.length > 0) {
      const uniqueDuplicates = [...new Set(duplicateTableNames)];
      const firstDuplicateName = uniqueDuplicates[0];
      const duplicateNode = entityNodes.find(node => node.data.label === firstDuplicateName);
      
      if (duplicateNode) {
        get().setSelectedNodeId(duplicateNode.id);
        get().setBottomPanelOpen(true);
        
        // 엔티티를 화면 중앙으로 이동
        const nodeElement = document.querySelector(`[data-id="${duplicateNode.id}"]`) as HTMLElement;
        if (nodeElement) {
          // ReactFlow의 fitView를 사용하여 특정 노드에 zoom to fit 적용
          const reactFlowInstance = (window as any).reactFlowInstance;
          if (reactFlowInstance) {
            reactFlowInstance.fitView({
              nodes: [duplicateNode],
              padding: 0.2, // 원래대로 복원
              duration: 500
            });
          }
        }
      }
      
      setTimeout(() => {
        toast.error(`중복된 테이블 이름이 있습니다: ${uniqueDuplicates.join(', ')}`);
      }, 200);
      return;
    }
    
    // 각 테이블 내에서 컬럼 검증
    for (const node of entityNodes) {
      const columns = node.data.columns || [];
      
      // 컬럼 물리명이 비어있는 경우 검증
      for (const column of columns) {
        if (!column.name || column.name.trim() === '') {
          get().setSelectedNodeId(node.id);
          get().setBottomPanelOpen(true);
          
          // 엔티티를 화면 중앙으로 이동
          const nodeElement = document.querySelector(`[data-id="${node.id}"]`) as HTMLElement;
          if (nodeElement) {
            // ReactFlow의 fitView를 사용하여 특정 노드에 zoom to fit 적용
            const reactFlowInstance = (window as any).reactFlowInstance;
            if (reactFlowInstance) {
              reactFlowInstance.fitView({
                nodes: [node],
                padding: 0.2, // 원래대로 복원
                duration: 500
              });
            }
          }
          
          setTimeout(() => {
            toast.error(`테이블 '${node.data.label}'의 컬럼 물리명이 비어있습니다.`);
          }, 200);
          return;
        }
      }
      
      // 중복 컬럼명 검증
      const columnNames = columns.map((col: any) => col.name);
      const duplicateColumnNames = columnNames.filter((name: string, index: number) => columnNames.indexOf(name) !== index);
      
      if (duplicateColumnNames.length > 0) {
        const uniqueDuplicates = [...new Set(duplicateColumnNames)];
        get().setSelectedNodeId(node.id);
        get().setBottomPanelOpen(true);
        
        // 엔티티를 화면 중앙으로 이동
        const nodeElement = document.querySelector(`[data-id="${node.id}"]`) as HTMLElement;
        if (nodeElement) {
          // ReactFlow의 fitView를 사용하여 특정 노드에 zoom to fit 적용
          const reactFlowInstance = (window as any).reactFlowInstance;
          if (reactFlowInstance) {
            reactFlowInstance.fitView({
              nodes: [node],
              padding: 0.2, // 원래대로 복원
              duration: 500
            });
          }
        }
        
        setTimeout(() => {
          toast.error(`테이블 '${node.data.label}'에 중복된 컬럼 이름이 있습니다: ${uniqueDuplicates.join(', ')}`);
        }, 200);
        return;
      }
      
      // 데이터타입 유효성 검사
      for (const column of columns) {
        const dataType = column.dataType || column.type;
        if (dataType) {
          const validation = validateDataTypeForSQL(dataType);
          if (!validation.isValid) {
            get().setSelectedNodeId(node.id);
            get().setBottomPanelOpen(true);
            
            // 엔티티를 화면 중앙으로 이동
            const nodeElement = document.querySelector(`[data-id="${node.id}"]`) as HTMLElement;
            if (nodeElement) {
              // ReactFlow의 fitView를 사용하여 특정 노드에 zoom to fit 적용
              const reactFlowInstance = (window as any).reactFlowInstance;
              if (reactFlowInstance) {
                reactFlowInstance.fitView({
                  nodes: [node],
                  padding: 0.2, // 원래대로 복원
                  duration: 500
                });
              }
            }
            
            setTimeout(() => {
              toast.error(`테이블 '${node.data.label}'의 컬럼 '${column.name}': ${validation.error}`);
            }, 200);
            return;
          }
        }
      }
    }
    
    let sql = '-- MySQL Database Schema\n';
    sql += '-- Generated by ERD Editor\n\n';
    
    // CREATE TABLE 문들 생성
    entityNodes.forEach(node => {
      const tableName = node.data.label;
      const columns = node.data.columns || [];
      
      sql += `CREATE TABLE \`${tableName}\` (\n`;
      
      const columnDefs = columns.map((col: any) => {
        let def = `  \`${col.name}\` ${col.dataType || col.type || 'VARCHAR(255)'}`;
        
        if (col.nn || col.pk) def += ' NOT NULL';
        if (col.ai) def += ' AUTO_INCREMENT';
        if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
        if (col.comment) def += ` COMMENT '${col.comment}'`;
        
        return def;
      });
      
      sql += columnDefs.join(',\n');
      
      // PRIMARY KEY 추가
      const pkColumns = columns.filter((col: any) => col.pk).map((col: any) => `\`${col.name}\``);
      if (pkColumns.length > 0) {
        sql += `,\n  PRIMARY KEY (${pkColumns.join(', ')})`;
      }
      
      // UNIQUE KEY 추가
      const uqColumns = columns.filter((col: any) => col.uq && !col.pk).map((col: any) => `\`${col.name}\``);
      if (uqColumns.length > 0) {
        uqColumns.forEach((colName: string) => {
          sql += `,\n  UNIQUE KEY \`uk_${tableName}_${colName.replace(/[`]/g, '')}\` (${colName})`;
        });
      }
      
      sql += `\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='${node.data.comment || tableName}';\n\n`;
    });
    
    // FOREIGN KEY 제약조건 추가
    edges.forEach(edge => {
      const sourceNode = entityNodes.find(n => n.id === edge.source);
      const targetNode = entityNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const sourceTable = sourceNode.data.label;
        const targetTable = targetNode.data.label;
        
        // FK 컬럼들을 찾기 (복합키 지원)
        const targetFkColumns = targetNode.data.columns?.filter((col: any) => 
          col.fk && col.parentEntityId === sourceNode.id
        ) || [];
        
        if (targetFkColumns.length > 0) {
          // 각 FK 컬럼에 대해 제약조건 생성
          targetFkColumns.forEach((fkCol: any) => {
            const sourcePkCol = sourceNode.data.columns?.find((col: any) => 
              col.pk && (col.id === fkCol.parentColumnId || col.name === fkCol.parentColumnId)
            );
            
            if (sourcePkCol) {
              sql += `ALTER TABLE \`${targetTable}\` ADD CONSTRAINT \`fk_${targetTable}_${sourceTable}_${fkCol.name}\`\n`;
              sql += `  FOREIGN KEY (\`${fkCol.name}\`) REFERENCES \`${sourceTable}\`(\`${sourcePkCol.name}\`)`;
              
              // ON DELETE와 ON UPDATE 옵션 추가
              if (fkCol.onDelete) {
                sql += ` ON DELETE ${fkCol.onDelete}`;
              }
              if (fkCol.onUpdate) {
                sql += ` ON UPDATE ${fkCol.onUpdate}`;
              }
              
              sql += ';\n\n';
            }
          });
        }
      }
    });
    
    // 파일 다운로드
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'database_schema.sql';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('SQL 파일이 다운로드되었습니다.');
  },
  
  // 뷰 설정 함수들
  updateViewSettings: (settings: Partial<ViewSettings>) => {
    set((state) => ({ 
      viewSettings: { ...state.viewSettings, ...settings } 
    }));
    // 뷰 설정 변경 시 localStorage에 자동 저장
    setTimeout(() => {
      get().saveToLocalStorage(false);
    }, 0);
  },
  
  // 테마 함수들
  setTheme: (theme: Theme) => {
    set({ theme });
    // 테마 변경 시 localStorage에 자동 저장
    setTimeout(() => {
      get().saveToLocalStorage(false);
    }, 0);
  },
  toggleTheme: () => {
    set((state) => ({ 
      theme: state.theme === 'light' ? 'dark' : 'light' 
    }));
    // 테마 변경 시 localStorage에 자동 저장
    setTimeout(() => {
      get().saveToLocalStorage(false);
    }, 0);
  },
  
  updateNodeData: (nodeId: string, newData: any) => {
    set((state) => {
      const oldNode = state.nodes.find(node => node.id === nodeId);
      if (!oldNode) return state;

      const updatedNodes = state.nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, data: newData };
        }
        return node;
      });

      // 컬럼 변경 분석 - 개선된 로직
      const oldColumns = oldNode.data.columns || [];
      const newColumns = newData.columns || [];
      
      // PK 컬럼 이름 변경 감지 (자식 FK의 parentColumnId 업데이트를 위함)
      const renamedPkColumns = oldColumns.filter((oldCol: any) => {
        if (!oldCol.pk) return false;
        const newCol = newColumns.find((newCol: any) => newCol.id === oldCol.id);
        return newCol && newCol.pk && oldCol.name !== newCol.name; // PK이면서 이름이 변경됨
      }).map((oldCol: any) => {
        const newCol = newColumns.find((newCol: any) => newCol.id === oldCol.id);
        return { oldColumn: oldCol, newColumn: newCol };
      });

      // FK 컬럼 삭제 감지 - parentEntityId 기준으로 관계선도 함께 삭제
      const deletedFkColumns = oldColumns.filter((oldCol: any) => {
        if (!oldCol.fk || !oldCol.parentEntityId) return false;
        const stillExists = newColumns.find((newCol: any) => 
          newCol.id === oldCol.id || (newCol.fk && newCol.parentEntityId === oldCol.parentEntityId)
        );
        return !stillExists;
      });

      // FK 컬럼의 PK 상태 변경 감지
      const fkPkChangedColumns = oldColumns.filter((oldCol: any) => {
        if (!oldCol.fk || !oldCol.parentEntityId) return false;
        const newCol = newColumns.find((newCol: any) => newCol.id === oldCol.id);
        return newCol && oldCol.pk !== newCol.pk;
      });

      // 부모 엔티티의 PK 컬럼 삭제 감지
      const deletedPkColumns = oldColumns.filter((oldCol: any) => {
        if (!oldCol.pk) return false;
        const stillExists = newColumns.find((newCol: any) => newCol.id === oldCol.id && newCol.pk);
        return !stillExists;
      });

            let finalNodes = updatedNodes;
      let finalEdges = state.edges;

      // PK 컬럼 이름 변경 시 모든 자식 FK의 parentColumnId 업데이트
      if (renamedPkColumns.length > 0) {
        renamedPkColumns.forEach(({ oldColumn, newColumn }: any) => {
          // 현재 엔티티가 부모인 관계선들 찾기
          const childEdges = finalEdges.filter(edge => edge.source === nodeId);
          
          childEdges.forEach(edge => {
            const childNode = finalNodes.find(n => n.id === edge.target);
            if (childNode && childNode.type === 'entity') {
              const childColumns = childNode.data.columns || [];
              
              // 해당 부모 컬럼을 참조하는 FK 컬럼들 찾기
              const relatedFkColumns = childColumns.filter((col: any) => 
                col.fk && 
                col.parentEntityId === nodeId && 
                (col.parentColumnId === oldColumn.id || col.parentColumnId === oldColumn.name)
              );
              
              if (relatedFkColumns.length > 0) {
                // FK 컬럼들의 parentColumnId 업데이트
                const updatedChildColumns = childColumns.map((col: any) => {
                  if (relatedFkColumns.some((fkCol: any) => fkCol.id === col.id)) {
                    return { 
                      ...col, 
                      parentColumnId: newColumn.id || newColumn.name,
                      comment: col.comment?.replace(
                        `from ${oldNode.data.label}.${oldColumn.name}`,
                        `from ${oldNode.data.label}.${newColumn.name}`
                      ) || `Foreign key from ${oldNode.data.label}.${newColumn.name}`
                    };
                  }
                  return col;
                });
                
                // 자식 노드 업데이트
                finalNodes = finalNodes.map(node => 
                  node.id === edge.target 
                    ? { ...node, data: { ...node.data, columns: updatedChildColumns } }
                    : node
                );
              }
            }
          });

        });
      }

      // 삭제된 FK 컬럼의 관계선 제거 (복합키 관계 고려)
      if (deletedFkColumns.length > 0) {
        deletedFkColumns.forEach((deletedCol: any) => {
          const parentEntityId = deletedCol.parentEntityId;
          
          // 해당 부모 엔티티와의 관계선 찾기
          const relatedEdge = finalEdges.find(edge => 
            edge.source === parentEntityId && edge.target === nodeId
          );
          
          if (relatedEdge) {
            // 부모 엔티티 정보 가져오기
            const parentNode = state.nodes.find(n => n.id === parentEntityId);
            
            if (parentNode) {
              // 부모의 PK 개수로 복합키 여부 확인
              const parentPkColumns = parentNode.data.columns?.filter((col: any) => col.pk) || [];
              const isCompositeKeyRelation = parentPkColumns.length > 1;
              
              // 복합키/단일키 구분 없이 동일하게 처리: 남은 FK 확인 후 관계 유지 여부 결정
              const remainingFKs = newColumns.filter((col: any) => 
                col.fk && col.parentEntityId === parentEntityId
              );
              
              if (remainingFKs.length === 0) {
                // 모든 FK가 삭제되었을 때만 관계선 제거
                finalEdges = finalEdges.filter(e => e.id !== relatedEdge.id);
      
              }
            }
          }
        });
      }

      // 부모 엔티티의 PK 컬럼 삭제에 따른 하위 계층으로의 연쇄 삭제
      if (deletedPkColumns.length > 0) {
        deletedPkColumns.forEach((deletedPkCol: any) => {
          // PK 컬럼의 현재 상태 정보 구성 (이름 변경된 경우 대응)
          const currentParentColumn = {
            ...deletedPkCol,
            // 현재 finalNodes에서 해당 컬럼의 최신 정보 확인
            currentName: finalNodes.find(n => n.id === nodeId)?.data?.columns?.find((col: any) => col.id === deletedPkCol.id)?.name || deletedPkCol.name
          };
          
          // 재귀적으로 하위 계층까지 전파하여 삭제
          const propagationResult = propagateColumnDeletion(
            nodeId, 
            currentParentColumn, 
            finalNodes, 
            finalEdges
          );
          finalNodes = propagationResult.updatedNodes;
          finalEdges = propagationResult.updatedEdges;
          

        });
                  }



      // FK 컬럼의 PK 상태 변경에 따른 관계 타입 업데이트
      if (fkPkChangedColumns.length > 0) {
        fkPkChangedColumns.forEach((changedCol: any) => {
          const parentEntityId = changedCol.parentEntityId;
          const newCol = newColumns.find((col: any) => col.id === changedCol.id);
          
          if (newCol && parentEntityId) {
            // 해당 부모 엔티티와의 관계선 찾기
            const relatedEdge = finalEdges.find(edge => 
              edge.source === parentEntityId && edge.target === nodeId
            );
            
            if (relatedEdge) {
              // 부모 엔티티 정보 가져오기
              const parentNode = state.nodes.find(n => n.id === parentEntityId);
              
              if (parentNode) {
                // 부모의 PK 개수로 복합키 여부 확인
                const parentPkColumns = parentNode.data.columns?.filter((col: any) => col.pk) || [];
                const isCompositeKeyRelation = parentPkColumns.length > 1;
                
                if (isCompositeKeyRelation) {
                  // 복합키 관계: FK 하나라도 PK 해제되면 모든 관련 FK의 PK 해제 + 비식별자 관계로 변경
                  if (!newCol.pk) {
                    const updatedChildColumns = newColumns.map((col: any) => {
                      if (col.fk && col.parentEntityId === parentEntityId) {
                        return { ...col, pk: false, nn: false };
                      }
                      return col;
                    });
                    
                    finalNodes = finalNodes.map(node => 
                      node.id === nodeId 
                        ? { ...node, data: { ...node.data, columns: updatedChildColumns } }
                        : node
                    );
                    
                    // 관계 타입을 비식별자로 변경
                    let newEdgeType = relatedEdge.type;
                    if (relatedEdge.type === 'one-to-one-identifying') {
                      newEdgeType = 'one-to-one-non-identifying';
                    } else if (relatedEdge.type === 'one-to-many-identifying') {
                      newEdgeType = 'one-to-many-non-identifying';
                    }
                    
                    if (newEdgeType !== relatedEdge.type) {
                      finalEdges = finalEdges.map(edge => 
                        edge.id === relatedEdge.id ? { ...edge, type: newEdgeType } : edge
                      );
                      
    
                    }
                  }
                  // 복합키에서 FK 하나라도 PK 설정되면 모든 관련 FK의 PK 설정 + 식별자 관계로 변경
                  else if (newCol.pk) {
                    const updatedChildColumns = newColumns.map((col: any) => {
                      if (col.fk && col.parentEntityId === parentEntityId) {
                        return { ...col, pk: true, nn: true };
                      }
                      return col;
                    });
                    
                    finalNodes = finalNodes.map(node => 
                      node.id === nodeId 
                        ? { ...node, data: { ...node.data, columns: updatedChildColumns } }
                        : node
                    );
                    
                    // 관계 타입을 식별자로 변경
                    let newEdgeType = relatedEdge.type;
                    if (relatedEdge.type === 'one-to-one-non-identifying') {
                      newEdgeType = 'one-to-one-identifying';
                    } else if (relatedEdge.type === 'one-to-many-non-identifying') {
                      newEdgeType = 'one-to-many-identifying';
                    }
                    
                    if (newEdgeType !== relatedEdge.type) {
                      finalEdges = finalEdges.map(edge => 
                        edge.id === relatedEdge.id ? { ...edge, type: newEdgeType } : edge
                      );
                      
    
                    }
                  }
                } else {
                  // 단일키 관계: 일반적인 관계 타입 변경
                  let newEdgeType = relatedEdge.type;
                  
                  if (newCol.pk === true) {
                    // PK 설정 시 비식별자 → 식별자
                    if (relatedEdge.type === 'one-to-one-non-identifying') {
                      newEdgeType = 'one-to-one-identifying';
                    } else if (relatedEdge.type === 'one-to-many-non-identifying') {
                      newEdgeType = 'one-to-many-identifying';
                    }
                  } else {
                    // PK 해제 시 식별자 → 비식별자
                    if (relatedEdge.type === 'one-to-one-identifying') {
                      newEdgeType = 'one-to-one-non-identifying';
                    } else if (relatedEdge.type === 'one-to-many-identifying') {
                      newEdgeType = 'one-to-many-non-identifying';
                    }
                  }
                  
                  if (newEdgeType !== relatedEdge.type) {
                    finalEdges = finalEdges.map(edge => 
                      edge.id === relatedEdge.id ? { ...edge, type: newEdgeType } : edge
                    );
                    
                    const relationshipType = newCol.pk ? '식별자' : '비식별자';
      
                  }
                }
              }
            }
          }
        });
      }

      return { nodes: finalNodes, edges: finalEdges };
    });
    
    // 에지 핸들 업데이트 (관계선 위치 및 연결 상태 갱신) - 즉시 실행
    get().updateEdgeHandles();
    
    // 노드 데이터 변경 시 자동 저장 (디바운싱 적용)
    debounceAutoSave(() => {
      get().saveToLocalStorage(false); // 자동 저장 시 토스트 없음
    }, 1000); // 1초 후 저장
  },
  
  // 기존 edges의 Handle을 올바르게 업데이트하는 함수 (문제 5 해결)
  updateEdgeHandles: () => {
    set((state) => {
      if (state.edges.length === 0) {
        return state; // edges가 없으면 아무것도 하지 않음
      }
      
      const updatedEdges = state.edges.map(edge => {
        const sourceNode = state.nodes.find(node => node.id === edge.source);
        const targetNode = state.nodes.find(node => node.id === edge.target);
        
        if (!sourceNode || !targetNode) return edge;
        
        // 부모 엔티티의 첫 번째 PK 컬럼 찾기
        const sourcePkColumn = sourceNode.data.columns?.find((col: any) => col.pk);
        
        // 자식 엔티티의 FK 컬럼 찾기 - parentEntityId 기준으로 해당 관계의 FK들 중 첫 번째
        const relatedFkColumns = targetNode.data.columns?.filter((col: any) => 
          col.fk && col.parentEntityId === sourceNode.id
        ) || [];
        
        // 복합키 관계에서 FK가 삭제된 경우에도 남은 FK들 중 첫 번째를 기준으로 Handle 위치 설정
        // UI에서 보이는 순서상 가장 위에 있는 (인덱스가 가장 작은) FK 컬럼을 선택
        let targetFkColumn: any = null;
        if (relatedFkColumns.length > 0) {
          const allColumns = targetNode.data.columns || [];
          let earliestIndex = allColumns.length;
          
          relatedFkColumns.forEach((fkCol: any) => {
            const index = allColumns.findIndex((col: any) => col.id === fkCol.id);
            if (index !== -1 && index < earliestIndex) {
              earliestIndex = index;
              targetFkColumn = fkCol;
            }
          });
        }
        
        // 새로운 handle 결정 로직 사용
        const { sourceHandle, targetHandle } = determineHandlePositions(sourceNode, targetNode);
        
        // Handle ID 설정 - 남은 FK 컬럼들 중 첫 번째를 기준으로 계산
        const sourceHandleId = sourcePkColumn 
          ? createHandleId(sourcePkColumn.name, sourceHandle as 'left' | 'right')
          : sourceHandle;
          
        const targetHandleId = targetFkColumn
          ? createHandleId(targetFkColumn.name, targetHandle as 'left' | 'right')
          : targetHandle;
        
        // 항상 업데이트 (조건 제거)
        return {
          ...edge,
          sourceHandle: sourceHandleId,
          targetHandle: targetHandleId
        };
      });
      
      return { ...state, edges: updatedEdges };
    });
  },
  
  clearAllEdges: () => {
    set({ edges: [] });
    toast.info('모든 관계가 삭제되었습니다. 새로운 관계를 생성해주세요.');
  },
  
  // 색상 팔레트 함수들
  showPalette: (target: { type: 'node' | 'edge' | 'comment'; id: string }, position: { x: number; y: number }) => {
    set({ 
      showColorPalette: true, 
      paletteTarget: target, 
      palettePosition: position 
    });
  },
  
  hidePalette: () => {
    set((state) => ({ 
      showColorPalette: false, 
      paletteTarget: null,
      // 엣지 관련 팔레트를 닫을 때만 선택 상태도 해제
      selectedEdgeId: state.paletteTarget?.type === 'edge' ? null : state.selectedEdgeId
    }));
  },
  
  setNodeColor: (nodeId: string, color: string) => {
    set((state) => {
      const newNodeColors = new Map(state.nodeColors);
      newNodeColors.set(nodeId, color);
      return { nodeColors: newNodeColors };
    });
    // 색상 변경 시 localStorage에 자동 저장
    setTimeout(() => {
      get().saveToLocalStorage(false);
    }, 100);
  },
  
  setEdgeColor: (edgeId: string, color: string) => {
    set((state) => {
      const newEdgeColors = new Map(state.edgeColors);
      newEdgeColors.set(edgeId, color);
      return { edgeColors: newEdgeColors };
    });
    // 색상 변경 시 localStorage에 자동 저장
    setTimeout(() => {
      get().saveToLocalStorage(false);
    }, 100);
  },
  
  setCommentColor: (commentId: string, color: string) => {
    set((state) => {
      const newCommentColors = new Map(state.commentColors);
      newCommentColors.set(commentId, color);
      return { commentColors: newCommentColors };
    });
    // 색상 변경 시 localStorage에 자동 저장
    setTimeout(() => {
      get().saveToLocalStorage(false);
    }, 100);
  },
  
  getNodeColor: (nodeId: string) => {
    const previewColor = get().previewNodeColor;
    if (previewColor && previewColor.nodeId === nodeId) {
      return previewColor.color;
    }
    const actualColor = get().nodeColors.get(nodeId) || '#4ECDC4';
    return actualColor;
  },
  
  getEdgeColor: (edgeId: string) => {
    return get().edgeColors.get(edgeId) || '#4a90e2'; // 기본 색상
  },
  
  getCommentColor: (commentId: string) => {
    return get().commentColors.get(commentId) || '#fbbf24'; // 기본 노란색
  },
  
  // 미리보기 색상 관련
  setPreviewNodeColor: (nodeId: string, color: string) => {
    set({ previewNodeColor: { nodeId, color } });
  },
  
  clearPreviewNodeColor: () => {
    set({ previewNodeColor: null });
  },
  
  // 자동 배치 함수들
  arrangeLeftRight: () => {
    set((state) => {
      const entityNodes = state.nodes.filter(node => node.type === 'entity');
      if (entityNodes.length === 0) return state;
      
      // 위상 정렬을 위한 그래프 구조 생성
      const inDegree = new Map<string, number>();
      const adjacencyList = new Map<string, string[]>();
      
      // 모든 엔티티 노드 초기화
      entityNodes.forEach(node => {
        inDegree.set(node.id, 0);
        adjacencyList.set(node.id, []);
      });
      
      // 관계선을 기반으로 그래프 구성 (부모 -> 자식)
      state.edges.forEach(edge => {
        // 셀프 관계는 위상 정렬에서 제외 (자기 자신을 참조하므로 계층에 영향을 주지 않음)
        if (edge.source !== edge.target && adjacencyList.has(edge.source) && inDegree.has(edge.target)) {
          adjacencyList.get(edge.source)!.push(edge.target);
          inDegree.set(edge.target, inDegree.get(edge.target)! + 1);
        }
      });
      
      // 위상 정렬 (Kahn's algorithm)
      const queue = entityNodes.filter(node => inDegree.get(node.id) === 0);
      const sortedLevels: string[][] = [];
      const visited = new Set<string>();
      
      while (queue.length > 0) {
        const currentLevel = [...queue];
        queue.length = 0;
        sortedLevels.push(currentLevel.map(node => node.id));
        
        currentLevel.forEach(node => {
          visited.add(node.id);
          const neighbors = adjacencyList.get(node.id) || [];
          neighbors.forEach(neighbor => {
            if (!visited.has(neighbor)) {
              const newInDegree = inDegree.get(neighbor)! - 1;
              inDegree.set(neighbor, newInDegree);
              if (newInDegree === 0) {
                const neighborNode = entityNodes.find(n => n.id === neighbor);
                if (neighborNode) queue.push(neighborNode);
              }
            }
          });
        });
      }
      
      // 연결되지 않은 노드들 처리
      const unconnectedNodes = entityNodes.filter(node => !visited.has(node.id));
      if (unconnectedNodes.length > 0) {
        sortedLevels.push(unconnectedNodes.map(node => node.id));
      }
      
      // 레벨별로 좌우 배치 - 동적 크기 계산
      const START_X = 100;
      const START_Y = 100;
      
      // 각 레벨별 최대 너비 계산
      const levelMaxWidths: number[] = [];
      sortedLevels.forEach((level, levelIndex) => {
        let levelMaxWidth = 280; // 기본 최소 너비
        
        level.forEach(nodeId => {
          const node = entityNodes.find(n => n.id === nodeId);
          if (node) {
            // 엔티티 이름 길이에 따른 동적 너비 계산
            const physicalNameLength = (node.data.physicalName || node.data.label || '').length;
            const logicalNameLength = (node.data.logicalName || '').length;
            const maxNameLength = Math.max(physicalNameLength, logicalNameLength);
            const columnCount = (node.data.columns || []).length;
            
            // 컬럼들의 최대 텍스트 길이 계산
            let maxColumnTextLength = 0;
            if (node.data.columns) {
              node.data.columns.forEach((col: any) => {
                const nameLength = (col.name || '').length;
                const typeLength = (col.dataType || col.type || '').length;
                const combinedLength = nameLength + typeLength + 10; // 여백 고려
                maxColumnTextLength = Math.max(maxColumnTextLength, combinedLength);
              });
            }
            
            // 실제 필요한 너비 계산: 엔티티명, 컬럼명, 최소값 고려 + 여유분 추가
            const nameBasedWidth = maxNameLength * 12; // 글자당 12px로 증가
            const columnBasedWidth = maxColumnTextLength * 10; // 컬럼 텍스트당 10px로 증가  
            const minWidth = 320; // 최소 너비 증가 (280 -> 320)
            const maxWidthLimit = 700; // 최대 너비 증가 (600 -> 700)
            
            const dynamicWidth = Math.max(minWidth, nameBasedWidth, columnBasedWidth);
            const finalWidth = Math.min(dynamicWidth, maxWidthLimit) + 50; // 추가 여유분 50px
            
            // 이 레벨의 최대 너비 업데이트
            levelMaxWidth = Math.max(levelMaxWidth, finalWidth);
          }
        });
        
        levelMaxWidths[levelIndex] = Math.max(levelMaxWidth, 320); // 최소 320px 보장
      });
      
      // 각 레벨별 높이 계산
      const levelHeights: number[] = [];
      sortedLevels.forEach((level, levelIndex) => {
        let maxHeight = 0;
        level.forEach(nodeId => {
          const node = entityNodes.find(n => n.id === nodeId);
          if (node) {
            const columnCount = (node.data.columns || []).length;
            // 기본 60px + 컬럼당 35px
            const dynamicHeight = 60 + columnCount * 35;
            maxHeight = Math.max(maxHeight, dynamicHeight);
          }
        });
        levelHeights[levelIndex] = maxHeight || 120;
      });
      
      // 동적 간격 계산 - 엔티티 크기에 비례
      const avgEntityWidth = levelMaxWidths.reduce((a, b) => a + b, 0) / levelMaxWidths.length || 320;
      const avgEntityHeight = levelHeights.reduce((a, b) => a + b, 0) / levelHeights.length || 120;
      const MIN_HORIZONTAL_SPACING = Math.max(150, avgEntityWidth * 0.3); // 엔티티 평균 너비의 30%
      const MIN_VERTICAL_SPACING = Math.max(100, avgEntityHeight * 0.4); // 엔티티 평균 높이의 40%
      
      const updatedNodes = state.nodes.map(node => {
        if (node.type !== 'entity') return node;
        
        let levelIndex = -1;
        let nodeIndex = -1;
        
        for (let i = 0; i < sortedLevels.length; i++) {
          nodeIndex = sortedLevels[i].indexOf(node.id);
          if (nodeIndex !== -1) {
            levelIndex = i;
            break;
          }
        }
        
        if (levelIndex === -1) return node;
        
        // X 좌표 계산 (각 레벨의 최대 너비 + 간격)
        let x = START_X;
        for (let i = 0; i < levelIndex; i++) {
          x += levelMaxWidths[i] + MIN_HORIZONTAL_SPACING;
        }
        
        // Y 좌표 계산 (해당 레벨의 높이 + 간격)
        const y = START_Y + nodeIndex * (levelHeights[levelIndex] + MIN_VERTICAL_SPACING);
        
        return { ...node, position: { x, y } };
      });
      
      // 엔티티 배치 후 관계선 방향 업데이트
      setTimeout(() => {
        get().updateEdgeHandles();
      }, 50);
      
      return { nodes: updatedNodes };
    });
  },
  
  arrangeSnowflake: () => {
    set((state) => {
      const entityNodes = state.nodes.filter(node => node.type === 'entity');
      if (entityNodes.length === 0) return state;
      
      // 각 노드의 연결 수 계산
      const connectionCount = new Map<string, number>();
      entityNodes.forEach(node => connectionCount.set(node.id, 0));
      
      state.edges.forEach(edge => {
        connectionCount.set(edge.source, (connectionCount.get(edge.source) || 0) + 1);
        connectionCount.set(edge.target, (connectionCount.get(edge.target) || 0) + 1);
      });
      
      // 연결 수에 따라 정렬
      const sortedByConnections = [...entityNodes].sort((a, b) => 
        (connectionCount.get(b.id) || 0) - (connectionCount.get(a.id) || 0)
      );
      
      const CENTER_X = 500;
      const CENTER_Y = 400;
      
      const updatedNodes = state.nodes.map(node => {
        if (node.type !== 'entity') return node;
        
        const nodeIndex = sortedByConnections.findIndex(n => n.id === node.id);
        if (nodeIndex === -1) return node;
        
        if (nodeIndex === 0) {
          // 가장 연결이 많은 노드를 중심에 배치
          return { ...node, position: { x: CENTER_X, y: CENTER_Y } };
        } else {
          // 나머지는 원형으로 배치 - 동적 반지름 계산
          const angle = (2 * Math.PI * (nodeIndex - 1)) / (sortedByConnections.length - 1);
          
          // 엔티티 크기에 따른 동적 반지름 대폭 증가
          const baseRadius = 400; // 기본 반지름 증가 (300 -> 400)
          const entitySize = node.data.columns?.length || 0;
          const radiusIncrement = Math.floor((nodeIndex - 1) / 6) * 300; // 증가량도 증가 (200 -> 300)
          const sizeMultiplier = Math.max(1.5, entitySize / 4); // 최소 배수 증가 (1 -> 1.5, 5 -> 4)
          
          const radius = baseRadius * sizeMultiplier + radiusIncrement;
          const x = CENTER_X + radius * Math.cos(angle);
          const y = CENTER_Y + radius * Math.sin(angle);
          
          return { ...node, position: { x, y } };
        }
      });
      
      // 엔티티 배치 후 관계선 방향 업데이트
      setTimeout(() => {
        get().updateEdgeHandles();
      }, 50);
      
      return { nodes: updatedNodes };
    });
  },
  
  arrangeCompact: () => {
    set((state) => {
      const entityNodes = state.nodes.filter(node => node.type === 'entity');
      if (entityNodes.length === 0) return state;
      
      // 격자 형태로 배치 - 동적 크기 계산
      const COLS = Math.ceil(Math.sqrt(entityNodes.length));
      const START_X = 100;
      const START_Y = 100;
      
      // 모든 엔티티의 최대 크기 계산
      let maxEntityWidth = 280;
      let maxEntityHeight = 120;
      
      entityNodes.forEach(node => {
        // 너비 계산
        const physicalNameLength = (node.data.physicalName || node.data.label || '').length;
        const logicalNameLength = (node.data.logicalName || '').length;
        const maxNameLength = Math.max(physicalNameLength, logicalNameLength);
        const columnCount = (node.data.columns || []).length;
        
        let maxColumnTextLength = 0;
        if (node.data.columns) {
          node.data.columns.forEach((col: any) => {
            const nameLength = (col.name || '').length;
            const typeLength = (col.dataType || col.type || '').length;
            const combinedLength = nameLength + typeLength + 10;
            maxColumnTextLength = Math.max(maxColumnTextLength, combinedLength);
          });
        }
        
        const nameBasedWidth = maxNameLength * 12; // 증가
        const columnBasedWidth = maxColumnTextLength * 10; // 증가
        const entityWidth = Math.max(320, nameBasedWidth, columnBasedWidth); // 최소값 증가
        
        // 높이 계산
        const entityHeight = 80 + columnCount * 40; // 기본 높이와 컬럼당 높이 증가
        
        maxEntityWidth = Math.max(maxEntityWidth, Math.min(entityWidth + 50, 750)); // 여유분과 최대값 증가
        maxEntityHeight = Math.max(maxEntityHeight, entityHeight);
      });
      
      // 동적 간격 계산 - 엔티티 크기에 비례
      const MIN_SPACING = Math.max(120, maxEntityWidth * 0.25, maxEntityHeight * 0.3); // 엔티티 크기의 25%/30%
      
      const CELL_WIDTH = maxEntityWidth + MIN_SPACING;
      const CELL_HEIGHT = maxEntityHeight + MIN_SPACING;
      
      // 각 엔티티의 실제 크기 계산
      const entitySizes = entityNodes.map(node => {
        const physicalNameLength = (node.data.physicalName || node.data.label || '').length;
        const logicalNameLength = (node.data.logicalName || '').length;
        const maxNameLength = Math.max(physicalNameLength, logicalNameLength);
        const columnCount = (node.data.columns || []).length;
        
        // 컬럼들의 최대 텍스트 길이 계산
        let maxColumnTextLength = 0;
        if (node.data.columns) {
          node.data.columns.forEach((col: any) => {
            const nameLength = (col.name || '').length;
            const typeLength = (col.dataType || col.type || '').length;
            const combinedLength = nameLength + typeLength + 10;
            maxColumnTextLength = Math.max(maxColumnTextLength, combinedLength);
          });
        }
        
        const nameBasedWidth = maxNameLength * 12;
        const columnBasedWidth = maxColumnTextLength * 10;
        const width = Math.max(320, nameBasedWidth, columnBasedWidth);
        const height = 80 + columnCount * 40;
        
        return { 
          nodeId: node.id, 
          width: Math.min(width + 50, 750), // 여유분과 최대값 증가
          height 
        };
      });
      
      // 행별 최대 높이 계산
      const rowHeights: number[] = [];
      for (let row = 0; row < Math.ceil(entityNodes.length / COLS); row++) {
        let maxHeight = 0;
        for (let col = 0; col < COLS; col++) {
          const nodeIndex = row * COLS + col;
          if (nodeIndex < entitySizes.length) {
            maxHeight = Math.max(maxHeight, entitySizes[nodeIndex].height);
          }
        }
        rowHeights[row] = maxHeight;
      }
      
      // 열별 최대 너비 계산
      const colWidths: number[] = [];
      for (let col = 0; col < COLS; col++) {
        let maxWidth = 0;
        for (let row = 0; row < Math.ceil(entityNodes.length / COLS); row++) {
          const nodeIndex = row * COLS + col;
          if (nodeIndex < entitySizes.length) {
            maxWidth = Math.max(maxWidth, entitySizes[nodeIndex].width);
          }
        }
        colWidths[col] = maxWidth;
      }
      
      const updatedNodes = state.nodes.map(node => {
        if (node.type !== 'entity') return node;
        
        const nodeIndex = entityNodes.findIndex(n => n.id === node.id);
        if (nodeIndex === -1) return node;
        
        const row = Math.floor(nodeIndex / COLS);
        const col = nodeIndex % COLS;
        
        // X 좌표 계산 (각 열의 최대 너비 + 간격)
        let x = START_X;
        for (let i = 0; i < col; i++) {
          x += colWidths[i] + MIN_SPACING;
        }
        
        // Y 좌표 계산 (각 행의 최대 높이 + 간격)
        let y = START_Y;
        for (let i = 0; i < row; i++) {
          y += rowHeights[i] + MIN_SPACING;
        }
        
        return { ...node, position: { x, y } };
      });
      
      // 엔티티 배치 후 관계선 방향 업데이트
      setTimeout(() => {
        get().updateEdgeHandles();
      }, 50);
      
      return { nodes: updatedNodes };
    });
  },
  
  // localStorage 관련 함수들
  saveToLocalStorage: (showToast = true) => {
    try {
      const state = get();
      
      // 현재 ReactFlow의 실제 viewport를 가져와서 사용
      let currentViewport = state.viewport;
      if ((window as any).reactFlowInstance) {
        try {
          const realViewport = (window as any).reactFlowInstance.getViewport();
          currentViewport = {
            x: typeof realViewport.x === 'number' && !isNaN(realViewport.x) ? realViewport.x : 0,
            y: typeof realViewport.y === 'number' && !isNaN(realViewport.y) ? realViewport.y : 0,
            zoom: typeof realViewport.zoom === 'number' && !isNaN(realViewport.zoom) ? realViewport.zoom : 1
          };
        } catch (error) {
        }
      }
      
      const dataToSave: SavedData = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        nodes: state.nodes,
        edges: state.edges,
        nodeColors: Object.fromEntries(state.nodeColors),
        edgeColors: Object.fromEntries(state.edgeColors),
        commentColors: Object.fromEntries(state.commentColors),
        viewSettings: state.viewSettings,
        theme: state.theme,
        showGrid: state.showGrid,
        hiddenEntities: Array.from(state.hiddenEntities),
        viewport: currentViewport,
        viewportRestoreTrigger: state.viewportRestoreTrigger,
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      
      // showToast가 true일 때만 토스트 메시지 표시
      if (showToast) {
        toast.success('ERD 데이터가 성공적으로 저장되었습니다!');
      }
    } catch (error) {
      if (showToast) {
        toast.error('데이터 저장에 실패했습니다.');
      }
    }
  },
  
  loadFromLocalStorage: () => {
    // 이미 로딩 중이면 중복 실행 방지
    if (get().isLoading) {
      return;
    }
    
    try {
      // 로딩 시작
      set({ isLoading: true, loadingMessage: '저장된 ERD 데이터 검색 중...', loadingProgress: 10 });
      
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (!savedData) {
        set({ isLoading: false, loadingMessage: '', loadingProgress: 0 });
        toast.info('저장된 데이터가 없습니다.');
        return;
      }
      
      set({ loadingMessage: '데이터 파싱 및 검증 중...', loadingProgress: 25 });
      const data: SavedData = JSON.parse(savedData);
      
      // 버전 호환성 체크
      if (data.version !== STORAGE_VERSION) {
        toast.warn('저장된 데이터의 버전이 다릅니다. 일부 기능이 정상적으로 작동하지 않을 수 있습니다.');
      }
      
      set({ loadingMessage: '엔티티 및 관계선 복원 중...', loadingProgress: 45 });
      
      setTimeout(() => {
        set({ loadingMessage: '캔버스 위치 및 설정 복원 중...', loadingProgress: 65 });
      }, 300);
      
      set({
        nodes: data.nodes || [],
        edges: data.edges || [],
        nodeColors: new Map(Object.entries(data.nodeColors || {})),
        edgeColors: new Map(Object.entries(data.edgeColors || {})),
        commentColors: new Map(Object.entries(data.commentColors || {})),
        viewSettings: data.viewSettings || {
          entityView: 'logical',
          showKeys: true,
          showPhysicalName: true,
          showLogicalName: false,
          showDataType: true,
          showConstraints: false,
          showDefaults: false,
        },
        theme: data.theme || 'light',
        showGrid: data.showGrid ?? false,
        hiddenEntities: new Set(data.hiddenEntities || []),
        viewport: data.viewport && typeof data.viewport === 'object' ? {
          x: typeof data.viewport.x === 'number' && !isNaN(data.viewport.x) ? data.viewport.x : 0,
          y: typeof data.viewport.y === 'number' && !isNaN(data.viewport.y) ? data.viewport.y : 0,
          zoom: typeof data.viewport.zoom === 'number' && !isNaN(data.viewport.zoom) ? data.viewport.zoom : 1
        } : { x: 0, y: 0, zoom: 1 },
        viewportRestoreTrigger: (get().viewportRestoreTrigger || 0) + 1, // 트리거 증가
      });
      
      
      // 마지막 단계 메시지
      setTimeout(() => {
        set({ loadingMessage: '최종 렌더링 완료 중...', loadingProgress: 85 });
      }, 800);
      
      // 로딩 완료 처리를 지연시켜서 viewport 복원이 완료되고 추가 안정화 시간 확보
      setTimeout(() => {
        set({ isLoading: false, loadingMessage: '', loadingProgress: 100 });
        toast.success('ERD 데이터를 성공적으로 불러왔습니다!');
      }, 1800); // 1.8초 후 로딩 완료 (0.3초 추가)
    } catch (error) {
      set({ isLoading: false, loadingMessage: '', loadingProgress: 0 });
      toast.error('데이터 불러오기에 실패했습니다.');
    }
  },
  
  // 로딩 관련 함수들
  setLoading: (loading: boolean, message: string = '') => {
    set({ isLoading: loading, loadingMessage: message, loadingProgress: loading ? 0 : 100 });
  },
  
  setLoadingProgress: (progress: number, message?: string) => {
    const update: any = { loadingProgress: progress };
    if (message) update.loadingMessage = message;
    set(update);
  },
  
  // 페이지 진입 시 자동 로딩 체크
  checkAndAutoLoad: () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        // 저장된 데이터가 있으면 자동으로 불러오기
        get().loadFromLocalStorage();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  },
  
  clearLocalStorage: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      
      // 상태를 초기 상태로 리셋
      set({
        nodes: [],
        edges: [],
        nodeColors: new Map(),
        edgeColors: new Map(),
        commentColors: new Map(),
        viewSettings: {
          entityView: 'logical',
          showKeys: true,
          showPhysicalName: true,
          showLogicalName: false,
          showDataType: true,
          showConstraints: false,
          showDefaults: false,
        },
        theme: 'light',
        showGrid: false,
        hiddenEntities: new Set(),
        viewport: { x: 0, y: 0, zoom: 1 },
        viewportRestoreTrigger: 0,
        selectedNodeId: null,
        selectedEdgeId: null,
        hoveredEdgeId: null,
        hoveredEntityId: null,
        highlightedEntities: [],
        highlightedEdges: [],
        highlightedColumns: new Map(),
        isBottomPanelOpen: false,
        connectionMode: null,
        connectingNodeId: null,
        createMode: null,
        selectMode: true,
        isLoading: false,
        loadingMessage: '',
        loadingProgress: 0,
        showColorPalette: false,
        palettePosition: { x: 0, y: 0 },
        paletteTarget: null,
        previewNodeColor: null,
        isDragging: false,
        draggingNodeId: null,
        snapGuides: [],
        searchActive: false,
        relationsHighlight: false,
        showAlignPopup: false,
        showViewPopup: false,
        isSearchPanelOpen: false,
        searchQuery: '',
        selectedSearchEntity: null,
      });
      
      toast.success('저장된 데이터가 삭제되고 초기 상태로 리셋되었습니다.');
    } catch (error) {
      toast.error('데이터 삭제에 실패했습니다.');
    }
  },
  
  // viewport 관련 함수들
  setViewport: (viewport: Viewport) => {
    // viewport 값의 유효성 검증
    const validViewport = {
      x: typeof viewport.x === 'number' && !isNaN(viewport.x) ? viewport.x : 0,
      y: typeof viewport.y === 'number' && !isNaN(viewport.y) ? viewport.y : 0,
      zoom: typeof viewport.zoom === 'number' && !isNaN(viewport.zoom) ? viewport.zoom : 1
    };
    set({ viewport: validViewport });
  },
  
  updateViewport: (viewport: Viewport) => {
    // viewport 값의 유효성 검증
    const validViewport = {
      x: typeof viewport.x === 'number' && !isNaN(viewport.x) ? viewport.x : 0,
      y: typeof viewport.y === 'number' && !isNaN(viewport.y) ? viewport.y : 0,
      zoom: typeof viewport.zoom === 'number' && !isNaN(viewport.zoom) ? viewport.zoom : 1
    };
    
    set({ viewport: validViewport });
    // viewport 변경 시 자동 저장 (디바운싱 적용)
    debounceAutoSave(() => {
      get().saveToLocalStorage(false);
    }, 3000); // 3초 후 저장
  },
  
  // SQL import 함수
  importFromSQL: (sqlContent: string) => {
    try {
      // SQL 파싱 로직 구현
      const tables = parseSQLTables(sqlContent);
      
      if (tables.length === 0) {
        toast.error('유효한 CREATE TABLE 문을 찾을 수 없습니다.');
        return;
      }
      
      // 기존 엔티티가 있는지 확인
      const existingNodes = get().nodes.filter(node => node.type === 'entity');
      
      if (existingNodes.length > 0) {
        // 경고창 표시 (실제 구현에서는 모달 컴포넌트 사용)
        const confirmed = window.confirm('기존 엔티티가 있습니다. 모든 엔티티를 삭제하고 새로 불러오시겠습니까?');
        if (!confirmed) return;
      }
      
      // 새로운 노드 생성
      const newNodes = tables.map((table: ParsedTable, index: number) => ({
        id: `entity-${Date.now()}-${index}`,
        type: 'entity',
        position: { x: index * 300, y: index * 200 },
        data: {
          label: table.name,
          columns: table.columns,
          logicalName: table.logicalName || table.name
        }
      }));
      
      // 노드 설정
      set({ nodes: newNodes, edges: [] });
      
      // compact 정렬 후 zoom to fit
      setTimeout(() => {
        get().arrangeCompact();
        // zoom to fit은 Canvas에서 처리
      }, 100);
      
      toast.success(`${tables.length}개의 테이블을 성공적으로 불러왔습니다.`);
      
    } catch (error) {
      toast.error('SQL 파일 파싱 중 오류가 발생했습니다.');
      console.error('SQL import error:', error);
    }
  },
}));

// 스토어 초기화 시 localStorage에서 데이터 로드
const initializeStore = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const data: SavedData = JSON.parse(savedData);
      
      // 초기 상태 업데이트
      useStore.setState({
        nodes: data.nodes || [], // 기본값을 빈 배열로 변경
        edges: data.edges || [],
        nodeColors: new Map(Object.entries(data.nodeColors || {})),
        edgeColors: new Map(Object.entries(data.edgeColors || {})),
        commentColors: new Map(Object.entries(data.commentColors || {})),
        viewSettings: data.viewSettings || useStore.getState().viewSettings,
        theme: data.theme || 'light',
        showGrid: data.showGrid ?? false,
        hiddenEntities: new Set(data.hiddenEntities || []),
        viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
      });
    }
  } catch (error) {
  }
};

// 스토어 생성 후 즉시 초기화
setTimeout(initializeStore, 0);

export default useStore;
