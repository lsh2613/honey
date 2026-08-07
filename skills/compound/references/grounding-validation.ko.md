# 근거 검증(Phase 2.45)

Phase 2.45가 실행될 때 읽습니다. 방금 작성한 문서는 영구적이고 신뢰할 수 있는 지식이 되며, 향후 에이전트는 재검증 없이 그 주장에 따라 행동합니다. 이 단계는 주장이 축적되기 전에 현실과 대조합니다. 결정론적 기계적 검사(번들 스크립트)와 의미론적 검사(읽기 전용 검증 하위 에이전트)를 함께 수행합니다. 해결 문서가 삭제된 경로와 수정 전 상태를 정당하게 인용할 수 있으므로 어느 검사도 강제 차단하지 않으며, 모든 플래그를 판정합니다.

## 어떤 트리가 진실의 기준인가

두 종류의 주장은 서로 다른 트리에서 검증합니다.

- **코드 동작 주장**(열거형 값, 상태 의미, 제한, 기본값)은 **로컬 작업 트리**에서 검증합니다 — 이 세션의 작업이 여기서 만들고 검증한 것을 설명하기 때문입니다.
- **병합 상태 주장**("#1608에서 수정됨", "반영됨", "출시됨")은 **원격의 사실**에서 검증합니다 — 체크아웃이 병합보다 앞설 수 있으므로 `gh pr view`(또는 트래커의 동등한 기능)가 기본이며, 로컬 git 도달 가능성은 대체 수단입니다. 스크립트의 `INFO: worktree is N commits behind …` 줄은 이 범주의 로컬 트리를 얼마나 불신해야 하는지 알려줍니다.

스크립트를 실행하기 전에 선택적으로 `git fetch --quiet`를 실행할 수 있습니다(최선 노력 — 실패하거나 오프라인이면 조용히 건너뛰며, 네트워크는 정확성의 의존성이 아닙니다). 원격 상태를 전혀 확인할 수 없으면 주장을 유지하되 "as of this writing" 같은 시점 한정어를 추가하고 실행 보고서에 검증 저하를 기록합니다.

## 1단계: 기계적 플래그 판정

스크립트가 플래그를 보고하면 각각 결정합니다. 해결 방법은 세 가지입니다 — **수정**, **주석 추가**, **의도적임을 확인**. 자동 재작성도 자동 통과도 하지 않습니다.

| 플래그 | 가능한 의미 | 해결 |
|------------|------------|------------|
| 어디에도 경로가 없음 | 오타 또는 기억에서 작성됨 | 인용을 수정하거나 주장 제거 |
| 여기에는 경로가 없지만 upstream에는 존재 | 오래된 체크아웃 | upstream에서 주장 확인; 문서가 로컬에 파일이 있다고 암시하면 주석 추가 |
| 경로가 의도적으로 사라짐(문서가 제거/이름 변경을 말함) | 역사적 인용 | 주변 문장이 역사적임을 표시하는지 확인("이 수정으로 제거됨", "수정 전 상태"); 없으면 표시 추가 |
| SHA가 해석되지 않음 | 조작되었거나 다른 저장소에서 가져옴 | PR 번호로 대체하거나 제거 |
| SHA가 HEAD에서만 도달 가능 | 로컬 전용 커밋; rebase/스쿼시 병합 시 SHA가 바뀜 | PR 번호로 대체 |
| SHA가 upstream에서만 도달 가능 | 체크아웃이 병합보다 앞섬 | 시점 한정어와 함께 유지; `gh`로 반영 상태 확인 |
| SHA는 존재하지만 도달 불가 | 다시 작성된 커밋 | PR 번호로 대체 |
| 스캐폴드(`Learning 3`, `{{…}}`) | 초안 문맥이 유출됨 | 항상 수정 — 실제 경로나 링크로 다시 작성 |
| 상대 링크가 해석되지 않음 | 잘못된 대상 | 경로 수정 |

