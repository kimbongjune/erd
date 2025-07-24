import React from 'react';
import styled from 'styled-components';
import { FaDatabase, FaKey, FaEye, FaCog } from 'react-icons/fa';

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
  if (!visible) return null;

  return (
    <PopupContainer onClick={(e) => e.stopPropagation()}>
      <Section>
        <SectionTitle>
          <FaDatabase size={14} />
          엔티티 보기방식
        </SectionTitle>
        <RadioGroup>
          <RadioOption>
            <RadioInput type="radio" name="entityView" value="logical" defaultChecked />
            <OptionText>논리</OptionText>
          </RadioOption>
          <RadioOption>
            <RadioInput type="radio" name="entityView" value="physical" />
            <OptionText>물리</OptionText>
          </RadioOption>
          <RadioOption>
            <RadioInput type="radio" name="entityView" value="both" />
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
            <Checkbox type="checkbox" defaultChecked />
            <OptionText>키</OptionText>
          </Option>
          <Option>
            <Checkbox type="checkbox" defaultChecked />
            <OptionText>물리</OptionText>
          </Option>
          <Option>
            <Checkbox type="checkbox" />
            <OptionText>논리</OptionText>
          </Option>
          <Option>
            <Checkbox type="checkbox" />
            <OptionText>같이</OptionText>
          </Option>
          <Option>
            <Checkbox type="checkbox" />
            <OptionText>제약조건</OptionText>
          </Option>
          <Option>
            <Checkbox type="checkbox" />
            <OptionText>기본값</OptionText>
          </Option>
        </OptionGroup>
      </Section>

      <Section>
        <SectionTitle>
          <FaCog size={14} />
          기타 옵션
        </SectionTitle>
        <OptionGroup>
          <Option>
            <Checkbox type="checkbox" />
            <OptionText>AI</OptionText>
          </Option>
        </OptionGroup>
      </Section>
    </PopupContainer>
  );
};

export default ViewPopup;
