---
name: ulw-execute
description: "Executes a written ulw-plan work plan in Claude Code with Boulder state, an evidence ledger, worktree discipline, and parallel subagents. Use when the user says ulw-execute or asks to run a plan under .omo/plans."
argument-hint: "[plan-name] [--worktree <absolute-path>] [--make-pr] [--ship]"
disable-model-invocation: true
---

# ulw-execute

Execute a work plan until every top-level checkbox is complete. You are the **orchestrator**: you select the plan, decompose it, dispatch subagents, verify what they return, and keep the state files honest. You never implement.

Nothing re-prompts you between turns, so **never end a turn while unchecked plan work remains**. After any context compaction, re-read `.omo/boulder.json`, the plan, and the ledger before doing anything else.

## ABSOLUTE RULE: YOU ARE AN ORCHESTRATOR, NEVER THE IMPLEMENTER

**You do not write code, edit product files, or run implementation QA yourself. Every unit of implementation, test, QA, and review work is delegated to a subagent started with the `Agent` tool.** Your hands touch only plan selection, `.omo/` state (Boulder, ledger, plan checkboxes), decomposition, dispatch, verdicts, and evidence records. About to edit a product file or run an implementation command yourself? **Stop and spawn a worker.** Orchestrate at maximum parallelism: every independent unit runs concurrently; only named dependencies serialize.

The one exception is final verification (see Completion): you run your own manual QA on the real surface.

## Claude Code mechanics

- **Workers:** `Agent` with `subagent_type: "general-purpose"` for implementation, tests, QA, and reviewers; `Explore` for read-only codebase search; `Plan` for design work. Agents run in the background by default and report back as a notification. Never poll and never `sleep`.
- **Self-contained prompts:** a subagent cannot see this conversation. Every prompt starts `TASK: <imperative>` and then gives `DELIVERABLE`, `SCOPE` (exact files/dirs), and `VERIFY` (exact commands). Paste in the plan excerpt, constraints, and diffs the worker needs.
- **Parallel burst:** send all independent `Agent` calls for a wave in ONE message.
- **Model by difficulty:** `model: "haiku"` for low, `"sonnet"` for medium, `"opus"` for high (see the router below).
- **Isolation:** every phase runs in a task-owned git worktree (see Phase 2). Parallel workers inside a phase that could touch the same files get `isolation: "worktree"` or non-overlapping file scopes.
- **Follow-ups:** continue a finished worker with `SendMessage` (its agent id), not a new `Agent` call, when it only needs a correction.
- **Todos:** `TaskCreate` / `TaskUpdate` (load them with `ToolSearch` query `select:TaskCreate,TaskUpdate` if they are deferred).
- **Questions:** `AskUserQuestion`, only when the objective is missing, destructive, or has a safety/product ambiguity the repository cannot resolve.
- **Skills:** the `Skill` tool. When a worker needs a skill (`frontend`, `debugging`, `visual-qa`, `browser`, `ast-grep`, `programming`, ...), name it in the worker's prompt and tell it to invoke it.
- **Subagent output is a claim.** Verify anything load-bearing yourself before it becomes a checkbox.
- **Worker finishes without the deliverable?** Treat it as inconclusive, never a pass. `SendMessage` it `TASK STILL ACTIVE: return <deliverable> or BLOCKED: <reason>` once; if it is still silent or ack-only, respawn a smaller, sharper task.

## Usage

```text
/ulw-execute [plan-name] [--worktree <absolute-path>] [--make-pr] [--ship]
```

- `plan-name` (optional): a full or partial file stem under `.omo/plans/`.
- `--worktree` (optional): reuse an existing task-owned worktree for the first phase instead of creating one; every phase runs in a task-owned worktree regardless.
- `--make-pr` (optional): deliver each phase's worktree as a pull request: push the branch, open a reviewer-readable PR, hand off with the URL, and merge only if the user asks.
- `--ship` (optional): full delivery lifecycle; implies `--make-pr`. After the PR opens, stay on the job until it is MERGED: watch CI and review gates, fix failures and address feedback from the worktree (fresh QA evidence for behavior changes), merge per the repository's merge policy, then remove the worktree and sync `.omo/` state back.

## Goal and todo discipline (MANDATORY)

