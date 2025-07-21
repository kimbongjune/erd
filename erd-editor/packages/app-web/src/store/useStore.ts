import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';

type RFState = {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isBottomPanelOpen: boolean;
  connectionMode: string | null;
  connectingNodeId: string | null;
  temporaryEdge: Edge | null;
  
  
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addNode: (type: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setBottomPanelOpen: (isOpen: boolean) => void;
  deleteNode: (id: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onConnect: (connection: any) => void;
  setConnectionMode: (mode: string | null) => void;
  setConnectingNodeId: (id: string | null) => void;
};

const useStore = create<RFState>((set, get) => ({
  nodes: [
    {
      id: '1',
      type: 'entity',
      position: { x: 100, y: 100 },
      data: {
        label: 'User',
        columns: [
          { name: 'id', type: 'INT', pk: true },
          { name: 'username', type: 'VARCHAR' },
        ],
      },
    },
    {
      id: '2',
      type: 'entity',
      position: { x: 400, y: 100 },
      data: {
        label: 'Post',
        columns: [
          { name: 'id', type: 'INT', pk: true },
          { name: 'title', type: 'VARCHAR' },
          { name: 'user_id', type: 'INT' },
        ],
      },
    },
  ],
  edges: [{ id: 'e1-2', source: '1', target: '2' }],
  selectedNodeId: null,
  isBottomPanelOpen: false,
  connectionMode: null, // 초기값은 null
  connectingNodeId: null,
  temporaryEdge: null,
  
  
  onNodesChange: (changes) => {
    const { nodes, connectionMode, connectingNodeId } = get();
    const filteredChanges = changes.filter(change => {
      if (connectionMode && connectingNodeId && change.type === 'position' && change.id === connectingNodeId) {
        return false; // Prevent position changes for the connecting node when in connection mode
      }
      return true;
    });
    set({
      nodes: applyNodeChanges(filteredChanges, nodes),
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
  setBottomPanelOpen: (isOpen) => set({ isBottomPanelOpen: isOpen }),
  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
    });
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },
  onConnect: (connection) => {
    const { nodes, edges, connectionMode } = get();
    console.log("onConnect triggered! Connection:", connection, "Connection Mode:", connectionMode);
    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);

    if (sourceNode && targetNode && sourceNode.type === 'entity' && targetNode.type === 'entity') {
      const sourcePkColumn = sourceNode.data.columns?.find((col) => col.pk);

      if (sourcePkColumn) {
        let newTargetColumns = [...(targetNode.data.columns || [])];
        const fkColumnName = `${sourceNode.data.label.toLowerCase()}_${sourcePkColumn.name}`;

        // 이미 존재하는지 확인
        const existingFkIndex = newTargetColumns.findIndex(col => col.name === fkColumnName);

        if (connectionMode === 'one-to-one-identifying' || connectionMode === 'one-to-many-identifying') {
          // 식별 관계: 부모 PK를 자식 PK이자 FK로
          if (existingFkIndex === -1) {
            newTargetColumns.push({ name: fkColumnName, type: sourcePkColumn.type, pk: true, fk: true });
          } else {
            newTargetColumns[existingFkIndex] = { ...newTargetColumns[existingFkIndex], pk: true, fk: true };
          }
        } else if (connectionMode === 'one-to-one-non-identifying' || connectionMode === 'one-to-many-non-identifying') {
          // 비식별 관계: 부모 PK를 자식 FK로
          if (existingFkIndex === -1) {
            newTargetColumns.push({ name: fkColumnName, type: sourcePkColumn.type, pk: false, fk: true });
          } else {
            newTargetColumns[existingFkIndex] = { ...newTargetColumns[existingFkIndex], pk: false, fk: true };
          }
        } else {
          // 알 수 없는 관계 모드일 경우 기본적으로 비식별 관계로 처리
          if (existingFkIndex === -1) {
            newTargetColumns.push({ name: fkColumnName, type: sourcePkColumn.type, pk: false, fk: true });
          } else {
            newTargetColumns[existingFkIndex] = { ...newTargetColumns[existingFkIndex], pk: false, fk: true };
          }
        }

        set({
          nodes: nodes.map((node) =>
            node.id === targetNode.id
              ? { ...node, data: { ...node.data, columns: newTargetColumns } }
              : node
          ),
        });
      }
    }

    const newEdge = { ...connection, type: connectionMode || 'default' };
    set({
      edges: addEdge(newEdge, edges),
    });
    set({ connectionMode: null });
  },
  setConnectionMode: (mode) => set({ connectionMode: mode }),
  setConnectingNodeId: (id) => set({ connectingNodeId: id }),
  setTemporaryEdge: (edge) => set({ temporaryEdge: edge })
}));
export default useStore;
