import React from 'react';
import styled from 'styled-components';
import { FaDatabase, FaKey } from 'react-icons/fa';
import useStore from '../store/useStore';

const PopupContainer = styled.div`
  position: absolute;
  bottom: 100px;
  right: 20px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 1000;
  backdrop-filter: blur(10px);
  min-width: 280px;
`;

const Section = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OptionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Option = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(0, 122, 204, 0.05);
  }
`;

const Checkbox = styled.input`
  margin: 0;
  cursor: pointer;
`;

const OptionText = styled.span`
  font-size: 13px;
  color: #555;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(0, 122, 204, 0.05);
  }
`;

const RadioInput = styled.input`
  margin: 0;
  cursor: pointer;
`;

interface ViewPopupProps {
  visible: boolean;
  onClose: () => void;
}

const ViewPopup: React.FC<ViewPopupProps> = ({ visible, onClose }) => {
  const { viewSettings, updateViewSettings } = useStore();
  
  if (!visible) return null;

  const handleEntityViewChange = (value: 'logical' | 'physical' | 'both') => {
    updateViewSettings({ entityView: value });
  };

  const handleColumnOptionChange = (option: string, checked: boolean) => {
    updateViewSettings({ [option]: checked });
  };

  return (
    <PopupContainer onClick={(e) => e.stopPropagation()}>
      <Section>
        <SectionTitle>
          <FaDatabase size={14} />
          엔티티 보기방식
        </SectionTitle>
        <RadioGroup>
          <RadioOption>
            <RadioInput 
              type="radio" 
              name="entityView" 
              value="logical" 
              checked={viewSettings.entityView === 'logical'}
              onChange={() => handleEntityViewChange('logical')}
            />
            <OptionText>논리</OptionText>
          </RadioOption>
          <RadioOption>
            <RadioInput 
              type="radio" 
              name="entityView" 
              value="physical" 
              checked={viewSettings.entityView === 'physical'}
              onChange={() => handleEntityViewChange('physical')}
            />
            <OptionText>물리</OptionText>
          </RadioOption>
          <RadioOption>
            <RadioInput 
              type="radio" 
              name="entityView" 
              value="both" 
              checked={viewSettings.entityView === 'both'}
              onChange={() => handleEntityViewChange('both')}
            />
            <OptionText>같이</OptionText>
          </RadioOption>
        </RadioGroup>
      </Section>

      <Section>
        <SectionTitle>
          <FaKey size={14} />
          컬럼보기방식
        </SectionTitle>
        <OptionGroup>
          <Option>
            <Checkbox 
              type="checkbox" 
              checked={viewSettings.showKeys}
              onChange={(e) => handleColumnOptionChange('showKeys', e.target.checked)}
            />
            <OptionText>키</OptionText>
          </Option>
          <Option>
            <Checkbox 
              type="checkbox" 
              checked={viewSettings.showPhysicalName}
              onChange={(e) => handleColumnOptionChange('showPhysicalName', e.target.checked)}
            />
            <OptionText>물리명</OptionText>
          </Option>
          <Option>
            <Checkbox 
              type="checkbox" 
              checked={viewSettings.showLogicalName}
              onChange={(e) => handleColumnOptionChange('showLogicalName', e.target.checked)}
            />
            <OptionText>논리명</OptionText>
          </Option>
          <Option>
            <Checkbox 
              type="checkbox" 
              checked={viewSettings.showDataType}
              onChange={(e) => handleColumnOptionChange('showDataType', e.target.checked)}
            />
            <OptionText>타입</OptionText>
          </Option>
          <Option>
            <Checkbox 
              type="checkbox" 
              checked={viewSettings.showConstraints}
              onChange={(e) => handleColumnOptionChange('showConstraints', e.target.checked)}
            />
            <OptionText>제약조건</OptionText>
          </Option>
          <Option>
            <Checkbox 
              type="checkbox" 
              checked={viewSettings.showDefaults}
              onChange={(e) => handleColumnOptionChange('showDefaults', e.target.checked)}
            />
            <OptionText>기본값</OptionText>
          </Option>
        </OptionGroup>
      </Section>
    </PopupContainer>
  );
};

export default ViewPopup;
