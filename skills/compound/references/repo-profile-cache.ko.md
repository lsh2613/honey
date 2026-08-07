# 공유 저장소 근거 수집 프로필 캐시

저장소 기반 근거 수집 스킬이 질문과 무관한 **프로젝트 프로필**(스택, 의존성, 규칙, 구조)을 필요로 할 때 읽습니다. 프로필은 세션 내부와 커밋이 변하지 않은 세션 및 스킬 사이에서 한 번 도출되고 재사용되며, 현재 실행에 필요한 **질문별 근거 수집**만 매번 다시 수행합니다.

이 파일은 모든 소비 스킬에 **바이트 단위로 복제**되어 있습니다(플러그인에는 스킬 간 import 메커니즘이 없음). 모든 복사본은 동일해야 하며 `tests/repo-profile-cache-parity.test.ts`가 이를 강제합니다. 결정론적 캐시 I/O는 함께 있는 `scripts/repo-profile-cache.py`에 있으며, 누락 시 도출은 함께 있는 `references/agents/repo-profiler.md` 페르소나가 수행합니다.

## 캐시하는 것(무관한 프로필)

`profile_schema_version`으로 버전이 지정된 단일 JSON 객체입니다.

- **스택 및 버전** — 언어, 주요 프레임워크와 버전, 빌드/테스트 도구
- **의존성 범위** — 매니페스트 및 잠금 파일 경로, 최상위 의존성, 프로젝트 라이선스와 의존성 라이선스
- **토폴로지** — 모노레포/워크스페이스 맵, 배포 모델, API 스타일, 데이터 저장소, 모듈 구조
- **규칙 및 지침 파일** — *루트* `AGENTS.md`/`CLAUDE.md`/`GEMINI.md`/`ARCHITECTURE.md`/`README.md`/`CONTRIBUTING.md`/`STRATEGY.md`의 경로와 다이제스트
- **용어** — `CONCEPTS.md` 표준 용어

## 캐시하지 않는 것(항상 새로 글로브)

캐시에서 읽지 말고 매 실행마다 다시 계산합니다.

- `docs/solutions/` 목록(커밋되지 않은 새 학습도 보여야 함 — 글로빙 비용은 거의 없고 일치 파일도 새로 읽음)
- 하위 디렉터리 범위 지침 파일(영역 범위 `CLAUDE.md`/`AGENTS.md`)
- 모든 질문별 근거 수집: 후보의 호출 지점/영향 범위, 이전 결정 일치, 기능 패턴, 수정 파일의 git 기록, 트래커/PR 활동, 외부 조사

## 캐시 위치와 키

```
/tmp/compound-engineering/repo-profile/<root-sha>/<head-sha>.json
```

- `<root-sha>` = `git rev-list --max-parents=0 HEAD`의 사전순 첫 값 — 저장소 정체성(워크트리와 클론 간 안정적)
- `<head-sha>` = `git rev-parse HEAD` — 작업 상태

같은 커밋의 두 체크아웃은 하나의 항목을 공유합니다. 조회에는 git 메타데이터만 사용하며, 적중 시 이 파일 하나만 읽습니다.

## 프로토콜 — 스킬이 사용하는 방식

`SKILL_DIR` 앵커를 통해 도우미를 호출합니다(`SKILL_DIR`을 방금 읽은 SKILL.md가 있는 디렉터리의 절대 경로로 설정; Bash 도구의 cwd는 스킬 디렉터리가 아니라 사용자의 프로젝트임).

```bash
SKILL_DIR="<absolute path of this skill's directory>"
python3 "$SKILL_DIR/scripts/repo-profile-cache.py" get
```

`get`은 다음 중 하나를 정확히 출력합니다.

- `HIT` 다음 줄에 프로필 JSON → 이를 무관한 프로필로 로드하고 도출 생략
- `MISS` 다음 줄에 쓰기 경로 → `repo-profiler` 페르소나를 호출해 프로필을 도출하고 JSON 출력을 파일에 쓴 뒤 저장. 이 `put`은 위 `get`과 **별도의 Bash 도구 호출**이어야 함 — Bash 호출 사이에는 셸 변수가 유지되지 않으므로 같은 명령에서 `SKILL_DIR`을 다시 설정:
  ```bash
  SKILL_DIR="<absolute path of this skill's directory>"
  python3 "$SKILL_DIR/scripts/repo-profile-cache.py" put <profile-json-file>
  ```
- `NO-CACHE` → git 저장소가 없거나 캐시를 쓸 수 없음. 이번 실행에서 프로필을 새로 도출하고 `put` 생략(저장할 것이 없음)

세 경우 모두 무관한 프로필을 확보한 뒤 **이 스킬의 질문별 근거 수집을 새로** 실행합니다.

## 최신성(변경분 인식)

현재 `HEAD`에서 프로필 스키마 버전이 일치하고 프로필 입력 경로가 dirty 또는 새로 추가되지 않은 경우에만 캐시 적중입니다. 최신성은 `git status --porcelain --untracked-files=all`로 확인하며, 추적되지 않은 새 입력(`??`)도 무효화합니다. 프로필 입력 집합은 스키마가 참조하는 모든 파일의 보수적 상위 집합입니다 — 모든 깊이의 의존성 매니페스트와 잠금 파일, 라이선스, 루트 지침/문서 파일, `CONCEPTS.md`/`STRATEGY.md`, 토폴로지 출처(`Dockerfile`, `.github/workflows/`, `.cursor/rules`). dirty 소스 파일, `docs/plans/*`, 기타 비입력 경로는 무효화하지 않습니다. 이 집합의 완전성이 안전성의 핵심 규칙입니다. 과도한 무효화는 재도출 비용을 만들지만, 과소 무효화는 오래된 프로필을 제공합니다.

## 저하 처리

캐시는 최적화일 뿐 정확성의 의존성이 아닙니다. git 저장소 밖이거나, 쓰기 가능한 `/tmp`가 없거나, 항목을 읽을 수 없거나 형식이 잘못되면 도우미는 `NO-CACHE`/`MISS`(종료 코드 0)를 반환하고 새로 도출합니다. 차단하지 않으며 최신성을 입증할 수 없는 프로필을 제공하지 않습니다. 도우미 **호출 자체**가 실패하면 — 0이 아닌 종료, 빈 출력, 스크립트를 찾을 수 없는 해결되지 않은 `SKILL_DIR` — 정확히 `NO-CACHE`처럼 취급하여 이번 실행에서 새로 도출하고 진행합니다. 캐시를 기다리며 멈추지 마십시오.
