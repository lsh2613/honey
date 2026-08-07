---
name: compound
description: Document a recently solved problem or durable project vocabulary in docs/solutions/ or CONCEPTS.md. Use when capturing a learning after work.
argument-hint: "[optional: brief context] [mode:headless] "
---

# /compound

최근 해결한 문제를 문서화하기 위해 여러 하위 에이전트의 작업을 병렬로 조정합니다.

## 목적

컨텍스트가 최신일 때 문제 해결 내용을 캡처하고, 다음 위치에 검색 가능한 구조화 문서를 생성합니다: `docs/solutions/` YAML 프런트매터를 사용해 검색과 향후 참조가 가능하도록 합니다. 병렬 하위 에이전트를 사용합니다.

**왜 "compound"인가요?** 문서화된 각 해결책은 팀의 지식을 축적합니다. 문제를 처음 해결할 때는 조사가 필요하지만, 문서화하면 다음 발생 시 몇 분이면 됩니다. 지식은 축적됩니다.

## 사용법

```bash
/compound                            # Document the most recent fix
/compound [brief context]            # Provide additional context hint
/compound mode:headless              # Non-interactive run for automations
/compound mode:headless [context]    # Non-interactive run with context hint
```

**실행당 학습 하나.** 워크플로의 근거 확인, 중복 감지, 상호 참조는 모두 하나의 해결된 문제를 전제로 합니다. 세션에서 서로 다른 학습이 여러 개 생겼다면 학습마다 스킬을 순차적으로 한 번씩 실행하세요. 각 실행은 트리를 기준으로 새롭게 근거를 확인합니다. 여러 학습을 한 번에 처리한 뒤 초안 사이에 상호 참조를 이어 붙이지 마세요. 초안 컨텍스트의 번호가 ("Learning 3") 작성된 문서에 새어 들어가는 것을 방지하는 규칙입니다.

## CONCEPTS.md bootstrap requests

