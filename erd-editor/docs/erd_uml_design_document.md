## 웹 기반 ERD 다이어그램 에디터 상세 설계 문서

### 1. 개요

#### 1.1. 프로젝트 목표 및 비전
본 프로젝트는 웹 브라우저 환경에서 원활하게 동작하는 ERD(Entity-Relationship Diagram) 생성 및 편집 도구를 개발하는 것을 목표로 한다. 기존의 복잡하거나 특정 플랫폼에 종속적인 다이어그램 도구들의 한계를 극복하고, 사용자에게 직관적이고 효율적인 시각적 모델링 경험을 제공하여 데이터베이스 설계 프로세스를 혁신하고자 한다.

**비전:**
*   **접근성:** 언제 어디서든 웹 브라우저를 통해 접근 가능하며, 직관적인 UI/UX를 제공한다.
*   **생산성:** 드래그 앤 드롭, 자동 정렬, 단축키 등 직관적인 UI/UX를 통해 설계 시간을 단축하고 생산성을 극대화한다.
*   **정확성:** ERD의 DDL(Data Definition Language) 생성 등, 다이어그램과 실제 데이터베이스 스키마 간의 동기화를 지원하여 설계 오류를 줄인다.
*   **확장성:** 향후 다양한 데이터베이스 Dialect 및 외부 시스템 연동을 용이하게 한다.

#### 1.2. 대상 사용자 및 활용 시나리오
*   **소프트웨어 개발자 (프론트엔드/백엔드):**
    *   **시나리오:** 새로운 기능 개발 전 데이터베이스 스키마를 ERD로 설계하거나, 기존 시스템의 데이터베이스 구조를 분석한다. 설계 내용을 팀원들과 공유하고 피드백을 반영하여 빠르게 수정한다.
*   **데이터베이스 관리자(DBA) / 데이터 모델러:**
    *   **시나리오:** 데이터베이스 변경 요청 시, 기존 ERD를 불러와 수정하고, 변경된 ERD를 기반으로 SQL DDL 스크립트를 자동 생성하여 데이터베이스에 적용한다.
*   **프로젝트 관리자(PM) / 기획자:**
    *   **시나리오:** 데이터베이스 관련 요구사항을 명확히 정의하고, 개발팀과의 커뮤니케이션을 위해 데이터베이스 구조를 ERD로 표현한다.
*   **컴퓨터 공학 학생 / 교육자:**
    *   **시나리오:** 데이터베이스 수업에서 ERD를 직접 그려보며 개념을 익히거나, 데이터 모델링 과제에서 ERD를 활용하여 설계 능력을 향상시킨다.

#### 1.3. 핵심 특징 및 차별점
*   **직관적인 UI/UX:**
    *   **드래그 앤 드롭:** 툴박스에서 요소를 캔버스로 쉽게 끌어다 놓아 다이어그램을 구성한다.
    *   **인라인 편집:** 다이어그램 요소의 텍스트를 더블 클릭하여 즉시 편집할 수 있도록 지원한다.
    *   **스마트 가이드:** 요소 이동 시 다른 요소와의 정렬을 돕는 시각적 가이드라인을 제공한다.
    *   **MySQL Workbench와 유사한 직관적이고 미려한 아이콘:** 좌측 도구 모음은 사용자가 기능을 쉽게 인지하고 사용할 수 있도록 직관적이고 시각적으로 아름다운 아이콘으로 구성한다.
*   **강력한 파일 관리 및 연동:**
    *   **프로젝트 기반 저장:** 단일 `.json` 파일에 ERD 데이터를 포함하여 저장하는 구조로, 프로젝트 단위의 관리를 용이하게 한다.
    *   **로컬 파일 시스템 연동:** 웹 버전에서는 File System Access API를 통해 로컬 파일 시스템에 직접 파일을 저장하고 불러올 수 있는 경험을 제공한다.
    *   **자동 저장 및 복구:** 사용자 작업 내용을 주기적으로 임시 저장하여 예기치 않은 종료 시에도 작업 내용을 복구할 수 있도록 한다.
*   **유연한 내보내기:**
    *   **이미지 내보내기:** PNG, SVG 형식으로 다이어그램을 고품질로 내보내어 문서화 및 공유를 용이하게 한다.
    *   **SQL DDL 생성 (ERD):** 작성된 ERD를 기반으로 `CREATE TABLE`, `ALTER TABLE` 등의 SQL DDL 스크립트를 자동 생성하여 데이터베이스 구축 시간을 단축한다. (초기에는 MySQL Dialect만 지원)
    *   **JSON 데이터 내보내기:** 프로젝트 전체 데이터를 JSON 형식으로 내보낼 수 있어, 다른 도구와의 연동 또는 백업/복원에 활용할 수 있다.

---

### 2. 기능 정의서

#### 2.1. 공통 에디터 기능

