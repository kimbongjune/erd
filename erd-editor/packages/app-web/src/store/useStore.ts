import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges, addEdge, Connection, NodeChange, MarkerType } from 'reactflow';
import { toast } from 'react-toastify';

type SnapGuide = {
  type: 'vertical' | 'horizontal';
  position: number;
  color: string;
  priority?: number;
};

type RFState = {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isBottomPanelOpen: boolean;
  connectionMode: string | null;
  connectingNodeId: string | null;
  createMode: string | null;
  selectMode: boolean;
  
  // 스냅 기능 관련
  isDragging: boolean;
  draggingNodeId: string | null;
  snapGuides: SnapGuide[];
  snapThreshold: number;
  
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addNode: (type: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
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
          { name: 'id', type: 'INT', pk: true, fk: false, uq: false, comment: '사용자 고유 ID' },
          { name: 'username', type: 'VARCHAR(50)', pk: false, fk: false, uq: true, comment: '사용자명' },
          { name: 'email', type: 'VARCHAR(100)', pk: false, fk: false, uq: false, comment: '이메일 주소' },
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
          { name: 'id', type: 'INT', pk: true, fk: false, uk: false, comment: '게시글 고유 ID' },
          { name: 'title', type: 'VARCHAR(255)', pk: false, fk: false, uk: false, comment: '게시글 제목' },
          { name: 'content', type: 'TEXT', pk: false, fk: false, uk: false, comment: '게시글 내용' },
        ],
      },
    },
  ],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  isBottomPanelOpen: false,
  connectionMode: null,
  connectingNodeId: null,
  createMode: null,
  selectMode: true,
  
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
      data: { label: `New ${type}` },
    };
    set({ nodes: [...get().nodes, newNode] });
  },
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
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
              sourceHandle: sourceX < targetX ? 'right' : 'left',
              targetHandle: sourceX < targetX ? 'left' : 'right',
            };
          }
          return edge;
        });
      } else {
        // Create new edge
        const newEdge = {
          ...connection,
          sourceHandle: sourceX <= targetX ? 'right' : 'left',
          targetHandle: sourceX <= targetX ? 'left' : 'right',
          type: getEdgeType(state.connectionMode),
          markerStart: sourceMarker,
          markerEnd: targetMarker,
        };
        updatedEdges = addEdge(newEdge, state.edges);
      }

      return { nodes: updatedNodes, edges: updatedEdges };
    });
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
      result.push(bestVerticalGuide.guide);
    }
    if (bestHorizontalGuide) {
      result.push(bestHorizontalGuide.guide);
    }
    
    return result;
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

      // 컬럼 변경 분석
      const oldColumns = oldNode.data.columns || [];
      const newColumns = newData.columns || [];
      
      // 컬럼 이름을 기반으로 변경사항 감지
      const oldColumnMap = new Map(oldColumns.map((col: any) => [col.name, col]));
      const newColumnMap = new Map(newColumns.map((col: any) => [col.name, col]));
      
      // PK 변경사항 분석
      const pkChanges: Array<{type: 'added' | 'removed', column: any, entityName: string}> = [];
      
      // 제거된 PK 찾기
      for (const [colName, oldCol] of oldColumnMap) {
        const newCol = newColumnMap.get(colName);
        if ((oldCol as any).pk && (!newCol || !(newCol as any).pk)) {
          pkChanges.push({ type: 'removed', column: oldCol, entityName: oldNode.data.label });
        }
      }
      
      // 추가된 PK 찾기  
      for (const [colName, newCol] of newColumnMap) {
        const oldCol = oldColumnMap.get(colName);
        if ((newCol as any).pk && (!oldCol || !(oldCol as any).pk)) {
          pkChanges.push({ type: 'added', column: newCol, entityName: oldNode.data.label });
        }
      }

      // FK 변경사항 분석 (자식 엔티티에서 FK 삭제 시)
      const fkChanges: Array<{type: 'removed', column: any, entityName: string}> = [];
      
      // 제거된 FK 찾기
      for (const [colName, oldCol] of oldColumnMap) {
        const newCol = newColumnMap.get(colName);
        if ((oldCol as any).fk && (!newCol || !(newCol as any).fk)) {
          fkChanges.push({ type: 'removed', column: oldCol, entityName: oldNode.data.label });
        }
      }

      let finalNodes = updatedNodes;
      let finalEdges = state.edges;

      // PK 변경 처리 (부모 엔티티에서)
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
                      name: fkColumnName,
                      type: change.column.type,
                      pk: isIdentifying,
                      fk: true,
                      uq: false,
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
              
              // 남은 FK가 없으면 관계선 제거 표시
              if (!hasRemainingFKs) {
                finalEdges = finalEdges.filter(e => e.id !== edge.id);
                toast.info(`${oldNode.data.label}과 ${node.data.label} 간의 관계가 제거되었습니다.`);
              }
              
              return { ...node, data: { ...node.data, columns: targetColumns } };
            }
            return node;
          });
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
              // 이 관계에서 남은 FK가 있는지 확인
              const remainingFKs = newColumns.filter((col: any) => 
                col.fk && col.name.startsWith(`${parentEntityName}_`)
              );
              
              if (remainingFKs.length === 0) {
                // 남은 FK가 없으면 관계선 제거
                finalEdges = finalEdges.filter(e => e.id !== relatedEdge.id);
                const parentNode = state.nodes.find(n => n.id === relatedEdge.source);
                toast.info(`${oldNode.data.label}에서 FK 삭제로 인해 ${parentNode?.data.label}과의 관계가 제거되었습니다.`);
              }
            }
          }
        });
      }

      return { nodes: finalNodes, edges: finalEdges };
    });
  },
}));

export default useStore;
