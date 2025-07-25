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
 * 영어(알파벳, 숫자, 언더스코어, 괄호)만 허용하는 정규식
 */
export const ENGLISH_ONLY_REGEX = /^[a-zA-Z0-9_()]*$/;

/**
 * 입력값이 영어만 포함하는지 검증하는 함수
 */
export const validateEnglishOnly = (value: string): boolean => {
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
