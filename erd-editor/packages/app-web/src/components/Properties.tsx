import styled from 'styled-components';
import useStore from '../store/useStore';
import { useState } from 'react';

const PropertiesContainer = styled.aside<{ $darkMode?: boolean }>`
  grid-area: properties;
  background-color: ${props => props.$darkMode ? '#2d3748' : '#e0e0e0'};
  padding: 10px;
`;

const Section = styled.div<{ $darkMode?: boolean }>`
  margin-bottom: 20px;
  padding: 15px;
  background: ${props => props.$darkMode ? '#374151' : 'white'};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h3<{ $darkMode?: boolean }>`
  margin: 0 0 15px 0;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#333'};
  font-size: 16px;
  font-weight: 600;
`;

const FormRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 10px;
`;

const Label = styled.label<{ $darkMode?: boolean }>`
  min-width: 80px;
  font-weight: 500;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#555'};
  font-size: 14px;
`;

const Input = styled.input<{ $darkMode?: boolean }>`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#ddd'};
  border-radius: 4px;
  font-size: 14px;
  background-color: ${props => props.$darkMode ? '#4a5568' : 'white'};
  color: ${props => props.$darkMode ? '#e2e8f0' : 'inherit'};
  
  &:focus {
    outline: none;
    border-color: #007acc;
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
  }
  }
`;

const EntityNameRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const EntityNameField = styled.div`
  flex: 1;
`;

const NameLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
`;

const NameInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  
  &:focus {
    outline: none;
    border-color: #007acc;
    box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.2);
  }
  
  &:hover {
    border-color: #bbb;
  }
`;

const Properties = () => {
  const { nodes, selectedNodeId, updateNodeData, theme } = useStore();
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  
  const [physicalName, setPhysicalName] = useState('');
  const [logicalName, setLogicalName] = useState('');

  const isDarkMode = theme === 'dark';

  // 선택된 노드가 변경될 때마다 입력값 초기화
  useState(() => {
    if (selectedNode && selectedNode.type === 'entity') {
      setPhysicalName(selectedNode.data.physicalName || selectedNode.data.label || '');
      setLogicalName(selectedNode.data.logicalName || '');
    }
  });

  if (!selectedNode) {
    return <PropertiesContainer $darkMode={isDarkMode}>Select a node to edit its properties.</PropertiesContainer>;
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(selectedNode.id, { ...selectedNode.data, color: e.target.value });
  };

  const handlePhysicalNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhysicalName(value);
    updateNodeData(selectedNode.id, { ...selectedNode.data, physicalName: value });
  };

  const handleLogicalNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLogicalName(value);
    updateNodeData(selectedNode.id, { ...selectedNode.data, logicalName: value });
  };

  // 엔티티 노드인 경우
  if (selectedNode.type === 'entity') {
    return (
      <PropertiesContainer $darkMode={isDarkMode}>
        <SectionTitle $darkMode={isDarkMode}>Entity Properties</SectionTitle>
        
        <Section $darkMode={isDarkMode}>
          <EntityNameRow>
            <EntityNameField>
              <NameLabel>Physical Name (물리명)</NameLabel>
              <NameInput
                type="text"
                value={physicalName}
                onChange={handlePhysicalNameChange}
                placeholder="테이블 물리명"
              />
            </EntityNameField>
            <EntityNameField>
              <NameLabel>Logical Name (논리명)</NameLabel>
              <NameInput
                type="text"
                value={logicalName}
                onChange={handleLogicalNameChange}
                placeholder="테이블 논리명"
              />
            </EntityNameField>
          </EntityNameRow>
        </Section>

        <Section $darkMode={isDarkMode}>
          <SectionTitle $darkMode={isDarkMode}>Appearance</SectionTitle>
          <FormRow>
            <Label $darkMode={isDarkMode}>Background Color:</Label>
            <Input 
              $darkMode={isDarkMode}
              type="color" 
              value={selectedNode.data.color || '#ffffff'} 
              onChange={handleColorChange} 
            />
          </FormRow>
        </Section>
      </PropertiesContainer>
    );
  }

  // 다른 노드 타입인 경우
  return (
    <PropertiesContainer $darkMode={isDarkMode}>
      <SectionTitle $darkMode={isDarkMode}>Properties</SectionTitle>
      <Section $darkMode={isDarkMode}>
        <FormRow>
          <Label $darkMode={isDarkMode}>Background Color:</Label>
          <Input 
            $darkMode={isDarkMode}
            type="color" 
            value={selectedNode.data.color || '#ffffff'} 
            onChange={handleColorChange} 
          />
        </FormRow>
      </Section>
    </PropertiesContainer>
  );
};

export default Properties;
