import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges, addEdge, Connection, NodeChange, MarkerType } from 'reactflow';
import { toast } from 'react-toastify';
import { createHandleId } from '../utils/handleUtils';

type SnapGuide = {
  type: 'vertical' | 'horizontal';
  position: number;
  color: string;
  priority?: number;
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
  
  // 뷰 설정
  viewSettings: ViewSettings;
  
  // 테마 설정
  theme: Theme;
  
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
};

const useStore = create<RFState>((set, get) => ({
  nodes: [
    {
      id: '1',
      type: 'entity',
      position: { x: 100, y: 100 },
      data: {
        label: 'User',
        comment: '사용자 정보 테이블',
        columns: [
          { 
            name: 'id', 
            type: 'INT', 
            pk: true, 
            fk: false, 
            uq: false,
            ai: false,
            comment: '사용자 고유 ID',
            logicalName: '사용자ID',
            constraint: null,
            defaultValue: null,
            options: 'PRIMARY KEY'
          },
          { 
            name: 'username', 
            type: 'VARCHAR(50)', 
            pk: false, 
            fk: false, 
            uq: true, 
            comment: '사용자명',
            logicalName: '사용자명',
            constraint: 'UNIQUE',
            defaultValue: null,
            options: 'NOT NULL'
          },
          { 
            name: 'email', 
            type: 'VARCHAR(100)', 
            pk: false, 
            fk: false, 
            uq: false, 
            comment: '이메일 주소',
            logicalName: '이메일',
            constraint: null,
            defaultValue: null,
            options: 'NOT NULL'
          },
        ],
      },
    },
    {
      id: '2',
      type: 'entity',
      position: { x: 400, y: 100 },
      data: {
        label: 'Post',
        comment: '게시글 테이블',
        columns: [
          { 
            name: 'id', 
            type: 'INT', 
            pk: true, 
            fk: false, 
            uq: false,
            ai: false,
            comment: '게시글 고유 ID',
            logicalName: '게시글ID',
            constraint: null,
            defaultValue: null,
            options: 'PRIMARY KEY'
          },
          { 
            name: 'title', 
            type: 'VARCHAR(255)', 
            pk: false, 
            fk: false, 
            uq: false, 
            comment: '게시글 제목',
            logicalName: '제목',
            constraint: null,
            defaultValue: null,
            options: 'NOT NULL'
          },
          { 
            name: 'content', 
            type: 'TEXT', 
            pk: false, 
            fk: false, 
            uq: false, 
            comment: '게시글 내용',
            logicalName: '내용',
            constraint: null,
            defaultValue: "'내용을 입력하세요'",
            options: null
          },
        ],
      },
    },
  ],
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
            const sourceX = sourceNode.position.x + (sourceNode.width || 200) / 2;
            const targetX = targetNode.position.x + (targetNode.width || 200) / 2;
            
            return {
              ...edge,
              sourceHandle: sourceX <= targetX ? 'right' : 'left',
              targetHandle: sourceX <= targetX ? 'left' : 'right',
            };
          }
          return edge;
        });
        
        // nodes와 edges를 한 번에 업데이트
        return { nodes: newNodes, edges: updatedEdges };
      }
      
      return { nodes: newNodes };
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
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
        // 현재 엔티티가 부모인 경우 - 본인의 PK 컬럼들 하이라이트
        relatedEntityIds.add(edge.target);
        
        // 자식 엔티티의 FK 컬럼들 찾기
        const targetEntity = state.nodes.find(n => n.id === edge.target);
        if (targetEntity) {
          const sourceLabel = currentEntity.data.label.toLowerCase();
          const fkColumns = targetEntity.data.columns?.filter((col: any) => 
            col.fk && col.name.startsWith(`${sourceLabel}_`)
          ).map((col: any) => col.name) || [];
          if (fkColumns.length > 0) {
            highlightedColumns.set(edge.target, fkColumns);
          }
        }
        
        // 본인의 PK 컬럼들 추가
        const pkColumns = currentEntity.data.columns?.filter((col: any) => col.pk)
          .map((col: any) => col.name) || [];
        currentEntityColumns.push(...pkColumns);
        
      } else {
        // 현재 엔티티가 자식인 경우 - 본인의 FK 컬럼들 하이라이트
        relatedEntityIds.add(edge.source);
        
        // 부모 엔티티의 PK 컬럼들 찾기
        const sourceEntity = state.nodes.find(n => n.id === edge.source);
        if (sourceEntity) {
          const pkColumns = sourceEntity.data.columns?.filter((col: any) => col.pk)
            .map((col: any) => col.name) || [];
          if (pkColumns.length > 0) {
            highlightedColumns.set(edge.source, pkColumns);
          }
          
          // 본인의 FK 컬럼들 추가
          const sourceLabel = sourceEntity.data.label.toLowerCase();
          const fkColumns = currentEntity.data.columns?.filter((col: any) => 
            col.fk && col.name.startsWith(`${sourceLabel}_`)
          ).map((col: any) => col.name) || [];
          currentEntityColumns.push(...fkColumns);
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
    const activeEntityId = state.selectedNodeId || state.hoveredEntityId;
    get().updateEntityHighlights(activeEntityId);
  },
  clearAllHighlights: () => set({ 
    highlightedEntities: [], 
    highlightedEdges: [], 
    highlightedColumns: new Map(),
    hoveredEntityId: null
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
            toast.info(`${nodeToDelete.data.label} 삭제로 인해 ${state.nodes.find(n => n.id === childNodeId)?.data.label}에서 관련 FK가 제거되었습니다.`);
          }
        });

        // 3. 관련 관계선들 제거
        const updatedEdges = state.edges.filter(edge => 
          edge.source !== id && edge.target !== id
        );

        toast.info(`엔티티 ${nodeToDelete.data.label}이 삭제되었습니다.`);

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
            // 부모 엔티티의 모든 PK에 대응하는 FK 제거
            const sourcePks = sourceNode.data.columns?.filter((col: any) => col.pk) || [];
            let filteredColumns = [...(node.data.columns || [])];
            
            sourcePks.forEach((pk: any) => {
              const fkName = `${sourceNode.data.label.toLowerCase()}_${pk.name}`;
              filteredColumns = filteredColumns.filter(col => col.name !== fkName);
            });

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

      // 순환참조 체크: 이미 반대 방향으로 관계가 있는지 확인
      const existingReverseEdge = state.edges.find(edge => 
        edge.source === connection.target && edge.target === connection.source
      );
      
      if (existingReverseEdge) {
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

        // 식별자 관계의 경우 PK 선택, 비식별자 관계의 경우 일반 컬럼으로 FK 생성
        const relationshipType = state.connectionMode;
        const isIdentifyingRelationship = relationshipType === 'oneToOneIdentifying' || relationshipType === 'oneToManyIdentifying';

        let newTargetColumns = [...(targetNode.data.columns || [])];
        
        // 여러 PK가 있는 경우 모두 FK로 추가
        sourcePkColumns.forEach((sourcePkColumn: any) => {
          const fkColumnName = `${sourceNode.data.label.toLowerCase()}_${sourcePkColumn.name}`;
          const existingFkIndex = newTargetColumns.findIndex(col => col.name === fkColumnName);

          if (isIdentifyingRelationship) {
            // 식별자 관계: FK가 PK의 일부가 됨
            if (existingFkIndex === -1) {
              newTargetColumns.push({ 
                name: fkColumnName, 
                type: sourcePkColumn.type, 
                pk: true, 
                fk: true,
                uk: false,
                comment: `Foreign key from ${sourceNode.data.label}.${sourcePkColumn.name}`
              });
            } else {
              newTargetColumns[existingFkIndex] = { 
                ...newTargetColumns[existingFkIndex], 
                pk: true, 
                fk: true 
              };
            }
          } else {
            // 비식별자 관계: FK는 일반 컬럼
            if (existingFkIndex === -1) {
              newTargetColumns.push({ 
                name: fkColumnName, 
                type: sourcePkColumn.type, 
                pk: false, 
                fk: true,
                uk: false,
                comment: `Foreign key from ${sourceNode.data.label}.${sourcePkColumn.name}`
              });
            } else {
              newTargetColumns[existingFkIndex] = { 
                ...newTargetColumns[existingFkIndex], 
                pk: false, 
                fk: true 
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
      
      // Handle ID 결정
      const sourceHandleId = sourcePkColumn 
        ? createHandleId(sourcePkColumn.name, sourceX <= targetX ? 'right' : 'left')
        : (sourceX <= targetX ? 'right' : 'left');
        
      const targetHandleId = targetFkColumn
        ? createHandleId(targetFkColumn.name, sourceX <= targetX ? 'left' : 'right')
        : (sourceX <= targetX ? 'left' : 'right');

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
  setShowGrid: (show: boolean) => set({ showGrid: show }),
  setShowAlignPopup: (show: boolean) => set({ showAlignPopup: show }),
  setShowViewPopup: (show: boolean) => set({ showViewPopup: show }),
  
  // 뷰 설정 함수들
  updateViewSettings: (settings: Partial<ViewSettings>) => 
    set((state) => ({ 
      viewSettings: { ...state.viewSettings, ...settings } 
    })),
  
  // 테마 함수들
  setTheme: (theme: Theme) => set({ theme }),
  toggleTheme: () => 
    set((state) => ({ 
      theme: state.theme === 'light' ? 'dark' : 'light' 
    })),
  
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

      // 컬럼 변경 분석
      const oldColumns = oldNode.data.columns || [];
      const newColumns = newData.columns || [];
      
      // PK 컬럼 이름 변경 감지 (이름으로 비교)
      const pkNameChanges: Array<{oldName: string, newName: string, entityName: string}> = [];
      
      // 기존 PK 컬럼들
      const oldPkColumns = oldColumns.filter((col: any) => col.pk);
      const newPkColumns = newColumns.filter((col: any) => col.pk);
      
      // PK 컬럼의 이름 변경 감지
      oldPkColumns.forEach((oldPkCol: any) => {
        // 같은 위치의 새 PK 컬럼과 비교 (ID가 같거나 순서가 같은 경우)
        const matchingNewPk = newPkColumns.find((newPkCol: any) => 
          (newPkCol.id && oldPkCol.id && newPkCol.id === oldPkCol.id) ||
          (!newPkCol.id || !oldPkCol.id) // ID가 없는 경우는 이름으로만 비교
        );
        
        if (matchingNewPk && oldPkCol.name !== matchingNewPk.name) {
          pkNameChanges.push({
            oldName: oldPkCol.name,
            newName: matchingNewPk.name,
            entityName: oldNode.data.label
          });
        }
      });
      
      // 만약 ID 기반 매칭이 실패하면 이름 기반으로 다시 시도
      if (pkNameChanges.length === 0 && oldPkColumns.length === newPkColumns.length) {
        for (let i = 0; i < oldPkColumns.length; i++) {
          if (oldPkColumns[i].name !== newPkColumns[i].name) {
            pkNameChanges.push({
              oldName: oldPkColumns[i].name,
              newName: newPkColumns[i].name,
              entityName: oldNode.data.label
            });
          }
        }
      }
      
      // PK 상태 변경사항 분석 (실제로 PK 상태가 변경된 경우만)
      const pkChanges: Array<{type: 'added' | 'removed', column: any, entityName: string}> = [];
      
      // 제거된 PK 찾기 (컬럼이 삭제되거나 PK 상태가 false로 변경된 경우)
      oldColumns.forEach((oldCol: any) => {
        const newCol = newColumns.find((col: any) => 
          (col.id && oldCol.id && col.id === oldCol.id) || 
          (col.name === oldCol.name && !pkNameChanges.some(change => change.oldName === oldCol.name))
        );
        if (oldCol.pk && (!newCol || !newCol.pk)) {
          // 컬럼이 완전히 삭제되었거나 PK 상태만 변경된 경우
          pkChanges.push({ type: 'removed', column: oldCol, entityName: oldNode.data.label });
        }
      });
      
      // 추가된 PK 찾기 (새로운 컬럼이 PK로 추가되거나 기존 컬럼이 PK로 변경된 경우)
      newColumns.forEach((newCol: any) => {
        const oldCol = oldColumns.find((col: any) => 
          (col.id && newCol.id && col.id === newCol.id) || 
          (col.name === newCol.name && !pkNameChanges.some(change => change.newName === newCol.name))
        );
        if (newCol.pk && (!oldCol || !oldCol.pk)) {
          // 새로운 컬럼이 PK로 추가되었거나 기존 컬럼이 PK로 변경된 경우
          pkChanges.push({ type: 'added', column: newCol, entityName: oldNode.data.label });
        }
      });

      // FK 컬럼의 PK 상태 변경 감지 (식별자/비식별자 관계 변경을 위한)
      const fkPkChanges: Array<{type: 'pk_added' | 'pk_removed', column: any, entityName: string}> = [];
      
      // FK 컬럼에서 PK 상태가 변경된 경우 감지
      oldColumns.forEach((oldCol: any) => {
        const newCol = newColumns.find((col: any) => 
          (col.id && oldCol.id && col.id === oldCol.id) || col.name === oldCol.name
        );
        
        if (oldCol.fk && newCol && newCol.fk) {
          // FK 컬럼에서 PK가 추가된 경우 (비식별자 → 식별자)
          if (!oldCol.pk && newCol.pk) {
            fkPkChanges.push({ type: 'pk_added', column: newCol, entityName: oldNode.data.label });
          }
          // FK 컬럼에서 PK가 제거된 경우 (식별자 → 비식별자)
          else if (oldCol.pk && !newCol.pk) {
            fkPkChanges.push({ type: 'pk_removed', column: oldCol, entityName: oldNode.data.label });
          }
        }
      });

      // FK 변경사항 분석 (자식 엔티티에서 FK 삭제 시)
      const fkChanges: Array<{type: 'removed', column: any, entityName: string}> = [];
      
      // 제거된 FK 찾기 (컬럼이 삭제되거나 FK 상태가 false로 변경된 경우)
      oldColumns.forEach((oldCol: any) => {
        const newCol = newColumns.find((col: any) => 
          (col.id && oldCol.id && col.id === oldCol.id) || col.name === oldCol.name
        );
        if (oldCol.fk && (!newCol || !newCol.fk)) {
          fkChanges.push({ type: 'removed', column: oldCol, entityName: oldNode.data.label });
        }
      });

      let finalNodes = updatedNodes;
      let finalEdges = state.edges;

      // PK 컬럼 이름 변경 처리 (우선 처리)
      if (pkNameChanges.length > 0) {
        const relatedEdges = state.edges.filter(edge => edge.source === nodeId);
        
        relatedEdges.forEach(edge => {
          const targetNodeId = edge.target;
          
          finalNodes = finalNodes.map(node => {
            if (node.id === targetNodeId && node.type === 'entity') {
              let targetColumns = [...(node.data.columns || [])];
              
              pkNameChanges.forEach(change => {
                const oldFkName = `${change.entityName.toLowerCase()}_${change.oldName}`;
                const newFkName = `${change.entityName.toLowerCase()}_${change.newName}`;
                
                // 기존 FK 컬럼 찾아서 이름 업데이트
                const fkColumnIndex = targetColumns.findIndex(col => col.name === oldFkName && col.fk);
                if (fkColumnIndex !== -1) {
                  targetColumns[fkColumnIndex] = {
                    ...targetColumns[fkColumnIndex],
                    id: targetColumns[fkColumnIndex].id || `${Date.now()}_${Math.random()}`,
                    name: newFkName
                  };
                }
              });
              
              return { ...node, data: { ...node.data, columns: targetColumns } };
            }
            return node;
          });
        });
        
        // PK 컬럼 이름 변경이 있었으면 PK 상태 변경 처리를 건너뛰기 위해 리턴
        return {
          ...state,
          nodes: finalNodes,
          edges: finalEdges
        };
      }

      // PK 상태 변경 처리 (PK 컬럼 이름 변경이 없을 때만 실행)
      if (pkChanges.length > 0) {
        // 현재 엔티티를 참조하는 모든 관계선 찾기
        const relatedEdges = state.edges.filter(edge => edge.source === nodeId);
        
        relatedEdges.forEach(edge => {
          const targetNodeId = edge.target;
          
          finalNodes = finalNodes.map(node => {
            if (node.id === targetNodeId && node.type === 'entity') {
              let targetColumns = [...(node.data.columns || [])];
              let hasRemainingFKs = false;
              
              pkChanges.forEach(change => {
                const fkColumnName = `${change.entityName.toLowerCase()}_${change.column.name}`;
                const existingFkIndex = targetColumns.findIndex(col => col.name === fkColumnName);
                
                if (change.type === 'removed' && existingFkIndex !== -1) {
                  // 특정 PK에 대응하는 FK만 제거
                  targetColumns.splice(existingFkIndex, 1);
                  toast.info(`${change.entityName}의 PK 삭제로 인해 ${node.data.label}에서 ${fkColumnName} FK가 제거되었습니다.`);
                } else if (change.type === 'added') {
                  // 새로운 PK에 대응하는 FK 추가
                  if (existingFkIndex === -1) {
                    const isIdentifying = edge.type?.includes('identifying') || false;
                    
                    targetColumns.push({
                      id: `${Date.now()}_${Math.random()}`,
                      name: fkColumnName,
                      type: change.column.type,
                      pk: isIdentifying,
                      fk: true,
                      uq: false,
                      nn: isIdentifying,
                      comment: `Foreign key from ${change.entityName}.${change.column.name}`
                    });
                    toast.info(`${change.entityName}의 PK 추가로 인해 ${node.data.label}에 ${fkColumnName} FK가 추가되었습니다.`);
                  }
                }
              });
              
              // 이 관계에서 남은 FK가 있는지 확인
              hasRemainingFKs = targetColumns.some(col => 
                col.fk && col.name.startsWith(`${oldNode.data.label.toLowerCase()}_`)
              );
              
              // 식별 관계이고 남은 FK가 없으면 관계선 제거
              if (!hasRemainingFKs && edge.type?.includes('identifying')) {
                finalEdges = finalEdges.filter(e => e.id !== edge.id);
                toast.info(`${oldNode.data.label}과 ${node.data.label} 간의 식별 관계가 PK 제약 제거로 인해 삭제되었습니다.`);
              }
              
              return { ...node, data: { ...node.data, columns: targetColumns } };
            }
            return node;
          });
        });
      }

      // FK 컬럼의 PK 상태 변경 처리 (식별자/비식별자 관계 변경)
      if (fkPkChanges.length > 0) {
        fkPkChanges.forEach(change => {
          // FK 이름에서 부모 엔티티 추출 (예: "user_id" → "user")
          const fkName = change.column.name;
          const parts = fkName.split('_');
          if (parts.length >= 2) {
            const parentEntityNameLower = parts[0];
            
            // 부모 엔티티 찾기
            const parentEntity = finalNodes.find(node => 
              node.data.label.toLowerCase() === parentEntityNameLower
            );
            
            if (parentEntity) {
              // 해당 부모 엔티티와의 관계 찾기
              const relatedEdge = finalEdges.find(edge => 
                edge.source === parentEntity.id && edge.target === nodeId
              );
              
              if (relatedEdge) {
                // 관계 타입 변경
                let newType = relatedEdge.type;
                
                if (change.type === 'pk_added') {
                  // 비식별자 → 식별자
                  if (relatedEdge.type === 'one-to-one-non-identifying') {
                    newType = 'one-to-one-identifying';
                  } else if (relatedEdge.type === 'one-to-many-non-identifying') {
                    newType = 'one-to-many-identifying';
                  }
                  toast.info(`${parentEntity.data.label}과 ${oldNode.data.label} 간의 관계가 식별자 관계로 변경되었습니다.`);
                } else if (change.type === 'pk_removed') {
                  // 식별자 → 비식별자
                  if (relatedEdge.type === 'one-to-one-identifying') {
                    newType = 'one-to-one-non-identifying';
                  } else if (relatedEdge.type === 'one-to-many-identifying') {
                    newType = 'one-to-many-non-identifying';
                  }
                  toast.info(`${parentEntity.data.label}과 ${oldNode.data.label} 간의 관계가 비식별자 관계로 변경되었습니다.`);
                }
                
                // 관계 타입 업데이트
                if (newType !== relatedEdge.type) {
                  finalEdges = finalEdges.map(edge => 
                    edge.id === relatedEdge.id 
                      ? { ...edge, type: newType }
                      : edge
                  );
                }
              }
            }
          }
        });
      }

      // FK 변경 처리 (자식 엔티티에서 FK 삭제 시)
      if (fkChanges.length > 0) {
        fkChanges.forEach(change => {
          // FK 이름에서 부모 엔티티 추출
          const fkName = change.column.name;
          const parts = fkName.split('_');
          if (parts.length >= 2) {
            const parentEntityName = parts[0];
            
            // 해당 부모 엔티티와의 관계선 찾기
            const relatedEdge = state.edges.find(edge => {
              const sourceNode = state.nodes.find(n => n.id === edge.source);
              return edge.target === nodeId && 
                     sourceNode?.data.label.toLowerCase() === parentEntityName;
            });
            
            if (relatedEdge) {
              // 식별 관계인 경우에만 자동 삭제 처리
              const isIdentifyingRelation = relatedEdge.type?.includes('identifying');
              
              if (isIdentifyingRelation) {
                // 이 관계에서 남은 FK가 있는지 확인
                const remainingFKs = newColumns.filter((col: any) => 
                  col.fk && col.name.startsWith(`${parentEntityName}_`)
                );
                
                if (remainingFKs.length === 0) {
                  // 남은 FK가 없으면 관계선 제거
                  finalEdges = finalEdges.filter(e => e.id !== relatedEdge.id);
                  const parentNode = state.nodes.find(n => n.id === relatedEdge.source);
                  toast.info(`${oldNode.data.label}에서 PK 제약 제거로 인해 ${parentNode?.data.label}과의 식별 관계가 제거되었습니다.`);
                }
              }
            }
          }
        });
      }

      return { nodes: finalNodes, edges: finalEdges };
    });
  },
  
  // 기존 edges의 Handle을 올바르게 업데이트하는 함수
  updateEdgeHandles: () => {
    set((state) => {
      if (state.edges.length === 0) {
        return state; // edges가 없으면 아무것도 하지 않음
      }
      
      const updatedEdges = state.edges.map(edge => {
        const sourceNode = state.nodes.find(node => node.id === edge.source);
        const targetNode = state.nodes.find(node => node.id === edge.target);
        
        if (!sourceNode || !targetNode) return edge;
        
        // 부모 엔티티의 PK 컬럼 찾기
        const sourcePkColumn = sourceNode.data.columns?.find((col: any) => col.pk);
        
        // 자식 엔티티의 FK 컬럼 찾기 (부모 테이블명_PK컬럼명 형태)
        let targetFkColumn = null;
        if (sourcePkColumn) {
          const fkColumnName = `${sourceNode.data.label.toLowerCase()}_${sourcePkColumn.name}`;
          targetFkColumn = targetNode.data.columns?.find((col: any) => col.name === fkColumnName && col.fk);
        }
        
        // X 좌표를 기준으로 좌우 결정
        const sourceX = sourceNode.position.x;
        const targetX = targetNode.position.x;
        
        // Handle ID 설정 - 항상 최신 위치를 기준으로 계산
        const sourceHandleId = sourcePkColumn 
          ? createHandleId(sourcePkColumn.name, sourceX <= targetX ? 'right' : 'left')
          : 'right'; // 기본값
          
        const targetHandleId = targetFkColumn
          ? createHandleId(targetFkColumn.name, sourceX <= targetX ? 'left' : 'right')
          : 'left'; // 기본값
        
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
  },
  
  setEdgeColor: (edgeId: string, color: string) => {
    set((state) => {
      const newEdgeColors = new Map(state.edgeColors);
      newEdgeColors.set(edgeId, color);
      return { edgeColors: newEdgeColors };
    });
  },
  
  setCommentColor: (commentId: string, color: string) => {
    set((state) => {
      const newCommentColors = new Map(state.commentColors);
      newCommentColors.set(commentId, color);
      return { commentColors: newCommentColors };
    });
  },
  
  getNodeColor: (nodeId: string) => {
    const previewColor = get().previewNodeColor;
    if (previewColor && previewColor.nodeId === nodeId) {
      console.log('Using preview color:', previewColor.color, 'for node:', nodeId);
      return previewColor.color;
    }
    const actualColor = get().nodeColors.get(nodeId) || '#4ECDC4';
    console.log('Using actual color:', actualColor, 'for node:', nodeId);
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
}));

export default useStore;
