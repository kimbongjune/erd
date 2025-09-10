'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

function Test() {
  const [displayValue, setDisplayValue] = useState('');
  const [controlledValue, setControlledValue] = useState(''); // 완전 제어용 상태
  const inputRef = useRef<HTMLInputElement>(null);
  const checkIntervalRef = useRef<number | null>(null);

  // 허용된 문자만 필터링하는 함수
  const filterValue = useCallback((value: string): string => {
    if (!value) return '';
    
    // 허용된 문자: 영어, 숫자, 언더바
    // 단, 숫자로 시작할 수 없음
    let filtered = value.replace(/[^a-zA-Z0-9_]/g, '');
    
    // 숫자로 시작하는 경우 제거
    if (filtered && /^[0-9]/.test(filtered)) {
      filtered = filtered.replace(/^[0-9]+/, '');
    }
    
    return filtered;
  }, []);

  // 허용된 문자인지 확인하는 함수
  const isValidChar = useCallback((char: string): boolean => {
    return /[a-zA-Z0-9_]/.test(char);
  }, []);

  // 완전 제어형 onChange (모든 입력의 최종 검문소)
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const filtered = filterValue(newValue);
    
    // 필터링된 값만 상태에 반영
    setControlledValue(filtered);
    setDisplayValue(filtered);
    
    // DOM 값도 강제로 필터링된 값으로 설정
    if (inputRef.current && inputRef.current.value !== filtered) {
      inputRef.current.value = filtered;
    }
  }, [filterValue]);

  // 키 입력 완전 차단 (한국어, 허용되지 않은 문자 모두 차단)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X 허용
    if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
      return;
    }
    
    // Backspace 처리
    if (e.key === 'Backspace') {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      const cursorStart = target.selectionStart || 0;
      const cursorEnd = target.selectionEnd || 0;
      const currentValue = controlledValue;
      
      let newValue: string;
      let newCursorPos: number;
      
      if (cursorStart !== cursorEnd) {
        // 선택된 텍스트 삭제
        newValue = currentValue.slice(0, cursorStart) + currentValue.slice(cursorEnd);
        newCursorPos = cursorStart;
      } else if (cursorStart > 0) {
        // 커서 앞 한 글자 삭제
        newValue = currentValue.slice(0, cursorStart - 1) + currentValue.slice(cursorStart);
        newCursorPos = cursorStart - 1;
      } else {
        return; // 삭제할 게 없음
      }
      
      setControlledValue(newValue);
      setDisplayValue(newValue);
      
      // 커서 위치 조정
      setTimeout(() => {
        if (target) {
          target.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
      return;
    }
    
    // Delete 처리
    if (e.key === 'Delete') {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      const cursorStart = target.selectionStart || 0;
      const cursorEnd = target.selectionEnd || 0;
      const currentValue = controlledValue;
      
      let newValue: string;
      let newCursorPos: number;
      
      if (cursorStart !== cursorEnd) {
        // 선택된 텍스트 삭제
        newValue = currentValue.slice(0, cursorStart) + currentValue.slice(cursorEnd);
        newCursorPos = cursorStart;
      } else if (cursorStart < currentValue.length) {
        // 커서 뒤 한 글자 삭제
        newValue = currentValue.slice(0, cursorStart) + currentValue.slice(cursorStart + 1);
        newCursorPos = cursorStart;
      } else {
        return; // 삭제할 게 없음
      }
      
      setControlledValue(newValue);
      setDisplayValue(newValue);
      
      // 커서 위치 유지
      setTimeout(() => {
        if (target) {
          target.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
      return;
    }
    
    // 이동 키들은 허용
    const navigationKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Enter', 'Escape'];
    if (navigationKeys.includes(e.key)) {
      return;
    }
    
    // 모든 문자 입력 차단 (허용된 문자도 일단 차단 - 직접 처리)
    e.preventDefault();
    e.stopPropagation();
    
    // 허용된 문자인 경우에만 직접 추가
    if (e.key.length === 1 && isValidChar(e.key)) {
      const target = e.target as HTMLInputElement;
      const cursorPos = target.selectionStart || 0;
      const currentValue = controlledValue;
      
      // 숫자로 시작하는 것 방지
      if (/[0-9]/.test(e.key) && cursorPos === 0) {
        return; // 차단
      }
      
      // 허용된 문자 직접 추가
      const newValue = currentValue.slice(0, cursorPos) + e.key + currentValue.slice(cursorPos);
      setControlledValue(newValue);
      setDisplayValue(newValue);
      
      // 커서 위치 조정
      setTimeout(() => {
        if (target) {
          target.setSelectionRange(cursorPos + 1, cursorPos + 1);
        }
      }, 0);
    }
  }, [isValidChar, controlledValue]);

  // 모든 조합 이벤트 완전 차단
  const handleCompositionStart = useCallback((e: React.CompositionEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleCompositionUpdate = useCallback((e: React.CompositionEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleCompositionEnd = useCallback((e: React.CompositionEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 모든 beforeinput 차단
  const handleBeforeInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 모든 input 이벤트 차단  
  const handleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 강제로 제어된 값으로 복원
    const target = e.target as HTMLInputElement;
    target.value = controlledValue;
  }, [controlledValue]);
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
    }
    
    // 표시용 상태 업데이트
    setDisplayValue(filtered);
  }, [filterValue]);

  // 컴포넌트 마운트 시 주기적 체크 시작 (더 빠른 백업 검증)
  useEffect(() => {
    // 5ms마다 체크 (더 빠르게 - 한국어 잔여물 즉시 제거)
    checkIntervalRef.current = window.setInterval(checkAndFilter, 5);
    
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
    
    setDisplayValue(filtered);
  }, [filterValue]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label>물리명 입력 (영어, 숫자, 언더바만 허용, 숫자로 시작 불가):</label>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={controlledValue}
        onChange={handleChange}
        onBeforeInput={handleBeforeInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionUpdate={handleCompositionUpdate}
        onCompositionEnd={handleCompositionEnd}
        onInput={handleInput}
        onBlur={handleBlur}
        onPaste={handlePaste}
        placeholder="table_name_1"
        style={{
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '14px',
          width: '300px'
        }}
      />
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        현재 값: "{displayValue}"
      </div>
      <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
        필터링 방식: Controlled Component + 모든입력차단 + 허용문자만직접추가
      </div>
    </div>
  );
}

export default Test;