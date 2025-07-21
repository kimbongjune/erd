import styled from 'styled-components';
import Header from './Header';
import Canvas from './Canvas';
import Toolbox from './Toolbox';
import BottomPanel from './BottomPanel';
import useStore from '../store/useStore';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
`;

const TopContainer = styled.div`
  display: grid;
  flex-grow: 1;
  grid-template-columns: 200px 1fr 250px;
  grid-template-rows: 50px 1fr;
  grid-template-areas:
    'header header header'
    'toolbox canvas properties';
`;

const ToolboxContainer = styled.aside`
  grid-area: toolbox;
  background-color: #e0e0e0;
`;

const CanvasContainer = styled.main`
  grid-area: canvas;
  background-color: #ffffff;
`;

import Properties from './Properties';

const BottomPanelContainer = styled.footer`
  background-color: #f0f0f0;
`;

const Layout = () => {
  const { isBottomPanelOpen, setBottomPanelOpen } = useStore();

  return (
    <Container>
      <TopContainer>
        <Header>Header</Header>
        <ToolboxContainer>
          <Toolbox />
        </ToolboxContainer>
        <CanvasContainer>
          <Canvas />
        </CanvasContainer>
        <Properties />
      </TopContainer>
      {isBottomPanelOpen && (
        <ResizableBox
          height={200}
          minConstraints={[Infinity, 100]}
          maxConstraints={[Infinity, 500]}
          axis="y"
          resizeHandles={['n']}
        >
          <BottomPanelContainer>
            <button onClick={() => setBottomPanelOpen(false)}>Close</button>
            <BottomPanel />
          </BottomPanelContainer>
        </ResizableBox>
      )}
    </Container>
  );
};

export default Layout;
