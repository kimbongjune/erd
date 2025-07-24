import { useCallback } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import useStore from '../store/useStore';

const HeaderContainer = styled.header<{ $darkMode?: boolean }>`
  grid-area: header;
  background-color: ${props => props.$darkMode ? '#2d3748' : '#f0f0f0'};
  color: ${props => props.$darkMode ? '#ffffff' : '#000000'};
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
`;

const ThemeToggleButton = styled.button<{ $darkMode?: boolean }>`
  background: ${props => props.$darkMode ? '#4a5568' : '#ffffff'};
  border: 2px solid ${props => props.$darkMode ? '#718096' : '#e2e8f0'};
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: ${props => props.$darkMode ? '#718096' : '#f7fafc'};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const Header = () => {
  const { nodes, edges, setNodes, setEdges, theme, toggleTheme } = useStore();

  const onDrop = useCallback((acceptedFiles: any[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      const { nodes, edges } = JSON.parse(reader.result as string);
      setNodes(nodes);
      setEdges(edges);
    };
    reader.readAsText(file);
  }, [setNodes, setEdges]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, noClick: true });

  const saveData = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erd.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <HeaderContainer $darkMode={theme === 'dark'} {...getRootProps()}>
      <input {...getInputProps()} />
      <button onClick={saveData}>Save</button>
      <button onClick={() => getRootProps().onClick?.(undefined as any)}>Load</button>
      
      <ThemeToggleButton 
        $darkMode={theme === 'dark'} 
        onClick={(e) => {
          e.stopPropagation();
          toggleTheme();
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
        {theme === 'dark' ? 'Light' : 'Dark'}
      </ThemeToggleButton>
    </HeaderContainer>
  );
};

export default Header;