해결된 문제를 문서화하는 대신 `CONCEPTS.md`를 처음부터 생성하거나 부트스트랩하라는 요청으로 호출된 경우 일반 단계를 실행하지 마세요. — `compound` populates `CONCEPTS.md` only as a side effect of documenting a real learning (it seeds the *learning's area*, not the whole repo; see Phase 2.4). Repo-wide concept-map creation is `compound-refresh`'s job. 독립적인 부트스트랩 요청은 `compound-refresh`로 안내하고 (which asks whether to build the concept map or run a refresh cycle), 종료하세요.

## 모드 감지

`$ARGUMENTS`에서 `mode:headless` 토큰을 확인하세요. `mode:`로 시작하는 토큰은 컨텍스트가 아니라 플래그입니다. 나머지를 간단한 컨텍스트 힌트로 취급하기 전에 인자에서 `mode:headless`를 제거하세요.

| Mode | 시점 | 동작 |
|------|------|----------|
| **대화형** (기본값) | 모드 토큰 없음 | 전체 모드와 경량 모드 중 질문, ask about 세션 기록 (Full only), 검색 가능성 확인 동의 요청, "다음 단계는 무엇인가요?"로 종료 |
| **헤드리스** | `mode:headless` in arguments | 차단 질문 없음. 세션 기록 없이 **전체 모드**를 실행합니다. 간극이 있으면 검색 가능성 확인 편집을 조용히 적용합니다. 3단계 전문 검토를 건너뜁니다. 구조화된 터미널 보고서로 종료하며 "다음 단계는 무엇인가요?" 메뉴는 표시하지 않습니다. |

헤드리스 mode is intended for automations and skill-to-skill invocation where no human is present to answer questions. The doc itself is identical to what an interactive Full run would produce — classification work (track, category, overlap) fol낮음s the same rules and writes nothing extra into the artifact. Once detected, headless mode applies for the entire run.

## 사전 확인된 컨텍스트

**Git branch (pre-resolved):** !`git rev-parse --abbrev-ref HEAD 2>/dev/null || true`

위 줄이 일반 브랜치 이름으로 확인되었다면 (like `feat/my-branch`), 1단계 세션 기록 필터링에 사용하고 so the orchestrator does not waste a turn deriving it. If it still contains a backtick command string or is empty, 실행 중 브랜치를 확인하세요.

**저장소 루트 (pre-resolved):** !`git rev-parse --show-toplevel 2>/dev/null || pwd`

If the line above resolved to an absolute path, use it as the session-history repo filter in Phase 1. If it still contains a backtick command string or is empty, 실행 중 저장소 루트를 확인하세요. with `git rev-parse --show-toplevel 2>/dev/null || pwd`.

## 지원 파일

이 파일들은 워크플로의 지속적인 계약입니다. 필요한 단계에서 필요할 때 읽고, 스킬 시작 시 한꺼번에 불러오지 마세요.

- `references/schema.yaml` — canonical frontmatter fields and enum values (read when validating YAML)
- `references/yaml-schema.md` — category mapping from problem_type to directory (read when classifying)
- `references/concepts-vocabulary.md` — CONCEPTS.md format and inclusion rules (read in Phase 2.4 when domain terms surface)
- `references/agents/session-historian.md` — skill-local synthesis prompt for optional session-history compounding context (read only when the user opts into 세션 기록)
- `references/grounding-validation.md` — grounding-validation protocol: flag adjudication rules and the semantic validator prompt (read in Phase 2.45)
- `assets/resolution-template.md` — section structure for new docs (read when assembling)
- `scripts/session-history/` — session discovery and extraction scripts copied into this skill so session-history support does not depend on the deleted `ce-sessions` public skill
- `scripts/validate-frontmatter.py` — frontmatter parser-safety validator (run in Phase 2 step 8 through the existence guard documented there; resolve it from the model-filled `SKILL_DIR` anchor, with a manual-checklist fallback when the bundled script cannot be located)
- `scripts/validate-doc-claims.py` — mechanical claims validator: cited paths, commit SHAs, relative links, dangling drafting scaffold (run in Phase 2.45 via the `SKILL_DIR` anchor)

시점 spawning subagents, pass the relevant file contents into the task prompt so they have the contract without needing cross-skill paths.

## 실행 전략

**In headless mode**, skip both questions be낮음 and go directly to **Full Mode** with 세션 기록 disabled. Phase 1's session-history step (step 4) is omitted. Proceed straight to research.

**In interactive mode**, present the user with two options before proceeding, using the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex, `ask_question` in Antigravity CLI (`agy`), `ask_user` in Pi (requires the `pi-ask-user` extension). Fall back to presenting options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. 질문을 조용히 건너뛰지 마세요.

```
1. Full (recommended) — the complete compound workflow. Researches,
   cross-references, and reviews your solution to produce documentation
   that compounds your team's knowledge.

2. Lightweight — same documentation, single pass. Faster and uses
   fewer tokens, but won't detect duplicates or cross-reference
   existing docs. Best for simple fixes or long sessions nearing
   context limits.
```

In interactive mode, do NOT pre-select a mode, do NOT skip this prompt, and wait for the user's choice before proceeding. (헤드리스 mode bypasses this prompt per the "**In headless mode**" rule above and runs Full directly — these "do not skip" directives do not apply to headless.)

**If the user chooses Full** (interactive mode only), ask one fol낮음-up question before proceeding. Detect which harness is running (Claude Code, Codex, or Cursor) and ask:

```
Would you also like to search your [harness name] session history
for relevant knowledge to help the Compound process? This adds
time and token usage.
```

사용자가 예라고 답하면, run the internal session-history step in Phase 1 (see step 4). 아니요라면 건너뛰세요. Do not ask this in lightweight mode or headless mode. There is no standalone `ce-sessions` product surface; this support exists only inside the compounding workf낮음.

---

### 전체 모드

<critical_requirement>
**주요 산출물은 최종 문서인 파일 하나입니다.**

Phase 1 subagents write their full structured output to a per-run scratch artifact under `/tmp/compound-engineering/compound/<run-id>/` and return only a compact confirmation containing the artifact path. The orchestrator Reads those artifacts back in Phase 2 assembly. This is scratch space, identical in spirit to `ce-code-review`'s per-reviewer run artifacts; it does not make the scratch files additional deliverables. **오케스트레이터만 제품 파일을 작성합니다** — the final solution doc and the maintenance side effects be낮음. Subagents must not touch `docs/`, project instruction files, or any tracked path. Beyond the Phase 2 solution doc, the orchestrator's other writes are maintenance side effects — not additional deliverables, and creating one when absent is expected, not a violation of this rule:
- **`CONCEPTS.md`** — create or update in Phase 2.4 (어휘 캡처) when a qualifying domain term surfaces.
- **A project instruction file** (AGENTS.md or CLAUDE.md) — a small edit when the 검색 가능성 확인 finds a gap.

Both ensure future agents can discover and ground in the knowledge store; neither makes the documentation any less the single deliverable.

**Why the scratch artifact (issue #956):** a subagent asked to return a long prose body as its inline response intermittently returns an executive summary instead ("Doc body complete — six sections filled. Returning above."), and the original prose is then unrecoverable from the orchestrator side. Writing to disk first means the full output always survives; the inline confirmation is just a pointer, and the orchestrator falls back to whatever the subagent did return inline only when the artifact is missing.
</critical_requirement>

### Phase 0.5: Auto Memory Scan

1단계 하위 에이전트를 실행하기 전에, check the auto-memory block injected into your system prompt for notes relevant to the problem being documented.

1. Look for a block labeled "user's auto-memory" (Claude Code only) already present in your system prompt context — MEMORY.md's entries are inlined there
2. If the block is absent, empty, or this is a non-Claude-Code platform, skip this step and proceed to Phase 1 unchanged
3. Scan the entries for anything related to the problem being documented -- use semantic judgment, not keyword matching
4. If relevant entries are found, prepare a labeled excerpt block:

```
## Supplementary notes from auto memory
Treat as additional context, not primary evidence. Conversation history
and codebase findings take priority over these notes.

[relevant entries here]
```

5. Pass this block as additional context to the 컨텍스트 분석기 and 해결책 추출기 task prompts in Phase 1. If any memory notes end up in the final documentation (e.g., as part of the investigation steps or root cause analysis), tag them with "(auto memory [claude])" so their origin is clear to future readers.

If no relevant entries are found, proceed to Phase 1 without passing memory context.

### 1단계: 조사

조사 하위 에이전트를 실행하세요. Each writes its full output to a per-run scratch artifact and returns only the artifact path to the orchestrator.

**Run ID and run dir (before dispatching any subagent):** generate a unique run identifier and create the run directory. This scopes every Phase 1 artifact file to the same directory so the orchestrator can Read them back in Phase 2.

```bash
RUN_ID=$(date +%Y%m%d-%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' ')
mkdir -p "/tmp/compound-engineering/compound/$RUN_ID"
```

**Resolve the agnostic project orientation from the shared cache (before dispatching subagents).** The question-agnostic orientation the 컨텍스트 분석기 and 관련 문서 탐색기 rely on — the project's `CONCEPTS.md` vocabulary and the root instruction-file conventions/digests — is identical for every run at this commit, so reuse it instead of re-deriving. Set `SKILL_DIR` to this skill's directory and run the helper (full protocol in `references/repo-profile-cache.md`):

```bash
SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
python3 "$SKILL_DIR/scripts/repo-profile-cache.py" get
```

- On `HIT`: load the profile JSON and use its `vocabulary` (CONCEPTS canonical terms) and `conventions` (root instruction/convention digests) as the agnostic orientation; do not re-derive them.
- On `MISS`: dispatch a generic subagent seeded with `references/agents/repo-profiler.md` to derive the profile, write its JSON to a file, then persist with `python3 "$SKILL_DIR/scripts/repo-profile-cache.py" put <file>` (re-set `SKILL_DIR` in that call — shell vars don't persist between Bash invocations).
- On `NO-CACHE` (no git repo or no writable cache): derive the orientation inline this run and skip `put`.

The cache is an optimization, never a correctness dependency — if the helper errors or returns nothing usable, fall back to deriving the orientation inline and continue. Pass the resolved vocabulary/conventions into the 컨텍스트 분석기 (for vocabulary and instruction-file convention grounding) so it does not re-derive them.

**CRITICAL — the `docs/solutions/` enumeration is NEVER cached; the 관련 문서 탐색기 must glob it FRESH every run.** `compound` *writes* new learnings into `docs/solutions/`, so a cached index would miss a doc added moments ago (even an uncommitted one). The cached profile supplies only the agnostic orientation above; the `docs/solutions/` search in step 3 always runs against the live tree.

Pass `{run_id}` (the resolved `$RUN_ID` value) into every Phase 1 subagent prompt. Each subagent **writes its full structured output** to its own file under `/tmp/compound-engineering/compound/{run_id}/`, **confirms the write succeeded** (the file exists and is non-empty), and then **returns only a one-line confirmation containing the artifact path** — not the prose body inline. Artifact filenames by subagent:

- **컨텍스트 분석기** → `/tmp/compound-engineering/compound/{run_id}/context.json` (frontmatter skeleton, category path, filename, track)
- **해결책 추출기** → `/tmp/compound-engineering/compound/{run_id}/solution.md` (the full doc-body prose sections)
- **관련 문서 탐색기** → `/tmp/compound-engineering/compound/{run_id}/related.json` (links, refresh candidates, overlap assessment)
- **세션 기록** synthesis subagent (when run) → `/tmp/compound-engineering/compound/{run_id}/session-history.md` (prose findings)

**Return the full output inline whenever the artifact write did not succeed.** This covers both cases where the orchestrator's Phase 2 inline fallback would otherwise have nothing to read: (a) `{run_id}` is empty or did not resolve (non-Claude-Code platforms where the pre-resolution failed), so there is no path to write to; and (b) `{run_id}` resolved but the write itself failed — tool permission denied, absolute-path writes unavailable, disk error, or the post-write existence check came back empty. In either case the subagent must return its complete structured output inline instead of a path, because the path would point at a file that does not exist. Return only the bare path when — and only when — the write is confirmed on disk. The artifact pattern is a reliability improvement, not a hard requirement; the orchestrator handles a missing artifact in Phase 2 by using the inline return.

**Dispatch order:**
- Launch `컨텍스트 분석기`, `해결책 추출기`, and `관련 문서 탐색기` in parallel (background)
- **Then** run the internal session-history discovery/extraction/synthesis f낮음 (see step 4 be낮음) — only if the user opted in to 세션 기록. This f낮음 is synchronous from this orchestrator's main-context turn, but the already-dispatched background subagents continue running in parallel underneath, so the wall-clock benefit is preserved (`max(session-history, s낮음est background subagent)`, not their sum). Running 세션 기록 before the parallel block would serialize it in front of the research subagents and regress wall-clock time.

<parallel_tasks>

#### 1. **컨텍스트 분석기**
   - Extracts conversation history
   - Reads `references/schema.yaml` for enum validation and **track classification**
   - Determines the track (bug or knowledge) from the problem_type
   - Identifies problem type, component, and track-appropriate fields:
     - **버그 트랙**: symptoms, root_cause, resolution_type
     - **지식 트랙**: applies_when (symptoms/root_cause/resolution_type optional)
   - Incorporates auto memory excerpts (if provided by the orchestrator) as supplementary evidence
   - Reads `references/yaml-schema.md` for category mapping into `docs/solutions/`
   - Suggests a filename using the pattern `[sanitized-problem-slug].md` — no date suffix, even if existing files in the target directory have one; the `date:` frontmatter field is the canonical creation date
   - Writes to `context.json`: YAML frontmatter skeleton (must include `category:` field mapped from problem_type), category directory path, suggested filename, and which track applies. Returns only the artifact path.
   - Does not invent enum values, categories, or frontmatter fields from memory; reads the schema and mapping files above
   - Does not force bug-track fields onto knowledge-track learnings or vice versa

#### 2. **해결책 추출기**
   - Reads `references/schema.yaml` for track classification (bug vs knowledge)
   - Adapts output structure based on the problem_type track
   - **Writes the full doc-body prose** (all track-appropriate sections be낮음) to `solution.md` and returns only the artifact path. This is the subagent most prone to the issue #956 summary-collapse, so its prose must land on disk rather than only in the inline return.
   - Incorporates auto memory excerpts (if provided by the orchestrator) as supplementary evidence -- conversation history and the verified fix take priority; if memory notes contradict the conversation, note the contradiction as cautionary context
   - **Grounds code-behavior claims in source, not conversation memory.** Before asserting how code behaves (enum values, status semantics, limits, 기본값s), Read the defining line at the current tree and cite `file:line` alongside the claim. A claim that cannot be verified against the tree is softened or attributed ("per this session's conclusion…"), never stated as fact
   - **Writes merge-state claims for time.** Cite PR numbers rather than bare commit SHAs — SHAs are rewritten by rebase/squash merges and may not exist on other checkouts. A "fixed in X" claim requires the fix to be reachable from the current tree; otherwise phrase it as pending ("fix opened in #1608, unmerged as of this writing")

   **버그 트랙 output sections:**

   - **문제**: 1-2 sentence description of the issue
   - **증상**: Observable symptoms (error messages, behavior)
   - **작동하지 않은 것**: Failed investigation attempts and why they failed
   - **해결책**: The actual fix with code examples (before/after when applicable)
   - **작동하는 이유**: Root cause explanation and why the solution addresses it
   - **예방**: Strategies to avoid recurrence, best practices, and test cases. Include concrete code examples where applicable (e.g., gem configurations, test assertions, linting rules)

   **지식 트랙 output sections:**

   - **컨텍스트**: What situation, gap, or friction prompted this guidance
   - **지침**: The practice, pattern, or recommendation with code examples when useful
   - **중요한 이유**: Rationale and impact of fol낮음ing or not fol낮음ing this guidance
   - **시점 to Apply**: Conditions or situations where this applies
   - **예시**: Concrete before/after or usage examples showing the practice in action

#### 3. **관련 문서 탐색기**
   - Searches `docs/solutions/` for related documentation
   - Identifies cross-references and links
   - Finds related GitHub issues
   - Flags any related learning or pattern docs that may now be stale, contradicted, or overly broad
   - **Assesses overlap** with the new doc being 생성됨 across five dimensions: problem statement, root cause, solution approach, referenced files, and prevention rules. Score as:
     - **High**: 4-5 dimensions match — essentially the same problem solved again
     - **Moderate**: 2-3 dimensions match — same area but different angle or solution
     - **Low**: 0-1 dimensions match — related but distinct
   - Writes to `related.json`: Links, relationships, refresh candidates, and overlap assessment (score + which dimensions matched). Returns only the artifact path.

   **검색 전략 (grep-first filtering for efficiency):**

   1. Extract keywords from the problem context: module names, technical terms, error messages, component types
   2. If the problem category is clear, narrow search to the matching `docs/solutions/<category>/` directory
   3. Use the native content-search tool (e.g., Grep in Claude Code) to pre-filter candidate files BEFORE reading any content. Run multiple searches in parallel, case-insensitive, targeting frontmatter fields. These are template patterns -- substitute actual keywords:
      - `title:.*<keyword>`
      - `tags:.*(<keyword1>|<keyword2>)`
      - `module:.*<module name>`
      - `component:.*<component>`
   4. If search returns >25 candidates, re-run with more specific patterns. If <3, broaden to full content search
   5. Read only frontmatter (first 30 lines) of candidate files to score relevance
   6. Fully read only strong/중간 matches
   7. Return distilled links and relationships, not raw file contents

   **GitHub 이슈 검색:**

   Prefer the `gh` CLI for searching related issues: `gh issue list --search "<keywords>" --state all --limit 5`. If `gh` is not installed, fall back to the GitHub MCP tools (e.g., `unblocked` data_retrieval) if available. If neither is available, skip GitHub 이슈 검색 and note it was skipped in the output.

</parallel_tasks>

#### 4. **세션 기록** (internal f낮음 after launching the parallel block — only if the user opted in)
   - **Skip entirely** if the user declined 세션 기록 in the fol낮음-up question, if running in lightweight mode, or if running in headless mode.
   - Run session discovery, branch/keyword filtering, scan-window selection, deep-dive selection, and per-session extraction directly inside this skill using `scripts/session-history/`.
   - Read the skill-local synthesis prompt at `references/agents/session-historian.md`, then dispatch a generic subagent using that prompt content. Do not dispatch a standalone agent by type/name.

   **Session-history payload — keep tight.** A long, keyword-rich payload licenses widening. Use this shape:

   - **Pre-resolved context** (only if values resolved cleanly above; otherwise omit): repo name, current git branch.
   - **Time window**: explicit `7 days` unless the documented problem clearly spans a longer arc.
   - **문제 topic**: one sentence naming the concrete issue — error message, module name, what broke and how it was fixed. Not a paragraph; not a bullet list of related topics.
   - **Filter rule (one line)**: "Only surface findings directly relevant to this specific problem. Ignore unrelated work from the same sessions or branches."
   - **Output schema**:

     ```
     Structure your response with these sections (omit any with no findings):
     - What was tried before
     - What didn't work
     - Key decisions
     - Related context
     ```

   Do not append additional context blocks, exclusion lists, or topic-keyword bullets — verbose payloads give the session-history f낮음 license to keep widening the search and rapidly compound wall time. If keyword search is needed, the internal f낮음 owns that decision based on the topic.
   - Returns: structured digest of findings from prior sessions, or "no relevant prior sessions" if 없음 found.
   - **Session history is the final Phase 1 input, not a workf낮음 stop.** 시점 it returns, proceed directly to Phase 2 with its output as the last input — do not emit a summary and do not pause for the user. A "no relevant prior sessions" return is still a valid input; the documentation gets written without session context.

   **Script resolution.** Set `SKILL_DIR` to the absolute path of the directory containing the `SKILL.md` you just read, then run the bundled scripts through `$SKILL_DIR/scripts/session-history/`. `SKILL_DIR` is model-filled for this command, not an environment variable. If the bundled scripts cannot be located from that directory, skip 세션 기록 visibly with: "Session history was requested, but this platform did not expose the bundled session-history scripts to the runtime." Continue Phase 2 without session context.

   **Discovery pipeline.** Infer the scan window from the problem topic, starting with 7 days. Run discovery and metadata extraction:

   ```bash
   SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
   if [ -f "$SKILL_DIR/scripts/session-history/discover-sessions.sh" ] && [ -f "$SKILL_DIR/scripts/session-history/extract-metadata.py" ]; then
     REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
     REPO_NAME=$(basename "$REPO_ROOT")
     SCAN_DAYS="7"
     bash "$SKILL_DIR/scripts/session-history/discover-sessions.sh" "$REPO_NAME" "$SCAN_DAYS" --cwd "$REPO_ROOT" | tr '\n' '\0' | xargs -0 python3 "$SKILL_DIR/scripts/session-history/extract-metadata.py" --cwd-filter "$REPO_ROOT"
   else
     echo "Session history was requested, but this platform did not expose the bundled session-history scripts to the runtime."
   fi
   ```

   Pi sessions are included when present under `~/.pi/agent/sessions/`; they carry `cwd` like Codex but no git branch. If `_meta.files_processed` is `0`, return `no relevant prior sessions`. If the first pass finds no relevant branch matches, or if processing Codex or Pi sessions, derive 2-4 keywords from the topic and re-run metadata extraction with `--keyword K1,K2,...`. Keep at most 5 sessions across Claude Code, Codex, Cursor, and Pi, ranked by branch match, keyword match count, file size over 30KB, and recency. Exclude the current session.

   **Extraction pipeline.** Create `SCRATCH=$(mktemp -d -t compound-sessions-XXXXXX)`. For each selected session, write extracted content to scratch files:

   ```bash
   SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
   if [ -f "$SKILL_DIR/scripts/session-history/extract-skeleton.py" ]; then
     python3 "$SKILL_DIR/scripts/session-history/extract-skeleton.py" --output "$SCRATCH/<session-id>.skeleton.txt" < <session-file>
   else
     echo "Session history was requested, but this platform did not expose the bundled session-history scripts to the runtime."
   fi
   ```

   Use `extract-errors.py` selectively when dead ends or recurring errors are likely useful. Pass only the scratch file paths and metadata to the synthesis subagent.

   **Synthesis dispatch.** Build a generic subagent prompt containing:
   - the full content of `references/agents/session-historian.md`
   - `problem_topic`
   - `scratch_dir`
   - a `sessions` array with extracted file paths and metadata
   - the output schema above
   - the filter rule above

   The subagent reads only the scratch paths, **writes its prose findings to `/tmp/compound-engineering/compound/{run_id}/session-history.md`, and returns only that artifact path once the write is confirmed** (same #956 reliability rationale — session-history findings are long-form prose prone to summary-collapse). If `{run_id}` did not resolve or the artifact write failed, it returns the prose inline instead (per the inline-fallback rule above). If synthesis fails, note the failure and continue without session context.

### 2단계: 조립 및 작성

<sequential_tasks>

**WAIT for all Phase 1 inputs to complete before proceeding** — the three parallel subagents and, when the user opted in, the internal session-history f낮음. Session history is a Phase 1 input even though it runs in the orchestrator rather than as a public skill.

The orchestrating agent (main conversation) performs these steps:

1. **Collect Phase 1 results from the run artifacts.** For each Phase 1 subagent, `Read` its artifact file under `/tmp/compound-engineering/compound/{run_id}/` (`context.json`, `solution.md`, `related.json`, and `session-history.md` when 세션 기록 ran). The artifact holds the subagent's full output. **Fall back to the subagent's inline return only when its artifact file is absent or empty** (e.g., `{run_id}` did not resolve, or the subagent failed to write). The artifact is authoritative when present — this is what makes the workf낮음 resilient to the issue #956 summary-collapse, where the inline return is only an executive summary.
2. **Check the overlap assessment** from the 관련 문서 탐색기 before deciding what to write:

   | 중복 | Action |
   |---------|--------|
   | **High** — existing doc covers the same problem, root cause, and solution | **Update the existing doc** with fresher context (new code examples, 업데이트됨 references, additional prevention tips) rather than creating a duplicate. The existing doc's path and structure stay the same. |
   | **Moderate** — same problem area but different angle, root cause, or solution | **Create the new doc** normally. Flag the overlap for Phase 2.5 to recommend consolidation review. |
   | **Low or 없음** | **Create the new doc** normally. |

   The reason to update rather than create: two docs describing the same problem and solution will inevitably drift apart. The newer context is fresher and more trustworthy, so fold it into the existing doc rather than creating a second one that immediately needs consolidation.

   시점 updating an existing doc, preserve its file path and frontmatter structure. Update the solution, code examples, prevention tips, and any stale references. Add a `last_업데이트됨: YYYY-MM-DD` field to the frontmatter. Do not change the title unless the problem framing has materially shifted.

3. **Incorporate 세션 기록 findings** (if available). 시점 the internal session-history f낮음 returned relevant prior-session context:
   - Fold investigation dead ends and failed approaches into the **작동하지 않은 것** section (bug track) or **컨텍스트** section (knowledge track)
   - Use cross-session patterns to enrich the **예방** or **중요한 이유** sections
   - Tag session-sourced content with "(세션 기록)" so its origin is clear to future readers
   - If findings are thin or "no relevant prior sessions," proceed without session context
4. Assemble complete markdown file from the collected pieces, reading `assets/resolution-template.md` for the section structure of new docs
5. Validate YAML frontmatter against `references/schema.yaml`, including the YAML-safety quoting rule for array items (see `references/yaml-schema.md` > YAML Safety Rules)
6. Create directory if needed: `mkdir -p docs/solutions/[category]/`
7. Write the file: either the 업데이트됨 existing doc or the new `docs/solutions/[category]/[filename].md`
8. **Validate parser-safety of the written frontmatter** to catch silent-corruption issues the prose rules miss: malformed `---` delimiter lines, unquoted ` #` in scalar values (silent comment truncation), and unquoted `: ` in scalar values (silent mapping confusion). The bundled validator ships **inside the skill bundle**; the runtime Bash tool's CWD is the user's project, so a project-relative path would miss. Set `SKILL_DIR` to the absolute path of the directory containing the `SKILL.md` you just read for this command; it is model-filled, not an environment variable. Run it through an existence guard so platforms that cannot locate the script fall back to a manual check instead of silently skipping the protection:

   ```bash
   SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
   if [ -f "$SKILL_DIR/scripts/validate-frontmatter.py" ]; then
     python3 "$SKILL_DIR/scripts/validate-frontmatter.py" <output-path>
   else
     echo "Bundled validate-frontmatter.py not resolvable on this platform; applying the parser-safety checklist manually."
   fi
   ```

   - **If the script ran:** exit 0 means parser-safe; exit 1 means stderr names the offending field(s) — quote the value(s), re-write the doc, and re-run until exit 0. Do not declare success while validation fails.
   - **If the script did not run** (else branch): apply the validator's checks by hand, matching its exact scope — checking more broadly risks edits the validator would not require. Fix any violation by quoting the whole value before continuing:
     1. The opening and closing frontmatter delimiters are each a line whose content is `---` (trailing whitespace is fine; `----` or `---extra` is not a valid delimiter).
     2. For each **top-level** mapping entry (`key: value`, no leading indentation) whose value is **not already quoted or structured** (does not start with `"`, `'`, `[`, `{`, `|`, or `>`): the value must contain no unquoted ` #` (space-then-hash — YAML treats it as a comment and silently truncates) and no unquoted `: ` (colon-then-space — strict YAML may read it as a nested mapping). Quote the whole value if either appears.
     Nested values, array items, and already-quoted values are out of scope here (array-item quoting is handled by the schema/YAML-safety step above). Then state in the completion output that the bundled script validator was unavailable on this platform and the checks were 적용됨 manually.

   The validator does not enforce schema rules and does not flag YAML reserved-indicator characters (those produce loud parser errors downstream rather than silent corruption — out of scope). Uses Python 3 stdlib only (no PyYAML or other deps).

시점 creating a new doc, preserve the section order from `assets/resolution-template.md` unless the user explicitly asks for a different structure.

</sequential_tasks>

### 2.4단계: 어휘 캡처

**First, read `references/concepts-vocabulary.md`.** This is unconditional. Do not pre-judge from memory that nothing qualifies — the reference's criteria are non-obvious and qualifying terms often live in the surrounding conversation rather than the new doc itself. Reading the reference is what makes the rest of the phase possible.

Then, applying those criteria, scan the new doc **and** the surrounding conversation for qualifying domain terms. If `CONCEPTS.md` exists at repo root, add missing qualifying terms and refine existing entries when new precision surfaced. If it does not exist and at least one qualifying term surfaced, create it.

**Verify behavior assertions against source before writing them.** 시점 an entry asserts how code behaves (states, transitions, limits, semantics), Read the defining source at the current tree first — an entry drafted from a session-level summary is exactly how wrong semantics enter the glossary. Phase 2.45 re-checks these entries, but the cheap fix is to not write the error.

**Seed the learning's area at creation — don't write a lone term.** 시점 `CONCEPTS.md` does not yet exist, alongside the surfaced term also seed the core domain nouns of the area this learning touched, fol낮음ing the **Seed goal** and **Scope of a seed** rules in `references/concepts-vocabulary.md`. The seed is scoped to the learning's area (the modules and domain the fix touched) and defines only terms investigated here — it does not reach for repo-wide nouns. This anchors the surfaced term so it does not dangle against undefined siblings. A repo-wide concept map is `compound-refresh`'s bootstrap path, not this one.

**At creation, hold the qualifying bar conservatively for borderline terms.** A borderline term, or a class/table/file name dressed up as an entity, defers to a later run — clear core nouns are seeded, borderline ones wait. The conservatism is about quality, not count; updates to an existing file fol낮음 the normal criteria.

**시점 bootstrapping the file, start with this preamble under the `# Concepts` heading**, then add the qualifying entries be낮음 it:

> Shared domain vocabulary for this project — entities, named processes, and status concepts with project-specific meaning. Seeded with core domain vocabulary, then accretes as compound and compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

**Refresh the coherence neighborhood of any entry you touch.** 시점 adding or editing an entry, also inspect its *coherence neighborhood* — its cluster siblings and the terms it cross-references or that reference it. Within that neighborhood, do two things: fix glossary violations (implementation specifics — file paths, class names, function signatures, current-config values), and refresh entries the learning's own evidence shows have drifted. Bounds: neighborhood only, never a full-file audit; refresh only on evidence already in hand; if judging a neighbor would require investigation this learning did not do, flag it for `compound-refresh` rather than editing on a guess. The test: after the edit, would a reader find the touched entry's siblings or referenced terms inconsistent with it? Broader audit is `compound-refresh`'s job.

If no terms qualified after applying the reference's criteria, record that outcome explicitly in the success output (e.g., "Vocabulary capture: scanned, no qualifying terms"). Do not silently skip — the visible scan-and-no-result record is the audit signal that the reference was consulted.

**Apply edits silently in every mode — no user prompt in interactive, lightweight, or headless.** Vocabulary capture is a side effect of compounding, not a decision the user makes per run. 경량 mode reaches this through its own single-pass step (see 경량 Mode), and runs an **update-only** version — it refines an existing `CONCEPTS.md` but defers creation/seeding to a Full run.

### 2.45단계: 근거 확인

The doc (and any `CONCEPTS.md` entries from Phase 2.4) is about to become permanent, trusted knowledge. Validate its claims against the tree before it compounds. **Read `references/grounding-validation.md` now** — it holds the adjudication rules and the validator prompt; the steps be낮음 are only the trigger.

1. **Mechanical claims check (every mode, including headless).** Optionally run `git fetch --quiet` first (best-effort — skip silently offline; the network is never a correctness dependency). Then run the bundled validator against the written doc:

   ```bash
   SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
   python3 "$SKILL_DIR/scripts/validate-doc-claims.py" <doc-path>
   ```

   Exit 0 means nothing flagged. Exit 1 means flags to **adjudicate, not auto-fix** — each flagged path, SHA, link, or scaffold pattern is fixed, annotated as historical, or confirmed intentional per the reference's adjudication table. A doc may legitimately cite a path deleted by the very fix it documents; a flag is a question, not a failure. If the script cannot be resolved on this platform, apply the reference's manual checklist and say so in the output — never silently skip.

2. **Semantic grounding validator (Full and headless; lightweight skips it).** Dispatch one read-only generic subagent built from the prompt template in the reference, covering the written doc plus any `CONCEPTS.md` entries added or edited this run. It verifies code-behavior claims by quoting the defining source line, merge-state claims against remote truth (`gh` primary, git reachability fallback), and internal completeness of countable assertions. Apply its verdicts per the reference (fix contradicted claims from the quoted evidence; soften or drop unverifiable ones; mark offline merge-state checks as degraded), then re-run the mechanical check if the body changed.

### 2.5단계: 선택적 새로 고침 확인

After writing the new learning, decide whether this new solution is evidence that older docs should be refreshed.

`compound-refresh` is **not** a 기본값 fol낮음-up. Use it selectively when the new learning suggests an older learning or pattern doc may now be inaccurate.

It makes sense to invoke `compound-refresh` when one or more of these are true:

1. A related learning or pattern doc recommends an approach that the new fix now contradicts
2. The new fix clearly supersedes an older documented solution
3. The current work involved a refactor, migration, rename, or dependency upgrade that likely invalidated references in older docs
4. A pattern doc now looks overly broad, outdated, or no longer supported by the refreshed reality
5. The 관련 문서 탐색기 surfaced 높음-confidence refresh candidates in the same problem space
6. The 관련 문서 탐색기 reported **중간 overlap** with an existing doc — there may be consolidation opportunities that benefit from a focused review

It does **not** make sense to invoke `compound-refresh` when:

1. No related docs were found
2. Related docs still appear consistent with the new learning
3. The overlap is superficial and does not change prior guidance
4. Refresh would require a broad historical review with weak evidence

Use these rules:

- If there is **one obvious stale candidate**, invoke `compound-refresh` with a narrow scope hint after the new learning is written
- If there are **multiple candidates in the same area**, ask the user whether to run a targeted refresh for that module, category, or pattern set
- If context is already tight or you are in lightweight mode, do not expand into a broad refresh automatically; instead recommend `compound-refresh` as the next step with a scope hint
- **In headless mode**, never invoke `compound-refresh` and never ask the user. Surface the recommended scope hint in the terminal report's "Refresh recommendation" line and let the caller decide

시점 invoking or recommending `compound-refresh`, be explicit about the argument to pass. Prefer the narrowest useful scope:

- **Specific file** when one learning or pattern doc is the likely stale artifact
- **Module or component name** when several related docs may need review
- **카테고리 name** when the drift is concentrated in one solutions area
- **Pattern filename or pattern topic** when the stale guidance lives in `docs/solutions/patterns/`

예시:

- `/compound-refresh plugin-versioning-requirements`
- `/compound-refresh payments`
- `/compound-refresh performance-issues`
- `/compound-refresh critical-patterns`

A single scope hint may still expand to multiple related docs when the change is cross-cutting within one domain, category, or pattern area.

Do not invoke `compound-refresh` without an argument unless the user explicitly wants a broad sweep.

Always capture the new learning first. Refresh is a targeted maintenance fol낮음-up, not a prerequisite for documentation.

### 검색 가능성 확인

After the learning is written and the refresh decision is made, check whether the project's instruction files would lead an agent to discover and search `docs/solutions/` before starting work in a documented area. This runs every time — the knowledge store only compounds value when agents can find it.

1. Identify which root-level instruction files exist (AGENTS.md, CLAUDE.md, or both). Read the file(s) and determine which holds the substantive content — one file may just be a shim that `@`-includes the other (e.g., `CLAUDE.md` containing only `@AGENTS.md`, or vice versa). The substantive file is the assessment and edit target; ignore shims. If neither file exists, skip this check entirely.
2. Assess whether an agent reading the instruction files would learn three things:
   - That a searchable knowledge store of documented solutions exists
   - Enough about its structure to search effectively (category organization, YAML frontmatter fields like `module`, `tags`, `problem_type`)
   - 시점 to search it (before implementing features, debugging issues, or making decisions in documented areas — learnings may cover bugs, best practices, workf낮음 patterns, or other institutional knowledge)

   This is a semantic assessment, not a string match. The information could be a line in an architecture section, a bullet in a gotchas section, spread across multiple places, or expressed without ever using the exact path `docs/solutions/`. Use judgment — if an agent would reasonably discover and use the knowledge store after reading the file, the check passes.

3. If the spirit is already met, no action needed — move on.
4. If not:
   a. Based on the file's existing structure, tone, and density, identify where a mention fits naturally. Before creating a new section, check whether the information could be a single line in the closest related section — an architecture tree, a directory listing, a documentation section, or a conventions block. A line added to an existing section is almost always better than a new headed section. Only add a new section as a last resort when the file has clear sectioned structure and nothing is even remotely related.
   b. Draft the smallest addition that communicates the three things. Match the file's existing style and density. The addition should describe the knowledge store itself, not the plugin — an agent without the plugin should still find value in it.

      Keep the tone informational, not imperative. Express timing as description, not instruction — "relevant when implementing or debugging in documented areas" rather than "check before implementing or debugging." Imperative directives like "always search before implementing" cause redundant reads when a workf낮음 already includes a dedicated search step. The goal is awareness: agents learn the folder exists and what's in it, then use their own judgment about when to consult it.

      예시 of calibration (not templates — adapt to the file):

      시점 there's an existing directory listing or architecture section — add a line:
      ```
      docs/solutions/  # documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (module, tags, problem_type)
      ```

      시점 nothing in the file is a natural fit — a small headed section is appropriate:
      ```
      ## Documented Solutions

      `docs/solutions/` — documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (`module`, `tags`, `problem_type`). Relevant when implementing or debugging in documented areas.
      ```
   c. In full interactive mode, explain to the user why this matters — agents working in this repo (including fresh sessions, other tools, or collaborators without the plugin) won't know to check `docs/solutions/` unless the instruction file surfaces it. Show the proposed change and where it would go, then use the platform's blocking question tool to get consent before making the edit: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex, `ask_question` in Antigravity CLI (`agy`), `ask_user` in Pi (requires the `pi-ask-user` extension). Fall back to presenting the proposal in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. 질문을 조용히 건너뛰지 마세요. In lightweight mode, output a one-liner note and move on. In headless mode, apply the edit directly without prompting and surface it in the terminal report under "Instruction-file edit"

5. **If `CONCEPTS.md` exists at repo root, run a parallel discoverability check for it.** Assess whether the instruction file would lead an agent to discover the project's shared domain vocabulary. Use the same workf낮음 as the `docs/solutions/` check above: same target file, same edit-placement judgment, same consent-then-edit interaction shape per mode. A line in an existing section is almost always better than a new headed section. Example calibration when nothing else fits:

   ```
   CONCEPTS.md  # shared domain vocabulary (entities, named processes, status concepts) — relevant when orienting to the codebase or discussing domain concepts
   ```

   **Skip this step entirely if `CONCEPTS.md` does not exist** — never nag for an artifact the project has not adopted. 시점 skipped, this step produces no output and no edit.

### 3단계: 선택적 개선

**WAIT for Phase 2 to complete before proceeding.**

**Skip Phase 3 entirely in headless mode** to bound token usage — the caller does not have a human-in-the-loop to act on reviewer findings, and downstream automations can run specialized reviewers themselves if they want that pass.

<parallel_tasks>

Based on problem type, optionally dispatch generic subagents seeded with local prompt assets from `references/agents/` to review the documentation. Do not dispatch standalone agents by type/name.

- **performance_issue** → `references/agents/performance-oracle.md`
- **security_issue** → `references/agents/security-sentinel.md`
- **database_issue** → `references/agents/data-integrity-guardian.md`
- Any code-heavy issue → preserve code simplification as a **read-only documentation review**. Inspect the solution draft's code examples and explanatory claims inline, or dispatch a generic subagent seeded with a local prompt only to return suggestions. Do **not** invoke `ce-simplify-code` from this phase and do not mutate product code unless the user explicitly asks for a separate code-simplification pass. Do not use the deleted `code-simplicity-reviewer`.
  Example: review the solution draft's examples for speculative abstractions, redundant wrappers, dead branches, and just-in-case parameters. Apply edits only to the documentation/examples being written by `compound`; leave any branch code changes untouched.

</parallel_tasks>

---

### 경량 모드

<critical_requirement>
**Single-pass alternative — same documentation, 토큰을 적게 사용하지만.**

This mode skips parallel subagents entirely. The orchestrator performs all work in a single pass, producing the same solution document without cross-referencing or duplicate detection.

헤드리스 mode forces Full and does not enter 경량 — automations get the cross-reference and overlap detection benefits without the interactive overhead.
</critical_requirement>

The orchestrator (main conversation) performs ALL of the fol낮음ing in one sequential pass:

1. **Extract from conversation**: Identify the problem and solution from conversation history. Also scan the "user's auto-memory" block injected into your system prompt, if present (Claude Code only) -- use any relevant notes as supplementary context alongside conversation history. Tag any memory-sourced content incorporated into the final doc with "(auto memory [claude])". Before asserting how code behaves (enum values, status semantics, limits, 기본값s), Read the defining line at the current tree — soften or attribute any claim you cannot verify. Cite PR numbers over bare commit SHAs, and phrase unmerged fixes as pending
2. **Classify**: Read `references/schema.yaml` and `references/yaml-schema.md`, then determine track (bug vs knowledge), category, and filename
3. **Write minimal doc**: Create `docs/solutions/[category]/[filename].md` using the appropriate track template from `assets/resolution-template.md`, with:
   - YAML frontmatter with track-appropriate fields, applying the YAML-safety quoting rule for array items (see `references/yaml-schema.md` > YAML Safety Rules)
   - 버그 트랙: 문제, root cause, solution with key code snippets, one prevention tip
   - 지식 트랙: 컨텍스트, guidance with key examples, one applicability note
4. **Vocabulary capture (update-only)**: if `CONCEPTS.md` exists at repo root, read `references/concepts-vocabulary.md`, then scan the new doc and the conversation for qualifying terms and add/refine entries silently (same criteria as Phase 2.4). Do **not** bootstrap or seed in lightweight mode — if `CONCEPTS.md` does not exist, defer creation to a Full run, which owns seeding. Record the outcome in the output (e.g., "Vocabulary: 1 entry refined" or "scanned, no qualifying terms"). If you refined `CONCEPTS.md` and a quick read of `AGENTS.md`/`CLAUDE.md` shows it isn't surfaced there, add the discoverability tip to the output be낮음 — lightweight **tips**, it does not edit instruction files (a Full run owns that edit).
5. **Mechanical claims check**: run `scripts/validate-doc-claims.py` against the written doc exactly as in Phase 2.45 step 1 (same `SKILL_DIR` anchor, same adjudicate-not-auto-fix rule — read `references/grounding-validation.md` for the adjudication table when it flags anything). 경량 skips only the semantic validator subagent, not this deterministic check.
6. **Skip specialized agent reviews** (Phase 3) and the semantic grounding validator (Phase 2.45 step 2) to conserve context

**경량 output:**
```
✓ Documentation complete (lightweight mode)

File created:
- docs/solutions/[category]/[filename].md

[If discoverability check found instruction files don't surface the knowledge store:]
Tip: Your AGENTS.md/CLAUDE.md doesn't surface docs/solutions/ to agents —
a brief mention helps all agents discover these learnings.

[If CONCEPTS.md was refined this run and isn't surfaced in the instruction files:]
Tip: Your AGENTS.md/CLAUDE.md doesn't surface CONCEPTS.md —
a one-line mention helps agents find the shared vocabulary.

Note: This was created in lightweight mode. For richer documentation
(cross-references, detailed prevention strategies, specialized reviews,
semantic grounding validation), re-run /compound in a fresh session.
```

**No subagents are launched. No parallel tasks. 해결책 문서가 유일한 산출물입니다** (Phase 2.4's update-only vocabulary capture may also refine an existing `CONCEPTS.md`).

In lightweight mode, the overlap check is skipped (no 관련 문서 탐색기 subagent). This means lightweight mode may create a doc that overlaps with an existing one. That is acceptable — `compound-refresh` will catch it later. Only suggest `compound-refresh` if there is an obvious narrow refresh target. Do not broaden into a large refresh sweep from a lightweight session.

---

## 캡처하는 내용

- **문제 symptom**: Exact error messages, observable behavior
- **Investigation steps tried**: What didn't work and why
- **Root cause analysis**: Technical explanation
- **Working solution**: Step-by-step fix with code examples
- **예방 strategies**: How to avoid in future
- **Cross-references**: Links to related issues and docs

## 사전 조건

<preconditions enforcement="advisory">
  <check condition="problem_solved">
    문제 has been solved (not in-progress)
  </check>
  <check condition="solution_verified">
    해결책 has been verified working
  </check>
  <check condition="non_trivial">
    사소하지 않은 문제 (not simple typo or obvious error)
  </check>
</preconditions>

## 생성되는 항목

**Organized documentation:**

- File: `docs/solutions/[category]/[filename].md`

**문제에서 카테고리를 자동 감지합니다:**

버그 트랙:
- build-errors/
- test-failures/
- runtime-errors/
- performance-issues/
- database-issues/
- security-issues/
- ui-bugs/
- integration-issues/
- logic-errors/

지식 트랙:
- architecture-patterns/ — architectural or structural patterns (agent/skill/pipeline/workf낮음 shape decisions)
- design-patterns/ — reusable non-architectural design approaches (content generation, interaction patterns, prompt shapes)
- tooling-decisions/ — language, library, or tool choices with durable rationale
- conventions/ — team-agreed way of doing something, captured so it survives turnover
- workf낮음-issues/
- developer-experience/
- documentation-gaps/
- best-practices/ — fallback only, use when no narrower knowledge-track value applies

## 피해야 할 일반적인 실수

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| 하위 에이전트가 다음 위치에 제품 파일을 작성함: `docs/` or edit tracked paths | Subagents write only scratch artifacts under `/tmp/compound-engineering/compound/<run-id>/` and return the path; orchestrator writes the one final doc |
| Subagent returns a long prose body only as its inline response | Subagent writes full output to its run artifact; orchestrator Reads it back (inline return is fallback only) |
| 조사와 조립을 병렬로 실행함 | Research completes → then assembly runs |
| Multiple files 생성됨 during workf낮음 | One solution doc written or 업데이트됨: `docs/solutions/[category]/[filename].md` (plus optional maintenance writes: a `CONCEPTS.md` create/update from Phase 2.4 and a small instruction-file edit for discoverability) |
| 기존 문서가 같은 문제를 다루는데 새 문서를 생성함 | Check overlap assessment; update the existing doc when overlap is 높음 |
| 대화 기억만으로 코드 동작이나 병합 상태를 단정함 | Read the defining source line before asserting; cite PR numbers over SHAs; soften unverifiable claims (Phase 1 extractor rules, re-checked in Phase 2.45) |
| 여러 학습을 한 번에 처리함 and stitching cross-references between drafts | One learning per run; run the skill sequentially for each additional learning |

## 성공 출력

### 헤드리스 mode

Emit a structured terminal report and end the turn. No "What's next?" question, no blocking prompt. End with `문서화 완료` as the terminal signal so callers can detect completion.

```
✓ Documentation complete (headless mode)

File: docs/solutions/<category>/<filename>.md  (created | updated)
Track: <bug | knowledge>
Category: <category>
Overlap: <none | low | moderate — see <path> | high — existing doc updated>
Grounding: <clean | N flags adjudicated (X fixed, Y annotated, Z confirmed) | N claims softened or corrected | degraded — merge-state claims unverified offline>
Instruction-file edit: <none needed | applied to <path> | gap noted, not applied>
CONCEPTS.md: <scanned, no qualifying terms | created with N entries (M seeded from the learning's area) | updated — N added, N refined>
Refresh recommendation: <none | scope hint for /compound-refresh>

Documentation complete
```

시점 no doc was written (e.g., headless invoked on a session where the problem is not yet solved), emit a structured failure instead and end with `문서화 건너뜀` so callers can distinguish success from no-op:

```
✗ Documentation skipped (headless mode)

Reason: <one-sentence explanation — e.g., "no solved problem detected in
conversation history" or "solution not yet verified">

Documentation skipped
```

### 대화형 mode

```
✓ Documentation complete

Auto memory: 2 relevant entries used as supplementary evidence

Subagent Results:
  ✓ Context Analyzer: Identified performance_issue in brief_system, category: performance-issues/
  ✓ Solution Extractor: 3 code fixes, prevention strategies
  ✓ Related Docs Finder: 2 related issues
  ✓ Session History: 3 prior sessions on same branch, 2 failed approaches surfaced

Grounding Validation:
  ✓ Mechanical check: 14 paths, 2 SHAs, 3 links checked — 1 flag annotated as historical
  ✓ Semantic validator: 9 claims verified, 1 merge-state claim softened to pending

Specialized Agent Reviews (Auto-Triggered):
  ✓ performance-oracle: Validated query optimization approach
  ✓ Code simplification review: Code examples are appropriately minimal

Files written:
- docs/solutions/performance-issues/n-plus-one-brief-generation.md (created)
- CONCEPTS.md (created with 3 entries: BriefSystem, EmailQueue, Brief Status)

This documentation will be searchable for future reference when similar
issues occur in the Email Processing or Brief System modules.

What's next?
1. Continue workflow (recommended)
2. Link related documentation
3. Update other references
4. View documentation
5. Other
```

**After displaying the interactive success output above, present the "What's next?" options using the platform's blocking question tool:** `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex, `ask_question` in Antigravity CLI (`agy`), `ask_user` in Pi (requires the `pi-ask-user` extension). Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. 질문을 조용히 건너뛰지 마세요. Do not continue the workf낮음 or end the turn without the user's selection. (대화형 mode only — headless skips this per the headless block above.)

**Alternate interactive output (when updating an existing doc due to 높음 overlap):** in headless mode, this case is communicated via the `중복: 높음 — existing doc 업데이트됨` line of the headless terminal report above, not as a separate output block.

```
✓ Documentation updated (existing doc refreshed with current context)

Overlap detected: docs/solutions/performance-issues/n-plus-one-queries.md
  Matched dimensions: problem statement, root cause, solution, referenced files
  Action: Updated existing doc with fresher code examples and prevention tips

File updated:
- docs/solutions/performance-issues/n-plus-one-queries.md (added last_updated: 2026-03-24)
```

## 축적 철학

This creates a compounding knowledge system:

1. First time you solve "N+1 query in brief generation" → Research (30 min)
2. 해결책을 문서화합니다 → docs/solutions/performance-issues/n-plus-one-briefs.md (5 min)
3. 다음에 비슷한 문제가 발생하면 → 빠르게 찾아봅니다 (2 min)
4. 지식이 축적됩니다 → Team gets smarter

The feedback loop:

```
Build → Test → Find Issue → Research → Improve → Document → Validate → Deploy
    ↑                                                                      ↓
    └──────────────────────────────────────────────────────────────────────┘
```

**Each unit of engineering work should make subsequent units of work easier—not harder.**

## 자동 호출

<auto_invoke> <trigger_phrases> - "that worked" - "it's fixed" - "working now" - "problem solved" - "잘 됐어" - "이제 잘 돼" - "고쳐졌어" - "수정됐어" - "해결됐어" - "문제 해결됐어" - "정상 동작해" </trigger_phrases>

<manual_override> Use /compound [context] to document immediately without waiting for auto-detection. </manual_override> </auto_invoke>

## 출력

최종 학습을 직접 다음 위치에 기록합니다: `docs/solutions/`.

## 적용 가능한 전문 로컬 프롬프트

Based on problem type, these local prompt assets can enhance documentation:

### Code Quality & Review
- **Read-only code simplification review**: Checks solution examples and documentation claims for unnecessary complexity without mutating product code
- **references/agents/pattern-recognition-specialist.md**: Identifies anti-patterns or repeating issues

### Specific Domain Experts
- **references/agents/performance-oracle.md**: Analyzes performance_issue category solutions
- **references/agents/security-sentinel.md**: Reviews security_issue solutions for vulnerabilities
- **references/agents/data-integrity-guardian.md**: Reviews database_issue migrations and queries

### Enhancement & Research
- **references/agents/best-practices-researcher.md**: Enriches solution with industry best practices
- **references/agents/framework-docs-researcher.md**: Links to framework/library documentation references

### 시점 to Invoke
- **자동 트리거** (optional): Generic subagents seeded with local prompts can run post-documentation for enhancement
- **수동 트리거**: User can run surviving skills such as `ce-simplify-code` after `/compound` completes for deeper code review and mutation

## 관련 명령

- `/research [topic]` - Deep investigation (searches docs/solutions/ for patterns)
- `/ce-plan` - Planning workf낮음 (references documented solutions)

