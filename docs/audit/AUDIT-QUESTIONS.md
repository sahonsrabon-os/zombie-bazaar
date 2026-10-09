# ZVSL — System Audit: Questions & Verification Plan

> Status: **PHASE 1 — questions written, evidence pending**
> Scope: everything under `/home/xubuntu/zvslast/`
> Rule in force: *do not invent protocols; only join what already exists.*
> Output rule: every finding has **two views** — `Human` (prose) and `Machine` (JSON).
> Backup taken before any change: `/home/xubuntu/zvslast-BACKUP-<ts>/` (128 files, byte-exact).

---

## PART A — HUMAN VIEW

This document is the *question sheet* first. Nothing below is an answer yet unless it
cites a file+line. The audit proceeds in three passes: **(1) enumerate, (2) question,
(3) prove with code.**

### A0. Why an audit at all

The repository grew by accretion: several entrypoints and several copies of the same
responsibility exist side by side. Before adding anything (adapter/, client/), we must
know what is **live**, what is **dead**, and what is **duplicated**. The goal is to
reduce the surface, not to grow it.

### A1. File inventory & duplicates

- Which top-level entrypoints actually run? (`start.js`, `zombie-gateway.js`,
  `start-local-mcp.js`, `api.js`, `local-llm-bridge.js`, `mcp-client.js`, `cdp-pipe.js`)
- Which files are byte-identical or near-duplicate copies?
  Suspects seen in inventory:
  - `0api.js` (Sep-28 stale copy) vs `api.js`
  - `api.js.bak` vs `api.js`
  - `old_local-llm-bridge.js` vs `local-llm-bridge.js`
  - `external-mcp.js` (top-level) vs `external mcp/` folder
  - `.env.bak-*`, `data/*.bak*`, `external mcp/servers.json.bak`
  - `registry.db` (generated) vs `registry.seed.json` (source)
  - `data/health-check-*.json` (same size, 4 copies), `data/locks/*.json`, `logs/*.log`
- Decision rule for "unnecessary": **no live require/import/reference from any running
  entrypoint, and superseded by a canonical file.**

### A2. Ollama local over UDS

- How does a local Ollama talk to us over a unix domain socket (UDS)?
- Where does the socket path come from (`socketPath`)? Is it real, or only a name?
- How does the server *use* UDS — for upstream provider calls, or for our own MCP server?
- Is the UDS path exercised headless (works with no terminal), or just declared?

### A3. MCP & external MCP communication

- How does `external mcp/*` (ocr, tts, screen-recorder, facebook-ads, public-api,
  skill-mcp-tool) connect inward/outward? stdio? HTTP? socket?
- Which allowlist/denylist governs it? Is an external process able to reach the
  network, and is that intended?
- Is the boundary **deny-by-default** or fail-open?

### A4. Note store correctness

- Does `note-store.js` persist notes per its documented contract (atomic write, lock,
  schema), or does it silently drop/block writes?
- Evidence needed: `data/notes.json` content vs the documented shape; the `.lock` file
  lifecycle; concurrent-write behaviour.

### A5. External tools & extensibility

- Does `external tools/tool.js` (UTCA) resolve tool paths correctly at runtime?
- Can a **new** tool be added without editing the dispatcher (register/discovery), or is
  every tool hard-wired?

### A6. Persona duplication (authority)

- Three places describe an agent: `PERSONAS.md`, `agent/<id>.js`, and the DB `agents`
  table (served via `/api/admin/agents`).
- Which is **authoritative** at runtime? Which is **extra**? Which should be derived?
- Rule: one source of truth; the others should be generated or removed.

### A7. Proposed `adapter/` (transport consolidation)

- Should gRPC / HTTP / HTTPS / SSE transports be consolidated under `adapter/` with a
  single `index` that falls back across them?
- Question: which of these are actually in use today? (Do not build transports nobody
  speaks: e.g. is gRPC spoken by any provider we talk to?)

### A8. Proposed `client/` (inbound client adapters)

- VS Code / OpenCode / JetBrains speak their own configs. Instead of mutating the core
  server, add a thin **client adapter** per editor that translates *their* documented
  shape to ours.
- Question: what do each editor's docs require (endpoint shape, auth, stream format,
  config file), and where is that already partially handled?
- Constraint: no bypass of the core; the adapter only translates.

### A9. OS boot, env, and port

- Do our configs actually load on every OS boot/run? What launches the server?
- If `PORT` (or `GATEWAY_PORT`) changes in the environment, what actually changes —
  bind, CORS origin, logs, client configs?
- Why would a Linux kernel "recognise" us / why would Windows permit us? (Answer:
  Windows has no kernel awareness of a userland Node server; the question is really
  about **bind address, firewall, autostart**.) Are we writing env vars / `.bashrc` /
  systemd/XDG autostart entries, or expecting the user to do it?

### A10. Session / buffer / transport capacity for tool calls

- When a provider can call functions (tools), how much room do our transports and
  session buffer reserve? Any cap that truncates tool arguments?
- Where is stream buffering done, and is there a max frame/line size?