*   **캔버스 관리:**
    *   **무한 캔버스:** 사용자가 제약 없이 다이어그램을 확장할 수 있는 무한 스크롤 캔버스.
    *   **확대/축소 (Zoom In/Out):** 마우스 휠 또는 트랙패드 제스처를 통한 부드러운 확대/축소. 특정 영역 확대/축소 기능도 제공.
    *   **이동 (Pan):** 스페이스바 + 드래그 또는 마우스 우클릭 + 드래그를 통한 캔버스 이동.
    *   **그리드 및 스냅:**
        *   **그리드:** 배경에 격자 무늬를 표시하여 요소 정렬을 돕는다. 그리드 간격 조절 및 표시/숨김 기능.
        *   **스냅:** 요소를 이동하거나 크기를 조절할 때 그리드 선이나 다른 요소에 자동으로 스냅되어 정확한 정렬을 돕는다.
*   **요소(Node) 및 연결선(Edge) 조작:**
    *   **요소 추가:**
        *   좌측 툴박스에서 원하는 요소를 캔버스로 드래그 앤 드롭.
        *   캔버스 특정 위치 더블 클릭 시 기본 요소 자동 생성.
        *   단축키를 통한 요소 추가 (예: `E` 키로 Entity 추가).
    *   **요소 선택:** 단일 선택 (클릭), 다중 선택 (Shift + 클릭, 드래그 박스 선택).
    *   **요소 이동 및 크기 조절:** 드래그를 통한 이동, 핸들을 통한 크기 조절. 비율 유지 옵션.
    *   **연결선 생성:** 요소의 연결 포트(Anchor Point)를 드래그하여 다른 요소의 연결 포트로 연결. 연결선 유형(직선, 곡선, 직각선) 선택 가능.
    *   **속성 편집 (우측 속성 패널):**
        *   선택된 요소의 모든 속성(텍스트, 색상, 폰트, 크기, 관계 유형 등)을 실시간으로 편집.
        *   입력 유효성 검사 및 피드백 제공.
        *   컨텍스트 메뉴 (우클릭): 선택된 요소에 대한 빠른 작업 메뉴 제공 (복사, 붙여넣기, 삭제, 정렬, 그룹화 등).
*   **실행 취소/다시 실행 (Undo/Redo):** 모든 캔버스 조작 및 속성 변경에 대한 무제한 실행 취소/다시 실행 지원. (Command/Ctrl + Z, Command/Ctrl + Shift + Z)
*   **복사/붙여넣기/잘라내기 (Copy/Paste/Cut):** 선택된 요소를 클립보드에 복사하여 다른 위치나 다른 다이어그램에 붙여넣기. (Command/Ctrl + C, V, X)
*   **그룹화/그룹 해제:** 여러 요소를 하나의 그룹으로 묶어 함께 이동, 복사, 삭제할 수 있도록 지원.
*   **레이어 관리:** 요소들의 Z-index를 조절하여 앞/뒤 순서 변경 (맨 앞으로 가져오기, 맨 뒤로 보내기 등).

#### 2.2. ERD 기능 상세

*   **엔티티 (Entity):**
    *   **속성 (컬럼) 관리:**
        *   컬럼 추가/삭제/순서 변경.
        *   컬럼별 이름, 데이터 타입(VARCHAR, INT, DATE 등), 길이, NULL 허용 여부, 기본값 설정.
        *   **키(Key) 지정:** Primary Key (PK), Foreign Key (FK), Unique Key (UK) 명확히 표시.
        *   PK는 밑줄, FK는 기울임꼴 등으로 시각적 구분.
    *   **인덱스 (Index) 관리:**
        *   엔티티 내에서 인덱스 생성, 편집, 삭제 기능.
        *   인덱스 타입 (PRIMARY, UNIQUE, INDEX), 컬럼 선택, 정렬 순서 (ASC/DESC) 설정.
    *   **외래키 (Foreign Key) 관리:**
        *   엔티티 간 관계 설정 시 외래키 생성 및 편집 기능.
        *   `ON UPDATE` (CASCADE, SET NULL, NO ACTION, RESTRICT) 및 `ON DELETE` (CASCADE, SET NULL, NO ACTION, RESTRICT) 옵션 선택 기능.
    *   **표기법:** Crow's Foot (까마귀발) 표기법을 기본으로 지원.
*   **관계 (Relationship):**
    *   **카디널리티 (Cardinality):** 1:1, 1:N, N:M 관계를 시각적으로 명확하게 표현 (예: 1, 0..1, 1..*, 0..*).
    *   **식별/비식별 관계:**
        *   **식별 관계 (Identifying Relationship):** 부모 엔티티의 PK가 자식 엔티티의 PK의 일부가 되는 경우. 실선으로 표현.
        *   **비식별 관계 (Non-Identifying Relationship):** 부모 엔티티의 PK가 자식 엔티티의 일반 속성(FK)이 되는 경우. 점선으로 표현.
    *   **관계명:** 관계선에 관계의 의미를 나타내는 텍스트 추가.
*   **SQL DDL (Data Definition Language) 내보내기:**
    *   작성된 ERD를 기반으로 `CREATE TABLE`, `ALTER TABLE` (FK 제약조건) 등의 SQL 스크립트 자동 생성.
    *   **데이터베이스 Dialect:** 초기에는 **MySQL** Dialect만 지원.
    *   생성된 SQL 스크립트 미리보기 및 복사 기능.

#### 2.3. 파일 및 프로젝트 관리 상세

