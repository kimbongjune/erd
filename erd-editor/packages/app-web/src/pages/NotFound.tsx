import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  text-align: center;
  padding: 20px;
`;

const ErrorCode = styled.h1`
  font-size: 8rem;
  font-weight: 900;
  margin: 0;
  text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.3);
  background: linear-gradient(45deg, #ff6b6b, #feca57);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ErrorMessage = styled.h2`
  font-size: 2rem;
  margin: 20px 0;
  font-weight: 600;
`;

const ErrorDescription = styled.p`
  font-size: 1.2rem;
  margin: 20px 0;
  opacity: 0.9;
  max-width: 600px;
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 30px;
  flex-wrap: wrap;
  justify-content: center;
`;

const ActionButton = styled.button`
  padding: 12px 30px;
  font-size: 1.1rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
  
  &.primary {
    background: linear-gradient(45deg, #4CAF50, #45a049);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
    }
  }
  
  &.secondary {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
  }
`;

const IconWrapper = styled.div`
  font-size: 5rem;
  margin-bottom: 20px;
  opacity: 0.8;
`;

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/home');
  };

  const createNew = () => {
    const id = `erd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`/erd/${id}`);
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <NotFoundContainer>
      <IconWrapper>🔍</IconWrapper>
      <ErrorCode>404</ErrorCode>
      <ErrorMessage>페이지를 찾을 수 없습니다</ErrorMessage>
      <ErrorDescription>
        요청하신 다이어그램이 존재하지 않거나 삭제되었을 수 있습니다.
        <br />
        다른 다이어그램을 선택하거나 새로운 다이어그램을 만들어보세요.
      </ErrorDescription>
      <ButtonGroup>
        <ActionButton className="primary" onClick={goHome}>
          홈으로 가기
        </ActionButton>
        <ActionButton className="primary" onClick={createNew}>
          새 다이어그램 만들기
        </ActionButton>
        <ActionButton className="secondary" onClick={goBack}>
          이전 페이지로
        </ActionButton>
      </ButtonGroup>
    </NotFoundContainer>
  );
};

export default NotFound;