### A11. CDP usage

- Is `cdp-pipe.js` / `Test/CDP/cdp-driver.js` using the Chrome DevTools Protocol
  correctly (target attach, sessionId, command framing), and is CDP a **supported**
  path or an experiment?

### A12. Persona quality vs industry skill

- Do the agent personas map to real industry competencies (e.g. security → OWASP,
  perf → profiling methodology), or are they flavour text?

### A13. Type safety via schema validation

- Provider payload validity currently lives in `provider/schema.json`. Can response
  **logic** (not just shape) be expressed as validation, so bad provider output is
  rejected at the boundary instead of deep in api.js?

### A14. Cross-cutting constraints (non-negotiable)

- No hidden watermark; no secret per-provider consent or favouritism.
- Never bypass a provider; use only what it freely offers.
- Never become dependent on a single provider.
- Small/free/local vs large/paid: no bias — model is only a response source; capability
  is DB-driven; when we cannot get the context window we need, we simply do not send.
- Evidence gate: the model may be wrong (it samples probabilities). Nothing is shown to
  the user as fact without verification behind it. Human sees one view, the OS/computer
  receives the other (a marker-based request the OS can execute).
- Locality is not a trust boundary: the model I talk to also "runs locally" on some
  machine; TLS verification for tool calling is about integrity, not locality.

---

## PART B — MACHINE VIEW (JSON)

```json
{
  "audit": "zvsl-system",
  "phase": 1,
  "backup": "/home/xubuntu/zvslast-BACKUP-<ts>",
  "type_safety_note": "This file's machine view is consumed by tooling; do not put prose logic here.",
  "questions": [
    {"id": "A1", "area": "inventory", "claim": "duplicate/superseded files exist and can be quarantined", "evidence": ["file:hash", "require-graph"], "status": "pending"},
    {"id": "A2", "area": "ollama-uds", "claim": "UDS is real and used headless (or nominal only)", "evidence": ["socketPath refs", "runtime socket probe"], "status": "pending"},
    {"id": "A3", "area": "mcp-boundary", "claim": "external MCP boundary is deny-by-default and safe", "evidence": ["spawn table", "servers.json", "log"], "status": "pending"},
    {"id": "A4", "area": "note-store", "claim": "notes persist per documented contract", "evidence": ["note-store.js", "data/notes.json", "lock lifecycle"], "status": "pending"},
    {"id": "A5", "area": "external-tools", "claim": "tools resolve by path and new tools are registrable", "evidence": ["tool.js dispatch", "servers.json"], "status": "pending"},
    {"id": "A6", "area": "persona-authority", "claim": "one authoritative persona source; others extra", "evidence": ["PERSONAS.md", "agent/*.js", "agents table"], "status": "pending"},
    {"id": "A7", "area": "adapter-transport", "claim": "only transports actually spoken should be consolidated", "evidence": ["provider/transport.js", "protocol usage"], "status": "pending"},
    {"id": "A8", "area": "client-adapters", "claim": "editor clients can be served by thin adapters, core untouched", "evidence": ["editor docs", ".missionbarisal/*.json"], "status": "pending"},
    {"id": "A9", "area": "os-boot-env", "claim": "configs load per run; port/env effects are bounded and documented", "evidence": ["start.js", ".env", "autostart"], "status": "pending"},
    {"id": "A10", "area": "session-buffer", "claim": "tool-call buffers have sufficient capacity; caps are explicit", "evidence": ["stream buffering code", "MAX_* consts"], "status": "pending"},
    {"id": "A11", "area": "cdp", "claim": "CDP is used correctly and/or marked experimental", "evidence": ["cdp-pipe.js", "Test/CDP"], "status": "pending"},
    {"id": "A12", "area": "persona-quality", "claim": "personas map to real industry competencies", "evidence": ["agent/*.js text"], "status": "pending"},
    {"id": "A13", "area": "schema-validation", "claim": "response logic can be enforced at the schema boundary", "evidence": ["provider/schema.json", "normalizer"], "status": "pending"},
    {"id": "A14", "area": "constraints", "claim": "no watermark, no provider bias, no bypass, evidence-gated output", "evidence": ["grep watermark/bypass", "provider config"], "status": "pending"}
  ],
  "deliverables": {
    "human": "docs/audit/AUDIT-QUESTIONS.md (this file, Part A)",
    "machine": "docs/audit/AUDIT-QUESTIONS.json",
    "quarantine_dir": "unnecessary/",
    "proposed_dirs": ["adapter/", "client/"]
  }
}
```

---

## PART C — VERDICTS (evidence-based, `docs/audit/AUDIT-QUESTIONS.json` carries the machine view)