*   **프로젝트 파일 형식 (`.erd`):**
    *   모든 ERD 데이터, 캔버스 설정, 메타데이터(프로젝트 이름, 생성일, 수정일)를 포함하는 단일 JSON 파일.
    *   파일 확장자는 `.erd`를 사용하여 본 애플리케이션과의 연관성을 명확히 한다.
    *   내부적으로는 버전 관리를 위한 `version` 필드를 포함하여 향후 스키마 변경에 대비한다.
*   **저장/불러오기 메커니즘 (웹):**
    *   `window.showSaveFilePicker()` 및 `window.showOpenFilePicker()`를 사용하여 사용자에게 파일 저장/열기 대화상자를 제공.
    *   사용자 권한 하에 로컬 파일 시스템에 직접 파일을 읽고 쓸 수 있어 데스크톱 앱과 유사한 경험 제공. (브라우저 지원 여부 확인 및 폴백 처리 필요)
    *   **폴백:** File System Access API를 지원하지 않는 브라우저의 경우, 파일 다운로드/업로드 방식으로 대체.
*   **자동 저장 및 복구:**
    *   **주기적 자동 저장:** 사용자가 작업 중인 다이어그램 데이터를 `localStorage`에 주기적으로 임시 저장. (예: 5분 간격)
    *   **복구 기능:** 애플리케이션 재시작 시, 임시 저장된 데이터가 있을 경우 사용자에게 복구 여부를 묻는 대화상자 제공.
*   **내보내기 (Export):**
    *   **이미지 (PNG, SVG):**
        *   **PNG:** 캔버스 내용을 비트맵 이미지로 렌더링. 배경 투명도 옵션 제공.
        *   **SVG:** 캔버스 내용을 벡터 이미지로 렌더링. 확대해도 깨지지 않아 고품질 문서에 적합.
    *   **JSON 데이터:** 현재 프로젝트의 모든 다이어그램 데이터를 포함하는 `.json` 파일로 내보내기.

---

### 3. 화면 설계서 (UI/UX Design)

#### 3.1. 레이아웃 및 인터랙션 플로우 (erdcloud1.png, erdcloud2.png 참조)

*   **상단 헤더 (Top Header):**
    *   **ERD 이름:** 현재 작업 중인 ERD의 이름이 중앙 상단에 크게 표시된다. (erdcloud1.png 참조)
    *   **메뉴 바:** "파일", "편집", "보기", "도움말" 등 표준 애플리케이션 메뉴.
        *   **파일:** 새 프로젝트, 열기, 저장, 다른 이름으로 저장, 내보내기(이미지, SQL, JSON).
        *   **편집:** 실행 취소/다시 실행, 잘라내기, 복사, 붙여넣기, 삭제, 모두 선택.
        *   **보기:** 확대/축소, 그리드 표시/숨김, 다크/라이트 모드 전환.
    *   **설정 버튼:** 우측 상단에 톱니바퀴 아이콘의 설정 버튼이 위치한다. 클릭 시 `erdcloud2.png`와 유사한 설정 메뉴가 한국어로 표시된다.
        *   **설정 메뉴 항목 (예시):** "테마 설정", "그리드 설정", "단축키", "언어", "정보" 등.
*   **왼쪽 패널 (도구 모음 - Left Sidebar / Toolbox):** (mysqlworkbench1.png 참조)
    *   **직관적이고 미려한 아이콘:** MySQL Workbench와 유사하게 각 기능(엔티티, 관계선, 주석 등)을 대표하는 직관적이고 시각적으로 아름다운 아이콘으로 구성된다.
    *   **요소 팔레트:** ERD 요소(엔티티, 관계선, 주석 등) 목록.
        *   각 요소를 캔버스로 드래그 앤 드롭하여 추가.
        *   요소 아이콘과 함께 간략한 설명 툴팁 제공.
*   **중앙 캔버스 (Main Canvas):**
    *   **주 작업 공간:** ERD 요소들이 배치되고 편집되는 핵심 영역.
    *   **그리드:** 배경에 그리드 표시 (설정에서 켜고 끌 수 있음).
    *   **미니맵:** 캔버스 우측 하단에 전체 다이어그램의 축소판을 표시하여 넓은 캔버스에서 현재 위치를 파악하고 빠르게 이동할 수 있도록 돕는다.
    *   **컨텍스트 메뉴:** 캔버스 빈 공간 우클릭 시 캔버스 관련 작업(새 요소 추가, 붙여넣기, 전체 확대/축소 등) 메뉴 제공.
*   **하단 패널 (속성 편집기 - Bottom Panel / Property Editor):** (mysqlworkbench2.png 참조)
    *   **엔티티 더블 클릭 시 활성화:** 캔버스에서 엔티티를 더블 클릭하면 화면 하단에 해당 엔티티의 상세 속성을 편집할 수 있는 패널이 나타난다.
    *   **크기 조절 가능:** 패널의 상단 경계를 드래그하여 패널의 높이를 조절할 수 있다.
    *   **탭 구성:** "컬럼", "인덱스", "외래키" 등의 탭으로 구성되어 각 항목별 상세 편집 기능을 제공한다.
        *   **컬럼 탭:** 선택된 엔티티의 컬럼 목록을 표시하고, 컬럼 추가/삭제/편집(이름, 데이터 타입, PK/FK, NULL 허용, 기본값) 기능을 제공한다.
        *   **인덱스 탭:** 선택된 엔티티의 인덱스 목록을 표시하고, 인덱스 생성/편집/삭제 기능을 제공한다. (인덱스 타입, 컬럼 선택, 정렬 순서)
        *   **외래키 탭:** 선택된 엔티티의 외래키 목록을 표시하고, 외래키 생성/편집/삭제 기능을 제공한다. (참조 테이블, 참조 컬럼, ON UPDATE, ON DELETE 옵션)
