/**
 * MySQL에서 지원하는 데이터타입 목록 (ABC 순 정렬)
 */
export const MYSQL_DATATYPES = [
  'BIGINT',
  'BINARY',
  'BIT',
  'BLOB',
  'BOOL',
  'BOOLEAN',
  'CHAR',
  'DATE',
  'DATETIME',
  'DECIMAL',
  'DOUBLE',
  'ENUM',
  'FLOAT',
  'GEOMETRY',
  'GEOMETRYCOLLECTION',
  'INT',
  'INTEGER',
  'JSON',
  'LINESTRING',
  'LONGBLOB',
  'LONGTEXT',
  'MEDIUMBLOB',
  'MEDIUMINT',
  'MEDIUMTEXT',
  'MULTILINESTRING',
  'MULTIPOINT',
  'MULTIPOLYGON',
  'NUMERIC',
  'POINT',
  'POLYGON',
  'REAL',
  'SET',
  'SMALLINT',
  'TEXT',
  'TIME',
  'TIMESTAMP',
  'TINYBLOB',
  'TINYINT',
  'TINYTEXT',
  'VARBINARY',
  'VARCHAR',
  'YEAR'
];

/**
 * 물리명에 허용되는 문자만 포함하는지 검증하는 정규식 (소문자 영어, 숫자, 밑줄만 허용)
 */
export const PHYSICAL_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * 물리명 입력값이 유효한지 검증하는 함수
 */
export const validatePhysicalName = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // 빈 값은 허용
  return PHYSICAL_NAME_REGEX.test(value);
};

/**
 * 영어(알파벳, 숫자, 언더스코어, 괄호)만 허용하는 정규식
 */
export const ENGLISH_ONLY_REGEX = /^[a-zA-Z][a-zA-Z0-9_()]*$/;

/**
 * 입력값이 영어만 포함하는지 검증하는 함수
 */
export const validateEnglishOnly = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // 빈 값은 허용
  return ENGLISH_ONLY_REGEX.test(value);
};

/**
 * 데이터타입이 유효한지 검증하는 함수 (영어 + MySQL 타입 가이드라인)
 */
export const validateDataType = (value: string): boolean => {
  if (!value) return true; // 빈 값은 허용
  
  // 기본 영어 검증
  if (!validateEnglishOnly(value)) return false;
  
  // 기본 MySQL 데이터타입 형태 검증 (대소문자 무관)
  const upperValue = value.toUpperCase();
  
  // 괄호가 있는 경우 괄호 앞 부분만 검증
  const typeWithoutParams = upperValue.split('(')[0];
  
  return true; // 일단 영어만 맞으면 허용 (사용자가 직접 입력할 수 있어야 하므로)
};

/**
 * SQL 내보내기 시 데이터타입 구문을 정밀하게 파싱하고 검증하는 함수
 */
export const validateDataTypeForSQL = (value: string): { isValid: boolean; error?: string } => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: '데이터타입이 비어있습니다.' };
  }

  const upperValue = value.toUpperCase();
  const typeWithoutParams = upperValue.split('(')[0];
  
  // 기본 MySQL 데이터타입인지 확인
  if (!MYSQL_DATATYPES.includes(typeWithoutParams)) {
    return { isValid: false, error: `지원하지 않는 데이터타입입니다: ${typeWithoutParams}` };
  }

  // 괄호가 있는 경우 구문 검증
  if (upperValue.includes('(') && !upperValue.includes(')')) {
    return { isValid: false, error: '괄호가 올바르게 닫히지 않았습니다.' };
  }

  // VARCHAR, CHAR 등의 길이 지정 검증
  if (['VARCHAR', 'CHAR', 'BINARY', 'VARBINARY'].includes(typeWithoutParams)) {
    const lengthMatch = upperValue.match(/^(\w+)\((\d+)\)$/);
    if (!lengthMatch) {
      return { isValid: false, error: `${typeWithoutParams}는 길이를 지정해야 합니다. (예: ${typeWithoutParams}(255))` };
    }
    const length = parseInt(lengthMatch[2]);
    if (length <= 0 || length > 65535) {
      return { isValid: false, error: `${typeWithoutParams}의 길이는 1-65535 사이여야 합니다.` };
    }
  }

  // DECIMAL, NUMERIC의 정밀도 검증
  if (['DECIMAL', 'NUMERIC'].includes(typeWithoutParams)) {
    const decimalMatch = upperValue.match(/^(\w+)\((\d+)(?:,(\d+))?\)$/);
    if (!decimalMatch) {
      return { isValid: false, error: `${typeWithoutParams}는 정밀도를 지정해야 합니다. (예: ${typeWithoutParams}(10,2))` };
    }
    const precision = parseInt(decimalMatch[2]);
    const scale = decimalMatch[3] ? parseInt(decimalMatch[3]) : 0;
    if (precision <= 0 || precision > 65) {
      return { isValid: false, error: `${typeWithoutParams}의 전체 자릿수는 1-65 사이여야 합니다.` };
    }
    if (scale > precision) {
      return { isValid: false, error: `${typeWithoutParams}의 소수점 자릿수는 전체 자릿수보다 클 수 없습니다.` };
    }
  }

  // ENUM, SET의 값 검증
  if (['ENUM', 'SET'].includes(typeWithoutParams)) {
    const enumMatch = upperValue.match(/^(\w+)\(([^)]+)\)$/);
    if (!enumMatch) {
      return { isValid: false, error: `${typeWithoutParams}는 값을 지정해야 합니다. (예: ${typeWithoutParams}('a','b','c'))` };
    }
    const values = enumMatch[2];
    // ENUM/SET 값들이 작은따옴표로 감싸져 있는지 확인
    const valuePattern = /'[^']*'/g;
    const matches = values.match(valuePattern);
    if (!matches || matches.length === 0) {
      return { isValid: false, error: `${typeWithoutParams}의 값들은 작은따옴표로 감싸야 합니다.` };
    }
  }

  return { isValid: true };
};
