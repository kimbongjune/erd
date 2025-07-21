import { useCallback } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import useStore from '../store/useStore';

const HeaderContainer = styled.header`
  grid-area: header;
  background-color: #f0f0f0;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Header = () => {
  const { nodes, edges, setNodes, setEdges } = useStore();

  const onDrop = useCallback((acceptedFiles) => {
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
    <HeaderContainer {...getRootProps()}>
      <input {...getInputProps()} />
      <button onClick={saveData}>Save</button>
      <button onClick={() => getRootProps().onClick(undefined)}>Load</button>
    </HeaderContainer>
  );
};

export default Header;