*   **우측 패널 (속성 관리자 - Right Sidebar / Property Inspector):**
    *   **선택된 요소의 속성 표시:** 캔버스에서 노드나 엣지가 선택되면 해당 요소의 모든 편집 가능한 속성(이름, 색상, 폰트, 관계 유형, 카디널리티 등)을 동적으로 표시.
    *   **속성 편집 UI:** 텍스트 입력 필드, 드롭다운, 체크박스, 색상 피커 등 적절한 UI 컨트롤 제공.
    *   **실시간 업데이트:** 속성 변경 시 캔버스에 즉시 반영.
    *   **유효성 검사:** 입력 값에 대한 유효성 검사 및 오류 메시지 표시.

#### 3.2. 핵심 인터랙션 상세

*   **요소 추가:**
    1.  왼쪽 툴박스에서 '엔티티' 아이콘을 클릭하거나 캔버스로 드래그 앤 드롭.
    2.  캔버스에 새로운 엔티티 노드가 생성된다.
    3.  엔티티 노드를 더블 클릭하여 이름을 즉시 편집하거나, 우측 속성 패널에서 이름을 변경한다.
*   **컬럼 추가 (ERD 엔티티):**
    1.  엔티티 노드를 더블 클릭하여 하단 패널을 연다.
    2.  하단 패널의 '컬럼' 탭에서 '컬럼 추가' 버튼을 클릭한다.
    3.  새로운 컬럼 필드가 나타나면 이름, 데이터 타입, PK/FK 여부 등을 입력한다.
*   **인덱스 생성 (ERD 엔티티):**
    1.  엔티티 노드를 더블 클릭하여 하단 패널을 연다.
    2.  하단 패널의 '인덱스' 탭으로 이동한다.
    3.  '인덱스 추가' 버튼을 클릭하고, 인덱스 타입, 포함할 컬럼, 정렬 순서 등을 설정한다.
*   **외래키 생성 (ERD 엔티티):**
    1.  엔티티 노드를 더블 클릭하여 하단 패널을 연다.
    2.  하단 패널의 '외래키' 탭으로 이동한다.
    3.  '외래키 추가' 버튼을 클릭하고, 참조할 테이블과 컬럼을 선택한 후, `ON UPDATE` 및 `ON DELETE` 옵션을 설정한다.
*   **관계선 연결:**
    1.  첫 번째 엔티티 노드의 연결 포트(예: 우측 중앙)를 클릭하고 드래그한다.
    2.  드래그하는 동안 관계선 미리보기가 표시된다.
    3.  두 번째 엔티티 노드의 연결 포트에 드롭하면 관계선이 생성된다.
    4.  생성된 관계선을 선택하여 우측 속성 패널에서 카디널리티, 관계 유형(식별/비식별), 관계명 등을 설정한다.
*   **실행 취소/다시 실행:**
    1.  사용자가 어떤 작업을 수행한다 (예: 노드 이동).
    2.  `Ctrl+Z` (Windows) 또는 `Cmd+Z` (macOS)를 누르면 이전 상태로 돌아간다.
    3.  `Ctrl+Shift+Z` 또는 `Cmd+Shift+Z`를 누르면 다시 실행된다.

#### 3.3. 접근성 (Accessibility) 고려 사항

*   **키보드 내비게이션:** 모든 UI 요소와 캔버스 상의 요소들이 키보드만으로 조작 가능하도록 설계 (Tab, Arrow keys, Enter, Spacebar 등).
*   **스크린 리더 지원:** ARIA(Accessible Rich Internet Applications) 속성을 사용하여 스크린 리더 사용자가 UI 요소와 콘텐츠를 이해하고 상호작용할 수 있도록 한다.
*   **색상 대비:** WCAG(Web Content Accessibility Guidelines) 2.1 AA 등급 이상의 색상 대비를 준수하여 시각 장애가 있는 사용자도 콘텐츠를 명확하게 볼 수 있도록 한다.
*   **확대/축소:** 브라우저의 기본 확대/축소 기능과 애플리케이션 내의 캔버스 확대/축소 기능이 모두 원활하게 작동하도록 한다.

#### 3.4. 테마 및 디자인 시스템

