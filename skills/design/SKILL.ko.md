---
name: design
description: 저장소의 기존 학습을 바탕으로 기술 설계를 작성합니다.
---

# Honey Design

기술 설계를 작성하기 전에 다음을 수행합니다.

1. 현재 설계 맥락에서 단계가 소유하는 입력을 구성합니다.

   ```xml
   <work-context>
   Activity: <the current stage objective>
   Concepts: <domain and technical terms>
   Decisions: <choices being considered or already settled>
   Domains: <modules, components, and repository areas>
   </work-context>
   ```

2. 이 스킬의 디렉터리에 있는 `references/agents/learnings-researcher.md`를 읽습니다.
3. 완전한 로컬 연구자 프롬프트와 `<work-context>` 블록을 사용해 일반 서브에이전트를 디스패치합니다. 경로, 정확한 원본 날짜, 관련성, 적용 가능한 통찰, 충돌/최신성 경고를 포함한 정제된 발견을 최대 5개만 반환하도록 요청합니다.
4. 일반 서브에이전트 생성 또는 디스패치가 불가능하거나 실패하면 재시도하지 않습니다. 대신 `references/agents/learnings-researcher.md`의 동일한 완전한 로컬 연구자 프롬프트와 동일한 `<work-context>`를 사용해 부모 컨텍스트에서 한 번만 범위가 제한된 로컬 연구를 수행합니다. `docs/solutions/`를 새로 열거하고 정확한 원본 날짜를 보고하라는 지시를 포함해 해당 프롬프트를 따르며, 정제된 발견을 최대 5개만 남깁니다.
5. 설계를 작성하기 전에 반환된 발견을 반영합니다. 적용 가능한 아키텍처 제약, 패턴, 도구 결정, 관례 및 기각된 기술적 접근을 설계 산출물에 반영합니다.

연구자 컨텍스트 안에 솔루션 코퍼스를 유지합니다. 부모 컨텍스트에는 전체 `docs/solutions/` 코퍼스를 불러오거나 반환하지 않습니다.

현재 단계 컨텍스트와 정제된 발견을 바탕으로 기술 설계를 작성합니다.