이 플랫폼에서 스크립트를 해석할 수 없으면 같은 범위에서 수동으로 검사합니다 — 존재하지 않는 인용 경로, 16진수 SHA, `Learning(s) N` / `{{…}}` 스캐폴드, 깨진 상대 링크를 검색하고 기계적 검사가 수동으로 수행되었음을 실행 결과에 기록합니다. 조용히 건너뛰지 마십시오.

본문을 1단계 또는 2단계에서 수정한 뒤 스크립트를 다시 실행하여 깨끗해졌는지, 남은 모든 플래그가 의도적인 것으로 확인되었는지 확인합니다.

## 2단계: 의미론적 검증 하위 에이전트(Full 및 headless; lightweight에서는 생략)

영구 지식 저장소에 들어갈 해결 문서와 이번 실행에서 추가하거나 수정한 `CONCEPTS.md` 항목을 포함하여 **읽기 전용 하위 에이전트 하나**를 호출합니다(2.4단계에서 작성된 항목도 주장입니다 — 세션 요약만으로 용어집 항목을 작성하는 것이 잘못된 의미가 들어오는 방식입니다). 플랫폼에서 모델을 지정할 수 있다면 다른 검토 하위 에이전트와 같은 중간급 모델을 사용합니다. 다음 템플릿으로 프롬프트를 구성합니다.

```
You are a grounding validator for documentation about to enter a permanent
knowledge store. You are read-only: never edit files. Inspect with Read,
Grep, Glob, git (non-mutating), and gh when available.

Inputs: the doc content below, the CONCEPTS.md entries below (if any), and
this staleness context: <INFO line from the mechanical script, or "none">.

Check every factual claim in three categories:

1. CODE-BEHAVIOR CLAIMS — assertions about how code behaves: enum values,
   status semantics, limits, defaults, ordering, state transitions. For
   each, locate the defining source in the current tree and quote the
   defining line(s) with file:line. Verdict: verified (with quote),
   contradicted (with the quote showing otherwise), or unverifiable
   (defining source not found).

2. MERGE-STATE CLAIMS — assertions that a change landed ("fixed in",
   "merged", "shipped in", "resolved by #N"). Primary check: gh pr view
   <n> --json state,mergedAt,baseRefName (remote truth). Fallback: git
   reachability from the upstream default branch. Verdict: verified,
   contradicted (e.g. PR open, not merged), or unverifiable (offline / no
   gh) — mark unverifiable as "degraded", do not guess.

3. INTERNAL COMPLETENESS — countable assertions ("six PRs", "three root
   causes", "all N consumers"). Count the substantiating items in the doc
   itself. Verdict: complete, or short (found M of N).

Ignore session narrative ("we first tried X") — that describes the
conversation, not the tree. Ignore style.

Return a structured list, one entry per claim checked:
  claim (verbatim) | category | verdict | evidence (quote + file:line, or
  command output) | suggested edit (only for non-verified claims)
```

**판정 처리:**

- **contradicted** → 인용된 근거로 문서 수정(대화가 아니라 인용이 권위 있는 근거)
- **unverifiable**(동작) → "per this session's conclusion…"처럼 완화하거나 귀속 — 또는 주장 제거
- **unverifiable/degraded**(병합 상태) → 시점 한정어와 함께 유지; 보고서에 검증 저하 기록
- **short**(완전성) → 열거를 완성하거나 문서가 근거로 제시하는 개수에 맞춰 다시 표현
- **verified** → 변경 없음

## 보고

실행 결과에 단계 결과를 한 줄로 요약합니다(헤드리스 보고서의 `Grounding:` 줄 또는 대화형 성공 출력): 판정한 플래그(수정 / 주석 추가 / 확인), 검사한 주장 수, 완화하거나 수정한 주장 수, 해당되는 경우 `degraded — merge-state claims unverified offline`를 포함합니다.