*   **다크/라이트 모드:** 사용자의 시스템 설정 또는 애플리케이션 내 토글을 통해 다크 모드와 라이트 모드를 전환할 수 있도록 지원하여 눈의 피로도를 줄이고 개인 선호도를 존중한다.
*   **일관된 디자인 시스템:**
    *   **컴포넌트 라이브러리:** 재사용 가능한 UI 컴포넌트(버튼, 입력 필드, 모달, 아이콘 등)를 정의하고 일관된 스타일을 적용한다.
    *   **타이포그래피:** 가독성을 고려한 폰트 패밀리, 크기, 줄 간격 등을 정의한다.
    *   **색상 팔레트:** 브랜드 아이덴티티를 반영하고 접근성을 고려한 색상 팔레트를 정의한다.
    *   **아이콘:** 직관적이고 통일된 아이콘 세트를 사용한다.

---

### 4. 데이터 모델 (JSON 스키마) 상세

프로젝트 파일은 `.erd` 확장자를 가지는 JSON 형식으로 저장된다. 이 스키마는 ERD의 모든 요소와 그 속성을 포함하며, React Flow의 내부 데이터 구조와 호환되도록 설계된다.

```json
{
  "projectName": "My ERD Project",
  "version": "1.0.0",
  "createdAt": "2025-07-19T10:00:00Z",
  "lastModifiedAt": "2025-07-19T11:30:00Z",
  "diagrams": [
    {
      "id": "diag-erd-users",
      "name": "User Management ERD",
      "type": "ERD",
      "nodes": [
        {
          "id": "entity-user",
          "type": "erd-entity",
          "position": { "x": 100, "y": 150 },
          "data": {
            "name": "User",
            "attributes": [
              { "id": "attr-user-id", "name": "user_id", "dataType": "INT", "isPK": true, "isFK": false, "isNullable": false, "defaultValue": null, "comment": "Primary key for User" },
              { "id": "attr-user-name", "name": "username", "dataType": "VARCHAR(50)", "isPK": false, "isFK": false, "isNullable": false, "defaultValue": null, "comment": "Unique username" },
              { "id": "attr-user-email", "name": "email", "dataType": "VARCHAR(100)", "isPK": false, "isFK": false, "isNullable": false, "defaultValue": null, "comment": "User email address" },
              { "id": "attr-user-created", "name": "created_at", "dataType": "DATETIME", "isPK": false, "isFK": false, "isNullable": false, "defaultValue": "CURRENT_TIMESTAMP", "comment": "Record creation timestamp" }
            ],
            "indexes": [
              { "id": "idx-username", "name": "idx_username", "type": "UNIQUE", "columns": [{ "name": "username", "sort": "ASC" }] }
            ]
          },
          "width": 200,
          "height": 180
        },
        {
          "id": "entity-post",
          "type": "erd-entity",
          "position": { "x": 400, "y": 150 },
          "data": {
            "name": "Post",
            "attributes": [
              { "id": "attr-post-id", "name": "post_id", "dataType": "INT", "isPK": true, "isFK": false, "isNullable": false, "defaultValue": null, "comment": "Primary key for Post" },
              { "id": "attr-post-title", "name": "title", "dataType": "VARCHAR(255)", "isPK": false, "isFK": false, "isNullable": false, "defaultValue": null, "comment": "Post title" },
              { "id": "attr-post-content", "name": "content", "dataType": "TEXT", "isPK": false, "isFK": false, "isNullable": true, "defaultValue": null, "comment": "Post content" },
              { "id": "attr-post-user-id", "name": "user_id", "dataType": "INT", "isPK": false, "isFK": true, "isNullable": false, "defaultValue": null, "comment": "Foreign key to User" }
            ],
            "indexes": [],
            "foreignKeys": [
              { "id": "fk-post-user", "name": "fk_post_user", "sourceColumn": "user_id", "targetEntity": "User", "targetColumn": "user_id", "onUpdate": "CASCADE", "onDelete": "RESTRICT" }
            ]
          },
          "width": 200,
          "height": 200
        }
      ],
      "edges": [
        {
          "id": "edge-user-post",
          "source": "entity-user",
          "target": "entity-post",
          "type": "erd-relationship",
          "sourceHandle": "bottom",
          "targetHandle": "left",
          "data": {
            "sourceCardinality": "1",
            "targetCardinality": "N",
            "relationshipType": "non-identifying",
            "name": "writes"
          }
        }
      ],
      "viewport": { "x": 0, "y": 0, "zoom": 1 }
    }
  ]
}
```

**스키마 설명:**

