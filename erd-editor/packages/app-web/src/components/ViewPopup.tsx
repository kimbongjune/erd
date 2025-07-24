import React from 'react';
import styled from 'styled-components';
import { FaDatabase, FaKey } from 'react-icons/fa';
import useStore from '../store/useStore';

const PopupContainer = styled.div<{ $darkMode?: boolean }>`
  position: absolute;
  bottom: 100px;
  left: 53.5%;
  transform: translateX(120px);
  background: ${props => props.$darkMode ? '#374151' : 'white'};
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e0e0e0'};
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

const SectionTitle = styled.h4<{ $darkMode?: boolean }>`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#333'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OptionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Option = styled.label<{ $darkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: ${props => props.$darkMode ? '#e2e8f0' : 'inherit'};
  
  &:hover {
    background: ${props => props.$darkMode ? '#4a5568' : '#f8f9fa'};
  }
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(0, 122, 204, 0.05);
  }
`;

const Checkbox = styled.input`
  margin: 0;
  cursor: pointer;
`;

const OptionText = styled.span<{ $darkMode?: boolean }>`
  font-size: 13px;
  color: ${props => props.$darkMode ? '#a0aec0' : '#555'};
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RadioOption = styled.label<{ $darkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.2s ease;
  color: ${props => props.$darkMode ? '#e2e8f0' : 'inherit'};
  
  &:hover {
    background: ${props => props.$darkMode ? 'rgba(0, 122, 204, 0.15)' : 'rgba(0, 122, 204, 0.05)'};
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
  const { viewSettings, updateViewSettings, theme } = useStore();
  
  if (!visible) return null;

  const isDarkMode = theme === 'dark';

  const handleEntityViewChange = (value: 'logical' | 'physical' | 'both') => {
    updateViewSettings({ entityView: value });
  };

  const handleColumnOptionChange = (option: string, checked: boolean) => {
    updateViewSettings({ [option]: checked });
  };

  return (
    <PopupContainer $darkMode={isDarkMode} onClick={(e) => e.stopPropagation()}>
      <Section>
        <SectionTitle $darkMode={isDarkMode}>
          <FaDatabase size={14} />
          엔티티 보기방식
        </SectionTitle>
        <RadioGroup>
          <RadioOption $darkMode={isDarkMode}>
            <RadioInput 
              type="radio" 
              name="entityView" 
              value="logical" 
              checked={viewSettings.entityView === 'logical'}
              onChange={() => handleEntityViewChange('logical')}
            />
            <OptionText $darkMode={isDarkMode}>논리</OptionText>
          </RadioOption>
          <RadioOption $darkMode={isDarkMode}>
            <RadioInput 
              type="radio" 
              name="entityView" 
              value="physical" 
              checked={viewSettings.entityView === 'physical'}
              onChange={() => handleEntityViewChange('physical')}
            />
            <OptionText $darkMode={isDarkMode}>물리</OptionText>
          </RadioOption>
          <RadioOption $darkMode={isDarkMode}>
            <RadioInput 
              type="radio" 
              name="entityView" 
              value="both" 
              checked={viewSettings.entityView === 'both'}
              onChange={() => handleEntityViewChange('both')}
            />
            <OptionText $darkMode={isDarkMode}>같이</OptionText>
          </RadioOption>
        </RadioGroup>
      </Section>

      <Section>
        <SectionTitle $darkMode={isDarkMode}>
          <FaKey size={14} />
          컬럼보기방식
        </SectionTitle>
        <OptionGroup>
          <Option $darkMode={isDarkMode}>
            <Checkbox 
              type="checkbox" 
              checked={viewSettings.showKeys}
              onChange={(e) => handleColumnOptionChange('showKeys', e.target.checked)}
            />
            <OptionText $darkMode={isDarkMode}>키</OptionText>
          </Option>
          <Option $darkMode={isDarkMode}>
            <Checkbox 
              type="checkbox" 
              checked={viewSettings.showPhysicalName}
              onChange={(e) => handleColumnOptionChange('showPhysicalName', e.target.checked)}
            />
            <OptionText $darkMode={isDarkMode}>물리명</OptionText>
          </Option>
          <Option $darkMode={isDarkMode}>
            <Checkbox 
              type="checkbox" 
              checked={viewSettings.showLogicalName}
              onChange={(e) => handleColumnOptionChange('showLogicalName', e.target.checked)}
            />
            <OptionText $darkMode={isDarkMode}>논리명</OptionText>
          </Option>
          <Option $darkMode={isDarkMode}>
            <Checkbox 
              type="checkbox" 
              checked={viewSettings.showDataType}
              onChange={(e) => handleColumnOptionChange('showDataType', e.target.checked)}
            />
            <OptionText $darkMode={isDarkMode}>타입</OptionText>
          </Option>
          <Option $darkMode={isDarkMode}>
            <Checkbox 
              type="checkbox" 
              checked={viewSettings.showConstraints}
              onChange={(e) => handleColumnOptionChange('showConstraints', e.target.checked)}
            />
            <OptionText $darkMode={isDarkMode}>제약조건</OptionText>
          </Option>
          <Option $darkMode={isDarkMode}>
            <Checkbox 
              type="checkbox" 
              checked={viewSettings.showDefaults}
              onChange={(e) => handleColumnOptionChange('showDefaults', e.target.checked)}
            />
            <OptionText $darkMode={isDarkMode}>기본값</OptionText>
          </Option>
        </OptionGroup>
      </Section>
    </PopupContainer>
  );
};

export default ViewPopup;