| # | Area | Verdict | Evidence |
|---|------|---------|----------|
| A1 | inventory | **Quarantined.** 39 files moved to `unnecessary/` (0api.js, api.js.bak, zombie-gateway.js, old_local-llm-bridge.js, registry.db, registry.seed.json, 4 health-check jsons, 3 `.bak`, legacy `Test/`). Never deleted; manifest kept. Server healthy after move. | require-graph; `ps`; `GET /health` |
| A2 | ollama-uds | **Inbound UDS real + headless** (`/tmp/zombiecoder/mcp.sock`, net.createServer, chmod 0660, stale-socket unlink). **Outbound UDS supported but unused** — only custom providers via `CUSTOM_PROVIDER_N_SOCKET`; Ollama itself is TCP `127.0.0.1:11434`. | api.js:16342-16419; api.js:936; local-llm-bridge.js:107 |
| A3 | mcp-boundary | **Safe today by config** (only 3 loopback servers; EXTERNAL_MCP_URLS unset; php-broker/appsp loopback). **Gap:** mcp-client has no host allowlist — closed by config, not code. Add deny-by-default allowlist before enabling remote MCP. | external mcp/servers.json; mcp-client.js:72 |
| A4 | note-store | **Correct, not blocking.** tmp+rename atomic write, 3-level rotation, pid-liveness lock + 30s stale self-heal, optional encryption, debounced flush. Lock owned by live PID at audit. | note-store.js:140-210; lock pid 38645 |
| A5 | external-tools | **Yes, path-based + registrable.** `provider/tools.js` = register (36 tools, DB capability gate, no hardcoded model names); servers.json = descriptor table read by api.js; tool.js = pure converter library only. New tool = new servers.json entry + module file. | provider/tools.js; api.js:9766; tool.js exports |
| A6 | persona-authority | **DB (agents table) is the runtime authority**, seeded once from PERSONAS.md; agent/*.js are versioned code defaults; PERSONAS.md is seed+doc. Real duplication; ideal = agent/*.js source → DB runtime → generated md. | agent/index.js priority header; seedAgentsFromPersonas |
| A7 | adapter/ | **Do NOT create.** transport consolidation already exists (`provider/transport.js`: https/h2+h1-fallback, http, UDS). gRPC spoken nowhere (0 refs) — building it would be invention with no caller. | provider/transport.js:14-58 |
| A8 | client/ | **Do NOT create (as code).** The client layer exists: `.missionbarisal/*.json` (endpoint/transport per editor) + server already exposes `/v1/models`, `/v1/chat/completions`, `/api/v0/models`, MCP. Missing = per-editor docs, not code. | .missionbarisal/*; api.js:12485/12515/13786 |
| A9 | os-boot/env | **Nothing auto-boots.** No .bashrc/.profile, no XDG autostart, no systemd, no crontab. Manual `node start.js --start-all`. `PORT` env → api.js PORT → principled bind (loopback→127.0.0.1). Editor configs rewritten on next start. We intentionally do not pollute .bashrc. | ~/.zombiecoder/config.json; api.js:16450-16467 |
| A10 | session-buffer | **Count-capped, byte-unbounded.** Tools: 25 global / 5 local / 15 remote; MAX_HISTORY 10; MAX_RECENT_CONTEXT 20. Stream bodies accumulate without byte cap; tool-call argument size uncapped (risk flag). | api.js:3639/14535/166; transport.js:70/178 |
| A11 | cdp | **Correct.** Zero-HTTP CDP over `--remote-debugging-pipe` (fd3/fd4, `\0` framing both ways); used by MCP `browse_cdp`; passed security suite. | cdp-pipe.js:87/125 |
| A12 | persona-quality | **Pass.** Concrete competencies + evidence-first rules (OWASP/CVE for security, profiling/benchmark-gating for perf). Note: display-name strings are Bengali by design (user-facing tone per constitution); identifiers/comments English. | agent/security-hero.js; agent/perf-wizard.js |
| A13 | schema-validation | **Shape→schema possible, logic→code.** provider/schema.json is unused at runtime today; shape validation lives in normalizer code. JSON Schema can enforce shape at the boundary, not fallback/cooldown/capability logic. Recommended: wire schema.json as reject-at-boundary validator; keep logic imperative. | grep schema.json (no runtime hits) |
| A14 | constraints | **Clean.** No watermark/bypass; provider configs symmetric; OpenCode headers isolated in adapter; no hardcoded model names; no per-provider consent. | isLocalAgent (no regex); provider/opencode.js |

### Decision made (join-only rule)

- `adapter/` **not created** — `provider/transport.js` already is the transport layer; gRPC has zero callers. A future gRPC provider gets ONE adapter file in `provider/`, reusing the proven pattern.
- `client/` **not created** — `.missionbarisal/*.json` + the OpenAI-compatible/MCP surface already serve VS Code, JetBrains and OpenCode per their docs. The gap is per-editor documentation, not code.

## Next actions (remaining)

1. (User) rotate exposed credentials (OpenCode `oc_sk_…`, stale Groq key) — unchanged from prior audit.
2. (Optional) add a deny-by-default host allowlist to `mcp-client.js` before any remote MCP is enabled.
3. (Optional) wire `provider/schema.json` as a reject-at-boundary validator per dialect.
4. (Optional) cap stream-buffer byte size (single `MAX_FRAME_BYTES` in `provider/transport.js`).
