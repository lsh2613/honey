# YAML 프런트매터 스키마

이 디렉터리의 `schema.yaml`은 `compound`가 `docs/solutions/` 프런트매터를 작성할 때 따르는 표준 계약입니다.

다음 내용을 빠르게 확인할 때 사용합니다.
- 필수 필드
- 열거형 값
- 검증 기대사항
- 카테고리 매핑
- 트랙 분류(버그 대 지식)

## 트랙

`problem_type`이 적용할 **트랙**을 결정합니다. 각 트랙에는 서로 다른 필수 및 선택 필드가 있습니다.

| 트랙 | problem_types | 설명 |
|-------|--------------|-------------|
| **버그** | `build_error`, `test_failure`, `runtime_error`, `performance_issue`, `database_issue`, `security_issue`, `ui_bug`, `integration_issue`, `logic_error` | 진단하고 수정한 결함과 실패 |
| **지식** | `best_practice`, `documentation_gap`, `workflow_issue`, `developer_experience`, `architecture_pattern`, `design_pattern`, `tooling_decision`, `convention` | 관행, 패턴, 규칙, 결정, 워크플로 개선, 문서. 가장 좁게 적용 가능한 값을 우선하며 `best_practice`는 대체 값입니다. |

## 필수 필드(두 트랙 공통)

- **module**: 영향을 받는 모듈 또는 영역
- **date**: `YYYY-MM-DD` 형식의 ISO 날짜
- **problem_type**: 위 트랙 표에 나열된 값 중 하나
- **component**: `rails_model`, `rails_controller`, `rails_view`, `service_object`, `background_job`, `database`, `frontend_stimulus`, `hotwire_turbo`, `email_processing`, `brief_system`, `assistant`, `authentication`, `payments`, `development_workflow`, `testing_framework`, `documentation`, `tooling` 중 하나
- **severity**: `critical`, `high`, `medium`, `low` 중 하나

## 버그 트랙 필드

필수:
- **symptoms**: 관찰 가능한 증상(오류, 고장난 동작)을 담은 YAML 배열, 1-5개
- **root_cause**: `missing_association`, `missing_include`, `missing_index`, `wrong_api`, `scope_issue`, `thread_violation`, `async_timing`, `memory_leak`, `config_error`, `logic_error`, `test_isolation`, `missing_validation`, `missing_permission`, `missing_workflow_step`, `inadequate_documentation`, `missing_tooling`, `incomplete_setup` 중 하나
- **resolution_type**: `code_fix`, `migration`, `config_change`, `test_fix`, `dependency_update`, `environment_setup`, `workflow_improvement`, `documentation_update`, `tooling_addition`, `seed_data_update` 중 하나

## 지식 트랙 필드

공통 필드 외의 추가 필수 필드는 없습니다. 아래 필드는 모두 선택 사항입니다.

- **applies_when**: 이 지침이 적용되는 조건이나 상황
- **symptoms**: 이 지침을 촉발한 관찰 가능한 공백이나 마찰
- **root_cause**: 구체적인 원인이 있는 경우 그 기저 원인
- **resolution_type**: 해당하는 경우 변경 유형

## 선택 필드(두 트랙 공통)

- **related_components**: 관련된 다른 컴포넌트
- **tags**: 검색 키워드, 소문자 및 하이픈으로 구분

## 선택 필드(버그 트랙만)

- **rails_version**: `X.Y.Z` 형식의 Rails 버전

## 하위 호환성

트랙 시스템 전에 생성된 문서에는 지식 유형 `problem_type`에 `symptoms`/`root_cause`/`resolution_type`이 있을 수 있습니다. 이는 유효한 레거시 문서입니다.

- 지식 트랙 문서에 버그 트랙 필드가 있어도 무해합니다. 다른 이유로 문서를 다시 작성하는 경우가 아니라면 리프레시 중 제거하지 마십시오.
- **새 문서**를 만들 때는 트랙 규칙을 따릅니다.

## 카테고리 매핑

- `build_error` -> `docs/solutions/build-errors/`
- `test_failure` -> `docs/solutions/test-failures/`
- `runtime_error` -> `docs/solutions/runtime-errors/`
- `performance_issue` -> `docs/solutions/performance-issues/`
- `database_issue` -> `docs/solutions/database-issues/`
- `security_issue` -> `docs/solutions/security-issues/`
- `ui_bug` -> `docs/solutions/ui-bugs/`
- `integration_issue` -> `docs/solutions/integration-issues/`
- `logic_error` -> `docs/solutions/logic-errors/`
- `developer_experience` -> `docs/solutions/developer-experience/`
- `workflow_issue` -> `docs/solutions/workflow-issues/`
- `best_practice` -> `docs/solutions/best-practices/`
- `documentation_gap` -> `docs/solutions/documentation-gaps/`
- `architecture_pattern` -> `docs/solutions/architecture-patterns/`
- `design_pattern` -> `docs/solutions/design-patterns/`
- `tooling_decision` -> `docs/solutions/tooling-decisions/`
- `convention` -> `docs/solutions/conventions/`

## 검증 규칙

1. 트랙 표의 `problem_type`을 사용하여 트랙을 결정합니다.
2. 모든 공통 필수 필드가 있어야 합니다.
3. 버그 트랙 필수 필드(`symptoms`, `root_cause`, `resolution_type`)가 버그 트랙 문서에 있어야 합니다.
4. 지식 트랙 문서는 공통 필드 외에 추가 필수 필드가 없습니다.
5. 기존 지식 트랙 문서의 버그 트랙 필드는 무해합니다(하위 호환성 참조).
6. 열거형 필드는 허용된 값과 정확히 일치해야 합니다.
7. 배열 필드는 최소/최대 항목 수를 지켜야 합니다.
8. `date`는 `YYYY-MM-DD`와 일치해야 합니다.
9. `rails_version`이 있으면 `X.Y.Z`와 일치해야 하며 버그 트랙 문서에만 적용됩니다.

## YAML 안전 규칙

엄격한 YAML 1.2 파서(`yq`, 엄격한 `js-yaml`, PyYAML)는 예약된 표시 문자로 시작하는 배열 항목을 따옴표 없는 스칼라로 쓰면 거부합니다. 문자열 배열 필드(`symptoms`, `applies_when`, `tags`, `related_components` 또는 향후 배열 필드)의 값이 다음 문자 중 하나로 시작하면 큰따옴표로 감쌉니다.

` ``, `[`, `*`, `&`, `!`, `|`, `>`, `%`, `@`, `?`

또한 값에 `": "` 부분 문자열이 있으면 인용합니다 — 이 구두점은 flow-style 파서를 혼동시킵니다.

예시 — 앞의 형식(엄격한 YAML을 깨뜨림):

    symptoms:
      - `sudo dscacheutil -flushcache` does not restore in-container mDNS

예시 — 뒤의 형식(깨끗하게 파싱됨):

    symptoms:
      - "`sudo dscacheutil -flushcache` does not restore in-container mDNS"

이 규칙은 모든 문자열 배열 프런트매터 필드에 적용됩니다. `description:` 같은 스칼라 문자열 필드에는 별도의 인용 규칙이 있습니다(플러그인 `AGENTS.md`의 "YAML Frontmatter" 참조).