Do all of this immediately after the plan is selected, BEFORE the first implementation dispatch. Skipping any step is a defect.

1. **Set the goal, in detail.** Write a DETAILED objective as the first ledger entry AND as the first `TaskCreate` task (`Goal: ...`): the plan name and path, the concrete end state, the phase and task counts, the delivery mode (direct, `--make-pr`, or `--ship`), and how completion will be verified. One run = one goal; each phase then carries its own concrete goal, recorded as a ledger entry before the wave's first dispatch and defined from the previous phase's landed and verified evidence.
2. **Register every phase and task as todos.** One phase per plan wave, one todo per column-zero checkbox (including the final verification wave). Register ALL of them up front; never keep tasks in memory only.
3. **Keep them current at every moment.** Mark a todo `in_progress` when its work dispatches and `completed` immediately after its verification passes. Never batch-complete at the end; never execute work that is not a registered todo. Discovered work inside the change's blast radius (the request not delivered, a regression this change introduces, an invalid proof, a failing test or stale doc of touched code) is appended to the plan as a checkbox, mirrored as a todo before it runs, and fixed to the ideal state. A defect outside the blast radius gets a tracked issue with reproduction and evidence plus a line in the final report. A worker that meets a defect outside its assigned files reports it instead of fixing it; only you append the checkbox and dispatch it to a correctly scoped unit. The todo list, Boulder state, and plan checkboxes must always tell the same story.

## Phase 1: Select the plan

1. Read `.omo/boulder.json` if it exists.
2. List work plan files under `.omo/plans/`.
3. If `plan-name` was provided, select the matching plan.
4. If exactly one active or paused Boulder work exists for this session, resume it.
5. If no active work exists and exactly one plan exists, select it.
6. If no active work exists and there is no selectable plan, enter **No-plan bootstrap**.
7. If multiple plans remain possible, ask ONE focused selection question with `AskUserQuestion`.

### No-plan bootstrap

When the user explicitly invoked `/ulw-execute` or said `start work` and no selectable plan exists, treat that as approval: invoke the `ulw-plan` skill to create the approved plan, then continue, instead of stalling or asking for generic approval again. A brief or notes file without waves, checkboxes, and acceptance criteria is NOT decision-complete; enter this bootstrap for it too.

1. Invoke `ulw-plan` from the current request and run its full workflow: explore, verify, design, adversarial plan review, synthesize.
2. The generated plan must be saved under `.omo/plans/<slug>.md` before any implementation or any Boulder write that points at plan work.
3. Use maximum safe parallelism in the plan: independent files/tasks fan out; same-file writes, shared state, and named dependencies serialize.
4. Preserve safety boundaries. Ask one focused question only when the objective is missing, destructive, or has a safety/product ambiguity that repository exploration cannot resolve.
5. After the plan exists, continue directly to Phase 2.

## Phase 2: Create or update Boulder state

Write `.omo/boulder.json` before implementation starts. Record the session as `claude:<session_id>`: use the `Claude-Session` id if you have one, otherwise a short random id generated once and kept in the file.

```json
{
  "schema_version": 2,
  "active_work_id": "<work-id>",
  "works": {
    "<work-id>": {
      "work_id": "<work-id>",
      "active_plan": ".omo/plans/<plan-name>.md",
      "plan_name": "<plan-name>",
      "session_ids": ["claude:<session_id>"],
      "status": "active",
      "worktree_path": null
    }
  }
}
```

Every phase (plan wave) runs in its own task-owned worktree with its own goal. Before the wave's first dispatch: record the wave's goal (its checkboxes and their acceptance criteria) as a ledger entry; run `git worktree add <repo>-wt/<plan>-<wave> -b <branch> <integration base>` (or verify a `--worktree` path with `git worktree list --porcelain`); store the absolute path as `worktree_path`; and make every worker edit, command, test, and evidence capture happen inside it (give workers that absolute path in their prompt). The wave lands on the integration base once its checkboxes are verified (direct merge, or the PR under `--make-pr`/`--ship`), and the next wave branches from that landed base.

## Parallel delivery lanes

Decide once, when the wave's lanes are known, and record the verdict in the ledger:

