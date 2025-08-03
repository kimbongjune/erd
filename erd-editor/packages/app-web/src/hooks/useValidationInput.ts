import { useRef, useEffect, useCallback } from 'react';

export interface UseValidationInputOptions {
  onValueChange?: (value: string) => void;
  allowDataType?: boolean; // 데이터타입 필드인 경우 괄호 허용
}

export const useValidationInput = (options: UseValidationInputOptions = {}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const checkIntervalRef = useRef<number | null>(null);
  const { onValueChange, allowDataType = false } = options;

  // 허용된 문자만 필터링하는 함수
  const filterValue = useCallback((value: string): string => {
    if (!value) return '';
    
    let filtered: string;
    if (allowDataType) {
      // 데이터타입: 영어, 숫자, 언더바, 괄호만 허용하고 대문자로 변환
      filtered = value.replace(/[^a-zA-Z0-9_()]/g, '').toUpperCase();
    } else {
      // 일반: 영어, 숫자, 언더바만 허용
      filtered = value.replace(/[^a-zA-Z0-9_]/g, '');
    }
    
    // 숫자로 시작하는 경우 제거
    if (filtered && /^[0-9]/.test(filtered)) {
      filtered = filtered.replace(/^[0-9]+/, '');
    }
    
    return filtered;
  }, [allowDataType]);

  // 허용된 문자인지 확인하는 함수
  const isValidChar = useCallback((char: string): boolean => {
    if (allowDataType) {
      return /[a-zA-Z0-9_()]/.test(char);
    } else {
      return /[a-zA-Z0-9_]/.test(char);
    }
  }, [allowDataType]);

  // 키 입력 차단 (한국어 키 차단)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // 특수 키들은 허용 (백스페이스, 삭제, 화살표 등)
    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Tab', 'Enter', 'Escape', 'Ctrl', 'Alt', 'Shift'
    ];
    
    // Ctrl, Alt, Shift 조합은 허용
    if (e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }
    
    // 특수 키는 허용
    if (allowedKeys.includes(e.key)) {
      return;
    }
    
    // 입력되는 문자가 유효하지 않으면 차단 (한국어 등)
    if (e.key.length === 1 && !isValidChar(e.key)) {
      e.preventDefault();
      return;
    }
    
    // 숫자로 시작하는 것을 방지 (첫 글자가 숫자인 경우)
    if (e.key.length === 1 && /[0-9]/.test(e.key)) {
      const cursorPos = (e.target as HTMLInputElement).selectionStart || 0;
      const currentValue = (e.target as HTMLInputElement).value;
      
      // 커서가 맨 앞에 있고, 현재 값이 비어있거나 숫자를 입력하려는 경우
      if (cursorPos === 0 && (currentValue === '' || /^[0-9]/.test(currentValue))) {
        e.preventDefault();
        return;
      }
    }
  }, [isValidChar]);

  // 주기적으로 input 값을 체크하고 필터링 (백업용)
  const checkAndFilter = useCallback(() => {
    if (!inputRef.current) return;
    
    const currentValue = inputRef.current.value;
    const filtered = filterValue(currentValue);
    
    if (filtered !== currentValue) {
      // 커서 위치 저장
      const cursorPos = inputRef.current.selectionStart || 0;
      const removedCount = currentValue.length - filtered.length;
      
      // DOM에 직접 설정
      inputRef.current.value = filtered;
      
      // 커서 위치 복원
      const newCursorPos = Math.max(0, cursorPos - removedCount);
      inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      
      // 상태 업데이트
      if (onValueChange) {
        onValueChange(filtered);
      }
    }
  }, [filterValue, onValueChange]);

  // 컴포넌트 마운트 시 주기적 체크 시작 (백업용, 더 짧은 주기)
  useEffect(() => {
    // 10ms마다 체크 (더 빠르게)
    checkIntervalRef.current = window.setInterval(checkAndFilter, 10);
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkAndFilter]);

  // 포커스 해제 시 최종 체크
  const handleBlur = useCallback(() => {
    checkAndFilter();
  }, [checkAndFilter]);

  // 붙여넣기 처리
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    if (!inputRef.current) return;
    
    const currentValue = inputRef.current.value;
    const cursorPos = inputRef.current.selectionStart || 0;
    
    // 현재 커서 위치에 붙여넣기
    const newValue = currentValue.slice(0, cursorPos) + pastedText + currentValue.slice(cursorPos);
    const filtered = filterValue(newValue);
    
    // DOM에 직접 설정
    inputRef.current.value = filtered;
    
    // 커서 위치를 붙여넣은 텍스트 끝으로 이동
    const pastedFiltered = filterValue(pastedText);
    const newCursorPos = cursorPos + pastedFiltered.length;
    inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
    
    if (onValueChange) {
      onValueChange(filtered);
    }
  }, [filterValue, onValueChange]);

  return {
    inputRef,
    handleKeyDown,
    handleBlur,
    handlePaste,
    filterValue
  };
};
