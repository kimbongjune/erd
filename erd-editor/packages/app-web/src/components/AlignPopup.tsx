import React from 'react';
import styled from 'styled-components';
import { FaTh, FaArrowsAltH, FaCompress } from 'react-icons/fa';
import useStore from '../store/useStore';

const PopupContainer = styled.div<{ $darkMode: boolean }>`
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-130px); /* 정렬 버튼 위치에 맞춤 */
  background: ${props => props.$darkMode ? '#2d3748' : 'white'};
  border: 1px solid ${props => props.$darkMode ? '#404040' : '#e0e0e0'};
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 1000;
  min-width: 320px;
  max-width: 350px;
`;

const PopupTitle = styled.h3<{ $darkMode: boolean }>`
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#333'};
`;

const AlignOption = styled.div<{ $darkMode: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$darkMode ? 'rgba(0, 122, 204, 0.15)' : 'rgba(0, 122, 204, 0.05)'};
  }
`;

const IconContainer = styled.div<{ $darkMode: boolean }>`
  width: 40px;
  height: 40px;
  background: ${props => props.$darkMode ? '#1E1E1E' : '#f8f9fa'};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#666'};
`;

const OptionContent = styled.div`
  flex: 1;
`;

const OptionTitle = styled.div<{ $darkMode: boolean }>`
  font-weight: 600;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#333'};
  margin-bottom: 4px;
`;

const OptionDescription = styled.div<{ $darkMode: boolean }>`
  font-size: 12px;
  color: ${props => props.$darkMode ? '#cbd5e0' : '#666'};
  line-height: 1.4;
`;

const OptionNumber = styled.div<{ $darkMode: boolean }>`
  width: 24px;
  height: 24px;
  background: ${props => props.$darkMode ? '#1E1E1E' : '#e9ecef'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#666'};
`;

interface AlignPopupProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'left-right' | 'snowflake' | 'compact') => void;
}

const AlignPopup: React.FC<AlignPopupProps> = ({ visible, onClose, onSelect }) => {
  const { theme } = useStore();
  
  if (!visible) return null;

  const isDarkMode = theme === 'dark';

  const handleSelect = (type: 'left-right' | 'snowflake' | 'compact') => {
    onSelect(type);
  };

  return (
    <PopupContainer $darkMode={isDarkMode} onClick={(e) => e.stopPropagation()}>
      <PopupTitle $darkMode={isDarkMode}>Choose auto arrange algorithm</PopupTitle>
      
      <AlignOption $darkMode={isDarkMode} onClick={() => handleSelect('left-right')}>
        <IconContainer $darkMode={isDarkMode}>
          <FaArrowsAltH size={16} />
        </IconContainer>
        <OptionContent>
          <OptionTitle $darkMode={isDarkMode}>Left-right</OptionTitle>
          <OptionDescription $darkMode={isDarkMode}>
            Arrange tables from left to right based on their
            relationship direction. Ideal for diagrams with
            long relationship lineage like ETL pipelines.
          </OptionDescription>
        </OptionContent>
        <OptionNumber $darkMode={isDarkMode}>1</OptionNumber>
      </AlignOption>

      <AlignOption $darkMode={isDarkMode} onClick={() => handleSelect('snowflake')}>
        <IconContainer $darkMode={isDarkMode}>
          <FaTh size={16} />
        </IconContainer>
        <OptionContent>
          <OptionTitle $darkMode={isDarkMode}>Snowflake</OptionTitle>
          <OptionDescription $darkMode={isDarkMode}>
            Arrange tables in a snowflake shape, with the
            most connected tables in the center. Ideal for
            densely connected diagrams like data
            warehouses.
          </OptionDescription>
        </OptionContent>
        <OptionNumber $darkMode={isDarkMode}>2</OptionNumber>
      </AlignOption>

      <AlignOption $darkMode={isDarkMode} onClick={() => handleSelect('compact')}>
        <IconContainer $darkMode={isDarkMode}>
          <FaCompress size={16} />
        </IconContainer>
        <OptionContent>
          <OptionTitle $darkMode={isDarkMode}>Compact</OptionTitle>
          <OptionDescription $darkMode={isDarkMode}>
            Arrange tables in a compact rectangle layout.
            Ideal for diagrams with few relationships and
            tables.
          </OptionDescription>
        </OptionContent>
        <OptionNumber $darkMode={isDarkMode}>3</OptionNumber>
      </AlignOption>
    </PopupContainer>
  );
};

export default AlignPopup;