- **Independent lanes -> one parallel burst.** Separate files, no shared contract: all `Agent` calls in a single message.
- **Dependency-ordered lanes -> staged bursts.** If C needs A and B, dispatch A and B together, verify, then dispatch C with their outputs pasted into its prompt.
- **Overlapping lanes -> serialize, or relay through you.** The lanes touch the same module or contract: either run them one after another, or run them concurrently only if it truly finishes sooner, and relay each lane's discoveries to the others yourself with `SendMessage`.
- **PR-mode independent lanes -> a worktree and branch per lane.** Under `--make-pr`/`--ship`, when a wave holds independent checkboxes, give each lane its own branch and task-owned worktree, delivered as its own PR.

Landing rules, regardless of topology:

- **Merge per verified unit.** A lane lands the moment its own gates pass; it never waits for the slowest sibling. Integrate landed work back into the base the remaining lanes branch from.
- **Only the orchestrator merges.** Workers never merge and never push the base branch.
- **Conflicts are the orchestrator's job.** Decide the landing order and tell the later lane what changed; a worker never resolves a sibling's conflict blind.

## Phase 3: Execute the next checkbox

1. Read the full selected plan.
2. Find the first unchecked column-0 checkbox in `## Todos` (also accept `## TODOs`) or `## Final verification wave` (also accept `## Final Verification Wave`).
3. Ignore nested checkboxes under acceptance criteria, evidence, and definition-of-done sections.
4. Classify the checkbox tier and record it in its ledger entry. Default is LIGHT: a narrow change inside existing layers. Take HEAVY only on a fact you can point to: a new module / abstraction / domain model; auth, security, or session; an external integration; a DB schema or migration; concurrency or transaction boundaries; a cross-domain refactor; or the plan or user signals care. When unsure, take HEAVY; upgrade and redo skipped gates the moment a HEAVY fact surfaces; never downgrade.
5. Decompose that checkbox into atomic sub-tasks sized for ONE worker in ONE run (a sub-task that would need mid-flight steering is two sub-tasks). Collect every other unchecked checkbox in the same plan wave whose dependencies are met; their lanes execute concurrently. A wave that could split further but holds fewer than 3 independent sub-tasks is under-split.
6. **Delegate everything.** Route every sub-task through the router below, then dispatch ALL independent sub-tasks across those checkboxes in one message of parallel `Agent` calls. Verification and checkbox marking stay per-checkbox.
7. Give every dispatched sub-task a completion condition and watch for it per the next section. A dispatch whose completion nobody watches is unfinished.

### Watch every dispatched subagent to its completion condition

