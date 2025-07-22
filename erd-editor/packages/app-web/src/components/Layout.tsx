import React, { useState } from 'react';
import styled from 'styled-components';
import Header from './Header';
import Toolbox from './Toolbox';
import Canvas from './Canvas';
import Properties from './Properties';
import BottomPanel from './BottomPanel';
import useStore from '../store/useStore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
`;

const TopContainer = styled.div`
  display: grid;
  flex-grow: 1;
  grid-template-columns: 80px 1fr 250px;
  grid-template-rows: 50px 1fr;
  grid-template-areas:
    'header header header'
    'toolbox canvas properties';
`;

const ToolboxContainer = styled.aside`
  grid-area: toolbox;
  background-color: #f8f9fa;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
`;

const CanvasContainer = styled.main`
  grid-area: canvas;
  background-color: #ffffff;
`;

const PropertiesContainer = styled.aside`
  grid-area: properties;
  background-color: #f8f9fa;
  border-left: 1px solid #ddd;
  overflow-y: auto;
`;
const BottomPanelContainer = styled.footer<{ $height: number }>`
  background-color: #f0f0f0;
  height: ${props => props.$height}px;
  min-height: 100px;
  max-height: 500px;
  position: relative;
  border-top: 1px solid #ddd;
`;

const Layout = () => {
  const { isBottomPanelOpen, setBottomPanelOpen } = useStore();
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);

  return (
    <Container>
      <TopContainer>
        <Header />
        <ToolboxContainer>
          <Toolbox />
        </ToolboxContainer>
        <CanvasContainer>
          <Canvas />
        </CanvasContainer>
        <PropertiesContainer>
          <Properties />
        </PropertiesContainer>
      </TopContainer>
      {isBottomPanelOpen && (
        <BottomPanelContainer $height={bottomPanelHeight}>
          <button onClick={() => setBottomPanelOpen(false)}>Close</button>
          <BottomPanel />
        </BottomPanelContainer>
      )}
    </Container>
  );
};

export default Layout;
