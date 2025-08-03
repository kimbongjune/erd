import React, { useState } from 'react';

const allowedRegex = /^[a-zA-Z0-9_]*$/;

const Test: React.FC = () => {
  const [value, setValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const regex = /[^a-zA-Z0-9_]/;
    const korean = /[ㄱ-ㅎ|ㅏ-ㅣ]/;
    if(korean.test(e.target.value)) {
        console.log(e.target.value)
        return;
    }else{
        setValue(e.target.value);
    }

    // 조합 중에는 필터링하지 않음
  };

  return (
    <input
      type="text"
      value={value}
      onInput={handleChange}
      placeholder="영어, 숫자, _만 입력 가능"
    />
  );
};

export default Test;
