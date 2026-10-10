#!/usr/bin/env node
// =============================================================================
// TEST: Developer-Documentation findings — regression guards
//       (ZombieCoder Developer Documentation.md-এর ছয়টা ফাইন্ডিংয়ের গার্ড)
//
// ফিক্স করা হলো:
//   1. api.js — external tool connector-এ `JSON.parse(_d)` (undefined) →
//      `JSON.parse(data)` — external tool প্রোক্সি কখনো JSON পার্স হতো না,
//      সবসময় catch-এ পড়ে raw text ফেরত দিত।
//   2. api.js — `readBody`-এর কোনো সাইজ সীমা ছিল না (resource exhaustion) →
//      এখন `MAX_BODY_SIZE` (ডিফল্ট 10 MiB, env-চালিত) ক্যাপ + main handler-এ
//      pre-flight Content-Length 413 guard।
//   3. bridge — CORS ছিল `Access-Control-Allow-Origin: *` → এখন
//      `BRIDGE_ALLOWED_ORIGINS` (ডিফল্ট: শুধু loopback origin)।
//   4. bridge — Unix socket chmod ছিল `0o777` → এখন `CFG.socketMode`
//      (ডিফল্ট 0o600, `BRIDGE_SOCKET_MODE` env-চালিত)।
//   5. AGENT_FS_SCOPE ডিফল্ট `unrestricted` — ইচ্ছাকৃত ডিজাইন; এনভ-নব হিসেবে
//      `.env.example`-এ ডকুমেন্টেড (আচরণ অপরিবর্তিত)।
//   6. Extension manifest repository URL — আগেই `zombiecoder-editor`-এ ফিক্স।
//
// পদ্ধতি (evidence-based, এই রিপোর কনভেনশন অনুযায়ী): static source assert
// (api.js ও local-llm-bridge.js দুটোই require-সেফ নয় — সার্ভার স্টার্ট করে)।
//
// চলার পদ্ধতি:  node tests/devex-doc-findings.test.js
// শেষে exit code 0 = সব assertion pass।
// =============================================================================
const fs = require("fs");
const path = require("path");

let pass = 0, fail = 0;
const rows = [];
function assert(name, cond, detail) {
  if (cond) { pass++; rows.push(["PASS", name, detail || ""]); }
  else { fail++; rows.push(["FAIL", name, detail || ""]); }
}

// ═══════════════════════════════════════════════════════════════════════════
// PART A — api.js: undefined-ভেরিয়েবল বাগ + readBody সীমা
// ═══════════════════════════════════════════════════════════════════════════
const API = path.resolve(__dirname, "..", "api.js");
const BRIDGE = path.resolve(__dirname, "..", "local-llm-bridge.js");
const api = fs.readFileSync(API, "utf8");
const bridge = fs.readFileSync(BRIDGE, "utf8");

// A1–A2. `_d` আর নেই — external tool connector এখন collection buffer `data` পার্স করে
assert(
  "A1  JSON.parse(_d) undefined-ভেরিয়েবল বাগ নির্মূল",
  !/JSON\.parse\(_d\)/.test(api),
  "`_d` was never defined anywhere in api.js — bug gone"
);
assert(
  "A2  external tool connector এখন JSON.parse(data)",
  /JSON\.parse\(data\)/.test(api),
  "parses the actual collected buffer"
);

// B1–B4. readBody ক্যাপ + Content-Length pre-flight guard
assert(
  "B1  MAX_BODY_SIZE env-চালিত ডিফল্ট 10 MiB",
  /process\.env\.MAX_BODY_SIZE \|\| String\(10 \* 1024 \* 1024\)/.test(api),
  "configurable cap, 10 MiB default"
);
assert(
  "B2  readBody-তে tooLarge ট্র্যাকিং + maxBytes ক্যাপ",
  /let tooLarge = false;[\s\S]{0,200}size > maxBytes/.test(api),
  "stream stops buffering past the cap"
);
assert(
  "B3  oversized body consume-&-discard (হ্যাং নয়) → '' রিটার্ন",
  /tooLarge \? "" : Buffer\.concat\(chunks\)\.toString\(\)/.test(api),
  "backpressure-safe; route responds 4xx, never hangs"
);
assert(
  "B4  pre-flight Content-Length 413 guard (main handler)",
  /content-length[\s\S]{0,150}Number\.isFinite\(declaredLen\)[\s\S]{0,120}413/.test(api),
  "known-size oversize rejected before any body read"
);

// ═══════════════════════════════════════════════════════════════════════════
// PART C — local-llm-bridge.js: CORS + socket mode hardening
// ═══════════════════════════════════════════════════════════════════════════
assert(
  "C1  allowedOrigin() whitelist helper আছে",
  /function allowedOrigin\(req\)/.test(bridge),
  "origin allow-list logic"
);
assert(
  "C2  BRIDGE_ALLOWED_ORIGINS env সম্মানিত ('*' = পুরনো আচরণ)",
  /BRIDGE_ALLOWED_ORIGINS/.test(bridge),
  "comma-list or explicit '*' restore"
);
assert(
  "C3  ডিফল্টে শুধু loopback origin প্রতিফলিত হয়",
  bridge.includes("\\[::1\\]") && /isLoopback/.test(bridge),
  "localhost / 127.0.0.1 / [::1] only when env empty"
);
assert(
  "C4  হার্ডকোডেড wildcard ACAO আর নেই",
  !/"Access-Control-Allow-Origin", "\*"/.test(bridge) &&
    !/"Access-Control-Allow-Origin": "\*"/.test(bridge),
  "ACAO comes from allowedOrigin() only, never a literal '*'"
);
assert(
  "D1  BRIDGE_SOCKET_MODE env-চালিত (ডিফল্ট 600)",
  /BRIDGE_SOCKET_MODE \|\| "600"/.test(bridge),
  "octal string parsed via parseInt(..., 8)"
);
assert(
  "D2  chmod এখন কনফিগার্ড মোড (0o777 নেই)",
  !/0o777/.test(bridge) && /fs\.chmodSync\(CFG\.socket, CFG\.socketMode\)/.test(bridge),
  "least-privilege owner-rw default"
);
assert(
  "E1  bridge-এর নিজস্ব readBody ক্যাপ অপরিবর্তিত (8 MiB)",
  /readBody\(req, max = 8 \* 1024 \* 1024\)/.test(bridge),
  "bridge body limit was already bounded — untouched"
);

// ═══════════════════════════════════════════════════════════════════════════
// ফলাফল
// ═══════════════════════════════════════════════════════════════════════════
console.log("\n" + "=".repeat(72));
for (const [status, name, detail] of rows) {
  console.log("  " + status.padEnd(4) + " | " + name + (detail ? "  —  " + detail : ""));
}
console.log("=".repeat(72));
console.log(`RESULT: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);