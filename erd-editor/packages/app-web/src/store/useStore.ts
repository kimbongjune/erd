import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges, addEdge, Connection, NodeChange, MarkerType } from 'reactflow';
import { toast } from 'react-toastify';
import { createHandleId } from '../utils/handleUtils';
import { validateDataTypeForSQL } from '../utils/mysqlTypes';
import { 
  HistoryManager, 
  HISTORY_ACTIONS, 
  HistoryActionType, 
  serializeState, 
  deserializeState, 
  SerializableHistoryState 
} from '../utils/historyManager';

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
  // 내부 관리용 속성들 (UI에 노출되지 않음)
  keyType?: 'single' | 'composite';  // FK가 단일키 참조인지 복합키 참조인지
  relationshipGroupId?: string;      // 같은 관계의 FK들을 그룹화
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
const STORAGE_KEY_PREFIX = 'erd-editor-data';
const STORAGE_VERSION = '1.0';

// 현재 URL을 기반으로 한 동적 저장소 키 생성
const getCurrentStorageKey = () => {
  return `${STORAGE_KEY_PREFIX}${window.location.pathname}`;
};

// 하위 계층으로의 연쇄 FK 추가 전파 함수 (PK 추가 시 사용)
export const propagateColumnAddition = (
  nodeId: string,
  addedColumn: any,
  allNodes: any[],
  allEdges: any[],
  toastMessages: string[] = []
): { updatedNodes: any[], updatedEdges: any[], toastMessages: string[] } => {
  let finalNodes = [...allNodes];
  let finalEdges = [...allEdges];
  let messages = [...toastMessages];
  
  // 🎯 자기참조 PK 추가 처리 (문제 3 해결)
  const currentNode = finalNodes.find(n => n.id === nodeId);
  if (currentNode) {
    const currentColumns = currentNode.data.columns || [];
    
    // 기존 자기참조 FK가 있는지 확인
    const existingSelfFks = currentColumns.filter((col: any) => 
      col.fk && col.parentEntityId === nodeId
    );
    
    if (existingSelfFks.length > 0) {
      console.log(`🎯 자기참조 PK 추가: ${addedColumn.name}, 기존 FK: ${existingSelfFks.map(fk => fk.name).join(', ')}`);
      
      // 각 기존 자기참조 FK에 대해 새로운 FK 컬럼 생성
      const newSelfFks: any[] = [];
      
      existingSelfFks.forEach((existingFk: any) => {
        // 기존 FK의 이름 패턴 분석 (예: user_id -> user_name)
        const baseName = existingFk.name.replace(/_\w+$/, ''); // 마지막 _xxx 제거
        const newFkName = `${baseName}_${addedColumn.name}`;
        
        // 새로운 자기참조 FK 컬럼 생성
        const newSelfFk = {
          id: `self-fk-${nodeId}-${addedColumn.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: newFkName,
          type: addedColumn.dataType || addedColumn.type,
          dataType: addedColumn.dataType || addedColumn.type,
          pk: false, // 자기참조는 항상 비식별자 관계
          fk: true,
          nn: false,
          uq: false,
          ai: false,
          comment: `자기참조 외래키: ${currentNode.data.label}.${addedColumn.name}`,
          logicalName: addedColumn.logicalName || '',
          defaultValue: '',
          parentEntityId: nodeId,
          parentColumnId: addedColumn.id || addedColumn.name,
          keyType: 'composite', // 복합키로 설정
          relationshipGroupId: `self_ref_${nodeId}_${Date.now()}`
        };
        
        newSelfFks.push(newSelfFk);
      });
      
      if (newSelfFks.length > 0) {
        // 새로운 FK 컬럼들을 현재 엔티티에 추가
        const updatedColumns = [...currentColumns, ...newSelfFks];
        
        // 노드 업데이트
        const nodeIndex = finalNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
          finalNodes[nodeIndex] = {
            ...finalNodes[nodeIndex],
            data: {
              ...finalNodes[nodeIndex].data,
              columns: updatedColumns
            }
          };
        }
        
        // 자기참조 관계선 생성 (복합키 관계로)
        const selfEdges = finalEdges.filter(edge => edge.source === nodeId && edge.target === nodeId);
        if (selfEdges.length === 0) {
          // 자기참조 관계선이 없으면 새로 생성
          const newSelfEdge = {
            id: `self-edge-${nodeId}-${Date.now()}`,
            source: nodeId,
            target: nodeId,
            type: 'one-to-many-non-identifying', // 자기참조는 항상 비식별자
            sourceHandle: 'right',
            targetHandle: 'left',
            markerEnd: {
              type: 'arrow',
              width: 20,
              height: 20,
              color: '#4ECDC4'
            }
          };
          
          finalEdges = [...finalEdges, newSelfEdge];
          console.log(`🔗 자기참조 관계선 생성: ${newSelfEdge.id}`);
        }
        
        messages.push(`자기참조: ${currentNode.data.label} 엔티티에 복합키 자기참조 FK ${newSelfFks.length}개가 추가되었습니다.`);
        console.log(`✅ 자기참조 복합키 FK 생성 완료: ${newSelfFks.map(fk => fk.name).join(', ')}`);
      }
    }
  }
  
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
        
        // 부모 컬럼의 논리명과 주석 확인
        const parentLogicalName = addedColumn.logicalName || '';
        const parentComment = addedColumn.comment || '';
        
        // FK 컬럼의 논리명 설정 (부모에 논리명이 있으면 복사, 없으면 빈 상태)
        const fkLogicalName = parentLogicalName || '';
        
        // FK 컬럼의 주석 설정
        let fkComment = '';
        if (parentComment) {
          // 부모에 주석이 있으면 그대로 복사
          fkComment = parentComment;
        } else {
          // 부모에 주석이 없으면 한국어 기본값 설정
          fkComment = `외래키 참조: ${parentNode.data.label}.${addedColumn.name}`;
        }
        
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
          comment: fkComment,
          logicalName: fkLogicalName,
          defaultValue: '',
          parentEntityId: nodeId,
          parentColumnId: addedColumn.id || addedColumn.name,
          onDelete: 'NO ACTION',
          onUpdate: 'NO ACTION'
        };
        
        const updatedChildColumns = [...childColumns, newFkColumn];
        
        // 자식 노드 업데이트
        finalNodes = finalNodes.map(node => 
          node.id === edge.target 
            ? { ...node, data: { ...node.data, columns: updatedChildColumns } }
            : node
        );
        
        // 토스트 메시지 추가
        messages.push(`연쇄관계: ${childNode.data.label} 엔티티에 외래키 컬럼 ${fkColumnName}이 추가되었습니다.`);
        
        // 추가된 FK가 PK이기도 한 경우 (식별자 관계), 재귀적으로 손자에게도 전파
        if (isIdentifyingRelationship) {
          const recursiveResult = propagateColumnAddition(
            edge.target,
            newFkColumn,
            finalNodes,
            finalEdges,
            messages
          );
          finalNodes = recursiveResult.updatedNodes;
          finalEdges = recursiveResult.updatedEdges;
          messages = recursiveResult.toastMessages;
        }
      }
    }
  });
  
  return { updatedNodes: finalNodes, updatedEdges: finalEdges, toastMessages: messages };
};

// 하위 계층으로의 연쇄 삭제 전파 함수
export const propagateColumnDeletion = (
  nodeId: string, 
  deletedColumn: any, 
  allNodes: any[], 
  allEdges: any[],
  toastMessages: string[] = []
): { updatedNodes: any[], updatedEdges: any[], toastMessages: string[] } => {
  let finalNodes = [...allNodes];
  let finalEdges = [...allEdges];
  let resultToastMessages = [...toastMessages];
  
  console.log(`🗑️ PK 삭제 감지: ${deletedColumn.name}`, deletedColumn);
  
  // 전달받은 deletedColumn이 PK가 아니면 처리하지 않음
  if (!deletedColumn.pk) {
    return { updatedNodes: finalNodes, updatedEdges: finalEdges, toastMessages: resultToastMessages };
  }
  
  // 🎯 자기참조 FK 처리 (문제 2 해결)
  const sourceNodeForSelfRef = finalNodes.find(n => n.id === nodeId);
  if (sourceNodeForSelfRef) {
    const parentColumns = sourceNodeForSelfRef.data.columns || [];
    
    // 삭제된 PK를 참조하는 자기참조 FK 찾기
    const selfReferencingFks = parentColumns.filter((col: any) => 
      col.fk && 
      col.parentEntityId === nodeId && 
      (col.parentColumnId === deletedColumn.id || col.parentColumnId === deletedColumn.name)
    );
    
    if (selfReferencingFks.length > 0) {
      console.log(`🎯 자기참조 FK 삭제: ${selfReferencingFks.map(fk => fk.name).join(', ')}`);
      
      // 자기참조 FK들 삭제
      const updatedParentColumns = parentColumns.filter((col: any) => 
        !selfReferencingFks.some(fk => fk.id === col.id)
      );
      
      // 부모 노드 업데이트
      const parentNodeIndex = finalNodes.findIndex(n => n.id === nodeId);
      if (parentNodeIndex !== -1) {
        finalNodes[parentNodeIndex] = {
          ...finalNodes[parentNodeIndex],
          data: {
            ...finalNodes[parentNodeIndex].data,
            columns: updatedParentColumns
          }
        };
      }
      
      // 자기참조 관계선도 삭제
      const selfReferencingEdges = finalEdges.filter(edge => 
        edge.source === nodeId && edge.target === nodeId
      );
      
      if (selfReferencingEdges.length > 0) {
        finalEdges = finalEdges.filter(edge => 
          !(edge.source === nodeId && edge.target === nodeId)
        );
        console.log(`🗑️ 자기참조 관계선 삭제: ${selfReferencingEdges.length}개`);
      }
      
      resultToastMessages.push(`자기참조: ${sourceNodeForSelfRef.data.label} 엔티티에서 자기참조 FK ${selfReferencingFks.length}개가 삭제되었습니다.`);
    }
  }
  
  // 부모 노드 찾기
  const sourceNode = finalNodes.find(n => n.id === nodeId);
  if (!sourceNode) {
    return { updatedNodes: finalNodes, updatedEdges: finalEdges, toastMessages: resultToastMessages };
  }
  
  // 🔑 핵심: 부모에서 삭제될 PK를 제외한 나머지 PK들 확인
  const remainingParentPks = sourceNode.data.columns.filter((col: any) => 
    col.pk && col.id !== deletedColumn.id
  );
  
  const isCompositeKeyRelation = remainingParentPks.length > 0;
  console.log(`🔍 복합키 관계 판단: ${isCompositeKeyRelation} (남은 PK 개수: ${remainingParentPks.length})`);
  
  // 자식 엔티티들 찾기
  const childEdges = finalEdges.filter(edge => edge.source === nodeId);
  
  childEdges.forEach(edge => {
    const childNode = finalNodes.find(n => n.id === edge.target);
    if (!childNode || childNode.type !== 'entity') return;
    
    const childColumns = childNode.data.columns || [];
    
    if (isCompositeKeyRelation) {
      // 복합키 관계: 해당 PK를 참조하는 FK만 삭제, 관계선 유지
      const targetFkColumns = childColumns.filter((col: any) => 
        col.fk && 
        col.parentEntityId === nodeId && 
        (col.parentColumnId === deletedColumn.id || col.parentColumnId === deletedColumn.name)
      );
      
      if (targetFkColumns.length > 0) {
        console.log(`🎯 복합키 관계: ${edge.target}에서 ${targetFkColumns.length}개 FK 선택적 삭제`);
        
        // 해당 FK들만 삭제
        const updatedChildColumns = childColumns.filter((col: any) => 
          !targetFkColumns.some((fkCol: any) => fkCol.id === col.id)
        );
        
        // 자식 노드 업데이트
        const childNodeIndex = finalNodes.findIndex(n => n.id === edge.target);
        if (childNodeIndex !== -1) {
          finalNodes[childNodeIndex] = {
            ...finalNodes[childNodeIndex],
            data: {
              ...finalNodes[childNodeIndex].data,
              columns: updatedChildColumns
            }
          };
        }
        
        // 손자 엔티티로 재귀 전파 (삭제된 FK가 PK였다면)
        targetFkColumns.forEach((deletedFk: any) => {
          if (deletedFk.pk) {
            const grandchildResult = propagateColumnDeletion(
              edge.target,
              deletedFk,
              finalNodes,
              finalEdges,
              resultToastMessages
            );
            finalNodes = grandchildResult.updatedNodes;
            finalEdges = grandchildResult.updatedEdges;
            resultToastMessages.push(...grandchildResult.toastMessages);
          }
        });
        
        resultToastMessages.push(`연쇄관계: ${childNode.data.label} 엔티티에서 FK 컬럼이 선택적으로 삭제되었습니다.`);
      }
      
      console.log(`🔗 관계선 유지: 부모에 ${remainingParentPks.length}개 PK 남음`);
      
    } else {
      // 단일키 관계: 모든 FK 삭제, 관계선 삭제
      const allFkColumns = childColumns.filter((col: any) => 
        col.fk && col.parentEntityId === nodeId
      );
      
      if (allFkColumns.length > 0) {
        console.log(`🗑️ 단일키 관계: ${edge.target}에서 ${allFkColumns.length}개 FK 전체 삭제`);
        
        // 모든 FK 삭제
        const updatedChildColumns = childColumns.filter((col: any) => 
          !allFkColumns.some((fkCol: any) => fkCol.id === col.id)
        );
        
        // 자식 노드 업데이트
        const childNodeIndex = finalNodes.findIndex(n => n.id === edge.target);
        if (childNodeIndex !== -1) {
          finalNodes[childNodeIndex] = {
            ...finalNodes[childNodeIndex],
            data: {
              ...finalNodes[childNodeIndex].data,
              columns: updatedChildColumns
            }
          };
        }
        
        // 손자 엔티티로 재귀 전파 (삭제된 FK가 PK였다면)
        allFkColumns.forEach((deletedFk: any) => {
          if (deletedFk.pk) {
            const grandchildResult = propagateColumnDeletion(
              edge.target,
              deletedFk,
              finalNodes,
              finalEdges,
              resultToastMessages
            );
            finalNodes = grandchildResult.updatedNodes;
            finalEdges = grandchildResult.updatedEdges;
            resultToastMessages.push(...grandchildResult.toastMessages);
          }
        });
        
        resultToastMessages.push(`연쇄관계: ${childNode.data.label} 엔티티에서 모든 FK 컬럼이 삭제되었습니다.`);
      }
      
      // 관계선 삭제
      finalEdges = finalEdges.filter(e => e.id !== edge.id);
      console.log(`❌ 관계선 삭제: 부모에 PK 없음`);
      resultToastMessages.push(`연쇄관계: ${sourceNode.data.label}과 ${childNode.data.label} 간의 관계가 해제되었습니다.`);
    }
  });
  
  return { updatedNodes: finalNodes, updatedEdges: finalEdges, toastMessages: resultToastMessages };
};

// PK 컬럼의 데이터타입 변경 시 모든 FK에 전파하는 함수
export const propagateDataTypeChange = (
  nodeId: string,
  changedColumn: any,
  newDataType: string,
  allNodes: any[],
  allEdges: any[],
  toastMessages: string[] = []
): { updatedNodes: any[], toastMessages: string[] } => {
  let finalNodes = [...allNodes];
  let messages = [...toastMessages];
  
  // 현재 노드가 부모인 관계선들 찾기
  const childEdges = allEdges.filter(edge => edge.source === nodeId);
  
  childEdges.forEach(edge => {
    const childNode = finalNodes.find(n => n.id === edge.target);
    if (childNode && childNode.type === 'entity') {
      const currentParentNode = finalNodes.find(n => n.id === nodeId);
      if (!currentParentNode) return;
      
      const childColumns = childNode.data.columns || [];
      
      // 해당 PK에 대응하는 모든 FK 컬럼들 찾기 (동일한 PK를 참조하는 모든 FK)
      const targetFkColumns = childColumns.filter((col: any) => 
        col.fk && col.parentEntityId === nodeId && 
        (col.parentColumnId === changedColumn.id || 
         col.parentColumnId === changedColumn.name ||
         col.name === `${currentParentNode.data.label.toLowerCase()}_${changedColumn.name}`)
      );
      
      if (targetFkColumns.length > 0) {
        // 모든 대응하는 FK의 데이터타입과 type 변경
        const updatedChildColumns = childColumns.map((col: any) => {
          const isTargetFk = targetFkColumns.some((fkCol: any) => fkCol.id === col.id);
          return isTargetFk 
            ? { ...col, dataType: newDataType, type: newDataType }
            : col;
        });
        
        // 자식 노드 업데이트
        finalNodes = finalNodes.map(node => 
          node.id === edge.target 
            ? { ...node, data: { ...node.data, columns: updatedChildColumns } }
            : node
        );
        
        // 토스트 메시지 추가 (복수 FK 처리)
        if (targetFkColumns.length === 1) {
          messages.push(`연쇄관계: ${childNode.data.label} 엔티티의 외래키 컬럼 ${targetFkColumns[0].name}의 데이터타입이 ${newDataType}로 변경되었습니다.`);
        } else {
          const fkNames = targetFkColumns.map((fk: any) => fk.name).join(', ');
          messages.push(`연쇄관계: ${childNode.data.label} 엔티티의 외래키 컬럼 ${fkNames}의 데이터타입이 ${newDataType}로 변경되었습니다.`);
        }
        
        // PK이기도 한 FK들에 대해 재귀적으로 하위 계층에도 전파
        const pkFkColumns = targetFkColumns.filter((fkCol: any) => fkCol.pk);
        pkFkColumns.forEach((pkFkColumn: any) => {
          const updatedFkColumn = { ...pkFkColumn, dataType: newDataType, type: newDataType };
          const recursiveResult = propagateDataTypeChange(
            edge.target,
            updatedFkColumn,
            newDataType,
            finalNodes,
            allEdges,
            []  // 빈 메시지 배열로 시작해서 중복 방지
          );
          finalNodes = recursiveResult.updatedNodes;
          // 재귀 결과의 메시지들을 현재 메시지에 추가 (중복 제거)
          recursiveResult.toastMessages.forEach(msg => {
            if (!messages.includes(msg)) {
              messages.push(msg);
            }
          });
        });
      }
    }
  });
  
  return { updatedNodes: finalNodes, toastMessages: messages };
};

// 식별자 관계가 비식별자로 변경될 때 연쇄적으로 하위 관계들을 해제하는 함수
export const propagateRelationshipTypeChange = (
  childNodeId: string,
  removedPkColumns: any[],
  allNodes: any[],
  allEdges: any[],
  toastMessages: string[] = []
): { updatedNodes: any[], updatedEdges: any[], toastMessages: string[] } => {
  let finalNodes = [...allNodes];
  let finalEdges = [...allEdges];
  let messages = [...toastMessages];
  
  // 자식 노드가 부모인 관계선들 찾기
  const grandChildEdges = finalEdges.filter(edge => edge.source === childNodeId);
  
  // 각 관계별로 처리 (관계 단위로 처리하여 복합키 문제 해결)
  grandChildEdges.forEach(edge => {
    const grandChildNode = finalNodes.find(n => n.id === edge.target);
    if (grandChildNode && grandChildNode.type === 'entity') {
      const grandChildColumns = grandChildNode.data.columns || [];
      
      // 이 관계에서 제거될 모든 FK 컬럼들을 한번에 수집
      const allAffectedFkColumns: any[] = [];
      
      removedPkColumns.forEach(removedPkColumn => {
        const matchingFkColumns = grandChildColumns.filter((col: any) => 
          col.fk && 
          col.parentEntityId === childNodeId && 
          (col.parentColumnId === removedPkColumn.id || col.parentColumnId === removedPkColumn.name)
        );
        allAffectedFkColumns.push(...matchingFkColumns);
      });
      
      if (allAffectedFkColumns.length > 0) {
        // 이 관계의 모든 FK 컬럼들 (제거 대상이 아닌 것들도 포함)
        const allRelationshipFkColumns = grandChildColumns.filter((col: any) => 
          col.fk && col.parentEntityId === childNodeId
        );
        
        // 관계의 모든 FK 컬럼이 제거 대상인 경우 -> 관계 완전 해제
        if (allAffectedFkColumns.length === allRelationshipFkColumns.length) {
          
          // 모든 FK 컬럼들 제거
          const updatedGrandChildColumns = grandChildColumns.filter((col: any) => 
            !allAffectedFkColumns.some((affectedCol: any) => affectedCol.id === col.id)
          );
          
          // 손자 노드 업데이트
          finalNodes = finalNodes.map(node => 
            node.id === edge.target 
              ? { ...node, data: { ...node.data, columns: updatedGrandChildColumns } }
              : node
          );
          
          // 관계선 제거
          finalEdges = finalEdges.filter(e => e.id !== edge.id);
          
          // 토스트 메시지 추가
          const childNode = finalNodes.find(n => n.id === childNodeId);
          messages.push(`식별자관계 변경: ${childNode?.data?.label || ''}과 ${grandChildNode.data.label} 간의 관계가 해제되었습니다.`);
          
          // 제거된 FK가 PK이기도 했다면 재귀적으로 더 하위로 전파
          const removedPkFkColumns = allAffectedFkColumns.filter((col: any) => col.pk);
          if (removedPkFkColumns.length > 0) {
            const recursiveResult = propagateRelationshipTypeChange(
              edge.target,
              removedPkFkColumns,
              finalNodes,
              finalEdges,
              messages
            );
            finalNodes = recursiveResult.updatedNodes;
            finalEdges = recursiveResult.updatedEdges;
            messages = recursiveResult.toastMessages;
          }
        } else {
          // 일부 FK 컬럼만 제거 대상인 경우 -> 컬럼만 제거 (관계 유지)
          
          const updatedGrandChildColumns = grandChildColumns.filter((col: any) => 
            !allAffectedFkColumns.some((affectedCol: any) => affectedCol.id === col.id)
          );
          
          // 손자 노드 업데이트
          finalNodes = finalNodes.map(node => 
            node.id === edge.target 
              ? { ...node, data: { ...node.data, columns: updatedGrandChildColumns } }
              : node
          );
          
          // 제거된 FK가 PK이기도 했다면 재귀적으로 더 하위로 전파
          const removedPkFkColumns = allAffectedFkColumns.filter((col: any) => col.pk);
          if (removedPkFkColumns.length > 0) {
            const recursiveResult = propagateRelationshipTypeChange(
              edge.target,
              removedPkFkColumns,
              finalNodes,
              finalEdges,
              messages
            );
            finalNodes = recursiveResult.updatedNodes;
            finalEdges = recursiveResult.updatedEdges;
            messages = recursiveResult.toastMessages;
          }
        }
      }
    }
  });
  
  return { updatedNodes: finalNodes, updatedEdges: finalEdges, toastMessages: messages };
};

// 개선된 FK 컬럼 탐색 함수 (export하여 다른 컴포넌트에서도 사용 가능)
// FK 컬럼명 중복 방지를 위한 고유 이름 생성 함수
export const generateUniqueFkColumnName = (
  baseName: string,
  existingColumns: any[]
): string => {
  let counter = 1;
  let uniqueName = baseName;
  
  while (existingColumns.some(col => col.name === uniqueName)) {
    counter++;
    uniqueName = `${baseName}_${counter}`;
  }
  
  return uniqueName;
};

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
  
  // 편집 상태
  editingCommentId: string | null; // 현재 편집 중인 커멘트 노드 ID
  
  // 하단 패널 새로고침용 키
  bottomPanelRefreshKey?: number;
  
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
  
  // 히스토리 관련
  historyManager: HistoryManager;
  canUndo: boolean;
  canRedo: boolean;
  
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
  deleteEdge: (id: string, skipHistory?: boolean) => void;
  deleteSelected: () => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onConnect: (connection: Connection) => void;
  setConnectionMode: (mode: string | null) => void;
  setConnectingNodeId: (id: string | null) => void;
  finishConnection: (targetNodeId: string | null) => void;
  
  // 편집 상태 관리
  setEditingCommentId: (id: string | null) => void;
  cancelConnection: () => void;
  updateSelectedEdgeType: (newType: string) => void;
  updateNodeData: (nodeId: string, newData: any, deletedColumn?: any) => void;
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
  measureEntitySize: (nodeId: string) => { width: number; height: number };
  getAllEntitySizes: () => Map<string, { width: number; height: number }>;
  arrangeLeftRight: () => void;
  arrangeSnowflake: () => void;
  arrangeCompact: () => void;
  
  // localStorage 관련 함수들
  hasSavedData: boolean;
  setHasSavedData: (value: boolean) => void;
  checkSavedData: () => void;
  hasUnsavedChanges: () => boolean;
  saveToLocalStorage: (showToast?: boolean) => void;
  loadFromLocalStorage: () => void;
  clearLocalStorage: () => void;
  
  // 히스토리 관련 함수들
  saveHistoryState: (actionType: HistoryActionType, metadata?: any) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  updateHistoryFlags: () => void;
  
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
  
  // 편집 상태
  editingCommentId: null,
  
  // 하단 패널 새로고침용 키
  bottomPanelRefreshKey: 0,
  
  // 로딩 관련 초기값
  isLoading: false,
  loadingMessage: '',
  loadingProgress: 0,
  
  // localStorage 관련 상태
  hasSavedData: false,
  
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
            
            // 부모 엔티티의 첫 번째 PK 컬럼 찾기
            const sourcePkColumn = sourceNode.data.columns?.find((col: any) => col.pk);
            
            // 기존 targetHandle에서 FK 컬럼 이름 추출 (updateEdgeHandles와 동일한 로직)
            let targetFkColumn = null;
            if (edge.targetHandle && edge.targetHandle !== 'left' && edge.targetHandle !== 'right') {
              const handleParts = edge.targetHandle.split('-');
              if (handleParts.length >= 2) {
                // Handle 형태: "columnName-position"에서 컬럼 이름 추출 (마지막 position 제외)
                const targetFkColumnName = handleParts.slice(0, -1).join('-');
                
                // 해당 FK 컬럼이 여전히 존재하는지 확인
                targetFkColumn = targetNode.data.columns?.find((col: any) => 
                  col.fk && col.name === targetFkColumnName
                );
              }
            }
            
            // 기존 FK 컬럼을 찾지 못한 경우 첫 번째 FK로 fallback
            if (!targetFkColumn) {
              targetFkColumn = targetNode.data.columns?.find((col: any) => 
                col.fk && sourcePkColumn && col.name.startsWith(`${sourceNode.data.label.toLowerCase()}_`)
              );
            }
            
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
    
    // 자동저장 제거 - 수동 저장만 사용
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    
    // 자동저장 제거 - 수동 저장만 사용
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
    
    // 노드 추가 실행
    set({ nodes: [...get().nodes, newNode] });
    
    // 히스토리 저장 (변경 후) - 상태 업데이트 후 즉시 실행
    setTimeout(() => {
      const state = get();
      state.saveHistoryState(
        type === 'entity' ? HISTORY_ACTIONS.CREATE_ENTITY :
        type === 'comment' ? HISTORY_ACTIONS.CREATE_COMMENT :
        type === 'image' ? HISTORY_ACTIONS.CREATE_IMAGE :
        HISTORY_ACTIONS.CREATE_COMMENT, // 기본값
        { name: newNode.data.label }
      );
    }, 0);
    
    // 자동저장 제거 - 수동 저장만 사용
  },
  setSelectedNodeId: (id) => {
    const state = get();
    
    // 동일한 노드 선택 시 불필요한 재처리 방지
    if (state.selectedNodeId === id) {
      return;
    }
    
    // 이전 노드와 다른 경우에만 팔레트 숨김
    if (state.selectedNodeId !== id && state.selectedNodeId !== null) {
      state.hidePalette();
    }
    
    // 상태 업데이트를 한 번에 처리하여 애니메이션 안정화
    set({ selectedNodeId: id });
    
    // 하이라이트 업데이트를 다음 프레임에서 처리하여 부드러운 전환
    requestAnimationFrame(() => {
      get().updateAllHighlights();
    });
  },
  
  // 편집 상태 관리
  setEditingCommentId: (id) => set({ editingCommentId: id }),
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
      if (edge.source === entityId && edge.target === entityId) {
        // 자기참조인 경우 - 특별 처리
        relatedEntityIds.add(entityId);
        
        // 자기참조 FK 컬럼들 찾기
        const selfReferencingFkColumns = currentEntity.data.columns?.filter((col: any) => 
          col.fk && col.parentEntityId === entityId
        ).map((col: any) => col.name) || [];
        
        // 자기참조 PK 컬럼들 찾기 (FK와 매칭되는 것들)
        const selfReferencingPkColumns = currentEntity.data.columns?.filter((col: any) => {
          if (!col.pk) return false;
          // 해당 PK에 대응하는 자기참조 FK가 존재하는지 확인
          return currentEntity.data.columns?.some((targetCol: any) => 
            targetCol.fk && targetCol.parentEntityId === entityId &&
            (targetCol.parentColumnId === col.id || targetCol.parentColumnId === col.name)
          );
        }).map((col: any) => col.name) || [];
        
        // 자기참조 컬럼들을 현재 엔티티 컬럼에 추가
        currentEntityColumns.push(...selfReferencingFkColumns, ...selfReferencingPkColumns);
        
      } else if (edge.source === entityId) {
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
    // 삭제할 노드 정보 미리 저장 (히스토리용)
    const state = get();
    const nodeToDelete = state.nodes.find(node => node.id === id);
    
    set((state) => {
      const nodeToDelete = state.nodes.find(node => node.id === id);
      if (!nodeToDelete) return state;

      // 삭제할 노드가 엔티티인 경우 관련 처리
      if (nodeToDelete.type === 'entity') {
        // 1. 이 엔티티와 연결된 모든 관계선 찾기
        const relatedEdges = state.edges.filter(edge => 
          edge.source === id || edge.target === id
        );
        
        // 2. 관련된 다른 엔티티들에서 FK 제거 및 손자로 전파
        let updatedNodes = state.nodes.filter(node => node.id !== id);
        let updatedEdges = state.edges.filter(edge => 
          edge.source !== id && edge.target !== id
        );
        
        relatedEdges.forEach(edge => {
          if (edge.source === id) {
            // 삭제되는 엔티티가 부모(source)인 경우, 자식의 FK 제거
            const childNodeId = edge.target;
            const childNode = updatedNodes.find(node => node.id === childNodeId);
            
            if (childNode && childNode.type === 'entity') {
              const childColumns = childNode.data.columns || [];
              
              // 삭제될 FK 컬럼들 찾기
              const deletedFkColumns = childColumns.filter((col: any) => 
                col.fk && col.parentEntityId === id
              );
              
              // FK 컬럼들 삭제
              const filteredColumns = childColumns.filter((col: any) => 
                !(col.fk && col.parentEntityId === id)
              );
              
              // 자식 노드 업데이트
              updatedNodes = updatedNodes.map(node => {
                if (node.id === childNodeId) {
                  return { ...node, data: { ...node.data, columns: filteredColumns } };
                }
                return node;
              });
              
              // 삭제된 FK가 PK이기도 한 경우 손자로 전파
              const deletedPkFkColumns = deletedFkColumns.filter((col: any) => col.pk);
              if (deletedPkFkColumns.length > 0) {
                deletedPkFkColumns.forEach((fkCol: any) => {
                  const propagationResult = propagateColumnDeletion(
                    childNodeId,
                    fkCol,
                    updatedNodes,
                    updatedEdges,
                    []
                  );
                  updatedNodes = propagationResult.updatedNodes;
                  updatedEdges = propagationResult.updatedEdges;
                });
              }
            }
          }
        });

        toast.info(`엔티티 ${nodeToDelete.data.label}이(가) 삭제되었습니다.`);

        return {
          nodes: updatedNodes,
          edges: updatedEdges,
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
          isBottomPanelOpen: false, // 엔티티 삭제시 하단 패널 자동 닫힘
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
    
    // 히스토리 저장 (변경 후)
    if (nodeToDelete) {
      const currentState = get();
      const metadata = nodeToDelete.type === 'entity' ? {
        name: nodeToDelete.data.label,
        physicalName: nodeToDelete.data.physicalName,
        comment: nodeToDelete.data.comment,
        columns: nodeToDelete.data.columns || [],
        position: nodeToDelete.position
      } : { 
        name: nodeToDelete.data.label 
      };
      
      currentState.saveHistoryState(
        nodeToDelete.type === 'entity' ? HISTORY_ACTIONS.DELETE_ENTITY :
        nodeToDelete.type === 'comment' ? HISTORY_ACTIONS.DELETE_COMMENT :
        nodeToDelete.type === 'image' ? HISTORY_ACTIONS.DELETE_IMAGE :
        HISTORY_ACTIONS.DELETE_COMMENT, // 기본값
        metadata
      );
    }
    
    // 자동저장 제거 - 수동 저장만 사용
  },

  deleteEdge: (id, skipHistory = false) => {
    set((state) => {
      const edgeToDelete = state.edges.find(edge => edge.id === id);
      if (!edgeToDelete) return state;

      // 관계선 삭제 시 자식 엔티티의 FK만 제거 (부모 PK는 유지)
      const sourceNode = state.nodes.find(node => node.id === edgeToDelete.source);
      const targetNode = state.nodes.find(node => node.id === edgeToDelete.target);

      if (sourceNode && targetNode && sourceNode.type === 'entity' && targetNode.type === 'entity') {
        let updatedNodes = state.nodes;
        let updatedEdges = state.edges.filter(edge => edge.id !== id);
        
        // 타겟 엔티티의 컬럼들 가져오기
        const targetColumns = targetNode.data.columns || [];
        
        // 🎯 복합키 관계 처리: 같은 부모-자식 관계의 모든 FK 컬럼 찾기
        const allRelatedFks = targetColumns.filter((col: any) => 
          col.fk && col.parentEntityId === edgeToDelete.source
        );
        
        console.log('🗑️ 관계선 삭제 - FK 분석:', {
          edgeId: id,
          sourceEntity: sourceNode.data.label,
          targetEntity: targetNode.data.label,
          targetHandle: edgeToDelete.targetHandle,
          allRelatedFks: allRelatedFks.map(fk => ({ name: fk.name, parentColumnId: fk.parentColumnId }))
        });
        
        // 복합키 vs 단일키 다중참조 판별
        const parentColumnGroups = allRelatedFks.reduce((groups: any, fk: any) => {
          const key = fk.parentColumnId;
          groups[key] = (groups[key] || 0) + 1;
          return groups;
        }, {});
        
        const groupSizes = Object.values(parentColumnGroups) as number[];
        const isCompositeKey = groupSizes.every((size: number) => size === 1) && groupSizes.length > 1;
        
        console.log('🗑️ 관계 타입 판별:', {
          parentColumnGroups,
          groupSizes,
          isCompositeKey
        });
        
        let fkColumnsToRemove: any[] = [];
        
        if (isCompositeKey) {
          // 복합키: 모든 FK 컬럼 삭제
          fkColumnsToRemove = allRelatedFks;
          console.log('🗑️ 복합키 관계 - 모든 FK 삭제:', fkColumnsToRemove.map(fk => fk.name));
        } else {
          // 단일키 다중참조: 특정 FK만 삭제 (기존 로직)
          let targetFkColumnName = null;
          if (edgeToDelete.targetHandle && edgeToDelete.targetHandle !== 'left' && edgeToDelete.targetHandle !== 'right') {
            const handleParts = edgeToDelete.targetHandle.split('-');
            if (handleParts.length >= 2) {
              targetFkColumnName = handleParts.slice(0, -1).join('-');
            }
          }
          
          if (targetFkColumnName) {
            const specificFk = allRelatedFks.find(fk => fk.name === targetFkColumnName);
            if (specificFk) {
              fkColumnsToRemove = [specificFk];
            }
          }
          
          // 특정 FK를 찾지 못했으면 첫 번째 FK 사용
          if (fkColumnsToRemove.length === 0 && allRelatedFks.length > 0) {
            fkColumnsToRemove = [allRelatedFks[0]];
          }
          
          console.log('🗑️ 단일키 관계 - 특정 FK 삭제:', fkColumnsToRemove.map(fk => fk.name));
        }
        
        // 자식 엔티티에서 해당 FK 컬럼들 제거
        if (fkColumnsToRemove.length > 0) {
          const removedFkIds = fkColumnsToRemove.map(fk => fk.id);
          
          updatedNodes = updatedNodes.map(node => {
            if (node.id === edgeToDelete.target) {
              const filteredColumns = node.data.columns?.filter((col: any) => 
                !removedFkIds.includes(col.id)
              ) || [];

              return { ...node, data: { ...node.data, columns: filteredColumns } };
            }
            return node;
          });
          
          // 삭제된 FK들 중 PK인 것들에 대해 연쇄적으로 하위 관계들도 해제
          const deletedFkPkColumns = fkColumnsToRemove.filter(fk => fk.pk);
          if (deletedFkPkColumns.length > 0) {
            console.log('🔄 삭제된 FK+PK 컬럼들 - 손자로 연쇄 삭제:', deletedFkPkColumns.map(fk => fk.name));
            
            const cascadeResult = propagateRelationshipTypeChange(
              edgeToDelete.target,
              deletedFkPkColumns,
              updatedNodes,
              updatedEdges,
              []
            );
            updatedNodes = cascadeResult.updatedNodes;
            updatedEdges = cascadeResult.updatedEdges;
            
            // 연쇄 관계 토스트 메시지 표시
            if (cascadeResult.toastMessages.length > 0) {
              cascadeResult.toastMessages.forEach(message => {
                setTimeout(() => toast.info(message), 200);
              });
            }
          }
          
          const relationshipType = isCompositeKey ? '복합키' : '단일키';
          toast.info(`${sourceNode.data.label}과 ${targetNode.data.label} 간의 ${relationshipType} 관계가 제거되었습니다. (${fkColumnsToRemove.length}개 FK 삭제)`);
        } else {
          // FK를 찾지 못한 경우 관계선만 삭제
          toast.info(`${sourceNode.data.label}과 ${targetNode.data.label} 간의 관계선이 제거되었습니다.`);
        }

        return {
          nodes: updatedNodes,
          edges: updatedEdges,
          selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
        };
      }

      return {
        edges: state.edges.filter(edge => edge.id !== id),
        selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
      };
    });
    
    // 관계선 삭제 후 히스토리 저장 (skipHistory가 false일 때만)
    if (!skipHistory) {
      get().saveHistoryState(HISTORY_ACTIONS.DELETE_RELATIONSHIP);
    }
    
    // 자동저장 제거 - 수동 저장만 사용
  },

  deleteSelected: () => {
    const state = get();
    let hasChanges = false;
    if (state.selectedNodeId) {
      get().deleteNode(state.selectedNodeId);
      hasChanges = true;
    } else if (state.selectedEdgeId) {
      get().deleteEdge(state.selectedEdgeId);
      hasChanges = true;
    }
    
    // 자동저장 제거 - 수동 저장만 사용
  },
  setNodes: (nodes) => {
    set({ nodes });
    // 자동저장 제거 - 수동 저장만 사용
  },
  setEdges: (edges) => {
    set({ edges });
    // 자동저장 제거 - 수동 저장만 사용
  },
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
        return state; // 상태 변경 없이 반환 (히스토리 저장 안됨)
      }

      // 여러 관계 허용을 위해 기존 관계 검색 로직 비활성화
      // TODO: 향후 더 정교한 조건으로 실제 중복 관계만 탐지하도록 개선
      let existingEdge = null;

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
          return state; // 상태 변경 없이 반환 (히스토리 저장 안됨)
        }

        // 셀프 관계에서 식별자 관계 체크
        if (connection.source === connection.target) {
          const relationshipType = state.connectionMode;
          const isIdentifyingRelationship = relationshipType === 'oneToOneIdentifying' || relationshipType === 'oneToManyIdentifying';
          
          if (isIdentifyingRelationship) {
            toast.error('자기 자신과의 관계에서는 식별자 관계를 설정할 수 없습니다. 비식별자 관계만 가능합니다.');
            return state; // 상태 변경 없이 반환 (히스토리 저장 안됨)
          }
        }

        // 식별자 관계의 경우 PK 선택, 비식별자 관계의 경우 일반 컬럼으로 FK 생성
        const relationshipType = state.connectionMode;
        const isIdentifyingRelationship = relationshipType === 'oneToOneIdentifying' || relationshipType === 'oneToManyIdentifying';

        let newTargetColumns = [...(targetNode.data.columns || [])];
        
        // FK 관계의 키타입 및 그룹 ID 결정
        const keyType = sourcePkColumns.length > 1 ? 'composite' : 'single';
        const relationshipGroupId = `rel_${sourceNode.id}_${targetNode.id}_${Date.now()}`;
        
        // 🚨 자기참조 관계에서 중복 FK 생성 사전 검사
        if (connection.source === connection.target) {
          const alreadyExistingFks = sourcePkColumns.filter((sourcePkColumn: any) => {
            return newTargetColumns.find(col => 
              col.fk && 
              col.parentEntityId === sourceNode.id && 
              (col.parentColumnId === sourcePkColumn.id || col.parentColumnId === sourcePkColumn.name)
            );
          });
          
          if (alreadyExistingFks.length > 0) {
            console.log('🚨 자기참조 FK 중복 생성 전체 방지:', {
              attemptedPkColumns: sourcePkColumns.map((col: any) => col.name),
              alreadyExistingFks: alreadyExistingFks.map((col: any) => col.name)
            });
            // 자기참조 관계에서 이미 FK가 존재하면 전체 관계 생성을 중단
            toast.error('이미 동일한 자기참조 관계가 존재합니다.');
            return state; // 상태 변경 없이 반환
          }
        }

        // 여러 PK가 있는 경우 모두 FK로 추가
        sourcePkColumns.forEach((sourcePkColumn: any) => {
          const baseFkColumnName = `${sourceNode.data.label.toLowerCase()}_${sourcePkColumn.name}`;
          
          // 고유한 FK 컬럼명 생성 (중복 방지)
          const fkColumnName = generateUniqueFkColumnName(baseFkColumnName, newTargetColumns);
          
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
            
            // 부모 컬럼의 논리명과 주석 확인
            const parentLogicalName = sourcePkColumn.logicalName || '';
            const parentComment = sourcePkColumn.comment || '';
            
            // FK 컬럼의 논리명 설정 (부모에 논리명이 있으면 복사, 없으면 빈 상태)
            const fkLogicalName = parentLogicalName || '';
            
            // FK 컬럼의 주석 설정
            let fkComment = '';
            if (parentComment) {
              // 부모에 주석이 있으면 그대로 복사
              fkComment = parentComment;
            } else {
              // 부모에 주석이 없으면 한국어 기본값 설정
              fkComment = `외래키 참조: ${sourceNode.data.label}.${sourcePkColumn.name}`;
            }
            
            if (existingFkIndex === -1) {
              newTargetColumns.push({ 
                id: `${Date.now()}_${Math.random()}`,
                name: fkColumnName, 
                type: sourcePkColumn.type, 
                pk: true, 
                fk: true,
                uq: false, // 식별자 관계에서는 UQ 설정하지 않음
                comment: fkComment,
                logicalName: fkLogicalName,
                // FK 관계 추적을 위한 메타데이터 추가 (문제 6 해결)
                parentEntityId: sourceNode.id,
                parentColumnId: sourcePkColumn.id || sourcePkColumn.name,
                // 키타입 및 관계 그룹 ID 추가
                keyType: keyType,
                relationshipGroupId: relationshipGroupId
              });
            } else {
              newTargetColumns[existingFkIndex] = { 
                ...newTargetColumns[existingFkIndex], 
                pk: true, 
                fk: true,
                uq: false, // 식별자 관계 설정 시 UQ 해제
                type: sourcePkColumn.type, // 타입 동기화
                comment: fkComment,
                logicalName: fkLogicalName,
                // FK 관계 추적을 위한 메타데이터 추가 (문제 6 해결)
                parentEntityId: sourceNode.id,
                parentColumnId: sourcePkColumn.id || sourcePkColumn.name,
                // 키타입 및 관계 그룹 ID 추가
                keyType: keyType,
                relationshipGroupId: relationshipGroupId
              };
            }
          } else {
            // 비식별자 관계: FK는 일반 컬럼
            
            // 부모 컬럼의 논리명과 주석 확인
            const parentLogicalName = sourcePkColumn.logicalName || '';
            const parentComment = sourcePkColumn.comment || '';
            
            // FK 컬럼의 논리명 설정 (부모에 논리명이 있으면 복사, 없으면 빈 상태)
            const fkLogicalName = parentLogicalName || '';
            
            // FK 컬럼의 주석 설정
            let fkComment = '';
            if (parentComment) {
              // 부모에 주석이 있으면 그대로 복사
              fkComment = parentComment;
            } else {
              // 부모에 주석이 없으면 한국어 기본값 설정
              fkComment = `외래키 참조: ${sourceNode.data.label}.${sourcePkColumn.name}`;
            }
            
            if (existingFkIndex === -1) {
              newTargetColumns.push({ 
                id: `${Date.now()}_${Math.random()}`,
                name: fkColumnName, 
                type: sourcePkColumn.type, 
                pk: false, 
                fk: true,
                uk: false,
                comment: fkComment,
                logicalName: fkLogicalName,
                // FK 관계 추적을 위한 메타데이터 추가 (문제 6 해결)
                parentEntityId: sourceNode.id,
                parentColumnId: sourcePkColumn.id || sourcePkColumn.name,
                // 키타입 및 관계 그룹 ID 추가
                keyType: keyType,
                relationshipGroupId: relationshipGroupId
              });
            } else {
              newTargetColumns[existingFkIndex] = { 
                ...newTargetColumns[existingFkIndex], 
                pk: false, 
                fk: true,
                type: sourcePkColumn.type, // 타입 동기화
                comment: fkComment,
                logicalName: fkLogicalName,
                // FK 관계 추적을 위한 메타데이터 추가 (문제 6 해결)
                parentEntityId: sourceNode.id,
                parentColumnId: sourcePkColumn.id || sourcePkColumn.name,
                // 키타입 및 관계 그룹 ID 추가
                keyType: keyType,
                relationshipGroupId: relationshipGroupId
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

      // 새로운 handle 결정 로직 사용 (각 컬럼별로 개별 계산)
      let sourceHandle: string, targetHandle: string;
      if (sourceNode && targetNode) {
        const handlePositions = determineHandlePositions(sourceNode, targetNode);
        sourceHandle = handlePositions.sourceHandle;
        targetHandle = handlePositions.targetHandle;
      } else {
        // 기본값 (기존 로직)
        const sourceX = sourceNode?.position.x ? sourceNode.position.x + (sourceNode.width ?? 0) / 2 : 0;
        const targetX = targetNode?.position.x ? targetNode.position.x + (targetNode.width ?? 0) / 2 : 0;
        sourceHandle = sourceX <= targetX ? 'right' : 'left';
        targetHandle = sourceX <= targetX ? 'left' : 'right';
      }

      let updatedEdges = state.edges;

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

      // 여러 관계 허용을 위해 기존 관계 업데이트 로직 비활성화
      // 새로 생성된 각 FK 컬럼마다 별도의 관계선 생성
      if (sourceNode && targetNode && sourceNode.type === 'entity' && targetNode.type === 'entity') {
        const sourcePkColumns = sourceNode.data.columns?.filter((col: any) => col.pk) || [];
        const targetUpdatedNode = updatedNodes.find(node => node.id === targetNode.id);
        
        if (targetUpdatedNode) {
          // 이번에 새로 생성된 FK 컬럼들 찾기
          const newlyCreatedFkColumns = targetUpdatedNode.data.columns?.filter((col: any) => 
            col.fk && 
            col.parentEntityId === sourceNode.id &&
            // 이번 관계 생성에서 새로 만들어진 컬럼들 (기존 edges에 없는 handle을 가진 것들)
            !state.edges.some(edge => 
              edge.source === sourceNode.id && 
              edge.target === targetNode.id && 
              (edge.targetHandle?.includes(col.name) || edge.sourceHandle?.includes(col.name))
            )
          ) || [];
          
          console.log('🔍 새로 생성된 FK 컬럼들:', newlyCreatedFkColumns.map((col: any) => col.name));
          
          // 관계선 생성을 위한 keyType 재계산
          const edgeKeyType = sourcePkColumns.length > 1 ? 'composite' : 'single';
          const edgeRelationshipGroupId = `rel_${sourceNode.id}_${targetNode.id}_${Date.now()}`;
          
          console.log('🔍 FK keyType:', edgeKeyType);
          
          if (edgeKeyType === 'composite') {
            // 복합키: 하나의 관계선만 생성
            console.log('🎯 복합키 관계 - 하나의 관계선 생성');
            
            if (newlyCreatedFkColumns.length > 0) {
              // 첫 번째 FK 컬럼을 대표로 사용
              const representativeFk = newlyCreatedFkColumns[0];
              const referencedPkColumn = sourcePkColumns.find((pkCol: any) => 
                pkCol.id === representativeFk.parentColumnId || pkCol.name === representativeFk.parentColumnId
              );
              
              if (referencedPkColumn) {
                const sourceHandleId = createHandleId(referencedPkColumn.name, sourceHandle as 'left' | 'right');
                const targetHandleId = createHandleId(representativeFk.name, targetHandle as 'left' | 'right');
                
                console.log('🎯 복합키 관계선 Handle:', { sourceHandleId, targetHandleId });
                
                const newEdge = {
                  ...connection,
                  id: `${connection.source}-${connection.target}-${edgeRelationshipGroupId}-${Date.now()}`,
                  source: connection.source!,
                  target: connection.target!,
                  sourceHandle: sourceHandleId,
                  targetHandle: targetHandleId,
                  type: getEdgeType(state.connectionMode),
                  markerStart: sourceMarker,
                  markerEnd: targetMarker,
                  data: {
                    relationshipType: edgeKeyType,
                    relationshipGroupId: edgeRelationshipGroupId,
                    fkColumns: newlyCreatedFkColumns.map((fk: any) => fk.name)
                  }
                };
                
                console.log('✅ 복합키 관계선 생성:', newEdge);
                updatedEdges = [...updatedEdges, newEdge];
              }
            }
          } else {
            // 단일키: 각 FK마다 개별 관계선 생성
            console.log('🎯 단일키 관계 - 각 FK마다 관계선 생성');
            
            newlyCreatedFkColumns.forEach((fkColumn: any, index: number) => {
              console.log(`\n--- ${index + 1}번째 FK 컬럼 처리 시작 ---`);
              console.log('🔗 처리 중인 FK 컬럼:', fkColumn);
              
              // 해당 FK가 참조하는 PK 컬럼 찾기
              const referencedPkColumn = sourcePkColumns.find((pkCol: any) => 
                pkCol.id === fkColumn.parentColumnId || pkCol.name === fkColumn.parentColumnId
              );
              
              console.log('🔗 참조하는 PK 컬럼:', referencedPkColumn);
              
              if (referencedPkColumn) {
                console.log(`🔗 ${index + 1}번째 FK 컬럼 관계선 생성:`, fkColumn.name, '→', referencedPkColumn.name);
                
                // 각 컬럼별로 개별 Handle ID 결정 (컬럼 위치에 맞게)
                const sourceHandleId = createHandleId(referencedPkColumn.name, sourceHandle as 'left' | 'right');
                const targetHandleId = createHandleId(fkColumn.name, targetHandle as 'left' | 'right');
                
                console.log('🎯 Handle 정보:', { sourceHandleId, targetHandleId });
                
                // 개별 관계선 생성
                const newEdge = {
                  ...connection,
                  id: `${connection.source}-${connection.target}-${fkColumn.name}-${Date.now()}-${Math.random()}`, // 고유 ID
                  source: connection.source!,
                  target: connection.target!,
                  sourceHandle: sourceHandleId,
                  targetHandle: targetHandleId,
                  type: getEdgeType(state.connectionMode),
                markerStart: sourceMarker,
                markerEnd: targetMarker,
                // 관계선 시각적 구분을 위한 스타일 
                style: {
                  strokeDasharray: index > 0 ? '5,5' : undefined, // 두 번째부터 점선으로
                  strokeWidth: 2 + (index * 0.3), // 약간씩 다른 두께
                },
              };
              
              console.log('✅ 생성할 관계선:', {
                id: newEdge.id,
                source: newEdge.source,
                target: newEdge.target,
                sourceHandle: newEdge.sourceHandle,
                targetHandle: newEdge.targetHandle,
                style: newEdge.style
              });
              
              updatedEdges = addEdge(newEdge, updatedEdges);
              console.log('📊 현재 전체 관계선 개수:', updatedEdges.length);
              } else {
                console.log('❌ 참조하는 PK 컬럼을 찾을 수 없음');
              }
              console.log(`--- ${index + 1}번째 FK 컬럼 처리 완료 ---\n`);
            });
          }
        }
        
        console.log('📊 최종 관계선 개수:', updatedEdges.length);
      } else {
        // 엔티티가 아닌 경우 기본 관계선 생성
        const newEdge = {
          ...connection,
          sourceHandle: sourceHandle,
          targetHandle: targetHandle,
          type: getEdgeType(state.connectionMode),
          markerStart: sourceMarker,
          markerEnd: targetMarker,
        };
        updatedEdges = addEdge(newEdge, state.edges);
      }
      
      // 관계 생성 토스트 메시지 (엔티티 간 관계만)
      if (sourceNode && targetNode && sourceNode.type === 'entity' && targetNode.type === 'entity') {
        const isIdentifying = getEdgeType(state.connectionMode).includes('identifying');
        const relationType = isIdentifying ? '식별자' : '비식별자';
        setTimeout(() => {
          toast.success(`관계생성: ${sourceNode.data.label}과 ${targetNode.data.label} 간에 ${relationType} 관계가 생성되었습니다.`);
        }, 100);
      }

      return { nodes: updatedNodes, edges: updatedEdges };
    });
    
    // 관계 생성 후 현재 선택된 엔티티가 있으면 하이라이트 업데이트
    setTimeout(() => {
      get().updateAllHighlights();
    }, 0);
    
    // 관계선 생성 후 히스토리 저장
    const finalState = get();
    const sourceNode = finalState.nodes.find((node) => node.id === connection.source);
    const targetNode = finalState.nodes.find((node) => node.id === connection.target);
    
    if (sourceNode && targetNode) {
      //console.log('💾 관계선 생성 히스토리 저장:', sourceNode.data.label, '→', targetNode.data.label);
      finalState.saveHistoryState(HISTORY_ACTIONS.CREATE_RELATIONSHIP, {
        sourceLabel: sourceNode.data.label,
        targetLabel: targetNode.data.label
      });
    }
    
    // 자동저장 제거 - 수동 저장만 사용
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
  
  // 히스토리 관련 상태 초기값
  historyManager: new HistoryManager(),
  canUndo: false,
  canRedo: false,
  
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
    
    // nodeOrigin=[0, 0]이므로 position이 노드 왼쪽 상단 모서리
    const draggedBounds = {
      left: position.x,
      right: position.x + draggedWidth,
      top: position.y,
      bottom: position.y + draggedHeight,
      centerX: position.x + draggedWidth / 2,
      centerY: position.y + draggedHeight / 2
    };
    
    let bestVerticalGuide: { guide: SnapGuide; distance: number } | null = null;
    let bestHorizontalGuide: { guide: SnapGuide; distance: number } | null = null;
    
    // 다른 노드들과 비교
    nodes.forEach(node => {
      if (node.id === draggedNodeId) return;
      
      const nodeWidth = node.width || 280;
      const nodeHeight = node.height || 120;
      
      // nodeOrigin=[0, 0]이므로 position이 노드 왼쪽 상단 모서리
      const nodeBounds = {
        left: node.position.x,
        right: node.position.x + nodeWidth,
        top: node.position.y,
        bottom: node.position.y + nodeHeight,
        centerX: node.position.x + nodeWidth / 2,
        centerY: node.position.y + nodeHeight / 2
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
  hideEntity: (entityId: string) => {
    set((state) => {
      const newHidden = new Set([...state.hiddenEntities, entityId]);
      return { hiddenEntities: newHidden };
    });
    // 자동저장 제거 - 수동 저장만 사용
  },
  showEntity: (entityId: string) => {
    set((state) => {
      const newHidden = new Set(state.hiddenEntities);
      newHidden.delete(entityId);
      return { hiddenEntities: newHidden };
    });
    // 자동저장 제거 - 수동 저장만 사용
  },
  hideAllEntities: () => {
    set((state) => ({
      hiddenEntities: new Set(state.nodes.filter(n => n.type === 'entity').map(n => n.id))
    }));
    // 자동저장 제거 - 수동 저장만 사용
  },
  showAllEntities: () => {
    set({ hiddenEntities: new Set() });
    // 자동저장 제거 - 수동 저장만 사용
  },
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
    
    // 엔티티가 없으면 경고 메시지 표시
    if (entityNodes.length === 0) {
      toast.warning('내보낼 엔티티가 없습니다. 먼저 엔티티를 생성해주세요.');
      return;
    }
    
    // 컬럼이 없는 엔티티가 있는지 확인
    const emptyEntityNodes = entityNodes.filter(node => {
      const columns = node.data.columns || [];
      return columns.length === 0;
    });
    
    if (emptyEntityNodes.length > 0) {
      // 첫 번째 컬럼이 없는 엔티티에 포커스
      const firstEmptyEntity = emptyEntityNodes[0];
      get().setSelectedNodeId(firstEmptyEntity.id);
      get().setBottomPanelOpen(true);
      
      // 엔티티를 화면 중앙으로 이동
      const nodeElement = document.querySelector(`[data-id="${firstEmptyEntity.id}"]`) as HTMLElement;
      if (nodeElement) {
        const reactFlowInstance = (window as any).reactFlowInstance;
        if (reactFlowInstance) {
          reactFlowInstance.fitView({
            nodes: [firstEmptyEntity],
            padding: 0.2,
            duration: 500
          });
        }
      }
      
      setTimeout(() => {
        toast.error(`컬럼이 없는 엔티티가 있습니다. (ID: ${firstEmptyEntity.id})`);
      }, 200);
      return;
    }
    
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
        
        // 빈 데이터타입 검사
        if (!dataType || dataType.trim() === '') {
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
                padding: 0.2,
                duration: 500
              });
            }
          }
          
          setTimeout(() => {
            toast.error(`테이블 '${node.data.label}'의 컬럼 '${column.name}': 데이터타입이 비어있습니다. 데이터타입을 입력해주세요.`);
          }, 200);
          return;
        }
        
        // 데이터타입 형식 검사
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
              
              // ON DELETE와 ON UPDATE 옵션 추가 (기본값: NO ACTION)
              const onDelete = fkCol.onDelete || 'NO ACTION';
              const onUpdate = fkCol.onUpdate || 'NO ACTION';
              sql += ` ON DELETE ${onDelete} ON UPDATE ${onUpdate}`;
              
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
  
  updateNodeData: (nodeId: string, newData: any, deletedColumn?: any) => {
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
      let newColumns = newData.columns || [];
      const toastMessages: string[] = [];
      
      // 🚨 자기참조 FK PK 변경 사전 차단 (다른 모든 로직보다 우선 처리)
      const selfReferencingFkPkAttempts = newColumns.filter((newCol: any) => {
        if (!newCol.fk || !newCol.pk || newCol.parentEntityId !== nodeId) return false;
        const oldCol = oldColumns.find((oldCol: any) => oldCol.id === newCol.id);
        return oldCol && !oldCol.pk; // 이전에는 PK가 아니었는데 지금 PK로 변경하려는 경우
      });
      
      if (selfReferencingFkPkAttempts.length > 0) {
        console.log('🚨 자기참조 FK PK 변경 사전 차단:', selfReferencingFkPkAttempts.map((col: any) => col.name));
        
        // 자기참조 FK의 PK 상태를 강제로 false로 되돌림
        newColumns = newColumns.map((col: any) => {
          if (selfReferencingFkPkAttempts.some((attempt: any) => attempt.id === col.id)) {
            console.log(`🔄 자기참조 FK "${col.name}" PK 사전 차단: true → false`);
            return { 
              ...col, 
              pk: false,
              nn: false // PK 해제 시 NN도 해제
            };
          }
          return col;
        });
        
        // newData.columns도 업데이트
        newData = { ...newData, columns: newColumns };
        
        // 사용자에게 알림 메시지 표시 (중복 방지)
        selfReferencingFkPkAttempts.forEach((col: any) => {
          const toastId = `self-ref-pk-prevention-early-${nodeId}-${col.name}`;
          setTimeout(() => {
            toast.warning(`자기관계에서는 FK 컬럼(${col.name})을 PK로 설정할 수 없습니다. 항상 비식별자 관계를 유지합니다.`, {
              toastId: toastId,
              autoClose: 3000
            });
          }, 100);
        });
      }
      
      // PK 컬럼 이름 변경 감지 (자식 FK의 parentColumnId 업데이트를 위함)
      const renamedPkColumns = oldColumns.filter((oldCol: any) => {
        if (!oldCol.pk) return false;
        const newCol = newColumns.find((newCol: any) => newCol.id === oldCol.id);
        return newCol && newCol.pk && oldCol.name !== newCol.name; // PK이면서 이름이 변경됨
      }).map((oldCol: any) => {
        const newCol = newColumns.find((newCol: any) => newCol.id === oldCol.id);
        return { oldColumn: oldCol, newColumn: newCol };
      });

      // FK 컬럼 삭제 감지 - 특정 FK 컬럼의 ID 기준으로만 판단
      const deletedFkColumns = oldColumns.filter((oldCol: any) => {
        if (!oldCol.fk || !oldCol.parentEntityId) return false;
        const stillExists = newColumns.find((newCol: any) => 
          newCol.id === oldCol.id  // 오직 같은 ID의 컬럼만 확인
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

      // PK 컬럼의 데이터타입 변경 감지 (자식, 손자로 전파 필요)
      const dataTypeChangedPkColumns = oldColumns.filter((oldCol: any) => {
        if (!oldCol.pk) return false;
        const newCol = newColumns.find((newCol: any) => newCol.id === oldCol.id);
        return newCol && newCol.pk && (oldCol.dataType !== newCol.dataType || oldCol.type !== newCol.type);
      }).map((oldCol: any) => {
        const newCol = newColumns.find((newCol: any) => newCol.id === oldCol.id);
        return { oldColumn: oldCol, newColumn: newCol };
      });

      // PK 상태 변경 감지 (키타입 업데이트를 위함)
      const pkStatusChangedColumns = oldColumns.filter((oldCol: any) => {
        const newCol = newColumns.find((newCol: any) => newCol.id === oldCol.id);
        return newCol && (oldCol.pk !== newCol.pk);
      }).map((oldCol: any) => {
        const newCol = newColumns.find((newCol: any) => newCol.id === oldCol.id);
        return { oldColumn: oldCol, newColumn: newCol };
      });

            let finalNodes = updatedNodes;
      let finalEdges = state.edges;
      
      // deletedColumn이 전달된 경우 (Layout.tsx에서 PK 해제/UQ 체크로 인한 삭제)
      if (deletedColumn && deletedColumn.pk) {
        console.log(`🗑️ Layout에서 PK 삭제 감지: ${deletedColumn.name}`, deletedColumn);
        
        // 올바른 복합키 관계 판단: 부모에서 삭제될 PK를 제외한 나머지 PK 확인
        const parentNode = finalNodes.find(n => n.id === nodeId);
        if (!parentNode) {
          return { nodes: finalNodes, edges: finalEdges };
        }
        
        const remainingParentPks = parentNode.data.columns.filter((col: any) => 
          col.pk && col.id !== deletedColumn.id
        );
        
        console.log(`🔍 복합키 관계 판단: ${remainingParentPks.length > 0} (남은 PK 개수: ${remainingParentPks.length})`);
        
        const isCompositeKeyRelation = remainingParentPks.length > 0;
        
        if (isCompositeKeyRelation) {
          // 복합키 관계: 해당 PK를 참조하는 FK만 삭제, 관계선 유지
          const childEdges = finalEdges.filter(edge => edge.source === nodeId);
          
          childEdges.forEach(edge => {
            const childNode = finalNodes.find(n => n.id === edge.target);
            if (childNode && childNode.type === 'entity') {
              const childColumns = childNode.data.columns || [];
              
              // 해당 특정 PK를 참조하는 FK만 찾기
              const targetFkColumns = childColumns.filter((col: any) => 
                col.fk && 
                col.parentEntityId === nodeId && 
                (col.parentColumnId === deletedColumn.id || col.parentColumnId === deletedColumn.name)
              );
              
              if (targetFkColumns.length > 0) {
                console.log(`🎯 복합키 관계: ${edge.target}에서 ${targetFkColumns.length}개 FK 선택적 삭제`);
                
                // 해당 FK들만 삭제
                const updatedChildColumns = childColumns.filter((col: any) => 
                  !targetFkColumns.some((fkCol: any) => fkCol.id === col.id)
                );
                
                const childNodeIndex = finalNodes.findIndex(n => n.id === edge.target);
                if (childNodeIndex !== -1) {
                  finalNodes[childNodeIndex] = {
                    ...finalNodes[childNodeIndex],
                    data: {
                      ...finalNodes[childNodeIndex].data,
                      columns: updatedChildColumns
                    }
                  };
                }
                
                // 손자 엔티티로 재귀 전파 (삭제된 FK가 PK였다면)
                targetFkColumns.forEach((deletedFk: any) => {
                  if (deletedFk.pk) {
                    console.log(`🔄 손자로 재귀 전파 시작: ${deletedFk.name} (from ${edge.target})`);
                    const grandchildResult = propagateColumnDeletion(
                      edge.target,
                      deletedFk,
                      finalNodes,
                      finalEdges,
                      toastMessages
                    );
                    console.log(`🔄 손자로 재귀 전파 완료: 노드 ${grandchildResult.updatedNodes.length}개, 엣지 ${grandchildResult.updatedEdges.length}개`);
                    finalNodes = grandchildResult.updatedNodes;
                    finalEdges = grandchildResult.updatedEdges;
                    toastMessages.push(...grandchildResult.toastMessages);
                  } else {
                    console.log(`⚠️ 삭제된 FK가 PK가 아님: ${deletedFk.name} (pk: ${deletedFk.pk})`);
                  }
                });
              }
            }
          });
          
          console.log(`🔗 관계선 유지: 부모에 ${remainingParentPks.length}개 PK 남음`);
          
        } else {
          // 단일키 관계: 모든 FK 삭제, 관계선 삭제
          const childEdges = finalEdges.filter(edge => edge.source === nodeId);
          
          childEdges.forEach(edge => {
            const childNode = finalNodes.find(n => n.id === edge.target);
            if (childNode && childNode.type === 'entity') {
              const childColumns = childNode.data.columns || [];
              
              // 부모를 참조하는 모든 FK 찾기
              const allFkColumns = childColumns.filter((col: any) => 
                col.fk && col.parentEntityId === nodeId
              );
              
              if (allFkColumns.length > 0) {
                console.log(`🗑️ 단일키 관계: ${edge.target}에서 ${allFkColumns.length}개 FK 전체 삭제`);
                
                // 모든 FK 삭제
                const updatedChildColumns = childColumns.filter((col: any) => 
                  !allFkColumns.some((fkCol: any) => fkCol.id === col.id)
                );
                
                const childNodeIndex = finalNodes.findIndex(n => n.id === edge.target);
                if (childNodeIndex !== -1) {
                  finalNodes[childNodeIndex] = {
                    ...finalNodes[childNodeIndex],
                    data: {
                      ...finalNodes[childNodeIndex].data,
                      columns: updatedChildColumns
                    }
                  };
                }
                
                // 손자 엔티티로 재귀 전파 (삭제된 FK가 PK였다면)
                allFkColumns.forEach((deletedFk: any) => {
                  if (deletedFk.pk) {
                    console.log(`🔄 단일키 관계 - 손자로 재귀 전파 시작: ${deletedFk.name} (${edge.target})`);
                    const grandchildResult = propagateColumnDeletion(
                      edge.target,
                      deletedFk,
                      finalNodes,
                      finalEdges,
                      toastMessages
                    );
                    console.log(`🔄 단일키 관계 - 손자로 재귀 전파 완료: 노드 ${grandchildResult.updatedNodes.length}개, 엣지 ${grandchildResult.updatedEdges.length}개`);
                    finalNodes = grandchildResult.updatedNodes;
                    finalEdges = grandchildResult.updatedEdges;
                    toastMessages.push(...grandchildResult.toastMessages);
                  } else {
                    console.log(`⚠️ 단일키 관계 - 삭제된 FK가 PK가 아님: ${deletedFk.name} (pk: ${deletedFk.pk})`);
                  }
                });
              }
            }
          });
          
          // 관계선 삭제
          finalEdges = finalEdges.filter(edge => edge.source !== nodeId);
          console.log(`❌ 관계선 삭제: 부모에 PK 없음`);
        }
        
        // 토스트 메시지 표시
        toastMessages.forEach((msg, index) => {
          setTimeout(() => toast.info(msg), 100 + (index * 50));
        });
        
        return { nodes: finalNodes, edges: finalEdges };
      }

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
              // 올바른 복합키 관계 판별: 서로 다른 부모 PK 컬럼을 참조하는지 확인
              const sameFkColumns = newColumns.filter((col: any) => 
                col.fk && col.parentEntityId === parentEntityId
              );
              
              const uniqueParentColumnIds = new Set(
                sameFkColumns.map((col: any) => col.parentColumnId).filter(Boolean)
              );
              
              const isCompositeKeyRelation = uniqueParentColumnIds.size > 1;
              
              if (isCompositeKeyRelation) {
                // 진짜 복합키 관계: 모든 FK가 삭제되었을 때만 관계선 제거
                const remainingFKs = newColumns.filter((col: any) => 
                  col.fk && col.parentEntityId === parentEntityId
                );
                
                if (remainingFKs.length === 0) {
                  finalEdges = finalEdges.filter(e => e.id !== relatedEdge.id);
                }
              } else {
                // 단일PK 다중참조: FK 하나 삭제해도 관계 유지 (다른 FK들이 남아있으면)
                const remainingFKs = newColumns.filter((col: any) => 
                  col.fk && col.parentEntityId === parentEntityId
                );
                
                if (remainingFKs.length === 0) {
                  // 모든 FK가 삭제되었을 때만 관계선 제거
                  finalEdges = finalEdges.filter(e => e.id !== relatedEdge.id);
                }
                // 하나라도 남아있으면 관계 유지
              }
            }
          }
        });
      }

      // 기존 로직 계속 처리 (deletedColumn이 없는 경우)
      
      // 특정 PK 제거/상태변경에 따른 선택적 FK 삭제 및 keyType 업데이트
      if (pkStatusChangedColumns.length > 0) {
        pkStatusChangedColumns.forEach(({ oldColumn, newColumn }: any) => {
          // PK에서 일반 컬럼으로 변경된 경우 (pk: true → false)
          if (oldColumn.pk && !newColumn.pk) {
            // 해당 PK를 참조하는 자식 엔티티의 FK들을 선택적으로 삭제
            const childEdges = finalEdges.filter(edge => edge.source === nodeId);
            
            childEdges.forEach(edge => {
              const childNode = finalNodes.find(n => n.id === edge.target);
              if (childNode && childNode.type === 'entity') {
                const childColumns = childNode.data.columns || [];
                
                // 해당 특정 PK 컬럼을 참조하는 FK만 찾기
                const targetFkColumns = childColumns.filter((col: any) => 
                  col.fk && 
                  col.parentEntityId === nodeId && 
                  (col.parentColumnId === oldColumn.id || col.parentColumnId === oldColumn.name)
                );
                
                if (targetFkColumns.length > 0) {
                  // 해당 FK들만 삭제
                  const updatedChildColumns = childColumns.filter((col: any) => 
                    !targetFkColumns.some((fkCol: any) => fkCol.id === col.id)
                  );
                  
                  // 남은 FK들의 keyType 재계산
                  const remainingFkColumns = updatedChildColumns.filter((col: any) => 
                    col.fk && col.parentEntityId === nodeId
                  );
                  
                  // 남은 FK가 1개면 single, 2개 이상이면 composite
                  const newKeyType = remainingFkColumns.length > 1 ? 'composite' : 'single';
                  
                  // 남은 FK들의 keyType 업데이트
                  const finalChildColumns = updatedChildColumns.map((col: any) => {
                    if (remainingFkColumns.some((fkCol: any) => fkCol.id === col.id)) {
                      return { 
                        ...col, 
                        keyType: newKeyType
                      };
                    }
                    return col;
                  });
                  
                  // 자식 노드 업데이트
                  finalNodes = finalNodes.map(node => 
                    node.id === edge.target 
                      ? { ...node, data: { ...node.data, columns: finalChildColumns } }
                      : node
                  );
                  
                  // 모든 FK가 삭제된 경우 관계선도 제거
                  if (remainingFkColumns.length === 0) {
                    finalEdges = finalEdges.filter(e => e.id !== edge.id);
                  }
                }
              }
            });
          }
        });
      }

      // PK 컬럼의 데이터타입 변경에 따른 하위 계층으로의 연쇄 전파
      if (dataTypeChangedPkColumns.length > 0) {
        dataTypeChangedPkColumns.forEach(({ oldColumn, newColumn }: any) => {
          //console.log(`🔄 PK 컬럼 데이터타입 변경 감지: ${oldColumn.name} (${oldColumn.dataType || oldColumn.type} -> ${newColumn.dataType || newColumn.type})`);
          
          // 재귀적으로 하위 계층까지 전파하여 데이터타입 변경
          const propagationResult = propagateDataTypeChange(
            nodeId,
            newColumn,
            newColumn.dataType || newColumn.type,
            finalNodes,
            finalEdges,
            []
          );
          finalNodes = propagationResult.updatedNodes;
        });
      }

      // PK 상태 변경에 따른 자식 엔티티들의 FK keyType 업데이트 (PK 삭제 제외, 상태 토글만)
      if (pkStatusChangedColumns.length > 0) {
        // 현재 엔티티의 PK 개수 계산
        const currentPkColumns = newColumns.filter((col: any) => col.pk);
        const newKeyType = currentPkColumns.length > 1 ? 'composite' : 'single';
        
        // 해당 엔티티를 부모로 하는 모든 자식 엔티티의 FK들 업데이트
        const childEdges = finalEdges.filter(edge => edge.source === nodeId);
        
        pkStatusChangedColumns.forEach(({ oldColumn, newColumn }: any) => {
          // PK 삭제는 deletedPkColumns에서 처리하므로, 여기서는 제외
          // 컬럼이 아직 존재하면서 PK 상태만 변경된 경우만 처리
          const columnStillExists = newColumns.find((col: any) => col.id === oldColumn.id);
          
          if (columnStillExists) {
            childEdges.forEach(edge => {
              const childNode = finalNodes.find(n => n.id === edge.target);
              if (childNode && childNode.type === 'entity') {
                const childColumns = childNode.data.columns || [];
                
                // 해당 부모 엔티티를 참조하는 FK 컬럼들 찾기
                const relatedFkColumns = childColumns.filter((col: any) => 
                  col.fk && col.parentEntityId === nodeId
                );
                
                if (relatedFkColumns.length > 0) {
                  // FK 컬럼들의 keyType 업데이트
                  const updatedChildColumns = childColumns.map((col: any) => {
                    if (relatedFkColumns.some((fkCol: any) => fkCol.id === col.id)) {
                      return { 
                        ...col, 
                        keyType: newKeyType
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
          }
        });
      }



      // FK 컬럼의 PK 상태 변경에 따른 관계 타입 업데이트
      if (fkPkChangedColumns.length > 0) {
        console.log('🔄 FK-PK 상태 변경된 컬럼들:', fkPkChangedColumns.map((col: any) => ({ 
          name: col.name, 
          pk: col.pk, 
          parentEntityId: col.parentEntityId,
          isSelf: col.parentEntityId === nodeId 
        })));
        
        fkPkChangedColumns.forEach((changedCol: any) => {
          const parentEntityId = changedCol.parentEntityId;
          const newCol = newColumns.find((col: any) => col.id === changedCol.id);
          
          if (newCol && parentEntityId) {
            // 🚨 자기관계(self-referencing) 완전 스킵 - Layout.tsx에서 이미 차단됨
            const isSelfRef = parentEntityId === nodeId;
            
            if (isSelfRef) {
              console.log('🚨 자기관계 FK PK 변경 감지 - useStore.ts에서 스킵:', {
                columnName: newCol.name,
                parentEntityId: parentEntityId,
                targetNodeId: nodeId,
                note: 'Layout.tsx에서 이미 차단되어야 함'
              });
              return; // 자기관계는 완전히 스킵
            }
            
            // 일반 관계 (자기관계가 아닌 경우)의 기존 로직
            // 해당 부모 엔티티와의 관계선 찾기
            const relatedEdge = finalEdges.find(edge => 
              edge.source === parentEntityId && edge.target === nodeId
            );
            
            if (relatedEdge) {
              // 부모 엔티티 정보 가져오기
              const parentNode = state.nodes.find(n => n.id === parentEntityId);
              
              if (parentNode) {
                // 복합키 관계 여부 판별 개선: 
                // 현재 변경되는 컬럼을 제외하고 같은 부모를 참조하는 다른 FK들을 확인
                const otherFkColumns = newColumns.filter((col: any) => 
                  col.fk && 
                  col.parentEntityId === parentEntityId &&
                  col.id !== newCol.id  // 현재 변경되는 컬럼 제외
                );
                
                // 현재 변경되는 컬럼의 parentColumnId 확인
                const currentParentColumnId = newCol.parentColumnId;
                
                // 다른 FK들이 참조하는 부모 PK 컬럼들의 고유 개수
                const otherParentColumnIds = new Set(
                  otherFkColumns.map((col: any) => col.parentColumnId).filter(Boolean)
                );
                
                // 🔥 복합키 관계 정확한 판별:
                // 1. 다른 FK들이 존재해야 함 (otherFkColumns.length > 0)
                // 2. 현재 컬럼과 다른 FK들이 서로 다른 부모 PK를 참조해야 함
                // 3. 또는 다른 FK들끼리도 서로 다른 부모 PK를 참조해야 함
                const isRealCompositeKeyRelation = 
                  otherFkColumns.length > 0 && (
                    (currentParentColumnId && !otherParentColumnIds.has(currentParentColumnId)) ||
                    otherParentColumnIds.size > 1
                  );
                
                console.log('🔍 복합키 관계 정밀 판별:', {
                  currentColumn: newCol.name,
                  currentParentColumnId,
                  otherFkCount: otherFkColumns.length,
                  otherParentColumnIds: Array.from(otherParentColumnIds),
                  isRealCompositeKey: isRealCompositeKeyRelation,
                  判별근거: isRealCompositeKeyRelation ? '진짜 복합키 (서로 다른 부모 PK 참조)' : '단일키 다중참조 (같은 부모 PK 참조)',
                  조건1_다른FK존재: otherFkColumns.length > 0,
                  조건2_현재컬럼_다른부모PK: currentParentColumnId && !otherParentColumnIds.has(currentParentColumnId),
                  조건3_다른FK들_서로다른부모PK: otherParentColumnIds.size > 1,
                  otherFkColumns상세: otherFkColumns.map((col: any) => ({name: col.name, parentColumnId: col.parentColumnId}))
                });
                
                if (isRealCompositeKeyRelation) {
                  // 진짜 복합키 관계: FK 하나라도 PK 해제되면 모든 관련 FK의 PK 해제 + 비식별자 관계로 변경
                  if (!newCol.pk) {
                    // 제거될 PK+FK 컬럼들을 미리 찾기 (연쇄 처리용)
                    const removedPkColumns = newColumns.filter((col: any) => 
                      col.fk && col.parentEntityId === parentEntityId && col.pk
                    );
                    
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
                      
                      // 연쇄적으로 하위 관계들도 해제 (118번 문제 해결)
                      if (removedPkColumns.length > 0) {
                        const cascadeResult = propagateRelationshipTypeChange(
                          nodeId,
                          removedPkColumns,
                          finalNodes,
                          finalEdges,
                          []
                        );
                        finalNodes = cascadeResult.updatedNodes;
                        finalEdges = cascadeResult.updatedEdges;
                        
                        // 식별자 관계 변경 토스트 메시지 표시 (중복 제거)
                        const uniqueMessages = [...new Set(cascadeResult.toastMessages)];
                        if (uniqueMessages.length > 0) {
                          uniqueMessages.forEach((message, index) => {
                            setTimeout(() => toast.info(message), 200 + (index * 100));
                          });
                        }
                        
                        // 메인 관계 변경 토스트 (중복 방지)
                        const relatedSourceNode = finalNodes.find(n => n.id === relatedEdge.source);
                        const relatedTargetNode = finalNodes.find(n => n.id === relatedEdge.target);
                        if (relatedSourceNode && relatedTargetNode) {
                          const mainMessage = `식별자관계 변경: ${relatedSourceNode.data.label}과 ${relatedTargetNode.data.label} 간의 관계가 비식별자 관계로 변경되었습니다.`;
                          if (!uniqueMessages.includes(mainMessage)) {
                            setTimeout(() => toast.info(mainMessage), 100);
                          }
                        }
                      }
                    }
                  } else if (newCol.pk) {
                    // 복합키에서 FK 하나라도 PK 설정되면 모든 관련 FK의 PK 설정 + 식별자 관계로 변경
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
                  // 🔗 단일키 다중참조: 각 FK별로 완전히 독립적으로 처리
                  console.log('🔗 단일키 다중참조 처리:', {
                    columnName: newCol.name,
                    newPkValue: newCol.pk,
                    otherFkCount: otherFkColumns.length,
                    note: '개별 FK만 독립적으로 처리'
                  });
                  
                  // 🎯 단일키 다중참조에서는 각 FK의 PK 변경이 다른 FK에 영향을 주지 않음
                  // 오직 해당 FK에 대한 관계선만 개별적으로 변경
                  
                  // 해당 FK와 연결된 관계선 찾기 (targetHandle 기반)
                  let specificEdge = finalEdges.find(edge => 
                    edge.source === parentEntityId && 
                    edge.target === nodeId &&
                    edge.targetHandle && 
                    edge.targetHandle.includes(newCol.name)
                  );
                  
                  // targetHandle로 찾지 못한 경우, 일반적인 방법으로 찾기
                  if (!specificEdge) {
                    const relatedEdges = finalEdges.filter(edge => 
                      edge.source === parentEntityId && edge.target === nodeId
                    );
                    
                    if (relatedEdges.length === 1) {
                      // 관계선이 하나뿐이면 그것을 사용
                      specificEdge = relatedEdges[0];
                    } else if (relatedEdges.length > 1) {
                      // 여러 관계선이 있으면 첫 번째 것을 사용 (단일키 다중참조에서는 보통 하나의 관계선)
                      specificEdge = relatedEdges[0];
                      console.log('⚠️ 단일키 다중참조에서 여러 관계선 발견, 첫 번째 사용:', relatedEdges.length);
                    }
                  }
                  
                  if (specificEdge) {
                    let newEdgeType = specificEdge.type;
                    if (!newCol.pk) {
                      // PK 해제 시 비식별자 관계로 변경
                      if (specificEdge.type === 'one-to-one-identifying') {
                        newEdgeType = 'one-to-one-non-identifying';
                      } else if (specificEdge.type === 'one-to-many-identifying') {
                        newEdgeType = 'one-to-many-non-identifying';
                      }
                    } else {
                      // PK 설정 시 식별자 관계로 변경
                      if (specificEdge.type === 'one-to-one-non-identifying') {
                        newEdgeType = 'one-to-one-identifying';
                      } else if (specificEdge.type === 'one-to-many-non-identifying') {
                        newEdgeType = 'one-to-many-identifying';
                      }
                    }
                    
                    if (newEdgeType !== specificEdge.type) {
                      finalEdges = finalEdges.map(edge => 
                        edge.id === specificEdge.id ? { ...edge, type: newEdgeType } : edge
                      );
                      
                      const relationshipType = newCol.pk ? '식별자' : '비식별자';
                      // 개별 관계 변경 토스트 (단일 FK만, 중복 방지)
                      const toastMessage = `관계변경: ${newCol.name} 컬럼이 ${relationshipType} 관계로 변경되었습니다.`;
                      setTimeout(() => toast.info(toastMessage), 100);
                      
                      console.log('✅ 단일키 다중참조 관계 타입 변경:', {
                        columnName: newCol.name,
                        edgeId: specificEdge.id,
                        oldType: specificEdge.type,
                        newType: newEdgeType,
                        note: '개별 FK만 독립적으로 처리됨'
                      });
                    }
                  } else {
                    console.log('⚠️ 단일키 다중참조에서 관계선을 찾을 수 없음:', {
                      columnName: newCol.name,
                      parentEntityId,
                      targetNodeId: nodeId
                    });
                  }
                }
              }
            }
          }
        });
      }

      // 🔧 복합키 관계 일관성 처리 (문제 2 해결) - Layout.tsx에서 처리하므로 비활성화
      // Layout.tsx의 updateColumnField에서 UQ체크/PK해제 시 직접 처리하므로 여기서는 스킵
      /* 
      if (fkPkChangedColumns.length > 0) {
        fkPkChangedColumns.forEach((changedCol: any) => {
          const parentEntityId = changedCol.parentEntityId;
          const newCol = newColumns.find((col: any) => col.id === changedCol.id);
          
          if (newCol && parentEntityId) {
            // 같은 부모를 참조하는 모든 FK 찾기
            const sameFkColumns = finalNodes.find(n => n.id === nodeId)?.data.columns?.filter((col: any) => 
              col.fk && col.parentEntityId === parentEntityId
            ) || [];
            
            // 진짜 복합키 관계인지 정교하게 판별: 서로 다른 부모 PK 컬럼을 참조하는지 확인
            const uniqueParentColumnIds = new Set(
              sameFkColumns.map((fk: any) => fk.parentColumnId).filter(Boolean)
            );
            
            const isRealCompositeKeyRelation = sameFkColumns.length > 1 && uniqueParentColumnIds.size > 1;
            
            // 진짜 복합키 관계에서만 일관성 처리 적용
            if (isRealCompositeKeyRelation) {
              console.log(`🔧 진짜 복합키 일관성 처리: ${parentEntityId}를 참조하는 ${sameFkColumns.length}개 FK, ${uniqueParentColumnIds.size}개 부모컬럼`);
              
              // 변경된 컬럼의 PK 상태에 따라 모든 FK의 PK 상태 일괄 변경
              const shouldAllBePk = newCol.pk; 
              
              finalNodes = finalNodes.map(node => {
                if (node.id === nodeId) {
                  const updatedColumns = node.data.columns.map((col: any) => {
                    // 같은 부모를 참조하는 FK들의 PK 상태를 일괄 변경
                    if (col.fk && col.parentEntityId === parentEntityId) {
                      console.log(`🔄 복합키 FK ${col.name} PK 상태: ${col.pk} → ${shouldAllBePk}`);
                      return { 
                        ...col, 
                        pk: shouldAllBePk,
                        nn: shouldAllBePk ? true : col.nn // PK 설정 시 NN도 설정
                      };
                    }
                    return col;
                  });
                  
                  return { ...node, data: { ...node.data, columns: updatedColumns } };
                }
                return node;
              });
              
              console.log(`✅ 복합키 일관성 처리 완료: 모든 FK PK=${shouldAllBePk}`);
            } else {
              console.log(`⚠️ 복합키 일관성 처리 스킵: 단일PK 다중참조 관계 (FK: ${sameFkColumns.length}, 부모컬럼: ${uniqueParentColumnIds.size})`);
            }
          }
        });
      }
      */

      return { nodes: finalNodes, edges: finalEdges };
    });
    
    // 에지 핸들 업데이트 (관계선 위치 및 연결 상태 갱신) - 즉시 실행
    get().updateEdgeHandles();
    
    // 자동저장 제거 - 수동 저장만 사용
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
        
        // 기존 targetHandle에서 FK 컬럼 이름 추출
        let targetFkColumnName = null;
        if (edge.targetHandle && edge.targetHandle !== 'left' && edge.targetHandle !== 'right') {
          const handleParts = edge.targetHandle.split('-');
          if (handleParts.length >= 2) {
            // Handle 형태: "columnName-position"에서 컬럼 이름 추출 (마지막 position 제외)
            targetFkColumnName = handleParts.slice(0, -1).join('-');
          }
        }
        
        // 해당 FK 컬럼이 존재하는지 확인
        let targetFkColumn = null;
        if (targetFkColumnName) {
          targetFkColumn = targetNode.data.columns?.find((col: any) => 
            col.fk && col.name === targetFkColumnName
          );
        }
        
        // FK 컬럼이 없으면 fallback으로 관련 FK 찾기 (관계선 삭제하지 않음)
        if (!targetFkColumn) {
          const relatedFkColumns = targetNode.data.columns?.filter((col: any) => 
            col.fk && col.parentEntityId === sourceNode.id
          ) || [];
          
          if (relatedFkColumns.length > 0) {
            // 남은 FK들 중 첫 번째를 기준으로 Handle 위치 설정
            // UI에서 보이는 순서상 가장 위에 있는 (인덱스가 가장 작은) FK 컬럼을 선택
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
        }
        
        // FK 컬럼을 찾을 수 없으면 edge를 그대로 반환 (삭제하지 않음)
        if (!targetFkColumn) {
          return edge;
        }
        
        // 새로운 handle 결정 로직 사용
        const { sourceHandle, targetHandle } = determineHandlePositions(sourceNode, targetNode);
        
        // Handle ID 설정 - 찾은 FK 컬럼을 기준으로 계산
        const sourceHandleId = sourcePkColumn 
          ? createHandleId(sourcePkColumn.name, sourceHandle as 'left' | 'right')
          : sourceHandle;
          
        const targetHandleId = targetFkColumn
          ? createHandleId(targetFkColumn.name, targetHandle as 'left' | 'right')
          : targetHandle;
        
        // 관계선의 타입도 FK의 PK 상태에 따라 올바르게 설정
        let edgeType = edge.type;
        if (targetFkColumn) {
          if (targetFkColumn.pk) {
            // FK가 PK이면 식별자 관계
            if (edge.type === 'one-to-one-non-identifying') {
              edgeType = 'one-to-one-identifying';
            } else if (edge.type === 'one-to-many-non-identifying') {
              edgeType = 'one-to-many-identifying';
            }
          } else {
            // FK가 PK가 아니면 비식별자 관계
            if (edge.type === 'one-to-one-identifying') {
              edgeType = 'one-to-one-non-identifying';
            } else if (edge.type === 'one-to-many-identifying') {
              edgeType = 'one-to-many-non-identifying';
            }
          }
        }
        
        // 업데이트된 관계선 반환
        return {
          ...edge,
          type: edgeType,
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
    
    // 색상 변경 히스토리 저장
    const state = get();
    const node = state.nodes.find(n => n.id === nodeId);
    if (node) {
      //console.log('💾 노드 색상 변경 히스토리 저장:', node.data.label, color);
      state.saveHistoryState(HISTORY_ACTIONS.CHANGE_NODE_COLOR, {
        nodeName: node.data.label,
        nodeId: nodeId,
        color: color
      });
    }
    
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
    
    // 색상 변경 히스토리 저장 (관계선은 노드명으로 식별)
    const state = get();
    const edge = state.edges.find(e => e.id === edgeId);
    if (edge) {
      const sourceNode = state.nodes.find(n => n.id === edge.source);
      const targetNode = state.nodes.find(n => n.id === edge.target);
      //console.log('💾 관계선 색상 변경 히스토리 저장:', sourceNode?.data.label, '→', targetNode?.data.label, color);
      state.saveHistoryState('CHANGE_EDGE_COLOR' as any, {
        sourceName: sourceNode?.data.label,
        targetName: targetNode?.data.label,
        edgeId: edgeId,
        color: color
      });
    }
    
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
    
    // 색상 변경 히스토리 저장
    const state = get();
    const comment = state.nodes.find(n => n.id === commentId);
    if (comment) {
      //console.log('💾 커멘트 색상 변경 히스토리 저장:', comment.data.label, color);
      state.saveHistoryState('CHANGE_COMMENT_COLOR' as any, {
        commentText: comment.data.label,
        commentId: commentId,
        color: color
      });
    }
    
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
  // 실제 렌더링된 엔티티 크기를 측정하는 헬퍼 함수
  measureEntitySize: (nodeId: string) => {
    const state = get();
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'entity') {
      return { width: 280, height: 120 };
    }
    
    // 정확한 계산으로 엔티티 크기 추정
    const viewSettings = state.viewSettings;
    const columnCount = (node.data.columns || []).length;
    
    // 엔티티 이름 길이 계산 (뷰 설정에 따라)
    let maxNameLength = 0;
    if (viewSettings.entityView === 'physical' || viewSettings.entityView === 'both') {
      maxNameLength = Math.max(maxNameLength, (node.data.physicalName || node.data.label || '').length);
    }
    if (viewSettings.entityView === 'logical' || viewSettings.entityView === 'both') {
      maxNameLength = Math.max(maxNameLength, (node.data.logicalName || '').length);
    }
    
    // 컬럼들의 최대 텍스트 길이 계산
    let maxColumnTextLength = 0;
    if (node.data.columns) {
      node.data.columns.forEach((col: any) => {
        let columnTextLength = (col.name || '').length;
        
        // 데이터 타입 길이 (표시 설정에 따라)
        if (viewSettings.showDataType) {
          columnTextLength += (col.dataType || col.type || '').length + 2; // 공백 포함
        }
        
        // 제약조건 표시
        if (viewSettings.showConstraints) {
          const constraints = [];
          if (col.pk) constraints.push('PK');
          if (col.fk) constraints.push('FK');
          if (col.uq) constraints.push('UQ');
          if (col.nn) constraints.push('NN');
          if (col.ai) constraints.push('AI');
          columnTextLength += constraints.join(' ').length + 5; // 여백 포함
        }
        
        maxColumnTextLength = Math.max(maxColumnTextLength, columnTextLength);
      });
    }
    
    // 실제 필요한 너비 계산 (더 정확하게)
    const nameBasedWidth = maxNameLength * 12; // 글자당 12px
    const columnBasedWidth = maxColumnTextLength * 9; // 컬럼 텍스트당 9px
    const minWidth = 280;
    const maxWidthLimit = 600;
    
    const calculatedWidth = Math.max(minWidth, nameBasedWidth, columnBasedWidth);
    const finalWidth = Math.min(calculatedWidth, maxWidthLimit);
    
    // 높이 계산 (헤더 + 컬럼들)
    const headerHeight = viewSettings.entityView === 'both' ? 65 : 45; // 물리/논리 둘다 표시시 높이 증가
    const columnHeight = 35; // 컬럼당 35px
    const finalHeight = headerHeight + (columnCount * columnHeight) + 15; // 여백 15px
    
    return {
      width: finalWidth,
      height: Math.max(120, finalHeight)
    };
  },

  // 모든 엔티티의 실제 크기를 측정하여 정렬에 활용
  getAllEntitySizes: () => {
    const state = get();
    const entityNodes = state.nodes.filter(node => node.type === 'entity');
    const sizes = new Map<string, { width: number; height: number }>();
    
    entityNodes.forEach(node => {
      const measureFunc = get().measureEntitySize;
      const size = measureFunc(node.id);
      sizes.set(node.id, size);
    });
    
    return sizes;
  },

  arrangeLeftRight: () => {
    set((state) => {
      const entityNodes = state.nodes.filter(node => node.type === 'entity');
      if (entityNodes.length === 0) return state;
      
      // 실제 엔티티 크기 측정
      const entitySizes = get().getAllEntitySizes();
      
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
      
      // 레벨별로 좌우 배치 - 실제 측정된 크기 사용
      const START_X = 100;
      const START_Y = 100;
      
      // 각 레벨별 최대 너비 계산 (실제 측정된 크기 사용)
      const levelMaxWidths: number[] = [];
      sortedLevels.forEach((level, levelIndex) => {
        let levelMaxWidth = 280; // 기본 최소 너비
        
        level.forEach(nodeId => {
          const size = entitySizes.get(nodeId);
          if (size) {
            levelMaxWidth = Math.max(levelMaxWidth, size.width);
          }
        });
        
        levelMaxWidths[levelIndex] = levelMaxWidth;
      });
      
      // 각 레벨별 높이 계산 (실제 측정된 크기 사용)
      const levelHeights: number[] = [];
      sortedLevels.forEach((level, levelIndex) => {
        let maxHeight = 120; // 기본 최소 높이
        level.forEach(nodeId => {
          const size = entitySizes.get(nodeId);
          if (size) {
            maxHeight = Math.max(maxHeight, size.height);
          }
        });
        levelHeights[levelIndex] = maxHeight;
      });
      
      // 정밀한 간격 계산 - 겹침 방지와 적절한 거리 유지
      const MIN_HORIZONTAL_SPACING = 80; // 최소 가로 간격 80px
      const MIN_VERTICAL_SPACING = 50; // 최소 세로 간격 50px
      
      // 코멘트와 이미지 노드들을 왼쪽 위에 배치하기 위한 설정
      let commentX = 20;  // 더 왼쪽으로
      let commentY = 20;  // 더 위쪽으로
      const COMMENT_SPACING = 80;  // 간격도 줄여서 더 컴팩트하게
      
      const updatedNodes = state.nodes.map(node => {
        // 코멘트, 이미지, 텍스트 노드들은 왼쪽 위에 안전하게 배치
        if (node.type !== 'entity') {
          const position = { x: commentX, y: commentY };
          
          // 다음 노드를 위해 위치 조정 (세로로 쌓기)
          commentY += COMMENT_SPACING;
          // 너무 아래로 내려가면 오른쪽으로 이동
          if (commentY > 500) {  // 500px 이상이면 다음 열로
            commentX += 150;     // 150px씩 오른쪽으로
            commentY = 20;       // 다시 맨 위부터
          }
          
          return { ...node, position };
        }
        
        // 엔티티 노드들만 좌우 정렬 적용
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
    
    // 자동저장 제거 - 수동 저장만 사용
  },
  
  arrangeSnowflake: () => {
    set((state) => {
      const entityNodes = state.nodes.filter(node => node.type === 'entity');
      if (entityNodes.length === 0) return state;
      
      // 실제 엔티티 크기 측정
      const entitySizes = get().getAllEntitySizes();
      
      // 각 노드의 연결 수 계산
      const connectionCount = new Map<string, number>();
      entityNodes.forEach(node => connectionCount.set(node.id, 0));
      
      state.edges.forEach(edge => {
        if (connectionCount.has(edge.source)) {
          connectionCount.set(edge.source, (connectionCount.get(edge.source) || 0) + 1);
        }
        if (connectionCount.has(edge.target)) {
          connectionCount.set(edge.target, (connectionCount.get(edge.target) || 0) + 1);
        }
      });
      
      // 연결 수에 따라 정렬
      const sortedByConnections = [...entityNodes].sort((a, b) => 
        (connectionCount.get(b.id) || 0) - (connectionCount.get(a.id) || 0)
      );
      
      const CENTER_X = 500;
      const CENTER_Y = 400;
      
      // 코멘트와 이미지 노드들을 왼쪽 위에 배치하기 위한 설정
      const nonEntityNodes = state.nodes.filter(node => node.type !== 'entity');
      let commentX = 20;  // 더 왼쪽으로
      let commentY = 20;  // 더 위쪽으로
      const COMMENT_SPACING = 80;  // 간격도 줄여서 더 컴팩트하게
      
      const updatedNodes = state.nodes.map(node => {
        // 코멘트, 이미지, 텍스트 노드들은 왼쪽 위에 안전하게 배치
        if (node.type !== 'entity') {
          const position = { x: commentX, y: commentY };
          
          // 다음 노드를 위해 위치 조정 (세로로 쌓기)
          commentY += COMMENT_SPACING;
          // 너무 아래로 내려가면 오른쪽으로 이동
          if (commentY > 500) {  // 500px 이상이면 다음 열로
            commentX += 150;     // 150px씩 오른쪽으로
            commentY = 20;       // 다시 맨 위부터
          }
          
          return { ...node, position };
        }
        
        // 엔티티 노드들만 스노우플레이크 배치
        const nodeIndex = sortedByConnections.findIndex(n => n.id === node.id);
        if (nodeIndex === -1) return node;
        
        const size = entitySizes.get(node.id) || { width: 280, height: 120 };
        
        if (nodeIndex === 0) {
          // 중심 노드
          const x = CENTER_X - size.width / 2;
          const y = CENTER_Y - size.height / 2;
          return { ...node, position: { x, y } };
        } else {
          // 원형 배치 - 매우 간단한 로직으로 큰 반지름 사용
          const angle = (2 * Math.PI * (nodeIndex - 1)) / Math.max(1, sortedByConnections.length - 1);
          
          // 엔티티 크기에 따른 동적 반지름 - 훨씬 크게
          const entityMaxDimension = Math.max(size.width, size.height);
          const baseRadius = 300 + entityMaxDimension; // 기본 300 + 엔티티 크기
          
          // 레이어별로 더 멀리 배치 (8개씩)
          const layer = Math.floor((nodeIndex - 1) / 8);
          const finalRadius = baseRadius + (layer * 200); // 레이어마다 200px 추가
          
          const x = CENTER_X + finalRadius * Math.cos(angle) - size.width / 2;
          const y = CENTER_Y + finalRadius * Math.sin(angle) - size.height / 2;
          
          return { ...node, position: { x, y } };
        }
      });
      
      // 엔티티 배치 후 관계선 방향 업데이트
      setTimeout(() => {
        get().updateEdgeHandles();
      }, 50);
      
      return { nodes: updatedNodes };
    });
    
    // 자동저장 제거 - 수동 저장만 사용
  },
  
  arrangeCompact: () => {
    set((state) => {
      const entityNodes = state.nodes.filter(node => node.type === 'entity');
      if (entityNodes.length === 0) return state;
      
      // 실제 엔티티 크기 측정
      const entitySizes = get().getAllEntitySizes();
      
      // 격자 형태로 배치 - 실제 크기 기반 계산
      const COLS = Math.ceil(Math.sqrt(entityNodes.length));
      const START_X = 100;
      const START_Y = 100;
      
      // 각 엔티티의 실제 크기를 배열로 변환
      const entitySizeList = entityNodes.map(node => {
        const size = entitySizes.get(node.id) || { width: 280, height: 120 };
        return { 
          nodeId: node.id, 
          width: size.width,
          height: size.height
        };
      });
      
      // 행별 최대 높이 계산 (실제 크기 기반)
      const rowHeights: number[] = [];
      for (let row = 0; row < Math.ceil(entityNodes.length / COLS); row++) {
        let maxHeight = 120; // 최소 높이
        for (let col = 0; col < COLS; col++) {
          const nodeIndex = row * COLS + col;
          if (nodeIndex < entitySizeList.length) {
            maxHeight = Math.max(maxHeight, entitySizeList[nodeIndex].height);
          }
        }
        rowHeights[row] = maxHeight;
      }
      
      // 열별 최대 너비 계산 (실제 크기 기반)
      const colWidths: number[] = [];
      for (let col = 0; col < COLS; col++) {
        let maxWidth = 280; // 최소 너비
        for (let row = 0; row < Math.ceil(entityNodes.length / COLS); row++) {
          const nodeIndex = row * COLS + col;
          if (nodeIndex < entitySizeList.length) {
            maxWidth = Math.max(maxWidth, entitySizeList[nodeIndex].width);
          }
        }
        colWidths[col] = maxWidth;
      }
      
      // 동적 간격 계산 - 실제 크기 기반, 적절한 밸런스
      const avgWidth = colWidths.reduce((a, b) => a + b, 0) / colWidths.length || 320;
      const avgHeight = rowHeights.reduce((a, b) => a + b, 0) / rowHeights.length || 150;
      const MIN_SPACING = Math.max(50, Math.min(avgWidth * 0.12, avgHeight * 0.15)); // 최소 50px, 적절한 간격
      
      // 코멘트와 이미지 노드들을 왼쪽 위에 배치하기 위한 설정
      let commentX = 20;  // 더 왼쪽으로
      let commentY = 20;  // 더 위쪽으로
      const COMMENT_SPACING = 80;  // 간격도 줄여서 더 컴팩트하게
      
      const updatedNodes = state.nodes.map(node => {
        // 코멘트, 이미지, 텍스트 노드들은 왼쪽 위에 안전하게 배치
        if (node.type !== 'entity') {
          const position = { x: commentX, y: commentY };
          
          // 다음 노드를 위해 위치 조정 (세로로 쌓기)
          commentY += COMMENT_SPACING;
          // 너무 아래로 내려가면 오른쪽으로 이동
          if (commentY > 500) {  // 500px 이상이면 다음 열로
            commentX += 150;     // 150px씩 오른쪽으로
            commentY = 20;       // 다시 맨 위부터
          }
          
          return { ...node, position };
        }
        
        // 엔티티 노드들만 컴팩트 정렬 적용
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
    
    // 자동저장 제거 - 수동 저장만 사용
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
      
      localStorage.setItem(getCurrentStorageKey(), JSON.stringify(dataToSave));
      
      // showToast가 true일 때만 토스트 메시지 표시
      if (showToast) {
        toast.success('ERD 데이터가 성공적으로 저장되었습니다!');
      }
      
      // 저장 성공 후 hasSavedData 상태 업데이트
      set({ hasSavedData: true });
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
      
      const savedData = localStorage.getItem(getCurrentStorageKey());
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
        const state = get();
        set({ isLoading: false, loadingMessage: '', loadingProgress: 100 });
        
        // 히스토리 초기화 및 초기 상태 저장
        state.historyManager.clearHistory();
        const currentState = serializeState({
          nodes: state.nodes,
          edges: state.edges,
          nodeColors: state.nodeColors,
          edgeColors: state.edgeColors,
          commentColors: state.commentColors,
          hiddenEntities: state.hiddenEntities
        });
        state.historyManager.saveState('INITIAL_STATE' as HistoryActionType, currentState, { name: '초기 상태' });
        state.updateHistoryFlags();
        
        toast.success('ERD 데이터를 성공적으로 불러왔습니다!');
        
        // 로드 성공 후 hasSavedData 상태 업데이트
        set({ hasSavedData: true });
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
      const savedData = localStorage.getItem(getCurrentStorageKey());
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
      localStorage.removeItem(getCurrentStorageKey());
      
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
        hasSavedData: false,
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
      
      // 히스토리 완전 초기화 및 빈 상태를 초기 히스토리로 설정
      const state = get();
      state.historyManager.clearHistory();
      
      // 빈 상태를 새로운 초기 상태로 히스토리에 저장
      const emptyState = serializeState({
        nodes: [],
        edges: [],
        nodeColors: new Map(),
        edgeColors: new Map(),
        commentColors: new Map(),
        hiddenEntities: new Set()
      });
      state.historyManager.saveState('INITIAL_STATE' as HistoryActionType, emptyState, { name: '초기 상태 (데이터 삭제 후)' });
      state.updateHistoryFlags();
      
      //console.log('🗑️ 데이터 삭제 완료 - 히스토리 초기화됨');
      
      toast.success('저장된 데이터가 삭제되고 초기 상태로 리셋되었습니다.');
    } catch (error) {
      toast.error('데이터 삭제에 실패했습니다.');
    }
  },
  
  // hasSavedData 관련 함수들
  setHasSavedData: (value: boolean) => {
    set({ hasSavedData: value });
  },
  
  checkSavedData: () => {
    const savedData = localStorage.getItem(getCurrentStorageKey());
    if (!savedData || savedData === '{}') {
      set({ hasSavedData: false });
      return;
    }
    try {
      const parsed = JSON.parse(savedData);
      set({ hasSavedData: parsed.nodes && parsed.nodes.length > 0 });
    } catch {
      set({ hasSavedData: false });
    }
  },

  // 변경사항 체크 함수 (저장 형식과 동일하게)
  hasUnsavedChanges: () => {
    const state = get();
    const savedData = localStorage.getItem(getCurrentStorageKey());
    
    // 저장할 때와 똑같은 형식으로 현재 상태 구성
    const currentForComparison = {
      nodes: state.nodes,
      edges: state.edges,
      nodeColors: Object.fromEntries(state.nodeColors),
      edgeColors: Object.fromEntries(state.edgeColors),
      commentColors: Object.fromEntries(state.commentColors),
      viewSettings: state.viewSettings,
      theme: state.theme,
      showGrid: state.showGrid,
      hiddenEntities: Array.from(state.hiddenEntities),
    };
    
    if (!savedData) {
      // 저장된 데이터가 없으면 현재 상태가 완전히 비어있지 않은 경우에만 변경사항 있음으로 판단
      const isEmpty = state.nodes.length === 0 && 
                     state.edges.length === 0 && 
                     state.nodeColors.size === 0 && 
                     state.edgeColors.size === 0 && 
                     state.commentColors.size === 0 &&
                     state.hiddenEntities.size === 0;
      return !isEmpty;
    }

    try {
      const saved = JSON.parse(savedData);
      
      // 저장된 데이터에서도 똑같은 형식으로 구성
      const savedForComparison = {
        nodes: saved.nodes || [],
        edges: saved.edges || [],
        nodeColors: saved.nodeColors || {},
        edgeColors: saved.edgeColors || {},
        commentColors: saved.commentColors || {},
        viewSettings: saved.viewSettings || {},
        theme: saved.theme || 'light',
        showGrid: saved.showGrid || false,
        hiddenEntities: saved.hiddenEntities || [],
      };
      
      return JSON.stringify(currentForComparison) !== JSON.stringify(savedForComparison);
    } catch {
      // 파싱 에러가 난 경우, 현재 상태가 비어있지 않으면 변경사항 있음으로 판단
      const isEmpty = state.nodes.length === 0 && 
                     state.edges.length === 0 && 
                     state.nodeColors.size === 0 && 
                     state.edgeColors.size === 0 && 
                     state.commentColors.size === 0 &&
                     state.hiddenEntities.size === 0;
      return !isEmpty;
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
    // 자동저장 제거 - 수동 저장만 사용
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
      
      // 자동저장 제거 - 수동 저장만 사용
      
      // compact 정렬 후 zoom to fit
      setTimeout(() => {
        get().arrangeCompact();
        // zoom to fit은 Canvas에서 처리
      }, 100);
      
      toast.success(`${tables.length}개의 테이블을 성공적으로 불러왔습니다.`);
      
    } catch (error) {
      toast.error('SQL 파일 파싱 중 오류가 발생했습니다.');
      //console.error('SQL import error:', error);
    }
  },

  // 히스토리 관련 함수들
  saveHistoryState: (actionType: HistoryActionType, metadata?: any) => {
    const state = get();
    const currentState = serializeState({
      nodes: state.nodes,
      edges: state.edges,
      nodeColors: state.nodeColors,
      edgeColors: state.edgeColors,
      commentColors: state.commentColors,
      hiddenEntities: state.hiddenEntities
    });
    
    //console.log('🔄 히스토리 저장:', actionType, metadata);
    //console.log('📊 저장되는 노드 수:', currentState.nodes.length);
    
    // 엔티티 노드의 상세 정보 로깅 (최대 2개만)
    const entityNodes = currentState.nodes.filter(node => node.type === 'entity').slice(0, 2);
    entityNodes.forEach((node, index) => {
      // console.log(`📦 엔티티 ${index + 1}:`, {
      //   id: node.id,
      //   label: node.data.label,
      //   physicalName: node.data.physicalName,
      //   logicalName: node.data.logicalName,
      //   columns: node.data.columns?.length || 0,
      //   columnsDetail: node.data.columns?.slice(0, 3).map((col: any) => ({
      //     name: col.name,
      //     logicalName: col.logicalName,
      //     pk: col.pk,
      //     uq: col.uq,
      //     nn: col.nn,
      //     ai: col.ai,
      //     dataType: col.dataType,
      //     defaultValue: col.defaultValue
      //   })) || []
      // });
    });
    
    state.historyManager.saveState(actionType, currentState, metadata);
    state.updateHistoryFlags();
    //console.log('📚 히스토리 개수:', state.historyManager.getHistorySize());
  },

  undo: () => {
    const state = get();
    //console.log('↩️ Undo 시도, canUndo:', state.historyManager.canUndo());
    const historyEntry = state.historyManager.undo();
    
    if (historyEntry) {
      //console.log('↩️ Undo 실행:', historyEntry.description);
      const restoredState = deserializeState(historyEntry.data);
      
      //console.log('📊 복원되는 노드 수:', restoredState.nodes.length);
      
      // 복원되는 엔티티 노드의 상세 정보 로깅 (최대 2개만)
      const entityNodes = restoredState.nodes.filter(node => node.type === 'entity').slice(0, 2);
      entityNodes.forEach((node, index) => {
        // console.log(`📦 복원 엔티티 ${index + 1}:`, {
        //   id: node.id,
        //   label: node.data.label,
        //   physicalName: node.data.physicalName,
        //   logicalName: node.data.logicalName,
        //   columns: node.data.columns?.length || 0,
        //   columnsDetail: node.data.columns?.slice(0, 3).map((col: any) => ({
        //     name: col.name,
        //     logicalName: col.logicalName,
        //     pk: col.pk,
        //     uq: col.uq,
        //     nn: col.nn,
        //     ai: col.ai,
        //     dataType: col.dataType,
        //     defaultValue: col.defaultValue
        //   })) || []
        // });
      });
      
      // 이미지 노드 복원 로깅
      const imageNodes = restoredState.nodes.filter(node => node.type === 'image');
      imageNodes.forEach((node, index) => {
        // console.log(`🖼️ 복원 이미지 노드 ${index + 1}:`, {
        //   id: node.id,
        //   label: node.data.label,
        //   imageUrl: node.data.imageUrl ? `${node.data.imageUrl.substring(0, 50)}...` : 'None',
        //   width: node.data.width,
        //   height: node.data.height
        // });
      });
      
      set({
        nodes: [...restoredState.nodes], // 강제 참조 변경
        edges: [...restoredState.edges], // 강제 참조 변경
        nodeColors: restoredState.nodeColors,
        edgeColors: restoredState.edgeColors,
        commentColors: restoredState.commentColors,
        hiddenEntities: restoredState.hiddenEntities,
        // 선택 상태 초기화
        selectedNodeId: null,
        selectedEdgeId: null,
        hoveredEntityId: null,
        hoveredEdgeId: null,
        highlightedEntities: [],
        highlightedEdges: [],
        highlightedColumns: new Map(),
        // 하단 패널 새로고침을 위한 플래그
        bottomPanelRefreshKey: Date.now()
      });
      
      state.updateHistoryFlags();
      // toast.success(`${historyEntry.description} 취소됨`); // 토스트 제거
    } else {
      //console.log('↩️ Undo 실패: 되돌릴 상태가 없음');
    }
  },

  redo: () => {
    const state = get();
    //console.log('↪️ Redo 시도, canRedo:', state.historyManager.canRedo());
    const historyEntry = state.historyManager.redo();
    
    if (historyEntry) {
      //console.log('↪️ Redo 실행:', historyEntry.description);
      const restoredState = deserializeState(historyEntry.data);
      
      //console.log('📊 Redo 복원되는 노드 수:', restoredState.nodes.length);
      
      // 이미지 노드 복원 로깅
      const imageNodes = restoredState.nodes.filter(node => node.type === 'image');
      imageNodes.forEach((node, index) => {
        // console.log(`🖼️ Redo 복원 이미지 노드 ${index + 1}:`, {
        //   id: node.id,
        //   label: node.data.label,
        //   imageUrl: node.data.imageUrl ? `${node.data.imageUrl.substring(0, 50)}...` : 'None',
        //   width: node.data.width,
        //   height: node.data.height
        // });
      });
      
      set({
        nodes: [...restoredState.nodes], // 강제 참조 변경
        edges: [...restoredState.edges], // 강제 참조 변경
        nodeColors: restoredState.nodeColors,
        edgeColors: restoredState.edgeColors,
        commentColors: restoredState.commentColors,
        hiddenEntities: restoredState.hiddenEntities,
        // 선택 상태 초기화
        selectedNodeId: null,
        selectedEdgeId: null,
        hoveredEntityId: null,
        hoveredEdgeId: null,
        highlightedEntities: [],
        highlightedEdges: [],
        highlightedColumns: new Map(),
        // 하단 패널 새로고침을 위한 플래그
        bottomPanelRefreshKey: Date.now()
      });
      
      state.updateHistoryFlags();
      // toast.success(`${historyEntry.description} 다시 실행됨`); // 토스트 제거
    } else {
      //console.log('↪️ Redo 실패: 다시 실행할 상태가 없음');
    }
  },

  clearHistory: () => {
    const state = get();
    state.historyManager.clearHistory();
    state.updateHistoryFlags();
  },

  updateHistoryFlags: () => {
    const state = get();
    set({
      canUndo: state.historyManager.canUndo(),
      canRedo: state.historyManager.canRedo()
    });
  },
}));

// 스토어 초기화 시 localStorage에서 데이터 로드
const initializeStore = () => {
  try {
    const savedData = localStorage.getItem(getCurrentStorageKey());
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
