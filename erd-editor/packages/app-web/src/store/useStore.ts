import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges, addEdge, Connection, NodeChange, MarkerType } from 'reactflow';
import { toast } from 'react-toastify';

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
  
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addNode: (type: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setBottomPanelOpen: (isOpen: boolean) => void;
  deleteNode: (id: string) => void;
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
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
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

      // PK 변경 감지 및 FK 자동 반영
      const oldColumns = oldNode.data.columns || [];
      const newColumns = newData.columns || [];
      
      // PK가 변경된 컬럼들 찾기
      const pkChanges: Array<{type: 'added' | 'removed', column: any, entityName: string}> = [];
      
      // 기존 PK가 제거된 경우
      oldColumns.forEach((oldCol: any, index: number) => {
        const newCol = newColumns[index];
        if (oldCol.pk && (!newCol || !newCol.pk)) {
          pkChanges.push({ type: 'removed', column: oldCol, entityName: oldNode.data.label });
        }
      });
      
      // 새로운 PK가 추가된 경우
      newColumns.forEach((newCol: any, index: number) => {
        const oldCol = oldColumns[index];
        if (newCol.pk && (!oldCol || !oldCol.pk)) {
          pkChanges.push({ type: 'added', column: newCol, entityName: oldNode.data.label });
        }
      });

      let finalNodes = updatedNodes;

      // PK 변경이 있는 경우 관련 FK 업데이트
      if (pkChanges.length > 0) {
        // 현재 엔티티를 참조하는 모든 관계선 찾기
        const relatedEdges = state.edges.filter(edge => edge.source === nodeId);
        const edgesToRemove: string[] = [];
        
        relatedEdges.forEach(edge => {
          const targetNodeId = edge.target;
          let shouldRemoveEdge = false;
          
          finalNodes = finalNodes.map(node => {
            if (node.id === targetNodeId && node.type === 'entity') {
              let targetColumns = [...(node.data.columns || [])];
              
              pkChanges.forEach(change => {
                const fkColumnName = `${change.entityName.toLowerCase()}_${change.column.name}`;
                const existingFkIndex = targetColumns.findIndex(col => col.name === fkColumnName);
                
                if (change.type === 'removed' && existingFkIndex !== -1) {
                  // PK가 제거된 경우 해당 FK도 제거
                  targetColumns.splice(existingFkIndex, 1);
                  toast.info(`${change.entityName}의 PK 변경으로 인해 ${node.data.label}에서 ${fkColumnName} FK가 제거되었습니다.`);
                  
                  // 이 엔티티에 더 이상 FK가 없으면 관계선도 제거
                  const remainingFks = targetColumns.filter(col => 
                    col.fk && col.name.startsWith(`${change.entityName.toLowerCase()}_`)
                  );
                  if (remainingFks.length === 0) {
                    shouldRemoveEdge = true;
                  }
                } else if (change.type === 'added') {
                  // 새로운 PK가 추가된 경우 FK 추가 (중복 방지)
                  if (existingFkIndex === -1) {
                    // 관계 타입에 따라 FK 속성 결정
                    const relatedEdgeData = edge.data || {};
                    const isIdentifying = edge.type?.includes('identifying') || false;
                    
                    targetColumns.push({
                      name: fkColumnName,
                      type: change.column.type,
                      pk: isIdentifying,
                      fk: true,
                      uk: false,
                      comment: `Foreign key from ${change.entityName}.${change.column.name}`
                    });
                    toast.info(`${change.entityName}의 PK 추가로 인해 ${node.data.label}에 ${fkColumnName} FK가 추가되었습니다.`);
                  }
                }
              });
              
              return { ...node, data: { ...node.data, columns: targetColumns } };
            }
            return node;
          });
          
          if (shouldRemoveEdge) {
            edgesToRemove.push(edge.id);
          }
        });
        
        // 제거할 관계선이 있으면 edges에서도 제거
        if (edgesToRemove.length > 0) {
          const updatedEdges = state.edges.filter(edge => !edgesToRemove.includes(edge.id));
          return { nodes: finalNodes, edges: updatedEdges };
        }
      }

      return { nodes: finalNodes };
    });
  },
}));

export default useStore;