*   **`projectName` (string):** 프로젝트의 이름.
*   **`version` (string):** 프로젝트 파일 스키마의 버전. 향후 하위 호환성 유지를 위해 사용.
*   **`createdAt` (string):** 프로젝트 생성 일시 (ISO 8601 형식).
*   **`lastModifiedAt` (string):** 프로젝트 최종 수정 일시 (ISO 8601 형식).
*   **`diagrams` (Array<Object>):** 프로젝트 내에 포함된 다이어그램들의 배열.
    *   **`id` (string):** 다이어그램의 고유 ID.
    *   **`name` (string):** 다이어그램의 이름.
    *   **`type` (string):** 다이어그램의 유형 (현재는 "ERD"만 지원).
    *   **`nodes` (Array<Object>):** 다이어그램 내의 모든 노드(요소) 배열. React Flow의 Node 객체 구조를 따른다.
        *   **`id` (string):** 노드의 고유 ID.
        *   **`type` (string):** 노드의 커스텀 타입 (예: "erd-entity"). 이를 통해 React Flow에서 해당 타입에 맞는 커스텀 컴포넌트를 렌더링한다.
        *   **`position` (Object):** 캔버스 내 노드의 `x`, `y` 좌표.
        *   **`data` (Object):** 노드에 특화된 데이터.
            *   **`erd-entity` 타입의 `data`:**
                *   `name` (string): 엔티티 이름.
                *   `attributes` (Array<Object>): 속성(컬럼) 배열.
                    *   `id` (string): 속성 고유 ID.
                    *   `name` (string): 속성 이름.
                    *   `dataType` (string): 데이터 타입 (예: "INT", "VARCHAR(255)").
                    *   `isPK` (boolean): Primary Key 여부.
                    *   `isFK` (boolean): Foreign Key 여부.
                    *   `isNullable` (boolean): NULL 허용 여부.
                    *   `defaultValue` (string | null): 기본값.
                    *   `comment` (string | null): 속성 설명.
                *   `indexes` (Array<Object>): 인덱스 배열.
                    *   `id` (string): 인덱스 고유 ID.
                    *   `name` (string): 인덱스 이름.
                    *   `type` (string): 인덱스 타입 ("PRIMARY", "UNIQUE", "INDEX").
                    *   `columns` (Array<Object>): 인덱스에 포함될 컬럼 배열.
                        *   `name` (string): 컬럼 이름.
                        *   `sort` (string): 정렬 순서 ("ASC", "DESC").
                *   `foreignKeys` (Array<Object>): 외래키 배열.
                    *   `id` (string): 외래키 고유 ID.
                    *   `name` (string): 외래키 이름.
                    *   `sourceColumn` (string): 현재 엔티티의 외래키 컬럼 이름.
                    *   `targetEntity` (string): 참조하는 엔티티 이름.
                    *   `targetColumn` (string): 참조하는 엔티티의 컬럼 이름.
                    *   `onUpdate` (string): `ON UPDATE` 액션 ("CASCADE", "SET NULL", "NO ACTION", "RESTRICT").
                    *   `onDelete` (string): `ON DELETE` 액션 ("CASCADE", "SET NULL", "NO ACTION", "RESTRICT").
        *   **`width` (number), `height` (number):** 노드의 크기 (선택 사항, React Flow에서 자동 계산될 수 있음).
    *   **`edges` (Array<Object>):** 다이어그램 내의 모든 연결선 배열. React Flow의 Edge 객체 구조를 따른다.
        *   **`id` (string):** 엣지의 고유 ID.
        *   **`source` (string):** 시작 노드의 ID.
        *   **`target` (string):** 끝 노드의 ID.
        *   **`type` (string):** 엣지의 커스텀 타입 (예: "erd-relationship").
        *   **`sourceHandle` (string), `targetHandle` (string):** 연결 포트의 ID (React Flow에서 사용).
        *   **`data` (Object):** 엣지에 특화된 데이터.
            *   **`erd-relationship` 타입의 `data`:**
                *   `sourceCardinality` (string): 시작 엔티티의 카디널리티 (예: "1", "N").
                *   `targetCardinality` (string): 대상 엔티티의 카디널리티 (예: "1", "N", "M").
                *   `relationshipType` (string): 관계 유형 ("identifying", "non-identifying").
                *   `name` (string | null): 관계 이름.
    *   **`viewport` (Object):** 캔버스의 현재 뷰포트 상태 (`x`, `y` 이동, `zoom` 레벨).

---

### 5. 기술 스택 및 아키텍처 상세

#### 5.1. 기술 스택 선정 이유

*   **언어: TypeScript**
    *   **선정 이유:** 대규모 애플리케이션 개발에 필수적인 타입 안정성을 제공하여 런타임 오류를 줄이고 코드의 가독성 및 유지보수성을 향상시킨다. 풍부한 IDE 지원으로 개발 생산성을 높인다.
*   **UI 프레임워크: React.js**
    *   **선정 이유:** 선언적 UI 개발, 컴포넌트 기반 아키텍처, 활발한 커뮤니티 및 방대한 생태계를 통해 빠르고 효율적인 UI 개발이 가능하다. 특히 다이어그램 에디터와 같이 복잡한 UI 상호작용이 많은 애플리케이션에 적합하다.
*   **다이어그램 라이브러리: React Flow**
    *   **선정 이유:** 노드 기반 에디터 구축에 특화된 라이브러리로, 높은 유연성과 확장성을 제공한다. 커스텀 노드 및 엣지 구현이 용이하며, 줌, 팬, 미니맵 등 다이어그램 에디터에 필요한 핵심 기능을 내장하고 있어 개발 시간을 단축할 수 있다. MIT 라이선스로 상업적 사용에 제약이 적다.
*   **상태 관리: Zustand 또는 Recoil**
    *   **선정 이유:** Redux와 같은 복잡한 상태 관리 라이브러리보다 가볍고 직관적인 API를 제공하여 학습 곡선이 낮고 개발 편의성이 높다. 특히 React의 Context API와 함께 사용하여 전역 상태 관리를 효율적으로 할 수 있다. 다이어그램 데이터와 같은 복잡한 객체 상태 관리에 용이하다.