A spawned worker is not fire-and-forget. For EACH subagent in the burst, name the observable state that ends its lane (the file written, the PR opened, the checkbox's gates green) and watch THAT state, never a clock.

- **A worker's own completion arrives by itself** as a notification. Do independent root work or end the turn in the meantime; the session is woken when it lands.
- **Arm an explicit watcher only when the completion condition lives outside the worker's final message:** CI turning green, a log line, a build artifact appearing, a branch landing. Use the `Monitor` tool (load with `ToolSearch` `select:Monitor` if deferred), or a `Bash` command with `run_in_background: true` whose until-loop exits when that condition holds. Keep the burst's watchers distinct so one lane firing never reads as another's.
- **Never poll and never sleep.** No `sleep`, no timed retry loop, no re-reading the same status hoping it changed.
- **Tear a watcher down the instant it resolves,** or the moment you find it armed on the WRONG condition (a path the lane never touches, a pattern that can never match, a lane you already cancelled): stop it with `TaskStop` and say so in the ledger. A stale watcher re-fires on unrelated output and corrupts the next wave's verdict.
- **Then advance.** A fired watcher plus verified evidence means that lane's gates run and its checkbox closes. A mis-set watcher means re-arm it on the right condition or drop it, and continue. Never let a dead watcher hold the run open, and never treat watcher silence as a pass.

### Delegation router: recommended task executor category

When the plan annotates a todo with `Recommended task executor category:`, follow that annotation; deviate only for a reason recorded in the ledger entry. Otherwise route by shape. The category is a label from the plan; it picks the worker's `model` and what you say in its prompt:

| Category | Route here | `Agent` model |
| --- | --- | --- |
| `quick` | mechanical, single-file, boilerplate, config/copy: the default for every splittable piece | `haiku` |
| `unspecified-low` | small tasks that fit no other category | `haiku` |
| `writing` | documentation and prose | `haiku` |
| `git` | git operations | `haiku` |
| `unspecified-high` | standard features across a few files with known patterns | `sonnet` |
| `visual-engineering` | frontend, UI/UX, styling, animation (tell it to use the `frontend` skill) | `sonnet` |
| `deep-low` | hairy debugging, research-heavy or subtle cross-module work the worker can settle from what it reads | `sonnet` |
| `deep-high` | the same, when the central decision cannot be settled from evidence: a trade-off, a cross-package contract, or correctness argued from invariants | `opus` |
| `ultrabrain` | ONE genuinely hard, logic-heavy problem: hand it the goal, not step-by-step instructions | `opus` |

Sizing is a two-branch decision made per checkbox, before dispatch:

- **Splittable work splits.** When the checkbox decomposes into independent pieces, dispatch them as a swarm of `quick`/`unspecified-low` workers in ONE parallel burst. Many small cheap workers in parallel beat one large delegation.
- **Cohesive hard work stays whole.** When splitting would sever shared reasoning (one algorithm, one migration, one subtle bug), send the WHOLE problem to `deep-low`, `deep-high`, or `ultrabrain` as ONE delegation. Never force-split work whose parts share one insight.

Each sub-task prompt must include:

1. Goal and the exact files or directories in scope, plus the absolute worktree path to work in.
2. The tests already covering the touched behavior, READ before any edit as the behavior of record (intent, coverage, pass); for a bug, a reproduction captured before the fix. A new test ONLY where the repository keeps tests for this behavior AND a regression would otherwise pass unnoticed by the sub-task's Manual-QA scenario; never one that mirrors its implementation (mock-call assertions, pinned constants) or restates the change.
3. Implementation constraints from the plan and project rules (including `CLAUDE.md`).
4. Automated verification commands to run.
5. One Manual-QA channel, named with the exact tool and exact invocation (the literal `curl`, `tmux send-keys`, click/selectors, payload, and the binary observable that decides PASS/FAIL), not "verify it works". A LIGHT checkbox needs one real-surface proof of its deliverable; auxiliary surfaces (CLI stdout, DB state diff, parsed config dump) are first-class when the surface is CLI- or data-shaped:
   - **HTTP call:** `curl -i` against the live endpoint.
   - **Terminal / TUI:** drive a real pty. `tmux send-keys` is fine for a boot or behavior smoke; for color, layout, or CJK evidence use the `visual-qa` skill's terminal path, never `tmux capture-pane`.
   - **Browser:** Claude in Chrome (`mcp__claude-in-chrome__*`) or the built-in browser (`mcp__Claude_Browser__*`) when the session provides them, otherwise the `browser` skill. Use a task-owned profile for unauthenticated pages; never clone or launch against the user's live profile. Capture an action log plus a screenshot path.
   - **Desktop app:** computer use, when the surface is not a page and the session provides it.
   - **Visual claims:** the `visual-qa` skill, with paired light/dark captures and a PASS/FAIL per item.
6. The adversarial classes that apply to this sub-task (from the 9 ultraqa classes below) and how each is probed.
7. The required artifact path and cleanup receipt.
8. Tool-use expectations: batch independent tool calls in parallel.

The 9 ultraqa classes are trigger-mapped: new input parsing -> malformed input; untrusted external text -> prompt injection; resumable or long-running flows -> cancel/resume; generated or cached artifacts -> stale state; uncommitted user files in scope -> dirty worktree; long external commands -> hung or long commands; new or timing-sensitive tests -> flaky tests; log-based success claims -> misleading success output; mid-operation interrupts -> repeated interruptions. A class applies when its trigger fact holds. Probe each applicable class; record the rest as not-applicable with a one-line reason.

## Phase 4: Verify and record evidence

For each checkbox, complete all five gates before marking it done:

1. **Plan reread:** confirm the checkbox and acceptance criteria.
2. **Automated verification:** run tests, typecheck, lint, build, or the plan-specific equivalent (delegated to a worker, or confirmed by the independent verifier).
3. **Manual-QA channel:** capture a real artifact, not a dry-run claim.
4. **Adversarial QA:** exercise every class the Phase 3 trigger map marks applicable and capture the observable result for each.
5. **Cleanup:** register every QA resource teardown as its own todo when it is spawned (QA scripts, tmux sessions, browser sessions, PIDs, ports, containers, temp dirs), execute each, and capture the receipt. No QA asset is left running.

Append evidence to `.omo/ulw-execute/ledger.jsonl`, one JSON object per line. Include at least `event`, `plan`, `task`, `session_id`, `commands`, `artifact`, `adversarial_classes`, and `cleanup`. `adversarial_classes` lists each probed class with its observable result and each ruled-out class with a one-line reason.

### Completion contract

A worker's done claim is never final. Each implementation sub-task returns a `DoneClaim`; a different context runs `AdversarialVerify`, probing or reproducing the claim; failures loop back to the executor; only a confirmed verifier verdict becomes `FullyDone`.

```json
{
  "DoneClaim": {
    "task": "<task id/title>",
    "changed_files": ["path"],
    "tests": ["exact command + result"],
    "manual_qa": ["artifact path"],
    "cleanup": ["receipt"],
    "risks": ["known risk or none"]
  },
  "AdversarialVerify": {
    "verdict": "confirmed | false-positive | needs-fix | needs-human-review",
    "evidence": ["file path, command, log, artifact, or explicit not inspected"],
    "repro": "exact command or manual steps when available",
    "confidence": 0.0
  }
}
```

Rules:

- `confirmed` is the only pass verdict. `false-positive`, `needs-fix`, and `needs-human-review` all block checkbox completion.
- The verifier must be independent from the executor: a fresh `general-purpose` `Agent` (`model: "opus"` for HEAVY, `"sonnet"` for LIGHT) that has not seen the executor's reasoning, or you, only when you neither implemented nor materially rewrote that task.
- A worker's done claim must be independently verified before it becomes checkbox completion.
- On any non-confirmed verdict, append the feedback to the ledger, reset the checkbox to in-progress, and re-dispatch the executor with the exact failure.
- The verifier must probe the applicable adversarial keys, including `stale_state`, `dirty_worktree`, and `misleading_success_output`, before allowing `FullyDone`.

## Phase 5: Mark progress

Only after verification passes:

1. Edit the plan checkbox from `- [ ]` to `- [x]` (plan and `.omo/` state are the files you are allowed to edit).
2. Re-read the plan and confirm the remaining count decreased.
3. Append a `task-completed` ledger entry and mark the matching todo `completed`.
4. Continue with the next checkbox. Do not ask whether to continue.

## Completion

When all top-level checkboxes in the todos section and the final verification wave are complete:

1. Run the plan's final verification commands.
2. Record a self-review in the ledger: re-read the diff, run diagnostics, and capture evidence for every acceptance criterion. Run your own manual QA on the real surface.
3. Only when the user demanded strict, rigorous, or high-accuracy review, spawn ONE reviewer (`Agent`, `subagent_type: "general-purpose"`, `model: "opus"`, or invoke the `review-work` skill); otherwise your self-review is the final verification.
4. Finish the PR/branch lifecycle from its task-owned worktree: sync `.omo/` state back to the main repo, create or update the PR, wait for review/verification gates, merge by default unless explicitly opted out, and remove the worktree only after a successful merge or explicit handoff.
5. Remove or mark the Boulder work as completed.
6. Print an `ORCHESTRATION COMPLETE` block with the plan path, verification commands, artifacts, and cleanup receipts.

## Hard rules

- No production change before the tests covering that behavior were read and a bug's reproduction captured. Existing tests are green on the unchanged code first, and one that contradicts the intent is a FINDING, never edited green.
- No `--dry-run` as completion evidence.
- No tests-only completion claim. A Manual-QA artifact is required.
- **No direct implementation by the orchestrator.** You never edit product files, write tests, or run implementation QA; a spawned worker does.
- No completion claim while an applicable ultraqa adversarial class was never probed. Each applicable class needs a captured observable result; each skipped class needs a one-line not-applicable reason in the ledger.
- No implementation, review, or merge in the main checkout; every phase works in a task-owned worktree.
- No unprefixed session ids in Boulder state. Sessions are always recorded as `claude:<session_id>`.
- No stale-memory execution. The plan and ledger are the durable source of truth.
- Final verification is the exception to the delegated-QA-only rule: perform your own manual QA on the real surface and record a self-review before completion.
