import React from 'react';
import styled from 'styled-components';
import { FaTh, FaArrowsAltH, FaCompress } from 'react-icons/fa';

const PopupContainer = styled.div`
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-130px); /* 정렬 버튼 위치에 맞춤 */
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 1000;
  backdrop-filter: blur(10px);
  min-width: 320px;
  max-width: 350px;
`;

const PopupTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const AlignOption = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 122, 204, 0.05);
  }
`;

const IconContainer = styled.div`
  width: 40px;
  height: 40px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
`;

const OptionContent = styled.div`
  flex: 1;
`;

const OptionTitle = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const OptionDescription = styled.div`
  font-size: 12px;
  color: #666;
  line-height: 1.4;
`;

const OptionNumber = styled.div`
  width: 24px;
  height: 24px;
  background: #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #666;
`;

interface AlignPopupProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'left-right' | 'snowflake' | 'compact') => void;
}

const AlignPopup: React.FC<AlignPopupProps> = ({ visible, onClose, onSelect }) => {
  if (!visible) return null;

  const handleSelect = (type: 'left-right' | 'snowflake' | 'compact') => {
    onSelect(type);
  };

  return (
    <PopupContainer onClick={(e) => e.stopPropagation()}>
      <PopupTitle>Choose auto arrange algorithm</PopupTitle>
      
      <AlignOption onClick={() => handleSelect('left-right')}>
        <IconContainer>
          <FaArrowsAltH size={16} />
        </IconContainer>
        <OptionContent>
          <OptionTitle>Left-right</OptionTitle>
          <OptionDescription>
            Arrange tables from left to right based on their
            relationship direction. Ideal for diagrams with
            long relationship lineage like ETL pipelines.
          </OptionDescription>
        </OptionContent>
        <OptionNumber>1</OptionNumber>
      </AlignOption>

      <AlignOption onClick={() => handleSelect('snowflake')}>
        <IconContainer>
          <FaTh size={16} />
        </IconContainer>
        <OptionContent>
          <OptionTitle>Snowflake</OptionTitle>
          <OptionDescription>
            Arrange tables in a snowflake shape, with the
            most connected tables in the center. Ideal for
            densely connected diagrams like data
            warehouses.
          </OptionDescription>
        </OptionContent>
        <OptionNumber>2</OptionNumber>
      </AlignOption>

      <AlignOption onClick={() => handleSelect('compact')}>
        <IconContainer>
          <FaCompress size={16} />
        </IconContainer>
        <OptionContent>
          <OptionTitle>Compact</OptionTitle>
          <OptionDescription>
            Arrange tables in a compact rectangle layout.
            Ideal for diagrams with few relationships and
            tables.
          </OptionDescription>
        </OptionContent>
        <OptionNumber>3</OptionNumber>
      </AlignOption>
    </PopupContainer>
  );
};

export default AlignPopup;