*   **스타일링:** Styled-components (컴포넌트 기반 스타일링 및 동적 테마 지원)
*   **빌드/번들러: Vite**
    *   **선정 이유:** ES Module 기반의 빠른 개발 서버 시작 및 HMR(Hot Module Replacement)을 제공하여 개발 경험을 크게 향상시킨다. Rollup 기반의 최적화된 프로덕션 빌드를 생성하여 성능이 우수하다.
*   **패키지 매니저: pnpm**
    *   **선정 이유:** 모노레포 환경에서 의존성 설치 속도가 빠르고 디스크 공간을 효율적으로 사용한다(하드 링크를 통한 중복 제거). `workspace` 기능을 통해 모노레포 내 패키지 간의 의존성 관리가 용이하다.

#### 5.2. 프로젝트 구조 (모노레포 아키텍처)

pnpm workspace를 활용한 모노레포 구조는 코드 재사용성, 일관된 개발 환경, 효율적인 의존성 관리를 가능하게 한다.

```
/erd-editor
├── packages/
│   ├── core/             # 플랫폼 독립적인 핵심 로직 및 데이터 모델
│   │   ├── src/
│   │   │   ├── data-models/  # ERD 요소의 TypeScript 인터페이스 및 클래스 정의
│   │   │   ├── services/     # DDL 생성, 데이터 변환 등 비즈니스 로직
│   │   │   └── utils/        # 공통 유틸리티 함수
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── app-web/          # 웹 애플리케이션 (React.js)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/   # 재사용 가능한 UI 컴포넌트
│   │   │   ├── hooks/        # React Custom Hooks
│   │   │   ├── pages/        # 라우팅 페이지
│   │   │   ├── styles/       # Styled-components 설정 및 전역 스타일
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── ui-components/    # (선택 사항) 공통 UI 컴포넌트 라이브러리 (Storybook 연동 고려)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
│
├── pnpm-workspace.yaml   # pnpm 워크스페이스 설정
├── package.json          # 루트 패키지 (스크립트, 개발 의존성)
├── tsconfig.json         # 루트 TypeScript 설정
└── README.md
```

*   **`packages/core`:**
    *   **역할:** 다이어그램의 데이터 모델(엔티티, 관계 등) 정의, DDL 생성 로직, 다이어그램 데이터 변환 및 유효성 검사 등 플랫폼에 독립적인 핵심 비즈니스 로직을 포함한다.
    *   **의존성:** 다른 `packages`에서 이 패키지를 의존하여 핵심 기능을 재사용한다.
*   **`packages/app-web`:**
    *   **역할:** `core` 패키지의 비즈니스 로직을 활용하여 사용자에게 다이어그램 편집 UI를 제공하는 웹 애플리케이션. React Flow를 사용하여 캔버스 및 요소 렌더링을 담당한다.
    *   **의존성:** `core` 패키지에 의존한다.
*   **`packages/ui-components` (선택 사항):**
    *   **역할:** 웹 앱에서 공통으로 사용될 재사용 가능한 UI 컴포넌트(버튼, 입력 필드, 모달 등)를 정의한다. Storybook과 연동하여 컴포넌트 개발 및 문서화를 용이하게 할 수 있다.
    *   **의존성:** `app-web`이 이 패키지에 의존한다.

---

### 6. 빌드 및 배포 상세

#### 6.1. 웹 애플리케이션 빌드 및 배포

*   **빌드 스크립트:**
    ```bash
    # app-web 디렉토리에서 실행
    pnpm install # 의존성 설치
    pnpm build   # Vite를 사용하여 프로덕션 빌드
    ```
    *   `pnpm build` 명령은 `app-web/dist` 디렉토리에 정적 HTML, CSS, JavaScript 파일들을 생성한다.
*   **배포 환경:**
    *   **정적 호스팅 서비스:** Vercel, Netlify, GitHub Pages, AWS S3 + CloudFront 등. (사용자는 Vercel에 배포할 계획)
    *   **CI/CD 파이프라인:** GitHub Actions, GitLab CI/CD 등을 사용하여 `main` 브랜치에 푸시될 때마다 자동으로 빌드 및 배포를 트리거하도록 설정.
    *   **도메인:** 사용자 친화적인 도메인 설정 (예: `app.erd.com`).

---

### 7. 개발 로드맵 (마일스톤) 상세

#### Phase 1: MVP (Minimum Viable Product) - 2개월 예상

*   **목표:** 핵심 ERD 기능과 기본적인 파일 관리 기능을 갖춘 웹 앱의 동작 가능한 버전을 출시하여 초기 사용자 피드백을 수집한다.
*   **주요 작업:**
    *   **프로젝트 초기 설정 (1주):**
        *   pnpm 모노레포 구조 설정 (`core`, `app-web` 패키지).
        *   TypeScript, React, Vite 기본 환경 구성.
        *   Styled-components 설정 및 기본 레이아웃(헤더, 사이드바, 캔버스, 하단 패널) 구현.
    *   **기본 캔버스 및 요소 조작 (2주):**
        *   React Flow 통합 및 기본 캔버스(줌, 팬) 구현.
        *   커스텀 노드 렌더링을 위한 `erd-entity` 노드 타입 정의.
        *   노드 이동, 크기 조절, 선택, 삭제 기능 구현.
        *   실행 취소/다시 실행 (Undo/Redo) 기능 구현.
    *   **ERD 핵심 기능 (3주):**
        *   엔티티 노드에 속성(컬럼) 추가/삭제/편집 기능 구현 (이름, 데이터 타입, PK/FK, NULL 허용, 기본값).
        *   `erd-relationship` 엣지 타입 정의 및 엔티티 간 관계선 연결 기능.
        *   카디널리티(1:1, 1:N, N:M) 및 식별/비식별 관계 시각화.
        *   우측 속성 패널에서 엔티티 및 관계 속성 편집 UI 구현.
        *   엔티티 더블 클릭 시 하단 패널 활성화 및 크기 조절 기능 구현.
        *   하단 패널 내 '컬럼' 탭 기능 구현.
    *   **파일 관리 (2주):**
        *   프로젝트 데이터 모델(JSON 스키마) 정의 및 `core` 패키지에 구현.
        *   웹 버전: File System Access API를 이용한 `.erd` 파일 저장/불러오기. (폴백: 다운로드/업로드)
        *   PNG 이미지 내보내기 기능 구현.
*   **산출물:**
    *   웹에서 동작하는 ERD 에디터 (엔티티, 속성, 관계선, 저장/불러오기, PNG 내보내기).
    *   기본적인 사용자 가이드 문서.

#### Phase 2: 기능 확장 및 개선 - 3개월 예상

*   **목표:** ERD 기능을 고도화하고 UI/UX를 개선하여 사용성을 높인다.
*   **주요 작업:**
    *   **ERD 기능 고도화 (4주):**
        *   하단 패널 내 '인덱스' 탭 기능 구현 (인덱스 생성, 편집, 삭제).
        *   하단 패널 내 '외래키' 탭 기능 구현 (외래키 생성, 편집, 삭제, ON UPDATE/ON DELETE 옵션).
        *   ERD DDL SQL 생성 기능 (MySQL Dialect).
        *   SVG 이미지 내보내기 기능 추가.
    *   **UI/UX 개선 (4주):**
        *   다크/라이트 모드 전환 기능 구현.
        *   그리드 표시/숨김, 스냅 투 그리드 기능 구현.
        *   미니맵 컴포넌트 추가.
        *   주요 기능에 대한 단축키 지원 (저장, 열기, 복사, 붙여넣기 등).
        *   인라인 텍스트 편집 기능 고도화.
        *   좌측 도구 모음 아이콘 디자인 및 적용.
        *   우측 상단 설정 메뉴 한국어화 및 기능 구현.
    *   **파일 관리 개선 (2주):**
        *   자동 저장 및 복구 기능 구현.
        *   JSON 데이터 내보내기 기능.
*   **산출물:**
    *   고도화된 ERD 편집 기능 (인덱스, 외래키, MySQL DDL 생성).
    *   향상된 UI/UX (다크 모드, 그리드, 미니맵, 단축키, 직관적인 아이콘).

#### Phase 3: 고급 기능 및 안정화 - 3개월 예상

*   **목표:** 성능 최적화 및 안정화 작업을 통해 프로덕션 수준의 품질을 확보한다.
*   **주요 작업:**
    *   **성능 최적화 (4주):**
        *   대규모 다이어그램(수백 개 노드)에서의 렌더링 성능 최적화.
        *   메모리 사용량 최적화.
        *   번들 사이즈 최적화.
    *   **버그 수정 및 안정화 (2주):**
        *   QA 및 사용자 피드백 기반의 버그 수정.
        *   다양한 브라우저 환경에서의 호환성 테스트.
    *   **문서화 및 배포 준비 (1주):**
        *   상세 사용자 매뉴얼 작성.
        *   공식 웹사이트 구축 및 배포 준비.
*   **산출물:**
    *   최적화된 성능과 높은 안정성을 가진 ERD 에디터.
    *   배포 준비 완료.

#### Phase 4: 지속적인 개선 및 확장 - 지속

*   **목표:** 사용자 요구사항을 반영하여 기능을 지속적으로 개선하고, 새로운 데이터베이스 Dialect 및 외부 시스템 연동을 통해 도구의 가치를 확장한다.
*   **주요 작업:**
    *   **새로운 데이터베이스 Dialect 추가:** PostgreSQL, Oracle, SQLite 등.
    *   **외부 시스템 연동:** Git 통합(버전 관리), Jira/Confluence 연동.
    *   **협업 기능:** 실시간 다이어그램 공유 및 공동 편집 기능.
    *   **플러그인 아키텍처:** 사용자가 직접 커스텀 요소나 기능을 추가할 수 있는 플러그인 시스템.
    *   **데이터베이스 리버스 엔지니어링:** 기존 데이터베이스 스키마를 읽어 ERD로 자동 생성.
    *   **UML 다이어그램 지원:** 클래스, 유스케이스, 시퀀스 다이어그램 등 UML 기능 추가 (향후 고려).
*   **산출물:**
    *   지속적인 업데이트 및 기능 확장.
    *   활발한 커뮤니티 및 사용자 지원.
